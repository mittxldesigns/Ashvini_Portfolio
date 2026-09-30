import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HeaderNav from "./HeaderNav.jsx";
import TransitionLink from "./TransitionLink.jsx";
import { CONTRA_PROFILE } from "../data/projects.js";
import { EDITORIAL_CATEGORIES, editorialPosts } from "../data/editorial.js";

const byCategory = (id) => editorialPosts.filter((p) => p.category === id);

function Thumb({ post, eager = false, className = "" }) {
  return (
    <picture className={className}>
      <source srcSet={post.thumbAvif} type="image/avif" />
      <img
        src={post.thumbWebp}
        alt={`${post.title}, social post designed for ${post.client}`}
        width="540"
        height="675"
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
  const pageRef = useRef(null);
  const dialogRef = useRef(null);
  const [lightbox, setLightbox] = useState(null); // { list, index }

  // hero wall: four columns, each a different rotation of the posts
  const columns = useMemo(() => {
    const n = editorialPosts.length;
    return [0, 4, 8, 11].map((offset) => Array.from({ length: n }, (_, i) => editorialPosts[(i + offset) % n]));
  }, []);

  const openPost = (list, index) => setLightbox({ list, index });
  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback((delta) => setLightbox((lb) => (lb ? { ...lb, index: (lb.index + delta + lb.list.length) % lb.list.length } : lb)), []);
  const open = lightbox ? lightbox.list[lightbox.index] : null;

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

  const news = byCategory("news"), campaigns = byCategory("campaigns"), retro = byCategory("retrospectives"), data = byCategory("data");

  return (
    <>
      <HeaderNav />
      <div className="ed-page" ref={pageRef}>
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
            <p className="ed-kicker reveal">Social &amp; editorial design · FandomWire · Animated Times</p>
            <h1 id="ed-title" className="reveal" style={{ "--d": "80ms" }}>
              Built to stop<br />the scroll.
            </h1>
            <p className="ed-hero-lede reveal" style={{ "--d": "160ms" }}>
              Six years designing the covers, thumbnails and campaigns pop-culture publishers
              post every day. Fast turnarounds, sharp typography, a house style held across
              a daily stream of stories.
            </p>
            <div className="ed-hero-actions reveal" style={{ "--d": "240ms" }}>
              <a className="cta" href={CONTRA_PROFILE} target="_blank" rel="noreferrer">Hire Ashvini</a>
              <button type="button" className="cta cta-outline" onClick={() => scrollTo("chapter-news")}>See the work ↓</button>
            </div>
          </div>
          <dl className="ed-stats reveal" style={{ "--d": "320ms" }}>
            <div><dt>6 yrs</dt><dd>editorial &amp; social design</dd></div>
            <div><dt>2</dt><dd>pop-culture publishers</dd></div>
            <div><dt>Daily</dt><dd>high-volume newsroom output</dd></div>
            <div><dt>4</dt><dd>formats below</dd></div>
          </dl>
        </section>

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
              <p>{EDITORIAL_CATEGORIES[0].blurb}</p>
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
            <h2>Designed for the thumb, not the gallery.</h2>
            <p>
              Every post is read at phone size, in a fraction of a second, between a hundred others.
              Headline first, one hero image, a badge that says what the story is. That's the brief,
              every day.
            </p>
            <ul className="ed-craft">
              <li>Headline hierarchy that reads at thumbnail size</li>
              <li>Key-art compositing from stills and posters</li>
              <li>Templates that keep a newsroom on-brand</li>
              <li>Photoshop · Illustrator · Premiere Pro · After Effects</li>
            </ul>
          </div>
          <div className="ed-phone" aria-hidden="true">
            <div className="ed-phone-screen">
              <div className="ed-phone-track">
                {[...editorialPosts, ...editorialPosts].map((post, i) => <Thumb key={`${post.slug}-f${i}`} post={post} eager />)}
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
              <p>{EDITORIAL_CATEGORIES[1].blurb}</p>
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
              <p>{EDITORIAL_CATEGORIES[2].blurb} Scroll sideways.</p>
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
              <p>{EDITORIAL_CATEGORIES[3].blurb}</p>
            </div>
          </header>
          {data.map((post, i) => (
            <div className="ed-data" key={post.slug}>
              <button type="button" className="ed-tile ed-tile-tall" onClick={() => openPost(data, i)}>
                <Thumb post={post} />
              </button>
              <div className="ed-data-copy">
                <h3>{post.title}</h3>
                <p>{post.note} Ten rows, ten faces, one number each: legible in the time it takes to scroll past.</p>
              </div>
            </div>
          ))}
        </section>

        {/* ---------- closing CTA ---------- */}
        <section className="ed-close ed-appear">
          <h2>Hiring for social, editorial or thumbnail design?</h2>
          <p>Remote, available immediately, used to newsroom pace and US-based teams.</p>
          <div className="ed-hero-actions">
            <a className="cta" href={CONTRA_PROFILE} target="_blank" rel="noreferrer">Message Ashvini</a>
            <TransitionLink className="cta cta-outline" to="/portfolio">See his 3D &amp; Web3D work</TransitionLink>
          </div>
          <p className="ed-credit">Posts designed for FandomWire; each links to the original.</p>
        </section>
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
              <span>{label(open.category)} · {open.client}</span>
              <h2>{open.title}</h2>
              <p>{open.note}</p>
              <a href={open.url} target="_blank" rel="noreferrer">
                View original on {open.platform} <span aria-hidden="true">↗</span>
              </a>
              <div className="editorial-lightbox-nav">
                <button type="button" onClick={() => step(-1)} aria-label="Previous piece">←</button>
                <span>{lightbox.index + 1} / {lightbox.list.length}</span>
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
