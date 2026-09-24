import { useEffect } from "react";
import { Link } from "react-router-dom";

const batla = "/avatar.webp";
import { preloadThumbs } from "../data/projects.js";
import {
  computeLayout,
  initialOrigin,
  visibleProjectIds,
} from "../lib/gridLayout.js";

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
      <div className="home-container">
        <div className="home-content">
          <div className="profile-pic">
            <img src={batla} alt="Ashwani Kumar" />
          </div>

          <h3>Ashwani Kumar</h3>
          <p>Artist & 3D Designer</p>

          <Link className="cta" to="/portfolio">
            Enter Portfolio
          </Link>
        </div>
      </div>

      <p className="para position-1">
        I'm a 3D artist focused on crafting intuitive, high-performance 3D
        experiences for Web3D and rendering. With expertise in modeling,
        texturing, and animation.
      </p>
    </>
  );
}

export default Home;
