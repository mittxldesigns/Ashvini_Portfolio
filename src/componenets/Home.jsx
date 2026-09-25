import { useEffect, useRef, useState } from "react";
import TransitionLink from "./TransitionLink.jsx";
import { CONTRA_PROFILE, decodeThumb, preloadThumb, preloadThumbIds, projects } from "../data/projects.js";
import {
  computeLayout,
  originForProject,
  visibleProjectIds,
} from "../lib/gridLayout.js";
import { gridState } from "../lib/gridState.js";
import { tagSharedElement } from "../lib/viewTransition.js";

const featuredKey = "ashvini-featured-project";
let chosenProject = null;

function getFeaturedProject() {
  if (chosenProject) return chosenProject;
  const pool = projects.filter((project) =>
    project.slug !== "dna-helix" && project.slug !== "chrome-ak47"
  );
  let previous = null;
  try {
    previous = Number(sessionStorage.getItem(featuredKey));
  } catch {
    // Storage may be unavailable; the artwork can still rotate.
  }
  const choices = pool.filter((project) => project.id !== previous);
  chosenProject = choices[Math.floor(Math.random() * choices.length)] ?? pool[0];
  try {
    sessionStorage.setItem(featuredKey, String(chosenProject.id));
  } catch {
    // The chosen artwork remains valid for this page load.
  }
  return chosenProject;
}

function Home() {
  const [featured] = useState(getFeaturedProject);
  const [imageReady, setImageReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const imageRef = useRef(null);

  const enterGrid = () => {
    const rect = imageRef.current?.getBoundingClientRect();
    const center = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    gridState.position = originForProject(computeLayout(), featured.id, center);
    gridState.zoom = 1;
    gridState.homeFeaturedId = imageReady ? featured.id : null;
    gridState.homeTarget = center;
    gridState.showHint = !gridState.visited;
    gridState.visited = true;
    if (imageReady) tagSharedElement(imageRef.current, "hero");
  };

  useEffect(() => {
    preloadThumb(featured);
    const start = () => {
      const layout = computeLayout();
      const rect = imageRef.current?.getBoundingClientRect();
      const center = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: layout.vw / 2, y: layout.vh / 2 };
      preloadThumbIds(visibleProjectIds(layout, originForProject(layout, featured.id, center)));
    };
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(start, { timeout: 1500 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(start, 300);
    return () => clearTimeout(t);
  }, [featured]);

  return (
    <>
      <TransitionLink
        className="home-art-link"
        to="/portfolio"
        kind="home-to-grid"
        onBeforeNavigate={enterGrid}
        beforeNavigate={() => decodeThumb(featured)}
        aria-label={`Explore ${featured.title} in the portfolio`}
      >
        <picture>
          {!imageFailed && <source srcSet={featured.heroAvif} type="image/avif" />}
          <img
            ref={imageRef}
            className={imageReady ? "home-art is-ready" : "home-art"}
            src={imageFailed ? featured.thumbWebp : featured.heroWebp}
            alt={featured.title}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={(event) => {
              const image = event.currentTarget;
              if (image.decode) image.decode().catch(() => {}).finally(() => setImageReady(true));
              else setImageReady(true);
            }}
            onError={() => setImageFailed(true)}
          />
        </picture>
      </TransitionLink>
      <div className="home-container">
        <div className="home-content">
          <h1>Ashvini Kumar</h1>
          <p>Artist & 3D Designer</p>

          <TransitionLink
            className="cta"
            to="/portfolio"
            kind="home-to-grid"
            onBeforeNavigate={enterGrid}
            beforeNavigate={() => decodeThumb(featured)}
          >
            Explore the work
          </TransitionLink>
          <a className="home-contact" href={CONTRA_PROFILE} target="_blank" rel="noreferrer">
            Start a project <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <p className="para position-1">
        I make interactive 3D scenes and product visuals for the web, from
        modeling through motion.
      </p>
    </>
  );
}

export default Home;
