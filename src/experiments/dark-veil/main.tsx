import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';
import { AppHeader } from '../../app/header/AppHeader';
import { PreferencesProvider, usePreferences } from '../../app/PreferencesProvider';
import { PageContextProvider } from '../../app/PageContextProvider';
import { createPreferencesStore } from '../../lib/preferences';
import { currentRoute, routeLabels } from '../../app/routes';
import { Icon } from '../../components/Icon';
import { VeilBackground } from './VeilBackground';
import '../../styles/base.css';
import './lab.css';

export const DEFAULTS = { color: '#8555ff', speed: 0.35, brightness: 1, glow: 0.4, scale: 1, rotation: 0, flow: 1, warp: 0, variation: 0, sheen: 0.1, grain: 0.02, fade: 0, opacity: 1, quality: 0.5 };
export type VeilSettings = typeof DEFAULTS;
const preferences = createPreferencesStore({ storagePrefix: 'axolotl-dark-veil-lab', initialTheme: 'dark' });
const cards = ['metadata', 'notes', 'activity'] as const;
type Card = typeof cards[number];
const names: Record<Card,string> = { metadata:'Metadata', notes:'Pracovní poznámky', activity:'Kontrola stránky' };

function Range({ name, label, min, max, step = 0.05, value, onChange }: {name: keyof VeilSettings;label:string;min:number;max:number;step?:number;value:number;onChange:(value:number)=>void}) {
  return <label className="veil-range"><span>{label}<output htmlFor={`veil-${name}`}>{Number(value.toFixed(2))}</output></span><input id={`veil-${name}`} type="range" min={min} max={max} step={step} value={value} onChange={event=>onChange(Number(event.target.value))}/></label>;
}

function Lab() {
  const prefs = usePreferences();
  const [settings,setSettings] = useState(DEFAULTS);
  const [paused,setPaused] = useState(false);
  const [staticMode,setStaticMode] = useState(false);
  const [controlsOpen,setControlsOpen] = useState(false);
  const [generation,setGeneration] = useState(0);
  const [backgroundStatus,setBackgroundStatus] = useState('Připravuji pozadí');
  const [route,setRoute] = useState(currentRoute);
  const [order,setOrder] = useState<Card[]>([...cards]);
  const [checked,setChecked] = useState([true,false,false]);
  const [note,setNote] = useState('Jemný pohyb v pozadí. Jasné informace v popředí.');
  const [notice,setNotice] = useState('');
  const dragging = useRef<Card|null>(null);
  const main = useRef<HTMLElement>(null);
  useEffect(()=>{const update=()=>setRoute(currentRoute());window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
  const change = <K extends keyof VeilSettings>(key:K,value:VeilSettings[K])=>setSettings(old=>({...old,[key]:value}));
  function move(id:Card,direction:number) {setOrder(old=>{const next=[...old];const from=next.indexOf(id),to=from+direction;if(to<0||to>=next.length)return old;[next[from],next[to]]=[next[to],next[from]];return next;});setNotice(`${names[id]}: pořadí změněno.`);}
  const focusMain = ()=>requestAnimationFrame(()=>main.current?.focus({preventScroll:true}));
  return <>
    <VeilBackground settings={settings} light={prefs.resolvedTheme==='light'} reduced={prefs.reducedMotion} paused={paused} staticMode={staticMode} generation={generation} onStatus={setBackgroundStatus}/>
    <a className="veil-skip" href="#veil-content" onClick={event=>{event.preventDefault();focusMain();}}>Přejít na obsah</a>
    <AppHeader route={route} onNavigate={focusMain}/>
    <main className="veil-main" id="veil-content" tabIndex={-1} ref={main}>
      <div className="veil-intro">
        <div><div className="veil-eyebrow"><span/> AXOLOTL / BACKGROUND LAB</div><h1>Prostor, který plyne.</h1><p>Dark Veil od React Bits. Jeden efekt. Tvůj vlastní rytmus.</p></div>
        <div className="veil-mode"><span className="veil-live-dot" data-still={paused||staticMode||prefs.reducedMotion}/> <span>{backgroundStatus}</span><button className="veil-button" disabled={prefs.reducedMotion||staticMode} onClick={()=>setPaused(v=>!v)}>{paused?'Spustit':'Pozastavit'}</button></div>
      </div>
      <div className="veil-layout">
        <section className="veil-workspace" aria-label="Ukázkové pracovní widgety">
          <div className="veil-workspace-heading"><div><h2>Pracovní plocha</h2><p>Ukázková data · karty lze přesouvat</p></div><span className="veil-tag">{prefs.resolvedTheme==='dark'?'Tmavý':'Světlý'} režim</span></div>
          {route!=='dashboard'&&<p className="veil-route-note" role="status">Navigace: {routeLabels[route]}. Tento izolovaný lab ukazuje ukázkové widgety; nástroje nespouští.</p>}
          <div className="veil-cards">{order.map((id,index)=><article key={id} className={`veil-card veil-card-${id}`} data-widget={id} onDragOver={event=>{if(dragging.current)event.preventDefault();}} onDrop={event=>{event.preventDefault();const from=dragging.current;if(!from||from===id)return;setOrder(old=>{const next=old.filter(x=>x!==from);next.splice(next.indexOf(id),0,from);return next;});dragging.current=null;setNotice('Pořadí karet změněno.');}}>
            <div className="veil-card-heading"><div><Icon name={id==='metadata'?'metadata':id==='notes'?'poznamky':'shield'}/><h3>{names[id]}</h3></div><div className="veil-order-controls"><button title="Přetáhnout kartu" aria-label={`Přetáhnout ${names[id]}`} draggable onDragStart={event=>{dragging.current=id;event.dataTransfer.setData('text/plain',id);event.dataTransfer.effectAllowed='move';}} onDragEnd={()=>{dragging.current=null;}}>⠿</button><button disabled={index===0} aria-label={`${names[id]}: posunout výš`} onClick={()=>move(id,-1)}>↑</button><button disabled={index===order.length-1} aria-label={`${names[id]}: posunout níž`} onClick={()=>move(id,1)}>↓</button></div></div>
            {id==='metadata'?<><div className="veil-metadata-title"><span className="veil-domain">example.com / studio</span><span className="veil-success"><Icon name="check"/> Vyplněno</span></div><h4>Malé detaily. Lepší web.</h4><p className="veil-description">Nástroje a nápady na jednom místě. Ukázka delšího textu pro posouzení čitelnosti nad živým pozadím.</p><dl className="veil-meta"><div><dt>Title</dt><dd>Axolotl — tvůj prostor pro web</dd></div><div><dt>Canonical</dt><dd>https://example.com/studio</dd></div><div><dt>Jazyk</dt><dd>Čeština · cs</dd></div></dl></>:id==='notes'?<><label className="veil-note-label" htmlFor="veil-note">Místo pro myšlenku</label><textarea id="veil-note" value={note} onChange={event=>setNote(event.target.value)} rows={3}/><p className="veil-caption">Zkus psát, označit text nebo přesunout kartu.</p></>:<><div className="veil-check-summary"><strong>{checked.filter(Boolean).length}<span> / 3</span></strong><span>body ukázkového checklistu</span></div><div className="veil-checks">{['Zkontrolovat metadata','Projít strukturu nadpisů','Ověřit popisy obrázků'].map((label,i)=><label key={label}><input type="checkbox" checked={checked[i]} onChange={()=>setChecked(old=>old.map((v,n)=>n===i?!v:v))}/><span>{label}</span></label>)}</div></>}
          </article>)}</div>
          <p className="veil-workspace-note">Pozadí je samostatná neinteraktivní vrstva. Text, klikání i přesouvání zůstávají v popředí.</p>
        </section>
        <aside className="veil-controls" aria-labelledby="veil-controls-title" data-open={controlsOpen}>
          <div className="veil-controls-heading"><span className="veil-eyebrow">ŽIVÉ NASTAVENÍ</span><h2 id="veil-controls-title">Dark Veil</h2><p>Uprav světlo, barvu a pohyb.</p></div>
          <button className="veil-button veil-mobile-controls" aria-expanded={controlsOpen} aria-controls="veil-controls-body" onClick={()=>setControlsOpen(v=>!v)}>{controlsOpen?'Skrýt ovládání':'Upravit efekt'}</button>
          <div className="veil-controls-body" id="veil-controls-body">
          <label className="veil-color"><span>Barva světla<small>{settings.color.toUpperCase()}</small></span><input aria-label="Barva světla" type="color" value={settings.color} onChange={event=>change('color',event.target.value)}/></label>
          <Range name="speed" label="Rychlost" min={0} max={2} value={settings.speed} onChange={v=>change('speed',v)}/>
          <Range name="brightness" label="Jas efektu" min={0} max={2} value={settings.brightness} onChange={v=>change('brightness',v)}/>
          <Range name="glow" label="Záře" min={0} max={2} value={settings.glow} onChange={v=>change('glow',v)}/>
          <Range name="scale" label="Měřítko" min={0.4} max={3} value={settings.scale} onChange={v=>change('scale',v)}/>
          <details className="veil-advanced"><summary>Jemné doladění <span>+</span></summary><div>
            <Range name="rotation" label="Natočení (°)" min={0} max={360} step={1} value={settings.rotation} onChange={v=>change('rotation',v)}/>
            <Range name="flow" label="Plynutí" min={0} max={2} value={settings.flow} onChange={v=>change('flow',v)}/>
            <Range name="warp" label="Deformace" min={0} max={2} value={settings.warp} onChange={v=>change('warp',v)}/>
            <Range name="variation" label="Variace pole" min={0} max={10} step={0.1} value={settings.variation} onChange={v=>change('variation',v)}/>
            <Range name="sheen" label="Odlesk" min={0} max={2} value={settings.sheen} onChange={v=>change('sheen',v)}/>
            <Range name="grain" label="Zrnitost" min={0} max={0.15} step={0.005} value={settings.grain} onChange={v=>change('grain',v)}/>
            <Range name="fade" label="Útlum okrajů" min={0} max={1} value={settings.fade} onChange={v=>change('fade',v)}/>
            <Range name="opacity" label="Krytí efektu" min={0} max={1} value={settings.opacity} onChange={v=>change('opacity',v)}/>
            <Range name="quality" label="Rozlišení pole" min={0.25} max={0.75} value={settings.quality} onChange={v=>change('quality',v)}/>
            <p className="veil-caption">Vyšší rozlišení zatěžuje grafiku. Změna rozlišení znovu sestaví efekt.</p>
          </div></details>
          <div className="veil-option"><span>Režim náhledu</span><div role="group" aria-label="Barevný režim labu">{(['dark','light'] as const).map(theme=><button key={theme} aria-pressed={prefs.resolvedTheme===theme} onClick={()=>prefs.setPreference('theme',theme)}>{theme==='dark'?'Tmavý':'Světlý'}</button>)}</div></div>
          <label className="veil-toggle"><input type="checkbox" checked={staticMode} onChange={event=>setStaticMode(event.target.checked)}/> Statické pozadí bez WebGL</label>
          <p className="veil-caption" role="status">{prefs.reducedMotion?'Omezený pohyb: zobrazuje se statická podoba bez animace.':staticMode?'Statický fallback. Ovladače efektu se projeví po jeho zapnutí.':prefs.resolvedTheme==='light'?'Světlý režim používá původní lightMode komponenty.':'Pohyb lze kdykoli pozastavit.'}</p>
          <button className="veil-button veil-reset" onClick={()=>{setSettings({...DEFAULTS});setPaused(false);setStaticMode(false);setGeneration(v=>v+1);setNotice('Výchozí nastavení efektu obnoveno.');}}>Obnovit nastavení efektu</button>
          </div>
        </aside>
      </div>
      <footer className="veil-footer"><span>Izolovaný experiment · ukázková data</span><span><a href="https://reactbits.dev/backgrounds/dark-veil" target="_blank" rel="noreferrer">Dark Veil / React Bits ↗</a><a href="./LICENSE-DarkVeil.txt" target="_blank">Licence</a></span></footer>
      <p className="veil-sr" role="status">{notice}</p>
    </main>
  </>;
}

createRoot(document.getElementById('axolotl-root')!).render(<PreferencesProvider store={preferences}><PageContextProvider><Lab/></PageContextProvider></PreferencesProvider>);
