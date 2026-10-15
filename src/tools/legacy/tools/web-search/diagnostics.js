import {crawlLimits,REQUEST_TIMEOUT_MS} from './limits.js';
// Diagnostics include the search query and counters, never collected page content.
export function diagnosticUrl(value){
 try{
  const u=new URL(value);
  if(!/^https?:$/.test(u.protocol))return '[neplatná adresa]';
  const keys=[...u.searchParams.keys()];
  return u.origin+u.pathname+(keys.length?'?'+keys.map(key=>encodeURIComponent(key)+'=[skryto]').join('&'):'');
 }catch{return '[neplatná adresa]';}
}
export function redirectFailure(finalUrl,requestedUrl,status){
 let redirectReason='invalid-url';
 try{redirectReason=new URL(finalUrl).origin===new URL(requestedUrl).origin?'excluded-url':'different-origin';}catch{}
 const message=redirectReason==='different-origin'?'Přesměrování vede na jiný web. Cílový obsah nebyl zahrnut.':redirectReason==='excluded-url'?'Přesměrování vede na adresu vyloučenou z procházení (například přihlášení nebo akční URL).':'Přesměrování vrátilo neplatnou cílovou adresu.';
 return Object.assign(Error(message),{code:'REDIRECT_OUTSIDE_SCOPE',finalUrl:diagnosticUrl(finalUrl),redirectReason,...(status?{status}:{})});
}
function diagnosticText(value){
 return String(value||'').replace(/https?:\/\/[^\s<>"'`]+/gi,url=>diagnosticUrl(url)).slice(0,1200);
}
function diagnosticFailure(error,kind){
 return {kind,url:diagnosticUrl(error.url),code:error.code||'CONTENT_ERROR',reason:diagnosticText(error.reason),...(error.stage?{stage:error.stage}:{}),...(error.detail?{detail:diagnosticText(error.detail)}:{}),...(error.status?{status:error.status}:{}),...(error.finalUrl?{finalUrl:diagnosticUrl(error.finalUrl)}:{}),...(error.redirectReason?{redirectReason:error.redirectReason}:{}),...(error.sessionRetried?{sessionRetried:true}:{})};
}
export function buildSearchDiagnostics(state,{version,installedVersion=null,userAgent='',now=new Date().toISOString()}={}){
 const search=state.search||{},r=state.result||{};
 const failures=[...(r.errors||[]).map(e=>diagnosticFailure(e,'page')),...(r.mapErrors||[]).map(e=>diagnosticFailure(e,'map'))];
 if(r.startupError)failures.unshift(diagnosticFailure(r.startupError,'startup'));
 if(r.runError)failures.push(diagnosticFailure(r.runError,'run'));
 // Also make reports from resultless startup failures explicit rather than
 // implying that a zero-page search completed successfully.
 if(!r.startupError&&!r.runError&&state.message?.kind==='error')failures.unshift(diagnosticFailure({url:search.url,code:state.message.code||'SEARCH_ERROR',reason:state.message.text,detail:state.message.detail},state.result?'run':'startup'));
 const warnings=r.seedWarning?[diagnosticFailure(r.seedWarning,'live-document')]:[];
 return JSON.stringify({app:'O2 Axolotl',version,installedVersion,createdAt:now,userAgent,transport:{credentials:'omit',redirect:'follow',sessionRetry:{credentials:'include',redirect:'error',trigger:'login-redirect or HTTP 401',maxRetries:1},timeoutMs:REQUEST_TIMEOUT_MS},...(search.scope==='site'?{limits:r.limits||crawlLimits(search.maxPages)}:{}),search:{url:diagnosticUrl(search.url),query:search.query,kind:search.kind,scope:search.scope,maxPages:search.maxPages,phraseSource:search.phraseSource,sharedComponents:search.sharedComponents,caseSensitive:!!search.caseSensitive,ignoreDiacritics:!!search.ignoreDiacritics},coverage:{method:search.scope==='site'?(r.seedWarning?'fetched-html':'live-seed-and-fetched-html'):'live-document',includesLiveSeed:!!r.scanned&&!r.seedWarning,allExistingUrlsVerified:false,rendersFetchedPages:false,includesFrames:false,includesClosedShadowRoots:false},summary:{bytes:r.bytes||0,scanned:r.scanned||0,attempted:r.attempted||0,discovered:r.discovered||0,remaining:r.remaining||0,matches:r.items?.length||0,components:r.components?.length||0,redirected:r.redirected||0,sessionLoads:r.sessionLoads||0,truncatedPages:r.truncatedPages||0,limit:r.limit||'',cancelled:!!r.cancelled,failed:!!r.failed||state.message?.kind==='error'&&!r.cancelled},...(state.message?{message:diagnosticText(state.message.text),...(state.message.code?{messageCode:state.message.code}:{}),...(state.message.detail?{messageDetail:diagnosticText(state.message.detail)}:{})}:{}),failures,warnings},null,2);
}
