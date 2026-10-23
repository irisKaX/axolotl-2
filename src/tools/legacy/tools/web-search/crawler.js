import {redirectFailure} from './diagnostics.js';
import {collectSearchPage} from '../../../../../browser-extension/tools/web-search/collect.js';
import {searchSnapshot} from './model.js';
import {fetchSearchText} from './network.js';
import {crawlLimits,durationLabel,MAX_SITEMAP_LOCATIONS,CRAWL_DEADLINE_MS,PROGRESS_INTERVAL_MS} from './limits.js';

function sameOrigin(value,base){try{const u=new URL(value,base);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password&&u.origin===new URL(base).origin?u:null;}catch{return null;}}
function normalizeSearchUrl(value,base,allowResource=false){
  const u=sameOrigin(value,base);if(!u||u.href.length>8192)return null;
  let path;try{path=decodeURIComponent(u.pathname);}catch{return null;}
  if(/(?:^|\/)(?:logout|signout|sign-out|login|signin|sign-in|delete|remove|unsubscribe|checkout|cart|kosik|prihlaseni|odhlaseni|auth)(?:\/|[.;-]|$)/i.test(path))return null;
  if(!allowResource&&/\.(?:pdf|jpe?g|png|webp|avif|gif|svg|ico|mp[34]|webm|zip|gz|rar|7z|exe|dmg|woff2?|ttf|css|js|json|xml|txt|docx?|xlsx?|pptx?)$/i.test(path))return null;
  for(const [k,v] of [...u.searchParams]){if(/^(utm_.+|fbclid|gclid|_ga)$/i.test(k))u.searchParams.delete(k);else if(/^(action|do|cmd|logout|delete|remove|unsubscribe|token|session|sid)$/i.test(k)||/^(logout|delete|unsubscribe)$/i.test(v))return null;}
  u.hash='';u.searchParams.sort();return u.href;
}
export const normalizePageUrl=(value,base)=>normalizeSearchUrl(value,base);
export function parseSitemap(text,Parser=DOMParser){
  const doc=new Parser().parseFromString(text,'application/xml');
  if(doc.querySelector('parsererror'))throw Error('Neplatné XML mapy webu.');
  const root=doc.documentElement,index=root.localName==='sitemapindex';if(!index&&root.localName!=='urlset')throw Error('Neznámý formát mapy webu.');
  const urls=[];let truncated=false;
  // Linked siblings avoid repeatedly materializing a large live HTMLCollection.
  for(let child=root.firstElementChild;child;child=child.nextElementSibling){
    if(child.localName!==(index?'sitemap':'url'))continue;
    let loc=child.firstElementChild;while(loc&&loc.localName!=='loc')loc=loc.nextElementSibling;
    if(!loc)continue;if(urls.length>=MAX_SITEMAP_LOCATIONS){truncated=true;break;}urls.push(loc.textContent.trim());
  }
  return {index,urls,truncated};
}
export async function crawlSite(seed,options,{signal,onProgress=()=>{},parse=(html,url)=>collectSearchPage({html,url}),parseMap=parseSitemap,fetchText=fetchSearchText,deadlineMs=CRAWL_DEADLINE_MS}={}){
  const origin=new URL(seed.url).origin,aborter=new AbortController(),limits=crawlLimits(options.maxPages,{deadlineMs});
  let timeLimit=false,totalBytes=0,publishOnStop=()=>{};
  const stop=()=>{aborter.abort();publishOnStop();};if(signal?.aborted)stop();else signal?.addEventListener('abort',stop,{once:true});
  const timer=setTimeout(()=>{timeLimit=true;stop();},limits.deadlineMs);
  const state={items:[],components:[],errors:[],mapErrors:[],scanned:0,attempted:0,discovered:0,remaining:0,limit:'',limits,cancelled:false,phase:'maps',bytes:0,truncatedPages:0,redirected:0,sessionLoads:0};
  // Queue cursors and membership sets keep work linear as discovery grows.
  // Only matching page results need to survive duplicate/redirect checks.
  const queue=[],pending=new Set(),seen=new Set(),visited=new Set(),accepted=new Set(),matchingPages=new Map(),componentGroups=new Map(),componentPages=new Map(),maps=[],seenMaps=new Set(),finishedMaps=new Set();
  let queueAt=0,mapAt=0,progressTimer,lastProgress=-Infinity;
  const counts=()=>{state.discovered=seen.size;state.remaining=pending.size;state.bytes=totalBytes;};
  const snapshot=()=>({...state,items:state.items.map(item=>({...item,redirectedFrom:[...item.redirectedFrom]})),components:state.components.map(c=>({...c,pages:[...c.pages]})),errors:[...state.errors],mapErrors:[...state.mapErrors]});
  const emit=()=>{clearTimeout(progressTimer);progressTimer=undefined;counts();lastProgress=Date.now();onProgress(snapshot());};
  const update=(force=false)=>{
    counts();const wait=PROGRESS_INTERVAL_MS-(Date.now()-lastProgress);
    if(force||wait<=0)emit();else if(progressTimer===undefined)progressTimer=setTimeout(emit,wait);
  };
  const timeoutMessage=()=>`Časový limit ${durationLabel(limits.deadlineMs)}.`;
  // Flush completed work synchronously on Stop so the controller can retain it
  // before releasing its operation, even when a progress update was throttled.
  publishOnStop=()=>{state.cancelled=!!signal?.aborted;if(timeLimit)state.limit=timeoutMessage();update(true);};
  const resolve=(value,base)=>{try{return new URL(value,base).href;}catch{return '';}};
  const add=(value,base=origin)=>{const u=normalizePageUrl(resolve(value,base),origin);if(!u||seen.has(u))return;if(seen.size>=limits.discoveredUrls){state.limit||=`Limit ${limits.discoveredUrls.toLocaleString('cs-CZ')} nalezených URL.`;return;}seen.add(u);if(!visited.has(u)){pending.add(u);queue.push(u);}};
  const visit=url=>{visited.add(url);pending.delete(url);};
  const addMap=(value,base=origin)=>{const allowed=normalizeSearchUrl(resolve(value,base),origin,true);if(!allowed)return;const u=new URL(allowed);if(seenMaps.has(u.href)||finishedMaps.has(u.href))return;if(seenMaps.size>=limits.sitemaps){state.limit||=`Limit ${limits.sitemaps} map webu.`;return;}seenMaps.add(u.href);maps.push(u.href);};
  const allowUrl=url=>!!normalizeSearchUrl(url,origin,true);
  const fetchOne=async(url,kind)=>{
    const r=await fetchText(url,{kind,allowUrl,signal:aborter.signal,maxBytes:kind==='html'?limits.pageBytes:limits.sitemapBytes,timeoutMs:limits.requestTimeoutMs,onBytes:n=>{totalBytes+=n;if(totalBytes>limits.totalBytes){state.limit=`Limit ${(limits.totalBytes/(1024*1024)).toLocaleString('cs-CZ')} MiB načtených dat.`;stop();throw Object.assign(Error(state.limit),{code:'TRANSFER_LIMIT'});}}});
    const finalUrl=r.url||url;
    if(!allowUrl(finalUrl))throw redirectFailure(finalUrl,url);
    if(r.redirected||finalUrl!==url)state.redirected++;
    if(r.sessionUsed)state.sessionLoads++;
    return {...r,url:finalUrl};
  };
  const accept=(snapshot,requestedUrl)=>{
    const canonical=normalizePageUrl(snapshot.url,origin)||snapshot.url;
    const alias=requestedUrl&&requestedUrl!==canonical?requestedUrl:null;
    if(accepted.has(canonical)){const existing=matchingPages.get(canonical);if(existing&&alias&&!existing.redirectedFrom.includes(alias))existing.redirectedFrom.push(alias);return;}
    const {components=[],...item}=searchSnapshot(snapshot,options),r={...item,redirectedFrom:alias?[alias]:[]};accepted.add(canonical);
    for(const component of components){
      let group=componentGroups.get(component.id);
      if(!group){group={...component,pages:[]};componentGroups.set(component.id,group);componentPages.set(component.id,new Set());state.components.push(group);}
      // One common component can occur in desktop and mobile chrome on one page.
      const pages=componentPages.get(component.id);if(!pages.has(r.url)){pages.add(r.url);group.pages.push({url:r.url,title:r.title,source:r.source});}
      group.count=Math.max(group.count,component.count);group.truncated||=component.truncated;
    }
    visit(canonical);if(seen.size<limits.discoveredUrls)seen.add(canonical);
    state.scanned++;if(r.count){state.items.push(r);matchingPages.set(canonical,r);}if(r.truncated)state.truncatedPages++;for(const link of snapshot.links||[])add(link);
  };
  const failed=(url,error)=>({url,reason:error.message||'Načtení selhalo.',code:error.code||'CONTENT_ERROR',...(error.status?{status:error.status}:{}),...(error.detail?{detail:error.detail}:{}),...(error.finalUrl?{finalUrl:error.finalUrl}:{}),...(error.redirectReason?{redirectReason:error.redirectReason}:{}),...(error.sessionRetried?{sessionRetried:true}:{})});
  try{
    const first=normalizePageUrl(seed.url,origin);
    // An action URL is readable in the already-open page but is never requested.
    if(seed.source==='fetch-pending'){
      if(!first)throw Error('Výchozí adresu nelze bezpečně procházet.');
      add(first);update(true);
      if(!aborter.signal.aborted){
        visit(first);state.attempted++;
        try{const r=await fetchOne(first,'html');if(!aborter.signal.aborted)accept(parse(r.text,r.url),first);}
        catch(error){if(!aborter.signal.aborted)state.errors.push(failed(first,error));}
      }
    }else {if(first){seen.add(first);visit(first);}state.attempted++;accept(seed);}
    add(origin+'/');update(true);
    if(aborter.signal.aborted){state.cancelled=!!signal?.aborted;if(timeLimit)state.limit=timeoutMessage();state.phase='done';update(true);return snapshot();}
    try{const r=await fetchOne(origin+'/robots.txt','text');for(const line of r.text.split(/\r?\n/)){const m=/^\s*sitemap\s*:\s*(\S+)/i.exec(line);if(m)addMap(m[1],r.url);}}catch(error){if(!aborter.signal.aborted&&error.message!=='HTTP 404')state.mapErrors.push(failed(origin+'/robots.txt',error));}
    let validMaps=0;
    const readMaps=async()=>{
      while(mapAt<maps.length&&!aborter.signal.aborted){const url=maps[mapAt++];if(finishedMaps.has(url))continue;try{const r=await fetchOne(url,'xml'),final=normalizeSearchUrl(r.url,origin,true);if(finishedMaps.has(final))continue;const map=parseMap(r.text);finishedMaps.add(final);if(!map.index)validMaps++;for(const loc of map.urls)map.index?addMap(loc,r.url):add(loc,r.url);if(map.truncated)state.limit||=`Mapa webu překročila limit ${limits.sitemapLocations.toLocaleString('cs-CZ')} URL.`;}catch(error){if(!aborter.signal.aborted&&error.message!=='HTTP 404')state.mapErrors.push(failed(url,error));}update();}
    };
    await readMaps();
    // Prefer the site's advertised maps. Guess common names only if none worked.
    if(!validMaps&&!aborter.signal.aborted){addMap(origin+'/sitemap.xml');addMap(origin+'/sitemap_index.xml');await readMaps();}
    state.phase='pages';update(true);
    while(queueAt<queue.length&&state.attempted<limits.maxPages&&!aborter.signal.aborted){
      const batch=[];
      while(queueAt<queue.length&&batch.length<limits.concurrency&&state.attempted<limits.maxPages){const url=queue[queueAt++];if(visited.has(url))continue;visit(url);state.attempted++;batch.push(url);}
      await Promise.all(batch.map(async url=>{try{const r=await fetchOne(url,'html');if(aborter.signal.aborted)return;accept(parse(r.text,r.url),url);}catch(error){if(!aborter.signal.aborted)state.errors.push(failed(url,error));}finally{update();}}));
    }
    if(pending.size&&state.attempted>=limits.maxPages)state.limit=`Dosažen limit ${limits.maxPages} stránek.`;
    if(timeLimit)state.limit=timeoutMessage();
    state.cancelled=!!signal?.aborted;state.phase='done';update(true);return snapshot();
  }finally{clearTimeout(timer);clearTimeout(progressTimer);signal?.removeEventListener('abort',stop);}
}
