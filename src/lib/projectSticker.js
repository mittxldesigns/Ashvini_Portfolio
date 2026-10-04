// Reviewed cutouts for the two original owner uploads. A replacement thumbnail
// always wins: these mappings must never override a later edit in the CMS.
const reviewed = [
  ['54bdce78-2c32-4514-b8fe-5b786706d052', '656fbdcd-1d53-45bd-93d9-50ed817857eb', '/media/stickers/patek-showcase-v1.webp'],
  ['66afe8d9-45a4-4371-b775-20617be1215a', '4405b4bb-482f-4e34-88a0-624a982c5b82', '/media/stickers/hyundai-n-vision-74-v2.webp'],
];
export function reviewedSticker(project) {
  for (const [video, cover, sticker] of reviewed) {
    const original = `/media/${video}/original`;
    if ((project.full === original || project.frames?.[0]?.full === original || project.frames?.[0]?.asset === original) &&
      [`/media/${video}/preview`, `/media/${cover}/preview`].includes(project.thumbWebp)) return sticker;
  }
  return null;
}

const waitingThumbnail = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="560" height="560" viewBox="0 0 560 560"><rect x="220" y="190" width="120" height="120" rx="20" fill="none" stroke="#7695aa" stroke-width="2" stroke-dasharray="8 9"/><text x="280" y="350" text-anchor="middle" font-family="sans-serif" font-size="19" fill="#aaa">Preparing thumbnail</text></svg>')}`;
export function gridThumbnail(project, original) {
  return project.gridThumb || reviewedSticker(project) || (project.thumbnailStatus ? waitingThumbnail : original);
}
export function isThumbnailPending(project) {
  return Boolean(project.thumbnailStatus && !project.gridThumb && !reviewedSticker(project));
}
