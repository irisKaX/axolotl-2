import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { colors, parseVisual, studies, type VisualVariant } from './design';
const widths = [1440, 1366, 1180, 1024, 768, 680, 390, 320];
function Viewport({ variant, width, fit, theme, context }: { variant: VisualVariant; width: number; fit: boolean; theme: string; context: string }) {
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
  const source = `header-visual-lab.html?view=scene&variant=${variant}&theme=${theme}${context === 'dashboard' ? '' : `#${context}`}`;
  return <>
    <div className="hr-viewport-label"><span>{width} × {height} px · {Math.round(scale * 100)} %</span><a href={source} target="_blank" rel="noreferrer" aria-label={`Otevřít ${variant} samostatně`}>Samostatně ↗</a></div>
    <div className="hr-stage" ref={area}><div className="hr-canvas" style={{ width: width * scale, height: height * scale }}><iframe title={`Vizuální varianta ${variant}`} key={`${variant}-${theme}-${context}`} src={source} width={width} height={height} style={{ transform: `scale(${scale})` }}/></div></div>
  </>;
}
export function VisualLab() {
  const initial = new URLSearchParams(location.search);
  const [variant, setVariant] = useState(() => parseVisual(initial.get('variant')));
  const [width, setWidth] = useState(() => Math.min(1600, Math.max(320, Number(initial.get('width')) || (innerWidth < 680 ? 390 : 1440))));
  const [compare, setCompare] = useState(initial.get('compare') === 'all');
  const [fit, setFit] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(initial.get('theme') === 'light' ? 'light' : 'dark');
  const [context, setContext] = useState('dashboard');
  useEffect(() => {
    const query = new URLSearchParams({ variant, width: String(width), theme });
    if (compare) query.set('compare', 'all');
    history.replaceState(null, '', `${location.pathname}?${query}`);
  }, [variant, width, compare, theme]);
  return <main className="hr-lab vu-lab">
    <header className="vu-intro"><div><div className="hr-eyebrow"><span className="hr-dot"/>AXOLOTL / DESIGN LAB <span>STUDY 02</span></div><h1>Jeden jazyk.<br/><span>Tři interpretace.</span></h1><p>Levá PillNav určuje charakter. Pravá část hledá stejný rytmus.<br/>Tři vizuální systémy, jedno ověřené chování C2.</p></div><div className="vu-status"><span>VIZUÁLNÍ EXPLORACE</span><p>Žádná varianta není finální.</p><a href="header-responsive-lab.html?variant=C2" target="_blank" rel="noreferrer">Původní C2 ↗</a></div></header>
    <div className="hr-variant-picker vu-picker" role="group" aria-label="Vizuální varianty">{studies.map(v => <button type="button" key={v.id} aria-pressed={!compare && v.id === variant} onClick={() => { setVariant(v.id); setCompare(false); }}><span>{v.id}</span><div><strong>{v.name}</strong><small>{v.short}</small></div><i aria-hidden="true">↗</i></button>)}</div>
    <section className="vu-toolbar" aria-label="Nastavení porovnání">
      <div className="vu-view-mode"><button type="button" aria-pressed={!compare} onClick={() => setCompare(false)}>Detail varianty</button><button type="button" aria-pressed={compare} onClick={() => setCompare(true)}>Vedle sebe</button></div>
      <label>Téma <select aria-label="Téma náhledů" value={theme} onChange={e => setTheme(e.target.value === 'light' ? 'light' : 'dark')}><option value="dark">Dark</option><option value="light">Light</option></select></label>
      <label>Kontext <select aria-label="Kontext aplikace" value={context} onChange={e => setContext(e.target.value)}><option value="dashboard">Dashboard</option><option value="kontrola/metadata">Metadata</option><option value="kontrola/nadpisy">Nadpisy</option><option value="media/qr">QR generátor</option></select></label>
      <label className="vu-fit"><input type="checkbox" checked={fit} onChange={e => setFit(e.target.checked)}/> Přizpůsobit náhled</label>
      <div className="hr-size-control vu-width"><label htmlFor="vu-width">Simulovaný viewport <strong>{width} px</strong></label><input id="vu-width" type="range" min="320" max="1600" step="1" value={width} onChange={e => setWidth(Number(e.target.value))}/><div className="hr-presets">{widths.map(w => <button type="button" aria-pressed={width === w} key={w} onClick={() => setWidth(w)}>{w}</button>)}</div></div>
    </section>
    <div className="vu-guidance"><span>{width > 1180 ? 'PLNÁ PILLNAV' : width > 680 ? 'KOMPAKTNÍ C2' : 'MOBILNÍ C2'}</span><p>{compare ? 'Porovnej proporce vedle sebe. Pro čitelnost a dotyk otevři variantu samostatně v měřítku 100 %.' : 'Otevři menu, URL, zvonek nebo Nastavení. Vyzkoušej i Tab a Escape.'} Téma nahoře sjednotí náhledy; uvnitř je můžeš přepínat nezávisle.</p></div>
    <div className="vu-comparison" data-compare={compare}>{studies.filter(v => compare || v.id === variant).map(v => <section className="vu-study" key={v.id} aria-label={`Studie ${v.id}`}>
      <header className="vu-study-title"><span>{v.id}</span><div><h2>{v.name}</h2><p>{v.material}</p></div></header>
      <Viewport variant={v.id} width={width} fit={fit} theme={theme} context={context}/>
      <div className="vu-spec-strip"><span>Nav <b>{v.nav}</b></span><span>URL <b>{v.url}</b></span><span>Ikona <b>{v.icon}</b></span><span>Povrch akce <b>{v.action}</b></span><span>Dotyk <b>44+</b></span></div>
      <p className="vu-description">{v.description}</p><dl className="vu-review"><div><dt>Přednost</dt><dd>{v.benefit}</dd></div><div><dt>Slabina</dt><dd>{v.tradeoff}</dd></div><div><dt>Riziko</dt><dd>{v.risk}</dd></div></dl>
    </section>)}</div>
    <details className="vu-tokens"><summary>Společný základ · předběžné design tokeny <span>Prohlédnout systém ↗</span></summary><p>Sémantické role jsou společné, proporce a povrchy se mezi variantami liší. Návrh platí pouze pro tento lab.</p><div className="vu-swatches">{Object.entries(colors[theme]).map(([key,value]) => <div key={key}><i style={{ background: value }}/><code>{key}</code><span>{value}</span></div>)}</div><div className="vu-table-wrap"><table><caption>Proporce v CSS pixelech</caption><thead><tr><th>Role / token</th>{studies.map(v => <th key={v.id}>{v.id}</th>)}</tr></thead><tbody>{([['Navigace / --vu-nav-h','nav'],['URL / --vu-url-h','url'],['Viditelná akce / --vu-action','action'],['Ikona / --vu-icon','icon'],['Theme track / --vu-track-w','track'],['Rytmus / --vu-gap','gap'],['Panel / --vu-panel-radius','radius'],['Odezva v ms / --vu-duration','motion']] as const).map(([label,key]) => <tr key={key}><th>{label}</th>{studies.map(v => <td key={v.id}>{v[key]}</td>)}</tr>)}</tbody></table></div><p>Pill radius 999 px · klikací plocha minimálně 44 × 44 px · focus 2 px · aktivní stav: violet + značka ✓ · overlay C2: beze změny toku stránky · reduced motion: bez pohybu.</p></details>
    <footer className="vu-footer"><span>EXPERIMENT / BEZ PRODUKČNÍ INTEGRACE</span><p>Pro Mac začni na 1440 a 1024 px. Na iPhonu otevři „Samostatně“. Nejprve posuzuj hierarchii a čitelnost, potom materiál a pohyb.</p></footer>
  </main>;
}
