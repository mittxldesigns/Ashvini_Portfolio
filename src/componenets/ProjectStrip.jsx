import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { projects, preloadHero } from "../data/projects.js";

const DRAG_SLOP = 5;
const COPIES = [0, 1, 2];

// Edge-pinned gallery of every project: native wheel/trackpad/touch
// scrolling, mouse drag-to-scroll with momentum, depth falloff away from
// the center, and the active item kept centered.
export default function ProjectStrip({ activeId, onSelect }) {
  const ref = useRef(null);
  const lastCenteredId = useRef(null);
  const programmaticScroll = useRef(false);
  const centerTimer = useRef(0);
  const dragged = useRef(false);
  const previewAnchor = useRef(null);
  const previewRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const vertical = () => {
    const el = ref.current;
    return el.scrollHeight - el.clientHeight >= el.scrollWidth - el.clientWidth;
  };

  const placePreview = useCallback(() => {
    const el = ref.current;
    const anchor = previewAnchor.current;
    const popup = previewRef.current;
    if (!el || !anchor || !popup || window.matchMedia("(max-width: 900px)").matches) return;
    const strip = el.getBoundingClientRect();
    const item = anchor.getBoundingClientRect();
    if (item.bottom < strip.top || item.top > strip.bottom) {
      popup.style.visibility = "hidden";
      return;
    }
    popup.style.visibility = "visible";
    const height = popup.offsetHeight;
    const top = Math.max(12, Math.min(item.top + item.height / 2 - height / 2, window.innerHeight - height - 12));
    popup.style.top = `${top}px`;
    popup.style.left = `${strip.right + 14}px`;
  }, []);

  useLayoutEffect(() => {
    if (preview) placePreview();
  }, [preview, placePreview]);

  // Depth effect: items shrink/fade with distance from the strip's center.
  useEffect(() => {
    const el = ref.current;
    let raf = 0;
    const wrap = () => {
      const middle = el.querySelector('[data-copy="1"][data-index="0"]');
      const last = el.querySelector('[data-copy="2"][data-index="0"]');
      if (!middle || !last) return;
      const v = vertical();
      const box = el.getBoundingClientRect();
      const scroll = v ? el.scrollTop : el.scrollLeft;
      const start = scroll + (v ? middle.getBoundingClientRect().top - box.top : middle.getBoundingClientRect().left - box.left);
      const end = scroll + (v ? last.getBoundingClientRect().top - box.top : last.getBoundingClientRect().left - box.left);
      const cycle = end - start;
      if (!(cycle > 0)) return;
      const center = scroll + (v ? el.clientHeight : el.clientWidth) / 2;
      if (center < start) {
        if (v) el.scrollTop += cycle;
        else el.scrollLeft += cycle;
      } else if (center >= end) {
        if (v) el.scrollTop -= cycle;
        else el.scrollLeft -= cycle;
      }
    };
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
      placePreview();
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onScroll = () => {
      if (!programmaticScroll.current) wrap();
      schedule();
    };
    const onScrollEnd = () => {
      programmaticScroll.current = false;
      wrap();
      schedule();
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", schedule);
    };
  }, [placePreview]);

  // Keep the active project centered (instantly on first render).
  useLayoutEffect(() => {
    const el = ref.current;
    const item = el.querySelector(`[data-copy="1"][data-id="${activeId}"]`);
    if (!item) return;
    const top = item.offsetTop - (el.clientHeight - item.offsetHeight) / 2;
    const left = item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2;
    const smooth = lastCenteredId.current !== null && lastCenteredId.current !== activeId &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lastCenteredId.current = activeId;
    programmaticScroll.current = true;
    clearTimeout(centerTimer.current);
    el.scrollTo({
      top,
      left,
      behavior: smooth ? "smooth" : "instant",
    });
    centerTimer.current = setTimeout(() => { programmaticScroll.current = false; }, smooth ? 750 : 0);
    return () => clearTimeout(centerTimer.current);
  }, [activeId]);

  useEffect(() => {
    const el = ref.current;
    let wasVertical = vertical();
    let frame = 0;
    const onResize = () => {
      const isVertical = vertical();
      if (isVertical === wasVertical) return;
      wasVertical = isVertical;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const item = el.querySelector(`[data-copy="1"][data-id="${activeId}"]`);
        if (!item) return;
        programmaticScroll.current = true;
        clearTimeout(centerTimer.current);
        el.scrollTo({
          top: item.offsetTop - (el.clientHeight - item.offsetHeight) / 2,
          left: item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2,
          behavior: "instant",
        });
        centerTimer.current = setTimeout(() => { programmaticScroll.current = false; }, 0);
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
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
      programmaticScroll.current = false;
      clearTimeout(centerTimer.current);
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
          previewAnchor.current = null;
          setPreview(null);
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
    <>
      <nav ref={ref} className="strip" aria-label="All projects">
        {COPIES.flatMap((copy) => projects.map((p, index) => {
          const active = p.id === activeId;
          const Item = copy === 1 ? "a" : "div";
          return (
            <Item
              key={`${copy}-${p.id}`}
              href={copy === 1 ? `/portfolio/${p.id}` : undefined}
              data-copy={copy}
              data-index={index}
              data-id={p.id}
              className={active ? "strip-item is-active" : "strip-item"}
              aria-current={active && copy === 1 ? "page" : undefined}
              aria-label={copy === 1 ? p.title : undefined}
              aria-hidden={copy === 1 ? undefined : true}
              onPointerEnter={(e) => {
                preloadHero(p);
                if (e.pointerType === "touch") return;
                previewAnchor.current = e.currentTarget;
                setPreview(p);
              }}
              onPointerLeave={(e) => {
                if (previewAnchor.current !== e.currentTarget || document.activeElement === e.currentTarget) return;
                previewAnchor.current = null;
                setPreview(null);
              }}
              onFocus={(e) => {
                preloadHero(p);
                previewAnchor.current = e.currentTarget;
                setPreview(p);
              }}
              onBlur={(e) => {
                if (previewAnchor.current !== e.currentTarget) return;
                previewAnchor.current = null;
                setPreview(null);
              }}
              onClick={(event) => {
                if (copy === 1) {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                  event.preventDefault();
                }
                previewAnchor.current = null;
                setPreview(null);
                if (!active) onSelect(p.id);
              }}
            >
              <picture>
                <source srcSet={p.thumbAvif} type="image/avif" />
                <img src={p.thumbWebp} alt="" width="96" height="96" loading="lazy" decoding="async" draggable={false} />
              </picture>
            </Item>
          );
        }))}
      </nav>
      {preview && createPortal(
        <aside className="strip-preview" ref={previewRef} aria-hidden="true">
          <div className="strip-preview-visual">
            <picture>
              <source srcSet={preview.heroAvif} type="image/avif" />
              <img src={preview.heroWebp} alt="" decoding="async" />
            </picture>
            <span aria-hidden="true">↗</span>
          </div>
          <div className="strip-preview-copy">
            <h3>{preview.title}</h3>
            {preview.description && (
              <p>{preview.description}</p>
            )}
            {preview.outcome && <span>{preview.outcome}</span>}
          </div>
        </aside>,
        document.body
      )}
    </>
  );
}
