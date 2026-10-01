import assert from "node:assert/strict";
import test from "node:test";
import { createImageCache } from "../src/lib/sketchImageCache.js";

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function images() {
  const created = [], active = new Set();
  let peak = 0;
  class FakeImage {
    constructor() {
      this.decoded = deferred();
      this.decodeCalls = 0;
      created.push(this);
    }
    set src(value) {
      this.url = value;
      active.add(this);
      peak = Math.max(peak, active.size);
    }
    get src() { return this.url; }
    decode() {
      this.decodeCalls += 1;
      return this.decoded.promise.then(
        () => { active.delete(this); },
        (error) => { active.delete(this); throw error; },
      );
    }
    transfer() { this.onload?.(); }
    complete() { this.transfer(); this.decoded.resolve(); }
    fail() { active.delete(this); this.onerror?.(new Error("offline")); }
  }
  return { created, active, FakeImage, makeImage: () => new FakeImage(), get peak() { return peak; } };
}

const turn = () => new Promise((resolve) => setImmediate(resolve));

async function finishAll(harness) {
  let finished = 0;
  while (finished < harness.created.length) {
    harness.created[finished++].complete();
    await turn();
  }
}

function browser(t, harness, connection) {
  for (const [name, value] of [["Image", harness.FakeImage], ["navigator", { connection }]]) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else delete globalThis[name];
    });
  }
}

test("constructing caches does not create browser images", () => {
  let calls = 0;
  const cache = createImageCache({ makeImage: () => { calls += 1; throw new Error("not a browser"); } });
  assert.equal(calls, 0);
  assert.equal(cache.ready("unrequested.webp"), false);
  assert.doesNotThrow(() => createImageCache());
  assert.throws(() => createImageCache({ maxConcurrent: 0 }), RangeError);
  assert.throws(() => createImageCache({ maxDecoded: -1 }), RangeError);
});

test("URL requests dedupe and remain unready until decoding completes", async () => {
  const harness = images(), cache = createImageCache({ makeImage: harness.makeImage });
  const promise = cache.load("art.webp");
  assert.equal(cache.load("art.webp"), promise);
  assert.equal(harness.created.length, 1);
  const image = harness.created[0];
  assert.equal(image.decoding, "async");
  image.transfer();
  await turn();
  assert.equal(image.decodeCalls, 1);
  assert.equal(cache.ready("art.webp"), false);
  image.decoded.resolve();
  assert.equal(await promise, image);
  assert.equal(cache.ready("art.webp"), true);
  assert.equal(cache.load("art.webp"), promise);
});

test("high-priority promotion overtakes queued neighbours and promotes in-flight images", async () => {
  const harness = images(), cache = createImageCache({ makeImage: harness.makeImage, maxConcurrent: 1 });
  const first = cache.load("first.webp");
  const second = cache.load("second.webp");
  const third = cache.load("third.webp");
  assert.equal(cache.load("third.webp", { priority: "high" }), third);
  harness.created[0].complete();
  await first;
  assert.deepEqual(harness.created.map((image) => image.src), ["first.webp", "third.webp"]);
  assert.equal(harness.created[1].fetchPriority, "high");
  harness.created[1].complete();
  await third;
  const current = harness.created[2];
  assert.equal(current.fetchPriority, "low");
  assert.equal(cache.load("second.webp", { priority: "high" }), second);
  assert.equal(current.fetchPriority, "high");
  current.complete();
  await second;
  assert.equal(harness.created.length, 3);
});

test("transfer and deferred decoding share the bounded concurrency budget", async () => {
  const harness = images(), cache = createImageCache({ makeImage: harness.makeImage, maxConcurrent: 3 });
  const requests = Array.from({ length: 9 }, (_, i) => cache.load(`${i}.webp`));
  assert.equal(harness.created.length, 3);
  harness.created.forEach((image) => image.transfer());
  await turn();
  assert.equal(harness.created.length, 3);
  await finishAll(harness);
  await Promise.all(requests);
  assert.equal(harness.created.length, 9);
  assert.equal(harness.peak, 3);
});

test("decoded entries use an LRU budget of five", async () => {
  const harness = images(), cache = createImageCache({ makeImage: harness.makeImage });
  for (let i = 0; i < 5; i += 1) {
    const promise = cache.load(`${i}.webp`);
    harness.created.at(-1).complete();
    await promise;
  }
  await cache.load("0.webp");
  const sixth = cache.load("5.webp");
  harness.created.at(-1).complete();
  await sixth;
  assert.equal(cache.ready("1.webp"), false);
  for (const i of [0, 2, 3, 4, 5]) assert.equal(cache.ready(`${i}.webp`), true);
  const reload = cache.load("1.webp");
  assert.equal(harness.created.length, 7);
  harness.created.at(-1).complete();
  await reload;
});

test("LRU trimming keeps queued and in-flight requests deduplicated", async () => {
  const harness = images(), cache = createImageCache({ makeImage: harness.makeImage, maxDecoded: 1, maxConcurrent: 1 });
  const old = cache.load("old.webp");
  harness.created[0].complete();
  await old;
  const pending = cache.load("pending.webp"), queued = cache.load("queued.webp");
  assert.equal(cache.load("pending.webp"), pending);
  assert.equal(cache.load("queued.webp"), queued);
  harness.created[1].complete();
  await pending;
  assert.equal(cache.ready("old.webp"), false);
  assert.equal(cache.load("queued.webp"), queued);
  harness.created[2].complete();
  await queued;
  assert.equal(harness.created.length, 3);
});

test("network errors stay failed until an explicit manual retry", async () => {
  const harness = images(), cache = createImageCache({ makeImage: harness.makeImage });
  const failed = cache.load("offline.webp");
  harness.created[0].fail();
  await assert.rejects(failed, /offline/);
  assert.equal(cache.ready("offline.webp"), false);
  assert.equal(cache.load("offline.webp"), failed);
  await turn();
  assert.equal(harness.created.length, 1);
  const retried = cache.load("offline.webp", { priority: "high", retry: true });
  assert.notEqual(retried, failed);
  assert.equal(harness.created[1].fetchPriority, "high");
  harness.created[1].complete();
  await retried;
  assert.equal(cache.ready("offline.webp"), true);
});

test("decode failures free a slot and never become ready", async () => {
  const harness = images(), cache = createImageCache({ makeImage: harness.makeImage, maxConcurrent: 1 });
  const failed = cache.load("bad.webp"), next = cache.load("next.webp");
  harness.created[0].transfer();
  harness.created[0].decoded.reject(new Error("decode failed"));
  await assert.rejects(failed, /decode failed/);
  assert.equal(cache.ready("bad.webp"), false);
  assert.equal(harness.created[1].src, "next.webp");
  harness.created[1].complete();
  await next;
});

test("a decoder rejection without an error value is still a failure", async () => {
  const harness = images(), cache = createImageCache({ makeImage: harness.makeImage });
  const failed = cache.load("empty-error.webp");
  harness.created[0].transfer();
  harness.created[0].decoded.reject();
  await assert.rejects(failed, /could not load/);
  assert.equal(cache.ready("empty-error.webp"), false);
});

test("unobserved background failures do not emit unhandled rejections", async (t) => {
  const harness = images(), cache = createImageCache({ makeImage: harness.makeImage });
  const unhandled = [];
  const onUnhandled = (error) => unhandled.push(error);
  process.on("unhandledRejection", onUnhandled);
  t.after(() => process.removeListener("unhandledRejection", onUnhandled));
  cache.load("background.webp");
  harness.created[0].fail();
  await turn();
  assert.deepEqual(unhandled, []);
});

test("neighbour warming wraps both directions and uses the requested priorities", async (t) => {
  const harness = images();
  browser(t, harness);
  const module = await import("../src/lib/sketchImageCache.js?neighbors");
  const list = ["a", "b", "c"].map((name) => ({ full: `${name}.webp`, thumbWebp: `${name}-thumb.webp` }));
  module.warmSketchNeighbors(list, 0);
  assert.deepEqual(harness.created.map((image) => [image.src, image.fetchPriority]), [
    ["c.webp", "low"], ["c-thumb.webp", "high"], ["b.webp", "low"], ["b-thumb.webp", "high"],
  ]);
  await finishAll(harness);
  assert.equal(module.fullSketchImages.ready("a.webp"), false);
  assert.equal(module.fullSketchImages.ready("b.webp"), true);
  assert.equal(module.fullSketchImages.ready("c.webp"), true);
});

test("two-piece chapter requests its one distinct neighbour once", async (t) => {
  const harness = images();
  browser(t, harness);
  const module = await import("../src/lib/sketchImageCache.js?two-piece");
  module.warmSketchNeighbors([{ full: "a.webp", thumbWebp: "a-thumb.webp" }, { full: "b.webp", thumbWebp: "b-thumb.webp" }], 0);
  assert.deepEqual(harness.created.map((image) => image.src), ["b.webp", "b-thumb.webp"]);
  module.warmSketchNeighbors([{ full: "a.webp", thumbWebp: "a-thumb.webp" }], 0);
  assert.equal(harness.created.length, 2);
  await finishAll(harness);
});

test("bulk preview warming is low priority with two concurrent requests", async (t) => {
  const harness = images();
  browser(t, harness, { effectiveType: "4g" });
  const module = await import("../src/lib/sketchImageCache.js?bulk");
  module.warmSketchPreviews(Array.from({ length: 6 }, (_, i) => ({ thumbWebp: `${i}-thumb.webp` })));
  assert.equal(harness.created.length, 2);
  assert.ok(harness.created.every((image) => image.fetchPriority === "low"));
  await finishAll(harness);
  assert.equal(harness.created.length, 6);
  assert.equal(harness.peak, 2);
  assert.equal(module.previewSketchImages.ready("5-thumb.webp"), true);
});

test("save-data and 2g skip bulk previews while neighbour previews still warm", async (t) => {
  const harness = images();
  browser(t, harness);
  const module = await import("../src/lib/sketchImageCache.js?save-data");
  const list = [{ full: "a.webp", thumbWebp: "a-thumb.webp" }, { full: "b.webp", thumbWebp: "b-thumb.webp" }];
  for (const connection of [{ saveData: true }, { effectiveType: "2g" }, { effectiveType: "slow-2g" }]) {
    globalThis.navigator.connection = connection;
    module.warmSketchPreviews(list);
    assert.equal(harness.created.length, 0);
  }
  module.warmSketchNeighbors(list, 0);
  assert.deepEqual(harness.created.map((image) => image.src), ["b.webp", "b-thumb.webp"]);
  await finishAll(harness);
});
