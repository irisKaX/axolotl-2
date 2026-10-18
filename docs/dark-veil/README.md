# Axolotl Dark Veil Background Lab

Izolovaný experiment. Produkční entrypoint, header, katalog, package.json a lockfile zůstávají beze změny. Lab přímo importuje produkční AppHeader a jeho providery; preference mají vlastní storage prefix. Ukázkové karty nevolají skutečné nástroje ani síťová API. Navigace headeru zůstává vizuálně i komponentově původní; v labu pouze oznámí vybranou sekci.

## Původ a licence

Originální TypeScript/CSS komponenta React Bits, beze změny:
https://github.com/DavidHDev/react-bits/tree/c2a1408d9219a5bd7a2d9c93c9c499042f5fa34a/src/ts-default/Backgrounds/DarkVeil

- `DarkVeil.tsx` SHA-256: `bf19e096ea23be65c90d36853e77759de846457926e4fdeb96b7be810afcd59c`
- `DarkVeil.css` SHA-256: `222eb48619680a858be5b6553d451a7630cd12b65e98bc24a025fc367df6d769`
- Licence: MIT + Commons Clause; plné znění ve vendor/LICENSE.md a v publikovaném LICENSE-DarkVeil.txt. Jde o vložený efekt v aplikaci, nikoli prodej samotné komponenty.
- Tato připnutá verze používá React a přímo WebGL2; nevyžaduje OGL ani další npm závislost.

## Ovládání

Skutečné props: color, speed, brightness, glow, scale, rotation, flow, warp, variation, sheen, grain, fade, opacity, quality, paused a lightMode. Barevný režim lze měnit i původním headerem. Interakce shaderu s myší je vypnutá; pozadí má pointer-events:none a leží pod aplikační vrstvou. Demo umožňuje psaní, checkboxy a změnu pořadí karet šipkami; na desktopu také HTML drag & drop.

## Výkon a fallback

DPR je omezen na 1, výchozí quality je 0.5, uživatelský rozsah 0.25–0.75. Vyšší hodnoty zvyšují náklady GPU. Původní komponenta vykresluje dva průchody. Výsledky softwarového GPU v results.json nejsou benchmark fyzického notebooku ani iPhonu. Doporučení k produkčnímu použití vyžaduje následné měření na cílovém hardware včetně zahřívání a spotřeby.

OS reduced motion, preference omezeného pohybu, ruční statický režim a nedostupný/ztracený WebGL kontext odpojí canvas a zobrazí statický CSS fallback. Ten je výslovně označený a není vydáván za původní shader. Reset umožňuje po ztrátě kontextu opakovat inicializaci. Pause zastaví čas shaderu; pro úplné odstranění WebGL práce použijte statický režim.

Světlý režim používá přímo původní lightMode; není přidána další designová varianta. V obou režimech jsou karty dostatečně krycí pro stabilní čitelnost.

## Známé kompromisy

- Původní shader při změně rozměrů opakovaně alokuje immutable texture. Obal ponechává pevným vnitřním rozměrům starou velikost a po debounce vytvoří novou instanci. Změna viewportu nebo quality proto restartuje fázi animace. Zdroj React Bits se nemění.
- StrictMode effect replay není v experimentálním rootu zapnutý: původní cleanup ztrácí WebGL kontext. Produkční root se nemění.
- iPhone/Safari ani fyzický Mac nejsou automatizovaným Chromium testem ověřeny. Mobilní test simuluje viewport, touch a DPR.
- Nastavení efektu a demo data jsou pouze pro aktuální otevření. Preference headeru se ukládají odděleně od produkce.
- Lab neověřuje skutečnou browser extension ani funkčnost produkčních nástrojů.

## Reprodukce kontrol

```sh
npm ci
npx tsc --noEmit
npx vitest run src/app/header/Header.test.tsx
node src/experiments/dark-veil/build.mjs
npx vite preview --config src/experiments/dark-veil/vite.config.ts --host 127.0.0.1 --port 4191
# Druhý terminál:
npx playwright install chromium
node src/experiments/dark-veil/check-browser.mjs
```

`results.json` a screenshots/ obsahují skutečný výsledek běhu. Kontroly zahrnují dark/light, notebook 1366×768, mobil 390×844, šířky 320/768/1366, popupy, vnořený Radix Select a Escape, axe, API uniformy, ovládání karet, pointer transparency, reduced motion, statický režim, ztrátu kontextu a nedostupné WebGL2. Automatický axe test nenahrazuje úplný accessibility audit.
