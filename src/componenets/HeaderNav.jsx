import { useLocation, useMatch } from "react-router-dom";
import TransitionLink from "./TransitionLink.jsx";
import { gridState } from "../lib/gridState.js";
import { CONTRA_PROFILE } from "../data/projects.js";

const batla = "/avatar.webp";

function HeaderNav() {
  const detail = useMatch("/portfolio/:id");
  const onEditorial = useLocation().pathname.startsWith("/editorial");

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
        Ashvini
      </TransitionLink>
      <div className="header-actions">
        {onEditorial ? (
          <TransitionLink className="header-contact" to="/portfolio">3D work</TransitionLink>
        ) : (
          <TransitionLink className="header-contact" to="/editorial">Social &amp; editorial</TransitionLink>
        )}
        <a
          className="header-contact"
          href={CONTRA_PROFILE}
          target="_blank"
          rel="noreferrer"
          aria-label="Message Ashvini about a project on Contra"
        >
          Start a project <span aria-hidden="true">↗</span>
        </a>
        <TransitionLink className="icon-pic" to="/about">
          <img src={batla} alt="Ashvini Kumar" />
        </TransitionLink>
      </div>
    </div>
  );
}

export default HeaderNav;
