import {CircleAlert, CircleCheck, FileClock, ListEnd, ScanSearch, Square, Waypoints} from 'lucide-react';
import {Button} from '../../shared/react-ui/components.jsx';
import {searchStatus} from './presentation.js';

const count=value=>Math.max(0,Number(value)||0);
const display=value=>count(value).toLocaleString('cs-CZ');

function Metric({icon:Icon,label,value,description,warning=false}){
 return <div className="search-progress-stat" data-warning={warning}>
  <dt><Icon size={15} aria-hidden="true"/>{label}</dt>
  <dd>{value}</dd>
  <p>{description}</p>
 </div>;
}

export function SearchProgress({result,running,search,onCancel}){
 if(!search||(!running&&!result))return null;
 const site=search.scope==='site',initial=!result,r=result||{};
 const scanned=count(r.scanned),attempted=count(r.attempted),maxPages=count(search.maxPages);
 const errors=r.errors?.length||0,mapErrors=r.mapErrors?.length||0,partialPages=count(r.truncatedPages);
 const partial=!!(r.cancelled||r.failed||r.limit||errors||mapErrors||partialPages);
 const state=running?'running':r.cancelled?'stopped':r.failed?'error':partial?'limited':'complete';
 const status=initial?'Načítám aktuální stránku…':searchStatus(r,running);
 const Icon=running?ScanSearch:r.cancelled?Square:partial?CircleAlert:CircleCheck;
 const pageLabel=scanned===1?'stránka prohledána':scanned>=2&&scanned<=4?'stránky prohledány':'stránek prohledáno';
 const subtitle=initial?'Připravuji obsah otevřené stránky pro hledání.':running?
  (r.phase==='maps'?'Čtu mapy webu a zjišťuji další adresy.':'Výsledky přibývají. Můžete s nimi pracovat už teď.'):
  r.cancelled?'Dosavadní výsledky zůstávají k dispozici.':r.failed?'Běh přerušila chyba. Dosavadní nálezy zůstávají dostupné.':
  r.limit?'Běh dosáhl limitu. Dosavadní nálezy zůstávají dostupné.':partial?'Zkontrolujte omezení a podrobnosti pod výsledky.':'Výsledky hledání jsou připravené.';
 const value=n=>initial?'—':display(n);
 return <section className="search-progress-panel" aria-label="Průběh hledání" data-running={!!running} data-state={state}>
  <div className="search-progress-top">
   <div className="search-progress-status"><span className="search-progress-dot" aria-hidden="true"/><span role="status" aria-live="polite" aria-atomic="true">{status}</span></div>
   {running&&<Button id="search-stop" className="search-progress-stop" onClick={onCancel}><Square size={14} aria-hidden="true"/>Zastavit</Button>}
  </div>
  <div className="search-progress-hero">
   <div className="search-progress-orb" aria-hidden="true"><span className="search-progress-ring"/><span className="search-progress-ring-back"/><Icon size={25} strokeWidth={1.7}/></div>
   <div className="search-progress-copy">
    <p className="search-progress-eyebrow">{site?'Procházení webu':'Aktuální stránka'}</p>
    <h2 className="search-progress-headline">{initial?'Připravuji hledání':<><span className="search-progress-number">{display(scanned)}</span>{' '}{pageLabel}</>}</h2>
    <p className="search-progress-subtitle">{subtitle}</p>
   </div>
  </div>
  {site&&maxPages>0&&<div className="search-progress-budget">
   <div className="search-progress-label"><span>Využití limitu běhu</span><strong>{value(attempted)} <span>/ {display(maxPages)} pokusů</span></strong></div>
   <div className="search-progress-track" role="progressbar" aria-label="Využití limitu běhu včetně neúspěšných pokusů" aria-valuemin={0} aria-valuemax={maxPages} aria-valuenow={initial?undefined:Math.min(attempted,maxPages)} aria-valuetext={initial?'Čekám na první stránku':`${display(attempted)} z ${display(maxPages)} pokusů`}>
    <div className="search-progress-fill" style={{width:`${initial?0:Math.min(100,attempted/maxPages*100)}%`}}/>
   </div>
   <p className="search-progress-limit-note">Limit zahrnuje i neúspěšné pokusy. Celkový rozsah webu není známý.</p>
  </div>}
  <dl className="search-progress-stats" data-scope={search.scope}>
   {site&&<><Metric icon={Waypoints} label="Objevené adresy" value={value(r.discovered)} description="Odkazy a mapy webu"/><Metric icon={ListEnd} label="Čeká ve frontě" value={value(r.remaining)} description="Adresy čekající na zpracování"/></>}
   <Metric icon={CircleAlert} label="Nepodařilo se načíst" value={value(errors)} description="Neúspěšná načtení stránek" warning={errors>0}/>
   <Metric icon={FileClock} label="Prohledáno částečně" value={value(partialPages)} description={initial?'Část obsahu nebyla zkontrolována':`Zahrnuto v počtu prohledaných stránek`} warning={partialPages>0}/>
  </dl>
  {site&&<dl className="search-progress-details">
   <div data-warning={mapErrors>0}><dt>Chyby map webu</dt><dd>{value(mapErrors)}</dd></div>
   <div><dt>Přesměrované adresy</dt><dd>{value(r.redirected)}</dd></div>
   <div><dt>Načtení s relací prohlížeče</dt><dd>{value(r.sessionLoads)}</dd></div>
  </dl>}
  {partial&&<p className="search-progress-notice"><CircleAlert size={16} aria-hidden="true"/><span>{!running&&<strong>Výsledky nejsou úplné. </strong>}{r.limit&&<>{r.limit} </>}{errors>0&&<>Některé stránky se nepodařilo načíst. </>}{mapErrors>0&&<>Některé mapy webu nebyly dostupné. </>}{partialPages>0&&<>Část obsahu stránek nebyla zkontrolována. </>}{!running&&r.remaining>0&&<>Ve frontě zůstávají nezpracované adresy. </>}{!running&&r.failed&&<>Běh přerušila chyba.</>}</span></p>}
 </section>;
}
