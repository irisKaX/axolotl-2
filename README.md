# Axolotl 2.0

Pracovní prostor pro webové nástroje. React + TypeScript + Vite + Tailwind CSS; statický build na GitHub Pages.

- Aplikace: https://iriskax.github.io/axolotl-2/#dashboard
- Vzorník: https://iriskax.github.io/axolotl-2/#design-system (také Nastavení → O aplikaci)
- Plán: [dashboard](docs/superpowers/plans/2026-10-15-dashboard.md)

## Lokální vývoj

Node.js 24 LTS, npm. Verze závislostí jsou uzamčené v `package-lock.json`.

```sh
npm ci
npm run dev
```

Otevři `http://localhost:5173/axolotl-2/app.html`. Zdrojovým vstupem je `app.html`; `index.html` v kořeni je publikovaný výstup, neupravuje se ručně.

```sh
npm test
npm run test:legacy
npm run typecheck
npm run publish:prepare
```

`publish:prepare` sestaví `dist/` a zkopíruje build do kořene pro stávající branch-based GitHub Pages. Commituj zdroje i aktualizovaný `index.html` a `assets/app-*.{js,css}`. Workflow znovu spustí testy, build, ověří shodu publikovaných souborů a nasadí `dist`. Tím zůstávají obě publikační cesty shodné. Přepnutí nastavení Pages na GitHub Actions není pro tuto migraci nutné; po něm lze odstranit generovaný kořen i kontrolu `publish:check`.

## Struktura

- `src/app/` — hlavička, nabídky, poskytovatelé nastavení/URL, efekt kurzoru.
- `src/lib/` — samostatně testovaná logika nastavení a komunikace s rozšířením.
- `src/components/` — sdílená karta a UI prvky (Radix/komponentový styl shadcn).
- `src/pages/DesignSystem.tsx` — ukázky Metadata S/M/L, QR S/M/L, Rychlé akce S/M a stavy komponent.
- `src/styles/` — zachované styly aplikace a nové sémantické tokeny.
- `browser-extension/` — současné rozšíření, bez změny oprávnění či protokolu.
- `public/downloads/` — ZIP rozšíření přidávaný do buildu.
- `assets/preferences.js` a `tests/preferences.test.cjs` — historická implementace pro regresní srovnání; produkční React ji nespouští.

Vzhled používá původní klíče `axolotl-2-theme`, `axolotl-2-motion`, `axolotl-2-text-size`, `axolotl-2-cursor-effects`. Ruční URL zůstává v `sessionStorage` pod `axolotl-2-target-url`. Zachované veřejné události: `axolotl:preferences-change`, `axolotl:url-change`, `axolotl:browser-connection-change` a `axolotl:browser-refresh`.

Vzorník je návrh k posouzení. Metadata jsou záměrně ukázková; QR se zatím negeneruje. Office zůstává prázdný. Editor sestavy, kontrola indexace a přenos skutečných nástrojů patří do dalších etap.

Předchozí nasazený statický základ pro případ návratu: `0f94f61219f25ef9098f0e066d73846cfd89209f`.
