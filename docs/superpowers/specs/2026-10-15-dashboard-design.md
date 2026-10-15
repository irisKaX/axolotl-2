# Axolotl 2.0: přizpůsobitelný dashboard

Návrh k posouzení, 15. 10. 2026. Tento dokument navrhuje další vývoj; nové karty, indikátor ani office zatím nejsou implementované. V této změně se nasazuje pouze oprava barev ikon v nabídkách.

## Cíl a pevné části

Každý si zvolí nástroje, které má na dashboardu, jejich pořadí a podporovanou velikost. Hlavička, logo a prostor pro budoucí živý office zůstávají mimo editor karet. Office se nyní nevkládá; zůstává průhledná prázdná plocha bez rámečku, nadpisu a výplně. Celá stránka má působit jako jeden celek.

Pevné znamená stejnou roli a umístění v kompozici, nikoli neměnnou výšku v pixelech. Výška office rezervy se bude přizpůsobovat dostupnému prostoru. Nesmí zmizet kvůli přidávání karet.

## Způsob přizpůsobení

Zvažované možnosti: pouze předvolené sestavy jsou jednoduché, ale omezují uživatele; zcela volné plátno umožní libovolné rozměry, ale snadno vytvoří překryvy a scroll. Doporučení: mřížka se třemi povolenými velikostmi, s možností začít předvolenou sestavou.

Na běžném desktopu navrhuji čtyři sloupce a dva řádky, tedy osm jednotek plochy. Rozložení se neprodlužuje přidáváním dalších řádků. Další nástroje zůstávají dostupné v navigaci a katalogu karet. Při zaplnění editor nabídne zmenšení, výměnu nebo odebrání karty; nepřidá ji skrytě pod spodní okraj.

| Varianta | Místo | Účel |
| --- | --- | --- |
| S – kompaktní | 1 × 1 | Ikona, název, krátký stav nebo jedna rychlá akce. |
| M – široká | 2 × 1 | Krátký přehled, několik údajů a hlavní akce. |
| L – pracovní | 2 × 2 | Náhled, krátký formulář nebo bohatší přehled. |

Veškeré varianty používají jeden společný obal karty, typografii a ovládání. Varianty nejsou samostatné implementace stejného nástroje. Všechny nástroje dostanou S; M a L jen podle užitečnosti obsahu.

| Nástroj | Navržené varianty | Rozšířený obsah v budoucnu |
| --- | --- | --- |
| Rychlé akce | S, M | Vlastní výběr zkratek; bez analýzy URL. |
| Metadata | S, M, L | Title, description, délky a nález kontroly. |
| Nadpisy | S, M, L | Počty H1–H6, problémové stavy, stručná hierarchie. |
| Strukturovaná data | S, M, L | Nalezené typy a souhrn problémů. |
| Obrázky – kontrola | S, M, L | Souhrn chybějících altů a dalších kontrol. |
| Hledání na webu | S, M, L | Zadání dotazu a poslední stav hledání. |
| Konvertor obrázků | S, M, L | Vložení souboru, formát a stav převodu. |
| Obrázky z webu | S, M, L | Počet a malý náhled nalezených obrázků. |
| PDF scout | S, M, L | Počet a několik nalezených dokumentů. |
| Screenshot | S, M | Volba režimu snímku a spuštění nástroje. |
| QR | S, M, L | Rychlé vytvoření pro vybranou URL; u L náhled. |
| Poznámky | S, M, L | Rychlá poznámka nebo poslední záznamy. |

Tyto funkce se připojí až při přenosu hotových nástrojů. První katalog obsahuje vzhledové ukázky a označené prázdné stavy; nesmí předstírat naměřené výsledky.

## Editor plochy

Tlačítko „Upravit dashboard“ otevře režim úprav. Uživatel přidává z katalogu, přetahuje karty, mění povolenou velikost a odebírá je. Přesun jde také tlačítky nebo klávesnicí, nejen tažením. Cílové místo se zvýrazní a před uložením se ověří, že žádná karta nepřekrývá jinou.

Ovládání: Přidat kartu, Velikost, Odebrat, Uložit, Zrušit, Obnovit výchozí sestavu. Úpravy mají pracovní kopii; Zrušit vrátí předchozí sestavu. Odebrání karty nesmaže data nástroje, například poznámky. Změny se ukládají lokálně v daném profilu prohlížeče; synchronizace mezi kolegy nebo zařízeními vyžaduje pozdější účty a backend.

Příklady osmi jednotek: SEO sestava = Metadata M + Nadpisy M + Strukturovaná data S + Obrázky S + Hledání S + Rychlé akce S. Média sestava = Konvertor M + Obrázky z webu M + PDF scout S + Screenshot S + QR S + Rychlé akce S. Jde o výchozí návrhy, ne povinné rozložení.

## Dashboard bez scrollu

Cílem je obsahový viewport od 1366 × 650 CSS px při běžném přiblížení; kontrolní velikosti 1366 × 650, 1440 × 800 a 1920 × 900. Výška se počítá ze skutečného prostoru pro stránku, nikoli z fyzického rozlišení displeje. Horní lišty prohlížeče tento prostor zmenšují.

Dashboard využije 100dvh, místo pro hlavičku, přizpůsobitelnou office rezervu, malou lištu úprav a mřížku ve zbylé výšce. Obsah karet je omezen na přehled, bez vlastních dlouhých scrollovacích seznamů. Plné výsledky se otevírají kliknutím v příslušné sekci nástroje. Rozbalené nabídky a katalog mohou mít vlastní scroll.

Pod cílovou velikostí nebo při výrazném zvětšení textu/zoomu je povolen přístupný scroll. Zákaz scrollu se nesmí řešit ořezáním ovládání ani zmenšením textu k nečitelnosti. Rozložení se kvůli menšímu oknu automaticky nepřepisuje v uložené sestavě.

## Vizuální směr a komponenty

Navazujeme na stávající šedočerné a šedobílé pozadí. Směr: čistá pracovní aplikace, měkké zaoblení, dobře čitelné plochy, malé množství barevných akcentů. Office bude přinášet živost, karty mají podporovat soustředění. Celoplošné barevné přechody, výrazné záře a samostatné barevné styly pro každý nástroj nejsou výchozí návrh.

Návrh tokenů pro první vzorník:

| Prvek | Dark | Light |
| --- | --- | --- |
| Karta | #242529 | #FFFFFF |
| Zvýšená plocha / menu | #303136 | #F4F4F5 |
| Hlavní text a běžné ikony | #FFFFFF | #17181B |
| Vedlejší text | #B8B9C1 | #5C5E66 |
| Jemný okraj karty | rgba(255,255,255,.10) | rgba(0,0,0,.10) |
| Hlavní barevný akcent | modrofialový gradient ze současné aplikace | stejný gradient |

Barvy karet jsou návrh k vizuálnímu ověření; aktuální pozadí a gradienty přepínače zůstávají schváleným základem. Gradient mají hlavní ikony hlavičky (Home, nastavení, zvonek). Ikony nástrojů, šipky a položky v menu mají neutrální barvu textu. Stavové barvy slouží pro výsledek kontroly a vždy mají i textové označení.

Jednotná stupnice mezer 4/8/12/16/24/32 px; karty a menu radius 24 px, pole 16 px, malé ovladače 999 px. Výchozí text 14 px, názvy karet 16 px, pomocný text 12 px, zachovat existující volbu většího textu. Přechody 160–200 ms, respektovat omezení animací. Kontrast a viditelné zaměření ověřit v obou režimech.

Vzorník ukáže: obal karty S/M/L, tlačítka, ikonové tlačítko, pole, select, přepínač, rozbalovací menu, tooltip, stavový štítek, načítání, prázdný stav a chybu. Nejprve porovnat Metadata, QR a Rychlé akce, pak rozšířit katalog.

## Indikátor u URL

Malý štítek vedle aktuální URL se týká přesně stejné vybrané stránky jako karty nástrojů. Po změně URL nebo karty okamžitě přejde do čekání; starý výsledek se nesmí vydávat za nový. Detail se otevře kliknutím; hover poskytne pouze krátké vysvětlení.

Navržené stavy:

- INDEX: ve zkontrolovaných meta pravidlech a dostupných HTTP hlavičkách nebyl nalezen zákaz; vysvětlení „Indexace není zakázaná pravidly robots“. Není to potvrzení přítomnosti v Googlu ani kompletní audit indexovatelnosti.
- NOINDEX: nalezeno relevantní noindex nebo none. Detail ukáže zdroj a doslovnou hodnotu.
- ČÁSTEČNĚ OVĚŘENO: dostupná jen část zdrojů, například meta tagy bez HTTP hlaviček. Nezobrazovat zelené INDEX při neúplném měření.
- NELZE OVĚŘIT / OVĚŘUJI / BEZ URL: stav měření, důvod a možnost opakování.

Vyhodnocení pro Google web search kombinuje obecná pravidla robots a pravidla googlebot; rozhoduje nejpřísnější relevantní pravidlo. Číst meta robots, meta googlebot a X-Robots-Tag. robots.txt popisuje procházení, nikoli totožný zákaz indexace; canonical, HTTP chyby, přesměrování a rozdíly mezi zdrojovým a vykresleným HTML uvést odděleně. Skutečný stav indexace v Googlu by vyžadoval další integraci.

Současné rozšíření předává pouze URL a názvy karet. Pro čtení stránky/hlaviček bude třeba rozšířit jeho protokol a oprávnění pro uživatelem povolené weby. Samotná statická webová aplikace nemá zaručený přístup k cizím stránkám. Přesná technika sběru bude ověřena v samostatném kroku před implementací; bez oprávnění zobrazit poctivý neznámý stav. Pro ručně zadanou URL není výsledek jiné otevřené karty platnou náhradou. Žádné přihlašovací údaje ani obsahy stránek neposílat do cizího proxy serveru.

Oficiální podklady: [Robots meta a X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), [Pravidlo noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

## Budoucí office

Až bude schválený samostatný podklad a animace, vložit jej do existující rezervy se sladěním denního/nočního režimu. Scéna nesmí měnit velikost plochy při animaci, zachytávat ovládání karet ani načítat velké prostředky mimo dashboard. Při omezení animací statický klidový stav; mimo viditelnou kartu pozastavit animace. Teď nevytvářet náhradní obrázek ani animaci.
