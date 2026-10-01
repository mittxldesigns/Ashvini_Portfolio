import { useLocation, useMatch } from "react-router-dom";
import TransitionLink from "./TransitionLink.jsx";
import { gridState } from "../lib/gridState.js";
import { CONTRA_PROFILE } from "../data/projects.js";

const batla = "/avatar.webp";

function HeaderNav() {
  const detail = useMatch("/portfolio/:id");
  const { pathname } = useLocation();
  // which half of the work you're looking at; About shows neither as active
  const side = pathname.startsWith("/editorial") ? "editorial" : pathname.startsWith("/sketches") ? "sketches" : pathname.startsWith("/portfolio") ? "3d" : null;

  return (
    <div className={side === "sketches" ? "headernav headernav--paper" : "headernav"}>
      <TransitionLink
        className="name"
        to={detail ? "/portfolio" : "/"}
        kind={detail ? "close" : "page"}
        onBeforeNavigate={() => {
          if (detail) gridState.returnToId = Number(detail.params.id);
        }}
      >
        Ashvini
      </TransitionLink>
      <div className="header-actions">
        <nav className="work-switch" aria-label="Choose the type of work">
          <TransitionLink to="/portfolio" aria-current={side === "3d" ? "page" : undefined}>
            3D <span className="work-switch-long">&amp; Web3D</span>
          </TransitionLink>
          <TransitionLink to="/editorial" aria-current={side === "editorial" ? "page" : undefined}>
            Social <span className="work-switch-long">&amp; editorial</span>
          </TransitionLink>
          <TransitionLink className="work-switch-sketches" to="/sketches" aria-current={side === "sketches" ? "page" : undefined}>
            <svg viewBox="0 0 18 18" aria-hidden="true"><path d="m3 13 8-8 3 3-8 8-4 1 1-4ZM10 6l3 3M3 13l3 3" /></svg>
            Sketches
          </TransitionLink>
        </nav>
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
