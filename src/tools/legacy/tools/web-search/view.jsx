import {useEffect,useState,useSyncExternalStore} from 'react';
import {Search} from 'lucide-react';
import {mountReactTool} from '../../shared/react-ui/mount-tool.jsx';
import {Button} from '../../shared/react-ui/components.jsx';
import {ToolHeading,Message} from '../../shared/react-ui/tool-parts.jsx';
import {SearchController} from './controller.js';
import {PAGE_LIMIT_OPTIONS} from './limits.js';
import {buildSearchDiagnostics} from './diagnostics.js';
import {SearchResults} from './results.jsx';
import {SearchProgress} from './progress.jsx';
import {version} from '../../../../../package.json';

function Choices({legend,name,value,items,onChange,disabled}){return <fieldset className="search-choices" disabled={disabled}><legend>{legend}</legend><div>{items.map(([id,label])=><label key={id} data-selected={id===value}><input type="radio" name={name} value={id} checked={id===value} onChange={()=>onChange(id)}/><span>{label}</span></label>)}</div></fieldset>;}
function Diagnostics({state}){
 const [copied,setCopied]=useState(false),[fallback,setFallback]=useState('');
 useEffect(()=>{setCopied(false);setFallback('');},[state.search]);
 if(state.running||!state.search||!(state.result?.errors?.length||state.result?.mapErrors?.length||state.result?.limit||state.result?.truncatedPages||state.result?.seedWarning||state.message?.kind==='error'))return null;
 const copy=async()=>{
  const report=buildSearchDiagnostics(state,{version,installedVersion:globalThis.chrome?.runtime?.getManifest?.().version||null,userAgent:navigator.userAgent});
  try{await navigator.clipboard.writeText(report);setCopied(true);setFallback('');}catch{setFallback(report);}
 };
 return <div className="search-diagnostics"><Button id="search-copy-diagnostics" onClick={()=>void copy()}>{copied?'Diagnostika zkopírována':'Zkopírovat diagnostiku'}</Button><span role="status">{copied?'Vložte ji do zprávy k chybě.':'Verze '+version+' · cílové adresy a důvody chyb'}</span>{fallback&&<label>Automatické kopírování není dostupné. Označte a zkopírujte tento text.<textarea id="search-diagnostics-text" readOnly value={fallback} onFocus={event=>event.target.select()}/></label>}</div>;
}
export function mount(root,app){
 const controller=new SearchController(app);
 function View({active,target}){
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot),{form,running,result,access,accessPending}=state,busy=running||accessPending;
  const activity=accessPending||access ? {phase:'ready',label:'Čekám na povolení',detail:'Povolte přístup k vybranému webu'} : running ? {phase:'working',label:'Prohledávám web',detail:result?`${result.scanned||0} stránek prohledáno`:'Připravuji obsah stránky'} : state.message?.kind==='error'||result?.failed ? {phase:'error',label:'Hledání bylo přerušeno',detail:'Podrobnosti najdete níže'} : result?.cancelled ? {phase:'ready',label:'Hledání je zastavené',detail:'Dosavadní výsledky jsou dostupné'} : result ? {phase:'done',label:'Výsledky jsou připravené',detail:result.limit?'Byl dosažen limit hledání':'Prohlédněte si nalezené shody'} : form.query.trim() ? {phase:'ready',label:'Připraveno k hledání',detail:'Spusťte hledání fráze nebo assetu'} : {phase:'idle',label:'Čekám na zadání',detail:'Napište frázi nebo ID assetu'};
  return <><ToolHeading id="search" title="Hledání na webu" description="Najděte frázi nebo asset. Na jedné stránce i napříč webem." active={active} activity={activity}/>

  <form className="search-form" onSubmit={e=>{e.preventDefault();void controller.search();}}>
   <div className="search-form-top"><Choices legend="Co hledat" name="search-kind" value={form.kind} disabled={busy} onChange={kind=>controller.setForm({kind})} items={[["phrase","Fráze"],["asset","Asset"]]}/><Choices legend="Kde hledat" name="search-scope" value={form.scope} disabled={busy} onChange={scope=>controller.setForm({scope})} items={[["page","Aktuální stránka"],["site","Celý web"]]}/>{form.scope==='site'&&<label className="search-limit">Limit stránek<select id="search-limit" value={form.maxPages} disabled={busy} onChange={e=>controller.setForm({maxPages:Number(e.target.value)})}>{PAGE_LIMIT_OPTIONS.map(n=><option key={n} value={n}>{n.toLocaleString('cs-CZ')} stránek</option>)}</select></label>}</div>
   <label className="search-query-label" htmlFor="search-query">{form.kind==='asset'?'ID assetu':'Hledaná fráze'}</label><div className="search-input-row"><input id="search-query" type="text" value={form.query} maxLength={500} disabled={busy} placeholder={form.kind==='asset'?'a452399, a452421':'Například Oneplay Sport'} autoComplete="off" onChange={e=>controller.setForm({query:e.target.value})}/><Button id="search-start" type="submit" variant="primary" disabled={busy}><Search size={19} aria-hidden="true"/>Hledat</Button></div>
   {form.kind==='phrase'&&<div className="search-phrase-settings"><label>Prohledávaný obsah<select id="search-phrase-source" value={form.phraseSource} disabled={busy} onChange={e=>controller.setForm({phraseSource:e.target.value})}><option value="visible">Viditelný text</option><option value="text">Text včetně skrytého</option><option value="html">HTML a zdrojová data</option></select></label><label>Menu, hlavička a patička<select id="search-shared-components" value={form.sharedComponents} disabled={busy} onChange={e=>controller.setForm({sharedComponents:e.target.value})}><option value="separate">Samostatné komponenty</option><option value="exclude">Vynechat z hledání</option><option value="include">Zahrnout do každé stránky</option></select></label><p className="search-form-hint">{form.phraseSource==='html'?'Hledá i v atributech, metadatech, skriptech a zdrojových datech.':form.phraseSource==='text'?'Zahrne i skryté texty, zavřené nabídky a šablony. Nehledá v atributech ani skriptech.':form.scope==='site'?'Ve staženém HTML vynechá rozpoznané skryté prvky. Skrytí externím CSS a JavaScriptem lze spolehlivě ověřit jen na otevřené stránce.':'Hledá text zobrazený v aktuálním stavu stránky, včetně obsahu pod přehybem.'} {form.sharedComponents==='separate'?'Stejné společné části webu se sloučí; shody uvnitř hlavního obsahu zůstanou u stránek.':form.sharedComponents==='exclude'?'Rozpoznané společné části webu se do nálezů nezahrnou.':'Shoda v menu může přidat do výsledků každou stránku, která je obsahuje.'}</p></div>}
   {form.kind==='phrase'?<div className="search-options"><label><input type="checkbox" checked={form.caseSensitive} disabled={busy} onChange={e=>controller.setForm({caseSensitive:e.target.checked})}/>Rozlišovat velikost písmen</label><label><input type="checkbox" checked={form.ignoreDiacritics} disabled={busy} onChange={e=>controller.setForm({ignoreDiacritics:e.target.checked})}/>Ignorovat diakritiku</label></div>:<p className="search-form-hint">ID komponenty, odkazu nebo assetu ve zdrojových datech. Více assetů oddělte mezerou nebo čárkou.</p>}
   <div className="search-source"><span>{form.scope==='site'?'Prohledávaný web':'Zdrojová stránka'}</span><strong>{target?.connected?(form.scope==='site'?new URL(target.url).origin:target.url):'Vyberte webovou stránku v horní liště.'}</strong></div>
   {form.scope==='site'&&<p className="search-form-hint">Veřejné HTML stejné domény. Obsah doplněný JavaScriptem ověřte v režimu aktuální stránky.</p>}
  </form><Message id="search-message" value={state.message}/>
  {access&&<div className="search-access"><p>Prohledání vyžaduje přístup k webu <strong>{new URL(access.url).hostname}</strong>. Povolení se týká tohoto webu; po potvrzení se hledání zopakuje.</p><Button id="search-grant-access" onClick={()=>void controller.grantAccess()} disabled={busy}>{accessPending?'Čekám na povolení…':'Povolit přístup k tomuto webu'}</Button><p>Pokud přístup zůstane blokovaný, otevřete zdrojovou kartu, obnovte ji a klikněte na ikonu O2 Axolotl. Po aktualizaci rozšíření zavřete starou kartu aplikace a otevřete novou.</p></div>}
  {state.message?.detail&&<details className="search-errors"><summary>Podrobnosti chyby</summary><p className="search-error-detail">{state.message.detail}</p></details>}
  <SearchProgress result={result} running={running} search={state.search} onCancel={()=>controller.cancel()}/>
  <SearchResults result={result} running={running} search={state.search}/><Diagnostics state={state}/></>;
 }
 const lifecycle=mountReactTool(root,app,View);
 return {...lifecycle,onHide(){controller.cancel();lifecycle.onHide();},onTargetChange(target){controller.onTargetChange();lifecycle.onTargetChange(target);},destroy(){controller.destroy();lifecycle.destroy();}};
}
