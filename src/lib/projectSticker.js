// Reviewed cutouts tied to their exact original owner uploads. A replacement thumbnail
// always wins: these mappings must never override a later edit in the CMS.
const reviewed = [
  ['c36c87d2-1556-40bb-971e-3daea2aabd95', 'c36c87d2-1556-40bb-971e-3daea2aabd95', '/media/stickers/earth-v1.webp'],
  ['8fc86ea5-8b46-4d65-9809-b238f19fe779', '8fc86ea5-8b46-4d65-9809-b238f19fe779', '/media/stickers/cmf-headphones-v1.webp'],
  ['d8c7794d-a9e3-4809-8015-9cd848b2f14b', 'd8c7794d-a9e3-4809-8015-9cd848b2f14b', '/media/stickers/grunge-batmobile-v1.webp'],

  ['97d5d9d9-bc64-47bf-b15c-975a4ec4e485', '97d5d9d9-bc64-47bf-b15c-975a4ec4e485', '/media/stickers/sampler-full-v1.webp'],
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
const failedThumbnail = waitingThumbnail.replace(encodeURIComponent("Preparing thumbnail"), encodeURIComponent("Thumbnail unavailable"));
export function gridThumbnail(project, original) {
  return reviewedSticker(project) || project.gridThumb || (project.thumbnailStatus ? project.thumbnailStatus === "failed" ? failedThumbnail : waitingThumbnail : original);
}
export function isThumbnailPending(project) {
  return Boolean(project.thumbnailStatus && !project.gridThumb && !reviewedSticker(project));
}
