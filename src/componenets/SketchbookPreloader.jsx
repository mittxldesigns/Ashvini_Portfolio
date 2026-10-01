import { useEffect, useState } from "react";
import portrait from "../assets/sketches/ashvini-preloader.svg";
import "./SketchbookPreloader.css";

const DRAW_MS = 2000;
const LEAVE_MS = 280;
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Reenie+Beanie&family=Courier+Prime:wght@400;700&display=swap";

export default function SketchbookPreloader({ playing, pageRef, onReveal, onDone, children }) {
  const [imageReady, setImageReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const onWheel = (event) => { event.preventDefault(); event.stopPropagation(); };
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onDone();
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        // Project-detail shortcuts must not navigate underneath the loader.
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("wheel", onWheel, true);
    };
  }, [onDone]);

  useEffect(() => {
    if (!playing || !imageReady) return undefined;
    let active = true;
    let drawTimer;
    let deadlineTimer;
    const artwork = pageRef.current?.querySelector(".sk-hero-pin img");
    const artworkReady = artwork?.decode?.().catch(() => {}) ?? Promise.resolve();
    const drawn = new Promise((resolve) => { drawTimer = setTimeout(resolve, DRAW_MS); });
    const deadline = new Promise((resolve) => { deadlineTimer = setTimeout(resolve, 4200); });
    Promise.race([Promise.all([drawn, artworkReady]), deadline]).then(() => {
      if (!active) return;
      onReveal();
      setLeaving(true);
    });
    return () => {
      active = false;
      clearTimeout(drawTimer);
      clearTimeout(deadlineTimer);
    };
  }, [playing, imageReady, pageRef, onReveal]);

  useEffect(() => {
    if (!leaving) return undefined;
    const timer = setTimeout(onDone, LEAVE_MS);
    return () => clearTimeout(timer);
  }, [leaving, onDone]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setTimeout(onDone, 5000);
    return () => clearTimeout(timer);
  }, [playing, onDone]);

  const phase = leaving ? "leaving" : imageReady ? "drawing" : "waiting";

  return (
    <div className={`sk-loader is-${phase}`} role="status" aria-label="Opening Ashvini's sketchbook">
      <svg className="sk-loader-paper" aria-hidden="true">
        <defs>
          <filter id="sk-loader-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="17" />
            <feColorMatrix values="0 0 0 0 .42  0 0 0 0 .4  0 0 0 0 .36  0 0 0 .09 0" />
          </filter>
          <pattern id="sk-loader-grid" width="82" height="82" patternUnits="userSpaceOnUse">
            <path d="M0 81.8 C28 82.5 54 80.8 82 81.4 M81.1 0 C82.7 28 80.4 55 81.6 82" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sk-loader-grid)" />
        <path className="sk-loader-margin" d="M48 0 C45 260 52 680 48 1400" />
        <rect width="100%" height="100%" filter="url(#sk-loader-grain)" />
      </svg>
      <div className="sk-loader-composition">
        <p className="sk-loader-eyebrow">sketchbook</p>
        <figure className="sk-loader-drawing" aria-hidden="true">
          <svg className="sk-loader-pencil-marks" viewBox="0 0 360 430">
            <path d="M52 34 C46 111 51 225 48 367 M48 367 C123 370 230 364 307 369" />
            <path d="M313 31 l-1 22 M302 42 l23 1 M31 351 l9 9 m-9 0 l9 -9" />
            <path className="sk-loader-smudge" d="M52 322 C55 338 52 352 59 364" />
          </svg>
          {playing && (
            <img
              className="sk-loader-portrait"
              src={portrait}
              alt=""
              onLoad={() => setImageReady(true)}
              onError={onDone}
              draggable="false"
            />
          )}
          <span className="sk-loader-pencil-note">ashvini</span>
        </figure>
        <div className="sk-loader-title is-in">{children}</div>
        <svg className="sk-loader-underline" viewBox="0 0 280 20" aria-hidden="true">
          <path d="M3 9 C69 14 169 4 270 10 M23 14 C101 12 189 15 261 12" pathLength="1" />
        </svg>
        <p className="sk-loader-opening">opening sketchbook</p>
      </div>
      <button type="button" className="sk-loader-skip" onClick={onDone}>skip intro</button>
    </div>
  );
}
