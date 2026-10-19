import { ColorSample } from "./colors/ColorSample";
import { paints } from "./colors/paints";
import { Play, Bookmark, Trash2 } from "lucide-react";
import { Button } from "../../../design-system/Button";
import * as UI from "../../../design-system/library";
import { TestCounter } from "../../../design-system/library/fixtures/TestCounter";
import {
  defineEntry,
  defineCategory,
  variant,
  selectProperty,
  type Category,
  type Entry,
} from "./model";
export type { CategoryId, Entry, Category, PageProps } from "./model";
const haloVariants = () =>
  UI.haloIntensities.map((intensity) =>
    variant(`halo-${intensity}`, `Halo ${intensity}`, {
      family: "halo" as const,
      halo: { intensity },
    }),
  );
const surfaceVariants = () =>
  UI.surfaceFamilies.map((f) => variant(f.id, f.label, { family: f.id }));
const familyProperty = selectProperty(UI.surfaceFamilies.map((f) => f.id));
const controlSizes = selectProperty(["small", "medium", "large"]);
// Approval is per visual/semantic variant, not inherited from catalog approval.
// These exact catalog exports have not been migrated into production tools.
export const categories: Category[] = [
  defineCategory({
    id: "buttons",
    title: "Buttons",
    description:
      "Akce a příkazy. Schválený Lens 02 Clean Icon se skutečným Star Border.",
    keyboard:
      "Tab → focus-visible; Enter a mezerník → akce. Loading zachovává focus a blokuje další aktivaci.",
    load: () => import("../ButtonShowcase"),
    entries: [
      defineEntry(Button, {
        name: "Button",
        label: "Button",
        source: "src/design-system/Button/Button.tsx",
        consumers:
          "Skutečný katalog a ds-button-lens-02 preview. Vzhled schválen, produkční migrace čeká.",
        api: "variant; size: small | medium | large; motion: none | star-border; starBorder: {color,duration}; loading; disabled; icon; nativní props a ref.",
        variants: [
          variant(
            "primary",
            "Primary",
            { variant: "primary" as const },
            "approved",
          ),
          variant(
            "secondary",
            "Secondary",
            { variant: "secondary" as const },
            "approved",
          ),
          variant("ghost", "Ghost", { variant: "ghost" as const }, "approved"),
          variant(
            "icon",
            "Icon",
            {
              variant: "icon" as const,
              children: undefined,
              icon: <Bookmark strokeWidth={1.7} />,
              "aria-label": "Uložit do oblíbených",
            },
            "approved",
          ),
          variant(
            "destructive",
            "Destructive",
            {
              variant: "destructive" as const,
              children: "Odstranit soubor",
              icon: <Trash2 strokeWidth={1.7} />,
            },
            "approved",
          ),
        ],
        properties: {
          size: selectProperty(["small", "medium", "large"]),
          motion: selectProperty(["none", "star-border"]),
          disabled: { kind: "boolean" },
          loading: { kind: "boolean" },
          starBorder: { kind: "node", note: "color a duration v sekundách" },
          reducedMotion: { kind: "boolean" },
        },
        previewProps: {
          children: "Spustit kontrolu",
          icon: <Play strokeWidth={1.7} />,
        },
      }),
    ],
  }),
  defineCategory({
    id: "forms",
    title: "Inputs & Forms",
    description:
      "Psaní, výběr a validace s propojenými labely a chybovými zprávami.",
    keyboard:
      "Tab mezi poli; šipky v radio a slideru; Select: Enter/šipky, psaní, Escape. Chyba formuláře zaměří první neplatné pole.",
    load: () => import("./FormsPage"),
    entries: [
      defineEntry(UI.Input, {
        name: "Input",
        label: "Input",
        source: "src/design-system/library/Forms.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "Nativní input props + ref; size: small | medium | large. Field poskytuje label, hint, error.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          size: controlSizes,
          type: selectProperty(["text", "email", "url"]),
          disabled: { kind: "boolean" },
          "aria-invalid": { kind: "boolean" },
        },
      }),
      defineEntry(UI.Textarea, {
        name: "Textarea",
        label: "Textarea",
        source: "src/design-system/library/Forms.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "Nativní textarea props + ref; size; rows; Field.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          size: controlSizes,
          rows: { kind: "range" },
          disabled: { kind: "boolean" },
          "aria-invalid": { kind: "boolean" },
        },
      }),
      defineEntry(UI.Select, {
        name: "Select",
        label: "Select",
        source: "src/design-system/library/Forms.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "Radix Root props; options: {value,label,disabled}[]; size; id; aria-*.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          size: controlSizes,
          disabled: { kind: "boolean" },
          "aria-invalid": { kind: "boolean" },
          options: { kind: "node" },
          value: { kind: "text" },
          onValueChange: { kind: "callback" },
        },
      }),
      defineEntry(UI.Checkbox, {
        name: "Checkbox",
        label: "Checkbox",
        source: "src/design-system/library/Forms.tsx",
        consumers:
          "Tento adaptér a jeho katalogové styly zatím nejsou používány v produkci. Přímé použití ToolCheckbox z fields.jsx. Konzumenti: PDF Scout a Obrázky z webu; v knihovně typový adaptér a lokální styly.",
        api: "checked; onCheckedChange; label; hint; error; disabled; required; name.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          checked: {
            kind: "select",
            options: [
              { value: "false", label: "Unchecked" },
              { value: "true", label: "Checked" },
              { value: "indeterminate", label: "Indeterminate" },
            ],
          },
          disabled: { kind: "boolean" },
          error: { kind: "text" },
          hint: { kind: "text" },
          onCheckedChange: { kind: "callback" },
        },
      }),
      defineEntry(UI.RadioGroup, {
        name: "RadioGroup",
        label: "Radio",
        source: "src/design-system/library/Forms.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "label; options; value; onValueChange; name; disabled; hint; error.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          options: { kind: "node" },
          value: { kind: "text" },
          disabled: { kind: "boolean" },
          error: { kind: "text" },
          onValueChange: { kind: "callback" },
        },
      }),
      defineEntry(UI.Switch, {
        name: "Switch",
        label: "Switch",
        source: "src/design-system/library/Forms.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "label; checked/onChange a nativní input props; hint; error.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          checked: { kind: "boolean" },
          disabled: { kind: "boolean" },
          error: { kind: "text" },
          onChange: { kind: "callback" },
        },
      }),
      defineEntry(UI.Slider, {
        name: "Slider",
        label: "Slider",
        source: "src/design-system/library/Forms.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "label; value; onValueChange; min/max/step; disabled; hint; error.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          value: { kind: "range", min: 0, max: 100 },
          min: { kind: "range" },
          max: { kind: "range" },
          step: { kind: "range" },
          disabled: { kind: "boolean" },
          error: { kind: "text" },
          onValueChange: { kind: "callback" },
        },
      }),
    ],
  }),
  defineCategory({
    id: "surfaces",
    title: "Cards & Surfaces",
    description:
      "Obsah, pracovní plochy a smysluplné prázdné, načítací a chybové stavy.",
    keyboard:
      "Interactive Card je nativní button: Tab, Enter, mezerník. Obsahové karty nejsou zbytečně v tab pořadí.",
    load: () => import("./SurfacesPage"),
    entries: [
      defineEntry(UI.Card, {
        name: "Card",
        label: "Card",
        source: "src/design-system/library/Surfaces.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "family?: obsidian | halo | studio; title; children; footer; material; density: compact | comfortable.",
        variants: [
          variant("flat", "flat", { material: "flat" as const }),
          variant("raised", "raised", { material: "raised" as const }),
          ...surfaceVariants(),
          ...haloVariants(),
        ],
        properties: {
          family: familyProperty,
          halo: {
            kind: "node",
            note: "intensity; effects; accent; disabled. Volitelné Halo 2.0.",
          },
          density: selectProperty(["compact", "comfortable"]),
          title: { kind: "text" },
          children: { kind: "node" },
          footer: { kind: "node" },
        },
        previewProps: {
          title: "Přehled kontroly",
          children: <p>Stejný obsah pro porovnání povrchů.</p>,
        },
      }),
      defineEntry(UI.Panel, {
        name: "Panel",
        label: "Panel",
        source: "src/design-system/library/Surfaces.tsx",
        consumers:
          "Tento adaptér a jeho katalogové styly zatím nejsou používány v produkci. Skutečný ToolPanel z components.jsx; konvertor obrázků. Lokální katalogové styly.",
        api: "family?: obsidian | halo | studio; HTML section props; children; className.",
        variants: [
          variant("default", "Výchozí", {}),
          ...surfaceVariants(),
          ...haloVariants(),
        ],
        properties: {
          family: familyProperty,
          halo: {
            kind: "node",
            note: "intensity; effects; accent; disabled. Volitelné Halo 2.0.",
          },
          children: { kind: "node" },
          className: { kind: "text" },
        },
      }),
      defineEntry(UI.InteractiveCard, {
        name: "InteractiveCard",
        label: "Interactive Card",
        source: "src/design-system/library/Surfaces.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "family?: obsidian | halo | studio; title; description; nativní button props; disabled; aria-pressed. Nevkládat vnořené ovládací prvky.",
        variants: [
          variant("default", "Výchozí", {}),
          ...surfaceVariants(),
          ...haloVariants(),
        ],
        properties: {
          family: familyProperty,
          halo: {
            kind: "node",
            note: "intensity; effects; accent; disabled. Volitelné Halo 2.0.",
          },
          loading: { kind: "boolean" },
          disabled: { kind: "boolean" },
          "aria-pressed": { kind: "boolean" },
          title: { kind: "text" },
          description: { kind: "text" },
          onClick: { kind: "callback" },
        },
      }),
      defineEntry(UI.StateCard, {
        name: "StateCard",
        label: "State Card",
        source: "src/design-system/library/Surfaces.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "family?: obsidian | halo | studio; state; action: ReactNode. Skládá Card + EmptyState/Loading/Alert.",
        variants: [
          variant("default", "Výchozí", {}),
          ...surfaceVariants(),
          ...haloVariants(),
        ],
        properties: {
          family: familyProperty,
          halo: {
            kind: "node",
            note: "intensity; effects; accent; disabled. Volitelné Halo 2.0.",
          },
          state: selectProperty([
            "empty",
            "loading",
            "error",
            "warning",
            "success",
          ]),
          action: { kind: "node" },
        },
      }),
      defineEntry(UI.ToolCard, {
        name: "ToolCard",
        label: "Tool Card",
        source: "src/design-system/library/Surfaces.tsx",
        consumers: "Cards & Surfaces V1.1; žádná produkční integrace.",
        api: "family; title; description; metadata; action. Akce je samostatný ovládací prvek.",
        variants: [...surfaceVariants(), ...haloVariants()],
        properties: {
          family: familyProperty,
          halo: {
            kind: "node",
            note: "intensity; effects; accent; disabled. Volitelné Halo 2.0.",
          },
          title: { kind: "text" },
          description: { kind: "text" },
          metadata: { kind: "node" },
          action: { kind: "node" },
        },
        previewProps: {
          title: "Kontrola metadat",
          description: "Titulky a popisy stránky",
          action: <Button size="small">Otevřít</Button>,
        },
      }),
      defineEntry(UI.WidgetCard, {
        name: "WidgetCard",
        label: "Dashboard Widget Card",
        source: "src/design-system/library/Surfaces.tsx",
        consumers:
          "Cards & Surfaces V1.1; žádný dashboard ani drag & drop engine se nemění.",
        api: "family; title; children; actions; footer. Stav a příkazy řídí konzument.",
        variants: [...surfaceVariants(), ...haloVariants()],
        properties: {
          family: familyProperty,
          halo: {
            kind: "node",
            note: "intensity; effects; accent; disabled. Volitelné Halo 2.0.",
          },
          title: { kind: "text" },
          children: { kind: "node" },
          actions: { kind: "node" },
          footer: { kind: "node" },
        },
        previewProps: {
          title: "Kontrola projektu",
          children: <p>24 hotových kontrol</p>,
        },
      }),
    ],
  }),
  defineCategory({
    id: "overlays",
    title: "Dialogs & Popovers",
    description:
      "Skutečné portály s focus managementem, návratem na trigger a řízeným zavíráním.",
    keyboard:
      "Enter otevře. Escape zavře nejvyšší vrstvu a vrátí focus. Dialog drží Tab uvnitř; Tooltip funguje i na focus.",
    load: () => import("./OverlaysPage"),
    entries: [
      defineEntry(UI.Dialog, {
        name: "Dialog",
        label: "Dialog",
        source: "src/design-system/library/Overlays.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "trigger; title; description; children; open/onOpenChange; size: medium | large. Radix Dialog.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          size: {
            kind: "select",
            options: [
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ],
          },
          open: { kind: "boolean" },
          onOpenChange: { kind: "callback" },
          trigger: { kind: "node" },
          title: { kind: "text" },
          description: { kind: "text" },
        },
      }),
      defineEntry(UI.ConfirmationDialog, {
        name: "ConfirmationDialog",
        label: "Confirmation Dialog",
        source: "src/design-system/library/Overlays.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "trigger; title; description; confirmLabel; onConfirm: () => void | Promise<void>. Výchozí focus na Zrušit; busy + error.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          trigger: { kind: "node" },
          title: { kind: "text" },
          description: { kind: "text" },
          confirmLabel: { kind: "text" },
          onConfirm: { kind: "callback" },
        },
      }),
      defineEntry(UI.Popover, {
        name: "Popover",
        label: "Popover",
        source: "src/design-system/library/Overlays.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "trigger; title; children. Floating UI: positioning, Escape, focus a kliknutí mimo.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          trigger: { kind: "node" },
          title: { kind: "text" },
          children: { kind: "node" },
        },
      }),
      defineEntry(UI.Tooltip, {
        name: "Tooltip",
        label: "Tooltip",
        source: "src/design-system/library/Overlays.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "children: jeden focusovatelný ReactElement; text. Radix Tooltip s vlastním Providerem a portálem.",
        variants: [variant("default", "Výchozí", {})],
        properties: { children: { kind: "node" }, text: { kind: "text" } },
      }),
    ],
  }),
  defineCategory({
    id: "feedback",
    title: "Feedback & Status",
    description:
      "Významové stavy, průběh operace a další krok, když zatím není co zobrazit.",
    keyboard:
      "Informační prvky nejsou focusovatelné. Zavření Alertu a akce Empty State fungují jako běžná tlačítka.",
    load: () => import("./FeedbackPage"),
    entries: [
      defineEntry(UI.Badge, {
        name: "Badge",
        label: "Badge",
        source: "src/components/ui/Badge.tsx",
        consumers:
          "Existující export katalogu, není doložené produkční použití nástroji. Knihovna jej přebírá se scoped styly.",
        api: "tone; children.",
        variants: [
          variant("neutral", "neutral", { tone: "neutral" as const }),
          variant("success", "success", { tone: "success" as const }),
          variant("warning", "warning", { tone: "warning" as const }),
          variant("error", "error", { tone: "error" as const }),
        ],
        properties: { children: { kind: "node" } },
        previewProps: { children: "Ukázkový stav" },
      }),
      defineEntry(UI.Status, {
        name: "Status",
        label: "Status",
        source: "src/design-system/library/Feedback.tsx",
        consumers:
          "Tento adaptér a jeho katalogové styly zatím nejsou používány v produkci. Skutečný ToolStatus z components.jsx; Screenshot a konvertor obrázků. Text nese význam, barva jej doplňuje.",
        api: "state; children.",
        variants: [
          variant("neutral", "neutral", { state: "neutral" as const }),
          variant("success", "success", { state: "success" as const }),
          variant("warning", "warning", { state: "warning" as const }),
          variant("error", "error", { state: "error" as const }),
        ],
        properties: { children: { kind: "node" } },
        previewProps: { children: "Ukázkový stav" },
      }),
      defineEntry(UI.Alert, {
        name: "Alert",
        label: "Alert",
        source: "src/design-system/library/Feedback.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "title; children; tone; onDismiss?; error používá role=alert, ostatní role=status.",
        variants: [
          variant("info", "info", { tone: "info" as const }),
          variant("success", "success", { tone: "success" as const }),
          variant("warning", "warning", { tone: "warning" as const }),
          variant("error", "error", { tone: "error" as const }),
        ],
        properties: {
          title: { kind: "text" },
          children: { kind: "node" },
          onDismiss: { kind: "callback" },
        },
        previewProps: {
          title: "Ukázkové upozornění",
          children: "Stejná zpráva v každé variantě.",
        },
      }),
      defineEntry(UI.Progress, {
        name: "Progress",
        label: "Progress",
        source: "src/design-system/library/Feedback.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "label; value?: 0–100. Bez value statický neurčitý progress s ARIA rolí.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          value: {
            kind: "range",
            min: 0,
            max: 100,
            note: "undefined znamená neurčitý průběh",
          },
          label: { kind: "text" },
        },
      }),
      defineEntry(UI.Loading, {
        name: "Loading",
        label: "Loading",
        source: "src/design-system/library/Feedback.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "label; layout. role=status; při reduced motion statický indikátor.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          layout: {
            kind: "select",
            options: [
              { value: "inline", label: "Inline" },
              { value: "block", label: "Block" },
            ],
          },
          label: { kind: "text" },
        },
      }),
      defineEntry(UI.EmptyState, {
        name: "EmptyState",
        label: "Empty State",
        source: "src/design-system/library/Feedback.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "title; description; action?: ReactNode.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          title: { kind: "text" },
          description: { kind: "text" },
          action: { kind: "node" },
        },
      }),
    ],
  }),
  defineCategory({
    id: "navigation",
    title: "Navigation & Tabs",
    description:
      "Přepínání obsahu, voleb, rozbalování a stránkování bez dalšího hlavního headeru.",
    keyboard:
      "Tabs: ←/→, Home/End; Segmented: nativní radio šipky; Disclosure: Enter/mezerník; Pagination: Tab a Enter.",
    load: () => import("./NavigationPage"),
    entries: [
      defineEntry(UI.Tabs, {
        name: "Tabs",
        label: "Tabs",
        source: "src/design-system/library/Navigation.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "items: {value,label,disabled,content}[]; value; onValueChange; label. Automatická aktivace, roving tabIndex.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          items: { kind: "node", note: "label/value/disabled/content" },
          value: { kind: "text" },
          onValueChange: { kind: "callback" },
        },
      }),
      defineEntry(UI.SegmentedControl, {
        name: "SegmentedControl",
        label: "Segmented Control",
        source: "src/design-system/library/Navigation.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "items; value; onValueChange; label; disabled. Nativní radio group.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          items: { kind: "node" },
          value: { kind: "text" },
          disabled: { kind: "boolean" },
          onValueChange: { kind: "callback" },
        },
      }),
      defineEntry(UI.Disclosure, {
        name: "Disclosure",
        label: "Disclosure",
        source: "src/design-system/library/Navigation.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "title; children; open?; onOpenChange?. Nativní details/summary.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          open: { kind: "boolean" },
          onOpenChange: { kind: "callback" },
          title: { kind: "text" },
          children: { kind: "node" },
        },
      }),
      defineEntry(UI.Pagination, {
        name: "Pagination",
        label: "Pagination",
        source: "src/design-system/library/Navigation.tsx",
        consumers: "Knihovna V1; čeká na schválení a budoucí integraci.",
        api: "page; count; onPageChange; label?. Ohraničený výběr a aria-current=page.",
        variants: [variant("default", "Výchozí", {})],
        properties: {
          page: { kind: "range" },
          count: { kind: "range", min: 1, max: 12 },
          onPageChange: { kind: "callback" },
        },
      }),
    ],
  }),
  defineCategory({
    id: "colors",
    title: "Colors & Gradients",
    description:
      "Barevné vzorky, přesné CSS gradienty a živý náhled na skutečných komponentách.",
    keyboard:
      "Tab → hodnota; Enter nebo mezerník → kopírování. Kliknutí na vzorek otevře playground. Náhled dark/light nemění preference aplikace.",
    isolatedTheme: true,
    load: () => import("./ColorsPage"),
    entries: [
      defineEntry(ColorSample, {
        name: "ColorSample",
        label: "Barvy a gradienty",
        source: "src/pages/design-system/library/colors/ColorSample.tsx",
        consumers:
          "Nové barvy a gradienty jsou návrhové možnosti katalogu. Produkční použití zde eviduje barevnou hodnotu: O2 Blue používá Button Primary a CursorEffects, Axolotl Violet header. Ostatní role čekají na schválení. Registr: src/pages/design-system/library/colors/paints.ts.",
        api: "paintId; selected; onSelect. Hodnota, designový stav a produkční použití pocházejí z typovaného registru paints.ts.",
        variants: paints.map((p) =>
          variant(p.id, p.name, { paintId: p.id }, p.design, p.production),
        ),
        properties: {
          paintId: selectProperty(paints.map((p) => p.id)),
          selected: { kind: "boolean" },
          onSelect: { kind: "callback" },
        },
      }),
    ],
  }),
];
const counter = defineCategory({
  id: "test-counter",
  title: "Test Counter",
  description:
    "Technická fixture: nový typ se skutečným React exportem. Návrh.",
  keyboard: "Tab, Enter a mezerník mění hodnotu. Disabled blokuje obě akce.",
  load: () => import("./fixtures/TestCounterPage"),
  entries: [
    defineEntry(TestCounter, {
      name: "TestCounter",
      source: "src/design-system/library/fixtures/TestCounter.tsx",
      consumers: "Pouze technický test rozšiřitelnosti.",
      api: "value; onValueChange; disabled.",
      variants: [variant("default", "Výchozí", {})],
      properties: {
        value: { kind: "range" },
        onValueChange: { kind: "callback" },
        disabled: { kind: "boolean" },
      },
    }),
  ],
});
export function getCategories(testMode = false): Category[] {
  if (!testMode) return categories;
  return [
    ...categories.map((category) =>
      category.id !== "surfaces"
        ? category
        : {
            ...category,
            entries: category.entries.map((entry) =>
              entry.name !== "Card"
                ? entry
                : {
                    ...entry,
                    variants: [
                      ...entry.variants,
                      variant("outline-test", "Test · obrys", {
                        material: "outline-test" as const,
                      }),
                    ],
                  },
            ),
          },
    ),
    counter,
  ];
}
export const buttonEntry = categories[0].entries[0];
export function findEntry(name: string, list: Category[] = categories): Entry {
  const entry = list
    .flatMap((c) => c.entries)
    .find((e) => e.name === name || e.label === name);
  if (!entry) throw new Error(`Unregistered component: ${name}`);
  return entry;
}
export function componentOptions(category: Category) {
  return category.entries.map((e) => ({ value: e.label, label: e.label }));
}
export const sourceUrl = (path: string) =>
  `https://github.com/irisKaX/axolotl-2/blob/experiment/ds-library-v1-1/${path}`;
