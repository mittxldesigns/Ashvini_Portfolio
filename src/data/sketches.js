import { SKETCH_CHAPTERS, SKETCH_TIMELINE, sketches as content } from "./sketchesContent.js";

export { SKETCH_CHAPTERS, SKETCH_TIMELINE };

const images = import.meta.glob("../assets/sketches/*.{avif,webp,mp4}", { eager: true, import: "default" });
const asset = (name) => images[`../assets/sketches/${name}`];
const frameAssets = (frame) => ({
  ...frame,
  thumbAvif: asset(`${frame.file}-thumb.avif`),
  thumbWebp: asset(`${frame.file}-thumb.webp`),
  full: asset(`${frame.file}.webp`),
  ...(frame.videoFile ? { video: asset(frame.videoFile) } : {}),
});

export const sketches = content.map((s, index) => ({
  ...s,
  id: index + 1,
  thumbAvif: asset(`${s.slug}-thumb.avif`),
  thumbWebp: asset(`${s.slug}-thumb.webp`),
  full: asset(`${s.slug}.webp`),
  ...(s.videoFile ? { video: asset(s.videoFile) } : {}),
  ...(s.frames ? { frames: s.frames.map(frameAssets) } : {}),
}));
