import { normalizeGalleryMedia } from "../../src/lib/galleryMedia.js";
import { HttpError, json, now, readJson } from "./security";

export type Value = string | number | boolean | null | Value[] | {[key:string]:Value};
export type RecordValue = {[key:string]:Value};
export type Content = {schemaVersion:1;revision:number;profile:RecordValue;projects:RecordValue[];editorial:RecordValue[];sketches:RecordValue[]};
type State = {draft_revision:number;draft_json:string;published_revision:number|null;published_json:string|null;updated_at:number};
const PAGE_COPY = ["editorialTitle","editorialIntro","editorialYearsLabel","editorialPubsTitle","editorialPubsNote","editorialClosingNote","sketchesKicker","sketchesIntro","sketchesClosingNote"];
const PROFILE_FIELDS = new Set(["name","avatarUrl","location","rating","tagline","homeDescription","homeCred","aboutTitle","aboutBio","skills","experience","faq","publishers","contraUrl","instagramUrl","linkedinUrl","splineUrl","seo","homeHeroProjectId","audienceChecked","audienceLabel","combinedFollowers","caseStudies","editorialCategories","sketchChapters","sketchTimeline",...PAGE_COPY]);
const ITEM_FIELDS = new Set(["id","slug","title","description","note","category","chapter","client","date","dateISO","dateLabel","year","medium","platform","order","highlight","nsfw","contentWarning","sourceMediaType","videoStatus","carouselCount","carouselStatus","availableFrameCount","minimumSourceFrameCount","mediaNote","url","sources","sourceUrls","frames","width","height","mediaType","thumbWebp","thumbAvif","heroWebp","heroAvif","full","poster","video","src","roles","tools","outcome","externalLink","extraLinks","contraUrl","splineScene","blocks","mediaId"]);
const URL_FIELDS = new Set(["avatarUrl","url","sourceUrl","sourceUrls","src","asset","full","poster","video","thumbWebp","thumbAvif","heroWebp","heroAvif","externalLink","contraUrl","instagramUrl","linkedinUrl","splineUrl","splineScene"]);
const bad = (message: string): never => { throw new HttpError(422,"content_invalid",message); };
const optionalText = (value: Value | undefined, label: string) => { if (value !== undefined && value !== null && typeof value !== "string") bad(`${label} must be text.`); };
const stringList = (value: Value | undefined, label: string) => { if (value !== undefined && (!Array.isArray(value) || value.some((entry) => typeof entry !== "string"))) bad(`${label} must be a list of text entries.`); };
const realDate = (value: Value | undefined, label: string) => {
  if (value === undefined || value === null) return;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) || !Number.isFinite(Date.parse(value))) bad(`${label} must be an actual ISO date or left blank.`);
  const day = String(value).slice(0,10), parsed = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== day) bad(`${label} is not a valid calendar date.`);
};
const objectList = (value: Value | undefined, label: string): RecordValue[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((entry) => !entry || typeof entry !== "object" || Array.isArray(entry))) bad(`${label} must contain structured entries.`);
  return value as RecordValue[];
};
function object(value: unknown, label: string): Record<string,unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) bad(`${label} must be an object.`);
  return value as Record<string,unknown>;
}
export function safeUrl(value: string, local = true) {
  if (!value) return true;
  if (local && /^\/(assets|media)\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes("..")) return true;
  if (local && /^\/[a-zA-Z0-9_-]+\.(avif|webp|png|jpe?g)$/.test(value)) return true;
  try { const url = new URL(value); return ["http:","https:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}
function cleanValue(value: unknown, key: string, depth = 0): Value {
  if (depth > 7) bad("Content is nested too deeply.");
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") { if (!Number.isFinite(value) || Math.abs(value) > 10000000) bad(`Invalid number in ${key}.`); return value; }
  if (typeof value === "string") {
    if (value.length > 12000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) bad(`Text in ${key} is too long or contains invalid characters.`);
    if (URL_FIELDS.has(key) && !safeUrl(value)) bad(`Use a website URL or an uploaded media path for ${key}.`);
    return value;
  }
  if (Array.isArray(value)) { if (value.length > 300) bad(`Too many entries in ${key}.`); return value.map((item) => cleanValue(item,key,depth+1)); }
  const result: RecordValue = {};
  for (const [field,item] of Object.entries(object(value,key))) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(field) || /password|secret|token|html|email/i.test(field)) bad(`Field ${field} cannot be published.`);
    result[field] = cleanValue(item,field,depth+1);
  }
  return result;
}
export function validateContent(raw: unknown, options: {publishing?:boolean} = {}): Content {
  const value = object(raw,"Portfolio");
  if (value.schemaVersion !== 1) bad("Unsupported portfolio format.");
  const profile: RecordValue = {};
  for (const [key,item] of Object.entries(object(value.profile,"Profile"))) {
    if (!PROFILE_FIELDS.has(key)) bad(`Unknown profile field: ${key}.`);
    profile[key] = cleanValue(item,key);
  }
  for (const key of ["name","avatarUrl","location","rating","tagline","homeDescription","homeCred","aboutTitle","aboutBio","contraUrl","instagramUrl","linkedinUrl","splineUrl","audienceLabel","audienceChecked","combinedFollowers"]) optionalText(profile[key],key);
  for (const key of PAGE_COPY) optionalText(profile[key],key);
  stringList(profile.skills,"Skills");
  for (const key of ["experience","faq","publishers","caseStudies","editorialCategories","sketchChapters","sketchTimeline"]) {
    const rows = objectList(profile[key],key);
    for (const row of rows) {
      for (const [field,item] of Object.entries(row)) { if (field !== "stats") optionalText(item,`${key}.${field}`); }
      if (key === "publishers") for (const stat of objectList(row.stats,"Publisher statistics")) for (const [field,item] of Object.entries(stat)) optionalText(item,`Publisher statistics.${field}`);
    }
  }
  if (profile.homeHeroProjectId !== undefined && profile.homeHeroProjectId !== null && (!Number.isSafeInteger(profile.homeHeroProjectId) || Number(profile.homeHeroProjectId) < 1)) bad("Choose a valid 3D hero project ID.");
  if (profile.seo !== undefined) {
    const seo = object(profile.seo,"Search previews");
    for (const [page,entry] of Object.entries(seo)) { if (!["home","about","editorial","sketches"].includes(page)) bad("Unknown search preview page."); const fields = object(entry,"Search preview"); for (const [field,text] of Object.entries(fields)) { if (!["title","description"].includes(field) || typeof text !== "string") bad("Search previews contain a title and description."); } }
  }
  const categoryIds = (key: string) => {
    const ids = new Set<string>();
    for (const row of objectList(profile[key],key)) { if (typeof row.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(row.id) || ids.has(row.id) || typeof row.label !== "string" || !row.label.trim()) bad("Gallery categories and chapters need unique IDs and labels."); ids.add(String(row.id)); }
    return ids;
  };
  const editorialCategories = categoryIds("editorialCategories"), sketchChapters = categoryIds("sketchChapters");
  const list = (name: "projects" | "editorial" | "sketches") => {
    if (!Array.isArray(value[name]) || value[name].length > 300) bad(`${name} must contain at most 300 entries.`);
    const seen = new Set<string>(), ids = new Set<number>();
    return (value[name] as unknown[]).map((rawItem,index) => {
      const item = object(rawItem,`${name} entry`), result: RecordValue = {};
      for (const [key,field] of Object.entries(item)) { if (!ITEM_FIELDS.has(key)) bad(`Unknown ${name} field: ${key}.`); result[key] = cleanValue(field,key); }
      if (typeof result.slug !== "string" || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(result.slug) || seen.has(result.slug)) bad(`${name} entries need unique slugs using lowercase letters, numbers and hyphens.`);
      seen.add(String(result.slug));
      if (name === "projects") {
        if (!Number.isSafeInteger(result.id) || Number(result.id) < 1 || ids.has(Number(result.id))) bad("3D projects need unique positive numeric IDs.");
        ids.add(Number(result.id));
      }
      if (typeof result.title !== "string" || !result.title.trim()) bad(`Entry ${result.slug} needs a title.`);
      if (typeof result.nsfw !== "boolean") bad(`Choose the sensitive-content setting for ${result.slug}.`);
      if (name === "editorial" && !editorialCategories.has(String(result.category))) bad(`Choose a defined editorial category for ${result.slug}.`);
      if (name === "sketches" && !sketchChapters.has(String(result.chapter))) bad(`Choose a defined sketchbook chapter for ${result.slug}.`);
      for (const key of ["description","note","category","chapter","client","date","dateLabel","medium","platform","contentWarning","sourceMediaType","videoStatus","carouselStatus","mediaNote","outcome"]) optionalText(result[key],`${result.slug}.${key}`);
      stringList(result.roles,"Project roles"); stringList(result.tools,"Project tools"); stringList(result.sourceUrls,"Source URLs");
      realDate(result.dateISO,`${result.slug} date`);
      for (const key of URL_FIELDS) if (key !== "sourceUrls") optionalText(result[key],`${result.slug}.${key}`);
      for (const key of ["availableFrameCount","minimumSourceFrameCount"]) if (result[key] !== undefined && (!Number.isSafeInteger(result[key]) || Number(result[key]) < 0)) bad(`${key} must be a non-negative whole number.`);
      if (result.highlight !== undefined && typeof result.highlight !== "boolean") bad("Highlight must be selected or unselected.");
      if (result.order !== undefined && (!Number.isSafeInteger(result.order) || Number(result.order) < 0)) bad("Display order must be a non-negative whole number.");
      for (const key of ["width","height","year","carouselCount"]) if (result[key] !== undefined && result[key] !== null && (!Number.isSafeInteger(result[key]) || Number(result[key]) < 1)) bad(`${key} must be a positive whole number.`);
      if (result.mediaType && !["image","video"].includes(String(result.mediaType))) bad("Choose image or video as the media type.");
      objectList(result.sources,"Source credits"); objectList(result.extraLinks,"Project links");
      const frames = objectList(result.frames,"Gallery frames");
      for (const frame of frames) {
        if (frame.nsfw !== undefined && typeof frame.nsfw !== "boolean") bad("Frame sensitivity must be selected or unselected.");
        if (frame.nsfw === true) result.nsfw = true;
        if (![frame.asset,frame.full,frame.src].some((path) => typeof path === "string" && path.trim())) bad("Every gallery frame needs an original media path.");
        if (typeof frame.asset === "string" && frame.asset.trim()) frame.full = frame.asset;
        if (frame.mediaType === "video" && typeof frame.full === "string") frame.video = frame.full;
        if (options.publishing && frame.mediaType === "video" && ![frame.thumbWebp, frame.thumbAvif, frame.poster].some((path) => typeof path === "string" && path.trim())) bad("Upload a thumbnail for every video before publishing.");
        for (const key of URL_FIELDS) if (key !== "sourceUrls") optionalText(frame[key],`Frame ${key}`);
        realDate(frame.dateISO,"Frame date");
        for (const key of ["width","height","position"]) if (frame[key] !== undefined && frame[key] !== null && (!Number.isSafeInteger(frame[key]) || Number(frame[key]) < (key === "position" ? 0 : 1))) bad(`Frame ${key} must be a valid whole number.`);
      }
      for (const frame of frames) if (frame.mediaType !== undefined && !["image", "video"].includes(String(frame.mediaType))) bad("Choose image or video for each gallery frame.");
      Object.assign(result, normalizeGalleryMedia(result, name === "projects"));
      const first = (result.frames as RecordValue[] | undefined)?.[0];
      const original = first?.full || result.full || result.heroWebp || result.heroAvif;
      const preview = first?.thumbWebp || first?.thumbAvif || first?.poster || result.thumbWebp || result.thumbAvif || result.poster;
      if (typeof original === "string" && original.trim()) result.full = original;
      if (typeof preview === "string" && preview.trim()) result.thumbWebp = preview;
      if (name === "projects" && first && typeof original === "string") result.heroWebp = first.mediaType === "video" ? preview : original;
      if (options.publishing && (!(typeof original === "string" && original.trim()) || !(typeof preview === "string" && preview.trim()))) bad(`Upload an original and a cover preview for ${result.slug} before publishing.`);
      for (const block of objectList(result.blocks,"Project content blocks")) {
        const kind = block.type || block.kind;
        if (typeof kind !== "string" || !["paragraph","heading","image","video","link","quote"].includes(kind)) bad("Choose a supported structured project block type.");
      }
      result.order = typeof result.order === "number" ? result.order : index;
      result.highlight = Boolean(result.highlight);
      return result;
    });
  };
  const content: Content = {schemaVersion:1,revision:0,profile,projects:list("projects"),editorial:list("editorial"),sketches:list("sketches")};
  if (options.publishing && (typeof profile.name !== "string" || !profile.name.trim())) bad("Enter your profile name before publishing.");
  if (options.publishing && content.projects.length === 0) bad("Keep at least one 3D project before publishing.");
  if (options.publishing && profile.homeHeroProjectId != null && !content.projects.some((project) => project.id === profile.homeHeroProjectId)) bad("Choose an existing 3D project for the home hero.");
  return content;
}
export const state = (env: Env) => env.DB.prepare(`SELECT * FROM cms_state WHERE id=1`).first<State>();
export async function published(env: Env): Promise<Content | null> {
  const row = await env.DB.prepare(`SELECT published_json,published_revision FROM cms_state WHERE id=1`).first<{published_json:string|null;published_revision:number|null}>();
  if (!row?.published_json) return null;
  return {...JSON.parse(row.published_json),revision:row.published_revision};
}
export function mediaIds(content: Content) {
  const ids = new Set<string>();
  const walk = (value: Value) => { if (typeof value === "string") { for (const match of value.matchAll(/\/media\/([a-f0-9-]{36})\/(?:original|preview)/g)) ids.add(match[1]); } else if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === "object") Object.values(value).forEach(walk); };
  walk(content.profile); content.projects.forEach(walk); content.editorial.forEach(walk); content.sketches.forEach(walk);
  return [...ids];
}
export async function contentRoute(env: Env, request: Request, action: string) {
  if (action === "content" && request.method === "GET") {
    const row = await state(env);
    const history = await env.DB.prepare(`SELECT revision,action,created_at,published_at FROM cms_revisions ORDER BY revision DESC LIMIT 30`).all();
    const media = await env.DB.prepare(`SELECT id,filename,mime,size,preview_mime,preview_size,original_uploaded,preview_uploaded,created_at FROM cms_media ORDER BY created_at DESC LIMIT 300`).all();
    return json({content:row ? {...JSON.parse(row.draft_json),revision:row.draft_revision} : null,revision:row?.draft_revision ?? 0,publishedRevision:row?.published_revision ?? null,history:history.results,media:media.results});
  }
  const body = await readJson(request,action === "content" && request.method === "PUT" ? 512 * 1024 : 8192);
  if (!Number.isSafeInteger(body.expectedRevision) || Number(body.expectedRevision) < 0) throw new HttpError(400,"revision_required","Refresh the editor before saving.");
  const expected = Number(body.expectedRevision), time = now();
  if ((action === "content" && request.method === "PUT") || (action === "rollback" && request.method === "POST")) {
    let raw = body.content;
    if (action === "rollback") {
      if (!Number.isSafeInteger(body.revision)) throw new HttpError(400,"revision_required","Choose a saved revision.");
      const previous = await env.DB.prepare(`SELECT content_json FROM cms_revisions WHERE revision=?`).bind(body.revision).first<{content_json:string}>();
      if (!previous) throw new HttpError(404,"revision_missing","That saved revision was not found.");
      raw = JSON.parse(previous.content_json);
    }
    const content = validateContent(raw), serialized = JSON.stringify(content), next = expected+1;
    const result = await env.DB.batch([
      env.DB.prepare(`UPDATE cms_state SET draft_revision=?,draft_json=?,updated_at=? WHERE id=1 AND draft_revision=?`).bind(next,serialized,time,expected),
      env.DB.prepare(`INSERT INTO cms_revisions(revision,content_json,action,created_at) SELECT ?,?,?,? WHERE changes()=1`).bind(next,serialized,action === "rollback" ? "rollback" : "save",time)
    ]);
    if (!result[0].meta.changes) throw new HttpError(409,"revision_conflict","Another editor tab saved changes. Reload this draft before saving again.");
    return json({content:{...content,revision:next},revision:next,createdAt:time});
  }
  if (action === "publish" && request.method === "POST") {
    const row = await state(env);
    if (!row || row.draft_revision !== expected) throw new HttpError(409,"revision_conflict","The draft changed. Reload before publishing.");
    const content = validateContent(JSON.parse(row.draft_json),{publishing:true}), ids = mediaIds(content);
    for (const id of ids) {
      const ready = await env.DB.prepare(`SELECT id FROM cms_media WHERE id=? AND original_uploaded=1 AND preview_uploaded=1`).bind(id).first();
      if (!ready) throw new HttpError(422,"media_incomplete","An upload has not finished. Upload its original and preview before publishing.");
    }
    const result = await env.DB.batch([
      env.DB.prepare(`UPDATE cms_state SET draft_json=?,published_json=?,published_revision=draft_revision,updated_at=? WHERE id=1 AND draft_revision=?`).bind(JSON.stringify(content),JSON.stringify(content),time,expected),
      env.DB.prepare(`UPDATE cms_revisions SET content_json=?,published_at=? WHERE revision=? AND EXISTS (SELECT 1 FROM cms_state WHERE id=1 AND draft_revision=? AND published_revision=?)`).bind(JSON.stringify(content),time,expected,expected,expected),
      env.DB.prepare(`UPDATE cms_media SET is_published=CASE WHEN id IN (SELECT value FROM json_each(?)) THEN 1 ELSE 0 END WHERE EXISTS (SELECT 1 FROM cms_state WHERE id=1 AND draft_revision=? AND published_revision=?)`).bind(JSON.stringify(ids),expected,expected)
    ]);
    if (!result[0].meta.changes) throw new HttpError(409,"revision_conflict","The draft changed. Reload before publishing.");
    return json({publishedRevision:expected,publishedAt:time});
  }
  throw new HttpError(404,"not_found","This endpoint does not exist.");
}
