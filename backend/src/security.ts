export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const now = () => Math.floor(Date.now() / 1000);
export const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
export const token = () => hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
export const digest = async (value: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
export function safeEqual(left: string, right: string) {
  const a = new TextEncoder().encode(left), b = new TextEncoder().encode(right);
  return a.length === b.length && crypto.subtle.timingSafeEqual(a, b);
}
export function guardOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin || request.headers.get("Sec-Fetch-Site") === "cross-site") {
    throw new HttpError(403, "origin_denied", "Open the editor on this website and try again.");
  }
}
export async function readJson(request: Request, maxBytes = 262144): Promise<Record<string, unknown>> {
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) throw new HttpError(415, "json_required", "Send JSON content.");
  if (Number(request.headers.get("Content-Length") || 0) > maxBytes) throw new HttpError(413, "body_too_large", "This edit is too large.");
  if (!request.body) throw new HttpError(400, "body_required", "Request content is missing.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) { const {done,value} = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new HttpError(413, "body_too_large", "This edit is too large."); } chunks.push(value); }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch { throw new HttpError(400, "invalid_json", "Request content is not valid JSON."); }
}
export async function rateLimit(env: Env, request: Request, group: string, limit: number, seconds: number, actor = "") {
  const time = now();
  const key = await digest(`${group}:${actor || request.headers.get("CF-Connecting-IP") || "local"}`);
  const row = await env.DB.prepare(`INSERT INTO cms_rate_limits(key,count,expires_at) VALUES (?,1,?)
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END,
    expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING count`).bind(key,time+seconds,time,time).first<{count:number}>();
  if (!row || row.count > limit) throw new HttpError(429, "rate_limited", "Too many attempts. Wait a few minutes and try again.");
}
export const json = (body: unknown, status = 200, extra: HeadersInit = {}) => Response.json(body, {status, headers:{"Cache-Control":"no-store", "X-Content-Type-Options":"nosniff", ...extra}});
