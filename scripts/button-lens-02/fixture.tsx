import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Bookmark, Trash2 } from 'lucide-react';
import { Button } from '../../src/design-system/Button';
import ButtonShowcase from '../../src/pages/design-system/ButtonShowcase';
import './fixture.css';
function Fixture() {
 const [motion,setMotion]=useState(false),[busy,setBusy]=useState(false),[count,setCount]=useState(0);
 return <main><h1>Lens 02 · Clean Icon</h1><p>Izolované ověření skutečného exportu Button</p>
 <section className="matrix" aria-label="Referenční matice">{(['primary','secondary','ghost','icon','destructive'] as const).map(v=><div key={v}><h2>{v}</h2>{(['small','medium','large'] as const).map(s=>v==='icon'?<Button key={s} id={`${v}-${s}`} variant="icon" size={s} icon={<Bookmark strokeWidth={1.7}/>} aria-label="Uložit do oblíbených"/>:<Button key={s} id={`${v}-${s}`} variant={v} size={s} icon={v==='destructive'?<Trash2 strokeWidth={1.7}/>:<Play strokeWidth={1.7}/>}>{v==='destructive'?'Odstranit soubor':'Spustit kontrolu'}</Button>)}</div>)}</section>
 <section className="checks" aria-label="Ověření nativního chování"><label><input id="toggle-motion" type="checkbox" checked={motion} onChange={e=>setMotion(e.target.checked)}/>Motion</label><label><input id="toggle-busy" type="checkbox" checked={busy} onChange={e=>setBusy(e.target.checked)}/>Busy</label><Button id="stable" motion={motion?'star-border':'none'} loading={busy} loadingLabel="Zpracovávám delší požadavek" icon={<Play/>} onClick={()=>setCount(n=>n+1)}>Akce</Button><output id="count" aria-label="Aktivace testu">{count}</output></section>
 <ButtonShowcase/></main>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture/></StrictMode>);
