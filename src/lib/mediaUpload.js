const MIME_BY_EXTENSION = { mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", gif: "image/gif" };
const ALLOWED = new Set(Object.values(MIME_BY_EXTENSION));
export function uploadMime(file) {
  const provided = file.type?.toLowerCase();
  const mime = provided === "video/x-m4v" ? "video/mp4" : provided === "image/jpg" ? "image/jpeg" : provided;
  if (ALLOWED.has(mime)) return mime;
  if (!mime || mime === "application/octet-stream") {
    const extension = file.name?.split(".").pop()?.toLowerCase();
    if (MIME_BY_EXTENSION[extension]) return MIME_BY_EXTENSION[extension];
  }
  throw new Error("Choose an image, MP4, WebM or MOV file. MP4 with H.264 works best across phones and browsers.");
}
export function validateUpload(file) {
  const mime = uploadMime(file);
  const limit = (mime.startsWith("video/") ? 80 : 30) * 1024 * 1024;
  if (!file.size || file.size > limit) throw new Error(`Choose ${mime.startsWith("video/") ? "a video up to 80" : "an image up to 30"} MB.`);
  return mime;
}
function mediaEvent(element, event, action) {
  return new Promise((resolve, reject) => {
    const finish = (error) => { clearTimeout(timer); element.removeEventListener(event, ready); element.removeEventListener("error", failed); error ? reject(error) : resolve(); };
    const ready = () => finish();
    const failed = () => finish(new Error("This browser cannot preview this video. Export an H.264 MP4 or a WebM and try again."));
    const timer = setTimeout(() => finish(new Error("Video preview timed out. Export an H.264 MP4 and try again.")), 20000);
    element.addEventListener(event, ready, { once: true }); element.addEventListener("error", failed, { once: true });
    try { action(); } catch (error) { finish(error); }
  });
}
export async function previewBlob(file, mime = uploadMime(file)) {
  const url = URL.createObjectURL(file);
  let source;
  try {
    const canvas = document.createElement("canvas"), context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not create a preview.");
    let width, height;
    if (mime.startsWith("video/")) {
      source = document.createElement("video"); source.preload = "auto"; source.muted = true; source.playsInline = true;
      await mediaEvent(source, "loadeddata", () => { source.src = url; source.load(); });
      width = source.videoWidth; height = source.videoHeight;
      const position = Number.isFinite(source.duration) && source.duration > 0 ? Math.min(1, source.duration / 10) : 0;
      if (position > 0) await mediaEvent(source, "seeked", () => { source.currentTime = position; });
    } else {
      source = new Image(); source.src = url; await source.decode(); width = source.naturalWidth; height = source.naturalHeight;
    }
    if (!width || !height) throw new Error("The file has no usable image dimensions.");
    const scale = Math.min(1, 1000 / Math.max(width, height)); canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale));
    context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    if (!blob) throw new Error("The preview could not be created.");
    if (blob.size > 2 * 1024 * 1024) throw new Error("This preview is too large. Choose a smaller thumbnail image and try again.");
    return { blob, width, height };
  } finally {
    if (source?.tagName === "VIDEO") { source.pause(); source.removeAttribute("src"); source.load(); }
    URL.revokeObjectURL(url);
  }
}
