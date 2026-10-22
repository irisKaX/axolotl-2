import "./consolidation.css";

const palette = [
  ["Deep Night Indigo", "#0E0B35", "Tmavé prostředí"],
  ["Royal Violet Night", "#371265", "Vedlejší prostředí"],
  ["Plum Glow", "#853681", "Tmavý akcent"],
  ["Soft Skin Blush", "#E4B6D6", "Pokožka"],
  ["Neon Frill Pink", "#F7B5D5", "Světlá vlákna žaber"],
  ["Vibrant Frill Pink", "#DE79C2", "Výrazná růžová žaber"],
  ["Hoodie Lilac", "#B384CE", "Mikina"],
  ["Accent Lilac", "#A67CD7", "Odlesky látky"],
  ["Cargo Plum", "#63438F", "Kalhoty a stín látky"],
  ["Soft Off-White", "#F3ECF7", "Tenisky"],
];

export function MascotIdentity() {
  return <section aria-labelledby="mascot-identity">
    <h2 id="mascot-identity">Axolotl · Master V3</h2>
    <p><strong>Schváleno · 22. 10. 2026.</strong> Zvídavý, inteligentní a nápomocný pracovní parťák. Přátelský, klidně sebejistý, roztomilý bez infantilnosti. Průvodce onboardingem, prázdnými stavy a drobnými úspěchy.</p>
    <h3>Identita postavy</h3>
    <p>Soft-premium 3D, měkké textilie a jemný ambientní glow. Velká kulatá hlava, malé nozdry, subtilní úsměv, velké fialové lesklé oči a šest paprskovitých, jemně vláknitých růžovofialových žaber. Světlá pudrově růžová pokožka a viditelný růžový ocas.</p>
    <p>Master nosí světle levandulovou mikinu s malým tmavě fialovým logem O2, tmavší fialové cargo/jogger kalhoty a bílé tenisky. Přirozený postoj s rukama v kapsách. Indigo/fialové pozadí masteru není povinné pro každé použití.</p>
    <h3>Paleta maskota</h3>
    <p>Orientační vzorky ilustrace, nikoli přesné materiálové hodnoty. Slouží maskotovi, ilustracím a Office; nemění UI paletu O2 Blue <code>#0050FF</code> a Axolotl Violet <code>#7C3AED</code>.</p>
    <ul className="ds-mascot-palette">{palette.map(([name, hex, role]) => <li key={hex}>
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
export default MascotIdentity;
