import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HeaderNav from "./HeaderNav.jsx";
import TransitionLink from "./TransitionLink.jsx";
import { CONTRA_PROFILE } from "../data/projects.js";
import { EDITORIAL_CATEGORIES, editorialPosts } from "../data/editorial.js";

// Social & editorial design, separate from the 3D grid so a recruiter hiring for
// social/graphic roles lands on exactly that work. ?type=<category> deep-links a filter.
function Editorial() {
  const [params, setParams] = useSearchParams();
  const type = EDITORIAL_CATEGORIES.some((c) => c.id === params.get("type")) ? params.get("type") : "all";
  const visible = type === "all" ? editorialPosts : editorialPosts.filter((p) => p.category === type);
  const activeCategory = EDITORIAL_CATEGORIES.find((c) => c.id === type);

  const [openIndex, setOpenIndex] = useState(null);
  const dialogRef = useRef(null);
  const open = openIndex == null ? null : visible[openIndex];

  const setType = (id) => {
    const next = new URLSearchParams(params);
    if (id === "all") next.delete("type");
    else next.set("type", id);
    setParams(next, { replace: true });
  };

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta) => setOpenIndex((i) => (i == null ? i : (i + delta + visible.length) % visible.length)),
    [visible.length],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  const categoryLabel = (id) => EDITORIAL_CATEGORIES.find((c) => c.id === id)?.label ?? "";

  return (
    <>
      <HeaderNav />
      <div className="editorial-page">
        <header className="editorial-hero">
          <p className="editorial-eyebrow reveal">For media, entertainment and social teams</p>
          <h1 className="reveal" style={{ "--d": "60ms" }}>Social &amp; editorial design</h1>
          <p className="editorial-lede reveal" style={{ "--d": "120ms" }}>
            Six years designing the covers, thumbnails and social posts that pop-culture
            publishers ship every day: fast, on-brand, and built to stop the scroll.
          </p>
          <dl className="editorial-facts reveal" style={{ "--d": "180ms" }}>
            <div><dt>6 yrs</dt><dd>editorial &amp; social design</dd></div>
            <div><dt>FandomWire · Animated Times</dt><dd>pop-culture publishers</dd></div>
            <div><dt>Photoshop · Illustrator · Premiere · After Effects</dt><dd>daily tools</dd></div>
          </dl>
          <div className="detail-actions reveal" style={{ "--d": "240ms" }}>
            <a className="cta" href={CONTRA_PROFILE} target="_blank" rel="noreferrer">
              Hire Ashvini for social &amp; editorial
            </a>
            <TransitionLink className="cta cta-outline" to="/portfolio">
              See 3D &amp; Web3D work
            </TransitionLink>
          </div>
        </header>

        <nav className="editorial-filter" aria-label="Filter work by type">
          <button type="button" aria-pressed={type === "all"} onClick={() => setType("all")}>
            All <span>{editorialPosts.length}</span>
          </button>
          {EDITORIAL_CATEGORIES.map((c) => (
            <button key={c.id} type="button" aria-pressed={type === c.id} onClick={() => setType(c.id)}>
              {c.label} <span>{editorialPosts.filter((p) => p.category === c.id).length}</span>
            </button>
          ))}
        </nav>
        <p className="editorial-blurb" aria-live="polite">
          {activeCategory ? activeCategory.blurb : "Selected posts designed for FandomWire. Tap any piece to see it full size."}
        </p>

        <ul className="editorial-grid">
          {visible.map((post, index) => (
            <li key={post.slug} className="reveal" style={{ "--d": `${Math.min(index, 8) * 45}ms` }}>
              <button type="button" className="editorial-card" onClick={() => setOpenIndex(index)}>
                <picture>
                  <source srcSet={post.thumbAvif} type="image/avif" />
                  <img
                    src={post.thumbWebp}
                    alt={`${post.title}, social post designed for ${post.client}`}
                    width="540"
                    height="675"
                    loading={index < 6 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </picture>
                <span className="editorial-card-meta">
                  <span>{categoryLabel(post.category)}</span>
                  <strong>{post.title}</strong>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <footer className="editorial-foot">
          <p>Designed for FandomWire's Instagram and Facebook. Each piece links to the original post.</p>
          <div className="case-studies">
            <TransitionLink to="/portfolio"><span>Interactive 3D &amp; Web3D work</span><span aria-hidden="true">→</span></TransitionLink>
            <TransitionLink to="/about"><span>About Ashvini</span><span aria-hidden="true">→</span></TransitionLink>
            <a href={CONTRA_PROFILE} target="_blank" rel="noreferrer"><span>Start a project on Contra</span><span aria-hidden="true">↗</span></a>
          </div>
        </footer>
      </div>

      <dialog
        ref={dialogRef}
        className="editorial-lightbox"
        onClose={close}
        onClick={(event) => { if (event.target === dialogRef.current) close(); }}
        aria-label={open ? open.title : "Post preview"}
      >
        {open && (
          <div className="editorial-lightbox-inner">
            <img src={open.full} alt={`${open.title}, social post designed for ${open.client}`} width="1080" height="1350" />
            <div className="editorial-lightbox-copy">
              <span>{categoryLabel(open.category)} · {open.client}</span>
              <h2>{open.title}</h2>
              <p>{open.note}</p>
              <a href={open.url} target="_blank" rel="noreferrer">
                View original on {open.platform} <span aria-hidden="true">↗</span>
              </a>
              <div className="editorial-lightbox-nav">
                <button type="button" onClick={() => step(-1)} aria-label="Previous piece">←</button>
                <span>{openIndex + 1} / {visible.length}</span>
                <button type="button" onClick={() => step(1)} aria-label="Next piece">→</button>
              </div>
            </div>
            <button type="button" className="editorial-lightbox-close" onClick={close} aria-label="Close">×</button>
          </div>
        )}
      </dialog>
    </>
  );
}

export default Editorial;
