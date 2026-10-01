export const SKETCH_PRELOADER_KEY = "ashvini:sketchbook:preloader:last-shown";
export const SKETCH_PRELOADER_INTERVAL = 60 * 60 * 1000;

let memoryTimestamp = 0;

export function isSketchLoaderPreview(search = "") {
  return new URLSearchParams(search).get("loader") === "true";
}

function browserStorage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function shouldShowSketchPreloader(now = Date.now(), storage = browserStorage()) {
  let lastShown = memoryTimestamp;
  if (storage) {
    try {
      lastShown = Number(storage.getItem(SKETCH_PRELOADER_KEY));
    } catch { /* Storage is optional; keep the visit working. */ }
  }
  return !Number.isFinite(lastShown) || lastShown <= 0 || lastShown > now
    || now - lastShown >= SKETCH_PRELOADER_INTERVAL;
}

export function claimSketchPreloader(now = Date.now(), storage = browserStorage()) {
  if (!shouldShowSketchPreloader(now, storage)) return false;
  memoryTimestamp = now;
  try {
    storage?.setItem(SKETCH_PRELOADER_KEY, String(now));
  } catch { /* A blocked store still remembers this SPA visit. */ }
  return true;
}

// A canceled React StrictMode effect must not consume the hourly claim.
// Web Locks also prevent two tabs from claiming the same intro together.
export async function claimSketchPreloaderWhenActive(
  canClaim,
  { now = Date.now, storage = browserStorage(), locks = globalThis.navigator?.locks } = {},
) {
  await Promise.resolve();
  if (!canClaim()) return false;
  const claim = () => canClaim() && claimSketchPreloader(now(), storage);
  if (!locks?.request) return claim();
  try {
    return await locks.request(SKETCH_PRELOADER_KEY, claim);
  } catch {
    return claim();
  }
}
