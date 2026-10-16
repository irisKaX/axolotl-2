import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePageContext } from "../../app/PageContextProvider";
import { HeaderPreview } from "./HeaderPreview";
import type { HeaderVariant } from "./PreviewControls";
import { createPreferencesStore } from "../../lib/preferences";
import "./header-lab.css";

const variants = [
  { id: "unified" as const, letter: "A", title: "Unified Floating Controls", detail: "Jedna kapsle. Klidná, kompaktní a sjednocená.", recommended: true },
  { id: "spatial" as const, letter: "B", title: "Spatial Command Bar", detail: "Samostatné prvky. Více prostoru a světla.", recommended: false },
];
const widths = [1440, 1366, 1024, 768, 390];

export function HeaderWorkbench({ connectedOnly = false }: { connectedOnly?: boolean }) {
  const [variant, setVariant] = useState<HeaderVariant>("unified");
  const [preferences] = useState(() => createPreferencesStore({ storagePrefix: "axolotl-header-lab-full", initialTheme: "dark" }));
  const { resolvedTheme: theme } = useSyncExternalStore(preferences.subscribe, preferences.getSnapshot);
  const [width, setWidth] = useState(1366);
  const [fit, setFit] = useState(true);
  const [available, setAvailable] = useState(1366);
  const stage = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = stage.current;
    if (!element) return;
    const update = () => { if (element.clientWidth) setAvailable(element.clientWidth); };
    const observer = new ResizeObserver(update);
    observer.observe(element); update();
    return () => observer.disconnect();
  }, []);
  const scale = fit ? Math.min(1, available / width) : 1;
  const height = width <= 768 ? 740 : 630;
  return <section className="axolotl-lab-workbench" aria-label="Celá hlavička">
    <div className="axolotl-lab-section-heading"><div><span className="axolotl-eyebrow">Varianta A · sjednocená navigace</span><h3>Všechno v jednom celku.</h3><p>Navigace, URL a ovládání ve společné liště. Vyzkoušej obě témata a různé šířky.</p></div></div>
    <div className="axolotl-lab-toolbar">
      {!connectedOnly && <div className="axolotl-lab-segment" role="group" aria-label="Varianta celé hlavičky">{variants.map(v => <button type="button" key={v.id} aria-pressed={variant === v.id} onClick={() => setVariant(v.id)}>Varianta {v.letter}</button>)}</div>}
      <div className="axolotl-lab-segment" role="group" aria-label="Téma celé hlavičky">{(["dark", "light"] as const).map(value => <button type="button" key={value} aria-pressed={theme === value} onClick={() => preferences.set("theme", value)}>{value === "dark" ? "Dark" : "Light"}</button>)}</div>
      <div className="axolotl-lab-widths" role="group" aria-label="Šířka obrazovky">{widths.map(value => <button type="button" key={value} aria-pressed={width === value} onClick={() => setWidth(value)}>{value} px</button>)}</div>
      <label className="axolotl-lab-fit"><input type="checkbox" checked={fit} onChange={event => setFit(event.target.checked)} />Vejít do náhledu</label>
    </div>
    <div className="axolotl-lab-viewport-meta"><span>{width} × {height} px</span><span>Měřítko {Math.round(scale * 100)} % · menu zůstávají interaktivní</span></div>
    <div className="axolotl-lab-stage" ref={stage}>
      <div className="axolotl-lab-scaled-space" style={{ width: width * scale, height: height * scale }}>
        <div className="axolotl-lab-viewport" data-preview-width={width} style={{ width, height, transform: `scale(${scale})` }}>
          <HeaderPreview store={preferences} instance="full" theme={theme} variant={variant} full />
        </div>
      </div>
    </div>
  </section>;
}

export default function HeaderLab() {
  const { connection } = usePageContext();
  return <div className="axolotl-header-lab">
    <div className="axolotl-lab-heading"><div><span className="axolotl-eyebrow">Header study / 01</span><h2>Jedna navigace. Dva směry.</h2><p>Porovnej pravou část hlavičky v obou tématech. Všechna ovládání můžeš rovnou vyzkoušet.</p></div><span className="axolotl-lab-status"><i data-connected={connection.status === "connected"} />{connection.status === "connected" ? "Prohlížeč propojený" : connection.status === "checking" ? "Ověřuji propojení" : "Ruční URL aktivní"}</span></div>
    <div className="axolotl-lab-compare">
      {variants.map(v => <div className="axolotl-lab-column" key={v.id}>
        <div className="axolotl-lab-variant-heading"><span className="axolotl-lab-letter">{v.letter}</span><div><h3>{v.title}</h3><p>{v.detail}</p></div>{v.recommended && <span className="axolotl-lab-recommended">Preferovaná</span>}</div>
        {(["dark", "light"] as const).map(theme => <section className="axolotl-lab-swatch" key={theme} aria-label={`Varianta ${v.letter} – ${theme === "dark" ? "tmavý" : "světlý"} režim`}>
          <HeaderPreview instance={`${v.id}-${theme}`} variant={v.id} theme={theme} />
        </section>)}
      </div>)}
    </div>
    <div className="axolotl-lab-footnote"><p>Nabídky otevřeš najetím nebo kliknutím; položku zvolíš kliknutím. Tab a šipky procházejí ovládání, Escape nabídku zavře.</p><p>Téma a vzhled se ukládají odděleně pro každý náhled. URL i výběr karty jsou skutečný, společný kontext aplikace. Zvoneček otevírá prázdný panel bez smyšlených zpráv.</p>{connection.status !== "connected" && <p>Výběr skutečných karet vyžaduje rozšíření a katalog na povolené adrese Axolotlu. V lokálním náhledu funguje ruční URL; žádné karty se nesimulují.</p>}</div>
    <HeaderWorkbench />
  </div>;
}
