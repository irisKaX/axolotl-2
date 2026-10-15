import {fetchSearchText} from './network.js';
import {validateOptions,searchSnapshot} from './model.js';
import {crawlSite,normalizePageUrl} from './crawler.js';
import {DEFAULT_MAX_PAGES} from './limits.js';
let sequence=0;
const emptyResult=()=>({items:[],components:[],errors:[],mapErrors:[],scanned:0,attempted:0,discovered:0,remaining:0,limit:'',truncatedPages:0,cancelled:false,failed:false});
const failureRecord=(error,url,stage)=>({url,stage,code:error.code||'SEARCH_ERROR',reason:error.message||'Hledání selhalo.',...(error.detail?{detail:error.detail}:{})});
const policyRestricted=error=>/\b(?:enterprise|policy|administrator|administrative|managed|blocked by|restricted by)\b|správc/i.test(`${error.message||''} ${error.detail||''}`);
export class SearchController {
  constructor(app,{crawl=(seed,options,settings)=>crawlSite(seed,options,{...settings,fetchText:(url,settings)=>fetchSearchText(url,{...settings,fetchImpl:(url,init)=>app.fetch(url,{...init,purpose:'search',kind:settings.kind,maxBytes:settings.maxBytes,timeoutMs:settings.timeoutMs})})}),hasSiteAccess=url=>app.request('SITE_ACCESS',{url})}={}){this.app=app;this.crawl=crawl;this.hasSiteAccess=hasSiteAccess;this.listeners=new Set();this.operation=null;this.destroyed=false;this.state={form:{kind:'phrase',scope:'page',query:'',caseSensitive:false,ignoreDiacritics:false,maxPages:DEFAULT_MAX_PAGES,phraseSource:'visible',sharedComponents:'separate'},running:false,result:null,message:null,search:null,access:null,accessPending:false};}
  getSnapshot=()=>this.state;
  subscribe=fn=>{this.listeners.add(fn);return()=>this.listeners.delete(fn);};
  patch(next){if(this.destroyed)return;this.state={...this.state,...next};for(const listener of this.listeners)listener();}
  setForm(next){if(!this.state.running&&!this.state.accessPending)this.patch({form:{...this.state.form,...next},result:null,search:null,message:null,access:null});}
  alive(op){return !this.destroyed&&this.operation===op;}
  release(op){if(this.operation!==op)return;this.operation=null;this.app.unlock('search');this.patch({running:false});}
  async search(){
    if(this.destroyed||this.operation||this.state.accessPending)return;let options;
    try{options=validateOptions(this.state.form);this.app.ensureTarget();this.app.lock('search');}catch(error){this.patch({message:{kind:'error',text:error.message}});return;}
    const op={scanId:`search-${Date.now()}-${++sequence}`,aborter:new AbortController(),target:{...this.app.target()}};this.operation=op;
    this.patch({running:true,result:null,search:{...options,url:op.target.url},message:null,access:null});
    let abortListener,timer,stage='permissions',seedWarning;
    try{
      if(options.scope==='site'){
        const allowed=await this.hasSiteAccess(op.target.url);
        if(!this.alive(op))return;
        if(allowed!==true)throw Object.assign(Error('Pro hledání na celém webu povolte přístup k tomuto webu. Přístup k právě otevřené kartě sám o sobě pro stahování dalších stránek nestačí.'),{code:'ACCESS_DENIED'});
      }
      stage='live-document';
      const interrupted=new Promise((_,reject)=>{abortListener=()=>reject(new DOMException('Hledání zastaveno.','AbortError'));op.aborter.signal.addEventListener('abort',abortListener,{once:true});timer=setTimeout(()=>reject(Object.assign(Error('Stránka neodpověděla do 35 sekund. Zkuste hledání znovu.'),{code:'SCAN_TIMEOUT'})),35000);});
      let seed;
      try{seed=await Promise.race([this.app.request('SEARCH_SCAN',{scanId:op.scanId}),interrupted]);}
      catch(error){
        // Reading the live tab and fetching permitted public HTML are separate
        // operations. Never attempt the HTTP path without a fresh host grant.
        if(!this.alive(op))return;
        if(options.scope!=='site'||error.code!=='ACCESS_DENIED'||policyRestricted(error)||!normalizePageUrl(op.target.url,op.target.url))throw error;
        let allowed=false;try{allowed=await this.hasSiteAccess(op.target.url);}catch{}
        if(!this.alive(op))return;
        if(allowed!==true)throw error;
        seed={url:op.target.url,source:'fetch-pending'};
        seedWarning=failureRecord(error,op.target.url,stage);
        this.patch({message:{kind:'info',text:'Živou stránku se nepodařilo přečíst. Přístup k webu je povolený; hledání pokračuje ve staženém HTML včetně výchozí adresy. Obsah doplněný JavaScriptem v něm nemusí být.',code:error.code,detail:error.detail}});
      }finally{clearTimeout(timer);}
      if(!this.alive(op))return;
      stage='crawl';
      const withWarning=result=>({...result,failed:!!result.failed,...(seedWarning?{seedWarning}:{})});
      let result;
      if(options.scope==='site')result=withWarning(await this.crawl(seed,options,{signal:op.aborter.signal,onProgress:result=>{if(this.alive(op))this.patch({result:withWarning(result)});}}));
      else {
        const item=searchSnapshot(seed,options),groups=new Map();
        for(const component of item.components||[]){
          const group=groups.get(component.id);
          if(group){group.count=Math.max(group.count,component.count);group.truncated||=component.truncated;}
          else groups.set(component.id,{...component,pages:[{url:item.url,title:item.title,source:item.source}]});
        }
        result={...emptyResult(),items:item.count?[item]:[],components:[...groups.values()],scanned:1,attempted:1,discovered:1,truncatedPages:item.truncated?1:0};
      }
      if(this.alive(op))this.patch({result});
    }catch(error){if(this.alive(op)){const failure=failureRecord(error,op.target.url,stage);this.patch({message:{kind:'error',text:failure.reason,code:failure.code,detail:error.detail},access:error.code==='ACCESS_DENIED'?op.target:null,result:{...(this.state.result||emptyResult()),failed:true,phase:'done',[stage==='crawl'?'runError':'startupError']:failure,...(seedWarning?{seedWarning}:{})}});}}
    finally{clearTimeout(timer);op.aborter.signal.removeEventListener('abort',abortListener);this.release(op);}
  }
  async grantAccess(){
    const access=this.state.access;
    if(!access||this.operation||this.state.accessPending)return;
    const target={...this.app.target()};
    this.patch({accessPending:true});
    try {
      const allowed=await this.hasSiteAccess(access.url);
      if(this.destroyed||this.state.access!==access)return;
      const current=this.app.target();
      this.patch({accessPending:false});
      if(current?.id!==target.id||current?.url!==target.url)return;
      if(allowed!==true)throw new Error('Ve správě rozšíření Axolotl povolte přístup k tomuto webu. Potom zkuste znovu.');
      await this.search();
    }catch(error){if(!this.destroyed&&this.state.access===access)this.patch({accessPending:false,message:{kind:'error',text:error.message}});}
  }
  cancel(){this.patch({access:null,accessPending:false});const op=this.operation;if(!op)return;op.aborter.abort();this.patch({result:{...(this.state.result||emptyResult()),cancelled:true,phase:'done'},message:{kind:'info',text:'Hledání zastaveno. Dosud nalezené výsledky zůstávají dostupné.'}});this.release(op);void this.app.request('AUDIT_CANCEL',{scanId:op.scanId}).catch(()=>{});}
  onTargetChange(){this.cancel();this.patch({result:null,search:null,message:null});}
  destroy(){if(this.destroyed)return;this.cancel();this.patch({result:null,search:null,message:null});this.destroyed=true;this.listeners.clear();}
}
