import { useNavigate } from "react-router-dom";
import { withViewTransition } from "../lib/viewTransition.js";

// <a> that navigates inside a View Transition; modified clicks (new tab,
// etc.) fall through to the browser.
export default function TransitionLink({ to, kind = "page", onBeforeNavigate, beforeNavigate, ...rest }) {
  const navigate = useNavigate();

  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onBeforeNavigate?.();
    withViewTransition(kind, () => navigate(to), beforeNavigate);
  };

  return <a href={to} onClick={onClick} {...rest} />;
}
