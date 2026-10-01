import test from 'node:test';
import assert from 'node:assert/strict';
import { moveGallerySelection as move } from '../src/lib/galleryNavigation.js';
const list = [{slug:'first',frames:[{},{}]},{slug:'sensitive',nsfw:true,frames:[{},{},{}]},{slug:'last'}];
test('one arrow path crosses frames, posts and both wrap boundaries',()=>{
 let state={list,index:0,frameIndex:0};
 const positions=[];
 for(let i=0;i<6;i++){state=move(state,1);positions.push([state.index,state.frameIndex]);}
 assert.deepEqual(positions,[[0,1],[1,0],[1,1],[1,2],[2,0],[0,0]]);
 assert.deepEqual([move(state,-1).index,move(state,-1).frameIndex],[2,0]);
 const prior=move({list,index:2,frameIndex:0},-1);
 assert.deepEqual([prior.index,prior.frameIndex],[1,2]);
});
test('consent is kept within a carousel and cleared when moving to another post',()=>{
 const state={list,index:1,frameIndex:1,consentSlug:'sensitive',previewSrc:'old'};
 assert.equal(move(state,1).consentSlug,'sensitive');
 assert.equal(move(state,2).consentSlug,undefined);
 assert.equal(move(state,-2).consentSlug,undefined);
 assert.equal(move(state,1).previewSrc,undefined);
 assert.equal(move(null,1),null);
});
