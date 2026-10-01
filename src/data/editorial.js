// Social & editorial artwork for FandomWire and Animated Times.
// Each frame retains its verified source dimensions and public post link.
import { EDITORIAL_CATEGORIES, posts } from "./editorialContent.js";

export { EDITORIAL_CATEGORIES };

const images = import.meta.glob("../assets/editorial/*.{avif,webp}", {
  eager: true,
  import: "default",
});
const asset = (name) => images[`../assets/editorial/${name}`];

export const editorialPosts = posts.map((post, index) => {
  const frames = post.frames.map((frame) => ({
    ...frame,
    thumbAvif: asset(`${frame.asset}-thumb.avif`),
    thumbWebp: asset(`${frame.asset}-thumb.webp`),
    full: asset(`${frame.asset}.webp`),
  }));
  return {
    ...post,
    id: index + 1,
    frames,
    thumbAvif: frames[0].thumbAvif,
    thumbWebp: frames[0].thumbWebp,
    full: frames[0].full,
    width: frames[0].width,
    height: frames[0].height,
  };
});
