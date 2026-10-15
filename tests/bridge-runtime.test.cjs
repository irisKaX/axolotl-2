const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const modulePath = path.resolve(__dirname, '../browser-extension/tool-bridge.js');
const appUrl = 'https://iriskax.github.io/axolotl-2/';
const app = { id: 'extension', frameId: 0, documentId: 'document-a', url: appUrl, tab: { id: 90, windowId: 7, url: appUrl } };
const target = { tabId: 3, url: 'https://example.test/page' };
function setup() {
  const storage = {}, sent = [], downloads = [];
  const tabs = new Map([[90, app.tab], [3, { id: 3, windowId: 7, url: target.url }], [4, { id: 4, windowId: 8, url: target.url }], [5, { id: 5, windowId: 7, url: target.url, incognito: true }]]);
  global.chrome = {
    runtime: { id: 'extension' },
    storage: { session: { async get(key) { return key === null ? {...storage} : {[key]:storage[key]}; }, async set(data) { Object.assign(storage,data); }, async remove(keys) { for(const key of [].concat(keys)) delete storage[key]; } } },
    tabs: { async get(id) { if (!tabs.has(id)) throw Error('Missing'); return {...tabs.get(id)}; }, async sendMessage(id, message, options) { sent.push({id,message,options}); return {ok:true,data:{version:'1.3.4',restored:true}}; }, async update(id) { return tabs.get(id); } },
    windows: { async update() {} },
    permissions: { async contains() { return true; } },
    downloads: { async search({id}) { return downloads.filter(item=>item.id===id); }, async cancel(id) { downloads.push({cancelled:id}); } },
  };
  return { storage, tabs, sent, downloads };
}
async function bridge() { assert.ok(fs.existsSync(modulePath), 'privileged tool bridge must be implemented'); return import(modulePath); }
function request(operation,payload={},changes={}) { return {type:'AXOLOTL_TOOL_REQUEST',requestId:crypto.randomUUID(),clientId:'client-a',operation,payload,target,...changes}; }

test('rejects foreign senders, nested app paths and unsupported target tabs before tool work', async()=>{
  setup(); const b=await bridge();
  for(const change of [{id:'foreign'}, {frameId:2}, {url:'https://evil.test/'}, {url:appUrl+'other/'}, {tab:{...app.tab,incognito:true}}])
    await assert.rejects(b.handleToolRequest(request('SITE_ACCESS'), {...app,...change}), /zdroj|relac|povolen/i);
  for(const bad of [{tabId:4,url:target.url}, {tabId:5,url:target.url}, {tabId:90,url:appUrl}, {...target,url:'https://example.test/changed'}])
    await assert.rejects(b.handleToolRequest(request('SITE_ACCESS',{}, {target:bad}),app), /kart|strán|změnil/i);
});

test('isolates session events by dashboard document and target identity', async()=>{
  const env=setup();const b=await bridge();
  await b.handleToolRequest(request('SITE_ACCESS'),app);
  const session=Object.values(env.storage).find(v=>v?.dashboardId===90);
  await assert.rejects(b.handlePageEvent({channel:'o2-content',session:session.id,type:'PICK_CANCEL'}, {...app,tab:{id:4,windowId:8,url:target.url},url:target.url}), /kart|relac/i);
  await b.handlePageEvent({channel:'o2-content',session:session.id,type:'PICK_CANCEL',data:{}},{id:'extension',frameId:0,url:target.url,tab:env.tabs.get(3)});
  const event=env.sent.find(v=>v.message.type==='AXOLOTL_TOOL_EVENT');
  assert.equal(event.id,90);assert.equal(event.message.clientId,'client-a');assert.equal(event.options.documentId,'document-a');assert.equal(event.message.event.data.originTabId,3);
});

test('bounds network bytes, disallows credentials for images and suppresses cookie headers', async()=>{
  setup();const b=await bridge();
  const previous=global.fetch;
  global.fetch=async()=>new Response('abcdef',{headers:{'content-type':'text/html','set-cookie':'secret=value'}});
  try {
    await assert.rejects(b.handleToolRequest(request('REMOTE_FETCH',{url:target.url,purpose:'search',maxBytes:3}),app), /velikost|limit/i);
    await assert.rejects(b.handleToolRequest(request('REMOTE_FETCH',{url:target.url,purpose:'image',credentials:'include'}),app), /přihláš|relac|povol/i);
    const result=await b.handleToolRequest(request('REMOTE_FETCH',{url:target.url,purpose:'search'}),app);
    assert.equal(Buffer.from(result.base64,'base64').toString(),'abcdef');assert.equal(new Headers(result.headers).get('set-cookie'),null);
  } finally {global.fetch=previous;}
});

test('cancels only the originating dashboard request and propagates abort during fetch',async()=>{
  const env=setup();const b=await bridge();const previous=global.fetch;
  let started;const ready=new Promise(resolve=>started=resolve);
  global.fetch=async(url,{signal})=>{started();return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')),{once:true}));};
  try {
    const message=request('REMOTE_FETCH',{url:target.url,purpose:'search'});
    const pending=b.handleToolRequest(message,app);const rejected=assert.rejects(pending,e=>e.name==='AbortError');await ready;
    const foreign=await b.handleToolRequest(request('CANCEL_REQUEST',{requestId:message.requestId}),{...app,tab:{...app.tab,id:91}});assert.equal(foreign.cancelled,false);
    const result=await b.handleToolRequest(request('CANCEL_REQUEST',{requestId:message.requestId}),app);
    assert.equal(result.cancelled,true);await rejected;
    assert.equal(env.sent.some(v=>v.message.type==='AXOLOTL_TOOL_EVENT'),false);
  } finally {global.fetch=previous;}
});

test('cancellation arriving during session creation prevents a network request',async()=>{
  setup();const b=await bridge();const previous=global.fetch;let calls=0;
  global.fetch=async()=>{calls++;return new Response('unused');};
  try {
    const message=request('REMOTE_FETCH',{url:target.url,purpose:'search'});
    const pending=b.handleToolRequest(message,app);const rejected=assert.rejects(pending,e=>e.name==='AbortError');
    await b.handleToolRequest(request('CANCEL_REQUEST',{requestId:message.requestId}),app);
    await rejected;assert.equal(calls,0);
  }finally{global.fetch=previous;}
});

test('allows authenticated search retry only after a verified login response and never follows its redirect',async()=>{
  setup();const b=await bridge();const previous=global.fetch;const received=[];
  global.fetch=async(url,options)=>{received.push(options);return new Response(options.credentials==='include'?'secret page':'login',{status:options.credentials==='include'?200:401,headers:{'content-type':'text/html'}});};
  try{
    const payload={url:target.url,purpose:'search'};
    await assert.rejects(b.handleToolRequest(request('REMOTE_FETCH',{...payload,credentials:'include',redirect:'error'}),app),/přihlášen|relac/i);
    const publicResult=await b.handleToolRequest(request('REMOTE_FETCH',payload),app);assert.equal(publicResult.status,401);assert.equal(publicResult.base64,'');
    const result=await b.handleToolRequest(request('REMOTE_FETCH',{...payload,credentials:'include',redirect:'error'}),app);
    assert.equal(Buffer.from(result.base64,'base64').toString(),'secret page');assert.equal(received[1].redirect,'error');
    await assert.rejects(b.handleToolRequest(request('REMOTE_FETCH',{...payload,credentials:'include',redirect:'error'}),app),/přihlášen|relac/i);
  }finally{global.fetch=previous;}
});

test('metadata probes return a bounded prefix while full images reject oversize streams',async()=>{
  setup();const b=await bridge();const previous=global.fetch;
  global.fetch=async()=>new Response(new Uint8Array(100),{headers:{'content-type':'image/png'}});
  try{
    const payload={url:'https://cdn.example.test/image.png',purpose:'image',maxBytes:32};
    await assert.rejects(b.handleToolRequest(request('REMOTE_FETCH',payload),app),/limit/);
    const result=await b.handleToolRequest(request('REMOTE_FETCH',{...payload,prefix:true,headers:{Range:'bytes=0-31'}}),app);assert.equal(Buffer.from(result.base64,'base64').length,32);
  }finally{global.fetch=previous;}
});

test('navigation invalidates sessions and prevents late target events',async()=>{
  const env=setup();const b=await bridge();await b.handleToolRequest(request('SITE_ACCESS'),app);
  const session=Object.values(env.storage).find(v=>v?.dashboardId===90);
  await b.cleanupTab(3);assert.ok(b.documentTokens.get(3));
  await assert.rejects(b.handlePageEvent({channel:'o2-content',session:session.id,type:'PICK_CANCEL'},{id:'extension',frameId:0,url:target.url,tab:env.tabs.get(3)}),/Relace|relace/);
});

test('remote PDF download reports success only after browser confirms completion',async()=>{
  const env=setup();const b=await bridge();let notify;
  chrome.downloads.download=async()=>{env.downloads.push({id:17,state:'in_progress'});return 17;};
  chrome.downloads.onChanged={addListener(fn){notify=fn;},removeListener(){}};
  let finished=false;const pending=b.handleToolRequest(request('DOWNLOAD_FILE',{url:'https://example.test/file.pdf',name:'file.pdf'}),app).then(result=>{finished=true;return result;});
  while(!notify)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(finished,false);env.downloads[0].state='complete';notify({id:17,state:{current:'complete'}});
  assert.equal((await pending).state,'complete');
});

test('disconnecting a dashboard cleans its session without requiring a surviving target',async()=>{
  const env=setup();const b=await bridge();await b.handleToolRequest(request('SITE_ACCESS'),app);
  const session=Object.values(env.storage).find(v=>v?.dashboardId===90);
  env.tabs.delete(3);
  const result=await b.handleToolRequest(request('SESSION_END'),app);
  assert.equal(result.ended,true);assert.equal(env.storage['session:'+session.id],undefined);
});

test('session release cleans picker and capture but cannot remove another client or a newer target',async()=>{
  const env=setup();const b=await bridge();await b.handleToolRequest(request('SITE_ACCESS'),app);
  const old=Object.values(env.storage).find(v=>v?.dashboardId===90);
  const capture={session:old.id,token:'capture-token',targetId:3,windowId:7,dashboardId:90};
  env.storage['capture:capture-token']=capture;env.storage['capture-window:7']=capture;
  const foreign=await b.handleToolRequest(request('SESSION_END',{}, {clientId:'foreign-client'}),app);assert.equal(foreign.ended,false);
  assert.ok(env.storage['session:'+old.id]);
  assert.equal((await b.handleToolRequest(request('SESSION_END'),app)).ended,true);
  assert.equal(env.storage['capture:capture-token'],undefined);assert.equal(env.storage['capture-window:7'],undefined);
  assert.ok(env.sent.some(item=>item.message.type==='CLEANUP_SESSION'&&item.message.session===old.id));
  env.tabs.set(6,{id:6,windowId:7,url:'https://other.test/'});
  const changed={tabId:6,url:'https://other.test/'};
  await b.handleToolRequest(request('SITE_ACCESS',{}, {target:changed}),app);
  const current=Object.values(env.storage).find(v=>v?.dashboardId===90);
  assert.equal((await b.handleToolRequest(request('SESSION_END'),app)).ended,false);
  assert.ok(env.storage['session:'+current.id]);
});

test('event delayed by a browser API cannot escape into the next target session',async()=>{
  const env=setup();const b=await bridge();await b.handleToolRequest(request('SITE_ACCESS'),app);
  const session=Object.values(env.storage).find(v=>v?.dashboardId===90);
  const get=chrome.tabs.get;let entered,release,delayed=false;
  const ready=new Promise(resolve=>entered=resolve);
  chrome.tabs.get=async id=>{if(id===3&&!delayed){delayed=true;entered();await new Promise(resolve=>release=resolve);}return get(id);};
  const event=b.handlePageEvent({channel:'o2-content',session:session.id,type:'PICK_RESULT',data:{}},{id:'extension',frameId:0,url:target.url,tab:env.tabs.get(3)});
  const rejected=assert.rejects(event,/relace|Relace|změnil/);await ready;
  env.tabs.set(6,{id:6,windowId:7,url:'https://other.test/'});
  await b.handleToolRequest(request('SITE_ACCESS',{}, {target:{tabId:6,url:'https://other.test/'}}),app);
  release();await rejected;
  assert.equal(env.sent.some(item=>item.message.type==='AXOLOTL_TOOL_EVENT'),false);
});

test('release waits for an earlier session creation and cancels its pending fetch',async()=>{
  const env=setup();const b=await bridge();const previous=global.fetch;const get=chrome.tabs.get;
  let entered,release,delayed=false,fetchSignal;
  const ready=new Promise(resolve=>entered=resolve);
  chrome.tabs.get=async id=>{if(id===3&&!delayed){delayed=true;entered();await new Promise(resolve=>release=resolve);}return get(id);};
  global.fetch=async(url,{signal})=>{fetchSignal=signal;return new Promise((resolve,reject)=>{const cancel=()=>reject(new DOMException('Cancelled','AbortError'));if(signal.aborted)cancel();else signal.addEventListener('abort',cancel,{once:true});});};
  try {
    const pending=b.handleToolRequest(request('REMOTE_FETCH',{url:target.url,purpose:'search'}),app);
    const rejected=assert.rejects(pending);await ready;
    const ended=b.handleToolRequest(request('SESSION_END'),app);release();
    assert.equal((await ended).ended,true);await rejected;
    assert.equal(Object.values(env.storage).some(v=>v?.dashboardId===90),false);
    if(fetchSignal)assert.equal(fetchSignal.aborted,true);
  }finally{global.fetch=previous;}
});
