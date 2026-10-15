import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
const data={'session:s':{id:'s',targetId:1,dashboardId:2}},listeners=[],tabs=new Map([[1,{id:1,url:'https://site.test/',status:'complete',windowId:1}],[2,{id:2,url:'chrome-extension://test/dashboard/index.html?session=s',status:'complete',windowId:1}]]);
const event={addListener(){}};let active=false;
const chrome={runtime:{id:'test',getURL:path=>'chrome-extension://test/'+path,onMessage:{addListener(fn){listeners.push(fn);}},onConnect:event,async sendMessage(){return{};}},action:{onClicked:event},windows:{async update(){}},scripting:{async executeScript(){}},storage:{session:{async get(key){return key===null?structuredClone(data):{[key]:structuredClone(data[key])};},async set(value){Object.assign(data,structuredClone(value));},async remove(key){delete data[key];}}},tabs:{onRemoved:event,onUpdated:event,async get(id){if(!tabs.has(id))throw new Error('closed');return tabs.get(id);},async query(){return [...tabs.values()];},async update(id,value){Object.assign(tabs.get(id),value);return tabs.get(id);},async sendMessage(id,message){
 if(message.type==='PING')return {ok:true,data:{version:active?'1.9.1':'none',active}};
 if(message.type==='START'){active=true;return {ok:true,data:{count:2,problems:1}};}
 if(message.type==='COMMAND_EXECUTE')return {ok:true,data:{url:tabs.get(id).url,matched:1,total:2,visible:2,hidden:0,html:0,metadata:0,unverified:0,truncated:false}};
 return {ok:true,data:{}};
}}};
const context=vm.createContext({chrome,URL,URLSearchParams,crypto:webcrypto,structuredClone,setTimeout,clearTimeout,console,AbortController,DOMException,TextEncoder,TextDecoder,Blob,fetch});
vm.runInContext('globalThis.self=globalThis',context);
const modules=new Map();
async function load(url){
 if(!modules.has(url))modules.set(url,readFile(new URL(url),'utf8').then(source=>new vm.SourceTextModule(source,{context,identifier:url,initializeImportMeta(meta){meta.url=url;},importModuleDynamically(){throw new Error('import() is disallowed on ServiceWorkerGlobalScope');}})));
 return modules.get(url);
}
const entry=await load(new URL('../../../../../browser-extension/background/service-worker.js',import.meta.url).href);await entry.link((specifier,module)=>load(new URL(specifier,module.identifier).href));await entry.evaluate();
const reply=await new Promise(resolve=>listeners[0]({channel:'o2-dashboard',session:'s',type:'COMMAND_EXECUTE',payload:{url:'https://site.test/',plan:{action:'view',scope:'page',category:'image',filter:'missing-alt'}}},{id:'test',tab:{id:2},url:'chrome-extension://test/dashboard/index.html?session=s'},resolve));
assert.equal(reply.ok,true,reply.error);assert.equal(reply.data.command.matched,1);assert.equal(active,true);console.log('Cold module worker graph executes image command with dynamic imports prohibited.');
