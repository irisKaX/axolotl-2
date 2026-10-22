> **Aktuální pravidlo:** jediným katalogem je Library V1.1; nové vizuální změny vznikají zde. Převzatý Header/Dashboard a Brand & Mascot, vyřazení historických preview a aktuální build popisuje [CONSOLIDATION.md](CONSOLIDATION.md). Následující historické počty a odkazy na zachovaná aktivní preview již neplatí. Stav schválení se stále eviduje po jednotlivých variantách.

# Rozšiřování Design System Library V1.1

**Katalog:** https://iriskax.github.io/axolotl-preview/ds-library-v1-1/#design-system  
**Větev:** `experiment/ds-library-v1-1` · navazuje na V1 `62808f182479c947cf70e7e2918b5fba74b321ad`.

Jedna knihovna, jeden záznam varianty, jedna stránka rodiny. Není potřeba nový experiment, kopie schválené komponenty ani administrační rozhraní.

Aktuální vizuální pravidla a hranice původních exportů: [VISUAL-UNIFICATION.md](VISUAL-UNIFICATION.md).

Colors & Gradients má [stručný návod a hranice kontrastní kontroly](COLORS.md). Nový záznam v `colors/paints.ts` automaticky rozšíří stávající stránku. [Dashboard Widgets](DASHBOARD-WIDGETS.md) přidává skutečné řízené widgety a oddělené lokální adaptéry. Katalog má nyní devět běžných kategorií, s testovacím Counterem deset.

## Kde změnu provést

| Odpovědnost | Soubor |
| --- | --- |
| Skutečné komponenty a tokeny | `src/design-system/Button/`, `src/design-system/library/`, `src/design-system/widgets/` |
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
- Sjednocený Button má `draft`, protože revidovaný vzhled čeká na schválení; není migrován do produkční aplikace. Schválení katalogu samo o sobě neschvaluje ostatní komponenty.
- `production` popisuje přesný registrovaný export/variantu. Adaptéry Checkbox, Panel a Status zatím používá katalog; původní tool exporty mají produkční konzumenty uvedené v technickém textu. Znovupoužití jejich základu nepředstírá migraci nových stylů.
- Produkční použití je pouze uvnitř technických detailů. Přehled a příklady nedostávají další produkční štítky.
- „Porovnat varianty“ uvnitř technických detailů vykresluje dva skutečné exporty ze stejných `previewProps` + props vybraných variant. Button reaguje na kliknutí. U řízených nebo složitějších interakcí ponech vlastní živý adaptér, nevytvářej falešné ovládání.

## Jak ověřit technické testy

[Test A — Card](https://iriskax.github.io/axolotl-preview/ds-library-v1-1/?catalog=library&section=surfaces&catalogTests=1#design-system): zvol Materiál → Test · obrys. V technických detailech Card porovnej Halo Soft / Test · obrys.

[Test B — nový typ](https://iriskax.github.io/axolotl-preview/ds-library-v1-1/?catalog=library&section=test-counter&catalogTests=1#design-system): +/- mění hodnotu, Disabled blokuje obě tlačítka. Vyzkoušej Tab a mezerník, reload a Back.

Přepínač **Zobrazit testovací komponenty** v horní liště ovládá parametr `catalogTests=1` bez reloadu. Back/Forward obnovuje jeho stav. Vypnutí na testovací stránce vrací na přehled; ostatní otevřené playgroundy zachovávají nastavení. Vybraný testovací materiál Card a porovnání po dobu vypnutí zobrazí dostupnou běžnou variantu. Parametr `catalogTests=1` zachová navigace. Bez něj má přehled devět kategorií, Card dvě úrovně Halo Soft (flat/raised) a deep link na testovací čítač se bezpečně vrátí na přehled. Obě fixtures jsou **Návrh**, nejsou schváleným designem.

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
- `navigation-reference.mjs` porovnává čtyři skutečné navigační komponenty v dark/light: screenshoty a computed styles default/hover/focus proti přesnému předchozímu preview. `REFERENCE_URL` a `COMPARE_URL` označují dvě sestavené verze. Původní `compare-v1.mjs` je historický nástroj pro nezměněný katalog; po záměrném sjednocení není release gate pro ostatní stránky.
- `check-surfaces.mjs` ověřuje jediný aktivní materiál Halo Soft, všech šest exportů, funkční stavy, touch a nový srovnávací přehled. Testy odstraněných pointer/tilt efektů jsou odstraněné spolu s jejich implementací.
- Produkční Header, nástroje, Dashboard, Workspace a extension jsou nedotčené. Sdílený materiál zapíná pouze `DesignSystemProvider appearance="unified"`; výchozí prostředí je zpětně kompatibilní `original`.

## Výsledek aktuální iterace

Aktuální výsledky: [VISUAL-UNIFICATION.md](VISUAL-UNIFICATION.md), `evidence/verification.json`, `evidence/navigation-reference.json` a GitHub Actions. Registry, deep links, testovací režim a skutečné exporty se zachovávají. Žádné nové runtime závislosti, databáze ani administrace.

Fyzický iPhone/Safari a ruční screen-reader audit nebyly nahrazeny emulací Chromia. Veřejná V1 zůstává zachovanou referencí, V1.1 je aktualizace stejné knihovny v izolované větvi. `main` ani produkční deployment nejsou součástí změny.

[Dashboard Layout Studio](DASHBOARD-LAYOUT.md) skládá existující widgety do pracovního návrhu. Kompaktní režim katalogu je opt-in metadatum `workspace`; ostatní stránky zachovávají běžné rozložení.
