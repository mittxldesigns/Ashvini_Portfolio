import { SKETCH_CHAPTERS, SKETCH_TIMELINE, sketches as content } from "./sketchesContent.js";

export { SKETCH_CHAPTERS, SKETCH_TIMELINE };

const images = import.meta.glob("../assets/sketches/*.{avif,webp}", { eager: true, import: "default" });
const asset = (name) => images[`../assets/sketches/${name}`];

export const sketches = content.map((s, index) => ({
  ...s,
  id: index + 1,
  thumbAvif: asset(`${s.slug}-thumb.avif`),
  thumbWebp: asset(`${s.slug}-thumb.webp`),
  full: asset(`${s.slug}.webp`),
}));
