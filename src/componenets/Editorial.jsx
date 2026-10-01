import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HeaderNav from "./HeaderNav.jsx";
import TransitionLink from "./TransitionLink.jsx";
import { CONTRA_PROFILE, projects } from "../data/projects.js";
import { EDITORIAL_CATEGORIES, editorialPosts } from "../data/editorial.js";
import { getSiteProfile } from "../data/siteProfile.js";
import SketchLightboxImage from "./SketchLightboxImage.jsx";
import ArtworkWarning from "./ArtworkWarning.jsx";
import { moveGallerySelection } from "../lib/galleryNavigation.js";
import { mayPreloadArtwork, needsArtworkConsent } from "../lib/artworkConsent.js";
import { fullSketchImages, warmSketchNeighbors } from "../lib/sketchImageCache.js";

const byCategory = (id) => editorialPosts.filter((p) => p.category === id);
// a few 3D pieces to show the other half of the work, linking into the grid
const otherHalf = ["nothing-headphones", "teenage-engineering-tp7", "heygen-glass", "worklouder-keypad"]
  .map((slug) => projects.find((p) => p.slug === slug))
  .filter(Boolean);

function Thumb({ post, eager = false, className = "" }) {
  return (
    <picture className={`${className}${post.nsfw ? " is-sensitive" : ""}`}>
      <source srcSet={post.thumbAvif} type="image/avif" />
      <img
        src={post.thumbWebp}
        alt={`${post.title}, social post${post.client ? ` designed for ${post.client}` : ""}`}
        width={post.width || 540}
        height={post.height || 675}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable="false"
      />
    </picture>
  );
}

// Social & editorial design: separate from the 3D grid so a recruiter hiring for social,
// editorial or thumbnail roles lands on exactly that work. ?type=<category> jumps to a chapter.
function Editorial() {
  const [params] = useSearchParams();
  const profile = getSiteProfile();
  const { publishers, audienceLabel, audienceChecked } = profile;
  const pageRef = useRef(null);
  const dialogRef = useRef(null);
  const backdropPress = useRef(false);
  const [lightbox, setLightbox] = useState(null); // { list, index }
  const [arrivedFromPaper] = useState(() => document.documentElement.dataset.vt === "paper-out");

  // hero wall: four columns, each a different rotation of the posts
  const columns = useMemo(() => {
    const n = editorialPosts.length;
    return [0, 4, 8, 11].map((offset) => Array.from({ length: Math.min(n, 12) }, (_, i) => editorialPosts[(i + offset) % n]));
  }, []);

  const openPost = (list, index) => setLightbox({ list, index, frameIndex: 0 });
  const close = useCallback(() => setLightbox(null), [setLightbox]);
  const step = useCallback((delta) => setLightbox((selection) => moveGallerySelection(selection, delta)), [setLightbox]);
  const open = lightbox ? lightbox.list[lightbox.index] : null;
  const frameCount = open?.frames?.length || 1;
  const frameIndex = lightbox?.frameIndex || 0;
  const frame = open ? { ...open, ...open.frames?.[frameIndex], slug: `${open.slug}-${frameIndex}` } : null;
  const needsConsent = needsArtworkConsent(open, lightbox?.consentSlug);

  const warmArtwork = (post) => { if (mayPreloadArtwork(post)) fullSketchImages.load(post.full).catch(() => {}); };

  useEffect(() => {
    if (!open || needsConsent) return;
    warmSketchNeighbors(lightbox.list, lightbox.index);
    if (frameCount > 1 && !open.nsfw) warmSketchNeighbors(open.frames, frameIndex);
  }, [open, needsConsent, lightbox, frameCount, frameIndex]);

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

  // deep link: /editorial?type=retrospectives scrolls to that chapter
  useEffect(() => {
    const type = params.get("type");
    if (!type) return;
    const target = pageRef.current?.querySelector(`#chapter-${CSS.escape(type)}`);
    // instant jump: a recruiter following a link should land on the chapter, not watch a long scroll
    if (!target) return undefined;
    const timer = setTimeout(() => target.scrollIntoView({ block: "start" }), 60);
    return () => clearTimeout(timer);
  }, [params]);

  // reveal chapters as they scroll into view
  useEffect(() => {
    const root = pageRef.current;
    if (!root || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")),
      { root, threshold: 0.18 },
    );
    root.querySelectorAll(".ed-appear").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const label = (id) => EDITORIAL_CATEGORIES.find((c) => c.id === id)?.label ?? "";
  const scrollTo = (id) => pageRef.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const highlights = editorialPosts.filter((post) => post.highlight);
  const extraCategories = EDITORIAL_CATEGORIES.filter((category) => !["news", "campaigns", "retrospectives", "data"].includes(category.id));
  const news = byCategory("news"), campaigns = byCategory("campaigns"), retro = byCategory("retrospectives"), data = byCategory("data");

  return (
    <>
      <HeaderNav />
      <div className={`ed-page${arrivedFromPaper ? " ed-from-paper" : ""}`} ref={pageRef}>
        {/* ---------- hero: a wall of the work ---------- */}
        <section className="ed-hero" aria-labelledby="ed-title">
          <div className="ed-wall" aria-hidden="true">
            {columns.map((col, c) => (
              <div className={`ed-wall-col ed-wall-col-${c + 1}`} key={c}>
                <div className="ed-wall-track">
                  {[...col, ...col].map((post, i) => (
                    <Thumb key={`${post.slug}-${i}`} post={post} eager />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="ed-hero-shade" aria-hidden="true" />
          <div className="ed-hero-copy">
            <p className="ed-kicker reveal">{profile.name} · social &amp; editorial design</p>
            <h1 id="ed-title" className="reveal" style={{ "--d": "80ms" }}>
              {profile.editorialTitle.split("\n").map((line, index) => <span className="ed-title-line" key={index}>{line}</span>)}
            </h1>
            <p className="ed-hero-lede reveal" style={{ "--d": "160ms" }}>
              {profile.editorialIntro}
            </p>
            <div className="ed-hero-actions reveal" style={{ "--d": "240ms" }}>
              <a className="cta" href={profile.contraUrl || CONTRA_PROFILE} target="_blank" rel="noreferrer">Work with me</a>
              <button type="button" className="cta cta-outline" onClick={() => scrollTo(highlights.length ? "ed-highlights" : "chapter-news")}>See the work ↓</button>
            </div>
          </div>
          <dl className="ed-stats reveal" style={{ "--d": "320ms" }}>
            <div><dt>{profile.editorialYearsLabel}</dt><dd>designing for the feed</dd></div>
            <div><dt>Daily</dt><dd>posts, on deadline</dd></div>
            <div><dt>{audienceLabel}</dt><dd>followers across the two publishers</dd></div>
            <div><dt>+ 3D</dt><dd><TransitionLink to="/portfolio">and Web3D work too →</TransitionLink></dd></div>
          </dl>
        </section>

        {/* ---------- credibility: where the work runs ---------- */}
        <section className="ed-pubs ed-appear" aria-labelledby="ed-pubs-title">
          <div className="ed-pubs-head">
            <span className="ed-pubs-eyebrow">Published work / 2020 — present</span>
            <h2 id="ed-pubs-title">{profile.editorialPubsTitle}</h2>
            <p className="ed-pubs-lede">{profile.editorialPubsNote}</p>
          </div>
          <div className="ed-pubs-grid">
            {publishers.map((p, index) => {
              const proof = editorialPosts.filter((post) => post.client === p.org && !post.nsfw && post.url).slice(0, 3);
              return <article className="ed-pub" key={p.org}>
                <header>
                  <p className="ed-pub-tenure"><span>{String(index + 1).padStart(2, "0")} / Publisher credit</span><span>{p.years}</span></p>
                  <h3>{p.org}</h3>
                  <p className="ed-pub-role">{p.role}</p>
                </header>
                <p className="ed-pub-about">{p.work}</p>
                <div className="ed-pub-proof">
                  {proof.map((post, i) => <button key={post.slug} type="button" onClick={() => openPost(proof, i)} onPointerEnter={() => warmArtwork(post)} onFocus={() => warmArtwork(post)} aria-label={`Open published ${p.org} post: ${post.title}`}>
                    <Thumb post={post} /><span>{post.title}</span>
                  </button>)}
                </div>
                <div className="ed-pub-audience-label">Publisher audience <span>Facebook / Instagram</span></div>
                <dl className="ed-pub-stats">
                  {p.stats.map((st) => <div key={st.label}><dt>{st.value}</dt><dd>{st.url ? <a href={st.url} target="_blank" rel="noreferrer">{st.label} ↗</a> : st.label}</dd></div>)}
                </dl>
              </article>;
            })}
          </div>
          <p className="ed-pubs-note">Follower counts from each publisher's public Facebook and Instagram pages, {audienceChecked}.</p>
        </section>

        {highlights.length > 0 && <section className="ed-chapter ed-appear" id="ed-highlights">
          <header className="ed-chapter-head"><span className="ed-num">Selected</span><div><h2>Highlights</h2><p>Posts from the Animated Times feed.</p></div></header>
          <div className="ed-archive-grid ed-highlights-grid">
            {highlights.map((post, i) => <button key={post.slug} type="button" className="ed-tile ed-archive-tile" onClick={() => openPost(highlights, i)} onPointerEnter={() => warmArtwork(post)} onFocus={() => warmArtwork(post)}>
              <Thumb post={post} /><span className="ed-archive-caption"><strong>{post.title}</strong><small>{post.client}{(post.frames?.length || 1) > 1 ? ` · ${(post.frames?.length || 1)} slides` : ""}</small></span>
            </button>)}
          </div>
        </section>}

        {/* ---------- chapter index ---------- */}
        <nav className="ed-index" aria-label="Chapters">
          {EDITORIAL_CATEGORIES.map((c, i) => (
            <button key={c.id} type="button" onClick={() => scrollTo(`chapter-${c.id}`)}>
              <span>0{i + 1}</span>{c.label}
            </button>
          ))}
          <button type="button" onClick={() => scrollTo("ed-feed")}><span>+</span>In the feed</button>
        </nav>

        {/* ---------- 01 news & theory covers ---------- */}
        <section className="ed-chapter ed-appear" id="chapter-news">
          <header className="ed-chapter-head">
            <span className="ed-num">01</span>
            <div>
              <h2>News &amp; theory covers</h2>
              <p>{EDITORIAL_CATEGORIES.find((category) => category.id === "news")?.blurb}</p>
            </div>
          </header>
          <div className="ed-mosaic">
            {news.map((post, i) => (
              <button key={post.slug} type="button" className={`ed-tile ed-tile-${i + 1}`} onClick={() => openPost(news, i)}>
                <Thumb post={post} />
                <span className="ed-tile-cap">{post.title}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ---------- in the feed ---------- */}
        <section className="ed-feed ed-appear" id="ed-feed">
          <div className="ed-feed-copy">
            <span className="ed-num">In the feed</span>
            <h2>I design for the thumb, not the gallery.</h2>
            <p>
              Everything I make here gets judged at phone size, in half a second, between a hundred
              other posts. So the headline leads, one image carries it, and the badge tells you what
              kind of story it is before you've read a word.
            </p>
            <ul className="ed-craft">
              <li>Headlines that still read at thumbnail size</li>
              <li>Key art built from film stills and posters</li>
              <li>Templates that keep a busy newsroom on-brand</li>
              <li>Photoshop · Illustrator · Premiere Pro · After Effects</li>
            </ul>
          </div>
          <div className="ed-phone" aria-hidden="true">
            <div className="ed-phone-screen">
              <div className="ed-phone-track">
                {[...editorialPosts.slice(0, 12), ...editorialPosts.slice(0, 12)].map((post, i) => <Thumb key={`${post.slug}-f${i}`} post={post} eager />)}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 02 reviews & campaigns ---------- */}
        <section className="ed-chapter ed-appear" id="chapter-campaigns">
          <header className="ed-chapter-head">
            <span className="ed-num">02</span>
            <div>
              <h2>Reviews &amp; campaigns</h2>
              <p>{EDITORIAL_CATEGORIES.find((category) => category.id === "campaigns")?.blurb}</p>
            </div>
          </header>
          <div className="ed-duo">
            {campaigns.map((post, i) => (
              <button key={post.slug} type="button" className="ed-tile ed-tile-tall" onClick={() => openPost(campaigns, i)}>
                <Thumb post={post} />
                <span className="ed-tile-cap">{post.title}<em>{post.note}</em></span>
              </button>
            ))}
          </div>
        </section>

        {/* ---------- 03 retrospectives: horizontal film strip ---------- */}
        <section className="ed-chapter ed-appear" id="chapter-retrospectives">
          <header className="ed-chapter-head">
            <span className="ed-num">03</span>
            <div>
              <h2>Timelines &amp; retrospectives</h2>
              <p>{EDITORIAL_CATEGORIES.find((category) => category.id === "retrospectives")?.blurb} Swipe or scroll sideways.</p>
            </div>
          </header>
          <div className="ed-strip" tabIndex={0} aria-label="Retrospective posts, scroll horizontally">
            {retro.map((post, i) => (
              <button key={post.slug} type="button" className="ed-tile ed-strip-item" onClick={() => openPost(retro, i)}>
                <Thumb post={post} />
                <span className="ed-tile-cap">{post.title}<em>{post.note}</em></span>
              </button>
            ))}
          </div>
        </section>

        {/* ---------- 04 data graphics ---------- */}
        <section className="ed-chapter ed-appear" id="chapter-data">
          <header className="ed-chapter-head">
            <span className="ed-num">04</span>
            <div>
              <h2>Data graphics</h2>
              <p>{EDITORIAL_CATEGORIES.find((category) => category.id === "data")?.blurb}</p>
            </div>
          </header>
          {data.map((post, i) => (
            <div className="ed-data" key={post.slug}>
              <button type="button" className="ed-tile ed-tile-tall" onClick={() => openPost(data, i)}>
                <Thumb post={post} />
              </button>
              <div className="ed-data-copy">
                <h3>{post.title}</h3>
                <p>{post.note}</p>
              </div>
            </div>
          ))}
        </section>

        {extraCategories.map((category, ci) => { const social = byCategory(category.id); return social.length > 0 && <section className="ed-chapter ed-appear" id={`chapter-${category.id}`} key={category.id}>
          <header className="ed-chapter-head"><span className="ed-num">{String(ci + 5).padStart(2, "0")}</span><div><h2>{category.label}</h2><p>{category.blurb}</p></div></header>
          <div className="ed-archive-grid">
            {social.map((post, i) => <button key={post.slug} type="button" className="ed-tile ed-archive-tile" onClick={() => openPost(social, i)} onPointerEnter={() => warmArtwork(post)} onFocus={() => warmArtwork(post)} aria-label={`${post.nsfw ? "View sensitive post" : "Open"} ${post.title}`}>
              <Thumb post={post} /><span className="ed-archive-caption"><strong>{post.title}</strong><small>{post.client}{post.date ? ` · ${new Date(`${post.date}T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}` : ""}{(post.frames?.length || 1) > 1 ? ` · ${(post.frames?.length || 1)} slides` : ""}</small></span>
            </button>)}
          </div>
        </section>; })}

        {/* ---------- the other half: 3D ---------- */}
        <section className="ed-other ed-appear" aria-labelledby="ed-other-title">
          <div className="ed-other-copy">
            <span className="ed-num">The other half</span>
            <h2 id="ed-other-title">I also build things in 3D.</h2>
            <p>
              Product models and interactive scenes for the web, in Spline, Blender and 3ds Max:
              headphones you can spin, a keyboard you can press, backgrounds for HeyGen. Same eye
              for detail, different tools.
            </p>
            <TransitionLink className="cta cta-outline" to="/portfolio">Explore the 3D &amp; Web3D work →</TransitionLink>
          </div>
          <div className="ed-other-grid">
            {otherHalf.map((p) => (
              <TransitionLink key={p.slug} to={`/portfolio/${p.id}`} className="ed-other-tile" aria-label={p.title}>
                <picture>
                  <source srcSet={p.thumbAvif} type="image/avif" />
                  <img src={p.thumbWebp} alt={p.title} loading="lazy" decoding="async" />
                </picture>
              </TransitionLink>
            ))}
          </div>
        </section>

        {/* ---------- closing CTA ---------- */}
        <section className="ed-close ed-appear">
          <h2>Need someone for social, editorial or thumbnails?</h2>
          <p>{profile.editorialClosingNote}</p>
          <div className="ed-hero-actions">
            <a className="cta" href={profile.contraUrl || CONTRA_PROFILE} target="_blank" rel="noreferrer">Message me on Contra</a>
            <TransitionLink className="cta cta-outline" to="/about">More about me</TransitionLink>
          </div>
          <p className="ed-credit">Posts I designed for FandomWire and Animated Times. Open any piece to see the original.</p>
        </section>
      </div>

      <dialog
        ref={dialogRef}
        className="editorial-lightbox"
        onClose={close}
        onPointerDown={(event) => { backdropPress.current = event.target === event.currentTarget; }}
        onClick={(event) => {
          if (event.target === event.currentTarget && backdropPress.current) close();
          backdropPress.current = false;
        }}
        aria-label={open ? open.title : "Post preview"}
      >
        {open && needsConsent ? <ArtworkWarning item={open} titleId="ed-warning-title" onClose={close} onReveal={() => setLightbox((lb) => ({ ...lb, consentSlug: open.slug }))} /> : open && (
          <div className="editorial-lightbox-inner">
            <div className="editorial-lightbox-stage">
              <SketchLightboxImage key={frame.full} item={frame} />
            </div>
            <div className="editorial-lightbox-copy">
              <span>{label(open.category)} · {open.client}{frameCount > 1 ? ` · Post ${lightbox.index + 1} / ${lightbox.list.length}` : ""}</span>
              <h2>{open.title}</h2>
              <p>{frame.note || open.note}</p>

              {open.url && <a href={open.url} target="_blank" rel="noreferrer">
                View original{open.platform ? ` on ${open.platform}` : ""} <span aria-hidden="true">↗</span>
              </a>}
            </div>
            <div className="editorial-lightbox-nav">
                <button type="button" onClick={() => step(-1)} aria-label="Previous image">←</button>
                <span>{frameCount > 1 ? `Slide ${frameIndex + 1} / ${frameCount}` : `${lightbox.index + 1} / ${lightbox.list.length}`}</span>
                <button type="button" onClick={() => step(1)} aria-label="Next image">→</button>
            </div>
            <button type="button" className="editorial-lightbox-close" onClick={close} aria-label="Close">×</button>
          </div>
        )}
      </dialog>
    </>
  );
}

export default Editorial;
