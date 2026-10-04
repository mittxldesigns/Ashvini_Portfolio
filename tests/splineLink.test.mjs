import assert from "node:assert/strict";
import test from "node:test";
import { parseSplineLink, verifySplineScene, defaultProjectView } from "../src/lib/splineLink.js";

const URL = "https://prod.spline.design/jXEeiYImnNo-xkP9/scene.splinecode";

test("accepts exact exported scene links and preserves optional empty values", () => {
  assert.equal(parseSplineLink(` ${URL} `).url, URL);
  for (const value of [null, undefined, "", "  "]) assert.deepEqual(parseSplineLink(value), { valid: true, url: "", error: "" });
});

test("rejects editor, community, public HTML, credentials and lookalike hosts", () => {
  for (const value of [
    "https://app.spline.design/file/example", "https://community.spline.design/file/example",
    "https://my.spline.design/example", '<iframe src="https://my.spline.design/example"></iframe>',
    `<spline-viewer url="${URL}"></spline-viewer>`, `http://prod.spline.design/example/scene.splinecode`,
    `https://private:secret@prod.spline.design/example/scene.splinecode`,
    "https://prod.spline.design.evil.test/example/scene.splinecode", "https://prod.spline.design:8443/example/scene.splinecode",
    "https://prod.spline.design/example/index.html", `${URL}#example`, "javascript:alert(1)", 42,
  ]) assert.equal(parseSplineLink(value).valid, false, String(value));
});

test("extracts one exact trusted URL from Vanilla JS without executing its code", () => {
  globalThis.splineTestExecuted = false;
  const snippet = `import { Application } from '@splinetool/runtime'; globalThis.splineTestExecuted = true; const spline = new Application(canvas); spline.load('${URL}');`;
  assert.equal(parseSplineLink(snippet).url, URL);
  assert.equal(globalThis.splineTestExecuted, false);
  delete globalThis.splineTestExecuted;
  assert.equal(parseSplineLink(`${snippet} spline.load('https://prod.spline.design/other/scene.splinecode');`).valid, false);
  assert.equal(parseSplineLink(`<script>${snippet}</script>`).valid, false);
});

test("image-cover projects default to 3D while video-cover projects keep playback", () => {
  assert.equal(defaultProjectView({ splineScene: URL }), "interactive");
  assert.equal(defaultProjectView({ splineScene: URL, frames: [{ mediaType: "image" }] }), "interactive");
  assert.equal(defaultProjectView({ splineScene: URL, frames: [{ mediaType: "video" }] }), "media");
  assert.equal(defaultProjectView({ splineScene: null, frames: [{ mediaType: "image" }] }), "media");
  assert.equal(defaultProjectView({ splineScene: "https://my.spline.design/example" }), "media");
});

test("invalid links never cause a network request", async () => {
  let calls = 0;
  assert.equal((await verifySplineScene("https://evil.test/scene.splinecode", { fetchImpl: async () => { calls += 1; } })).ok, false);
  assert.equal(calls, 0);
});

test("probe is credential-free, refuses redirects and cancels after a bounded prefix", async () => {
  let options, cancelled = false;
  const result = await verifySplineScene(URL, { fetchImpl: async (_url, init) => {
    options = init;
    return { ok: true, redirected: false, url: URL, headers: new Headers({ "content-type": "application/octet-stream" }),
      body: { getReader: () => ({ read: async () => ({ value: new Uint8Array([0, 1, 2]), done: false }), cancel: async () => { cancelled = true; } }) } };
  } });
  assert.equal(result.ok, true);
  assert.equal(options.credentials, "omit");
  assert.equal(options.redirect, "error");
  assert.equal(options.referrerPolicy, "no-referrer");
  assert.equal(options.headers.Range, "bytes=0-63");
  assert.equal(cancelled, true);
});

test("HTML, empty, unavailable and redirected files remain unverified", async () => {
  const responses = [
    new Response("<html>Sign in</html>", { headers: { "content-type": "text/html" } }),
    new Response("<html>Error</html>", { headers: { "content-type": "application/octet-stream" } }),
    new Response(null, { status: 204 }), new Response("missing", { status: 404 }),
    { ok: true, redirected: true, url: "https://evil.test/file", headers: new Headers(), body: null },
  ];
  for (const response of responses) assert.equal((await verifySplineScene(URL, { fetchImpl: async () => response })).ok, false);
});

test("timeout and caller cancellation finish without a false success", async () => {
  const wait = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
  assert.equal((await verifySplineScene(URL, { fetchImpl: wait, timeoutMs: 5 })).ok, false);
  const controller = new AbortController(); controller.abort();
  let called = false;
  assert.equal((await verifySplineScene(URL, { signal: controller.signal, fetchImpl: async () => { called = true; } })).ok, false);
  assert.equal(called, false);
});
