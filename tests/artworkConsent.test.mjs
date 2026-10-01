import test from "node:test";
import assert from "node:assert/strict";
import { mayPreloadArtwork, needsArtworkConsent } from "../src/lib/artworkConsent.js";

test("sensitive pieces require consent tied to the selected artwork", () => {
  const art = { slug: "sensitive-study", nsfw: true };
  assert.equal(needsArtworkConsent(art), true);
  assert.equal(needsArtworkConsent(art, "another-study"), true);
  assert.equal(needsArtworkConsent(art, art.slug), false);
  assert.equal(needsArtworkConsent({ slug: "ordinary-study", nsfw: false }), false);
  assert.equal(needsArtworkConsent(null), false);
});

test("sensitive originals and videos are excluded from image prefetch", () => {
  assert.equal(mayPreloadArtwork({ nsfw: true }), false);
  assert.equal(mayPreloadArtwork({ mediaType: "video" }), false);
  assert.equal(mayPreloadArtwork({ nsfw: false, mediaType: "image" }), true);
  assert.equal(mayPreloadArtwork(null), false);
});
