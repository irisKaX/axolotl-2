import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchSearchText} from '../tools/web-search/network.js';
import {crawlSite} from '../tools/web-search/crawler.js';
const url='https://www.o2.cz/osobni/oneplay/sport';
const login='https://login-a-moje.o2.cz/cas-external/login?service=SECRET&forceLogin=true';
const html='<h1>Chance liga</h1><div id="oneplay-a267869"></div>';
function response(text,final=url,type='text/html',status=200){const r=new Response(text,{status,headers:{'content-type':type}});Object.defineProperties(r,{url:{value:final},redirected:{value:final!==url}});return r;}
test('O2 CAS login redirect retries the original page with the existing session and does not follow authenticated redirects',async()=>{
 const calls=[];let cancelled=false;
 const publicResponse=response('Login',login);const cancel=publicResponse.body.cancel.bind(publicResponse.body);publicResponse.body.cancel=()=>{cancelled=true;return cancel();};
 const r=await fetchSearchText(url,{fetchImpl:async(u,o)=>{calls.push({url:u,...o});return o.credentials==='include'?response(html):publicResponse;}});
 assert.equal(r.text,html);assert.equal(r.sessionUsed,true);assert.equal(cancelled,true);assert.equal(calls.length,2);
 assert.equal(calls[0].credentials,'omit');assert.equal(calls[0].redirect,'follow');
 assert.equal(calls[1].url,url);assert.equal(calls[1].credentials,'include');assert.equal(calls[1].redirect,'error');assert.equal(calls[1].referrerPolicy,'no-referrer');
});
test('XML sitemap behind CAS uses the same recovery and keeps XML validation',async()=>{
 const r=await fetchSearchText('https://www.o2.cz/sitemap/business.xml',{kind:'xml',fetchImpl:async(u,o)=>o.credentials==='include'?response('<urlset/>',u,'application/xml'):response('Login',login)});
 assert.equal(r.text,'<urlset/>');assert.equal(r.sessionUsed,true);
});
test('a normal public redirect never enables browser credentials',async()=>{
 const calls=[];const r=await fetchSearchText(url,{fetchImpl:async(u,o)=>{calls.push(o);return response(html,'https://www.o2.cz/osobni/oneplay/');}});
 assert.equal(r.text,html);assert.equal(calls.length,1);assert.equal(calls[0].credentials,'omit');assert.equal(r.sessionUsed,false);
});
test('a refused session retry reports login destination and stops after two requests',async()=>{
 let calls=0;
 await assert.rejects(fetchSearchText(url,{fetchImpl:async(u,o)=>{calls++;if(o.credentials==='include')throw new TypeError('Failed to fetch');return response('Login',login);}}),e=>{
  assert.equal(e.code,'AUTH_SESSION_REQUIRED');assert.equal(e.sessionRetried,true);assert.equal(e.finalUrl,'https://login-a-moje.o2.cz/cas-external/login?service=[skryto]&forceLogin=[skryto]');return true;
 });assert.equal(calls,2);
});
test('timeout and cancellation interrupt the session retry under the original request deadline',async()=>{
 for(const cancel of [false,true]){
  const controller=new AbortController();let entered;
  const started=new Promise(r=>entered=r);
  const pending=fetchSearchText(url,{signal:controller.signal,timeoutMs:80,fetchImpl:async(u,o)=>{if(o.credentials==='omit')return response('Login',login);entered();return new Promise(()=>{});}});
  await started;if(cancel)controller.abort();await assert.rejects(pending,e=>cancel?e.name==='AbortError':e.code==='TIMEOUT');
 }
});
test('crawler reports successful session loads for pages and maps',async()=>{
 const seed={url,text:'Chance liga',references:[],links:[]};
 const r=await crawlSite(seed,{kind:'phrase',query:'Chance liga',scope:'site',maxPages:100},{parse:(text,url)=>({url,text,references:[],links:[]}),parseMap:()=>({urls:[],index:false}),fetchText:async(u)=>({url:u,text:u.endsWith('robots.txt')?'Sitemap: /sitemap.xml':u.endsWith('.xml')?'<urlset/>':'Chance liga',sessionUsed:true})});
 assert.equal(r.sessionLoads,3);assert.equal(r.errors.length,0);assert.equal(r.items.length,2);
});
test('an unsuccessful credentialed HTTP response retains retry evidence and its original HTTP code',async()=>{
 await assert.rejects(fetchSearchText(url,{fetchImpl:async(u,o)=>o.credentials==='include'?response('Forbidden',u,'text/html',403):response('Unauthorized',u,'text/html',401)}),e=>{
  assert.equal(e.code,'HTTP_ERROR');assert.equal(e.status,403);assert.equal(e.sessionRetried,true);return true;
 });
});
