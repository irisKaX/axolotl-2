# TweakCN · Library V1.1

Jediný katalog: https://iriskax.github.io/axolotl-preview/ds-library-v1-1/#design-system

- Kanonické hodnoty: `src/design-system/tokens/tweakcn.export.css`, přesná příloha uživatelky včetně OKLCH, obou témat, fontů, radius, spacing a stínů. `theme.ts` čte tento export; neduplikuje jeho hodnoty. Tailwind direktivy a samoodkazující compiler aliasy se nepřenášejí jako globální CSS.
- `src/design-system/theme/` mapuje sémantické role na skutečné stávající komponenty. Aktivuje se pouze v `library.html`. Původní produkční tokeny a implementace Headeru se nemění. Pozůstalé `--ds-*`, `--axo-*`, `--pn-*` a `--pg-*` jsou v katalogu adaptéry jednoho theme, nikoli nové palety.
- Header a katalog používají společné Preferences. Vnořené ukázky Themes zachovávají vlastní light/dark pro srovnání včetně portálů. Bento oblasti, umístění Office, šest widgetů, dropdown/hover/focus logika a Star Border zůstávají.
- Brandové O2 Blue, Axolotl Violet, osm gradientů a Mascot V3 jsou zachované samostatně. Chart 1–5 jsou přesné datové role exportu; nepoužívají se jako náhradní success/warning paleta.
- Montserrat a Fira Code se načítají z lokálních WOFF2 (Latin + Latin Extended), zdroj Fontsource 5.3.0, licence SIL OFL 1.1 uložené u fontů. Georgia je podle rozhodnutí uživatelky pouze systémový font. Foundations ukazuje její skutečnou dostupnost; webfont bez licence se nešíří.
- Export nemá success/warning barvy. Dosavadní význam zachovávají text a ikony; text používá foreground. Chyby používají destructive. Vybrané barevné páry se kvůli kontrastu automaticky nemění; export sám nezaručuje WCAG AA.

Kontrola: `node scripts/ds-library/build.mjs`, registry test a `node scripts/ds-library/check-theme.mjs` proti Vite preview na 4185. Skript ověřuje přesné hodnoty obou témat, skutečně načtené fonty, všechny rodiny, nativní Dashboard, Header/menu/focus/URL/mobil a Star Border. Kontrastní nálezy přesného exportu vypíše odděleně; ostatní chyby zůstávají blokující. Historický `compare-dashboard.mjs` ověřoval původní vzhled 523c983 a po výslovně zadané změně theme již není release gate.

Žádný merge do main, změna produkční aplikace, shadcn kopie ani nový katalog.
