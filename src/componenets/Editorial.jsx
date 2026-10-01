import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HeaderNav from "./HeaderNav.jsx";
import TransitionLink from "./TransitionLink.jsx";
import { CONTRA_PROFILE, projects } from "../data/projects.js";
import { EDITORIAL_CATEGORIES, editorialPosts } from "../data/editorial.js";
import { AUDIENCE_CHECKED, COMBINED_FOLLOWERS, publishers } from "../data/experience.js";

const byCategory = (id) => editorialPosts.filter((p) => p.category === id);
// a few 3D pieces to show the other half of the work, linking into the grid
const otherHalf = ["nothing-headphones", "teenage-engineering-tp7", "heygen-glass", "worklouder-keypad"]
  .map((slug) => projects.find((p) => p.slug === slug))
  .filter(Boolean);

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
            <p className="ed-kicker reveal">Ashvini Kumar · social &amp; editorial design</p>
            <h1 id="ed-title" className="reveal" style={{ "--d": "80ms" }}>
              Built to stop<br />the scroll.
            </h1>
            <p className="ed-hero-lede reveal" style={{ "--d": "160ms" }}>
              Before I got into 3D, I was a newsroom designer, and I still am. For six years I've
              made the covers, thumbnails and posts that FandomWire and Animated Times put out
              every day: Marvel, DC and everything in between, often on tight deadlines.
            </p>
            <div className="ed-hero-actions reveal" style={{ "--d": "240ms" }}>
              <a className="cta" href={CONTRA_PROFILE} target="_blank" rel="noreferrer">Work with me</a>
              <button type="button" className="cta cta-outline" onClick={() => scrollTo("chapter-news")}>See the work ↓</button>
            </div>
          </div>
          <dl className="ed-stats reveal" style={{ "--d": "320ms" }}>
            <div><dt>6 yrs</dt><dd>designing for the feed</dd></div>
            <div><dt>Daily</dt><dd>posts, on deadline</dd></div>
            <div><dt>{COMBINED_FOLLOWERS}</dt><dd>followers across the two publishers</dd></div>
            <div><dt>+ 3D</dt><dd><TransitionLink to="/portfolio">and Web3D work too →</TransitionLink></dd></div>
          </dl>
        </section>

        {/* ---------- credibility: where the work runs ---------- */}
        <section className="ed-pubs ed-appear" aria-labelledby="ed-pubs-title">
          <div className="ed-pubs-head">
            <span className="ed-num">Where my work runs</span>
            <h2 id="ed-pubs-title">
              My work goes out to {COMBINED_FOLLOWERS} followers, every day.
              <span> Two pop-culture publishers, six years, and I'm still on both teams.</span>
            </h2>
          </div>
          <div className="ed-pubs-grid">
            {publishers.map((p) => (
              <article className="ed-pub" key={p.org}>
                <header>
                  <h3>{p.org}</h3>
                  <p className="ed-pub-role">{p.role} <span>· {p.years}</span></p>
                </header>
                <p className="ed-pub-about">{p.about} {p.work}</p>
                <dl className="ed-pub-stats">
                  {p.stats.map((st) => (
                    <div key={st.label}>
                      <dt>{st.value}</dt>
                      <dd>
                        {st.url ? <a href={st.url} target="_blank" rel="noreferrer">{st.label} ↗</a> : st.label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <p className="ed-pubs-note">Follower counts from each publisher's public Facebook and Instagram pages, {AUDIENCE_CHECKED}.</p>
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
              <p>{EDITORIAL_CATEGORIES[2].blurb} Swipe or scroll sideways.</p>
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
                <p>{post.note} Ten rows, ten faces, one number each, readable before your thumb moves on.</p>
              </div>
            </div>
          ))}
        </section>

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
          <p>I work remotely, can start right away, and I'm used to newsroom deadlines and teams in the US.</p>
          <div className="ed-hero-actions">
            <a className="cta" href={CONTRA_PROFILE} target="_blank" rel="noreferrer">Message me on Contra</a>
            <TransitionLink className="cta cta-outline" to="/about">More about me</TransitionLink>
          </div>
          <p className="ed-credit">Posts I designed for FandomWire. Open any piece to see the original.</p>
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
