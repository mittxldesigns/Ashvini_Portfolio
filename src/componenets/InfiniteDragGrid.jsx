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
const clampGridZoom = (zoom, width) =>
  Math.max(0.55, Math.min(width < 768 ? 1.85 : 1.6, zoom || 1));

export default function InfiniteDragGrid() {
  const navigate = useNavigate();
  const viewportRef = useRef(null);
  const gridRef = useRef(null);
  const [layout, setLayout] = useState(computeLayout);
  const [loaded, setLoaded] = useState(getLoadedIds);

  // First visit centers a tile; returning restores where the user left off.
  const [origin] = useState(() => gridState.position ?? initialOrigin(layout));
  const [intro] = useState(() => !gridState.visited);
  const [showHint] = useState(() => !gridState.visited || gridState.showHint);

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
    const zoom = clampGridZoom(gridState.zoom, layout.vw);
    grid.style.transform = `translate3d(${wrap(origin.x, layout.block * zoom)}px, ${wrap(origin.y, layout.block * zoom)}px, 0) scale(${zoom})`;
    const id = gridState.returnToId ?? gridState.homeFeaturedId;
    const target = gridState.homeFeaturedId && gridState.homeTarget;
    gridState.returnToId = null;
    gridState.homeFeaturedId = null;
    gridState.homeTarget = null;
    gridState.showHint = false;
    if (id == null) return;
    const cx = target?.x ?? window.innerWidth / 2;
    const cy = target?.y ?? window.innerHeight / 2;
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
    const zoom = clampGridZoom(gridState.zoom, vw);
    const ox = wrap(origin.x, block * zoom);
    const oy = wrap(origin.y, block * zoom);
    const entries = [];
    const closest = new Map();
    forEachTile(layout, ({ key, item, x, y }) => {
      const dist = Math.hypot(
        ox + (x + tile / 2) * zoom - vw / 2,
        oy + (y + tile / 2) * zoom - vh / 2
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
      zoom: clampGridZoom(gridState.zoom, layout.vw),
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
      drawnZoom: NaN,
    };

    const clampZoom = (zoom) => clampGridZoom(zoom, layout.vw);

    const draw = () => {
      const scaledBlock = block * s.zoom;
      const wx = wrap(s.x, scaledBlock);
      const wy = wrap(s.y, scaledBlock);
      if (wx === s.drawnX && wy === s.drawnY && s.zoom === s.drawnZoom) return;
      s.drawnX = wx;
      s.drawnY = wy;
      s.drawnZoom = s.zoom;
      grid.style.transform = `translate3d(${wx}px, ${wy}px, 0) scale(${s.zoom})`;
    };

    const zoomAt = (nextZoom, point) => {
      const zoom = clampZoom(nextZoom);
      if (zoom === s.zoom) return;
      const ratio = zoom / s.zoom;
      s.x = point.x - (point.x - s.x) * ratio;
      s.y = point.y - (point.y - s.y) * ratio;
      s.tx = s.x;
      s.ty = s.y;
      s.vx = 0;
      s.vy = 0;
      s.zoom = zoom;
      gridState.zoom = zoom;
      draw();
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

    const touches = new Map();
    let pinch = null;
    const pair = () => [...touches.values()].slice(0, 2);
    const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    const onPointerDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.pointerType === "touch") {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        viewport.setPointerCapture(e.pointerId);
        if (touches.size === 2) {
          const [a, b] = pair();
          const center = midpoint(a, b);
          pinch = {
            distance: Math.max(distance(a, b), 1),
            zoom: s.zoom,
            worldX: (center.x - s.x) / s.zoom,
            worldY: (center.y - s.y) / s.zoom,
          };
          s.dragging = false;
          s.moved = CLICK_SLOP + 1;
          s.vx = 0;
          s.vy = 0;
          s.downId = null;
          s.downImg = null;
          return;
        }
        if (touches.size > 2) return;
      }
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
      if (!viewport.hasPointerCapture(e.pointerId)) viewport.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (touches.has(e.pointerId)) {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (pinch && touches.size >= 2) {
        const [a, b] = pair();
        const center = midpoint(a, b);
        s.zoom = clampZoom(pinch.zoom * Math.pow(distance(a, b) / pinch.distance, 1.5));
        s.x = center.x - pinch.worldX * s.zoom;
        s.y = center.y - pinch.worldY * s.zoom;
        s.tx = s.x;
        s.ty = s.y;
        gridState.zoom = s.zoom;
        draw();
        return;
      }
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
      if (touches.has(e.pointerId)) {
        touches.delete(e.pointerId);
        if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
        if (pinch) {
          if (touches.size < 2) {
            pinch = null;
            s.vx = 0;
            s.vy = 0;
            s.moved = CLICK_SLOP + 1;
            const remaining = touches.entries().next().value;
            s.dragging = Boolean(remaining);
            if (remaining) {
              s.pointerId = remaining[0];
              s.px = remaining[1].x;
              s.py = remaining[1].y;
              s.lastT = e.timeStamp;
            }
          }
          return;
        }
      }
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
          gridState.zoom = s.zoom;
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
      if (e.ctrlKey) {
        zoomAt(s.zoom * Math.exp(-e.deltaY * 0.006), { x: e.clientX, y: e.clientY });
        return;
      }
      const unit =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      s.vx = 0;
      s.vy = 0;
      s.tx -= e.deltaX * unit;
      s.ty -= e.deltaY * unit;
      wake();
    };

    const onKey = (e) => {
      if (!e.ctrlKey && !e.metaKey && (e.key === "+" || e.key === "=" || e.key === "-")) {
        e.preventDefault();
        zoomAt(s.zoom * (e.key === "-" ? 1 / 1.25 : 1.25), {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        return;
      }
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

    let gestureStartZoom = null;
    const onGestureStart = (e) => {
      e.preventDefault();
      if (touches.size < 2) gestureStartZoom = s.zoom;
    };
    const onGestureChange = (e) => {
      e.preventDefault();
      if (touches.size >= 2 || gestureStartZoom == null) return;
      zoomAt(gestureStartZoom * Math.pow(e.scale, 1.5), {
        x: e.clientX ?? window.innerWidth / 2,
        y: e.clientY ?? window.innerHeight / 2,
      });
    };
    const onGestureEnd = (e) => {
      e.preventDefault();
      gestureStartZoom = null;
    };

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("gesturestart", onGestureStart);
    document.addEventListener("gesturechange", onGestureChange);
    document.addEventListener("gestureend", onGestureEnd);

    return () => {
      cancelAnimationFrame(raf);
      gridState.position = { x: s.tx, y: s.ty };
      gridState.zoom = s.zoom;
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("gesturestart", onGestureStart);
      document.removeEventListener("gesturechange", onGestureChange);
      document.removeEventListener("gestureend", onGestureEnd);
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
      {showHint && <p className="grid-hint">Drag to explore · Pinch to zoom</p>}
    </div>
  );
}
