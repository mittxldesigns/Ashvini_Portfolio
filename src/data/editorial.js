// Social & editorial design: posts Ashvini designed for FandomWire (pop-culture news publisher).
// Images in src/assets/editorial were taken from the original public posts at full resolution.
import { EDITORIAL_CATEGORIES, posts } from "./editorialContent.js";

export { EDITORIAL_CATEGORIES };

const images = import.meta.glob("../assets/editorial/*.{avif,webp}", {
  eager: true,
  import: "default",
});
const asset = (name) => images[`../assets/editorial/${name}`];

export const editorialPosts = posts.map((post, index) => ({
  ...post,
  id: index + 1,
  client: "FandomWire",
  thumbAvif: asset(`${post.slug}-thumb.avif`),
  thumbWebp: asset(`${post.slug}-thumb.webp`),
  full: asset(`${post.slug}.webp`),
}));
