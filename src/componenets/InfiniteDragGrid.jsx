import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { projects, preloadThumbs, areThumbsReady } from "../data/projects.js";

const EASE = 0.2; // fraction of remaining distance covered per 60fps frame
const FRICTION = 0.94; // inertia decay per 60fps frame
const MAX_VELOCITY = 45;
const CLICK_SLOP = 6; // px of movement before a press counts as a drag

function computeLayout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = vw < 768;
  const tile = mobile ? 170 : 280;
  const step = mobile ? 210 : 340;
  // One repeating block must cover the viewport. Tile i shows item
  // (row*size + col) % n, so skip sizes where vertical neighbours — inside
  // the block (diff = size) or across its seam (diff = size*(size-1)) —
  // would land on the same item.
  const n = projects.length;
  let size = Math.max(6, Math.ceil(Math.max(vw, vh) / step) + 1);
  while (size % n === 0 || (size * (size - 1)) % n === 0) size += 1;
  return { vw, vh, tile, step, size, block: size * step };
}

const wrap = (v, block) => ((v % block) + block) % block;

export default function InfiniteDragGrid() {
  const navigate = useNavigate();
  const viewportRef = useRef(null);
  const gridRef = useRef(null);
  const [layout, setLayout] = useState(computeLayout);
  const [ready, setReady] = useState(areThumbsReady);

  // Centers a tile on first paint; later layouts keep the live position.
  const [origin] = useState(() => ({
    x: (layout.vw - layout.tile) / 2,
    y: (layout.vh - layout.tile) / 2,
  }));
  const position = useRef(null);

  useEffect(() => {
    if (ready) return;
    let alive = true;
    preloadThumbs().then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [ready]);

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
    const { size, step, tile, block, vw, vh } = layout;
    const ox = wrap(origin.x, block);
    const oy = wrap(origin.y, block);
    const out = [];
    // 2x2 copies of the block are enough: the grid offset is wrapped into
    // [0, block), so copies at -block and 0 always cover the viewport.
    for (let ry = -1; ry <= 0; ry++) {
      for (let rx = -1; rx <= 0; rx++) {
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            const item = projects[(row * size + col) % projects.length];
            const x = (rx * size + col) * step;
            const y = (ry * size + row) * step;
            const dist = Math.hypot(
              ox + x + tile / 2 - vw / 2,
              oy + y + tile / 2 - vh / 2
            );
            const delay = Math.min((dist / step) * 70, 900);
            out.push(
              <div
                key={`${rx}:${ry}:${row}:${col}`}
                className="tile"
                data-id={item.id}
                style={{
                  left: x,
                  top: y,
                  width: tile,
                  height: tile,
                  "--d": `${delay}ms`,
                }}
              >
                <img
                  src={item.thumb}
                  alt={item.title}
                  width={tile}
                  height={tile}
                  draggable={false}
                  decoding="async"
                />
                <span className="tile-title">{item.title}</span>
              </div>
            );
          }
        }
      }
    }
    return out;
  }, [layout, origin]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const grid = gridRef.current;
    if (!viewport || !grid) return;

    const { block } = layout;
    const at = position.current ?? origin;
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
      raf = requestAnimationFrame(tick);
    };
    draw();
    raf = requestAnimationFrame(tick);

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
      s.downId = e.target.closest(".tile")?.dataset.id ?? null;
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
          navigate(`/portfolio/${s.downId}`);
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
    };

    // Safari fires these for trackpad pinch; block page zoom.
    const blockGesture = (e) => e.preventDefault();

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    document.addEventListener("gesturestart", blockGesture);
    document.addEventListener("gesturechange", blockGesture);

    return () => {
      cancelAnimationFrame(raf);
      position.current = { x: s.tx, y: s.ty };
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("gesturestart", blockGesture);
      document.removeEventListener("gesturechange", blockGesture);
    };
  }, [layout, navigate, origin]);

  return (
    <div ref={viewportRef} className="viewport">
      <div ref={gridRef} className={`grid${ready ? " is-ready" : ""}`}>
        {tiles}
      </div>
      <div className={`grid-loader${ready ? " is-hidden" : ""}`} aria-hidden={ready}>
        <span className="grid-loader-ring" />
        <span>Loading work</span>
      </div>
      <p className="grid-hint">Drag, swipe or scroll to explore</p>
    </div>
  );
}
