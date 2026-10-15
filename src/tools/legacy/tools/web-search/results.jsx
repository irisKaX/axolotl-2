import {useEffect,useState} from 'react';
import {ArrowUpRight,FileSearch,Files,Layers} from 'lucide-react';
import {Button} from '../../shared/react-ui/components.jsx';
import {compactExcerpt,describeAssetMatch,highlightParts,formatCount} from './presentation.js';

function Highlight({text,search}){return highlightParts(text,search.query,search).map((part,index)=>part.match?<mark key={index}>{part.text}</mark>:<span key={index}>{part.text}</span>);}
function shortUrl(value){try{const url=new URL(value);return decodeURI(url.pathname+url.search)||'/';}catch{return value;}}
function PhraseEvidence({item,search}){
 const matches=item.matches||[],first=matches[0]?.excerpt||'',preview=compactExcerpt(first,search.query,search);
 return <div className="search-phrase-evidence">
  {preview&&<p className="search-result-preview"><Highlight text={preview} search={search}/></p>}
  {(matches.length>1||preview!==first)&&<details className="search-match-details"><summary>Zobrazit ukázky ({matches.length})</summary><div className="search-expanded-matches">{matches.map((match,index)=><p key={index}><Highlight text={match.excerpt} search={search}/></p>)}</div></details>}
 </div>;
}
function SharedComponent({item,search,index}){
 const [shown,setShown]=useState(25),pages=item.pages||[];
 return <article className="search-shared-result">
  <header><div><span className="search-result-kind"><Layers size={14} aria-hidden="true"/>Společná komponenta · {index+1}</span><h3>{item.label}</h3></div><span className="search-result-badge">{formatCount(pages.length,'stránka','stránky','stránek')}</span></header>
  <PhraseEvidence item={item} search={search}/>
  <div className="search-component-meta">{item.truncated?'Alespoň ':''}{formatCount(item.count,'výskyt v komponentě','výskyty v komponentě','výskytů v komponentě')} · započítáno jednou</div>
  <details className="search-component-pages"><summary>Stránky s touto komponentou ({pages.length.toLocaleString('cs-CZ')})</summary><ul>{pages.slice(0,shown).map(page=><li key={page.url}><a href={page.url} target="_blank" rel="noopener noreferrer">{page.title||shortUrl(page.url)}<ArrowUpRight size={14} aria-hidden="true"/></a><span>{shortUrl(page.url)}</span></li>)}</ul>{pages.length>shown&&<Button onClick={()=>setShown(shown+25)}>Zobrazit další stránky</Button>}</details>
 </article>;
}
function AssetEvidence({item}){
 const matches=item.matches.map((match,index)=>({match,index,...describeAssetMatch(match,item.baseUrl||item.url)})).sort((a,b)=>a.order-b.order||a.index-b.index);
 return <><div className="search-evidence search-asset-evidence">{matches.map(({match,index,title,description,link,linkLabel})=><div className="search-asset-record" key={index}><div><h4>{title}</h4><span className="search-asset-id">{match.assets.join(', ')}</span></div><p>{description}</p>{link&&<a className="search-resource-link" href={link} target="_blank" rel="noopener noreferrer">{linkLabel}<ArrowUpRight size={16} aria-hidden="true"/></a>}</div>)}</div>
 <details className="search-raw"><summary>Technické podrobnosti nálezů ({item.matches.length})</summary><p>Původní zápisy ve zdroji stránky:</p>{item.matches.map((match,index)=><div className="search-raw-record" key={index}><strong>{match.assets.join(', ')}</strong><span>{match.tag} · {match.attribute}{match.label?' · '+match.label:''}</span><code>{match.excerpt}</code></div>)}</details></>;
}
export function SearchResults({result,running,search}){
 const [page,setPage]=useState(0),[selection,setSelection]=useState(null),[errorsShown,setErrorsShown]=useState(25),size=25;
 useEffect(()=>{setPage(0);setErrorsShown(25);},[search]);
 if(!result)return null;
 const items=result.items||[],components=result.components||[],errors=result.errors||[],mapErrors=result.mapErrors||[],asset=search.kind==='asset',separate=!asset&&search.sharedComponents==='separate';
 const tab=separate?(selection?.search===search?selection.tab:(!running&&!items.length&&components.length?'components':'pages')):'pages';
 const list=tab==='components'?components:items,pages=Math.max(1,Math.ceil(list.length/size)),current=Math.min(page,pages-1);
 const partial=!!(result.cancelled||result.failed||result.limit||errors.length||mapErrors.length||result.truncatedPages),total=list.reduce((n,item)=>n+item.count,0),limited=list.some(item=>item.truncated);
 const records=n=>asset?formatCount(n,'záznam','záznamy','záznamů'):formatCount(n,'shoda','shody','shod');
 const selectTab=value=>{setSelection({search,tab:value});setPage(0);};
 const tabKeys=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const value=event.key==='Home'?'pages':event.key==='End'?'components':tab==='pages'?'components':'pages';selectTab(value);event.currentTarget.parentElement.querySelector('#search-'+value+'-tab')?.focus();};
 return <section className="search-results" aria-label="Výsledky hledání">
 <header className="search-results-heading"><div><span className="search-results-eyebrow">Výsledky hledání</span><h2>{tab==='components'?formatCount(components.length,'společná část webu','společné části webu','společných částí webu'):formatCount(items.length,'stránka s nálezem','stránky s nálezem','stránek s nálezem')}</h2><p>{asset?'Asset':'Fráze'} <strong>„{search.query}“</strong> <span>· {search.scope==='site'?'Celý web':'Aktuální stránka'}</span></p></div><span className="search-total">{limited?'Alespoň ':''}{records(total)}{separate&&components.length?(tab==='components'?' v komponentách':' v obsahu'):''}</span></header>
 {separate&&<div className="search-result-tabs" role="tablist" aria-label="Typ výsledků">{[['pages','Stránky',items.length,Files],['components','Společné části',components.length,Layers]].map(([id,label,count,Icon])=><button key={id} id={'search-'+id+'-tab'} type="button" role="tab" aria-selected={tab===id} aria-controls="search-results-panel" tabIndex={tab===id?0:-1} onClick={()=>selectTab(id)} onKeyDown={tabKeys}><Icon size={17} aria-hidden="true"/>{label}<span>{count.toLocaleString('cs-CZ')}</span></button>)}</div>}
 <div id="search-results-panel" role={separate?'tabpanel':undefined} aria-labelledby={separate?'search-'+tab+'-tab':undefined} tabIndex={separate?0:undefined}>
 {tab==='components'&&<p className="search-tab-hint">Stejné menu, hlavička nebo patička se zobrazí jen jednou. Odlišné varianty zůstávají samostatně.</p>}
 {!items.length&&!components.length&&!running&&<div className="search-empty"><FileSearch size={32} aria-hidden="true"/><h3>{result.scanned?'Žádná nalezená shoda':'Nebyla prohledána žádná stránka'}</h3><p>{result.scanned?<>V prohledaném obsahu jsme {asset?'zadané ID':'hledanou frázi'} nenašli.{partial?' Část obsahu se nepodařilo ověřit.':''}</>:<>Výskyt {asset?'zadaného ID':'hledané fráze'} zatím nelze posoudit. {result.cancelled?'Hledání bylo zastaveno.':'Zkontrolujte uvedenou chybu a přístup k webu.'}</>}</p></div>}
 {!list.length&&(running||items.length>0||components.length>0)&&<p className="search-tab-empty">{running?'Zatím žádné shody v této části. Hledání pokračuje.':tab==='pages'?'V hlavním obsahu stránek nebyla nalezena shoda.':'Ve společných částech webu nebyla nalezena shoda.'}</p>}
 <div className="search-result-list">{list.slice(current*size,(current+1)*size).map((item,index)=>tab==='components'?<SharedComponent key={item.id} item={item} search={search} index={current*size+index}/>:<article className="search-result" key={item.url}>
 <header><div><span className="search-result-kind"><Files size={14} aria-hidden="true"/>{asset?'Asset ve stránce':'Obsah stránky'}</span><h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title||shortUrl(item.url)}<ArrowUpRight size={17} aria-hidden="true"/></a></h3><p className="search-result-url" title={item.url}>{shortUrl(item.url)}</p></div><span className="search-result-badge">{item.truncated?'Alespoň ':''}{records(item.count)}</span></header>
 {asset?<AssetEvidence item={item}/>:<PhraseEvidence item={item} search={search}/>}
 <footer><span>{item.source==='live'?'Otevřená stránka':'Stažené HTML'}</span>{item.count>item.matches.length&&<span>Ukázky: {item.matches.length} z {item.count}{item.truncated?'+':''}</span>}{item.truncated&&<span className="search-result-warning">Část obsahu nebyla zkontrolována.</span>}{item.redirectedFrom?.length>0&&<details className="search-redirects"><summary>Původní adresy před přesměrováním ({item.redirectedFrom.length})</summary><ul>{item.redirectedFrom.map(url=><li key={url}>{url}</li>)}</ul></details>}</footer>
 </article>)}</div>
 {pages>1&&<nav className="search-pagination" aria-label="Stránkování výsledků"><Button disabled={current===0} onClick={()=>setPage(current-1)}>Předchozí</Button><span>{current+1} / {pages}</span><Button disabled={current+1>=pages} onClick={()=>setPage(current+1)}>Další</Button></nav>}
 </div>
 {(search.scope==='site'||asset)&&<details className="search-coverage"><summary>Co výsledky zahrnují</summary>{search.scope==='site'&&<p>{result.seedWarning?'Stažené HTML objevených adres stejného webu.':'Otevřenou stránku a stažené HTML objevených adres stejného webu.'} JavaScript dalších stránek se nespouští. Prohledání všech existujících URL webu nelze potvrdit.</p>}{asset&&<p>Záznam je místo, kde je ID assetu uvedené. Více záznamů může odkazovat na stejný asset.</p>}</details>}
 {(errors.length>0||mapErrors.length>0)&&<details className="search-errors" open={!running&&errors.length>(result.scanned||0)||undefined}><summary>Nepodařilo se načíst ({(errors.length+mapErrors.length).toLocaleString('cs-CZ')})</summary>{errors.length>(result.scanned||0)&&<p>Většinu stránek se nepodařilo načíst. Výsledky proto pokrývají jen malou část webu.</p>}<ul>{[...errors,...mapErrors].slice(0,errorsShown).map((error,index)=><li key={index}><a href={error.url} target="_blank" rel="noopener noreferrer">{error.url}</a><span>{error.reason}</span>{error.finalUrl&&<span className="search-final-url"><strong>Cílová adresa:</strong> {error.finalUrl}</span>}{error.detail&&<span>{error.detail}</span>}</li>)}</ul>{errorsShown<errors.length+mapErrors.length&&<Button onClick={()=>setErrorsShown(errorsShown+25)}>Zobrazit další chyby</Button>}</details>}
 </section>;
}
