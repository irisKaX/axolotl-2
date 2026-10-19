# Visual Unification · Navigation & Tabs

Pracovní větev `experiment/ds-library-v1-1`, pouze existující izolované preview Library V1.1. Referenční revize před změnou: **abfc1524c9b256a3f689cc6d9c5bbb53b496fc93**. Tento commit uchovává původní Lens 02, všechny materiálové experimenty a Halo 2.0; lze z něj obnovit konkrétní soubory bez rollbacku main/produkce.

## Ověřený vizuální základ

Analyzováno `Navigation.tsx`, selektory `.ds-tabs`, `.ds-segmented`, `.ds-disclosure`, `.ds-pagination` a základní `.axo-ds-scope` v `library.css`. Před úpravami zafixovány skutečné computed styles a screenshoty všech čtyř typů v dark/light, default/hover/focus; selected je přítomen v Tabs, Segmented a Pagination. Výsledek srovnání je `evidence/navigation-reference.json`.

| Role | Dark | Light |
| --- | --- | --- |
| Povrch | `#292630` | `#FAF9FC` |
| Zvýšený povrch | `#34303D` | `#FFFFFF` |
| Vnořený kontext | `#201E26` | `#EEEAF3` |
| Text / sekundární | `#F4F1F8` / `#C1B9CC` | `#29232F` / `#61566E` |
| Obrys / silnější kontrolní hrana | `#625B70` / `#8D829F` | `#BDB4CA` / `#85778E` |
| Neutrální hover | `#3C3746` | `#E7E0ED` |
| Aktivní / vybraný stav | `#7C3AED` + bílý text | stejné |
| Focus | `#C2A2FF` | `#6C28D6` |

Reference používá 44px ovládací plochy, rádiusy 8–12 px, 2px focus ring a rozestupy 4/8/12/16/24 px. Z toho vznikají malé scoped aliasy v `unified.css`, nikoli nová paleta. O2 Blue zůstává dostupné `#0050FF`; sémantické success/warning/error tokeny se nemění. Ovládací prvky mají radius 9 px, větší kontejnery 12 px. Hover zůstává neutrální; primární fialová akce při hoveru zvýrazňuje hranu. Pressed má mělký inset, bez skoku ikony či náklonu.

## Izolace a kompatibilita

`DesignSystemProvider` má volitelné `appearance="original" | "unified"`. Výchozí kontext mimo katalog zůstává **original**. Vnořené providery režim dědí, takže Colors & Gradients a portály používají správné lokální téma. `Library` zapíná unified pro běžné stránky; **Navigation & Tabs explicitně zachovává original**, včetně karet, tlačítek Pagination a ovladačů na referenční stránce. Není to nová nabízená materiálová varianta, ale ochrana referenčního vzhledu a výchozích exportů.

`Navigation.tsx`, `NavigationPage.tsx` a původní `library.css` se nemění. Button.tsx, Button.css a originální vendor Star Border se nemění. Adaptér StarBorderMotion místo pevného radius 100 čte skutečný computed radius tlačítka; obíhající stopy tak kopírují 9px obrys v katalogu i původní kapsli mimo něj. Barva, duration, disabled/loading a reduced motion zůstávají funkční.

Produkční Header, Dashboard, Tools, Workspace, extension, app providery, dependency manifesty a hodnoty barev/gradientů zůstávají nedotčené. CSS změny jsou pod `.axo-ds-scope[data-design="unified"]`. Původní reference Navigation má shodné pixelové snímky i vypočtené styly.

## Komponenty a odstraněné experimenty

- **Button:** stejných pět variant a tři velikosti, nativní semantics, keyboard/focus, disabled/loading, clean icon; fialový Primary, neutrální Secondary/Ghost/Icon, sémantický Destructive. Star Border je stále opt-in, žádná další rodina tlačítek. Explicitní theme prop zůstává podporováno.
- **Forms:** stejných sedm exportů, společné rádiusy, hrany, stavy a lokální téma Select portálu. Funkční validace, labely, focus a keyboard se nemění.
- **Cards:** jediný aktivní směr Halo Soft. Jemné statické světlo hrany, mělký stín, jednotný povrch. Flat/raised jsou dvě úrovně oddělení obsahu téhož materiálu; outline-test je nadále skrytý technický test.
- **Overlays:** jednotné 12px kontejnery a typografie, zachované portály, focus trap, Escape ownership a návrat focusu.
- **Feedback:** společný materiál a proporce; success/warning/error zachovávají významové barvy. Progress používá stejný fialový akcent.
- **Colors:** všech 14 záznamů registru včetně osmi gradientů zůstává přesně stejné. Klikací HEX/CSS kopíruje původní registry hodnoty, live paint má přednost před běžným povrchem ukázkového exportu.

Před odstraněním ověřeny importy a použití: `surfaceFamilies`, `halo`, experimentální `family`/`halo` props, HaloShowcase a SurfaceStudio nemají konzumenty mimo knihovnu a její katalog/testy. Odstraněn jejich controller, CSS, registry volby a historické srovnávače. Tyto **experimentální konfigurační props již nejsou součástí aktivního API**. Stabilní API výchozích Card/Panel/InteractiveCard/StateCard a obsahové/action sloty ToolCard/WidgetCard zůstávají, včetně loading, density, material a všech pěti stavů. Žádná produkční migrace není vyžadována.

Registry nadále propojují skutečné exporty, varianty, category loadery, Návrh/Schváleno a samostatné produkční použití. Upravený Button i upravený Halo Soft jsou **Návrh**; schválený směr není automatické schválení konkrétní implementace. Karty mají 7 běžných provedení napříč 6 exporty, s outline fixture 8; žádné historické volby či falešné počty.

## Přehled a ověření

Na hlavním přehledu je **Jeden systém. Dva kontexty.** — všech sedm kategorií se skutečnými React komponentami vedle sebe v dark/light. Formuláře, výběr karty, tlačítka, dialogy, popovery a záložky jsou funkční. Motivy jsou lokální a nepřepisují app preferences. Nejde o další katalog ani obrazové kopie.

Kontroly: TypeScript, **87 unit testů ve 20 souborech**, build, celá browser sada, axe, light/dark, 1366×768, 390/320 px, 200% text, portály, keyboard, reduced motion, Star Border, přesné kopírování 14 barev/gradientů, test-mode toggle, registry, deep links a Back/Forward. Nové testy ověřují scoped opt-in, dědění do vnořeného provideru a korektní evidenci variant. Pointer/tilt testy byly odstraněny společně s odstraněným enginem.

Screenshoty nově sjednocených stránek se záměrně liší od předchozí verze. Release gate vyžaduje shodu pouze u nezměněné Navigation & Tabs: 4 typy × 2 témata. `evidence/unified-system-dark-light.png` je společný přehled; `unified-system-mobile.png` mobilní přehled. Úplné výsledky jsou v CI a `evidence/verification.json`.

Automatizované mobilní ověření je Chromium touch emulace, nikoli ruční kontrola fyzického iPhonu/Safari. Finální estetické schválení zůstává na uživatelce. Žádný merge do main ani produkční deploy.

## Ochrana veřejných preview

Publikace vychází z posledního úspěšného kompletního Pages artefaktu a mění výhradně `ds-library-v1-1/`. Před sestavením i před deployem se ověřuje aktuální publikace, aby starší artefakt nemohl přepsat novější prototyp. Všechny ostatní soubory musí mít shodný SHA-256. Předchozí Lens 02, Aperture, Dark Veil i ostatní preview zůstávají zachované. Historie předchozího pracovního V1.1 je v Git revizi uvedené nahoře.
