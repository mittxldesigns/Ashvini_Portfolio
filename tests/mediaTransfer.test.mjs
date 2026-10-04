import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isFileTransfer, transferFiles } from '../src/lib/mediaTransfer.js';
const require=createRequire(import.meta.url);
let jsdom;
try {jsdom=require.resolve(process.env.JSDOM_MODULE_PATH || 'jsdom');} catch {}
test('file transfer extraction avoids duplicates and ignores HTML or URL-only pastes',()=>{
 const file={name:'image.png'};
 assert.deepEqual(transferFiles({files:[file],items:[{kind:'file',getAsFile:()=>file}]}),[file]);
 assert.deepEqual(transferFiles({items:[{kind:'string',getAsFile:()=>file},{kind:'file',getAsFile:()=>null},{kind:'file',getAsFile:()=>file}]}),[file]);
 assert.deepEqual(transferFiles({types:['text/html','text/plain']}),[]);
 assert.equal(isFileTransfer({types:['Files'],files:[]}),true);
 assert.equal(isFileTransfer({files:[file]}),true);
 assert.equal(isFileTransfer({types:['text/uri-list']}),false);
});
test('drop zones handle files once, preserve text paste, support keyboard selection and reject ambiguous replacement', {skip:!jsdom},async()=>{
 const {JSDOM}=await import(pathToFileURL(jsdom).href);
 const dom=new JSDOM('<div id="root"></div>',{pretendToBeVisual:true});
 const originals=new Map();
 for(const[key,value]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true})){
  originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
 }
 let root;
 try{
  const{build}=await import('esbuild');
  const compiled=await build({entryPoints:[fileURLToPath(new URL('../src/componenets/MediaUpload.jsx',import.meta.url))],bundle:true,write:false,format:'esm',jsx:'automatic',plugins:[{name:'shared-react',setup(b){b.onResolve({filter:/^react(?:\/.*)?$/},a=>({path:pathToFileURL(require.resolve(a.path)).href,external:true}));}}]});
  const{default:Upload}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].contents).toString('base64'));
  const React=await import('react'),{createRoot}=await import('react-dom/client');const calls=[];let outerPastes=0,picker=0;
  root=createRoot(document.getElementById('root'));
  const render=async(props={})=>React.act(()=>root.render(React.createElement('div',{onPaste:()=>outerPastes++},React.createElement(Upload,{label:'Cover',accept:'image/*',onFiles:files=>calls.push(files),...props},React.createElement('textarea')))));
  const group=()=>document.querySelector('[role="group"]');
  const dispatch=async(type,transfer,target=group())=>{const e=new dom.window.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,type==='paste'?'clipboardData':'dataTransfer',{value:transfer});await React.act(()=>target.dispatchEvent(e));return e;};
  const a=new dom.window.File(['a'],'a.png',{type:'image/png'}),b=new dom.window.File(['b'],'b.png',{type:'image/png'});
  await render();
  document.querySelector('input').addEventListener('click',()=>picker++);
  await React.act(()=>group().dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));assert.equal(picker,1);
  const drag={types:['Files'],files:[a]};assert.equal((await dispatch('dragover',drag)).defaultPrevented,true);assert.equal(drag.dropEffect,'copy');
  await dispatch('dragenter',drag);await dispatch('dragenter',drag);await dispatch('dragleave',drag);assert(group().classList.contains('is-drag-over'));
  await dispatch('drop',drag);assert.equal(calls.length,1);assert(!group().classList.contains('is-drag-over'));
  assert.equal((await dispatch('paste',{files:[a]})).defaultPrevented,true);assert.equal(calls.length,2);assert.equal(outerPastes,0);
  assert.equal((await dispatch('paste',{files:[a]},document.querySelector('textarea'))).defaultPrevented,false);assert.equal(calls.length,2);assert.equal(outerPastes,1);
  assert.equal((await dispatch('paste',{types:['text/plain']})).defaultPrevented,false);
  await dispatch('drop',{types:['Files'],files:[a,b]});assert.equal(calls.length,2);assert.match(document.querySelector('[role="alert"]').textContent,/one file/);
  await render({multiple:true});await dispatch('drop',{types:['Files'],files:[a,b]});assert.equal(calls.length,3);assert.deepEqual(calls.at(-1),[a,b]);
  await render({disabled:true,multiple:true});await dispatch('paste',{files:[a]});await dispatch('drop',drag);assert.equal(calls.length,3);
 }finally{if(root){const{act}=await import('react');await act(()=>root.unmount());}dom.window.close();for(const[k,v]of originals){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}}
});
