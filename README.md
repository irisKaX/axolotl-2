# Axolotl 2.0

Pracovní prostor pro webové nástroje. React + TypeScript + Vite + Tailwind CSS; statický build na GitHub Pages.

- Aplikace: https://iriskax.github.io/axolotl-2/#dashboard
- Jediný katalog: https://iriskax.github.io/axolotl-preview/ds-library-v1-1/#design-system
- Plán: [dashboard](docs/superpowers/plans/2026-10-15-dashboard.md)

## Lokální vývoj

Node.js 24 LTS, npm. Verze závislostí jsou uzamčené v `package-lock.json`.

```sh
npm ci
npm run dev
```

Otevři `http://localhost:5173/axolotl-2/app.html`. Zdrojovým vstupem je `app.html`; výstup `dist/index.html` vytváří build.

```sh
npm test
npm run test:legacy
npm run typecheck
npm run build
```

Build publikuje pouze výstup `dist/`; staré kopírování do kořene bylo vyřazeno.
Library se sestavuje `node scripts/ds-library/build.mjs` z čistého připnutého commitu.
Oba buildy po Vite zabalí a ověří aktuální extension ZIP. Preview publisher patří
repozitáři axolotl-preview, větvi `design-system/header-final-polish`.
Lokální konsolidace není povolením merge, nasazení ani změny Pages oprávnění.


## Struktura

- `src/app/` — hlavička, nabídky, poskytovatelé nastavení/URL, efekt kurzoru.
- `src/lib/` — samostatně testovaná logika nastavení a komunikace s rozšířením.
- `src/components/` — sdílená karta a UI prvky (Radix/komponentový styl shadcn).
- `src/pages/DesignSystem.tsx` — kompatibilní přesměrování; jediný bootstrap katalogu je `library.html`.
- `src/styles/` — zachované styly aplikace a nové sémantické tokeny.
- `src/tools/` — host, webový transport a deset původních nástrojů z O2 Axolotl 2.4.22.
- `src/styles/tools/` — rozhraní nástrojů omezené na vlastní kontejner, propojené se současnými tokeny.
- `browser-extension/` — rozšíření 1.1.0 se sběrem obsahu, snímáním a stahováním. Zachovává původní protokol seznamu karet.
- `dist/downloads/` — deterministický ZIP rozšíření vygenerovaný z `browser-extension/`.
- `assets/preferences.js` a `tests/preferences.test.cjs` — historická implementace pro regresní srovnání; produkční React ji nespouští.

Vzhled používá původní klíče `axolotl-2-theme`, `axolotl-2-motion`, `axolotl-2-text-size`, `axolotl-2-cursor-effects`. Ruční URL zůstává v `sessionStorage` pod `axolotl-2-target-url`. Zachované veřejné události: `axolotl:preferences-change`, `axolotl:url-change`, `axolotl:browser-connection-change` a `axolotl:browser-refresh`.

## Skutečné nástroje

Menu Média a Kontrola otevírá všech deset skutečných nástrojů. QR a WebP konvertor fungují lokálně bez rozšíření; ostatní nástroje potřebují aktualizované propojení s prohlížečem a vybranou otevřenou kartu ve stejném okně. Ručně zadaná URL se dá použít pro QR. Pro kontrolu stránky vyber otevřenou kartu nebo URL odpovídající otevřené kartě.

Nainstaluj ZIP z Nastavení → Propojení s prohlížečem; při aktualizaci nahraď původní soubory rozšíření, obnov je ve správě rozšíření a obnov aplikaci. Podrobný návod a oprávnění jsou v `browser-extension/README.md`. Rozšíření nepředává obsahy na aplikační server; kontroly a exporty běží v prohlížeči. Celowebové hledání načítá stránky daného webu.

Výsledky se zachovávají při přepínání nástroje. Změna nebo obnovení cílové stránky zneplatní výsledky kontrol. Webové exporty ohlašují předání souboru ke stažení; prohlížeč webu nesděluje jeho konečné uložení. PDF stahování přes rozšíření čeká na potvrzené dokončení.

Vzorník `#design-system` zůstává demonstrací komponent s ukázkovými daty. Dashboard a office zůstávají prázdné; editor sestavy, indikátor indexace v headeru a osobní workspace patří do dalších etap.

`npm run test:tools` spustí přenesené testy modelů, kontrolérů a bridge. `npm run build` vždy zabalí aktuální zdroje rozšíření do reprodukovatelného ZIPu. Všechny runtime knihovny a WASM jsou součástí sestavení a nevyžadují CDN.

Předchozí nasazený statický základ pro případ návratu: `0f94f61219f25ef9098f0e066d73846cfd89209f`.
