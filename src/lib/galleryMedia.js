// Covers and viewers share the same ordered frames, including mixed media.
export function galleryFrames(item) {
  if (item.frames?.length) return item.frames;
  const full = item.full || item.heroWebp;
  return full ? [{ full, asset: full, video: item.mediaType === "video" ? item.video || full : null, mediaType: item.mediaType || "image", thumbWebp: item.thumbWebp, thumbAvif: item.thumbAvif, poster: item.poster || item.thumbWebp, width: item.width, height: item.height, nsfw: !!item.nsfw }] : [];
}

export function normalizeGalleryMedia(item, project = false) {
  if (!item.frames?.length) return item;
  const frames = item.frames.map((frame, index) => {
    const full = frame.asset || frame.full || frame.src;
    const mediaType = frame.mediaType || "image";
    return { ...frame, full, mediaType, video: mediaType === "video" ? full : null, poster: frame.poster || frame.thumbWebp || null, position: frame.position ?? index + 1 };
  }).sort((a, b) => a.position - b.position);
  const cover = frames[0];
  const preview = cover.thumbWebp || cover.poster || cover.thumbAvif || item.thumbWebp;
  return { ...item, frames, full: cover.full, mediaType: cover.mediaType, video: cover.video, poster: cover.poster || preview,
    thumbWebp: preview, thumbAvif: cover.thumbAvif || null, width: cover.width || item.width, height: cover.height || item.height,
    nsfw: item.nsfw === true || frames.some((frame) => frame.nsfw === true),
    ...(project ? { heroWebp: cover.mediaType === "video" ? preview : cover.full, heroAvif: null } : {}),
  };
}
