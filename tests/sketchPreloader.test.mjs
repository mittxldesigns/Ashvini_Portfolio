import test from "node:test";
import assert from "node:assert/strict";
import {
  SKETCH_PRELOADER_KEY,
  SKETCH_PRELOADER_INTERVAL,
  claimSketchPreloader,
  claimSketchPreloaderWhenActive,
  shouldShowSketchPreloader,
  isSketchLoaderPreview,
} from "../src/lib/sketchPreloader.js";

const now = 1_000_000_000;

test("only the exact loader=true query opts into repeatable preview", () => {
  for (const query of ["?loader=true", "?type=paper&loader=true", "loader=true&other=1"]) {
    assert.equal(isSketchLoaderPreview(query), true);
  }
  for (const query of ["", "?loader=false", "?loader=1", "?loader=TRUE", "?notloader=true", "?loader=trueish"]) {
    assert.equal(isSketchLoaderPreview(query), false);
  }
});
function store(value) {
  const map = new Map(value === undefined ? [] : [[SKETCH_PRELOADER_KEY, value]]);
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, v) => map.set(key, v) };
}

test("claims once, persists across mounts, and expires exactly at 60 minutes", () => {
  const storage = store();
  assert.equal(shouldShowSketchPreloader(now, storage), true);
  assert.equal(claimSketchPreloader(now, storage), true);
  assert.equal(storage.getItem(SKETCH_PRELOADER_KEY), String(now));
  assert.equal(shouldShowSketchPreloader(now + 1, storage), false);
  assert.equal(claimSketchPreloader(now + SKETCH_PRELOADER_INTERVAL - 1, storage), false);
  assert.equal(claimSketchPreloader(now + SKETCH_PRELOADER_INTERVAL, storage), true);
});

test("invalid and future timestamps do not permanently suppress the intro", () => {
  for (const value of ["bad", "NaN", "-1", String(now + 1)]) {
    assert.equal(shouldShowSketchPreloader(now, store(value)), true);
  }
});

test("a canceled StrictMode effect does not consume the claim without Web Locks", async () => {
  const storage = store();
  let active = true;
  const canceled = claimSketchPreloaderWhenActive(() => active, { storage, now: () => now, locks: null });
  active = false;
  const mounted = claimSketchPreloaderWhenActive(() => true, { storage, now: () => now, locks: null });
  assert.deepEqual(await Promise.all([canceled, mounted]), [false, true]);
});

test("two tabs are serialized by the same named lock", async () => {
  const storage = store();
  let queue = Promise.resolve();
  const names = [];
  const locks = { request(name, claim) {
    names.push(name);
    const current = queue.then(claim);
    queue = current.catch(() => {});
    return current;
  } };
  const options = { storage, now: () => now, locks };
  const claims = await Promise.all([
    claimSketchPreloaderWhenActive(() => true, options),
    claimSketchPreloaderWhenActive(() => true, options),
  ]);
  assert.deepEqual(claims, [true, false]);
  assert.deepEqual(names, [SKETCH_PRELOADER_KEY, SKETCH_PRELOADER_KEY]);
});

test("blocked storage still remembers the intro during SPA navigation", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const later = now + SKETCH_PRELOADER_INTERVAL * 10;
  assert.equal(claimSketchPreloader(later, blocked), true);
  assert.equal(shouldShowSketchPreloader(later + 1, blocked), false);
});
