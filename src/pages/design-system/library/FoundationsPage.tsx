import { foundationGroups, foundationTokens, openDecisions } from '../../../design-system/tokens/inventory';
import { sourceUrl } from './registry';
export function FoundationsInventory() {
 return <section className="ds-foundations-inventory" aria-label="Foundations inventory">
  <p>Existující definice a jejich skutečné zdroje. Schválení Dashboardu platí pro kompozici 523c983; nemění schválení globálních tokenů.</p>
  {foundationGroups.map(group=><section key={group}>
   <h2>{group}</h2>
   {group==='Dark / Light Themes' ? <p>Každá ukázka používá přepínač dark/light. Katalogové sémantické hodnoty: <code>tokens/library.css</code> a <code>tokens/unified.css</code>; schválené materiály Dashboardu: <code>tokens/dashboard.ts</code>. Produkční Header dědíme z jeho původního CSS modulu.</p> : <ul>{foundationTokens.filter(t=>t.group===group).map((t,i)=><li key={`${t.source}-${t.scope}-${t.name}-${i}`}>
    <details><summary><code>{t.name}</code> · {t.design==='approved'?'Schváleno':'Návrh'}{t.production?' · Produkčně použito':''}</summary>
     <p><code style={{overflowWrap:'anywhere'}}>{t.value}</code></p><p>{t.scope}</p><a href={sourceUrl(t.source)}>{t.source}</a>
    </details>
   </li>)}</ul>}
  </section>)}
  <h2>Otevřená rozhodnutí · Návrh</h2><ul>{openDecisions.map(item=><li key={item}>{item}</li>)}</ul>
  <p>Duplicitní kopie barev z Playgroundu byly odstraněné; Dashboard a Colors &amp; Gradients používají stejný registr. Shodný zápis hodnoty s odlišnou sémantickou rolí neznamená automaticky schválené sjednocení.</p>
 </section>;
}
export default FoundationsInventory;
