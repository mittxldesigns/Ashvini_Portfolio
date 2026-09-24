import { useMatch } from "react-router-dom";
import TransitionLink from "./TransitionLink.jsx";
import { gridState } from "../lib/gridState.js";

const batla = "/avatar.webp";

function HeaderNav() {
  const detail = useMatch("/portfolio/:id");

  return (
    <div className="headernav">
      <TransitionLink
        className="name"
        to="/portfolio"
        kind={detail ? "close" : "page"}
        onBeforeNavigate={() => {
          if (detail) gridState.returnToId = Number(detail.params.id);
        }}
      >
        Ashwani
      </TransitionLink>
      <TransitionLink className="icon-pic" to="/about">
        <img src={batla} alt="Ashwani Kumar" />
      </TransitionLink>
    </div>
  );
}

export default HeaderNav;
