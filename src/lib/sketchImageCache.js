// Keep decoded artwork ready without loading the whole sketchbook at full size.
import { mayPreloadArtwork } from "./artworkConsent.js";
export function createImageCache({ makeImage = () => new Image(), maxDecoded = 5, maxConcurrent = 3 } = {}) {
  if (!Number.isInteger(maxDecoded) || maxDecoded < 0 || !Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
    throw new RangeError("Image cache limits must be whole numbers; concurrency must be at least one.");
  }
  const entries = new Map();
  const queue = [];
  let active = 0;
  let clock = 0;
  let draining = false;

  function trimDecoded() {
    const decoded = [...entries.values()].filter((entry) => entry.state === "decoded");
    decoded.sort((a, b) => a.used - b.used);
    while (decoded.length > maxDecoded) entries.delete(decoded.shift().src);
  }

  function finish(entry, error) {
    if (entry.state !== "loading") return;
    active -= 1;
    if (entry.image) entry.image.onload = entry.image.onerror = null;
    if (arguments.length > 1) {
      entry.state = "error";
      entry.image = null;
      entry.reject(error instanceof Error ? error : new Error("Artwork image could not load."));
    } else {
      entry.state = "decoded";
      entry.used = ++clock;
      trimDecoded();
      entry.resolve(entry.image);
    }
    drain();
  }

  function start(entry) {
    active += 1;
    entry.state = "loading";
    try {
      const image = makeImage();
      entry.image = image;
      image.decoding = "async";
      image.fetchPriority = entry.priority;
      image.onerror = (error) => finish(entry, error || new Error("Artwork image could not load."));
      image.onload = () => {
        if (entry.decoding || entry.state !== "loading") return;
        entry.decoding = true;
        try {
          const decoded = typeof image.decode === "function" ? image.decode() : undefined;
          Promise.resolve(decoded).then(() => finish(entry), (error) => finish(entry, error));
        } catch (error) {
          finish(entry, error);
        }
      };
      image.src = entry.src;
    } catch (error) {
      finish(entry, error);
    }
  }

  function drain() {
    if (draining) return;
    draining = true;
    try {
      while (active < maxConcurrent && queue.length) {
        const high = queue.findIndex((entry) => entry.priority === "high");
        start(queue.splice(high < 0 ? 0 : high, 1)[0]);
      }
    } finally {
      draining = false;
    }
  }

  function load(src, { priority = "low", retry = false } = {}) {
    let entry = entries.get(src);
    if (entry?.state === "error" && retry) {
      entries.delete(src);
      entry = null;
    }
    if (entry) {
      entry.used = ++clock;
      if (priority === "high") {
        entry.priority = "high";
        if (entry.image) entry.image.fetchPriority = "high";
      }
      return entry.promise;
    }
    entry = { src, state: "queued", priority: priority === "high" ? "high" : "low", used: ++clock, image: null };
    entry.promise = new Promise((resolve, reject) => {
      entry.resolve = resolve;
      entry.reject = reject;
    });
    // Background warmers can fail before a viewer attaches its own handler.
    entry.promise.catch(() => {});
    entries.set(src, entry);
    queue.push(entry);
    drain();
    return entry.promise;
  }

  return { load, ready: (src) => entries.get(src)?.state === "decoded" };
}

export const fullSketchImages = createImageCache();
export const previewSketchImages = createImageCache({ maxDecoded: 32, maxConcurrent: 2 });

function warm(cache, src, priority) {
  if (src) cache.load(src, { priority }).catch(() => {});
}

export function warmSketchNeighbors(list, index) {
  if (!list?.length || list.length < 2) return;
  const current = ((index % list.length) + list.length) % list.length;
  const neighbors = new Set([(current - 1 + list.length) % list.length, (current + 1) % list.length]);
  for (const position of neighbors) {
    if (!mayPreloadArtwork(list[position])) continue;
    warm(fullSketchImages, list[position]?.full, "low");
    warm(previewSketchImages, list[position]?.thumbWebp, "high");
  }
}

export function warmSketchPreviews(list) {
  const connection = globalThis.navigator?.connection;
  if (connection?.saveData || /^(slow-)?2g$/.test(connection?.effectiveType || "")) return;
  for (const item of list || []) if (mayPreloadArtwork(item)) warm(previewSketchImages, item?.thumbWebp, "low");
}
