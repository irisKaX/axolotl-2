import { useEffect, useRef, useState } from 'react';
import { Play, Bookmark, Trash2 } from 'lucide-react';
import { Button, type ButtonVariant, type ButtonSize, type ButtonMotion } from '../../design-system/Button';
import './ButtonShowcase.css';

const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'icon', 'destructive'];
const sizes: ButtonSize[] = ['small', 'medium', 'large'];
const names = { primary: 'Primary', secondary: 'Secondary', ghost: 'Ghost', icon: 'Icon', destructive: 'Destructive' };
const sample = (variant: ButtonVariant) => variant === 'destructive' ? <Trash2 strokeWidth={1.7} /> : variant === 'icon' ? <Bookmark strokeWidth={1.7} /> : <Play strokeWidth={1.7} />;
function Sample({ variant, size = 'medium', ...props }: { variant: ButtonVariant; size?: ButtonSize; motion?: ButtonMotion; starBorder?: {color:string;duration:number}; disabled?:boolean; loading?:boolean; reducedMotion?:boolean; onClick?:()=>void; id?:string }) {
  return variant === 'icon'
    ? <Button {...props} variant="icon" size={size} icon={sample(variant)} aria-label="Uložit do oblíbených" />
    : <Button {...props} variant={variant} size={size} icon={sample(variant)}>{variant === 'destructive' ? 'Odstranit soubor' : 'Spustit kontrolu'}</Button>;
}

/** The actual DS export is used in every specimen and in the async/form examples. */
export default function ButtonShowcase({ preferenceHint = 'Dark/light a velikost textu přebírá komponenta z nastavení aplikace. Omezení pohybu respektuje i nastavení systému.' }: { preferenceHint?: string } = {}) {
  const [variant, setVariant] = useState<ButtonVariant>('primary');
  const [size, setSize] = useState<ButtonSize>('medium');
  const [motion, setMotion] = useState<ButtonMotion>('none');
  const [color, setColor] = useState('#7c3aed'), [duration, setDuration] = useState(4);
  const [disabled, setDisabled] = useState(false), [loading, setLoading] = useState(false), [reduced, setReduced] = useState(false);
  const [busy, setBusy] = useState(false), [events, setEvents] = useState(0), [message, setMessage] = useState('Připraveno.');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const clicked = () => { setEvents(n => n + 1); setMessage('Akce byla aktivována.'); };
  const run = () => {
    setBusy(true); setMessage('Probíhá ukázková kontrola.');
    timer.current = setTimeout(() => { setBusy(false); setMessage('Kontrola dokončena.'); }, 1000);
  };
  return <section className="axo-button-showcase" aria-labelledby="axo-button-heading">
    <div className="axo-button-showcase__heading"><div><span className="axolotl-eyebrow">Components / Button</span><h2 id="axo-button-heading">Lens 02 · Clean Icon</h2><p>Skutečná React komponenta. Schválený vzhled, implementace k revizi.</p></div>
      <a href="https://iriskax.github.io/axolotl-preview/lens-02-clean-icon/" target="_blank" rel="noreferrer">Vizuální reference ↗</a></div>
    <div className="axo-button-showcase__playground">
      <div className="axo-button-showcase__stage" aria-label="Interaktivní náhled Button">
        <Sample id="button-playground" variant={variant} size={size} motion={motion} starBorder={{color, duration}} disabled={disabled} loading={loading} reducedMotion={reduced} onClick={clicked} />
        <p className="axo-button-showcase__hint">Hover a stisk vyzkoušej přímo. Tab ukáže focus, Enter a mezerník aktivují akci.</p>
        <output aria-label="Počet aktivací">Aktivace: {events}</output>
      </div>
      <div className="axo-button-showcase__controls">
        <fieldset><legend>Varianta</legend>{variants.map(v => <label key={v}><input type="radio" name="button-variant" value={v} checked={variant === v} onChange={() => setVariant(v)} />{names[v]}</label>)}</fieldset>
        <fieldset><legend>Velikost</legend>{sizes.map(s => <label key={s}><input type="radio" name="button-size" value={s} checked={size === s} onChange={() => setSize(s)} />{s}</label>)}</fieldset>
        <fieldset><legend>Stav</legend><label><input type="checkbox" checked={disabled} onChange={e => setDisabled(e.target.checked)} />Disabled</label><label><input type="checkbox" checked={loading} onChange={e => setLoading(e.target.checked)} />Loading</label></fieldset>
        <fieldset><legend>Motion</legend><label><input type="checkbox" checked={motion === 'star-border'} onChange={e => setMotion(e.target.checked ? 'star-border' : 'none')} />Star Border</label><label><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)} />Omezit pohyb</label></fieldset>
        <div className="axo-button-showcase__motion-controls"><label>Barva stopy<input aria-label="Barva stopy" type="color" value={color} onChange={e => setColor(e.target.value)} /></label><label htmlFor="button-duration">Doba oběhu: {duration} s<input id="button-duration" type="range" min="0.5" max="10" step="0.5" value={duration} onChange={e => setDuration(Number(e.target.value))} /></label></div>
        <p>{preferenceHint}</p>
      </div>
    </div>
    <section aria-labelledby="button-matrix-heading"><h3 id="button-matrix-heading">Varianty a velikosti</h3><div className="axo-button-showcase__matrix">{variants.map(v => <section key={v} aria-label={names[v]}><h4>{names[v]}</h4>{sizes.map(s => <div key={s}><span>{s}</span><Sample variant={v} size={s} onClick={clicked} /></div>)}</section>)}</div></section>
    <section aria-labelledby="button-state-heading"><h3 id="button-state-heading">Stavy</h3><div className="axo-button-showcase__states">{variants.map(v => <div key={v}><h4>{names[v]}</h4><Sample variant={v} disabled /><Sample variant={v} loading /></div>)}</div></section>
    <section aria-labelledby="button-context-heading"><h3 id="button-context-heading">V kontextu</h3><div className="axo-button-showcase__contexts">
      <article><h4>Asynchronní akce</h4><p>Loading zachová zaměření, zablokuje opakovanou aktivaci a vypne světelné stopy.</p><Button id="button-async" variant="primary" icon={<Play strokeWidth={1.7} />} motion="star-border" loading={busy} loadingLabel="Probíhá kontrola" onClick={run}>Spustit kontrolu</Button></article>
      <form onSubmit={e => { e.preventDefault(); setMessage('Formulář odeslán: ' + new FormData(e.currentTarget).get('workspace')); }}><h4>Nativní formulář</h4><label htmlFor="button-workspace">Název workspace<input id="button-workspace" name="workspace" required defaultValue="Můj workspace" /></label><Button type="submit" variant="secondary">Uložit workspace</Button></form>
    </div><p role="status" aria-live="polite">{message}</p></section>
    <details><summary>API, původ a stav schválení</summary><p><code>src/design-system/Button</code> · stejný export používá playground, matice i příklady.</p><p><code>variant</code>: primary / secondary / ghost / icon / destructive. <code>size</code>: small / medium / large. <code>motion</code>: none / star-border. <code>starBorder</code>: color, duration (sekundy).</p><p>Nativní button props a ref, volitelná ikona, loading, loadingLabel, theme a reducedMotion. Icon vyžaduje přístupný název. Odkazy a automatická migrace stávajících tlačítek nejsou součástí této iterace.</p><p>Vzhled schválen; tato implementace čeká na schválení. Originální React Bits Star Border © 2026 David Haz, MIT + Commons Clause. Licence a přesný zdroj jsou v repozitáři vedle komponenty.</p></details>
  </section>;
}
