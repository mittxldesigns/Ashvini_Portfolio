import { flushSync } from "react-dom";

let running = false;

// True while a view transition is capturing/animating; pages use it to skip
// their own entrance animation on elements the transition already moves.
export function isViewTransitionRunning() {
  return running;
}

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Marks an element as a temporary shared element for the next transition.
// The name is cleared once the transition finishes.
export function tagSharedElement(el, name) {
  if (!el) return;
  el.style.viewTransitionName = name;
  el.dataset.vtTemp = "";
}

// React Router applies navigations inside React.startTransition, which
// flushSync can't force through, so the DOM may not have changed when the
// update callback returns. The callback instead waits for <RouteCommitSignal>
// to report that the new location has committed.
let resolveCommit = null;

export function notifyRouteCommit() {
  resolveCommit?.();
  resolveCommit = null;
}

function nextRouteCommit(timeoutMs) {
  return new Promise((resolve) => {
    resolveCommit = resolve;
    setTimeout(resolve, timeoutMs);
  });
}

function clearTempNames() {
  document.querySelectorAll("[data-vt-temp]").forEach((el) => {
    el.style.viewTransitionName = "";
    delete el.dataset.vtTemp;
  });
}

/**
 * Runs `update` (a synchronous React state change / navigation) inside a
 * View Transition. `kind` becomes html[data-vt] so CSS can style each type.
 * `before` may return a promise to await (bounded) before capturing, e.g.
 * decoding the image that will appear.
 */
export async function withViewTransition(kind, update, before) {
  if (!document.startViewTransition || reducedMotion()) {
    clearTempNames();
    update();
    return;
  }
  if (before) {
    await Promise.race([before(), new Promise((r) => setTimeout(r, 180))]);
  }
  const root = document.documentElement;
  root.dataset.vt = kind;
  running = true;
  const t = document.startViewTransition(() => {
    const committed = nextRouteCommit(1000);
    flushSync(update);
    return committed;
  });
  t.finished.finally(() => {
    running = false;
    if (root.dataset.vt === kind) delete root.dataset.vt;
    clearTempNames();
  });
}
