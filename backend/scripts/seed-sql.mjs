import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { validateSeed } from "./validate-seed.mjs";

const [input, output] = process.argv.slice(2);
assert.ok(input && output, "Usage: node scripts/seed-sql.mjs <seed.json> <output.sql>");
const content = await validateSeed(JSON.parse(await readFile(input,"utf8")));
assert.equal(content.schemaVersion,1);
for (const key of ["projects","editorial","sketches"]) {
  assert.ok(Array.isArray(content[key]) && content[key].length <= 300, `${key} must be an array`);
  assert.ok(content[key].every((entry) => typeof entry.nsfw === "boolean" && entry.title && entry.slug), `${key} needs titles, slugs and NSFW flags`);
}
assert.ok(content.profile && typeof content.profile === "object");
const scan = (value) => {
  if (!value || typeof value !== "object") return;
  for (const [key,item] of Object.entries(value)) {
    assert.ok(!/password|secret|token|html|email/i.test(key), `Unpublishable field: ${key}`);
    scan(item);
  }
};
scan(content);
content.revision = 0;
const serialized = JSON.stringify(content);
assert.ok(Buffer.byteLength(serialized) <= 512 * 1024, "The portfolio seed exceeds the content limit.");
const seedId = createHash("sha256").update(serialized).digest("hex");
const chunks = []; let chunk = "", size = 0;
for (const character of serialized) {
  const bytes = Buffer.byteLength(character);
  if (size + bytes > 30000) { chunks.push(chunk); chunk = ""; size = 0; }
  chunk += character; size += bytes;
}
if (chunk) chunks.push(chunk);
const time = Math.floor(Date.now()/1000);
// A second seed run never replaces an owner's existing draft/publication.
const inserts = chunks.map((part,index) => `INSERT INTO cms_seed_chunks(seed_id,position,content) VALUES ('${seedId}',${index},'${part.replace(/'/g,"''")}') ON CONFLICT(seed_id,position) DO NOTHING;`).join("\n");
const sql = `${inserts}\nWITH assembled AS (SELECT group_concat(content,'') AS data FROM (SELECT content FROM cms_seed_chunks WHERE seed_id='${seedId}' ORDER BY position)) INSERT INTO cms_state(id,draft_revision,draft_json,published_revision,published_json,updated_at) SELECT 1,0,data,0,data,${time} FROM assembled WHERE json_valid(data)=1 AND (SELECT count(*) FROM cms_seed_chunks WHERE seed_id='${seedId}')=${chunks.length} ON CONFLICT(id) DO NOTHING;\nINSERT INTO cms_revisions(revision,content_json,action,created_at,published_at) SELECT 0,draft_json,'seed',${time},${time} FROM cms_state WHERE id=1 AND draft_revision=0 ON CONFLICT(revision) DO NOTHING;\n`;
await writeFile(output,sql,{mode:0o600});
console.log(`Prepared existing portfolio seed: ${content.projects.length} projects, ${content.editorial.length} editorial entries, ${content.sketches.length} sketches.`);
