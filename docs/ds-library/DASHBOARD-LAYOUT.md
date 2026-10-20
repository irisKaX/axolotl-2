# Dashboard Layout Studio V1

Návrhová stránka `?catalog=library&section=layout#design-system` ve stejném katalogu. Návrh, bez produkčního použití. Skutečný rodičovský AppHeader beze změny, žádná napodobenina ani další React root.

## Rozsah
- **Vyvážený střed:** Office uprostřed, Find Phrase vlevo a Mini QR vpravo.
- **Pracovní patra:** pravá pracovní zóna posunutá níže; Office zůstává mezi úrovněmi, ve středu plochy. Stejný materiál a obsah.
- Office a trvalý Notebook přístup jsou mimo seznam upravitelných widgetů; nelze je odstranit.
- Režim úprav: pointer drag & drop do zóny nebo před widget, šířka, minimální výška, přidání, odstranění a reset. Escape/pointercancel zahodí rozpracované gesto.
- Alternativa pro touch/klávesnici: Radix Select Umístění, tlačítka pořadí; na úchytu ←/→ zóna, ↑/↓ pořadí, End dolní zóna. Na resize úchytu šipky mění rozměry. Žádná interakce není dostupná výhradně tažením.
- Skutečné `FindPhraseWidget` a `MiniQrWidget` používají stávající exporty i stavové adaptéry. Přesouvání nepřemontovává widget; přepnutí na placeholder zachová rozepsaný vstup. Find Phrase je demo, QR se generuje lokálně.
- Přepnutí kompozice zachovává vlastní zóny i obsah. Reset obnoví výchozí geometrii; není to reset rozepsaných widgetů. Obnovení celé stránky lokální návrh zahodí.

## Rozměry a responzivita
Find Phrase a Mini QR mají doporučenou šířku 280 px, širší volbu 360 px; skutečné inputy se dále testují v mobilní šířce. Minimum výšky je 240 / 280 px, výchozí placeholder 300 px. QR výstup přirozeně zvětšuje obsah; žádný fixní rám jej neořezává. Obecné S/M/L jsou 200/280/360 px, výšky 160/220/300 px. Office má širokou centrální scénu a minimum 320 px v třísloupcové kompozici.

Od 1180 px se Office přesune do první plné řady, widgety do dvou sloupců; do 680 px do jednoho. Notebook zůstává v panelu nad plochou. Na malých displejích se používá běžné svislé scrollování. Obsah a editace mohou zvýšit výšku; prioritní úvodní kompozice se testuje na 1366 × 768. Velikosti se přizpůsobují dostupnému sloupci, nejsou absolutními rozměry budoucího dashboard enginu.

## Hranice
Pouze lokální React stav. Nezapisuje rozložení ani theme náhledu do storage; nezavádí datové API, browser bridge, produkční persistence nebo nový nástroj. Stávající header nad katalogem si zachovává své skutečné chování. Nové CSS je omezené na `.dls` a `data-workspace` katalogu; sdílené komponenty/tokény nejsou změněné. Nová závislost není potřeba. Přesun používá Pointer Events a pevné zóny, ne obecný grid engine. Při drag gestu není auto-scroll; pro vzdálené zóny a touch je výběr Umístění.

## Ověření
`npm test`, `npm run typecheck`, `scripts/ds-library/check-layout.mjs` zapojený do existujícího `check.mjs`. Výsledky měření a screenshoty vznikají v `evidence/layout-*`. Oddělený workflow `layout-studio-check.yml` na experimentální větvi nemá deploy job ani Pages oprávnění. Publikace preview je samostatný ověřený krok v axolotl-preview, zachovávající ostatní artefakty.

Browser kontrola zahrnuje obě kompozice, 1366 × 768 / 1440 × 900 / 1920 × 1080 dark/light, centrování Office a počáteční viditelnost headeru/widgetů, pointer drop a zrušení, resize, přidání/odebrání/reset, reálné widgety, izolaci preferencí, axe, keyboard, reduced motion, touch 1024/768/390/320 a historii URL. Mobilní kontrola je emulace Chromium; fyzický iPhone/Safari se tím nepotvrzuje.

Při první CI regresi test přechodného stavu Find Phrase minul 500ms fázi a zastihl už dokončené demo. Test nyní používá Playwright Clock pro jednotlivé fáze; zachovává všechny původní aserce i chování komponenty.

Cílená kontrola [39395376767](https://github.com/irisKaX/axolotl-2/actions/runs/39395376767) prošla: 105 testů, typecheck/build, 12 desktopových měření, axe bez nálezů a všechny uvedené interakce i touch šířky. Na 1366 × 768 má Office 668 × 300 px, výchozí pracovní widgety 280 × 307,7 px; oba se vejdou i v odsazené kompozici (spodní hrana pravého widgetu 742,1 px). Tato kontrola úvodního viewportu platí pro výchozí strukturální obsah. Skutečné widgety a výsledky mohou plochu svisle prodloužit, aby se obsah neořezával. Screenshoty používají reduced motion pro potlačení stávajícího efektu kurzoru; interakce jsou ověřeny i v běžném režimu.
