import React from "react";
import { Link } from "react-router-dom";
const batla = "/avatar.webp";

function HeaderNav() {
  return (
    <>
      <div className="headernav">
        <Link className="name" to="/portfolio">
          Ashwani
        </Link>
        <Link className="icon-pic" to="/about">
          <img src={batla} alt="Ashwani Kumar" />
        </Link>
      </div>
    </>
  );
}

export default HeaderNav;
