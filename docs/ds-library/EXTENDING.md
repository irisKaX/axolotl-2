# Rozšiřování Design System Library V1.1

**Katalog:** https://iriskax.github.io/axolotl-preview/ds-library-v1-1/#design-system  
**Větev:** `experiment/ds-library-v1-1` · navazuje na V1 `62808f182479c947cf70e7e2918b5fba74b321ad`.

Jedna knihovna, jeden záznam varianty, jedna stránka rodiny. Není potřeba nový experiment, kopie schválené komponenty ani administrační rozhraní.

## Kde změnu provést

| Odpovědnost | Soubor |
| --- | --- |
| Skutečné komponenty a tokeny | `src/design-system/Button/`, `src/design-system/library/` |
| Registr rodin, loaderů stránek, exportů, variant a vlastností | `src/pages/design-system/library/registry.tsx` |
| Malý typový kontrakt a validační hranice props | `src/pages/design-system/library/model.ts` |
| Výběr komponenty, varianty, vlastnosti a boolean | `src/pages/design-system/library/Controls.tsx` |
| Společná prezentace a technické detaily | `PageFrame.tsx`, `VariantComparison.tsx` ve stejné složce |
| Specifické chování ukázek | `FormsPage.tsx`, `SurfacesPage.tsx` atd. |
| Navigace a deep links | `Library.tsx` — při přidání stránky se neupravuje |

`defineEntry(SkutečnýExport, {...})` kontroluje názvy vlastností a props variant proti React API komponenty. `component` drží přímo export, `source` jeho skutečný soubor. `defineCategory` propojí metadata s lazy loaderem; přehled, menu, URL a renderování se odvodí z registru. Ovládání specifických interakcí zůstává v malých stránkových adaptérech, nikoli v univerzálním generátoru.

## 1. Přidání varianty existující komponenty

1. Rozšiř API a implementaci skutečného exportu, pokud nová varianta potřebuje nové chování nebo styl. Původní varianty zachovej. Nový selektor omez na novou variantu.
2. Do jejího `variants` přidej **jeden** záznam se stabilním ID, názvem a props. Například existující test A u Card:

```tsx
variant('outline-test', 'Test · obrys', {material: 'outline-test' as const})
```

Výchozí evidence je `design: 'draft'`, `production: false`. Test A přidává tento jediný záznam v `getCategories(true)`, ne kopii Card. Skutečná Card má odpovídající materiál a jeden scoped CSS selektor v `library.css`.

3. Stránka Surfaces používá `VariantControl` a generuje příklady z registrovaných variant. Nová varianta se automaticky objeví ve výběru, příkladech, počtech, technických detailech i přímém srovnání. Pro vlastní chování uprav pouze příslušný stránkový adaptér.
4. U Buttonu se seznam variant, názvy i velikosti v původním `ButtonShowcase` čtou z registru. Samotný Button API/CSS a Star Border zůstávají autoritou chování. Nový efekt případně vyžaduje malý specifický ovladač; neprezentuj parametr, který komponenta neumí.

Variantou je samostatný vizuální nebo významový způsob provedení (např. Primary nebo materiál Card). `size`, hover, disabled, loading, indeterminate, layout a stav požadavku jsou vlastnosti/stavy. V1.1 proto opravuje jejich původní započítávání bez odstranění funkcí.

## 2. Přidání typu / nové stránky

1. Vytvoř skutečný React export. Test B: `src/design-system/library/fixtures/TestCounter.tsx` s řízenými `value`, `onValueChange`, `disabled`.
2. Vytvoř malý živý adaptér stránky, který používá export a stávající `Playground`/ovladače. Test B: `src/pages/design-system/library/fixtures/TestCounterPage.tsx`.
3. Přidej `defineCategory` s unikátním `id`, `load` a záznamem `defineEntry` do registru. Pro normální komponentu do `categories`; technický test je podmíněně připojen v `getCategories(true)`:

```tsx
defineCategory({
  id: 'counter', title: 'Counter', description: 'Úprava číselné hodnoty.',
  keyboard: 'Tab, Enter a mezerník.',
  load: () => import('./CounterPage'),
  entries: [defineEntry(Counter, {
    name: 'Counter', source: 'src/design-system/library/Counter.tsx',
    variants: [variant('default', 'Výchozí', {})],
    properties: {value: {kind: 'range'}, onValueChange: {kind: 'callback'}, disabled: {kind: 'boolean'}},
    api: 'value; onValueChange; disabled.', consumers: 'Zatím pouze katalog.'
  })]
})
```

Přehled, menu, lazy render, technické detaily i `?catalog=library&section=counter#design-system` vzniknou bez změny `Library.tsx` či uzavřeného unionu rout. Při doplnění typu do existující rodiny zaregistruj položku v jejích `entries` a rozšiř pouze její adaptér o skutečný render a podporované ovládání. Nevytvářej prázdné stránky.

## Evidence a srovnání

- Každý záznam varianty má dvě nezávislé hodnoty: `design: 'draft' | 'approved'` → **Návrh / Schváleno** a `production: boolean` → **Používá se / Zatím se nepoužívá**.
- Změň hodnotu přímo u existujícího záznamu. Nevytvářej vedle něj schválenou ani produkční kopii. Historie zůstává v Gitu; rozhodnutí patří do Obsidianu.
- Schválený Button má `approved`, ale není migrován do produkční aplikace. Schválení katalogu samo o sobě neschvaluje ostatní komponenty.
- `production` popisuje přesný registrovaný export/variantu. Adaptéry Checkbox, Panel a Status zatím používá katalog; původní tool exporty mají produkční konzumenty uvedené v technickém textu. Znovupoužití jejich základu nepředstírá migraci nových stylů.
- Produkční použití je pouze uvnitř technických detailů. Přehled a příklady nedostávají další produkční štítky.
- „Porovnat varianty“ uvnitř technických detailů vykresluje dva skutečné exporty ze stejných `previewProps` + props vybraných variant. Button reaguje na kliknutí. U řízených nebo složitějších interakcí ponech vlastní živý adaptér, nevytvářej falešné ovládání.

## Jak ověřit technické testy

[Test A — Card](https://iriskax.github.io/axolotl-preview/ds-library-v1-1/?catalog=library&section=surfaces&catalogTests=1#design-system): zvol Materiál → Test · obrys. V technických detailech Card porovnej flat / Test · obrys.

[Test B — nový typ](https://iriskax.github.io/axolotl-preview/ds-library-v1-1/?catalog=library&section=test-counter&catalogTests=1#design-system): +/- mění hodnotu, Disabled blokuje obě tlačítka. Vyzkoušej Tab a mezerník, reload a Back.

Parametr `catalogTests=1` zachová navigace. Bez něj má přehled šest kategorií, Card dva původní materiály a deep link na testovací čítač se bezpečně vrátí na přehled. Obě fixtures jsou **Návrh**, nejsou schváleným designem.

## Kontroly před předáním

```sh
npm ci
npm run typecheck
npm test
node scripts/ds-library/build.mjs
npx playwright install chromium
node scripts/ds-library/check-built.mjs
```

- Registr: skutečné exporty a loadery, jedinečné varianty, oddělené stavy, žádné mutace běžného katalogu při testovacím režimu.
- Browser: všech šest původních stránek, dark/light, klávesnice, portály, invalid/disabled/loading, touch, 320px + zvětšený text, Star Border/reduced motion; test A/B včetně srovnání, navigace a izolace.
- Při zásahu do společného základu porovnej existující varianty. `compare-v1.mjs` srovnává screenshoty, rozměry a vypočtené styly původních playgroundů v dark/light. `VISUAL_HOST` označuje lokální host se dvěma sestavenými verzemi pod cestami `ds-library-v1/` a `ds-library-v1-1/`.
- Produkční header, nástroje, providery, Button a původní styly se nemigrují. Jediné rozšíření komponentového základu V1.1 je opt-in testovací materiál Card.

## Výsledek V1.1 a hranice

75 unit testů (původních 72 + 3 kontrakty registru), typecheck a build. Všech 12 porovnání původních playgroundů (6 stránek × dark/light) má shodné PNG, rozměry i vypočtené styly — [strojový záznam](visual-v1-comparison.json); úplné výsledky browser kontrol jsou v preview `evidence/verification.json` a CI. Nová evidence schválení a opravené počty jsou záměrné textové změny; struktura, ovládání a původní styly zůstávají stejné. Žádné nové runtime závislosti, databáze ani administrace.

Fyzický iPhone/Safari a ruční screen-reader audit nebyly nahrazeny emulací Chromia. Veřejná V1 zůstává zachovanou referencí, V1.1 je aktualizace stejné knihovny v izolované větvi. `main` ani produkční deployment nejsou součástí změny.
