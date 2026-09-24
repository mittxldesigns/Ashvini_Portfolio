import { projects } from "../data/projects.js";

export function computeLayout() {
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

// Starting offset that centers a tile in the viewport.
export function initialOrigin(layout) {
  return {
    x: (layout.vw - layout.tile) / 2,
    y: (layout.vh - layout.tile) / 2,
  };
}

export const wrap = (v, block) => ((v % block) + block) % block;

export const itemAt = (row, col, size) =>
  projects[(row * size + col) % projects.length];

// Calls fn for every tile in the 2x2 block copies the grid renders.
export function forEachTile(layout, fn) {
  const { size, step } = layout;
  for (let ry = -1; ry <= 0; ry++) {
    for (let rx = -1; rx <= 0; rx++) {
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          fn({
            key: `${rx}:${ry}:${row}:${col}`,
            item: itemAt(row, col, size),
            x: (rx * size + col) * step,
            y: (ry * size + row) * step,
          });
        }
      }
    }
  }
}

// Project ids on screen at `origin`, nearest to the center first.
export function visibleProjectIds(layout, origin) {
  const { vw, vh, tile, block } = layout;
  const ox = wrap(origin.x, block);
  const oy = wrap(origin.y, block);
  const best = new Map();
  forEachTile(layout, ({ item, x, y }) => {
    const sx = ox + x;
    const sy = oy + y;
    if (sx + tile < 0 || sy + tile < 0 || sx > vw || sy > vh) return;
    const d = Math.hypot(sx + tile / 2 - vw / 2, sy + tile / 2 - vh / 2);
    if (!best.has(item.id) || d < best.get(item.id)) best.set(item.id, d);
  });
  return [...best.entries()].sort((a, b) => a[1] - b[1]).map(([id]) => id);
}
