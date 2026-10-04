import assert from "node:assert/strict";
import { test } from "node:test";
import { validateSeed } from "../scripts/validate-seed.mjs";

const seed = () => ({schemaVersion:1,revision:0,profile:{name:"Fixture",editorialCategories:[{id:"news",label:"News"}],sketchChapters:[{id:"paper",label:"Paper"}]},projects:[{id:1,slug:"fixture",title:"Fixture",nsfw:false,full:"/assets/fixture.webp",thumbWebp:"/assets/fixture-thumb.webp"}],editorial:[],sketches:[]});
test("a published seed cannot remove every project",async()=>{const content=seed();content.projects=[];await assert.rejects(validateSeed(content),/at least one 3D project/);});
test("gallery entries must use a defined category or chapter",async()=>{const content=seed();content.editorial=[{slug:"invisible",title:"Invisible",category:"unknown",nsfw:false}];await assert.rejects(validateSeed(content),/defined editorial category/);content.editorial=[];content.sketches=[{slug:"invisible",title:"Invisible",chapter:"unknown",nsfw:false}];await assert.rejects(validateSeed(content),/defined sketchbook chapter/);});
test("sensitive frames make their parent sensitive and retain real dates",async()=>{const content=seed();content.sketches=[{slug:"artwork",title:"Artwork",chapter:"paper",nsfw:false,dateISO:"2026-09-01",frames:[{asset:"/assets/fixture.webp",thumbWebp:"/assets/fixture-thumb.webp",width:600,height:800,nsfw:true,dateISO:"2026-09-01"}]}];const result=await validateSeed(content);assert.equal(result.sketches[0].nsfw,true);assert.equal(result.sketches[0].dateISO,"2026-09-01");});
test("publishing requires a profile name and complete covers",async()=>{const content=seed();content.profile.name="";await assert.rejects(validateSeed(content),/profile name/);content.profile.name="Fixture";delete content.projects[0].thumbWebp;await assert.rejects(validateSeed(content),/cover preview/);});
test("empty frames and executable source URLs cannot publish",async()=>{const content=seed();content.projects[0].frames=[{asset:"",width:600,height:800}];await assert.rejects(validateSeed(content),/original media path/);content.projects[0].frames=[{asset:"/assets/fixture.webp",width:600,height:800,sourceUrl:"javascript:alert(1)"}];await assert.rejects(validateSeed(content),/website URL/);});
test("invalid profile shapes fail before they can crash the editor",async()=>{const content=seed();content.profile.skills="not an array";await assert.rejects(validateSeed(content),/list of text/);});
test("calendar dates cannot normalize an impossible day into another month",async()=>{const content=seed();content.projects[0].dateISO="2026-02-30";await assert.rejects(validateSeed(content),/valid calendar date/);});
test("video publication keeps playable media and uses a poster for the home image",async()=>{
 const content=seed();content.projects[0].frames=[{asset:"/assets/render.mp4",thumbWebp:"/assets/poster.jpg",mediaType:"video",width:1920,height:1080}];
 const result=(await validateSeed(content)).projects[0];assert.equal(result.full,"/assets/render.mp4");assert.equal(result.video,"/assets/render.mp4");assert.equal(result.heroWebp,"/assets/poster.jpg");assert.equal(result.mediaType,"video");
});
test("a reordered image cover does not retain a previous video source",async()=>{
 const content=seed();content.projects[0].mediaType="video";content.projects[0].video="/assets/render.mp4";content.projects[0].frames=[{asset:"/assets/render.mp4",thumbWebp:"/assets/poster.jpg",mediaType:"video",position:2},{asset:"/assets/still.webp",thumbWebp:"/assets/still-thumb.webp",mediaType:"image",position:1}];
 const result=(await validateSeed(content)).projects[0];assert.equal(result.mediaType,"image");assert.equal(result.video,null);assert.equal(result.heroWebp,"/assets/still.webp");
});
test("every video frame requires its own preview before publication",async()=>{
 const content=seed();content.projects[0].frames=[{asset:"/assets/still.webp",thumbWebp:"/assets/still-thumb.webp",mediaType:"image"},{asset:"/assets/render.mp4",mediaType:"video"}];
 await assert.rejects(validateSeed(content),/thumbnail for every video/);
});
