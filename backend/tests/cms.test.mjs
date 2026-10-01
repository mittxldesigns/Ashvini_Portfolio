import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { before, after, test } from "node:test";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

const origin = "https://cms.test";
const fixtureToken = "a".repeat(64);
const fixturePassword = "synthetic-test-password-only";
const seed = {schemaVersion:1,revision:0,profile:{name:"Test Owner",homeDescription:"Test portfolio"},projects:[{id:1,slug:"test-project",title:"Test project",nsfw:false,order:0,full:"/assets/fixture.webp",thumbWebp:"/assets/fixture-thumb.webp"}],editorial:[],sketches:[]};
let mf, db, cookie = "", csrf = "";
async function request(path,method = "GET",body,headers = {}) {
  const input = {method,headers:{...(method !== "GET" ? {Origin:origin} : {}),...(cookie ? {Cookie:cookie} : {}),...(csrf ? {"X-CSRF-Token":csrf} : {}),...(body !== undefined ? {"Content-Type":"application/json"} : {}),...headers}};
  if (body !== undefined) input.body = JSON.stringify(body);
  return mf.dispatchFetch(origin+path,input);
}
const jsonBody = async (response) => response.json();
before(async () => {
  mf = new Miniflare(convertV4MiniflareOptions({modules:true,compatibilityDate:"2026-10-01",compatibilityFlags:["nodejs_compat"],script:await readFile(new URL("../.build/index.js",import.meta.url),"utf8"),d1Databases:["DB"],r2Buckets:["MEDIA"],bindings:{OWNER_EMAIL:"owner@example.test",PAGES_ORIGIN:"https://pages.example.test",SITE_ORIGIN:origin,PROXY_ENABLED:"false",BOOTSTRAP_TOKEN_HASH:createHash("sha256").update(fixtureToken).digest("hex"),BOOTSTRAP_EXPIRES_AT:String(Math.floor(Date.now()/1000)+3600)}}));
  db = await mf.getD1Database("DB");
  const schema = (await readFile(new URL("../migrations/0001_owner_cms.sql",import.meta.url),"utf8")).replace(/^--.*$/gm,"");
  await db.batch(schema.split(";").filter((sql) => sql.trim()).map((sql) => db.prepare(sql)));
  await db.prepare("INSERT INTO cms_state(id,draft_json,updated_at) VALUES (1,?,0)").bind(JSON.stringify(seed)).run();
});
after(async () => { await mf?.dispose(); });

test("published API preserves bundled content until first publish",async () => { const res=await request("/api/portfolio"); assert.equal(res.status,200); assert.equal(await jsonBody(res),null); });
test("admin rejects unauthenticated access before parsing body",async () => { const res=await mf.dispatchFetch(origin+"/api/admin/content",{method:"PUT",body:"bad json"}); assert.equal(res.status,401); });
test("public registration and reset endpoints do not exist",async () => { assert.equal((await request("/api/auth/register","POST",{})).status,404); assert.equal((await request("/api/auth/reset","POST",{})).status,404); });
test("setup rejects cross-site origin",async () => { const res=await request("/api/auth/setup","POST",{}, {Origin:"https://attacker.test"}); assert.equal(res.status,403); });
test("setup rejects absent token and wrong email",async () => {
  assert.equal((await request("/api/auth/setup","POST",{email:"owner@example.test",password:fixturePassword})).status,403);
  assert.equal((await request("/api/auth/setup","POST",{email:"other@example.test",password:fixturePassword},{"X-Setup-Token":fixtureToken})).status,403);
});
test("one-time owner setup hashes password and issues hardened cookie",async () => {
  const res=await request("/api/auth/setup","POST",{email:"owner@example.test",password:fixturePassword},{"X-Setup-Token":fixtureToken}); assert.equal(res.status,200);
  const header=res.headers.get("Set-Cookie"); assert.match(header,/Secure; HttpOnly; SameSite=Strict/); assert.match(header,/__Host-/); cookie=header.split(";")[0]; csrf=(await jsonBody(res)).csrfToken;
  const account=await db.prepare("SELECT * FROM cms_accounts").first(); assert.match(account.password_hash,/^scrypt\$32768\$8\$3\$/); assert.ok(!account.password_hash.includes(fixturePassword));
  assert.equal((await request("/api/auth/setup","POST",{email:"owner@example.test",password:fixturePassword},{"X-Setup-Token":fixtureToken})).status,409);
});
test("session exposes only owner identity and CSRF token",async () => { const res=await request("/api/auth/session"); const body=await jsonBody(res); assert.equal(body.authenticated,true); assert.equal(body.email,"owner@example.test"); assert.equal(body.csrfToken,csrf); assert.equal(body.password_hash,undefined); });
test("mutations require both origin and CSRF token",async () => {
  assert.equal((await request("/api/admin/content","PUT",{expectedRevision:0,content:seed},{"X-CSRF-Token":"incorrect"})).status,403);
  assert.equal((await request("/api/admin/content","PUT",{expectedRevision:0,content:seed},{Origin:"https://attacker.test"})).status,403);
});
test("schema rejects executable URLs, secrets and missing NSFW choice",async () => {
  const broken=structuredClone(seed); broken.profile.instagramUrl="javascript:alert(1)"; assert.equal((await request("/api/admin/content","PUT",{expectedRevision:0,content:broken})).status,422);
  const secret=structuredClone(seed); secret.profile.secret="test"; assert.equal((await request("/api/admin/content","PUT",{expectedRevision:0,content:secret})).status,422);
  const noFlag=structuredClone(seed); delete noFlag.projects[0].nsfw; assert.equal((await request("/api/admin/content","PUT",{expectedRevision:0,content:noFlag})).status,422);
});
test("save uses revision checks and does not publish draft",async () => {
  const content=structuredClone(seed); content.profile.homeDescription="First draft";
  const res=await request("/api/admin/content","PUT",{expectedRevision:0,content}); assert.equal(res.status,200); assert.equal((await jsonBody(res)).revision,1);
  assert.equal((await request("/api/admin/content","PUT",{expectedRevision:0,content})).status,409);
  assert.equal(await jsonBody(await request("/api/portfolio")),null);
});
test("publish provides one consistent public snapshot",async () => {
  const res=await request("/api/admin/publish","POST",{expectedRevision:1}); assert.equal(res.status,200);
  const content=await jsonBody(await request("/api/portfolio")); assert.equal(content.revision,1); assert.equal(content.profile.homeDescription,"First draft"); assert.equal(content.password,undefined);
});
test("concurrent saves yield one winner and one conflict",async () => {
  const first=structuredClone(seed),second=structuredClone(seed); first.profile.name="First"; second.profile.name="Second";
  const results=await Promise.all([request("/api/admin/content","PUT",{expectedRevision:1,content:first}),request("/api/admin/content","PUT",{expectedRevision:1,content:second})]); assert.deepEqual(results.map((res)=>res.status).sort(),[200,409]);
  assert.equal((await jsonBody(await request("/api/portfolio"))).revision,1);
});
test("rollback creates a new draft and needs an explicit publish",async () => { const res=await request("/api/admin/rollback","POST",{expectedRevision:2,revision:1}); assert.equal(res.status,200); assert.equal((await jsonBody(res)).revision,3); assert.equal((await jsonBody(await request("/api/portfolio"))).revision,1); });
test("uploads reject unsupported MIME and oversize metadata",async () => {
  assert.equal((await request("/api/admin/media","POST",{filename:"bad.svg",mime:"image/svg+xml",size:20,previewMime:"image/jpeg",previewSize:20})).status,415);
  assert.equal((await request("/api/admin/media","POST",{filename:"large.png",mime:"image/png",size:31*1024*1024,previewMime:"image/jpeg",previewSize:20})).status,413);
});
test("upload verifies magic bytes, preserves originals and hides unpublished media",async () => {
  const created=await jsonBody(await request("/api/admin/media","POST",{filename:"fixture.png",mime:"image/png",size:32,previewMime:"image/jpeg",previewSize:32}));
  const original=new Uint8Array(32); original.set([137,80,78,71,13,10,26,10]); const preview=new Uint8Array(32); preview.set([255,216,255]);
  const upload=(variant,bytes,mime)=>mf.dispatchFetch(origin+`/api/admin/media/${created.id}/${variant}`,{method:"PUT",headers:{Cookie:cookie,Origin:origin,"X-CSRF-Token":csrf,"Content-Type":mime,"Content-Length":"32"},body:bytes});
  assert.equal((await upload("original",new Uint8Array(32),"image/png")).status,415);
  assert.equal((await upload("original",original,"image/png")).status,200); assert.equal((await upload("preview",preview,"image/jpeg")).status,200);
  assert.equal((await upload("original",original,"image/png")).status,409);
  assert.equal((await mf.dispatchFetch(origin+created.original)).status,404);
  assert.deepEqual(new Uint8Array(await (await request(created.original)).arrayBuffer()),original);
  const content=structuredClone(seed); content.projects[0].full=created.original; content.projects[0].thumbWebp=created.preview;
  assert.equal((await request("/api/admin/content","PUT",{expectedRevision:3,content})).status,200); assert.equal((await request("/api/admin/publish","POST",{expectedRevision:4})).status,200);
  const publicRes=await mf.dispatchFetch(origin+created.original); assert.equal(publicRes.status,200); assert.match(publicRes.headers.get("Cache-Control"),/immutable/);
});
test("publish rejects incomplete media without replacing public snapshot",async () => {
  const created=await jsonBody(await request("/api/admin/media","POST",{filename:"pending.png",mime:"image/png",size:32,previewMime:"image/jpeg",previewSize:32}));
  const content=structuredClone(seed); content.projects[0].full=created.original;
  assert.equal((await request("/api/admin/content","PUT",{expectedRevision:4,content})).status,200); assert.equal((await request("/api/admin/publish","POST",{expectedRevision:5})).status,422); assert.equal((await jsonBody(await request("/api/portfolio"))).revision,4);
});
test("binary upload rejects length/type mismatches and retries an interrupted claim",async () => {
  const created=await jsonBody(await request("/api/admin/media","POST",{filename:"retry.png",mime:"image/png",size:32,previewMime:"image/jpeg",previewSize:32}));
  const bytes=new Uint8Array(32);bytes.set([137,80,78,71,13,10,26,10]);
  const send=(type,length)=>mf.dispatchFetch(origin+`/api/admin/media/${created.id}/original`,{method:"PUT",headers:{Cookie:cookie,Origin:origin,"X-CSRF-Token":csrf,"Content-Type":type,"Content-Length":String(length)},body:bytes.subarray(0,length)});
  assert.equal((await send("image/jpeg",32)).status,415);assert.equal((await send("image/png",31)).status,413);
  await db.prepare("UPDATE cms_media SET original_uploaded=? WHERE id=?").bind(-Math.floor(Date.now()/1000),created.id).run();assert.equal((await send("image/png",32)).status,409);
  await db.prepare("UPDATE cms_media SET original_uploaded=? WHERE id=?").bind(-(Math.floor(Date.now()/1000)-1200),created.id).run();assert.equal((await send("image/png",32)).status,200);
});
test("upload allocation is rate limited for the owner across sessions",async () => {
  const key=createHash("sha256").update("upload-create:owner@example.test").digest("hex");
  await db.prepare("INSERT INTO cms_rate_limits(key,count,expires_at) VALUES (?,60,?) ON CONFLICT(key) DO UPDATE SET count=60,expires_at=excluded.expires_at").bind(key,Math.floor(Date.now()/1000)+3600).run();
  assert.equal((await request("/api/admin/media","POST",{filename:"limited.png",mime:"image/png",size:32,previewMime:"image/jpeg",previewSize:32})).status,429);
});
test("logout revokes cookie server-side",async () => { const res=await request("/api/auth/logout","POST",{}); assert.equal(res.status,200); assert.match(res.headers.get("Set-Cookie"),/Max-Age=0/); assert.equal((await request("/api/admin/content")).status,401); cookie=""; csrf=""; });
test("invalid or expired sessions are denied",async () => {
  assert.equal((await request("/api/admin/content","GET",undefined,{Cookie:"__Host-ashvini-cms="+"0".repeat(64)})).status,401);
  const login=await request("/api/auth/login","POST",{email:"owner@example.test",password:fixturePassword}); assert.equal(login.status,200); cookie=login.headers.get("Set-Cookie").split(";")[0]; csrf=(await jsonBody(login)).csrfToken;
  await db.prepare("UPDATE cms_sessions SET expires_at=0").run(); assert.equal((await request("/api/admin/content")).status,401); cookie=""; csrf="";
});
test("wrong passwords fail and login attempts hit the shared rate limit",async () => {
  for(let i=0;i<7;i++) assert.equal((await request("/api/auth/login","POST",{email:"owner@example.test",password:"incorrect-test-value"})).status,401);
  assert.equal((await request("/api/auth/login","POST",{email:"owner@example.test",password:"incorrect-test-value"})).status,429);
});
