# Axolotl Design System Library V1

> Historická zpráva V1. Aktuální praktický návod a report V1.1: [EXTENDING.md](EXTENDING.md).

Integrovaný katalog v existující aplikaci, izolovaný ve větvi `experiment/ds-library-v1`.

**Preview:** https://iriskax.github.io/axolotl-preview/ds-library-v1/#design-system

## Rozsah a původ

| Stránka | Skutečné exporty | Původ |
| --- | --- | --- |
| Buttons | Button: Primary, Secondary, Ghost, Icon, Destructive; S/M/L | Beze změny schválený `src/design-system/Button`, původní ButtonShowcase, včetně Star Border |
| Inputs & Forms | Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider | Nové nativní prvky a Radix Select; Field a Checkbox používají přímo produkční `tools/legacy/shared/react-ui/fields.jsx` |
| Cards & Surfaces | Card, Panel, InteractiveCard, StateCard | Nové kompozice; Panel přímo používá produkční `components.jsx` |
| Dialogs & Popovers | Dialog, ConfirmationDialog, Popover, Tooltip | Instalované Radix Dialog/Tooltip a Floating UI; žádná nová závislost |
| Feedback & Status | Badge, Status, Alert, Progress, Loading, EmptyState | Badge je existující katalogový export (experiment); Status přímo používá produkční ToolStatus; ostatní nové |
| Navigation & Tabs | Tabs, SegmentedControl, Disclosure, Pagination | Nativní radio/details/buttons, Tabs s roving focus a zachováním obsahu panelů |

26 hlavních exportů a 47 explicitně vyjmenovaných obsahových variant. Velikosti a interakční stavy se do počtu variant nepřičítají. Pomocné exporty: Field, DesignSystemProvider. Konkrétní API, varianty a konzumenti jsou na každé stránce v části **API, zdroj a použití** a v [registry.ts](../../src/pages/design-system/library/registry.tsx).

Produkční původ neznamená, že byly nové katalogové styly zavedeny do nástrojů: Checkbox používají PDF Scout a Obrázky z webu, Panel konvertor obrázků, Status konvertor a Screenshot; Field a původní Select QR Generator a Obrázky z webu. Nový Select používá stejné instalované Radix primitivum, nepřebírá runtime závislost starého tool Selectu na `.ax-ui`.

## Použití a kontrakty

```tsx
import { Button } from '../../design-system/Button';
import { DesignSystemProvider, Field, Input, Dialog } from '../../design-system/library';

<DesignSystemProvider theme="dark" reducedMotion={false}>
  <Dialog trigger={<Button>Upravit</Button>} title="Upravit workspace"
    description="Změny se použijí po uložení.">
    <Field label="Název" hint="Použij krátký srozumitelný název.">
      <Input value={name} onChange={event => setName(event.target.value)} />
    </Field>
  </Dialog>
</DesignSystemProvider>
```

- Provider poskytuje lokální tokeny, téma, motion preference a hostitele portálů. Nemění globální preference. Katalog je přebírá z existujícího PreferencesProvideru; vlastní kořen nástroje musí dostat explicitní provider a své původní závislosti.
- Input/Textarea přeposílají nativní props a ref. Field vlastní vazby label/hint/error. Pro Select lze použít řízené i neřízené Radix Root props, options, size a ARIA vazby.
- Checkbox podporuje `boolean | 'indeterminate'`; RadioGroup a Slider jsou řízené; Switch přeposílá nativní checkbox props. Nepoužívat placeholder jako jediný label.
- Dialog vyžaduje název, popis a trigger podporující ref. `open/onOpenChange` jsou volitelné. ConfirmationDialog přijímá async `onConfirm`, zaměří Zrušit, po dobu operace blokuje zavření a při chybě nabídne opakování.
- Popover je nemodální, vrací focus a přepočítává polohu při scroll/resize. Uvnitř dialogu portáluje do jeho DOM hranice, aby spolu nesoupeřily focus managery. Tooltip není náhradou přístupného názvu a trigger musí být focusovatelný.
- Instalované Radix Dialog a Select používají rozdílné verze DismissableLayer. Nové Select/Popover proto vlastní Escape na window capture hranici; parent dialog se při otevřené podřízené vrstvě nezavře. Závislosti ani produkční header se kvůli tomu nemění.
- InteractiveCard je jedno nativní tlačítko; nevkládat do něj další tlačítka či odkazy. StateCard skládá skutečné feedback komponenty a dostává `action: ReactNode`.
- Tabs vyžadují unikátní hodnoty a platnou aktivní položku; automatická aktivace při šipkách, Home/End a přeskočení disabled. Obsah neaktivních panelů zůstává zachovaný. Pagination je řízená a ohraničuje rozsah.

## Izolace a zachovaná historie

Jediná změna produkčního vstupu je rozdělení `src/pages/DesignSystem.tsx`: nový katalog je výchozí pro `#design-system`, původní katalog zůstává na `?catalog=legacy#design-system` a Header Lab na `?catalog=headers#design-system`. Kategorie používají `?catalog=library&section=forms#design-system` (obdobně buttons/surfaces/overlays/feedback/navigation). Back a přímé odkazy fungují.

Header, Dashboard, nástroje, tool mount/unmount, providery, URL bridge, globální styly a Button nejsou upraveny. Dva starší testy pouze explicitně otevírají zachovanou legacy větev katalogu. Závislosti a lockfile jsou stejné. Knihovna není importována do nástrojů.

Nové tokeny jsou omezené na `.axo-ds-scope`. Violet `#7C3AED` a Blue `#0050FF` jsou potvrzené; povrchy, významové barvy, radius, spacing a typografie jsou pracovní V1 k vizuálnímu schválení. Hover je neutrální, vybraný stav fialový, focus-visible jednotný. Star Border zůstává pouze opt-in Button efektem.

## Ověření

```sh
npm run typecheck
npm test
node scripts/ds-library/build.mjs
npx playwright install chromium
node scripts/ds-library/check-built.mjs
# Veřejná URL, stejná sada:
LIBRARY_URL=https://iriskax.github.io/axolotl-preview/ds-library-v1/ node scripts/ds-library/check.mjs
```

`PLAYWRIGHT_CHROME_EXECUTABLE` může zvolit lokální Chromium, jinak se použije Playwright browser. `LIBRARY_EVIDENCE` mění cílový adresář důkazů.

- 72 unit testů v 16 souborech: zahrnují původní sadu i 5 nových testů skutečných kontraktů knihovny.
- Browser kontrola: overview a šest kategorií dark/light, axe, šířky 1366/390/320, touch emulace, 200% text, validace a první neplatné pole, všech sedm form disabled/invalid, keyboard radio/slider/tabs/disclosure, reálné async interakce a stránkování.
- Portály: vnořený Select i Popover, Escape, návrat focusu, focus trap, cancel-first potvrzení, Tooltip na focus a přenos tématu. Button skutečný animovaný Star Border a reduced motion. Smoke test původního header Settings.
- Screenshoty a strojový výsledek vznikají v `evidence/` a jsou součástí izolovaného veřejného preview. `provenance.json` uvádí commit a hashe zdrojů; `preservation.json` dokládá zachování předchozích preview.

## Omezení a stav schválení

Všech šest požadovaných stránek je implementováno; žádná není placeholder. Nové komponenty a pracovní tokeny čekají na vizuální a funkční schválení. Ukázkové akce pracují s lokálním React stavem, neukládají ani nemažou skutečná uživatelská data. Nevzniká dashboard engine ani migrace nástrojů.

Automatizace používá Chromium včetně mobilní touch emulace, nikoli fyzický iPhone/Safari nebo ruční screen-reader audit. Tyto kontroly zůstávají před širší produkční integrací. Build upozorňuje na existující hlavní app chunk okolo 504 kB; tento úkol nemění bundling celé aplikace.

Veřejné preview se přidává jako jediný nový adresář k poslednímu úspěšnému kompletnímu Pages artefaktu. Před buildem i publikací se ověřuje aktuální baseline, společný deploy lock a preview host; všechny starší soubory musí mít nezměněné SHA-256. Žádný merge do main ani produkční deploy není součástí této práce.
