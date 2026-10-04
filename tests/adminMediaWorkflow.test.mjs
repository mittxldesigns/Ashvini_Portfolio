import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath,pathToFileURL } from 'node:url';
const require=createRequire(import.meta.url);let jsdom;
try{jsdom=require.resolve(process.env.JSDOM_MODULE_PATH||'jsdom');}catch{}
test('gallery batches preserve the cover, keep completed files after failure and route general paste to the gallery',{skip:!jsdom},async()=>{
 const{JSDOM}=await import(pathToFileURL(jsdom).href),dom=new JSDOM('<div id="root"></div>',{url:'https://example.test/admin',pretendToBeVisual:true});
 const content={schemaVersion:1,profile:{name:'Ash',editorialCategories:[],sketchChapters:[]},projects:[{id:1,slug:'work',title:'Work',full:'/cover.webp',thumbWebp:'/thumb.webp',roles:[],tools:[]}],editorial:[],sketches:[]};
 let serial=0,saved,revision=1;const created=[];const globals=new Map();
 class XHR{open(){}setRequestHeader(){}upload={};send(file){queueMicrotask(()=>{if(file.name==='broken.png'){this.onerror();return;}this.status=200;this.responseText='{}';this.onload();});}}
 const fetch=async(url,init={})=>{const body=init.body?JSON.parse(init.body):null;
  if(url==='/api/auth/session')return Response.json({authenticated:true,csrfToken:'fixture'});
  if(url==='/api/admin/media'){created.push(body.filename);serial++;return Response.json({id:serial,original:`/media/${serial}/original`,preview:`/media/${serial}/preview`});}
  if(body?.content){saved=body.content;revision++;}
  return Response.json({content:body?.content||content,revision,publishedRevision:1,history:[]});
 };
 dom.window.matchMedia=()=>({matches:false});
 for(const[key,value]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,requestAnimationFrame:dom.window.requestAnimationFrame.bind(dom.window),XMLHttpRequest:XHR,fetch,IS_REACT_ACT_ENVIRONMENT:true})){globals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});}
 let root;
 try{
  const{build}=await import('esbuild');
  const compiled=await build({entryPoints:[fileURLToPath(new URL('../src/componenets/PortfolioAdmin.jsx',import.meta.url))],bundle:true,write:false,format:'esm',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'test-adapters',setup(b){
   b.onResolve({filter:/^react(?:-dom)?(?:\/.*)?$/},a=>({path:pathToFileURL(require.resolve(a.path)).href,external:true}));
   b.onResolve({filter:/\/mediaUpload\.js$/},a=>a.namespace==='test'?{path:pathToFileURL(a.path).href,external:true}:{path:'preview',namespace:'test'});
   b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:`export {validateUpload} from ${JSON.stringify(fileURLToPath(new URL('../src/lib/mediaUpload.js',import.meta.url)))}; export async function previewBlob(){return {blob:new Blob(['preview'],{type:'image/webp'}),width:640,height:480};}`,loader:'js',resolveDir:process.cwd()}));
  }}]});
  const{default:Admin}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].contents).toString('base64'));
  const React=await import('react'),{createRoot}=await import('react-dom/client');
  const flush=async(fn)=>React.act(async()=>{fn();await new Promise(r=>setTimeout(r,25));});
  root=createRoot(document.getElementById('root'));await flush(()=>root.render(React.createElement(Admin)));
  const file=name=>new dom.window.File(['image bytes here'],name,{type:'image/png'});
  const drop=async(files,target=document.querySelector('[aria-label="Add to gallery"][role="group"]'),type='drop')=>{
   const event=new dom.window.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(event,type==='paste'?'clipboardData':'dataTransfer',{value:{files,types:['Files']}});await flush(()=>target.dispatchEvent(event));return event;
  };
  const save=async()=>flush(()=>[...document.querySelectorAll('button')].find(n=>n.textContent==='Save draft').click());
  await drop([file('first.png'),file('second.png')]);await save();
  assert.equal(saved.projects[0].frames.length,3);assert.equal(saved.projects[0].frames[0].full,'/cover.webp');assert.equal(saved.projects[0].thumbWebp,'/thumb.webp');
  await drop([file('kept.png'),file('broken.png'),file('unstarted.png')]);
  assert.match(document.querySelector('[role="alert"]').textContent,/1 of 3 files added/);assert(!created.includes('unstarted.png'));await save();assert.equal(saved.projects[0].frames.length,4);
  await drop([file('pasted.png')],document.querySelector('.cms-panel'),'paste');await save();assert.equal(saved.projects[0].frames.length,5);assert.equal(saved.projects[0].frames[0].full,'/cover.webp');
  const before=created.length;await drop([file('not-an-upload.png')],document.querySelector('input[aria-label="Title"]'),'paste');assert.equal(created.length,before);
 }finally{if(root){const{act}=await import('react');await act(()=>root.unmount());}dom.window.close();for(const[k,v]of globals){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}}
});
