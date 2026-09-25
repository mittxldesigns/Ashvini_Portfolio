import { useEffect, useRef } from "react";
import { transitionsSettled } from "../lib/viewTransition.js";

// Live Spline scenes are heavy (runtime + WASM + scene file), so only load
// them where they'll run well: fine pointer, enough memory, no data saver,
// motion allowed. Everyone else keeps the static render.
function canRunLive() {
  const mq = (q) => window.matchMedia(q).matches;
  if (!mq("(hover: hover) and (pointer: fine)")) return false;
  if (mq("(prefers-reduced-motion: reduce)")) return false;
  if (navigator.connection?.saveData) return false;
  if ((navigator.deviceMemory ?? 8) < 4) return false;
  return true;
}

const idle = () =>
  new Promise((resolve) =>
    "requestIdleCallback" in window
      ? requestIdleCallback(resolve, { timeout: 1200 })
      : setTimeout(resolve, 300)
  );

const nextFrames = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );

/**
 * Loads a Spline code export into a transparent canvas once any page
 * transition has settled, then calls onLive(true) so the static render can
 * crossfade out. Disposes the runtime on unmount / scene change.
 */
export default function LiveScene({ url, onLive }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!url || !canRunLive()) return;
    let cancelled = false;
    let app = null;

    (async () => {
      await transitionsSettled();
      await idle();
      if (cancelled) return;
      const { Application } = await import("@splinetool/runtime");
      if (cancelled) return;
      app = new Application(canvasRef.current, {
        renderMode: "auto",
        htmlContentMode: "none",
      });
      await app.load(url);
      if (cancelled) return;
      app.setBackgroundColor("transparent");
      await nextFrames();
      if (!cancelled) onLive(true);
    })().catch((err) => {
      if (!cancelled) console.warn("Live scene unavailable:", err);
    });

    return () => {
      cancelled = true;
      onLive(false);
      app?.dispose();
    };
  }, [url, onLive]);

  if (!url) return null;
  return <canvas ref={canvasRef} className="project-live" />;
}
