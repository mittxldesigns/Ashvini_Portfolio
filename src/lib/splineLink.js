export function parseSplineLink(value) {
  if (value === null || value === undefined || value === "") return { valid: true, url: "", error: "" };
  let raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return typeof value === "string" ? { valid: true, url: "", error: "" } : { valid: false, url: "", error: "Paste the copied scene URL." };
  if (/<\/?[A-Za-z][^>]*>/.test(raw)) return { valid: false, url: "", error: "Copy the scene URL or Vanilla JS code from Export → Code. HTML embeds use a different format." };
  if (!raw.startsWith("https://")) {
    const links = raw.match(/https:\/\/prod\.spline\.design\/[A-Za-z0-9_-]+\/scene\.splinecode(?:\?[^\s"'`<>)]*)?/g) || [];
    if (links.length === 1 && /\bload\s*\(/.test(raw)) raw = links[0];
  }
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" && url.hostname === "prod.spline.design" && !url.port && !url.username && !url.password && !url.hash && /^\/[A-Za-z0-9_-]+\/scene\.splinecode$/.test(url.pathname)) {
      return { valid: true, url: url.href, error: "" };
    }
  } catch { /* A partial URL is kept in the field until the owner finishes pasting. */ }
  return { valid: false, url: "", error: "Copy the scene.splinecode URL from Spline’s Export → Code → Vanilla JS panel." };
}

export function defaultProjectView(project) {
  const scene = parseSplineLink(project?.splineScene);
  const coverType = project?.frames?.[0]?.mediaType || project?.mediaType;
  return scene.url && coverType !== "video" ? "interactive" : "media";
}

export async function verifySplineScene(value, { fetchImpl = globalThis.fetch, signal, timeoutMs = 8000 } = {}) {
  const parsed = parseSplineLink(value);
  if (!parsed.valid || !parsed.url) return { ok: false, error: parsed.error || "Paste a scene URL first." };
  if (signal?.aborted) return { ok: false, error: "Scene check cancelled." };
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  let reader;
  try {
    const response = await fetchImpl(parsed.url, {
      method: "GET", credentials: "omit", redirect: "error", cache: "no-store",
      referrerPolicy: "no-referrer", headers: { Range: "bytes=0-63" }, signal: controller.signal,
    });
    const actual = parseSplineLink(response.url || parsed.url);
    if (!response.ok || response.redirected || !actual.url) return { ok: false, error: "The scene file is unavailable. Generate the export again in Spline." };
    const mime = response.headers.get("content-type") || "";
    if (/text\/html|application\/xhtml|image\//i.test(mime)) return { ok: false, error: "This link returned a page or image. Copy the code-export scene URL." };
    if (!response.body) return { ok: false, error: "The scene file is empty. Generate the export again in Spline." };
    reader = response.body.getReader();
    if (reader) {
      const { value: bytes, done } = await reader.read();
      if (done || !bytes?.length) return { ok: false, error: "The scene file is empty. Generate the export again in Spline." };
      const prefix = new TextDecoder().decode(bytes.subarray(0, 64)).trim();
      if (/^<(?:!doctype|html|iframe|script)/i.test(prefix)) return { ok: false, error: "This link returned an HTML page. Copy the code-export scene URL." };
    }
    return { ok: true, url: parsed.url, message: "Scene file is reachable. Playback is checked when the project opens." };
  } catch {
    return { ok: false, error: controller.signal.aborted ? "The scene check stopped. Try again when you’re ready." : "The scene could not be checked. Check your connection and the copied URL." };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    try { reader?.cancel().catch(() => {}); } catch { /* Closing a probe must not hide its result. */ }
    controller.abort();
  }
}
