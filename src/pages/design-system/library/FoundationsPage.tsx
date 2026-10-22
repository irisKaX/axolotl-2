import { useEffect, useState } from 'react';
import { foundationGroups, foundationTokens, openDecisions } from '../../../design-system/tokens/inventory';
import { themeAliases } from '../../../design-system/tokens/theme';
import { paints } from '../../../design-system/tokens/paints';
import { sourceUrl } from './registry';
function TokenTable({tokens}: {tokens: {name:string;light:string;dark:string}[]}) {
 return <div className="ds-theme-table"><table><caption>Účinné hodnoty TweakCN theme</caption><thead><tr><th scope="col">Token</th><th scope="col">Light</th><th scope="col">Dark</th></tr></thead><tbody>{tokens.map(t=><tr key={t.name}><th scope="row"><code>{t.name}</code></th>{(['light','dark'] as const).map(mode=><td key={mode}>{/^(oklch|hsl)/.test(t[mode])&&<span className="ds-theme-swatch" style={{background:t[mode]}} aria-hidden="true"/>}<code>{t[mode]}</code></td>)}</tr>)}</tbody></table></div>;
}
export function FoundationsInventory() {
 const [georgia,setGeorgia]=useState<boolean|null>(null);
 useEffect(()=>{let active=true;new FontFace('Georgia availability',"local('Georgia')").load().then(()=>active&&setGeorgia(true),()=>active&&setGeorgia(false));return()=>{active=false;};},[]);
 return <section className="ds-foundations-inventory" aria-label="Foundations inventory">
  <p><strong>TweakCN · jednotný vizuální základ.</strong> Light/dark hodnoty z dodaného CSS exportu s minimálními korekcemi kontrastu WCAG AA. Stejný registr řídí komponenty, Header, Dashboard i portálová menu.</p>
  <a href={sourceUrl('src/design-system/tokens/tweakcn.export.css')}>Původní CSS export</a> · <a href={sourceUrl('src/design-system/tokens/contrast-corrections.json')}>Kontrastní korekce tokenů</a>
  {foundationGroups.map(group=><section key={group}>
   <h2>{group}</h2>
   {foundationTokens.some(t=>t.group===group)&&<TokenTable tokens={foundationTokens.filter(t=>t.group===group)}/>}
   {group==='Dark / Light Themes'&&<p>Horní přepínač i přepínač Headeru mění celý katalog. Přehled Themes na úvodní stránce ukazuje obě varianty vedle sebe. Hodnoty .dark nejsou odvozené zesvětlením ani filtrem.</p>}
   {group==='Typography'&&<div className="ds-theme-samples"><div style={{fontFamily:'var(--font-sans)'}}>Montserrat · Příliš žluťoučký kůň</div><div style={{fontFamily:'var(--font-serif)'}}>Georgia · Příliš žluťoučký kůň</div><div style={{fontFamily:'var(--font-mono)'}}>Fira Code · const theme = 'Axolotl';</div></div>}
   {group==='Font Families & Weights'&&<><p>Montserrat 100–900 a Fira Code 300–700: lokální variabilní WOFF2, Latin + Latin Extended, <a href={`${import.meta.env.BASE_URL}fonts/tweakcn/montserrat-OFL.txt`}>SIL OFL · Montserrat</a> / <a href={`${import.meta.env.BASE_URL}fonts/tweakcn/fira-code-OFL.txt`}>SIL OFL · Fira Code</a>.</p><p role="status">Georgia: {georgia===null?'ověřuji systémovou dostupnost':georgia?'dostupná ze systému':'v tomto zařízení není dostupná; serif ukázka používá fallback'}. Proprietární font bez dodané webfontové licence se nešíří s katalogem. <a href="https://learn.microsoft.com/en-us/typography/font-list/georgia">Licence a dostupnost Georgia</a>.</p></>}
   {group==='Spacing'&&<p>Základ <code>--spacing</code> řídí násobky 1×, 2×, 3×, 4× a 6×. Schválená responsive geometrie benta zůstává zachovaná.</p>}
   {group==='Radius'&&<TokenTable tokens={Object.entries(themeAliases).filter(([name])=>name.startsWith('--radius-')).map(([name,value])=>({name,light:value,dark:value}))}/>}
   {group==='Shadows & Elevation'&&<div className="ds-theme-samples">{['2xs','xs','sm','md','lg','xl','2xl'].map(size=><div key={size} style={{boxShadow:`var(--shadow-${size})`}}>{size}</div>)}</div>}
   {group==='Surfaces & Materials'&&<p>Card / card-foreground: karty, Office a šest widgetů. Popover / popover-foreground: menu a popovery. Background / foreground: pracovní plocha. Sidebar role: navigace katalogu. Brandové gradienty jsou dostupné pouze pro záměrné kreativní použití.</p>}
   {group==='Motion & Transitions'&&<p>Dosavadní hover, focus, dropdown logika, loading, Border Beam a volitelný React Bits Star Border zůstávají. Nové efekty se nepřidávají; omezení pohybu zůstává funkční.</p>}
   {group==='Component States'&&<p>Primary a primary-foreground: hlavní akce a výběr. Accent: zvýraznění. Muted: pomocné informace. Ring: focus. Destructive: chyba a destruktivní akce. Pozadí a text se mění jako pár. Disabled je vizuálně zeslabený; loading zachovává čitelnost a blokuje opakovanou akci.</p>}
   {group==='Brand Colors'&&<><p>Samostatná kreativní vrstva. O2 Blue a Axolotl Violet ani osm gradientů nepřepisují sémantiku theme. Mascot Palette V3 zůstává v Brand &amp; Mascot.</p><div className="ds-theme-samples">{paints.filter(p=>p.kind==='gradient'||['o2-blue','axolotl-violet'].includes(p.id)).map(p=><div key={p.id}><span className="ds-theme-swatch" style={{background:p.css}} aria-hidden="true"/>{p.name}<br/><code>{p.css}</code></div>)}</div></>}
  </section>)}
  <h2>Technická omezení</h2><ul>{openDecisions.map(item=><li key={item}>{item}</li>)}</ul>
 </section>;
}
export default FoundationsInventory;
