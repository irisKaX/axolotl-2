# Jediný katalog · Design System Library V1.1

> Aktuální vzhled: [TweakCN integrace](TWEAKCN.md). Níže je zachovaná dokumentace architektonické konsolidace V2; původní vizuální hodnoty 523c983 byly následně nahrazené uživatelkou dodaným theme.

https://iriskax.github.io/axolotl-preview/ds-library-v1-1/#design-system

Pracovní větev: `design-system/consolidate-v1-1`. Budoucí vizuální změny vznikají v této Library; další katalogy se nezakládají.

## Kanonické zdroje

- Header: původní `src/app/header/AppHeader.tsx`, přímo použitý přes `ApprovedDashboard`. Produkční implementace se nemění. Schválený vzhled z `axolotl-preview@523c983` aplikují scoped styly v `src/design-system/dashboard/header.css`; lokální focus adaptér vynechává skryté desktopové zavírací tlačítko.
- Dashboard: `src/design-system/dashboard/BentoDashboard.tsx`, `WidgetSurface.tsx` a `ApprovedDashboard.tsx`. Office je placeholder, šest povrchů přijímá samostatný obsah. Žádné napojení na Tools, iframe ani druhý zkompilovaný Header.
- Tokeny: `src/design-system/tokens/`. Přesunuté původní palety a Library CSS tokeny zachovávají hodnoty; starý import palety je pouze re-export. Dashboard používá stejnou paletu. Foundations čte skutečné definice, včetně nezměněných produkčních Header/Button tokenů. Otevřená rozhodnutí jsou Návrh, nikoli nově schválené hodnoty.
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
node scripts/ds-library/compare-dashboard.mjs
```

Build používá `library.html`, nikoli produkční App. Výstup `dist/` obsahuje provenance s commitem a hashi zdrojů. Kontroly pokrývají Header, focus/Escape, URL, dark/light, sticky, mobil, widgety, Border Beam, Star Border, reduced motion a automatický axe audit katalogu/Dashboardu. Vizuální porovnání kontroluje geometrii a materiály v obou tématech na desktopu a mobilu, s tolerancí 0,25 px pro subpixelový scroll. Ruční screen-reader audit ani fyzický Safari nejsou součástí této cílené kontroly.

V2 zadání výslovně povoluje nasazení experimentální Library. Workflow v axolotl-preview publikuje připnutý zdrojový commit pouze do jeho GitHub Pages. Produkční main, aplikace, sdílené runtime funkce a nástroje zůstávají beze změn; žádný merge není součástí práce.
