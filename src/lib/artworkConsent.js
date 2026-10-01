export function needsArtworkConsent(item, consentSlug) {
  return item?.nsfw === true && consentSlug !== item.slug;
}

export function mayPreloadArtwork(item) {
  return !!item && item.nsfw !== true && item.mediaType !== "video";
}
