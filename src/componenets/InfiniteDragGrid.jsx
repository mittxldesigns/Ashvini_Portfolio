import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  preloadThumbs,
  getLoadedIds,
  onThumbLoaded,
  thumbSrc,
} from "../data/projects.js";
import {
  computeLayout,
  initialOrigin,
  forEachTile,
  visibleProjectIds,
  wrap,
} from "../lib/gridLayout.js";
import { gridState } from "../lib/gridState.js";
import { PERSON_NAME } from "../data/seo.js";
import { tagSharedElement, withViewTransition } from "../lib/viewTransition.js";

const EASE = 0.2; // fraction of remaining distance covered per 60fps frame
const FRICTION = 0.94; // inertia decay per 60fps frame
const MAX_VELOCITY = 45;
const CLICK_SLOP = 6; // px of movement before a press counts as a drag

export default function InfiniteDragGrid() {
  const navigate = useNavigate();
  const viewportRef = useRef(null);
  const gridRef = useRef(null);
  const [layout, setLayout] = useState(computeLayout);
  const [loaded, setLoaded] = useState(getLoadedIds);

  // First visit centers a tile; returning restores where the user left off.
  const [origin] = useState(() => gridState.position ?? initialOrigin(layout));
  const [intro] = useState(() => !gridState.visited);

  useEffect(() => {
    const off = onThumbLoaded((id) =>
      setLoaded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
    );
    // Catch anything that finished between the initial render and now.
    setLoaded((prev) => {
      const now = getLoadedIds();
      return now.size === prev.size ? prev : now;
    });
    preloadThumbs(visibleProjectIds(layout, origin));
    return off;
    // Priority only matters for the first screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Runs before paint (and before a view transition captures the new page):
  // place the grid, then hand the shared "hero" name to the tile of the
  // project we're returning from.
  useLayoutEffect(() => {
    gridState.visited = true;
    const grid = gridRef.current;
    grid.style.transform = `translate3d(${wrap(origin.x, layout.block)}px, ${wrap(origin.y, layout.block)}px, 0)`;
    const id = gridState.returnToId;
    gridState.returnToId = null;
    if (id == null) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    let best = null;
    let bestD = Infinity;
    grid.querySelectorAll(`.tile[data-id="${id}"] img`).forEach((img) => {
      const r = img.getBoundingClientRect();
      if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) return;
      const d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
      if (d < bestD) {
        bestD = d;
        best = img;
      }
    });
    tagSharedElement(best, "hero");
    // Mount-only: this is about the page we arrived from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setLayout(computeLayout()), 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const tiles = useMemo(() => {
    const { step, tile, block, vw, vh } = layout;
    const ox = wrap(origin.x, block);
    const oy = wrap(origin.y, block);
    const entries = [];
    const closest = new Map();
    forEachTile(layout, ({ key, item, x, y }) => {
      const dist = Math.hypot(
        ox + x + tile / 2 - vw / 2,
        oy + y + tile / 2 - vh / 2
      );
      entries.push({ key, item, x, y, dist });
      const current = closest.get(item.id);
      if (!current || dist < current.dist) closest.set(item.id, { key, dist });
    });
    return entries.map(({ key, item, x, y, dist }) => {
      const primary = closest.get(item.id)?.key === key;
      const Tile = primary ? "a" : "div";
      const delay = Math.min((dist / step) * 60, 600);
      const isIn = loaded.has(item.id);
      return (
        <Tile
          key={key}
          className={isIn ? (intro ? "tile is-in" : "tile is-in is-static") : "tile"}
          data-id={item.id}
          href={primary ? `/portfolio/${item.id}` : undefined}
          aria-label={primary ? item.title : undefined}
          aria-hidden={primary ? undefined : true}
          onClick={(event) => {
            if (primary && event.detail > 0) event.preventDefault();
          }}
          style={{ left: x, top: y, width: tile, height: tile, "--d": `${delay}ms` }}
        >
          {isIn && (
            <img
              src={thumbSrc(item)}
              alt={item.title}
              width={tile}
              height={tile}
              draggable={false}
            />
          )}
          <span className="tile-title">{item.title}</span>
        </Tile>
      );
    });
  }, [layout, origin, loaded, intro]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const grid = gridRef.current;
    if (!viewport || !grid) return;

    const { block } = layout;
    const at = gridState.position ?? origin;
    const s = {
      x: at.x,
      y: at.y,
      tx: at.x,
      ty: at.y,
      vx: 0,
      vy: 0,
      dragging: false,
      moved: 0,
      px: 0,
      py: 0,
      lastT: 0,
      downId: null,
      downImg: null,
      pointerId: null,
      drawnX: NaN,
      drawnY: NaN,
    };

    const draw = () => {
      const wx = wrap(s.x, block);
      const wy = wrap(s.y, block);
      if (wx === s.drawnX && wy === s.drawnY) return;
      s.drawnX = wx;
      s.drawnY = wy;
      grid.style.transform = `translate3d(${wx}px, ${wy}px, 0)`;
    };

    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      if (document.hidden) {
        raf = 0;
        return;
      }
      const dt = Math.min(now - last, 64) / 16.667;
      last = now;

      if (!s.dragging && (s.vx !== 0 || s.vy !== 0)) {
        s.tx += s.vx * dt;
        s.ty += s.vy * dt;
        const f = Math.pow(FRICTION, dt);
        s.vx *= f;
        s.vy *= f;
        if (Math.abs(s.vx) < 0.02) s.vx = 0;
        if (Math.abs(s.vy) < 0.02) s.vy = 0;
      }

      const k = 1 - Math.pow(1 - EASE, dt);
      s.x += (s.tx - s.x) * k;
      s.y += (s.ty - s.y) * k;
      if (Math.abs(s.tx - s.x) < 0.05) s.x = s.tx;
      if (Math.abs(s.ty - s.y) < 0.05) s.y = s.ty;

      draw();
      if (s.vx !== 0 || s.vy !== 0 || s.x !== s.tx || s.y !== s.ty) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };
    const wake = () => {
      if (raf || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    draw();

    const onPointerDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      s.dragging = true;
      s.moved = 0;
      s.vx = 0;
      s.vy = 0;
      s.px = e.clientX;
      s.py = e.clientY;
      s.lastT = e.timeStamp;
      s.pointerId = e.pointerId;
      const tileEl = e.target.closest(".tile");
      s.downId = tileEl?.dataset.id ?? null;
      s.downImg = tileEl?.querySelector("img") ?? null;
      viewport.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!s.dragging || e.pointerId !== s.pointerId) return;
      const dx = e.clientX - s.px;
      const dy = e.clientY - s.py;
      s.px = e.clientX;
      s.py = e.clientY;
      s.tx += dx;
      s.ty += dy;
      s.moved += Math.abs(dx) + Math.abs(dy);
      if (s.moved > CLICK_SLOP) viewport.classList.add("is-dragging");

      const elapsed = Math.max(e.timeStamp - s.lastT, 1);
      s.lastT = e.timeStamp;
      const ivx = (dx / elapsed) * 16.667;
      const ivy = (dy / elapsed) * 16.667;
      s.vx = s.vx * 0.5 + ivx * 0.5;
      s.vy = s.vy * 0.5 + ivy * 0.5;
      wake();
    };

    const onPointerUp = (e) => {
      if (!s.dragging || e.pointerId !== s.pointerId) return;
      s.dragging = false;
      viewport.classList.remove("is-dragging");
      if (viewport.hasPointerCapture(e.pointerId)) {
        viewport.releasePointerCapture(e.pointerId);
      }

      if (s.moved <= CLICK_SLOP) {
        s.vx = 0;
        s.vy = 0;
        if (e.type === "pointerup" && s.downId) {
          const id = s.downId;
          gridState.position = { x: s.tx, y: s.ty };
          tagSharedElement(s.downImg, "hero");
          withViewTransition("open", () => navigate(`/portfolio/${id}`));
        }
        return;
      }
      // Finger/mouse rested before release: no fling.
      if (e.timeStamp - s.lastT > 90) {
        s.vx = 0;
        s.vy = 0;
      }
      s.vx = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, s.vx));
      s.vy = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, s.vy));
      wake();
    };

    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey) return; // trackpad pinch: block browser zoom
      const unit =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      s.vx = 0;
      s.vy = 0;
      s.tx -= e.deltaX * unit;
      s.ty -= e.deltaY * unit;
      wake();
    };

    const onKey = (e) => {
      const d = layout.step;
      const moves = {
        ArrowLeft: [d, 0],
        ArrowRight: [-d, 0],
        ArrowUp: [0, d],
        ArrowDown: [0, -d],
      };
      const m = moves[e.key];
      if (!m) return;
      e.preventDefault();
      s.vx = 0;
      s.vy = 0;
      s.tx += m[0];
      s.ty += m[1];
      wake();
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (s.vx !== 0 || s.vy !== 0 || s.x !== s.tx || s.y !== s.ty) {
        wake();
      }
    };

    // Safari fires these for trackpad pinch; block page zoom.
    const blockGesture = (e) => e.preventDefault();

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("gesturestart", blockGesture);
    document.addEventListener("gesturechange", blockGesture);

    return () => {
      cancelAnimationFrame(raf);
      gridState.position = { x: s.tx, y: s.ty };
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("gesturestart", blockGesture);
      document.removeEventListener("gesturechange", blockGesture);
    };
  }, [layout, navigate, origin]);

  return (
    <div ref={viewportRef} className="viewport">
      <h1 className="sr-only">Selected 3D work by {PERSON_NAME}</h1>
      <div ref={gridRef} className="grid">
        {tiles}
      </div>
      <div
        className={`grid-loader${loaded.size ? " is-hidden" : ""}`}
        aria-hidden={loaded.size > 0}
      >
        <span className="grid-loader-ring" />
        <span>Loading work</span>
      </div>
      {intro && <p className="grid-hint">Drag, swipe or scroll to explore</p>}
    </div>
  );
}
