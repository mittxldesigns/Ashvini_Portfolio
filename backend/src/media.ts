import { getSession } from "./auth";
import { HttpError, json, now, readJson } from "./security";

const IMAGE_LIMIT = 30 * 1024 * 1024;
const VIDEO_LIMIT = 80 * 1024 * 1024;
const PREVIEW_LIMIT = 2 * 1024 * 1024;
const IMAGES = ["image/jpeg","image/png","image/webp","image/avif","image/gif"];
const VIDEOS = ["video/mp4","video/webm","video/quicktime"];
type Media = {id:string;filename:string;mime:string;size:number;preview_mime:string;preview_size:number;original_uploaded:number;preview_uploaded:number;is_published:number};
const bytesMatch = (bytes: Uint8Array, expected: number[], at = 0) => expected.every((value,i) => bytes[at+i] === value);
const textAt = (bytes: Uint8Array, text: string, at = 0) => [...text].every((value,i) => bytes[at+i] === value.charCodeAt(0));
export function magicMatches(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return bytesMatch(bytes,[255,216,255]);
  if (mime === "image/png") return bytesMatch(bytes,[137,80,78,71,13,10,26,10]);
  if (mime === "image/webp") return textAt(bytes,"RIFF") && textAt(bytes,"WEBP",8);
  if (mime === "image/gif") return textAt(bytes,"GIF87a") || textAt(bytes,"GIF89a");
  if (mime === "image/avif") return textAt(bytes,"ftyp",4) && ["avif","avis"].some((brand) => textAt(bytes,brand,8));
  if (mime === "video/webm") return bytesMatch(bytes,[26,69,223,163]);
  if (mime === "video/mp4" || mime === "video/quicktime") return textAt(bytes,"ftyp",4) && !["avif","avis","heic","heix","mif1"].some((brand) => textAt(bytes,brand,8));
  return false;
}
export async function createMedia(env: Env, request: Request) {
  const body = await readJson(request,4096);
  const {filename,mime,size,previewMime,previewSize} = body;
  if (typeof filename !== "string" || !filename.trim() || filename.length > 180 || /[\u0000-\u001f]/.test(filename)) throw new HttpError(422,"filename_invalid","Choose a file with a valid name.");
  if (typeof mime !== "string" || ![...IMAGES,...VIDEOS].includes(mime)) throw new HttpError(415,"media_type_invalid","Upload JPEG, PNG, WebP, AVIF, GIF, MP4, MOV or WebM.");
  const max = VIDEOS.includes(mime) ? VIDEO_LIMIT : IMAGE_LIMIT;
  if (!Number.isSafeInteger(size) || Number(size) < 16 || Number(size) > max) throw new HttpError(413,"media_too_large",`The original must be smaller than ${max / 1024 / 1024} MB.`);
  if (!["image/jpeg","image/webp"].includes(String(previewMime)) || !Number.isSafeInteger(previewSize) || Number(previewSize) < 16 || Number(previewSize) > PREVIEW_LIMIT) throw new HttpError(422,"preview_invalid","Create a JPEG or WebP preview smaller than 2 MB.");
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO cms_media(id,filename,mime,size,preview_mime,preview_size,created_at) VALUES (?,?,?,?,?,?,?)`).bind(id,filename,mime,size,previewMime,previewSize,now()).run();
  return json({id,original:`/media/${id}/original`,preview:`/media/${id}/preview`,mime,size},201);
}
export async function uploadMedia(env: Env, request: Request, id: string, variant: string) {
  const row = await env.DB.prepare(`SELECT * FROM cms_media WHERE id=?`).bind(id).first<Media>();
  if (!row || !["original","preview"].includes(variant)) throw new HttpError(404,"media_missing","That upload was not found.");
  const original = variant === "original", mime = original ? row.mime : row.preview_mime, size = original ? row.size : row.preview_size;
  if ((original ? row.original_uploaded : row.preview_uploaded) === 1) throw new HttpError(409,"media_exists","This file is already uploaded. Start a new upload to replace it.");
  if (request.headers.get("Content-Type")?.split(";")[0] !== mime) throw new HttpError(415,"media_type_mismatch","The file type does not match the upload.");
  if (Number(request.headers.get("Content-Length")) !== size) throw new HttpError(413,"media_size_mismatch","The file size does not match the upload.");
  if (!request.body) throw new HttpError(400,"media_body_missing","The file is empty.");
  // Claim once before receiving bytes, including concurrent/retried requests.
  const column = original ? "original_uploaded" : "preview_uploaded";
  const started = now();
  const claim = await env.DB.prepare(`UPDATE cms_media SET ${column}=? WHERE id=? AND (${column}=0 OR (${column}<0 AND ${column}>?))`).bind(-started,id,-(started-900)).run();
  if (!claim.meta.changes) throw new HttpError(409,"media_uploading","This file is already being uploaded.");
  const reader = request.body.getReader();
  let writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
  try {
    const prefix: Uint8Array[] = []; let prefixSize = 0;
    while (prefixSize < 16) { const part = await reader.read(); if (part.done) break; prefix.push(part.value); prefixSize += part.value.byteLength; if (prefixSize > size) throw new HttpError(413,"media_size_mismatch","The file is larger than declared."); }
    const head = new Uint8Array(Math.min(prefixSize,32)); let headOffset = 0;
    for (const part of prefix) { const take = Math.min(part.byteLength,head.length-headOffset); if (take > 0) head.set(part.subarray(0,take),headOffset); headOffset += take; }
    if (!magicMatches(head,mime)) throw new HttpError(415,"media_signature_invalid","This file does not match its image or video type.");
    const stream = new FixedLengthStream(size);
    writer = stream.writable.getWriter();
    const output = writer;
    const pump = async () => {
      let count = prefixSize;
      try {
        for (const part of prefix) await output.write(part);
        while (true) { const part = await reader.read(); if (part.done) break; count += part.value.byteLength; if (count > size) throw new HttpError(413,"media_size_mismatch","The file is larger than declared."); await output.write(part.value); }
        if (count !== size) throw new HttpError(413,"media_size_mismatch","The upload ended before the whole file arrived.");
        await output.close();
      } catch (error) { await output.abort(error); throw error; }
    };
    await Promise.all([env.MEDIA.put(`${id}/${variant}`,stream.readable,{httpMetadata:{contentType:mime,cacheControl:"public, max-age=31536000, immutable"},customMetadata:{filename:row.filename}}),pump()]);
    await env.DB.prepare(`UPDATE cms_media SET ${column}=1 WHERE id=? AND ${column}=?`).bind(id,-started).run();
    return json({id,variant,uploaded:true});
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    if (writer) await writer.abort().catch(() => undefined);
    await env.DB.prepare(`UPDATE cms_media SET ${column}=0 WHERE id=? AND ${column}=?`).bind(id,-started).run();
    if (error instanceof HttpError) throw error;
    throw new HttpError(502,"upload_failed","The upload could not be completed. Try uploading this file again.");
  } finally { reader.releaseLock(); }
}
export async function serveMedia(env: Env, request: Request, id: string, variant: string) {
  const row = await env.DB.prepare(`SELECT * FROM cms_media WHERE id=?`).bind(id).first<Media>();
  if (!row || (variant === "original" ? row.original_uploaded : row.preview_uploaded) !== 1) throw new HttpError(404,"media_missing","This file was not found.");
  const isPublic = Boolean(row.is_published);
  if (!isPublic && !await getSession(env,request)) throw new HttpError(404,"media_missing","This file was not found.");
  const range = request.headers.get("Range");
  const object = await env.MEDIA.get(`${id}/${variant}`,range ? {range:request.headers} : {});
  if (!object) throw new HttpError(404,"media_missing","This file was not found.");
  const headers = new Headers({"Content-Type":variant === "original" ? row.mime : row.preview_mime,"X-Content-Type-Options":"nosniff","Accept-Ranges":"bytes","Cache-Control":isPublic ? "public, max-age=31536000, immutable" : "private, no-store","ETag":object.httpEtag});
  if (request.headers.get("If-None-Match") === object.httpEtag && !range) return new Response(null,{status:304,headers});
  let status = 200;
  if (range && object.range && "offset" in object.range && "length" in object.range) { const offset = object.range.offset || 0, length = object.range.length || 0; headers.set("Content-Range",`bytes ${offset}-${offset+length-1}/${object.size}`); headers.set("Content-Length",String(length)); status = 206; }
  else headers.set("Content-Length",String(object.size));
  return new Response(request.method === "HEAD" ? null : object.body,{status,headers});
}
