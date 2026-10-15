import React,{useState} from 'react';
import {Image,Copy,ArrowUpRight,LocateFixed,ChevronDown,Info,Check} from 'lucide-react';
import {Button} from '../../shared/react-ui/components.jsx';
import {mountAuditTool} from '../../shared/audit/mount.jsx';
import {analyzeImageAudit,hasImageAlt,hasNativeLazy} from './model.js';

const size=bytes=>bytes==null?'Neověřeno':bytes>=1048576?`${(bytes/1048576).toFixed(2)} MiB`:`${(bytes/1024).toFixed(1)} KiB`;
const sourceLabels={img:'HTML obrázek',input:'Obrázkové tlačítko','svg-image':'SVG image',poster:'Video poster',background:'CSS pozadí',content:'CSS content',mask:'CSS maska',border:'CSS rámeček',list:'CSS odrážka'};
const displayUrl=url=>url?.startsWith('data:')?`${url.slice(0,url.indexOf(','))},… (vložená data)`:url;
const dimensions=(width,height)=>width>0&&height>0?`${Math.round(width)} × ${Math.round(height)} px`:'Neověřeno';
const imageName=item=>{
  if(item.url?.startsWith('data:'))return 'Vložený obrázek';
  try{return decodeURIComponent(new URL(item.url).pathname.split('/').filter(Boolean).pop()||'Obrázek');}catch{return 'Obrázek';}
};
export function safeImageUrl(value) {
  try {
    const url=new URL(value);
    if(url.username||url.password)return false;
    return ['http:','https:','blob:'].includes(url.protocol)||url.protocol==='data:'&&value.length<=2097152&&/^data:image\/(?:png|jpeg|gif|webp|avif|svg\+xml|bmp|x-icon|vnd.microsoft.icon)[;,]/i.test(value);
  } catch{return false;}
}
export async function openImageUrl(url) {
  if(!safeImageUrl(url))throw Error('Tuto adresu nelze bezpečně otevřít.');
  if(globalThis.chrome?.tabs?.create)await globalThis.chrome.tabs.create({url,active:true});
  else if(!globalThis.open?.(url,'_blank','noopener,noreferrer'))throw Error('Prohlížeč neumožnil otevřít novou kartu.');
}
function Preview({item,onHighlight,available,busy}) {
  const [load,setLoad]=useState(false),[failed,setFailed]=useState(false);
  const safe=safeImageUrl(item.url)&&!item.url.startsWith('blob:');
  const visible=safe&&!failed&&((item.bytes!==null&&item.bytes<=2097152)||load);
  return <div className="image-audit-preview">
    <button type="button" className="image-audit-preview-hit" onClick={onHighlight} disabled={!available||busy} aria-label={`Zvýraznit zdroj obrázku: ${item.label||imageName(item)}`} title="Zvýraznit tento prvek na stránce">
      {visible?<img src={item.url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<span className="image-audit-placeholder"><Image size={34} strokeWidth={1.4} aria-hidden="true"/><span>{failed?'Náhled se nepodařilo načíst':safe?'Náhled na vyžádání':'Náhled není dostupný'}</span></span>}
      <span className="image-audit-preview-hint"><LocateFixed size={14} aria-hidden="true"/>{busy?'Hledám zdroj…':'Ukázat na stránce'}</span>
    </button>
    {!visible&&safe&&!failed&&<button type="button" className="image-audit-load" onClick={()=>setLoad(true)}>Načíst náhled{item.bytes!=null?` · ${size(item.bytes)}`:''}</button>}
  </div>;
}
function Fact({label,children,note,tone}) {
  return <div className="image-audit-fact" data-tone={tone}><dt>{label}</dt><dd>{children}{note&&<small>{note}</small>}</dd></div>;
}
function ImageCard({item,result,app,issues}) {
  const [message,setMessage]=useState(null),[busy,setBusy]=useState(false),[copied,setCopied]=useState(false);
  const available=!!(app?.request&&result.scanToken&&item.sourceId!=null);
  const alt=!hasImageAlt(item)?'N/A':item.alt===null?'Chybí atribut':item.alt===''?'Prázdný':item.alt;
  const usage=item.variant?'Alternativa':item.usage==='declared'?'Použití neověřeno':'Aktuálně zobrazený';
  const format=item.format==='unknown'?'Neověřeno':item.format.toUpperCase();
  const formatNote=item.formatVerified?'ověřený obsah':item.formatSource==='MIME'||item.formatSource==='data MIME'?'deklarovaný formát':'odhad z URL';
  const natural=(!item.variant||item.intrinsicVerified)?dimensions(item.naturalWidth,item.naturalHeight):'Neověřeno';
  const lazy=hasNativeLazy(item)?item.loading==='lazy'?'Zapnuto':'Vypnuto':'N/A';
  const highlight=async()=>{
    setBusy(true);setMessage(null);
    try {await app.request('IMAGE_AUDIT_HIGHLIGHT',{pageUrl:result.url,scanToken:result.scanToken,sourceId:item.sourceId,selector:item.selector,url:item.url});setMessage({text:'Zdroj je zvýrazněný na stránce.'});}
    catch(error){setMessage({text:error.message||'Zdroj se nepodařilo zvýraznit.',error:true});}
    finally{setBusy(false);}
  };
  const copy=async()=>{
    try {await navigator.clipboard.writeText(item.url);setCopied(true);setMessage({text:'URL zkopírována.'});}
    catch{setMessage({text:'URL se nepodařilo zkopírovat.',error:true});}
  };
  const open=async()=>{try{await openImageUrl(item.url);setMessage(null);}catch(error){setMessage({text:error.message,error:true});}};
  return <article className="image-audit-card">
    <Preview item={item} onHighlight={highlight} available={available} busy={busy}/>
    <div className="image-audit-card-body">
      <header className="image-audit-card-heading"><span>{sourceLabels[item.sourceKind]||item.sourceKind}</span><span className="image-audit-usage" data-declared={item.variant||item.usage==='declared'}>{usage}</span><h3 title={imageName(item)}>{imageName(item)}</h3></header>
      <div className="image-audit-alt" data-missing={hasImageAlt(item)&&item.alt===null}><span>ALT</span><p title={alt}>{alt}</p></div>
      <dl className="image-audit-facts">
        <Fact label="Formát" note={item.format!=='unknown'?formatNote:undefined}>{format}</Fact>
        <Fact label="Velikost souboru">{size(item.bytes)}</Fact>
        <Fact label="Původní rozměry" note={item.variant&&!item.intrinsicVerified?'rozměry varianty neověřeny':undefined}>{natural}</Fact>
        <Fact label="Na stránce" note={item.variant?'rozměr prvku · použití neověřeno':item.displayWidth>0&&item.displayHeight>0?'rozměr prvku':'prvek bez viditelné plochy'}>{dimensions(item.displayWidth,item.displayHeight)}</Fact>
        <Fact label="Lazy loading" tone={lazy==='Zapnuto'?'on':undefined} note={hasNativeLazy(item)?'nativní loading="lazy"':'pro tento zdroj se nepoužívá'}>{lazy}</Fact>
        <Fact label="Umístění" note={item.usage==='declared'||item.variant?'použití zdroje neověřeno':undefined}>{item.aboveFold?'První obrazovka':'Pod prvním pohledem'}</Fact>
      </dl>
      <div className="image-audit-actions"><Button onClick={copy} aria-label={`Kopírovat URL: ${imageName(item)}`}>{copied?<Check size={15} aria-hidden="true"/>:<Copy size={15} aria-hidden="true"/>}Kopírovat URL</Button><Button onClick={open} disabled={!safeImageUrl(item.url)} aria-label={`Otevřít obrázek v nové kartě: ${imageName(item)}`}><ArrowUpRight size={16} aria-hidden="true"/>Otevřít</Button></div>
      <p className="image-audit-card-message" data-error={message?.error||undefined} role="status">{message?.text||''}</p>
      <details className="image-audit-details"><summary><span>Podrobnosti{issues.length>0&&<span className="image-audit-issue-count">{issues.length} {issues.length===1?'nález':'nálezy'}</span>}</span><ChevronDown size={15} aria-hidden="true"/></summary><div className="image-audit-detail-body">
        <dl><dt>URL</dt><dd>{displayUrl(item.url)}</dd><dt>Selektor</dt><dd>{item.selector||'Neověřeno'}</dd><dt>Použití</dt><dd>{item.variant?'Alternativa · použití neověřeno':item.usage==='declared'?'Deklarovaný zdroj · použití neověřeno':'Aktuální zdroj prvku'}</dd><dt>Zdroje</dt><dd>{item.sources?.join(', ')||sourceLabels[item.sourceKind]||item.sourceKind}</dd><dt>ALT</dt><dd>{!hasImageAlt(item)?item.variant?'N/A (alternativa stejného prvku)':'N/A (tento typ nemá HTML ALT)':alt}</dd><dt>Ověření</dt><dd>{item.inspectionStatus||'Neověřeno'}{item.sizeSource?` · ${item.sizeSource}`:''}</dd></dl>
        {issues.length>0&&<ul>{issues.map((issue,index)=><li key={index}>{issue}</li>)}</ul>}
      </div></details>
    </div>
  </article>;
}
export function Results({result,app}) {
  const [query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[budget,setBudget]=useState(500);
  if(!result)return null;
  const limit=Math.max(1,Number(budget)||500)*1024;
  const issues=item=>[...item.issues,...(item.bytes>limit?[item.bytes>2097152?'Velký soubor přes 2 MiB':`Přes doporučený limit ${Math.round(limit/1024)} KiB`]:[])];
  const items=result.items.filter(item=>{
    if(!`${item.url} ${item.alt||''} ${item.selector||''} ${(item.sources||[]).join(' ')}`.toLowerCase().includes(query.toLowerCase()))return false;
    return filter==='all'||filter==='missing'&&hasImageAlt(item)&&item.alt===null||filter==='empty'&&hasImageAlt(item)&&item.alt===''||filter==='filled'&&hasImageAlt(item)&&!!item.alt||filter==='notwebp'&&item.formatVerified&&item.format!=='webp'||filter==='nolazy'&&hasNativeLazy(item)&&item.loading!=='lazy'||filter==='large'&&item.bytes>limit||filter==='unknown'&&item.bytes===null||filter==='issues'&&issues(item).length>0||filter==='variants'&&item.variant||filter==='declared'&&item.usage==='declared'||filter==='selected'&&item.usage==='selected';
  });
  return <div className="image-audit-results">
    <div className="image-audit-summary"><div><strong>{result.items.length}</strong><span>obrázků a variant</span></div><div data-tone={result.summary.missingAlt?'warning':undefined}><strong>{result.summary.missingAlt}</strong><span>chybí ALT</span></div><div><strong>{result.summary.unknownSize}</strong><span>neověřená velikost</span></div><p><LocateFixed size={17} aria-hidden="true"/>Kliknutím na náhled najdete prvek na stránce.</p></div>
    <div className="image-audit-filters"><label className="image-audit-search"><span>Hledat</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="URL, ALT nebo selektor"/></label><label><span>Filtr</span><select value={filter} onChange={event=>setFilter(event.target.value)}>{[['all','Všechny obrázky'],['selected','Aktuální zdroje'],['declared','Použití neověřeno'],['variants','Alternativní zdroje'],['missing','Chybí ALT'],['empty','Prázdný ALT'],['filled','Vyplněný ALT'],['notwebp','Ověřený jiný formát než WebP'],['nolazy','Lazy loading vypnuto'],['large','Přes limit'],['unknown','Neznámá velikost'],['issues','S nálezy']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="image-audit-budget"><span>Limit souboru (KiB)</span><input type="number" min="1" step="50" value={budget} onChange={event=>setBudget(event.target.value)}/></label><p>{items.length} / {result.items.length}</p></div>
    <div className="image-audit-gallery">{items.map(item=><ImageCard key={item.id} item={item} result={result} app={app} issues={issues(item)}/>)}</div>
    {!items.length&&<p className="audit-empty">Žádné obrázky odpovídající filtru.</p>}
    <details className="image-audit-coverage image-audit-details"><summary><span><Info size={16} aria-hidden="true"/>Rozsah a přesnost kontroly</span><ChevronDown size={16} aria-hidden="true"/></summary><div className="image-audit-detail-body"><p>Zdroje aktuální stránky: {result.summary.declared||0} s neověřeným použitím; alternativy stejného prvku: {result.summary.variants||0}. Skryté větve, obsah iframe a uzavřený shadow DOM se neprocházejí. {result.framesSkipped>0&&`Přeskočené iframe: ${result.framesSkipped}. `}{result.unsupported>0&&`Nepodporované reference: ${result.unsupported}.`}</p><p>Kontrola prostředků: {result.inspection?.completed||0} / {result.inspection?.total||0}; nejvýše 500 unikátních síťových URL. {result.truncated?'Výsledek je omezen limitem kolekce nebo kontroly. ':''}{result.inspection?.aborted?'Kontrola přerušena nebo vypršel celkový čas.':''}</p><p>ALT a nativní lazy loading se hodnotí jen tam, kde se používají. Prázdný ALT může označovat dekoraci. Vypnuté lazy loading v prvním viewportu je v pořádku; vlastní řešení se neověřuje. Původní rozměry alternativ se neodvozují z rozměrů vybraného obrázku. U CSS a pseudo-elementů se zvýrazní jejich zdrojový prvek.</p></div></details>
  </div>;
}
export function mount(root,app) {
  return mountAuditTool(root,app,{id:'image-audit',title:'Kontrola obrázků',description:'ALT, formát, rozměry a načítání. Klikněte na náhled a najděte obrázek na stránce.',requestType:'IMAGE_AUDIT_SCAN',analyze:analyzeImageAudit,Results,icon:Image,help:'Kontrola aktuální stránky zahrnuje HTML obrázky, srcset a picture varianty, běžné lazy data atributy, CSS a pseudo-elementy, SVG image a video poster. Neověřené údaje jsou označené; technické detaily najdete u každého obrázku.'});
}
