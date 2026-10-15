# Axolotl dashboard – plán implementace

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Připravit jednotné komponenty, přizpůsobitelnou plochu bez scrollu na notebooku a pravdivý indikátor pravidel indexace.

**Architecture:** Doporučená migrace frontendu na React + TypeScript + Vite se statickým buildem pro současnou adresu GitHub Pages. Oddělit vzhled komponent, registr karet, rozložení a sběr dat URL; používat současný sdílený kontext URL. Office zůstává prázdná rezerva. Toto je návrh k posouzení, nikoli pokyn zahájit všechny etapy současně.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, vybrané komponenty shadcn/ui, dnd-kit + CSS Grid, Vitest pro novou čistou logiku. Zachovat localStorage, GitHub Pages a existující rozšíření prohlížeče. Verze ověřit při implementaci a uzamknout v package-lock.json. Toto je aktualizace plánu, aplikace zatím na React převedena není.

**Spec:** `docs/superpowers/specs/2026-10-15-dashboard-design.md`

## Global Constraints

- Office se nyní nevkládá; zůstává průhledná prázdná plocha bez rámečku, nadpisu a výplně.
- Hlavička, logo a prostor pro budoucí živý office zůstávají mimo editor karet.
- Cílem je obsahový viewport od 1366 × 650 CSS px při běžném přiblížení; kontrolní velikosti 1366 × 650, 1440 × 800 a 1920 × 900.
- Vlastní sémantické class/id zachovají prefix axolotl-; utility Tailwindu a identifikátory spravované knihovnami mohou používat jejich standardní konvence. Kořenové nabídky zachovají hover, jejich položky aktivaci kliknutím.
- Nové nástroje nebudou předstírat výsledky; jejich přenos je samostatná etapa.
- Povolené velikosti: S 1 × 1, M 2 × 1, L 2 × 2; mřížka čtyři sloupce × dva řádky.
- Lokální personalizace v profilu prohlížeče; žádná deklarovaná synchronizace účtů.

## Review Focus

1. Zvětšení textu nebo malé okno: ovládání zůstane dostupné, uložená sestava se neztratí. Ověřit v etapě 2.
2. Neplatná nebo starší uložená sestava: bezpečný návrat k výchozí sestavě, žádný prázdný dashboard bez vysvětlení. Ověřit v etapě 3.
3. Zvětšení karty na plné ploše: žádný překryv, ztráta sousední karty nebo scroll navíc. Ověřit v etapě 3.
4. Rychlé přepnutí URL: opožděná odpověď předchozí URL se nepoužije. Ověřit v etapě 4.
5. Chybějící oprávnění či HTTP hlavičky: žádný falešný zelený INDEX. Ověřit v etapě 4.

## Etapa 0 – React základ a zachování současné aplikace

**Files:** vytvořit `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `src/main.tsx`, `src/app/App.tsx`, `src/app/Header.tsx`, `src/app/PreferencesProvider.tsx`, `src/app/PageContextProvider.tsx`, `src/styles/app.css`, `src/lib/browser-bridge.ts`, `src/lib/preferences.ts` a `.github/workflows/deploy.yml`; upravit `index.html`. Stávající assets přenášet jen spolu s odpovídajícími komponentami. Extension ZIP publikovat přes `public/downloads/axolotl-prohlizec.zip`; zdroj rozšíření dál ve `browser-extension/`.

**Interfaces:** kořen `#axolotl-root`; React vlastní DOM přesunutých komponent, staré skripty jejich DOM již neupravují. `PreferencesProvider` zachová stávající klíče a enumy z `assets/preferences.js`, včetně načtení režimu před prvním zobrazením. `PageContextProvider` používá `{url,tabId,source}` a při přechodu zachová veřejné `window.axolotlPageContext` i `axolotl:url-change`. Zachovat `axolotl:browser-connection-change` a most k rozšíření. Hash routy zůstávají beze změny.

- [ ] Připravit návrh v oddělené větvi a nastavit build Vite s `base: '/axolotl-2/'`, React, TypeScript a Tailwind; skripty `build`, `typecheck` a `test` (Vitest). Nenahrazovat produkční entrypoint neověřeným buildem.
- [ ] Přenést hlavičku, navigaci, nastavení, hodiny, URL picker a efekt kurzoru do komponent; u globálních událostí, intervalů a animací zajistit úklid při odpojení komponenty. Nedržet dvě nezávislé kopie stavu nastavení.
- [ ] Zachovat existující testy preferences a rozšíření; logiku přesouvaných modulů převést do TypeScriptu a portovat odpovídající stavové testy. Ověřit restore nastavení, systémový režim, omezené animace, změnu URL a chybějící rozšíření. Stávající nepřesunuté testy spouštět `node --test tests/*.test.cjs`, nové `npm test`, typy `npm run typecheck`, výstup `npm run build`.
- [ ] Ověřit zachování vzhledu a chování v obou režimech včetně hover otevření kořenových menu, kliknutí na položky, klávesnice, navigace a prázdného office. Vzorník ani karty zatím nemusí existovat.
- [ ] Připravit automatický build a publikaci `dist`, ověřit možnosti nastavení Pages na GitHub Actions a správné cesty assetů/ZIP. Produkci přepnout až s ověřeným buildem; uchovat poslední nasazený commit pro návrat. Při nedostupném nastavení ponechat současné nasazení funkční.
- [ ] Nasadit React základ, ověřit existující přímé hash odkazy i obnovení stránky a uložit commit migrace.

## Etapa 1 – vzorník komponent

**Files:** vytvořit `src/pages/DesignSystem.tsx`, `src/styles/design-tokens.css`, `src/components/ui/` pro používané základní komponenty a `src/components/ToolCard.tsx`; přidat samostatnou hash routu `#design-system` v `src/app/App.tsx`. Vlastní tokeny propojit s Tailwindem a upravit vybrané komponenty shadcn/ui do vzhledu Axolotlu.

**Interfaces:** CSS tokeny `--axolotl-surface-card`, `--axolotl-surface-raised`, `--axolotl-text-primary`, `--axolotl-text-secondary`, `--axolotl-border-subtle`; React komponenta `ToolCard` s props `{size: "S"|"M"|"L", title: string, children: ReactNode}` a DOM třídou `.axolotl-tool-card` s `data-axolotl-size="S|M|L"`. Přesné barvy, mezery a radiusy ze specifikace.

- [ ] Připravit dark/light vzorník a osm ukázek: Metadata S/M/L, QR S/M/L a Rychlé akce S/M. Viditelně označit ukázkový obsah.
- [ ] Ukázat tlačítka, pole, dropdown, štítky a stavy načítání/prázdno/chyba se stejnými tokeny.
- [ ] Ověřit čitelnost, fokus, větší text a omezené animace vizuálně v obou režimech; pro kosmetické styly nezavádět testy kopírující CSS.
- [ ] Před rozšířením celého katalogu projít vzhled s Iris a zapracovat připomínky.
- [ ] Uložit samostatný commit schváleného vzorníku.

## Etapa 2 – rozložení dashboardu

**Files:** vytvořit `src/pages/Dashboard.tsx`, `src/features/dashboard/DashboardGrid.tsx` a `src/features/dashboard/dashboard.css`; zapojit do `src/app/App.tsx`.

**Interfaces:** existující `#axolotl-office-slot` zůstává prázdný; nová plocha `#axolotl-dashboard-grid` má čtyři sloupce a dva řádky, obal `.axolotl-tool-card` navazuje na etapu 1. CSS Grid bez volně umístitelných překrývajících se souřadnic.

- [ ] Sestavit jednu statickou ukázkovou sestavu z již schválených karet, office rezervy a lišty úprav; žádné nástroje ještě nespouštět.
- [ ] Přidělit kartám zbývající výšku po hlavičce a office; nepoužívat skrytí přetékajícího obsahu jako opravu přetečení.
- [ ] Na třech cílových velikostech ověřit `scrollHeight <= clientHeight + 1`, žádné překryvy a dostupnost všech tlačítek. Pod cílovou velikostí, při 200% zoomu a větším textu zkontrolovat přístupný fallback bez ztráty karet.
- [ ] Ověřit, že ostatní sekce nástrojů mohou stále scrollovat a že dropdowny nejsou oříznuté.
- [ ] Uložit commit rozložení.

## Etapa 3 – katalog a editor karet

**Files:** vytvořit `src/features/dashboard/registry.ts`, `src/features/dashboard/layout.ts`, `src/features/dashboard/DashboardEditor.tsx`, `src/features/dashboard/CardCatalog.tsx` a `src/features/dashboard/layout.test.ts`; doplnit `DashboardGrid.tsx` a `dashboard.css`. Přetahování přes dnd-kit; CSS Grid a vlastní validace určují povolené umístění.

**Interfaces:** registr obsahuje `{toolId, label, route, supportedSizes}` pro všechny nástroje ze specifikace. Sestava `{version:1, cards:[{instanceId,toolId,size,column,row}]}`; souřadnice od nuly. Čisté funkce `validateLayout(layout, registry) -> {ok, errors}`, `tryChangeLayout(layout, change, registry) -> {ok, layout, reason}` a `restoreLayout(serialized, registry) -> layout`. Změny jsou `add|move|resize|remove`; neúspěšná změna zachová původní sestavu. Úložiště `axolotl-2-dashboard-v1`.

- [ ] Napsat smysluplné jednotkové testy: odmítnutí přesahu sloupců/řádků a kolize, nepodporovaná velikost, přidání do plné plochy, neplatné JSON/verze, zachování původní sestavy při odmítnutí, validní přesun a uložení/obnovení. Spustit `npm test -- src/features/dashboard/layout.test.ts`; nejdříve ověřit selhání chybějící implementace.
- [ ] Implementovat registr a čisté funkce; spustit stejné testy a vyžadovat úspěch všech případů.
- [ ] Připojit editor s pracovní kopií, přetažením, klávesovým přesunem, katalogem, podporovanými velikostmi, Uložit/Zrušit a výchozí sestavou. Nemažte data nástroje při odebrání jeho karty.
- [ ] Při chybě ukládání ponechat rozložení v relaci a zobrazit srozumitelnou zprávu, ne hlášení o úspěšném uložení.
- [ ] Ověřit UI: přidání → přesun → změna velikosti → uložení → reload; samostatně Zrušit a plnou plochu. Karty i office zůstávají v mezích etapy 2.
- [ ] Uložit commit editoru a katalogu.

## Etapa 4 – indikátor INDEX / NOINDEX

**Files:** vytvořit `src/features/indexability/rules.ts`, `src/features/indexability/rules.test.ts`, `src/features/indexability/useIndexability.ts`, `src/features/indexability/IndexabilityBadge.tsx`; upravit `src/app/Header.tsx`, `src/lib/browser-bridge.ts`, `browser-extension/manifest.json`, `browser-extension/background.js`, `browser-extension/content.js`, `browser-extension/README.md` a `public/downloads/axolotl-prohlizec.zip`.

**Interfaces:** vstup existující událost `axolotl:url-change` s `{url,tabId,source}`. Výsledek měření `{requestId,requestedUrl,finalUrl,checkedAt,metaRules,headerRules,coverage,reason}`; `coverage` je `complete|meta-only|unavailable`. Čisté `classifyIndexRules(evidence) -> {state,sourceRules,notes}`; `state` je `index|noindex|partial|unavailable`. UI navíc zvládá `idle|loading`.

- [ ] Nejdříve ověřit sběr meta tagů a hlaviček na testovacích stránkách s povoleným přístupem; zvolit nejmenší potřebná oprávnění a popsat postup jejich udělení. Než se rozšíření změní, potvrdit přesný způsob sběru hlaviček. Jde o technickou závislost, nikoli hotovou současnou schopnost rozšíření.
- [ ] Napsat testy klasifikace: obecné noindex; googlebot noindex proti obecnému index; none; různé velikosti písmen; více hlaviček; pravidlo pouze pro jiného bota; chybějící hlavičky bez noindex => partial; zjištěné noindex i při částečném měření => noindex; chybějící oprávnění => unavailable.
- [ ] Spustit `npm test -- src/features/indexability/rules.test.ts`, implementovat klasifikaci a ověřit průchod všech případů.
- [ ] Přidat štítek a detail zdrojů. Zelený INDEX jen při kompletním zkontrolování příslušných zdrojů. Není to potvrzení reálné indexace v Googlu.
- [ ] Ověřit rychlé přepnutí URL A→B s odpovědí A až po B: A se ignoruje; žádná URL, přesměrování a zamítnuté oprávnění mají samostatný stav. Kontrolovat shodu tabId i requestedUrl.
- [ ] Ověřit aktualizaci rozšíření, znovu vytvořit ZIP a návod; uložit commit.

## Etapa 5 – přenos hotových nástrojů, později office

- [ ] Přenášet existující nástroje po jednom. Každý má jedinou logiku sdílenou mezi kartou a celou sekcí; nové React nástroje používají `PageContextProvider`; pro dosud nepřesunuté moduly zůstává kompatibilní `window.axolotlPageContext` a událost `axolotl:url-change`.
- [ ] U každého nástroje ověřit skutečný vstup/výsledek, chybu a návrat na dashboard; nezavádět automatické těžké skenování všech karet při každém přepnutí URL.
- [ ] Živý office řešit až po dodání a schválení scény/animací jako samostatný návrh a implementaci. Do té doby se prázdný slot nemění.

## Nejbližší krok

Začít etapou 0: připravit React základ se zachováním dnešního vzhledu a funkcí. Potom etapa 1: vzorník komponent a tři reprezentativní karty. Teprve po ustálení vzhledu rozšiřovat katalog a editor. Tento plán nepovoluje nyní vložit office ani současně spustit všechny budoucí etapy.
