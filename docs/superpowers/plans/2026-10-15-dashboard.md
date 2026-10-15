# Axolotl dashboard – plán implementace

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Připravit jednotné komponenty, přizpůsobitelnou plochu bez scrollu na notebooku a pravdivý indikátor pravidel indexace.

**Architecture:** Zachovat statickou HTML/CSS/JS aplikaci. Oddělit vzhled komponent, registr karet, rozložení a sběr dat URL; používat současný sdílený kontext URL. Office zůstává prázdná rezerva. Toto je návrh k posouzení, nikoli pokyn zahájit všechny etapy současně.

**Tech Stack:** Stávající HTML, CSS, JavaScript, localStorage, GitHub Pages a rozšíření prohlížeče. Bez zavádění frameworku pro samotnou mřížku a vzorník.

**Spec:** `docs/superpowers/specs/2026-10-15-dashboard-design.md`

## Global Constraints

- Office se nyní nevkládá; zůstává průhledná prázdná plocha bez rámečku, nadpisu a výplně.
- Hlavička, logo a prostor pro budoucí živý office zůstávají mimo editor karet.
- Cílem je obsahový viewport od 1366 × 650 CSS px při běžném přiblížení; kontrolní velikosti 1366 × 650, 1440 × 800 a 1920 × 900.
- Všechny nové DOM class/id mají prefix axolotl-. Kořenové nabídky zachovají hover, jejich položky aktivaci kliknutím.
- Nové nástroje nebudou předstírat výsledky; jejich přenos je samostatná etapa.
- Povolené velikosti: S 1 × 1, M 2 × 1, L 2 × 2; mřížka čtyři sloupce × dva řádky.
- Lokální personalizace v profilu prohlížeče; žádná deklarovaná synchronizace účtů.

## Review Focus

1. Zvětšení textu nebo malé okno: ovládání zůstane dostupné, uložená sestava se neztratí. Ověřit v etapě 2.
2. Neplatná nebo starší uložená sestava: bezpečný návrat k výchozí sestavě, žádný prázdný dashboard bez vysvětlení. Ověřit v etapě 3.
3. Zvětšení karty na plné ploše: žádný překryv, ztráta sousední karty nebo scroll navíc. Ověřit v etapě 3.
4. Rychlé přepnutí URL: opožděná odpověď předchozí URL se nepoužije. Ověřit v etapě 4.
5. Chybějící oprávnění či HTTP hlavičky: žádný falešný zelený INDEX. Ověřit v etapě 4.

## Etapa 1 – vzorník komponent

**Files:** vytvořit `design-system.html`, `assets/design-tokens.css`, `assets/components.css`; při následném sjednocení upravit `index.html`, `assets/settings.css`, `assets/navigation.css`, `assets/url-context.css` a `assets/cursor-effects.css`.

**Interfaces:** CSS tokeny `--axolotl-surface-card`, `--axolotl-surface-raised`, `--axolotl-text-primary`, `--axolotl-text-secondary`, `--axolotl-border-subtle`; komponenta `.axolotl-tool-card` s `data-axolotl-size="S|M|L"`. Přesné barvy, mezery a radiusy ze specifikace.

- [ ] Připravit dark/light vzorník a osm ukázek: Metadata S/M/L, QR S/M/L a Rychlé akce S/M. Viditelně označit ukázkový obsah.
- [ ] Ukázat tlačítka, pole, dropdown, štítky a stavy načítání/prázdno/chyba se stejnými tokeny.
- [ ] Ověřit čitelnost, fokus, větší text a omezené animace vizuálně v obou režimech; pro kosmetické styly nezavádět testy kopírující CSS.
- [ ] Před rozšířením celého katalogu projít vzhled s Iris a zapracovat připomínky.
- [ ] Uložit samostatný commit schváleného vzorníku.

## Etapa 2 – rozložení dashboardu

**Files:** upravit `assets/dashboard-layout.css` a dashboard sekci v `index.html`; vytvořit `assets/dashboard.css`.

**Interfaces:** existující `#axolotl-office-slot` zůstává prázdný; nová plocha `#axolotl-dashboard-grid` má čtyři sloupce a dva řádky, obal `.axolotl-tool-card` navazuje na etapu 1. CSS Grid bez volně umístitelných překrývajících se souřadnic.

- [ ] Sestavit jednu statickou ukázkovou sestavu z již schválených karet, office rezervy a lišty úprav; žádné nástroje ještě nespouštět.
- [ ] Přidělit kartám zbývající výšku po hlavičce a office; nepoužívat skrytí přetékajícího obsahu jako opravu přetečení.
- [ ] Na třech cílových velikostech ověřit `scrollHeight <= clientHeight + 1`, žádné překryvy a dostupnost všech tlačítek. Pod cílovou velikostí, při 200% zoomu a větším textu zkontrolovat přístupný fallback bez ztráty karet.
- [ ] Ověřit, že ostatní sekce nástrojů mohou stále scrollovat a že dropdowny nejsou oříznuté.
- [ ] Uložit commit rozložení.

## Etapa 3 – katalog a editor karet

**Files:** vytvořit `assets/dashboard-registry.js`, `assets/dashboard-layout.js`, `assets/dashboard-editor.js`, `tests/dashboard-layout.test.cjs`; doplnit `assets/dashboard.css` a `index.html`.

**Interfaces:** registr obsahuje `{toolId, label, route, supportedSizes}` pro všechny nástroje ze specifikace. Sestava `{version:1, cards:[{instanceId,toolId,size,column,row}]}`; souřadnice od nuly. Čisté funkce `validateLayout(layout, registry) -> {ok, errors}`, `tryChangeLayout(layout, change, registry) -> {ok, layout, reason}` a `restoreLayout(serialized, registry) -> layout`. Změny jsou `add|move|resize|remove`; neúspěšná změna zachová původní sestavu. Úložiště `axolotl-2-dashboard-v1`.

- [ ] Napsat smysluplné jednotkové testy: odmítnutí přesahu sloupců/řádků a kolize, nepodporovaná velikost, přidání do plné plochy, neplatné JSON/verze, zachování původní sestavy při odmítnutí, validní přesun a uložení/obnovení. Spustit `node --test tests/dashboard-layout.test.cjs`; nejdříve ověřit selhání chybějící implementace.
- [ ] Implementovat registr a čisté funkce; spustit stejné testy a vyžadovat úspěch všech případů.
- [ ] Připojit editor s pracovní kopií, přetažením, klávesovým přesunem, katalogem, podporovanými velikostmi, Uložit/Zrušit a výchozí sestavou. Nemažte data nástroje při odebrání jeho karty.
- [ ] Při chybě ukládání ponechat rozložení v relaci a zobrazit srozumitelnou zprávu, ne hlášení o úspěšném uložení.
- [ ] Ověřit UI: přidání → přesun → změna velikosti → uložení → reload; samostatně Zrušit a plnou plochu. Karty i office zůstávají v mezích etapy 2.
- [ ] Uložit commit editoru a katalogu.

## Etapa 4 – indikátor INDEX / NOINDEX

**Files:** vytvořit `assets/indexability.js`, `assets/indexability.css`, `tests/indexability.test.cjs`; upravit `index.html`, případně `assets/url-context.css`, `browser-extension/manifest.json`, `browser-extension/background.js`, `browser-extension/content.js`, `browser-extension/README.md` a `downloads/axolotl-prohlizec.zip`.

**Interfaces:** vstup existující událost `axolotl:url-change` s `{url,tabId,source}`. Výsledek měření `{requestId,requestedUrl,finalUrl,checkedAt,metaRules,headerRules,coverage,reason}`; `coverage` je `complete|meta-only|unavailable`. Čisté `classifyIndexRules(evidence) -> {state,sourceRules,notes}`; `state` je `index|noindex|partial|unavailable`. UI navíc zvládá `idle|loading`.

- [ ] Nejdříve ověřit sběr meta tagů a hlaviček na testovacích stránkách s povoleným přístupem; zvolit nejmenší potřebná oprávnění a popsat postup jejich udělení. Než se rozšíření změní, potvrdit přesný způsob sběru hlaviček. Jde o technickou závislost, nikoli hotovou současnou schopnost rozšíření.
- [ ] Napsat testy klasifikace: obecné noindex; googlebot noindex proti obecnému index; none; různé velikosti písmen; více hlaviček; pravidlo pouze pro jiného bota; chybějící hlavičky bez noindex => partial; zjištěné noindex i při částečném měření => noindex; chybějící oprávnění => unavailable.
- [ ] Spustit `node --test tests/indexability.test.cjs`, implementovat klasifikaci a ověřit průchod všech případů.
- [ ] Přidat štítek a detail zdrojů. Zelený INDEX jen při kompletním zkontrolování příslušných zdrojů. Není to potvrzení reálné indexace v Googlu.
- [ ] Ověřit rychlé přepnutí URL A→B s odpovědí A až po B: A se ignoruje; žádná URL, přesměrování a zamítnuté oprávnění mají samostatný stav. Kontrolovat shodu tabId i requestedUrl.
- [ ] Ověřit aktualizaci rozšíření, znovu vytvořit ZIP a návod; uložit commit.

## Etapa 5 – přenos hotových nástrojů, později office

- [ ] Přenášet existující nástroje po jednom. Každý má jedinou logiku sdílenou mezi kartou a celou sekcí; všechny používají `window.axolotlPageContext` a událost `axolotl:url-change`.
- [ ] U každého nástroje ověřit skutečný vstup/výsledek, chybu a návrat na dashboard; nezavádět automatické těžké skenování všech karet při každém přepnutí URL.
- [ ] Živý office řešit až po dodání a schválení scény/animací jako samostatný návrh a implementaci. Do té doby se prázdný slot nemění.

## Nejbližší krok

Začít etapou 1: vzorník komponent a tři reprezentativní karty. Teprve po ustálení vzhledu rozšiřovat katalog a editor. Tento plán nepovoluje nyní vložit office ani současně spustit všechny budoucí etapy.
