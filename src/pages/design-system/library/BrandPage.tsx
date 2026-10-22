import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { AnimatedAxolotlLogo } from "../../../design-system/brand";
import { Button } from "../../../design-system/Button";
import { DesignSystemProvider, useDesignSystem } from "../../../design-system/library/Provider";
import originalHtml from "../../../design-system/brand/vendor/original.html.txt?url";
import originalCss from "../../../design-system/brand/vendor/original.css.txt?url";
import notice from "../../../design-system/brand/vendor/NOTICE.md?url";
import license from "../../../design-system/brand/vendor/LICENSE.txt?url";
import { mascotPalette } from "../../../design-system/tokens/mascot";
import "./consolidation.css";



export function MascotIdentity() {
  return <section aria-labelledby="mascot-identity">
    <h2 id="mascot-identity">Axolotl · Master V3</h2>
    <p><strong>Schváleno · 22. 10. 2026.</strong> Zvídavý, inteligentní a nápomocný pracovní parťák. Přátelský, klidně sebejistý, roztomilý bez infantilnosti. Průvodce onboardingem, prázdnými stavy a drobnými úspěchy.</p>
    <h3>Identita postavy</h3>
    <p>Soft-premium 3D, měkké textilie a jemný ambientní glow. Velká kulatá hlava, malé nozdry, subtilní úsměv, velké fialové lesklé oči a šest paprskovitých, jemně vláknitých růžovofialových žaber. Světlá pudrově růžová pokožka a viditelný růžový ocas.</p>
    <p>Master nosí světle levandulovou mikinu s malým tmavě fialovým logem O2, tmavší fialové cargo/jogger kalhoty a bílé tenisky. Přirozený postoj s rukama v kapsách. Indigo/fialové pozadí masteru není povinné pro každé použití.</p>
    <h3>Paleta maskota</h3>
    <p>Orientační vzorky ilustrace, nikoli přesné materiálové hodnoty. Slouží maskotovi, ilustracím a Office; nemění UI paletu O2 Blue <code>#0050FF</code> a Axolotl Violet <code>#7C3AED</code>.</p>
    <ul className="ds-mascot-palette">{mascotPalette.map(([name, hex, role]) => <li key={hex}>
      <span className="ds-mascot-swatch" style={{ background: hex }} aria-hidden="true" />
      <strong>{name}</strong><code>{hex}</code><span>{role}</span>
    </li>)}</ul>
    <h3>Pravidla použití</h3>
    <ul>
      <li>Zachovat obličej, oči, proporce hlavy, výraz, šest žaber a měkký materiálový styl.</li>
      <li>Měnit lze pózu, emoci, rekvizity, scénu a světlo. Alternativní oblečení vyžaduje řízené schválení.</li>
      <li>Nevytvářet jinou postavu, agresivní gaming styl, zuby, drsné brýle ani náhodné ostré pózy.</li>
      <li>O2 logo je decentní detail. Ilustrace neruší soustředěnou práci. V1 a Coffee/Premium V2 jsou historie, nikoli master.</li>
    </ul>
    <h3>Assety a dostupnost</h3>
    <p role="status"><strong>Obrazový master V3 zatím není dostupný v repozitáři.</strong> Dokumentace odkazuje na <code>image(20261022-081711).png</code> v původní konverzaci. Cílová cesta je <code>Assets/Axolotl/axolotl-master-v3.png</code>. Nevkládáme náhradní podobu ani nefunkční obrázek.</p>
    <p>Rigovaný 3D model ani animace nejsou dodané assety. Office v Dashboardu zůstává schváleným placeholderem.</p>
    <p>Archivní Office ilustrace (nejsou master V3): <a href="https://github.com/irisKaX/axolotl-prototype/tree/6e3c3a8de217c1a2888f541a5370c4168ca32f9b/office/assets">office-dark.webp, office-light.webp a podkladové office-clean-dark/light.webp</a>. Zůstávají zachované pro historické reference, nejsou vložené místo současného maskota.</p>
    <a href="https://github.com/irisKaX/axolotl-knowledge/blob/316927f6b143a4cc93d680e8c1945a3c85a013da/Axolotl%20Mascot%20Character%20Identity.md">Zdroj: Axolotl Mascot Character Identity · V3</a>
  </section>;
}
export default function BrandPage() {
  const [paused, setPaused] = useState(false);
  const env = useDesignSystem();
  return <>
    <section className="ds-animated-brand" aria-labelledby="animated-brand-heading">
      <span className="axolotl-eyebrow">Brand & Mascot · referenční komponenta</span>
      <h2 id="animated-brand-heading">Animated Axolotl Logo</h2>
      <p><strong>Návrh · Assistant Mark.</strong> Kompaktní, přátelská značka s jemným jelly pohybem a orbitou. Hlava podle dodaného axolotlího symbolu, barevnost z identity V3 a aktuálního theme.</p>
      <div className="ds-animated-brand__hero">
        <AnimatedAxolotlLogo size="large" paused={paused} />
        <div><h3>Hlavní varianta</h3><p>Výrazné oči, šest žaber a klidný úsměv. Značka pro identitu, načítání nebo označení asistenta.</p></div>
        <Button variant="outline" icon={paused ? <Play /> : <Pause />} aria-pressed={paused} onClick={() => setPaused(value => !value)}>
          {paused ? "Přehrát animaci" : "Pozastavit animaci"}
        </Button>
      </div>
      <p>Omezení pohybu v systému nebo nastavení katalogu má přednost před přehráváním. Pozastavení zachová čitelnou statickou značku.</p>
      <div className="ds-animated-brand__themes">
        {(["dark", "light"] as const).map(theme => <DesignSystemProvider key={theme} theme={theme} appearance="unified" reducedMotion={env.reducedMotion}>
          <section className="ds-animated-brand__theme" data-mark-theme={theme} aria-label={`${theme} ukázka značky`}>
            <h3>{theme === "dark" ? "Dark" : "Light"}</h3>
            <div className="ds-animated-brand__sizes">
              {(["small", "medium", "large"] as const).map((size, i) => <figure key={size}>
                <AnimatedAxolotlLogo size={size} paused={paused} />
                <figcaption>{["S · 48 px", "M · 72 px", "L · 104 px"][i]}</figcaption>
              </figure>)}
            </div>
          </section>
        </DesignSystemProvider>)}
      </div>
      <h3>Doporučené použití</h3>
      <div className="ds-animated-brand__uses">
        <article><AnimatedAxolotlLogo size="small" paused={paused} decorative /><div><h4>Axolotl</h4><p>Logo / identitní prvek. Vedle názvu aplikace použij dekorativní režim bez duplicitního čtení.</p></div></article>
        <article><AnimatedAxolotlLogo variant="loader" paused={paused} label="Ukázka: načítání pracovního prostoru" /><div><h4>Načítání prostoru</h4><p>Loader s textovým oznámením pro čtečky. Stejný význam zůstává i bez animace.</p></div></article>
        <article><AnimatedAxolotlLogo variant="assistant" paused={paused} /><div><h4>Assistant Mark</h4><p>Označení průvodce nebo asistenta. Značka sama není tlačítko ani indikátor připojené AI služby.</p></div></article>
      </div>
      <h3>Původ a adaptace</h3>
      <p>Motion základ: <a href="https://uiverse.io/sanjanaare_1029/horrible-fly-78">sanjanaare_1029 · Uiverse</a>. Zachovány proporce 72 / 50 / 58 px, rotace a idle 2,2 s a morph 1,7 s. Axolotl adaptace přidává dodanou podobu hlavy, žábry, úsměv, paletu V3 a theme; nahrazuje původní rainbow barvy.</p>
      <p>Nová 2D značka je návrh k vizuální revizi. Schválená identita 3D masteru V3 je zachovaná níže.</p>
      <nav className="ds-animated-brand__sources" aria-label="Zdroje reference">
        <a href={originalHtml} download="uiverse-original.html.txt">Původní HTML</a>
        <a href={originalCss} download="uiverse-original.css.txt">Původní CSS</a>
        <a href={notice} download="axolotl-mark-provenance.md">Původ a rozsah adaptace</a>
        <a href={license} download="uiverse-collection-LICENSE.txt">MIT licence kolekce Uiverse</a>
      </nav>
    </section>
    <MascotIdentity />
  </>;
}
