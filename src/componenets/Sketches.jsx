import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HeaderNav from "./HeaderNav.jsx";
import TransitionLink from "./TransitionLink.jsx";
import { CONTRA_PROFILE } from "../data/projects.js";
import { SKETCH_CHAPTERS, SKETCH_TIMELINE, sketches } from "../data/sketches.js";

// The artist side: a separate visual world from the dark 3D/editorial site.
// Paper, a pencil-drawn grid, drafting sheets with title blocks, and doodles that draw themselves.

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500&display=swap";
const bySlug = (slug) => sketches.find((s) => s.slug === slug);
const tilt = (i) => [-1.4, 0.9, -0.6, 1.3, -1.1, 0.5, 1.6, -0.8][i % 8];

/* A pencil stroke that draws itself when its section scrolls into view (pathLength=1 trick). */
function Stroke({ d, w = 2, delay = 0, className = "" }) {
  return <path className={`sk-stroke ${className}`} d={d} pathLength="1" strokeWidth={w} style={{ "--sd": `${delay}ms` }} />;
}

const Doodles = {
  underline: "M4 14 C 60 6, 120 18, 180 9 S 280 12, 316 7",
  circle: "M150 8 C 60 2, 6 30, 14 58 C 24 92, 150 104, 246 86 C 318 72, 312 22, 238 10 C 196 3, 160 6, 120 14",
  arrowCurve: "M6 70 C 40 20, 110 6, 168 30",
  arrowHead: "M150 14 L 170 31 L 146 40",
  star: "M30 4 L 37 24 L 58 24 L 41 37 L 48 58 L 30 45 L 12 58 L 19 37 L 2 24 L 23 24 Z",
  spiral: "M40 40 m -4 0 a 4 4 0 1 1 8 0 a 8 8 0 1 1 -16 0 a 13 13 0 1 1 26 0 a 18 18 0 1 1 -36 0 a 23 23 0 1 1 46 0",
  squiggle: "M2 20 q 10 -18 20 0 t 20 0 t 20 0 t 20 0 t 20 0",
  cross: "M4 4 L 20 20 M 20 4 L 4 20",
  pencilBody: "M8 92 L 70 30 L 86 46 L 24 108 Z",
  pencilTip: "M8 92 L 2 114 L 24 108",
  pencilBand: "M62 38 L 78 54",
  pencilEraser: "M70 30 L 80 20 Q 86 14 92 20 L 96 24 Q 102 30 96 36 L 86 46",
  pencilLine: "M2 114 C 60 120, 140 104, 230 116 S 360 110, 420 118",
};

function Sketches() {
  const [params] = useSearchParams();
  const pageRef = useRef(null);
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(null); // { list, index }

  // fonts for this page only
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  // draw doodles / reveal sheets as sections enter the viewport
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;
    const targets = root.querySelectorAll(".sk-anim");
    if (!("IntersectionObserver" in window)) { targets.forEach((el) => el.classList.add("is-in")); return undefined; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { root, threshold: 0.15 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // deep link: /sketches?type=paper
  useEffect(() => {
    const type = params.get("type");
    const target = type && pageRef.current?.querySelector(`#sk-${CSS.escape(type)}`);
    if (!target) return undefined;
    const timer = setTimeout(() => target.scrollIntoView({ block: "start" }), 60);
    return () => clearTimeout(timer);
  }, [params]);

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

  return (
    <>
      <HeaderNav />
      <div className="sk-page" ref={pageRef}>
        {/* paper: grain + a grid drawn in pencil (the displacement filter makes every line wobble) */}
        <svg className="sk-paper" aria-hidden="true">
          <defs>
            <filter id="sk-pencil" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" />
            </filter>
            <filter id="sk-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3" />
              <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.33  0 0 0 0 0.3  0 0 0 0.09 0" />
            </filter>
            <pattern id="sk-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M36 0 L0 0 0 36" fill="none" stroke="#7d8692" strokeWidth="0.7" strokeOpacity="0.32" />
            </pattern>
            <pattern id="sk-grid-major" width="180" height="180" patternUnits="userSpaceOnUse">
              <path d="M180 0 L0 0 0 180" fill="none" stroke="#5f6874" strokeWidth="1.1" strokeOpacity="0.28" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sk-grid)" filter="url(#sk-pencil)" />
          <rect width="100%" height="100%" fill="url(#sk-grid-major)" filter="url(#sk-pencil)" />
          <rect width="100%" height="100%" filter="url(#sk-grain)" />
        </svg>
        <div className="sk-ruler" aria-hidden="true" />
        <div className="sk-margin" aria-hidden="true" />

        {/* ---------- hero ---------- */}
        <section className="sk-hero sk-anim" aria-labelledby="sk-title">
          <div className="sk-hero-copy">
            <p className="sk-hand sk-kicker">the artist side of Ashvini Kumar</p>
            <h1 id="sk-title" className="sk-serif">
              <span className="sk-mark">
                Pencil
                <svg className="sk-under" viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden="true"><Stroke d={Doodles.underline} w={3.2} delay={500} /></svg>
              </span>{" "}
              first.
              <br />
              <span className="sk-mark">
                <em>Pixels</em>
                <svg className="sk-ring" viewBox="0 0 320 110" preserveAspectRatio="none" aria-hidden="true"><Stroke d={Doodles.circle} w={2.4} delay={900} /></svg>
              </span>{" "}
              later.
            </h1>
            <p className="sk-lede">
              Before the 3D and the newsroom work, there was a sketchbook. I started with graphite fan art
              back in school, took paid ink commissions by 2020, and these days I paint the film posters and
              characters I can't stop thinking about.
            </p>
            <div className="sk-actions">
              <button type="button" className="sk-btn sk-btn-ink" onClick={() => scrollTo("sk-posters")}>Open the sketchbook ↓</button>
              <a className="sk-btn" href={CONTRA_PROFILE} target="_blank" rel="noreferrer">Commission a piece ↗</a>
            </div>
            <dl className="sk-stamps">
              <div><dt>2017</dt><dd>first posted sketch</dd></div>
              <div><dt>169</dt><dd>posts on Instagram</dd></div>
              <div><dt>Photoshop · graphite · ink</dt><dd>tools</dd></div>
            </dl>
          </div>

          <figure className="sk-hero-sheet" style={{ "--tilt": "2.2deg" }}>
            <span className="sk-tape sk-tape-tl" /><span className="sk-tape sk-tape-br" />
            <button type="button" className="sk-sheet-img" onClick={() => setOpen({ list: sketches, index: hero.id - 1 })} aria-label={`Open ${hero.title}`}>
              <picture>
                <source srcSet={hero.thumbAvif} type="image/avif" />
                <img src={hero.thumbWebp} alt={`${hero.title}, ${hero.medium}, ${hero.year}, by Ashvini Kumar`} />
              </picture>
            </button>
            <figcaption className="sk-titleblock">
              <span><b>SHEET</b>{sheetNo(hero)}</span><span><b>TITLE</b>{hero.title}</span><span><b>YEAR</b>{hero.year}</span>
            </figcaption>
            <p className="sk-hand sk-note sk-note-hero">latest piece!</p>
            <svg className="sk-arrow sk-arrow-hero" viewBox="0 0 180 80" aria-hidden="true">
              <Stroke d={Doodles.arrowCurve} delay={1400} /><Stroke d={Doodles.arrowHead} delay={1900} />
            </svg>
          </figure>

          {/* the pencil drawing its own line */}
          <svg className="sk-pencil" viewBox="0 0 430 124" aria-hidden="true">
            <Stroke d={Doodles.pencilLine} w={2} delay={200} className="sk-graphite" />
            <g className="sk-pencil-body">
              <Stroke d={Doodles.pencilBody} w={2.2} delay={300} />
              <Stroke d={Doodles.pencilTip} w={2.2} delay={500} />
              <Stroke d={Doodles.pencilBand} w={2.2} delay={600} />
              <Stroke d={Doodles.pencilEraser} w={2.2} delay={700} />
            </g>
          </svg>
          <svg className="sk-doodle sk-star" viewBox="0 0 60 60" aria-hidden="true"><Stroke d={Doodles.star} delay={1100} /></svg>
          <svg className="sk-doodle sk-spiral" viewBox="0 0 80 80" aria-hidden="true"><Stroke d={Doodles.spiral} delay={1300} /></svg>
          <svg className="sk-doodle sk-x" viewBox="0 0 24 24" aria-hidden="true"><Stroke d={Doodles.cross} delay={1500} /></svg>
        </section>

        {/* ---------- index tabs ---------- */}
        <nav className="sk-tabs" aria-label="Sketchbook sections">
          {SKETCH_CHAPTERS.map((c, i) => (
            <button key={c.id} type="button" onClick={() => scrollTo(`sk-${c.id}`)} style={{ "--tilt": `${tilt(i) * 0.6}deg` }}>
              <span className="sk-hand">0{i + 1}</span> {c.label}
            </button>
          ))}
          <button type="button" onClick={() => scrollTo("sk-journey")} style={{ "--tilt": "-0.5deg" }}><span className="sk-hand">→</span> The journey</button>
        </nav>

        {/* ---------- chapters ---------- */}
        {SKETCH_CHAPTERS.map((c, ci) => {
          const list = sketches.filter((s) => s.chapter === c.id);
          return (
            <section className="sk-chapter sk-anim" id={`sk-${c.id}`} key={c.id} aria-labelledby={`sk-h-${c.id}`}>
              <header className="sk-chapter-head">
                <span className="sk-num sk-hand">
                  0{ci + 1}
                  <svg viewBox="0 0 320 110" preserveAspectRatio="none" aria-hidden="true"><Stroke d={Doodles.circle} w={2} delay={200} /></svg>
                </span>
                <div>
                  <h2 id={`sk-h-${c.id}`} className="sk-serif">{c.label}</h2>
                  <p className="sk-hand sk-blurb">{c.blurb}</p>
                </div>
                <svg className="sk-squiggle" viewBox="0 0 104 30" aria-hidden="true"><Stroke d={Doodles.squiggle} delay={500} /></svg>
              </header>
              <div className={`sk-sheets sk-sheets-${c.id}`}>
                {list.map((s, i) => (
                  <figure className="sk-sheet" key={s.slug} style={{ "--tilt": `${tilt(i + ci)}deg`, "--d": `${Math.min(i, 8) * 70}ms` }}>
                    <span className={`sk-tape ${i % 2 ? "sk-tape-tr" : "sk-tape-tl"}`} />
                    <button type="button" className="sk-sheet-img" onClick={() => setOpen({ list, index: i })} aria-label={`Open ${s.title}`}>
                      <picture>
                        <source srcSet={s.thumbAvif} type="image/avif" />
                        <img src={s.thumbWebp} alt={`${s.title}, ${s.medium}, ${s.year}, by Ashvini Kumar`} loading="lazy" decoding="async" />
                      </picture>
                    </button>
                    <figcaption className="sk-titleblock">
                      <span><b>SHEET</b>{sheetNo(s)}/{String(sketches.length).padStart(2, "0")}</span>
                      <span className="sk-tb-title"><b>TITLE</b>{s.title}</span>
                      <span><b>MEDIUM</b>{s.medium}</span>
                      <span><b>YEAR</b>{s.year}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          );
        })}

        {/* ---------- journey ---------- */}
        <section className="sk-journey sk-anim" id="sk-journey" aria-labelledby="sk-journey-title">
          <h2 id="sk-journey-title" className="sk-serif">From graphite to Photoshop</h2>
          <p className="sk-hand sk-blurb">since 2017, one sketchbook at a time</p>
          <ol className="sk-line">
            <svg className="sk-line-draw" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
              <Stroke d="M4 22 C 120 10, 220 32, 340 20 S 560 12, 680 24 S 880 30, 996 18" w={2.2} delay={200} />
            </svg>
            {SKETCH_TIMELINE.map((t, i) => {
              const s = bySlug(t.slug);
              return (
                <li key={t.year} style={{ "--d": `${300 + i * 220}ms`, "--tilt": `${tilt(i) * 1.6}deg` }}>
                  <span className="sk-dot" />
                  <span className="sk-year sk-hand">{t.year}</span>
                  <button type="button" className="sk-polaroid" onClick={() => setOpen({ list: sketches, index: s.id - 1 })} aria-label={`Open ${s.title}`}>
                    <img src={s.thumbWebp} alt={`${s.title} (${t.year})`} loading="lazy" />
                  </button>
                  <span className="sk-hand sk-tnote">{t.note}</span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ---------- closing ---------- */}
        <section className="sk-close sk-anim">
          <svg className="sk-doodle sk-close-star" viewBox="0 0 60 60" aria-hidden="true"><Stroke d={Doodles.star} delay={200} /></svg>
          <h2 className="sk-serif">Want something drawn?</h2>
          <p className="sk-lede">Posters, covers, portraits and character art. I take commissions, and I'm on Instagram most days.</p>
          <div className="sk-actions sk-actions-center">
            <a className="sk-btn sk-btn-ink" href={CONTRA_PROFILE} target="_blank" rel="noreferrer">Commission a piece ↗</a>
            <a className="sk-btn" href="https://instagram.com/ashvini_kmr" target="_blank" rel="noreferrer">@ashvini_kmr on Instagram ↗</a>
          </div>
          <p className="sk-hand sk-other">
            the other sides: <TransitionLink to="/portfolio">3D &amp; Web3D</TransitionLink> · <TransitionLink to="/editorial">social &amp; editorial</TransitionLink>
          </p>
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
              <span className="sk-hand">sheet {sheetNo(item)}</span>
              <h2 className="sk-serif">{item.title}</h2>
              <p>{item.note}</p>
              <p className="sk-mono">{item.medium} · {item.year}</p>
              <a href={item.url} target="_blank" rel="noreferrer">See it on Instagram ↗</a>
              <div className="sk-lightbox-nav">
                <button type="button" onClick={() => step(-1)} aria-label="Previous">←</button>
                <span className="sk-mono">{open.index + 1} / {open.list.length}</span>
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
