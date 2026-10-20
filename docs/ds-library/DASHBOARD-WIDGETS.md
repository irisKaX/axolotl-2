# Dashboard Widget Studio V1

Součást existující Design System Library V1.1, větev `experiment/ds-library-v1-1`.

[Otevřít Dashboard Widgets](https://iriskax.github.io/axolotl-preview/ds-library-v1-1/?catalog=library&section=widgets#design-system).

## Rozsah a skutečné chování

| Export | Funkce | Stav |
| --- | --- | --- |
| `FindPhraseWidget` | Jedno pole, Fráze/Asset, Hledat, lokální průběh starting → scanning → success/limited/error. Výchozí rozsah celý demo web. | Návrh, pouze demo, bez produkčního použití. Budoucí Tool ID `search`. |
| `MiniQrWidget` | Jedna URL, skutečné lokální generování QR, náhled a stažení PNG. Pevný černý kód, bílé pozadí, 512 × 512 px. | Návrh, funkční QR/PNG, bez produkčního použití widgetu. Budoucí Tool ID `qr`. |

Find Phrase pracuje pouze s ukázkovými daty `example.test`. Souhrny jsou označené jako ukázkové; není předstírán skutečný sken ani procentuální postup. „Otevřít v nástroji“ otevře existující Dialog s vysvětlením budoucího předání. Nespouští produkční nástroj ani běhovou úlohu.

Mini QR znovu používá nezměněné `createQr`, `paintQr` a `exportQrOutput` existujícího nástroje. URL validuje stejný model. Webový download adaptér výslovně vypíná použití `chrome.downloads`; widget nemá vazbu na rozšíření. Oznámení potvrzuje předání PNG prohlížeči, nikoli dokončení uložení na disk, které web nemůže spolehlivě zjistit.

## Architektura a API

- `src/design-system/widgets/Widgets.tsx`: skutečné řízené React exporty, skládající existující WidgetCard, Field/Input, Button, SegmentedControl, Badge a Status. `widgets.css` řeší pouze rozložení nových widgetů.
- `src/design-system/widgets/state.ts`: `useFindPhraseDemo` a `useMiniQr`, lokální stav a konkrétní akce. Timery se uklízejí; nová URL/reset/unmount zneplatní rozpracovaný QR výsledek a zruší čekající export. Souběžné spuštění stejné akce je blokované.
- `WidgetsPage.tsx`: malý katalogový adaptér, existující Playground a ovladače, lokální dark/light provider a dvě nezávislé ukázky v kontextu budoucího Dashboardu.
- `registry.tsx`: kategorie `widgets`, skutečné exporty, podporované vlastnosti, cesta ke zdroji, Návrh/Schváleno a oddělené produkční použití. Menu, přehled a deep link vznikají stávajícím mechanismem.

`FindPhraseWidget`: `size?`, `value`, `mode`, `state`, `onValueChange`, `onModeChange`, `onSearch`, `detailAction`.

`MiniQrWidget`: `size?`, `value`, `state`, `onValueChange`, `onGenerate`, `onDownload`.

Oba podporují `medium` (max. 440 px) a `large` (max. 600 px), s přizpůsobením rodiči na mobilu. S není nabízeno. Návrh využívá současný sjednocený provider a Halo Soft; nepřidává motion ani materiálovou rodinu. UI lze později napojit na jiný stavový adaptér bez kopírování jeho vykreslení.

Další widget vyžaduje skutečný export, záznam `defineEntry` v existující kategorii a malý adaptér jeho konkrétního chování ve stránce. Univerzální engine pro různé nástroje zatím není potřeba.

## Ověření

- Unit: validace a focus, tři demo scénáře a úklid timerů, nulové síťové požadavky a persistence, skutečný QR model, zneplatnění starého výsledku, webový download adaptér, exportní chyba/retry, blokace dvojího exportu a abort při změně URL.
- Browser: M/L, dark/light bez změny preferencí, demo průběh a dialog/focus, formuláře a klávesnice, nezávislé dekódování QR z canvasu i skutečně staženého PNG, axe, mobilní touch 390/320 px, zvětšený text, reduced motion, URL a testovací přepínač.
- Regrese: celá stávající katalogová browser sada; porovnání Navigation & Tabs v dark/light proti předchozímu publikovanému katalogu.
- Publikace: úplný předchozí Pages artefakt, změna pouze `ds-library-v1-1/`, kontrola hashů ostatních souborů a opětovné ověření veřejných vstupních stránek.

Aktuální skutečné výsledky jsou v CI a v publikovaném `evidence/verification.json`; výše je rozsah kontrol, nikoli náhrada jejich výsledků.

## Hranice a omezení

Header, skutečný Dashboard, Tools, Workspace, extension, Navigation & Tabs a původní komponentové exporty se nemění. Bez nové závislosti, skeneru, sdílené úlohy, drag & drop, resize, ukládání layoutu, Office či Notebooku.

Stav ukázek je lokální a při opuštění stránky se neukládá. Dark/light je pouze kontext této kategorie. Náhled má vlastní neprůhledný podklad ze stávajících tokenů, aby světlý textový kontext nezávisel na pozadí aplikace. Mobilní browser test je emulace Chromia; fyzický iPhone/Safari a ruční screen-reader audit zůstávají samostatnou kontrolou.
