# Colors & Gradients

Stránka stejné Library V1.1: `?catalog=library&section=colors#design-system`.

- Registr: `src/pages/design-system/library/colors/paints.ts`. Osm gradientů má přesnou CSS definici ze zadání; šest unikátních solid barev zahrnuje Purple, Black, Light, O2 Blue, White a Axolotl Violet. O2 Blue se neduplikuje.
- Novou položku přidej jediným záznamem `{id, name, kind, css, design, production}`. Grid, výběr, náhledy, kopírování i technická evidence se odvozují automaticky. `id` musí být unikátní. Nová položka obvykle začíná jako `draft`, `production: false`.
- `ColorSample.tsx` je skutečný React export navázaný na ID registru. Kliknutí na celý HEX/CSS ovladač kopíruje HEX nebo `background: ${css};`; Enter a mezerník fungují nativně. Úspěch zobrazí fajfku a „Zkopírováno“ na 2,2 sekundy. Odmítnutí schránky zobrazí chybu, nikoli falešný úspěch.
- `ColorsPage.tsx` používá skutečný Button, Card, Badge a Panel. Pouze selektory v `colors.css` pod `.ds-colors` přebarvují tyto živé ukázky. Žádný produkční export, jeho API, token ani globální styl se nemění.
- Přepínač náhledu v horní liště má pro tuto kategorii lokální React stav (`isolatedTheme`). Provider uvnitř stránky poskytuje kontext také Radix portálům. Nemění DOM téma aplikace, localStorage, Header ani preferences provider. Obnovení stránky začíná aktuálním kontextem aplikace.
- Foundations zůstávají stručným přehledem schválených akcentů s odkazem na detail. Ostatní současné tokeny v `library.css` a aplikačních stylech zůstávají nedotčené. Nejde o jejich kompletní inventuru ani migraci.
- Nové palety jsou návrhy. O2 Blue a Axolotl Violet zachovávají schválení. Produkční použití těchto **barevných hodnot** dokládají Button Primary / CursorEffects a Header; není to tvrzení, že je ColorSample produkční komponentou. Produkční evidence se zobrazuje jen v technických detailech.

## Kontrast

`contrast.ts` kontroluje sRGB relativní luminanci a používá konzervativní interval přes všechny barevné kanály gradientu, ne průměr nebo jen koncové poměry. Pro malé popisky vyžaduje alespoň 4,5 : 1. Pokud nelze vhodnou světlou/tmavou barvu zaručit, popisky dostanou neprůhledný neutrální podklad; samotná CSS definice gradientu se nemění. Barevný text se zobrazí jen při dostatečném kontrastu vůči skutečné vypočtené barvě neutrálního povrchu.

Výpočet podporuje neprůhledný šestiznakový HEX a `hsla(..., 1)` z aktuálního zadání, čtení povrchu také přes computed `rgb(...)`. Nepodporované formáty, průhlednost nebo jiný explicitní interpolační prostor automaticky používají bezpečný podklad a nezobrazí barevný text. Je to konzervativní pomocná kontrola, ne certifikace všech možných CSS gradientů.

## Kontroly

`Colors.test.tsx`: přesných osm definic, unikátní registry, kopírování deklarací, odmítnutá schránka, kontrastní krajní případy. `scripts/ds-library/check-colors.mjs`: skutečné zápisy/čtení schránky pro všech 14 hodnot, Tab/focus/Enter/mezerník, dark/light bez změny preferencí, reálné akce, kontrastní fallback, deep links/Back/Forward/reload, testovací přepínač, 390/320 px touch a 200% text. Běží v existující browser sadě před publikací i na veřejné URL.

Bez nových závislostí. Fyzický iPhone/Safari a ruční screen-reader audit nejsou nahrazeny emulací Chromia.
