# Jediný katalog · Design System Library V1.1

> Aktuální vzhled: [TweakCN integrace](TWEAKCN.md). Níže je zachovaná dokumentace architektonické konsolidace V2; původní vizuální hodnoty 523c983 byly následně nahrazené uživatelkou dodaným theme.

https://iriskax.github.io/axolotl-preview/ds-library-v1-1/#design-system

Pracovní větev lokálního Core Cleanup: `clean-foundation/milestone-a`. Budoucí vizuální změny vznikají v této Library; další katalogy se nezakládají.

## Kanonické zdroje

- Header: původní `src/app/header/AppHeader.tsx`, přímo použitý přes `ApprovedDashboard`. Produkční implementace se nemění. Přesný finální Header patch z preview byl převzat do zdroje. Header nyní vlastní svůj scoped vzhled v `src/app/header/header.module.css`; dashboard/header.css vlastní pouze backdrop kompozice.
- Dashboard: `src/design-system/dashboard/BentoDashboard.tsx`, `WidgetSurface.tsx` a `ApprovedDashboard.tsx`. Office je placeholder, šest povrchů přijímá samostatný obsah. Žádné napojení na Tools, iframe ani druhý zkompilovaný Header.
- Tokeny: `src/design-system/tokens/`. Přesunuté původní palety a Library CSS tokeny zachovávají hodnoty; starý import palety je pouze re-export. Dashboard používá stejnou paletu. Foundations čte efektivní TweakCN theme a jeho kontrastní korekce; nejde o úplnou inventuru všech produkčních CSS tokenů. Otevřená rozhodnutí jsou Návrh, nikoli nově schválené hodnoty.
- Registr: `src/pages/design-system/library/registry.tsx`; 11 kategorií, skutečné exporty a zdrojové soubory, varianty, vlastnosti a oddělené stavy Návrh / Schváleno / Produkčně použito.
- Původní Button, React Bits Star Border a ostatní funkční komponenty zůstávají. Brand & Mascot používá identitu V3 z knowledge `316927f`; chybějící master obrázek není nahrazený. Inspiration Library zůstává soukromá a beze změn.

## Historické zdroje

Samostatné HTML/CSS/JS Playgroundu a zkompilovaná kopie Headeru byly odstraněny z buildu Library až po porovnání vzhledu. Git historie a hashe regresní reference zůstávají v `consolidation-source.json`. Pro opakování reference použij `git archive 523c983 creative-concepts` v repozitáři axolotl-preview a spusť statický server na portu 4191.

Preview repo sestavuje pouze tuto Library a přesměrování historických rout. Modular Playground vede přímo na `?section=dashboard#design-system`. Historické Labs, Layout Studios, Immersive a Spatial nejsou součástí aktivního katalogu. Prototype a component-catalog mají připravené vlastní konsolidační větve. Produkční `axolotl-2/#design-system` se nemění: jeho živé přesměrování by vyžadovalo produkční zásah, který tento úkol nepovoluje.

## Build a cílená kontrola

```sh
npm ci
node scripts/ds-library/build.mjs
npx vitest run src/pages/design-system/library/Registry.test.tsx
npm run preview -- --host 127.0.0.1 --port 4185 --base /axolotl-preview/ds-library-v1-1/
# V druhém terminálu:
node scripts/ds-library/check-consolidation.mjs
node scripts/ds-library/check-header.mjs
# Přísná publikační kontrola: scripts/visual-baseline/ci.sh
```

Build používá `library.html`, nikoli produkční App. Výstup `dist/` obsahuje provenance s commitem a hashi zdrojů. Kontroly pokrývají Header, focus/Escape, URL, dark/light, sticky, mobil, widgety, Border Beam, Star Border, reduced motion a automatický axe audit katalogu/Dashboardu. Vizuální porovnání kontroluje geometrii a materiály v obou tématech na desktopu a mobilu, s tolerancí 0,25 px pro subpixelový scroll. Ruční screen-reader audit ani fyzický Safari nejsou součástí této cílené kontroly.

V2 zadání výslovně povoluje nasazení experimentální Library. Workflow v axolotl-preview publikuje připnutý zdrojový commit pouze do jeho GitHub Pages. Produkční main, aplikace, sdílené runtime funkce a nástroje zůstávají beze změn; žádný merge není součástí práce.

## Core Cleanup · aktuální lokální stav

- Jediný bootstrap: library.html → entry.tsx → Library → registry.tsx (11 kategorií).
  Staré app katalogové query směrují do existující veřejné Library. Main nebyl změněn.
- Shared Field/Checkbox, Panel/Status vlastní Forms.tsx, Surfaces.tsx, Feedback.tsx;
  původní tool importy pouze reexportují. Native Button renderer vlastní Button.tsx;
  legacy class hooks a CVA Slot/asChild mají zachované kontrakty. Nejde o přethemení tools.
- Button.css vlastní original i unified stavy. Header module vlastní scoped Header
  deklarace. Tool CSS vlastní jednotlivé existující tool soubory; žádný nový override.
- 14 kanonických extension helperů/kolektorů zůstává na distribuovaných cestách;
  testy a web runtime používají tentýž zdroj. Browser startup se do webu neimportuje.
- Raw export, korekce, Montserrat/Fira Code, brand paints, osm gradientů, V3 paleta,
  AnimatedAxolotlLogo a Star Border zůstávají. Georgia je systémový font.
- `--ds-blue → --accent`, `--ds-violet → --primary`, `--pg-o2-blue → --primary`,
  `--pg-axolotl-violet → --ring` jsou zachované kompatibilní sémantické názvy,
  nikoli brandové barvy. Vyhodnocují se v původním lokálním theme scope.
  Pevné brand barvy vlastní paints.ts, maskota mascot.ts; semantic hodnoty theme.ts.
  Header interaction výjimka zachovává light primary/ring v obou režimech;
  `--header-status-*` poskytují samostatný SEO kontrakt i mimo LibraryTheme.
- Baseline zůstává candidate, schválení nebylo uděleno. Přísný gate zůstává aktivní.
  CSS Module názvy se po přesunu vlastníka mění; diagnostická klasifikace není
  výjimkou z gate ani povolením aktualizace reference.
- Historické zdroje a odstraněné artefakty obnoví SHA v cleanup-deletions.json.
  Lens 02 fixture, testované assets/preferences.js, licence, WASM a qrcodegen zůstávají.

Historické odstavce výše popisují původní V2 integraci. Tento lokální krok nic
nepublikuje; další release a vzdálená Pages oprávnění vyžadují samostatné schválení.
