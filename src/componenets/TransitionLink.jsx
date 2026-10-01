import { useLocation, useNavigate } from "react-router-dom";
import { withViewTransition } from "../lib/viewTransition.js";

// <a> that navigates inside a View Transition; modified clicks (new tab,
// etc.) fall through to the browser.
export default function TransitionLink({ to, kind = "page", onBeforeNavigate, beforeNavigate, ...rest }) {
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();

  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const target = new URL(to, window.location.href);
    if (target.pathname === pathname && target.search === search && target.hash === hash) return;
    const fromPaper = pathname === "/sketches";
    const toPaper = target.pathname === "/sketches";
    const transitionKind = fromPaper === toPaper ? kind : toPaper ? "paper-in" : "paper-out";
    onBeforeNavigate?.();
    withViewTransition(transitionKind, () => navigate(to), beforeNavigate);
  };

  return <a href={to} onClick={onClick} {...rest} />;
}
