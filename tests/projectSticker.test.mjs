import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewedSticker } from '../src/lib/projectSticker.js';
test('reviewed cutout matches its source but never overwrites later custom thumbnails',()=>{
 const item={full:'/media/66afe8d9-45a4-4371-b775-20617be1215a/original',thumbWebp:'/media/66afe8d9-45a4-4371-b775-20617be1215a/preview'};
 assert.equal(reviewedSticker(item),'/media/stickers/hyundai-n-vision-74-v2.webp');
 assert.equal(reviewedSticker({...item,thumbWebp:'/media/new-thumbnail/preview'}),null);
 assert.equal(reviewedSticker({...item,full:'/media/new-render/original'}),null);
});
