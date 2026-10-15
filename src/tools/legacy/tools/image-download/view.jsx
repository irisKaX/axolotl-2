import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { Download, Eye, Images, RefreshCw, Search, Square } from 'lucide-react';
import { Button, IconButton } from '../../shared/react-ui/components.jsx';
import { Checkbox, Field, Select } from '../../shared/react-ui/fields.jsx';
import { Dialog } from '../../shared/react-ui/dialog.jsx';
import { Filename } from '../../shared/react-ui/filename.jsx';
import { EmptyState, Message, ScanIntro, ToolHeading, WorkspaceCard } from '../../shared/react-ui/tool-parts.jsx';
const formats=[['all','Všechny formáty'],['webp','WebP'],['jpg','JPG'],['png','PNG'],['svg','SVG'],['avif','AVIF'],['gif','GIF'],['bmp','BMP'],['ico','ICO'],['tif','TIFF'],['heic','HEIC'],['heif','HEIF'],['unknown','Nezjištěný']].map(([value,label])=>({value,label}));
function ImageCard({item,state,controller,app,active}){
 const [failed,setFailed]=useState(false),[previewFailed,setPreviewFailed]=useState(false),[preview,setPreview]=useState(false);
 const previewId=useId();
 const status=state.states.get(item.url),selected=state.selected.has(item.url);
 useEffect(()=>{if(!active)setPreview(false);},[active]);
 return <article className={'image-download-card'+(selected?' is-selected':'')}>
  <div className="images-card-visual"><img src={item.url} alt={item.alt||item.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" hidden={failed} onLoad={event=>controller.recordDimensions(item.url,event.currentTarget.naturalWidth,event.currentTarget.naturalHeight,state.scanRevision)} onError={()=>setFailed(true)}/>{failed&&<span className="small muted images-preview-unavailable">Náhled není dostupný</span>}<div className="images-card-select"><Checkbox label={item.format==='unknown'?(item.metadataStatus==='pending'?'ZJIŠŤUJI FORMÁT…':'NEZJIŠTĚNÝ FORMÁT'):item.format.toUpperCase()} aria-label={'Vybrat '+item.name} checked={selected} disabled={state.running} onCheckedChange={checked=>controller.select(item.url,!!checked)}/></div></div>
  <div className="images-card-body"><Filename name={item.name} disabled={state.running} onRename={value=>controller.rename(item.url,value)}/><p className="small muted">{item.width&&item.height?`${item.width} × ${item.height} px`:(item.metadataStatus==='pending'&&!failed?'Zjišťuji rozměry…':'Rozměry nezjištěny')}{item.variant?' · Varianta':''}</p><p className="images-alt" title={item.alt||'ALT není uveden'}>{item.alt?'ALT: '+item.alt:'ALT není uveden'}</p>
  <div className="images-card-actions"><p className={'images-item-status'+(status?.error?' has-error':'')} hidden={!status?.text}>{status?.text}</p><div className="images-card-buttons"><Dialog id={'image-preview-'+previewId} title={item.name} open={preview} onOpenChange={open=>{setPreview(open);setPreviewFailed(false);}} className="images-preview" trigger={<IconButton icon={Eye} label={'Náhled: '+item.name}/>}><div className="images-preview-body"><img src={preview?item.url:undefined} alt={item.alt||item.name} referrerPolicy="no-referrer" onError={()=>setPreviewFailed(true)}/><p className="small muted">{item.alt?'ALT: '+item.alt:'ALT není uveden'}</p>{previewFailed&&<p role="status">Náhled nelze načíst. Obrázek můžete zkusit stáhnout.</p>}{/^https?:/.test(item.url)&&<a href={item.url} target="_blank" rel="noopener noreferrer">Otevřít původní obrázek ↗</a>}</div></Dialog><Button disabled={state.running} aria-label={'Stáhnout: '+item.name} onClick={()=>app.run(()=>controller.download(item.url))}><Download size={16} aria-hidden="true"/>{item.format&&item.format!=='unknown'?item.format.toUpperCase():'Soubor'}</Button></div></div></div>
 </article>;
}
export function createImagesView(controller){
 return function ImagesView({app,active}){
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot),head=useRef(null),scanButton=useRef(null),restoreFocus=useRef(false),wasRunning=useRef(false);
  const {items,filters,running,scanned,page}=state,shown=controller.filtered(),count=shown.filter(item=>state.selected.has(item.url)).length;
  useEffect(()=>{if(wasRunning.current&&!running&&restoreFocus.current&&active){(scanned?head.current:scanButton.current)?.focus({preventScroll:true});restoreFocus.current=false;}wasRunning.current=running;},[running,scanned,active]);
  const activity=running
   ? {phase:state.phase==='scan'?'working':state.downloadStage==='save'?'download':'working',label:state.phase==='scan'?'Načítám obrázky':state.downloadStage==='save'?'Ukládám soubory':state.downloadStage==='zip'?'Připravuji ZIP':'Připravuji obrázky',detail:state.downloadStatus?.text||'Procházím obrázky z vybrané stránky.'}
   : state.message?.kind==='error'||state.downloadStatus?.kind==='error'
    ? {phase:'error',label:'Operaci se nepodařilo dokončit',detail:(state.downloadStatus||state.message).text}
    : state.downloadStatus?.kind==='success'||state.downloadStatus?.kind==='warning'
     ? {phase:'idle',label:'Připraveno k další akci',detail:'Vyberte další obrázky nebo načtěte novou stránku.'}
     : state.selected.size
      ? {phase:'ready',label:`Vybráno ${state.selected.size} obrázků`,detail:'Stáhněte výběr v ZIPu nebo pokračujte ve výběru.'}
      : state.metadataPending
       ? {phase:'working',label:'Zjišťuji formáty a rozměry',detail:'Obrázky už můžete prohlížet a vybírat.'}
       : {phase:scanned?'ready':'idle',label:scanned?'Obrázky jsou načtené':'Připraveno k načtení',detail:scanned?'Vyberte obrázky nebo upravte filtry.':'Načtěte obrázky z vybrané karty.'};
  function scan(){restoreFocus.current=true;app.run(()=>controller.scan());}
  return <>
   <ToolHeading id="images" title="Obrázky z webu" description="Vyberte obrázky z aktuální stránky a stáhněte původní soubory v jednom ZIPu." active={active} activity={activity}/>

   <section className="workspace-board" data-workspace="images"><div className="workspace-grid"><WorkspaceCard id="source" title="Obrázky — filtry a stažení" wide><div className="images-panel">
    <ScanIntro prefix="images" icon={Images} title="Načtěte obrázky z vybrané karty" description="Obrázky si prohlédnete, vyberete a stáhnete v původním formátu. Jednotlivě nebo společně v ZIPu." hidden={scanned} busy={running} button={<Button ref={scanButton} className="tool-start images-start" id="images-scan" variant="primary" disabled={running} onClick={scan}><Images size={19} aria-hidden="true"/>{running?'Načítám obrázky…':'Načíst obrázky'}</Button>}/>
    {!scanned&&<Message id="images-status" value={state.message}/>}
    <div className="images-workbench" hidden={!scanned}>
     <div className="images-results-heading" ref={head} tabIndex={-1}><div><p className="images-result-count">Nalezené obrázky ({items.length})</p><p className="small muted">{running&&state.phase==='scan'?'Obnovuji obrázky z vybrané stránky…':items.length?'Vyberte obrázky pro stažení.':'Zkuste na webu načíst další obsah.'}</p><p id="images-coverage" className="notice warning" hidden={!state.truncated&&!state.framesSkipped&&!state.unsupported}>{state.truncated?'Sken dosáhl limitu; seznam obrázků je neúplný. ':''}{state.framesSkipped?`Vložené rámce mimo sken: ${state.framesSkipped}. `:''}{state.unsupported?`Dočasné blob zdroje mimo sken: ${state.unsupported}.`:''}</p>{scanned&&<Message id="images-status" value={state.message}/>}</div><div className="toolbar images-refresh-actions"><Button id="images-rescan" disabled={running} onClick={scan}><RefreshCw size={16} aria-hidden="true"/>{running&&state.phase==='scan'?'Načítám…':'Načíst znovu'}</Button>{running&&state.phase==='download'&&<Button id="images-stop" onClick={()=>controller.cancel()}><Square size={14} aria-hidden="true"/>Zastavit</Button>}</div></div>
     <div className="images-filter-panel" hidden={!items.length}><div className="images-filters"><Field id="images-query" label="Název, ALT nebo URL"><input type="search" placeholder="Hledat obrázek…" value={filters.query} disabled={running} onChange={event=>controller.setFilters({query:event.target.value})}/></Field><Field id="images-format" label="Formát"><Select value={filters.format||'all'} options={formats} disabled={running} onValueChange={value=>controller.setFilters({format:value==='all'?'':value})}/></Field></div>
      <div className="images-variants-control"><Checkbox id="images-variants" label="Zobrazit také další responzivní varianty" checked={filters.variants} disabled={running} onCheckedChange={checked=>controller.setFilters({variants:!!checked})}/><p className="small muted">Zahrnout další velikosti a formáty stejného obrázku.</p></div>
      <details className="images-extra-filters"><summary>Další filtry{[filters.minWidth>0,filters.minHeight>0].filter(Boolean).length?` (${[filters.minWidth>0,filters.minHeight>0].filter(Boolean).length})`:''}</summary><div className="images-extra-fields">{[['minWidth','width','Min. šířka (px)'],['minHeight','height','Min. výška (px)']].map(([key,id,label])=><Field key={key} id={'images-min-'+id} label={label}><input type="number" min="0" max="100000" step="1" placeholder="0" disabled={running} value={filters[key]||''} onChange={event=>controller.setFilters({[key]:Math.max(0,Number(event.target.value)||0)})}/></Field>)}</div><p className="small muted">Nezjištěné rozměry zůstávají ve výsledcích. Velikost souboru se zjistí při stažení.</p></details>
     </div>
     <div className="images-results" aria-busy={running}><div className="toolbar between images-result-toolbar" hidden={!items.length}><div className="images-selection"><Checkbox id="images-select-all" label="Vybrat vše ve filtru" checked={count&&count<shown.length?'indeterminate':shown.length>0&&count===shown.length} disabled={running||!shown.length} onCheckedChange={checked=>controller.selectAll(!!checked)}/><Button id="images-clear" variant="ghost" disabled={running||!state.selected.size} onClick={()=>controller.clearSelection()}>Zrušit výběr</Button></div><Button id="images-download" variant="primary" disabled={running||!state.selected.size} onClick={()=>app.run(()=>controller.download())}><Download size={17} aria-hidden="true"/>Stáhnout ZIP ({state.selected.size})</Button></div>
      <p className="small muted images-summary" role="status" hidden={!items.length}>Nalezeno {items.length} · Ve filtru {shown.length} · Vybráno {state.selected.size}{state.selected.size>count?` (${state.selected.size-count} mimo aktuální filtr)`:''}</p><Message id="images-download-status" value={state.downloadStatus}/>
      <div className="images-grid">{shown.slice(page*48,(page+1)*48).map(item=><ImageCard key={state.scanRevision+':'+item.url} item={item} state={state} controller={controller} app={app} active={active}/>)}{scanned&&!shown.length&&<EmptyState icon={Search} title={items.length?'Žádný obrázek neodpovídá filtru':'Na stránce nebyly nalezeny obrázky'}>{items.length?'Změňte filtr nebo zapněte další responzivní varianty.':'Načtěte další obsah na webu a spusťte sken znovu.'}{items.length>0&&<Button disabled={running} onClick={()=>controller.setFilters({query:'',format:'',minWidth:0,minHeight:0,variants:false})}>Zrušit filtry</Button>}</EmptyState>}</div>
      <div className="images-pagination" hidden={shown.length<=48}><Button disabled={running||page===0} onClick={()=>controller.setPage(page-1)}>Předchozí</Button><span>{page+1} / {Math.max(1,Math.ceil(shown.length/48))}</span><Button disabled={running||(page+1)*48>=shown.length} onClick={()=>controller.setPage(page+1)}>Další</Button></div>
     </div>
    </div>
   </div></WorkspaceCard></div></section>
  </>;
 };
}
