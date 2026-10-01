import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HeaderNav from "./HeaderNav.jsx";
import TransitionLink from "./TransitionLink.jsx";
import { CONTRA_PROFILE } from "../data/projects.js";
import { SKETCH_CHAPTERS, SKETCH_TIMELINE, sketches } from "../data/sketches.js";

// The artist side, built like a sketchbook rather than a website: pencil on paper,
// headlines pasted in from magazine cutouts, notes in his handwriting.

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Reenie+Beanie&family=Courier+Prime:wght@400;700&display=swap";
const letters = import.meta.glob("../assets/cutout/*.webp", { eager: true, import: "default" });
const letterSrc = (ch) => letters[`../assets/cutout/${/\d/.test(ch) ? "d" + ch : ch.toUpperCase()}.webp`];
const bySlug = (slug) => sketches.find((s) => s.slug === slug);
// deterministic "random" so letters and sheets sit the same way on every visit
const jitter = (seed, spread) => (((Math.sin(seed * 999.7) + 1) / 2) * 2 - 1) * spread;

/* Words pasted in from magazine cutouts, one letter at a time. */
function Cutout({ text, size = 1, seed = 1, className = "", delay = 0 }) {
  let n = 0;
  return (
    <span className={`cut ${className}`} style={{ "--cut": size }} role="img" aria-label={text}>
      {text.split(" ").map((word, w) => (
        <span className="cut-word" key={w} aria-hidden="true">
          {word.split("").map((ch) => {
            const i = n++;
            const src = letterSrc(ch);
            if (!src) return <span key={i} className="cut-gap" />;
            return (
              <img
                key={i}
                src={src}
                alt=""
                className="cut-l"
                draggable="false"
                style={{
                  "--r": `${jitter(seed + i, 7)}deg`,
                  "--y": `${jitter(seed + i * 3, 0.07)}em`,
                  "--s": 0.86 + ((jitter(seed + i * 7, 1) + 1) / 2) * 0.28,
                  "--i": i,
                  "--cd": `${delay}ms`,
                }}
              />
            );
          })}
        </span>
      ))}
    </span>
  );
}

/* A pencil line that draws itself once its section is in view. */
function Line({ d, w = 1.6, delay = 0, className = "" }) {
  return <path className={`pl ${className}`} d={d} pathLength="1" strokeWidth={w} style={{ "--pd": `${delay}ms` }} />;
}

const D = {
  frame: "M10 12 C 160 6, 420 14, 590 9 M 588 6 C 594 120, 586 260, 592 392 M 594 390 C 420 396, 180 388, 8 394 M 12 398 C 6 260, 14 120, 9 8",
  hatch: Array.from({ length: 14 }, (_, i) => `M${i * 12} 60 L ${i * 12 + 40} 0`).join(" "),
  arrow: "M4 60 C 30 18, 90 6, 140 26 M 124 12 L 142 27 L 120 36",
  loop: "M6 30 C 30 2, 60 2, 52 26 C 44 50, 14 40, 30 22 C 46 6, 90 14, 120 30",
  star: "M30 4 L 37 24 L 58 24 L 41 37 L 48 58 L 30 45 L 12 58 L 19 37 L 2 24 L 23 24 Z",
  underline: "M2 10 C 50 4, 110 14, 170 7 S 260 11, 300 6",
  scribble: "M4 20 C 20 4, 30 36, 46 18 S 70 4, 84 22 S 108 34, 122 14",
  pencil: "M10 90 L 66 34 L 82 50 L 26 106 Z M10 90 L 4 112 L 26 106 M58 42 L 74 58 M66 34 L 76 24 Q 82 18 88 24 L 92 28 Q 98 34 92 40 L 82 50",
};

/* One-time intro: the grid sketches in, a frame gets roughed out, the title gets pasted down, page turns. */
function Intro({ onDone }) {
  const [phase, setPhase] = useState("draw");
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("turn"), 2300);
    const t2 = setTimeout(onDone, 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  return (
    <div className={`sk-intro is-${phase}`} onClick={onDone} role="presentation">
      <svg className="sk-intro-grid" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="sk-intro-wobble"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="5" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="5" /></filter>
        </defs>
        <g filter="url(#sk-intro-wobble)">
        {Array.from({ length: 9 }, (_, i) => (
          <Line key={`h${i}`} d={`M0 ${60 + i * 60} C 300 ${58 + i * 60 + jitter(i, 3)}, 700 ${62 + i * 60}, 1000 ${60 + i * 60 + jitter(i + 9, 3)}`} w={0.8} delay={i * 45} />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <Line key={`v${i}`} d={`M${60 + i * 60} 0 C ${58 + i * 60 + jitter(i, 3)} 250, ${62 + i * 60} 400, ${60 + i * 60} 600`} w={0.8} delay={120 + i * 30} />
        ))}
        </g>
      </svg>
      <div className="sk-intro-center">
        <svg className="sk-intro-frame" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true">
          <Line d={D.frame} w={2.2} delay={500} />
          <g className="sk-intro-hatch"><Line d={D.hatch} w={1} delay={1300} /></g>
        </svg>
        <Cutout text="SKETCHBOOK" size={1.25} seed={3} className="sk-intro-word" delay={900} />
        <p className="sk-pencil-hand sk-intro-sign">ashvini · since 2017</p>
      </div>
      <span className="sk-intro-skip">tap to skip</span>
    </div>
  );
}

function Sketches() {
  const [params] = useSearchParams();
  const pageRef = useRef(null);
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(null);
  const [intro, setIntro] = useState(() => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      if (sessionStorage.getItem("sk-intro-seen")) return false;
    } catch { /* storage off: just play it */ }
    return true;
  });
  const endIntro = useCallback(() => {
    setIntro(false);
    try { sessionStorage.setItem("sk-intro-seen", "1"); } catch { /* fine */ }
  }, []);

  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const root = pageRef.current;
    if (!root || intro) return undefined;
    const targets = root.querySelectorAll(".sk-anim");
    if (!("IntersectionObserver" in window)) { targets.forEach((el) => el.classList.add("is-in")); return undefined; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { root, threshold: 0.12 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [intro]);

  useEffect(() => {
    const type = params.get("type");
    const target = type && pageRef.current?.querySelector(`#sk-${CSS.escape(type)}`);
    if (!target || intro) return undefined;
    const timer = setTimeout(() => target.scrollIntoView({ block: "start" }), 60);
    return () => clearTimeout(timer);
  }, [params, intro]);

  const item = open ? open.list[open.index] : null;
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((delta) => setOpen((o) => (o ? { ...o, index: (o.index + delta + o.list.length) % o.list.length } : o)), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (item && !dialog.open) dialog.showModal();
    if (!item && dialog.open) dialog.close();
  }, [item]);

  useEffect(() => {
    if (!item) return undefined;
    const onKey = (e) => { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, step]);

  const scrollTo = (id) => pageRef.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const hero = bySlug("batman-part-ii-akira");
  const sheetNo = (s) => String(s.id).padStart(2, "0");
  const chapterWord = { posters: "POSTERS", characters: "CHARACTERS", paper: "ON PAPER", portraits: "FACES" };
  const chapterNote = {
    posters: "posters for films i'd queue up for",
    characters: "stills i paused on and couldn't let go of",
    paper: "pencil, ink, eraser crumbs · 2017 to 2020",
    portraits: "people. me, once.",
  };

  return (
    <>
      <HeaderNav />
      {intro && <Intro onDone={endIntro} />}
      <div className={`sk-page ${intro ? "is-waiting" : "is-live"}`} ref={pageRef}>
        <svg className="sk-paper" aria-hidden="true">
          <defs>
            <filter id="sk-wobble" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="11" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
            </filter>
            <filter id="sk-rough">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="4" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" />
            </filter>
            <filter id="sk-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="2" />
              <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.38  0 0 0 0 0.35  0 0 0 0.07 0" />
            </filter>
            <filter id="sk-smudge"><feGaussianBlur stdDeviation="28" /></filter>
            <pattern id="sk-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0 L0 0 0 40" fill="none" stroke="#8b929b" strokeWidth="0.6" strokeOpacity="0.26" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sk-grid)" filter="url(#sk-wobble)" />
          <ellipse cx="82%" cy="18%" rx="180" ry="90" fill="#9aa0a6" opacity="0.045" filter="url(#sk-smudge)" />
          <ellipse cx="12%" cy="78%" rx="220" ry="110" fill="#9aa0a6" opacity="0.04" filter="url(#sk-smudge)" />
          <rect width="100%" height="100%" filter="url(#sk-grain)" />
        </svg>
        <div className="sk-margin" aria-hidden="true" />

        {/* ---------- hero ---------- */}
        <section className="sk-hero sk-anim" aria-labelledby="sk-title">
          <div className="sk-hero-copy">
            <p className="sk-pencil-hand sk-kicker">the stuff I draw for myself (and sometimes for money)</p>
            <h1 id="sk-title" className="sk-h1">
              <Cutout text="SKETCHBOOK" size={1} seed={3} delay={150} />
            </h1>
            <svg className="sk-h1-under" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden="true"><Line d={D.underline} w={2} delay={900} /></svg>
            <p className="sk-type sk-lede">
              Started with a Deadpool sketch in 2017 and never really stopped. Graphite first, then ink
              covers people actually paid for, and these days mostly Photoshop, one movie still at a time.
            </p>
            <div className="sk-actions">
              <button type="button" className="sk-btn" onClick={() => scrollTo("sk-posters")}>flip through ↓</button>
              <a className="sk-btn sk-btn-alt" href={CONTRA_PROFILE} target="_blank" rel="noreferrer">commission a piece ↗</a>
            </div>
            <ul className="sk-margin-notes sk-pencil-hand" aria-label="Quick facts">
              <li>2017: first sketch (Deadpool, obviously)</li>
              <li>2018: 16 hours on one Venom</li>
              <li>2020: first paid ink covers</li>
            </ul>
          </div>

          <figure className="sk-pin sk-hero-pin" style={{ "--t": "3deg" }}>
            <span className="sk-tape" style={{ "--tr": "-28deg", left: "-20px", top: "-12px" }} />
            <span className="sk-tape" style={{ "--tr": "34deg", right: "-22px", top: "-10px" }} />
            <button type="button" className="sk-pin-img" onClick={() => setOpen({ list: sketches, index: hero.id - 1 })} aria-label={`Open ${hero.title}`}>
              <picture>
                <source srcSet={hero.thumbAvif} type="image/avif" />
                <img src={hero.thumbWebp} alt={`${hero.title}, ${hero.medium}, ${hero.year}, by Ashvini Kumar`} />
              </picture>
            </button>
            <figcaption className="sk-pencil-hand sk-pin-cap">{hero.title.toLowerCase()} · {hero.year}</figcaption>
            <p className="sk-pencil-hand sk-callout">newest one ↓</p>
            <svg className="sk-callout-loop" viewBox="0 0 130 50" aria-hidden="true"><Line d={D.loop} w={1.6} delay={1200} /></svg>
          </figure>

          <svg className="sk-doodle sk-d-pencil" viewBox="0 0 100 116" aria-hidden="true"><Line d={D.pencil} w={1.6} delay={600} /></svg>
          <svg className="sk-doodle sk-d-star" viewBox="0 0 60 60" aria-hidden="true"><Line d={D.star} w={1.4} delay={1400} /></svg>
          <svg className="sk-doodle sk-d-hatch" viewBox="0 0 170 60" aria-hidden="true"><Line d={D.hatch} w={0.9} delay={800} /></svg>
        </section>

        {/* ---------- tabs ---------- */}
        <nav className="sk-tabs" aria-label="Sketchbook sections">
          {SKETCH_CHAPTERS.map((c, i) => (
            <button key={c.id} type="button" onClick={() => scrollTo(`sk-${c.id}`)} style={{ "--t": `${jitter(i + 2, 1.4)}deg` }}>
              {chapterWord[c.id].toLowerCase()}
            </button>
          ))}
          <button type="button" onClick={() => scrollTo("sk-journey")} style={{ "--t": "1deg" }}>how it started</button>
        </nav>

        {/* ---------- chapters ---------- */}
        {SKETCH_CHAPTERS.map((c, ci) => {
          const list = sketches.filter((s) => s.chapter === c.id);
          return (
            <section className="sk-chapter sk-anim" id={`sk-${c.id}`} key={c.id} aria-labelledby={`sk-h-${c.id}`}>
              <header className="sk-chapter-head">
                <h2 id={`sk-h-${c.id}`} className="sk-h2"><Cutout text={chapterWord[c.id]} size={0.62} seed={ci * 13 + 5} /></h2>
                <p className="sk-pencil-hand sk-chapter-note">{chapterNote[c.id]}</p>
                <svg className="sk-chapter-scribble" viewBox="0 0 126 40" aria-hidden="true"><Line d={D.scribble} w={1.4} delay={400} /></svg>
              </header>
              <div className={`sk-board sk-board-${c.id}`}>
                {list.map((s, i) => (
                  <figure className="sk-pin" key={s.slug} style={{ "--t": `${jitter(i + ci * 7, 1.8)}deg`, "--d": `${Math.min(i, 8) * 70}ms` }}>
                    <span className="sk-tape" style={{ "--tr": `${i % 2 ? 30 : -30}deg`, [i % 2 ? "right" : "left"]: "-18px", top: "-12px" }} />
                    <button type="button" className="sk-pin-img" onClick={() => setOpen({ list, index: i })} aria-label={`Open ${s.title}`}>
                      <picture>
                        <source srcSet={s.thumbAvif} type="image/avif" />
                        <img src={s.thumbWebp} alt={`${s.title}, ${s.medium}, ${s.year}, by Ashvini Kumar`} loading="lazy" decoding="async" />
                      </picture>
                    </button>
                    <figcaption>
                      <span className="sk-pencil-hand sk-pin-cap">{s.title.toLowerCase()}</span>
                      <span className="sk-type sk-pin-meta">no.{sheetNo(s)} · {s.medium.toLowerCase()} · {s.year}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          );
        })}

        {/* ---------- how it started ---------- */}
        <section className="sk-journey sk-anim" id="sk-journey" aria-labelledby="sk-journey-title">
          <h2 id="sk-journey-title" className="sk-h2"><Cutout text="HOW IT STARTED" size={0.5} seed={41} /></h2>
          <ol className="sk-line">
            <svg className="sk-line-draw" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
              <Line d="M4 22 C 120 10, 220 32, 340 20 S 560 12, 680 24 S 880 30, 996 18" w={1.6} delay={200} />
            </svg>
            {SKETCH_TIMELINE.map((t, i) => {
              const s = bySlug(t.slug);
              return (
                <li key={t.year} style={{ "--d": `${300 + i * 200}ms`, "--t": `${jitter(i + 30, 3)}deg` }}>
                  <span className="sk-dot" />
                  <span className="sk-pencil-hand sk-year">{t.year}</span>
                  <button type="button" className="sk-scrap" onClick={() => setOpen({ list: sketches, index: s.id - 1 })} aria-label={`Open ${s.title}`}>
                    <img src={s.thumbWebp} alt={`${s.title} (${t.year})`} loading="lazy" />
                  </button>
                  <span className="sk-pencil-hand sk-tnote">{t.note}</span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ---------- closing ---------- */}
        <section className="sk-close sk-anim">
          <h2 className="sk-h2"><Cutout text="WANT ONE" size={0.7} seed={57} /></h2>
          <p className="sk-pencil-hand sk-close-note">posters, covers, portraits, your favourite character. dm is open.</p>
          <div className="sk-actions sk-actions-center">
            <a className="sk-btn" href={CONTRA_PROFILE} target="_blank" rel="noreferrer">commission a piece ↗</a>
            <a className="sk-btn sk-btn-alt" href="https://instagram.com/ashvini_kmr" target="_blank" rel="noreferrer">@ashvini_kmr ↗</a>
          </div>
          <p className="sk-type sk-other">
            other sides of me: <TransitionLink to="/portfolio">3d &amp; web3d</TransitionLink> · <TransitionLink to="/editorial">social &amp; editorial</TransitionLink>
          </p>
          <svg className="sk-doodle sk-d-arrow" viewBox="0 0 150 70" aria-hidden="true"><Line d={D.arrow} w={1.6} delay={300} /></svg>
        </section>
      </div>

      <dialog
        ref={dialogRef}
        className="sk-lightbox"
        onClose={close}
        onClick={(e) => { if (e.target === dialogRef.current) close(); }}
        aria-label={item ? item.title : "Artwork"}
      >
        {item && (
          <div className="sk-lightbox-inner">
            <img src={item.full} alt={`${item.title}, ${item.medium}, ${item.year}, by Ashvini Kumar`} />
            <div className="sk-lightbox-copy">
              <span className="sk-type">no.{sheetNo(item)} · {item.year}</span>
              <h2 className="sk-pencil-hand">{item.title.toLowerCase()}</h2>
              <p className="sk-type">{item.note}</p>
              <p className="sk-type sk-lb-medium">{item.medium}</p>
              <a className="sk-type" href={item.url} target="_blank" rel="noreferrer">on instagram ↗</a>
              <div className="sk-lightbox-nav">
                <button type="button" onClick={() => step(-1)} aria-label="Previous">←</button>
                <span className="sk-type">{open.index + 1} / {open.list.length}</span>
                <button type="button" onClick={() => step(1)} aria-label="Next">→</button>
              </div>
            </div>
            <button type="button" className="sk-lightbox-close" onClick={close} aria-label="Close">×</button>
          </div>
        )}
      </dialog>
    </>
  );
}

export default Sketches;
