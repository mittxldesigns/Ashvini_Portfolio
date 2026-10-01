// One arrow path through frames, then through posts. Consent follows one post only.
export function moveGallerySelection(selection, delta) {
  if (!selection?.list?.length) return selection;
  const { list } = selection;
  let index = selection.index;
  let frameIndex = (selection.frameIndex || 0) + delta;
  const count = (position) => list[position].frames?.length || 1;
  while (frameIndex >= count(index)) {
    frameIndex -= count(index);
    index = (index + 1) % list.length;
  }
  while (frameIndex < 0) {
    index = (index - 1 + list.length) % list.length;
    frameIndex += count(index);
  }
  return { ...selection, index, frameIndex, previewSrc: undefined, consentSlug: index === selection.index ? selection.consentSlug : undefined };
}
