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
