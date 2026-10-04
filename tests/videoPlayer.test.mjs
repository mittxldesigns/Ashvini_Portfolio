import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

test("custom player preserves poster, plays/seeks/mutes, isolates keys, retries, and resets source", async (t) => {
  const require = createRequire(import.meta.url);
  let jsdomPath;
  try { jsdomPath = require.resolve("jsdom"); } catch {
    if (process.env.JSDOM_MODULE_PATH) jsdomPath = require.resolve(process.env.JSDOM_MODULE_PATH);
    else { t.skip("jsdom unavailable; set JSDOM_MODULE_PATH to run the DOM test"); return; }
  }
  const { JSDOM } = await import(pathToFileURL(jsdomPath).href);
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { pretendToBeVisual: true });
  dom.window.HTMLMediaElement.prototype.pause = () => {};
  const originals = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  let root, mockTimers = false;
  try {
    const { transform } = await import("esbuild");
    const source = (await fs.readFile(new URL("../src/componenets/VideoPlayer.jsx", import.meta.url), "utf8")).replace(/import "\.\/VideoPlayer\.css";\n/, "");
    const compiled = await transform(source, { loader: "jsx", jsx: "automatic", format: "esm" });
    const imports = Object.fromEntries(["react", "react/jsx-runtime"].map(name => [name, pathToFileURL(require.resolve(name)).href]));
    const code = compiled.code.replace(/from "([^"]+)"/g, (all, name) => imports[name] ? `from "${imports[name]}"` : all);
    const { default: VideoPlayer } = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
    const React = await import("react"), { createRoot } = await import("react-dom/client");
    const props = { src: "/media/portrait.mp4", poster: "/media/portrait.webp", title: "Portrait process", width: 540, height: 960 };
    root = createRoot(document.getElementById("root"));
    await React.act(() => root.render(React.createElement(VideoPlayer, props)));
    const video = document.querySelector("video"); let paused = true, plays = 0, pauses = 0, loads = 0, fullscreen = 0;
    Object.defineProperties(video, { paused: { get: () => paused }, duration: { value: 65, configurable: true }, videoWidth: { value: 540 }, videoHeight: { value: 960 } });
    video.play = async () => { plays++; paused = false; video.dispatchEvent(new dom.window.Event("play")); };
    video.pause = () => { pauses++; paused = true; video.dispatchEvent(new dom.window.Event("pause")); };
    video.load = () => { loads++; };
    const emit = event => React.act(() => video.dispatchEvent(new dom.window.Event(event)));
    const click = label => React.act(() => document.querySelector(`[aria-label="${label}"]`).click());
    assert.equal(video.controls, false); assert.equal(video.autoplay, false); assert.equal(video.getAttribute("preload"), "metadata");
    assert.equal(video.hasAttribute("playsinline"), true); assert(document.querySelector(".vp-poster")); assert.equal(plays, 0);
    await emit("loadstart"); assert.equal(document.querySelector(".vp-loading"), null);
    await emit("loadedmetadata"); assert(document.querySelector(".vp-poster"));
    assert.equal(document.querySelector(".vp-time").textContent, "0:00 / 1:05");
    assert.equal(document.querySelector(".video-player").style.getPropertyValue("--vp-ratio"), "0.5625");
    await click("Play video"); assert.equal(plays, 1); assert(document.querySelector(".vp-poster")); assert(document.querySelector(".vp-loading"));
    await emit("playing"); assert.equal(document.querySelector(".vp-poster"), null); assert.equal(document.querySelector(".vp-loading"), null);
    const range = document.querySelector(".vp-seek"); let leaked = 0;
    const keyListener = () => { leaked++; }; window.addEventListener("keydown", keyListener);
    for (const key of ["ArrowRight", "ArrowLeft", " "]) range.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key, bubbles: true }));
    window.removeEventListener("keydown", keyListener); assert.equal(leaked, 0);
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
    await React.act(() => { setter.call(range, "12.3"); range.dispatchEvent(new dom.window.Event("input", { bubbles: true })); range.dispatchEvent(new dom.window.Event("change", { bubbles: true })); });
    assert.equal(video.currentTime, 12.3); assert.equal(document.querySelector(".vp-time").textContent, "0:12 / 1:05");
    await click("Mute video"); assert.equal(video.muted, true); await click("Unmute video"); assert.equal(video.muted, false);
    document.querySelector(".video-player").requestFullscreen = async () => { fullscreen++; };
    await click("Enter fullscreen"); assert.equal(fullscreen, 1);
    delete document.querySelector(".video-player").requestFullscreen;
    video.webkitEnterFullscreen = () => { fullscreen++; video.dispatchEvent(new dom.window.Event("webkitbeginfullscreen")); };
    await click("Enter fullscreen"); assert.equal(fullscreen, 2); assert(document.querySelector('[aria-label="Exit fullscreen"]'));
    await click("Pause video"); assert.equal(pauses, 1);
    await emit("error"); assert(document.querySelector('[role="alert"]')); assert.equal(document.querySelector(".vp-error a").getAttribute("href"), props.src);
    await React.act(() => document.querySelector(".vp-error button").click()); assert.equal(loads, 1); assert(document.querySelector(".vp-poster")); assert.equal(document.querySelector(".vp-loading"), null);
    await emit("loadedmetadata"); await click("Play video"); await emit("playing");
    t.mock.timers.enable({ apis: ["setTimeout"] }); mockTimers = true;
    await emit("stalled"); await React.act(() => t.mock.timers.tick(12000));
    assert.match(document.querySelector('[role="alert"]').textContent, /taking longer/); assert(document.querySelector(".vp-error button"));
    t.mock.timers.reset(); mockTimers = false;
    await React.act(() => root.render(React.createElement(VideoPlayer, { ...props, src: "/media/landscape.mp4", poster: "/media/landscape.webp", width: 1920, height: 1080 })));
    assert.equal(pauses, 2);
    assert.notEqual(document.querySelector("video"), video); assert(document.querySelector(".vp-poster"));
    assert.equal(document.querySelector(".vp-time").textContent, "0:00 / --:--"); assert.equal(document.querySelector(".video-player").style.getPropertyValue("--vp-ratio"), String(1920 / 1080));
  } finally {
    if (mockTimers) t.mock.timers.reset();
    if (root) { const { act } = await import("react"); await act(() => root.unmount()); }
    dom.window.close();
    for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
});
