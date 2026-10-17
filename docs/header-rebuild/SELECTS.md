# Selecty Nastavení v izolovaném preview

[Veřejné preview](https://iriskax.github.io/axolotl-preview/header-rebuild/) · [12 screenshotů](https://iriskax.github.io/axolotl-preview/header-rebuild/evidence/#settings-selects)

## Rozsah

Pouze Barevný režim, Velikost textu a Animace. Jeden lokální komponent `Choice` v `SettingsPanel.tsx` používá již nainstalovaný Radix Select 2.3.8. Bez nové závislosti, změny úložiště, nové vizuální varianty nebo zásahu do produkčního headeru.

- Zavřený ovladač zachovává původní materiál, 16px zaoblení a typografii. Portál přebírá aktuální téma a velikost textu.
- Povrch nabídky, okraj, stín, hover, výběr a focus používají společné tokeny headeru. Hover nevybrané položky je neutrální; vybraná položka má `#7c3aed` a check i při hoveru. Focus má 2px obrys z tokenu tématu. Ovladač jej dostává při každém fokusu, včetně návratu z portálu ve Firefoxu; není závislý pouze na heuristice `:focus-visible`.
- Řádky mají alespoň 44 px. Šířka vychází z ovladače, umístění a omezená výška respektují prostor pod celým headerem. Obsah může scrollovat.
- Radix zajišťuje role combobox/listbox/option, popisky, šipky, Home/End, Enter/Space, vyhledání psaním a návrat fokusu. První Escape zavře select, druhý Nastavení.
- `Popover.tsx` má pouze nutnou ochranu před zavřením rodiče událostí z vnořeného portálu. Ostatní popupy zachovávají stávající chování.
- Ukládání a hlášení výsledku používají původní PreferencesProvider. Nové volby nemají animaci; reduced motion funguje beze změny.

## Ověření

Reprodukovatelné příkazy: `npm test`, `npm run build:header`, `npm run test:header:browser`, `npm run build`. Devět nových scénářů doplňuje 25 původních scénářů headeru pro každý prohlížeč.

Testy pokrývají dark/light, desktop 1440 px a mobil 390 px, krátký viewport 390 × 400, úzký 320 × 400 se zvětšeným textem, všechny tři otevřené selecty, myš, touch, klávesnici, typeahead, návrat fokusu, postupné Escape, kliknutí ven, obnovení uložených preferencí, vrstvení, stabilitu dokumentu při otevření a uvolnění scroll/pointer locku po zavření. Automatický axe audit ověřuje otevřené nabídky podle WCAG A/AA. Původní sada dále kontroluje ostatní popupy, navigaci C2, URL a nástroje.

Screenshoty v `select-screenshots/` mají fixovaný čas a pocházejí z Chromium. Reference C2/B zůstávají nedotčené. Veřejný smoke test ověřuje připnutý commit, otevření všech tří vlastních selectů v obou tématech, fialový výběr, Escape/focus, ostatní popupy a dostupnost původních experimentů.

Finální ověření:

| Kontrola | Výsledek |
| --- | --- |
| Unit testy | 56/56 |
| Chromium, WebKit, Firefox | **102/102** (34 v každém prohlížeči) |
| Opakované klávesnicové scénáře | 20/20 lokálně |
| Build izolovaného headeru a běžný build | Úspěšné |
| Produkční `dist` proti main základu `86e0ff3` | Souborově identický (`diff -qr` bez rozdílů) |
| Veřejný smoke | Úspěšný, bez JavaScriptových chyb |

- [Kompletní CI, 102/102](https://github.com/irisKaX/axolotl-2/actions/runs/39079369412), [textový výsledek](results/selects-ci.txt).
- [Veřejný smoke](https://github.com/irisKaX/axolotl-2/actions/runs/39078865552), [ověřený commit a kontroly](results/selects-public-smoke.json).
- Preview je připnuté na `be2527ca9da9ab56e9fb30c252127a8796e08289`. Poslední CI používá `c3f9f5e7486697332ee9bb4b5798dab95bf36c53`, který mění pouze testové čekání na asynchronní přesun fokusu Radix a evidenci; jeho produktový kód je identický s preview.
- CI ověřilo opravu focus ringu ve Firefoxu. Klávesnicové testy před potvrzením čekají na skutečné zaměření položky; nepoužívají pevné časové prodlevy.


## Kompromisy a omezení

Vlastní nabídka nahrazuje systémový picker také na iPhonu. Otevřený Radix Select dočasně uzamkne scroll pozadí a drží fokus v nabídce; zavření obnoví ovladač a uvolní zámky. Toto chování se týká pouze otevřeného selectu. Zůstává povolen pinch zoom (`allowPinchZoom` v Radix).

WebKit a dotykové testy jsou automatizovaná emulace, nikoli test na fyzickém iPhonu nebo Macu se Safari/VoiceOver. Ruční ověření na těchto zařízeních není součástí doložených výsledků.

## Izolace a návrat

Větev `feat/header-rebuild-isolated`; produkční entrypoint a main beze změny. Preview repo zachovává původní Header Labs na připnutém commitu. Návrat pouze preview: vrátit oba odkazy zdrojového SHA v jeho workflow na `d1483a194fadb0959d9ed20dea83355e6ae15a7b` a znovu spustit jeho Pages build. Produkční nasazení není potřeba.
