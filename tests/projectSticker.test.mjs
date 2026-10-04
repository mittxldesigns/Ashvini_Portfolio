import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewedSticker, gridThumbnail, isThumbnailPending } from '../src/lib/projectSticker.js';
test('reviewed cutout matches its source but never overwrites later custom thumbnails',()=>{
 const item={full:'/media/66afe8d9-45a4-4371-b775-20617be1215a/original',thumbWebp:'/media/66afe8d9-45a4-4371-b775-20617be1215a/preview'};
 assert.equal(reviewedSticker(item),'/media/stickers/hyundai-n-vision-74-v2.webp');
 assert.equal(reviewedSticker({...item,thumbWebp:'/media/new-thumbnail/preview'}),null);
 assert.equal(reviewedSticker({...item,full:'/media/new-render/original'}),null);
});

test('queued opaque thumbnails use an honest placeholder until the derived cutout is ready',()=>{
 const pending={thumbnailStatus:'queued',thumbWebp:'/opaque.jpg'};
 assert(gridThumbnail(pending,pending.thumbWebp).startsWith('data:image/svg+xml,'));
 assert.equal(isThumbnailPending(pending),true);
 assert.equal(gridThumbnail({...pending,gridThumb:'/helper-media/result.png'},pending.thumbWebp),'/helper-media/result.png');
 assert.equal(isThumbnailPending({...pending,gridThumb:'/helper-media/result.png'}),false);
 assert.equal(gridThumbnail({},'/original-transparent.webp'),'/original-transparent.webp');
});

test('a reviewed full-view thumbnail wins over an automatic cutout of the old cropped source',()=>{
 const p={full:'/media/97d5d9d9-bc64-47bf-b15c-975a4ec4e485/original',thumbWebp:'/media/97d5d9d9-bc64-47bf-b15c-975a4ec4e485/preview',gridThumb:'/helper-media/old-crop.png',thumbnailStatus:'ready'};
 assert.equal(gridThumbnail(p,p.thumbWebp),'/media/stickers/sampler-full-v1.webp');
 assert.equal(gridThumbnail({...p,thumbWebp:'/media/new-cover/preview'},p.thumbWebp),p.gridThumb);
});
