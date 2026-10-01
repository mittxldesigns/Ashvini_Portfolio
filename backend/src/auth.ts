import { digest, guardOrigin, HttpError, json, now, rateLimit, readJson, safeEqual, token } from "./security";
import { scrypt } from "node:crypto";

const COOKIE = "__Host-ashvini-cms";
const SESSION_AGE = 60 * 60 * 24 * 7;
// OWASP's 32 MiB scrypt profile: N=2^15, r=8, p=3.
const SCRYPT_N = 32768, SCRYPT_R = 8, SCRYPT_P = 3;
type Account = {id:number;email:string;password_hash:string};
export type Session = {token_hash:string;csrf_token:string;email:string;expires_at:number};
export type SecretEnv = Env & {BOOTSTRAP_TOKEN_HASH?:string;BOOTSTRAP_EXPIRES_AT?:string};

function cookie(value: string, maxAge = SESSION_AGE) {
  return `${COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}
function sessionToken(request: Request) {
  return (request.headers.get("Cookie") || "").split(";").map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
}
async function passwordDigest(password: string, salt: string) {
  try {
    const bits = await new Promise<Uint8Array>((resolve,reject) => scrypt(password,salt,32,{N:SCRYPT_N,r:SCRYPT_R,p:SCRYPT_P,maxmem:64*1024*1024},(error,value) => error ? reject(error) : resolve(value)));
    return [...bits].map((b) => b.toString(16).padStart(2,"0")).join("");
  } catch (error) {
    void error;
    throw new HttpError(503,"kdf_unavailable","Secure password verification is unavailable on this runtime. Contact the site administrator.");
  }
}
export async function hashPassword(password: string) {
  const salt = token();
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${await passwordDigest(password,salt)}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [algorithm,n,r,p,salt,expected] = stored.split("$");
  if (algorithm !== "scrypt" || Number(n) !== SCRYPT_N || Number(r) !== SCRYPT_R || Number(p) !== SCRYPT_P || !/^[a-f0-9]{64}$/.test(salt || "") || !/^[a-f0-9]{64}$/.test(expected || "")) return false;
  return safeEqual(await passwordDigest(password,salt),expected);
}
function credentials(body: Record<string,unknown>, strong = false) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || password.length > 128) throw new HttpError(400,"credentials_invalid","Enter your email and password (up to 128 characters).");
  if (strong && password.length < 12) throw new HttpError(400,"password_short","Choose a password with at least 12 characters.");
  return {email,password};
}
export async function getSession(env: Env, request: Request): Promise<Session | null> {
  const raw = sessionToken(request);
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return null;
  return env.DB.prepare(`SELECT s.token_hash,s.csrf_token,s.expires_at,a.email FROM cms_sessions s JOIN cms_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>? AND a.email=?`).bind(await digest(raw),now(),env.OWNER_EMAIL).first<Session>();
}
export async function requireSession(env: Env, request: Request, mutate = true) {
  const session = await getSession(env,request);
  if (!session) throw new HttpError(401,"session_required","Sign in to edit your portfolio.");
  if (mutate) {
    guardOrigin(request);
    if (!safeEqual(request.headers.get("X-CSRF-Token") || "",session.csrf_token)) throw new HttpError(403,"csrf_invalid","Refresh the editor and try again.");
  }
  return session;
}
async function startSession(env: Env, accountId: number) {
  const raw = token(), csrf = token(), time = now();
  await env.DB.prepare(`INSERT INTO cms_sessions(token_hash,account_id,csrf_token,expires_at,created_at) VALUES (?,?,?,?,?)`).bind(await digest(raw),accountId,csrf,time+SESSION_AGE,time).run();
  await env.DB.prepare(`DELETE FROM cms_sessions WHERE expires_at<=?`).bind(time).run();
  return json({authenticated:true,email:env.OWNER_EMAIL,csrfToken:csrf},200,{"Set-Cookie":cookie(raw)});
}
export async function authRoute(env: SecretEnv, request: Request, action: string) {
  if (action === "session" && request.method === "GET") {
    const session = await getSession(env,request);
    if (session) return json({authenticated:true,email:session.email,csrfToken:session.csrf_token});
    const initialized = Boolean(await env.DB.prepare(`SELECT id FROM cms_accounts WHERE id=1`).first());
    return json({authenticated:false,initialized});
  }
  if (action === "logout" && request.method === "POST") {
    const session = await requireSession(env,request);
    await env.DB.prepare(`DELETE FROM cms_sessions WHERE token_hash=?`).bind(session.token_hash).run();
    return json({authenticated:false},200,{"Set-Cookie":cookie("",0)});
  }
  if ((action === "login" || action === "setup") && request.method === "POST") {
    guardOrigin(request);
    await rateLimit(env,request,action,8,600);
    await rateLimit(env,request,`${action}-owner`,20,600,"owner");
    if (action === "setup") {
      if (!env.BOOTSTRAP_TOKEN_HASH || !/^[a-f0-9]{64}$/.test(env.BOOTSTRAP_TOKEN_HASH) || Number(env.BOOTSTRAP_EXPIRES_AT || 0) <= now()) throw new HttpError(403,"setup_disabled","First-password setup is not enabled or the setup link has expired.");
      const bearer = request.headers.get("X-Setup-Token") || "";
      if (!/^[a-f0-9]{64}$/.test(bearer) || !safeEqual(await digest(bearer),env.BOOTSTRAP_TOKEN_HASH)) throw new HttpError(403,"setup_denied","The setup link is invalid or expired.");
      if (await env.DB.prepare(`SELECT id FROM cms_accounts WHERE id=1`).first()) throw new HttpError(409,"already_initialized","Your password is already set. Sign in instead.");
      const {email,password} = credentials(await readJson(request,4096),true);
      if (!safeEqual(email,env.OWNER_EMAIL.toLowerCase())) throw new HttpError(403,"owner_only","Only the portfolio owner's email can create this account.");
      const hash = await hashPassword(password);
      try { await env.DB.prepare(`INSERT INTO cms_accounts(id,email,password_hash,created_at) VALUES (1,?,?,?)`).bind(email,hash,now()).run(); }
      catch { throw new HttpError(409,"already_initialized","Your password is already set. Sign in instead."); }
      return startSession(env,1);
    }
    const {email,password} = credentials(await readJson(request,4096));
    const account = await env.DB.prepare(`SELECT id,email,password_hash FROM cms_accounts WHERE id=1`).first<Account>();
    // Native scrypt also runs for invalid emails and an uninitialized account.
    const dummy = `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${"0".repeat(64)}$${"0".repeat(64)}`;
    const valid = await verifyPassword(password,account?.password_hash || dummy);
    if (!account || !valid || !safeEqual(email,account.email)) throw new HttpError(401,"credentials_rejected","Email or password is incorrect.");
    return startSession(env,account.id);
  }
  throw new HttpError(404,"not_found","This endpoint does not exist.");
}
