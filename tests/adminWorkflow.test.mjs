import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let jsdom;
try { jsdom = require.resolve('jsdom', { paths: [process.env.JSDOM_MODULE_PATH || process.cwd()] }); } catch { /* Optional DOM test runtime. */ }
test('editor categories, batched AI review and publishing preserve draft boundaries', { skip: !jsdom && 'Set JSDOM_MODULE_PATH to run browserless component checks' }, async () => {
  const { JSDOM } = await import(pathToFileURL(jsdom).href);
  const dom = new JSDOM('<div id="root"></div>', { url:'https://example.test/admin', pretendToBeVisual:true });
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  const content = { schemaVersion:1, profile:{ name:'Ashvini', editorialCategories:[],sketchChapters:[] }, projects:[{id:1,slug:'render',title:'Render',description:'A model.',roles:[],tools:[],frames:[]}],editorial:[],sketches:[] };
  const calls = [], originals = new Map();
  const fetch = async (url, init={}) => {
    const body = init.body ? JSON.parse(init.body) : null; calls.push({url,body});
    if (url === '/api/auth/session') return Response.json({authenticated:true,csrfToken:'test'});
    if (url === '/api/admin/content') return Response.json({content:body?.content || content,revision:body?3:2,publishedRevision:2,history:[]});
    if (url === '/api/admin/refine') return Response.json(body.cursor === 0 ? {suggestions:[{path:['projects',0,'description'],before:'A model.',after:'A 3D model.'}],warnings:[],nextCursor:1,reviewedFields:1,totalFields:2} : {suggestions:[],warnings:[],nextCursor:null,reviewedFields:2,totalFields:2});
    return Response.json({error:{message:'Draft changed elsewhere. Reload before publishing.'}}, {status:409});
  };
  for (const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,requestAnimationFrame:dom.window.requestAnimationFrame.bind(dom.window),fetch,IS_REACT_ACT_ENVIRONMENT:true})) {
    originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key)); Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  }
  let root;
  try {
    const {build} = await import('esbuild');
    const compiled = await build({entryPoints:[fileURLToPath(new URL('../src/componenets/PortfolioAdmin.jsx',import.meta.url))],bundle:true,write:false,format:'esm',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'react-shared',setup(build){build.onResolve({filter:/^react(?:-dom)?(?:\/.*)?$/},args=>({path:pathToFileURL(require.resolve(args.path)).href,external:true}));}}]});
    const {default:Admin} = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].contents).toString('base64'));
    const React = await import('react'), {createRoot} = await import('react-dom/client');
    const flush = async (fn=()=>{}) => React.act(async()=>{ fn(); await new Promise(resolve=>setTimeout(resolve,20)); });
    root=createRoot(document.getElementById('root')); await flush(()=>root.render(React.createElement(Admin)));
    const button = (text) => [...document.querySelectorAll('button')].find(el=>el.textContent===text);
    assert.equal(document.querySelector('.cms-workspace').hasAttribute('inert'),false);
    const category = [...document.querySelectorAll('label')].find(el=>el.textContent.startsWith('Category')).querySelector('select');
    await flush(()=>{category.value='Animation';category.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
    assert.equal(button('Save draft').disabled,false);
    await flush(()=>button('Refine with AI').click());
    assert.deepEqual(calls.filter(c=>c.url.endsWith('/refine')).map(c=>c.body.cursor),[0,1]);
    assert.equal(document.querySelector('.cms-refine-dialog').open,true);
    assert.equal(calls.filter(c=>c.url.endsWith('/publish')).length,0);
    await flush(()=>button('Apply selected to draft').click());
    assert.equal(document.querySelector('textarea[aria-label="Description"]').value,'A 3D model.');
    await flush(()=>button('Publish').click());
    await flush(()=>button('Publish website').click());
    const saved=calls.find(c=>c.url==='/api/admin/content'&&c.body);
    assert.equal(saved.body.content.projects[0].category,'Animation');
    assert.equal(saved.body.content.projects[0].description,'A 3D model.');
    assert.equal(saved.body.expectedRevision,2);
    assert.equal(document.querySelector('.cms-publish-dialog [role="alert"]').textContent,'Draft changed elsewhere. Reload before publishing.');
  } finally {
    if(root){const {act}=await import('react');await act(()=>root.unmount());}
    dom.window.close();
    for(const[key,value]of originals){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}
  }
});
