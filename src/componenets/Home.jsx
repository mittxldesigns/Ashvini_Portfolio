import React from "react";
import { Link } from "react-router-dom";

import batla from "../assets/z6reg6szut7ouitceg1h.avif";

function Home() {
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
