import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Check, Download, ExternalLink, FileSearch, LoaderCircle, RefreshCw, Square } from 'lucide-react';
import { Button } from '../../shared/react-ui/components.jsx';
import { Checkbox } from '../../shared/react-ui/fields.jsx';
import { Dialog } from '../../shared/react-ui/dialog.jsx';
import { EmptyState, Message, ScanIntro, ToolHeading, WorkspaceCard } from '../../shared/react-ui/tool-parts.jsx';
import { formatBytes } from '../../shared/utils.js';
import { collectPdfAssets } from './assets.js';
const labels={pdf:['Ověřené PDF','green'],link:['Typ zatím neověřen','yellow'],possible:['Typ zatím neověřen','yellow']};
function DocumentRow({item,state,controller}){
 const title=item.title||item.filename||item.name,assets=collectPdfAssets(item),[label,tone]=labels[item.status]||labels.possible;
 return <tr><td><Checkbox label="" aria-label={'Vybrat '+title} checked={item.selected} disabled={state.running||item.status==='other'} onCheckedChange={value=>controller.select(item.url,!!value)}/></td><td className="filename"><strong>{title}</strong>{assets.length>0&&<div className="pdf-assets">{assets.map(({id,kind})=><span className="pdf-asset" key={kind+id}>{kind==='link'?'Asset odkazu: ':'Asset v URL: '}<code>{id}</code></span>)}</div>}{item.filename&&<span className="url pdf-filename">Soubor: {item.filename}</span>}<span className="url">{item.url}</span>{item.bytes>0&&<span className="small muted">{formatBytes(item.bytes)}</span>}</td><td className="source-cell">{item.sources?.join(', ')}</td><td><span className={'chip '+(item.downloadState==='Dokončeno'?'green':tone)}>{item.downloadState||label}</span>{(item.status!=='pdf'||item.downloadState==='Chyba stažení')&&<p className="small muted">{item.reason||'Server zatím nepotvrdil, zda tato adresa obsahuje PDF. Zkuste znovu ověřit typ souboru.'}</p>}</td><td>{/^https?:\/\//i.test(item.url)&&<a className="ax-button ax-button-ghost" href={item.url} target="_blank" rel="noopener noreferrer" aria-label={'Otevřít '+title}><ExternalLink size={16} aria-hidden="true"/></a>}</td></tr>;
}
export function createPdfView(controller){return function PdfView({app,active}){
 const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot),head=useRef(null),scanButton=useRef(null),downloadButton=useRef(null),scanFocus=useRef(false),wasRunning=useRef(false),restoreDownloadFocus=useRef(false);
 const {items,running,scanned,confirmation}=state,selectable=items.filter(i=>i.status!=='other'),selected=selectable.filter(i=>i.selected);
 useEffect(()=>{if(wasRunning.current&&!running&&scanFocus.current&&active){(scanned?head.current:scanButton.current)?.focus({preventScroll:true});scanFocus.current=false;}wasRunning.current=running;},[running,scanned,active]);
 useEffect(()=>{if(!active)controller.dismissConfirmation();},[active]);
 useEffect(()=>{
  if(!active)restoreDownloadFocus.current=false;
  if(restoreDownloadFocus.current&&!running&&active){
   // Respect anyone who moved elsewhere while the browser accepted the download.
   if([document.body,head.current,downloadButton.current].includes(document.activeElement))downloadButton.current?.focus({preventScroll:true});
   restoreDownloadFocus.current=false;
  }
 },[running,active]);
 function restoreConfirmationFocus(event){
  // Own restoration after the focus trap closes, when its trigger may be disabled.
  event.preventDefault();
  if(!active||head.current?.closest('[hidden]'))return;
  restoreDownloadFocus.current=controller.getSnapshot().running;
  (restoreDownloadFocus.current?head.current:downloadButton.current)?.focus({preventScroll:true});
 }

 function scan(){scanFocus.current=true;app.run(()=>controller.scan());}
 return <>
  <ToolHeading id="pdf" title="PDF Scout" description="Najděte PDF na stránce, ověřte je a stáhněte." active={active} activity={state.activity}/>
  <section className="workspace-board" data-workspace="pdf"><div className="workspace-grid"><WorkspaceCard id="scan" title="Dokumenty — skenování a stažení" wide><div className="pdf-panel">
   <ScanIntro prefix="pdf" icon={FileSearch} title="Najděte PDF na vybrané stránce" description="Najdeme odkazy na dokumenty a ověříme jejich typ. Vy si pak vyberete, které PDF chcete stáhnout." hidden={scanned} busy={running} button={<Button ref={scanButton} id="pdf-scan" variant="primary" disabled={running} onClick={scan}><FileSearch size={19} aria-hidden="true"/>{running?'Hledám dokumenty…':'Prohledat stránku'}</Button>}/>
   <div className="pdf-results-heading" ref={head} tabIndex={-1} hidden={!scanned}><div><p className="pdf-result-count">Nalezené dokumenty ({items.length})</p><p className="small muted">Názvy z webu i skutečné názvy souborů.</p></div><div className="toolbar pdf-refresh-actions"><Button id="pdf-rescan" disabled={running} onClick={scan}><RefreshCw size={16} aria-hidden="true"/>Prohledat znovu</Button><Button id="pdf-verify" disabled={running||!items.length} hidden={!items.length} onClick={()=>app.run(()=>controller.verify())}><Check size={16} aria-hidden="true"/>Ověřit typ souborů</Button></div></div>
   <Message id="pdf-status" value={state.message}/><div className="pdf-activity" hidden={!running}><LoaderCircle className="react-busy-icon" size={22} aria-hidden="true"/><p role="status">{state.progress}</p><Button id="pdf-stop" disabled={state.stopping} onClick={()=>controller.cancel()}><Square size={14} aria-hidden="true"/>Zastavit</Button></div>
   <div className="pdf-results" hidden={!scanned} aria-busy={running}>{scanned&&!items.length?<EmptyState icon={FileSearch} title="Žádné PDF nebylo nalezeno">Otevřete na webu příslušnou sekci, nechte ji načíst a spusťte nový sken.</EmptyState>:items.length>0&&<>
    <div className="pdf-stats">{[['Ověřená PDF',items.filter(i=>i.status==='pdf').length],['Typ zatím neověřen',items.filter(i=>i.status!=='pdf').length]].filter(([,count])=>count>0).map(([label,count])=><span key={label}>{label}: <strong>{count}</strong></span>)}</div>
    <div className="toolbar between pdf-selection-toolbar"><div className="pdf-selection"><Checkbox id="pdf-select-all" label="Vybrat vše" checked={selected.length&&selected.length<selectable.length?'indeterminate':selectable.length>0&&selected.length===selectable.length} disabled={running||!selectable.length} onCheckedChange={value=>controller.selectAll(!!value)}/><span className="small muted">Vybráno {selected.length}</span></div><Button ref={downloadButton} id="pdf-download" variant="primary" disabled={running||!selected.length} onClick={()=>app.run(()=>controller.download())}><Download size={17} aria-hidden="true"/>Stáhnout vybrané ({selected.length})</Button></div>
    <div className="table-wrap pdf-table-wrap"><table><thead><tr>{['','Název na webu a soubor','Nalezeno v','Stav',''].map((text,i)=><th key={i} scope="col">{text}</th>)}</tr></thead><tbody>{items.map(item=><DocumentRow key={item.url} item={item} state={state} controller={controller}/>)}</tbody></table></div>
   </>}</div>
   <details className="help pdf-search-options"><summary>Možnosti a rozsah hledání</summary><div className="react-tool-help pdf-search-options-body"><Checkbox id="pdf-deep" label="Hledat i dokumenty bez přípony .pdf" checked={state.deep} disabled={running} onCheckedChange={value=>controller.setDeep(!!value)}/><p className="small muted">Sken projde načtenou stránku včetně odkazů Stáhnout. Potom automaticky ověří typ souborů a dostupné názvy u serveru.</p></div></details>
  </div></WorkspaceCard></div></section>
  <Dialog onCloseAutoFocus={restoreConfirmationFocus} id="pdf-confirm" title="Stáhnout neověřené dokumenty?" description={`${confirmation?.count||0} vybraných adres nemá potvrzený typ PDF. Stáhnout je přesto?`} open={!!confirmation} onOpenChange={open=>{if(!open)controller.dismissConfirmation();}}><div className="toolbar"><Button onClick={()=>controller.dismissConfirmation()}>Zrušit</Button><Button id="pdf-confirm-download" variant="primary" onClick={()=>app.run(()=>controller.confirmDownload())}><Download size={17} aria-hidden="true"/>Stáhnout</Button></div></Dialog>
 </>;
};}
