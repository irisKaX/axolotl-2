import { useLayoutEffect, useRef, useState } from 'react';
import { variants, parseVariant, type Variant } from './variants';
const widths = [1440, 1366, 1180, 1024, 900, 768, 680, 390, 320];

function Viewport({ variant, width, fit, theme }: { variant: Variant; width: number; fit: boolean; theme: string }) {
  const area = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(width);
  useLayoutEffect(() => {
    const element = area.current!;
    const observer = new ResizeObserver(() => setAvailable(element.clientWidth));
    observer.observe(element); setAvailable(element.clientWidth);
    return () => observer.disconnect();
  }, []);
  const scale = fit ? Math.min(1, available / width) : 1;
  const height = width <= 680 ? 844 : 768;
  const source = `header-responsive-lab.html?view=scene&variant=${variant}&theme=${theme}`;
  return <>
    <div className="hr-viewport-label"><span>{width} × {height} <small>CSS px</small></span><span>{Math.round(scale * 100)} % {scale < 1 ? '· zmenšený náhled' : '· skutečná velikost'}</span><a href={source} target="_blank" rel="noreferrer">Otevřít samostatně ↗</a></div>
    <div className="hr-stage" ref={area}><div className="hr-canvas" style={{ width: width * scale, height: height * scale }}><iframe key={`${variant}-${theme}`} title={`Varianta ${variant} – interaktivní header`} src={source} width={width} height={height} style={{ transform: `scale(${scale})` }}/></div></div>
  </>;
}
export function Lab() {
  const [variant, setVariant] = useState<Variant>(() => parseVariant(new URLSearchParams(location.search).get('variant')));
  const [width, setWidth] = useState(() => innerWidth < 680 ? Math.max(320, innerWidth - 32) : 1024);
  const [fit, setFit] = useState(true);
  const [compare, setCompare] = useState<'none' | 'all' | 'shelf'>('none');
  const [theme, setTheme] = useState('dark');
  const visible = variants.filter(v => compare === 'all' || (compare === 'shelf' ? v.id === 'C' || v.id === 'C2' : v.id === variant));
  return <main className="hr-lab">
    <header className="hr-lab-intro"><div><div className="hr-eyebrow"><span className="hr-dot"/>AXOLOTL / DESIGN LAB <span>STUDY 01</span></div><h1>Malé okno.<br/><span>Tři směry. Nová C2.</span></h1><p>Stejný Axolotl. Tři prostorová řešení a C2 s překryvnou navigací.<br/>Otevři menu, změň šířku a rozhodni podle toho, jak se ti pracuje.</p></div><div className="hr-experiment">EXPERIMENT <span>Žádná varianta není schválená</span></div></header>
    <div className="hr-variant-picker" role="group" aria-label="Výběr varianty">{variants.map(v => <button type="button" key={v.id} aria-pressed={compare === 'none' && variant === v.id} onClick={() => { setVariant(v.id); setCompare('none'); }}><span>{v.id}</span><div><strong>{v.name}</strong><small>{v.subtitle}</small></div><i aria-hidden="true">↗</i></button>)}</div>
    <section className="hr-controls" aria-label="Nastavení porovnání"><div className="hr-size-control"><label htmlFor="hr-width">Šířka viewportu <strong>{width} px</strong></label><input id="hr-width" type="range" min="320" max="1600" value={width} onChange={e => setWidth(Number(e.target.value))}/><div className="hr-presets">{widths.map(w => <button type="button" key={w} aria-pressed={width === w} onClick={() => setWidth(w)}>{w}</button>)}</div></div><div className="hr-options"><button className="hr-compare-shelf" type="button" aria-pressed={compare === 'shelf'} onClick={() => setCompare(compare === 'shelf' ? 'none' : 'shelf')}>Porovnat C / C2</button><label><input type="checkbox" checked={compare === 'all'} onChange={e => setCompare(e.target.checked ? 'all' : 'none')}/> Porovnat všechny varianty</label><label><input type="checkbox" checked={fit} onChange={e => setFit(e.target.checked)}/> Přizpůsobit náhled</label><label>Téma <select aria-label="Téma náhledů" value={theme} onChange={e => setTheme(e.target.value)}><option value="dark">Dark</option><option value="light">Light</option></select></label></div></section>
    <div className="hr-breakpoint"><span>{width > 1180 ? 'Plná navigace' : width > 680 ? 'Kompaktní desktop / tablet' : 'Mobilní rozložení'}</span><p>{width > 1180 ? 'Široký režim je společný. Rozdíly A / B / C / C2 se projeví při 1180 px a méně.' : 'Vyzkoušej hamburger, kategorie, URL, zvonek i nastavení. Odkazy mění stránku uvnitř náhledu.'}</p></div>
    {visible.map(v => <section className="hr-study" key={v.id} aria-label={`Studie ${v.id}`}><div className="hr-study-title"><span>{v.id}</span><div><h2>{v.name}</h2><p>{v.description}</p></div></div><Viewport variant={v.id} width={width} fit={fit} theme={theme}/><div className="hr-review"><div><h3>Výhoda</h3><p>{v.advantage}</p></div><div><h3>Kompromis</h3><p>{v.disadvantage}</p></div><div><h3>Technické riziko</h3><p>{v.risk}</p></div></div><p className="hr-behavior">{v.behavior}</p></section>)}
    <footer className="hr-lab-footer"><p><strong>Jak hodnotit:</strong> začni na 1024 px, otevři menu a projdi do Metadata. Pak zkus 768 a 390 px. Pro dotyk a čitelnost použij 100% velikost nebo samostatný náhled.</p><p>Tab / Shift+Tab · Enter / mezerník · šipky v navigaci · Escape · kliknutí mimo. Ruční URL funguje; skutečné karty prohlížeče vyžadují rozšíření na povolené adrese. Výběr tématu nahoře znovu načte náhledy.</p><a href="./">Zpět na testovací aplikaci ↗</a></footer>
  </main>;
}
