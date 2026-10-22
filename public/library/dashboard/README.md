# Schválený Header a Dashboard · Library V1.1

Kanonický zdroj převzatý z `irisKaX/axolotl-preview` revize `523c983`.
Vzhled, bento, Office placeholder, widgety, fonty a CSS jsou zachované. `index.html` je interní izolovaný náhled v hlavní Library, nikoli samostatný katalog. Přímé otevření přesměruje do Library.

Header je připnutý k produkčnímu zdroji `02a2ff32b8da590d0d7232c063a43d62bc736e7d` s původní lokální úpravou `header-ui-polish.patch`. Jeho zdroj se neduplikuje. Obnovení bundle: `node scripts/build-library-header.mjs` z kořene axolotl-2. Skript načte připnutý zdroj z Git historie do dočasného adresáře a nemění produkční komponenty.

`playground.js`, `evolution.css`, `refinement.css`, `final-bento.css`, `ui-polish.css`, bundle Headeru a `../shared/` zachovávají schválenou referenci. Pomocný `library-embed.js` řeší pouze umístění v katalogu a návrat z About. Ostatní pohledy původního adaptéru obsahují návrhová data; jsou tak označeny na stránce katalogu.

Původní licence jsou přiložené. Kontrolní součty před převzetím: `docs/ds-library/consolidation-source.json`.
