import { useEffect } from "react";
import TransitionLink from "./TransitionLink.jsx";
import { CONTRA_PROFILE, preloadThumbs } from "../data/projects.js";
import {
  computeLayout,
  initialOrigin,
  visibleProjectIds,
} from "../lib/gridLayout.js";

const batla = "/avatar.webp";
const headArt = "/home-art.avif";

function Home() {
  // Warm the grid's first screen once this page has painted.
  useEffect(() => {
    const start = () => {
      const layout = computeLayout();
      preloadThumbs(visibleProjectIds(layout, initialOrigin(layout)));
    };
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(start, { timeout: 1500 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(start, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <img className="home-art" src={headArt} alt="" aria-hidden="true" />
      <div className="home-container">
        <div className="home-content">
          <div className="profile-pic">
            <img src={batla} alt="Ashvini Kumar" />
          </div>

          <h1>Ashvini Kumar</h1>
          <p>Artist & 3D Designer</p>

          <TransitionLink className="cta" to="/portfolio">
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
