import test from 'node:test';
import assert from 'node:assert/strict';
import { galleryFrames, normalizeGalleryMedia } from '../src/lib/galleryMedia.js';
import { uploadMime, validateUpload } from '../src/lib/mediaUpload.js';
const video = { asset:'/media/render/original',thumbWebp:'/media/render/preview',mediaType:'video',position:1,width:1920,height:1080 };
const image = { asset:'/assets/still.webp',thumbWebp:'/assets/still-thumb.webp',mediaType:'image',position:2 };
test('video cover uses its poster in image surfaces and its original in the player',()=>{
 const result=normalizeGalleryMedia({frames:[video],heroAvif:'/assets/old.avif'},true);
 assert.equal(result.mediaType,'video');assert.equal(result.video,video.asset);assert.equal(result.heroWebp,video.thumbWebp);assert.equal(result.full,video.asset);assert.equal(result.heroAvif,null);
});
test('reordering a mixed gallery clears the old video and poster from an image cover',()=>{
 const result=normalizeGalleryMedia({mediaType:'video',video:video.asset,poster:video.thumbWebp,frames:[video,{...image,position:0}]},true);
 assert.equal(result.mediaType,'image');assert.equal(result.video,null);assert.equal(result.heroWebp,image.asset);assert.equal(result.poster,image.thumbWebp);assert.equal(result.frames[1].video,video.asset);
});
test('appending a render preserves the original project image and sensitive flags',()=>{
 const item={heroWebp:'/assets/original.webp',thumbWebp:'/assets/thumb.webp',nsfw:true};
 const result=normalizeGalleryMedia({...item,frames:[...galleryFrames(item),video]},true);
 assert.equal(result.frames.length,2);assert.equal(result.full,item.heroWebp);assert.equal(result.nsfw,true);
});
test('supported render extensions work when the browser omits the MIME type',()=>{
 assert.equal(uploadMime({name:'render.MP4',type:''}),'video/mp4');
 assert.equal(uploadMime({name:'render.mov',type:'application/octet-stream'}),'video/quicktime');
 assert.throws(()=>uploadMime({name:'render.mp4',type:'text/html'}),/Choose an image/);
});
test('video cap is enforced before any preview or upload work',()=>{
 assert.equal(validateUpload({name:'render.mp4',type:'video/mp4',size:80*1024*1024}),'video/mp4');
 assert.throws(()=>validateUpload({name:'render.mp4',type:'video/mp4',size:80*1024*1024+1}),/80 MB/);
 assert.throws(()=>validateUpload({name:'render.mp4',type:'video/mp4',size:0}),/80 MB/);
});
