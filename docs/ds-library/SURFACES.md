# Cards & Surfaces · tři pracovní rodiny

> Historický záznam před vizuálním sjednocením. Aktuální stav a API popisuje [VISUAL-UNIFICATION.md](VISUAL-UNIFICATION.md). Historické varianty nejsou aktivní součástí katalogu.

Izolované rozšíření Library V1.1. Všechny nové materiály jsou **Návrh**, produkční použití **false**. Schválení katalogu neznamená schválení jeho kandidátních materiálů.

## Rozdíly

- **Obsidian:** neutrální saténový gradient, radius 20 px, měkká hloubka; klidná obsahová plocha.
- **Halo:** chladný ambientní materiál, fialový odlesk, radius 28 px a vrstvené stíny; lift interaktivní karty 4 px.
- **Studio Outline:** přesný obrys, akcentovaná levá hrana, radius 8 px, odsazený pevný stín a členění titulku; drobný diagonální posun interaktivní karty.

Všechny rodiny mají vlastní light interpretaci. Hover je neutrální, vybraný stav má fialový outline. Statické obsahové karty neposkakují. Žádné běžící dekorativní animace, žádný backdrop blur, nové závislosti ani obrázkové materiály.

## Skutečné exporty

`src/design-system/library/Surfaces.tsx`: Card, InteractiveCard, ToolCard, WidgetCard, Panel, StateCard. Existující Card/Panel/InteractiveCard/StateCard mají nové volitelné `family?: SurfaceFamily`. Vynechání vlastnosti zachovává dosavadní provedení. Materiál flat/raised a testovací outline-test zůstávají dostupné. Lens 02 ani jeho CSS se nemění.

- Card: title, children, footer, material, density, family.
- InteractiveCard: title, description, family, loading a nativní button props. `aria-pressed` řídí konzument. Loading blokuje kliknutí/Enter/Space, zachová focus a oznamuje aria-busy/aria-disabled. Disabled používá nativní disabled. Dovnitř nevkládat další ovládací prvky.
- ToolCard: title, description, metadata, action, family. Celý obsah není button; akce je samostatná.
- WidgetCard: title, children, actions, footer, family. Slot pro sekundární akce. Neobsahuje dashboard, persistence ani drag & drop engine.
- Panel: skutečný adaptér ToolPanel, HTML section props, family.
- StateCard: empty/loading/error/warning/success, action, family. Skládá skutečné EmptyState/Loading/Alert.

Použít uvnitř DesignSystemProvider. `surfaceFamilies.ts` eviduje ID a popis; registr katalogu z něj vytváří varianty pro všech šest exportů. Stav schválení a produkčního použití jsou stále oddělená pole variant v existujícím modelu. Přidání rodiny znamená nový záznam + opt-in CSS materiál, nikoliv kopii stránky.

## Katalog a interakce

Stejná stránka `?catalog=library&section=surfaces#design-system`; původní playground zůstává. Nová sekce přepíná jednu rodinu / všechny tři, disabled/loading akcí a pět obsahových stavů. Porovnání používá stejný obsah a sdílený výběr, počítadlo obnovy a uloženou poznámku. Otevření ukázky nástroje a vyřešení obsahu jsou lokální jednotlivým vzorkům. Žádná akce nespouští produkční nástroj nebo síťový požadavek.

Desktop má srovnání v třech sloupcích se zarovnanými řádky (CSS subgrid). Pod 1100 px se rodiny řadí pod sebe, pod 600 px je i sada typů jednosloupcová. Bez pevných výšek karet, aby rostly s obsahem. Téma používá existující horní přepínač; URL router/testovací přepínač se nemění.

## Ověření a limity

`Surfaces.test.tsx` ověřuje zachování výchozích povrchů, opt-in family, keyboard/loading/disabled, nezávislé akce, všech pět stavů a úplnost registrace skutečných exportů.

`check-surfaces.mjs` ověřuje 3 × 6 vzorků, dark/light × 5 stavů přes axe, skutečné akce, focus-visible, Enter/Space, reduced motion, dotykové viewporty 390/320 px, zvětšení textu 200 % a přímé odkazy/historii/reload. Původní testy katalogu včetně Colors a testovacího přepínače zůstávají. Srovnání proti V1 kontroluje deset nezměněných playgroundů (pět sekcí × dvě témata); záměrně rozšířenou stránku Surfaces pokrývají nové testy a screenshoty.

Chromium emulace není fyzický iPhone/Safari ani audit se čtečkou obrazovky. Automatický axe nenahrazuje kompletní manuální audit. Materiály jsou kandidáti pro uživatelský výběr, nikoliv nové globální foundations.
