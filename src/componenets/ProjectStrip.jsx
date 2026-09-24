import { useEffect, useLayoutEffect, useRef } from "react";
import { projects, preloadHero } from "../data/projects.js";

const DRAG_SLOP = 5;

// Edge-pinned gallery of every project: native wheel/trackpad/touch
// scrolling, mouse drag-to-scroll with momentum, depth falloff away from
// the center, and the active item kept centered.
export default function ProjectStrip({ activeId, onSelect }) {
  const ref = useRef(null);
  const didMount = useRef(false);
  const dragged = useRef(false);

  const vertical = () => {
    const el = ref.current;
    return el.scrollHeight - el.clientHeight >= el.scrollWidth - el.clientWidth;
  };

  // Depth effect: items shrink/fade with distance from the strip's center.
  useEffect(() => {
    const el = ref.current;
    let raf = 0;
    const update = () => {
      raf = 0;
      const v = vertical();
      const box = el.getBoundingClientRect();
      const center = v ? box.top + box.height / 2 : box.left + box.width / 2;
      const half = (v ? box.height : box.width) / 2;
      for (const item of el.children) {
        const r = item.getBoundingClientRect();
        const c = v ? r.top + r.height / 2 : r.left + r.width / 2;
        const p = Math.min(Math.abs(c - center) / half, 1);
        item.style.setProperty("--p", p.toFixed(3));
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // Keep the active project centered (instantly on first render).
  useLayoutEffect(() => {
    const el = ref.current;
    const item = el.querySelector(`[data-id="${activeId}"]`);
    if (!item) return;
    const top = item.offsetTop - (el.clientHeight - item.offsetHeight) / 2;
    const left = item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2;
    el.scrollTo({
      top,
      left,
      behavior: didMount.current ? "smooth" : "instant",
    });
    didMount.current = true;
  }, [activeId]);

  // Mouse drag-to-scroll with a little momentum. Touch uses native scrolling.
  useEffect(() => {
    const el = ref.current;
    const s = { down: false, x: 0, y: 0, moved: 0, v: 0, t: 0, raf: 0 };

    const glide = () => {
      s.v *= 0.92;
      if (Math.abs(s.v) < 0.3) return;
      if (vertical()) el.scrollTop -= s.v;
      else el.scrollLeft -= s.v;
      s.raf = requestAnimationFrame(glide);
    };

    const onDown = (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      cancelAnimationFrame(s.raf);
      Object.assign(s, { down: true, x: e.clientX, y: e.clientY, moved: 0, v: 0, t: e.timeStamp });
      dragged.current = false;
    };
    const onMove = (e) => {
      if (!s.down) return;
      const d = vertical() ? e.clientY - s.y : e.clientX - s.x;
      s.moved += Math.abs(e.clientX - s.x) + Math.abs(e.clientY - s.y);
      s.x = e.clientX;
      s.y = e.clientY;
      if (s.moved > DRAG_SLOP) {
        if (!dragged.current) {
          dragged.current = true;
          el.classList.add("is-dragging");
          el.setPointerCapture(e.pointerId);
        }
        if (vertical()) el.scrollTop -= d;
        else el.scrollLeft -= d;
        const dt = Math.max(e.timeStamp - s.t, 1);
        s.v = s.v * 0.5 + (d / dt) * 16.667 * 0.5;
        s.t = e.timeStamp;
      }
    };
    const onUp = (e) => {
      if (!s.down) return;
      s.down = false;
      el.classList.remove("is-dragging");
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (dragged.current && e.timeStamp - s.t < 90) s.raf = requestAnimationFrame(glide);
    };
    // Swallow the click that ends a drag.
    const onClickCapture = (e) => {
      if (dragged.current) {
        e.preventDefault();
        e.stopPropagation();
        dragged.current = false;
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClickCapture, true);
    return () => {
      cancelAnimationFrame(s.raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return (
    <nav ref={ref} className="strip" aria-label="All projects">
      {projects.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            data-id={p.id}
            className={active ? "strip-item is-active" : "strip-item"}
            aria-current={active ? "page" : undefined}
            aria-label={p.title}
            title={p.title}
            onPointerEnter={() => preloadHero(p)}
            onFocus={() => preloadHero(p)}
            onClick={() => !active && onSelect(p.id)}
          >
            <picture>
              <source srcSet={p.thumbAvif} type="image/avif" />
              <img src={p.thumbWebp} alt="" width="96" height="96" draggable={false} />
            </picture>
          </button>
        );
      })}
    </nav>
  );
}
