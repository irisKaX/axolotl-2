export type CategoryId =
  | "buttons"
  | "forms"
  | "surfaces"
  | "overlays"
  | "feedback"
  | "navigation";
export type Entry = {
  name: string;
  source: string;
  status: "produkční" | "nová komponenta" | "experiment";
  variants: string[];
  consumers: string;
  api: string;
};
const root = "src/design-system/library/";
const entry = (
  name: string,
  file: string,
  variants: string[],
  api: string,
  status: Entry["status"] = "nová komponenta",
  consumers = "Knihovna V1; čeká na schválení a budoucí integraci.",
): Entry => ({ name, source: root + file, status, variants, consumers, api });
export const categories: {
  id: CategoryId;
  title: string;
  description: string;
  keyboard: string;
  entries: Entry[];
}[] = [
  {
    id: "buttons",
    title: "Buttons",
    description:
      "Akce a příkazy. Schválený Lens 02 Clean Icon se skutečným Star Border.",
    keyboard:
      "Tab → focus-visible; Enter a mezerník → akce. Loading zachovává focus a blokuje další aktivaci.",
    entries: [
      {
        name: "Button",
        source: "src/design-system/Button/Button.tsx",
        status: "nová komponenta",
        variants: ["Primary", "Secondary", "Ghost", "Icon", "Destructive"],
        consumers:
          "Skutečný katalog a ds-button-lens-02 preview. Vzhled schválen, produkční migrace čeká.",
        api: "variant; size: small | medium | large; motion: none | star-border; starBorder: {color,duration}; loading; disabled; icon; nativní props a ref.",
      },
    ],
  },
  {
    id: "forms",
    title: "Inputs & Forms",
    description:
      "Psaní, výběr a validace s propojenými labely a chybovými zprávami.",
    keyboard:
      "Tab mezi poli; šipky v radio a slideru; Select: Enter/šipky, psaní, Escape. Chyba formuláře zaměří první neplatné pole.",
    entries: [
      entry(
        "Input",
        "Forms.tsx",
        ["text", "email", "url"],
        "Nativní input props + ref; size: small | medium | large. Field poskytuje label, hint, error.",
      ),
      entry(
        "Textarea",
        "Forms.tsx",
        ["víceřádková"],
        "Nativní textarea props + ref; size; rows; Field.",
      ),
      entry(
        "Select",
        "Forms.tsx",
        ["jednoduchý výběr"],
        "Radix Root props; options: {value,label,disabled}[]; size; id; aria-*.",
      ),
      {
        ...entry(
          "Checkbox",
          "Forms.tsx",
          ["binary", "indeterminate"],
          "checked; onCheckedChange; label; hint; error; disabled; required; name.",
          "produkční",
          "Přímé použití ToolCheckbox z fields.jsx. Konzumenti: PDF Scout a Obrázky z webu; v knihovně typový adaptér a lokální styly.",
        ),
        source: "src/tools/legacy/shared/react-ui/fields.jsx",
      },
      entry(
        "RadioGroup",
        "Forms.tsx",
        ["nativní skupina"],
        "label; options; value; onValueChange; name; disabled; hint; error.",
      ),
      entry(
        "Switch",
        "Forms.tsx",
        ["přepínač"],
        "label; checked/onChange a nativní input props; hint; error.",
      ),
      entry(
        "Slider",
        "Forms.tsx",
        ["jedna hodnota"],
        "label; value; onValueChange; min/max/step; disabled; hint; error.",
      ),
    ],
  },
  {
    id: "surfaces",
    title: "Cards & Surfaces",
    description:
      "Obsah, pracovní plochy a smysluplné prázdné, načítací a chybové stavy.",
    keyboard:
      "Interactive Card je nativní button: Tab, Enter, mezerník. Obsahové karty nejsou zbytečně v tab pořadí.",
    entries: [
      entry(
        "Card",
        "Surfaces.tsx",
        ["flat", "raised"],
        "title; children; footer; material; density: compact | comfortable.",
      ),
      {
        ...entry(
          "Panel",
          "Surfaces.tsx",
          ["pracovní plocha"],
          "HTML section props; children; className.",
          "produkční",
          "Skutečný ToolPanel z components.jsx; konvertor obrázků. Lokální katalogové styly.",
        ),
        source: "src/tools/legacy/shared/react-ui/components.jsx",
      },
      entry(
        "InteractiveCard",
        "Surfaces.tsx",
        ["akční karta"],
        "title; description; nativní button props; disabled; aria-pressed. Nevkládat vnořené ovládací prvky.",
      ),
      entry(
        "StateCard",
        "Surfaces.tsx",
        ["empty", "loading", "error"],
        "state; action: ReactNode. Skládá Card + EmptyState/Loading/Alert.",
      ),
    ],
  },
  {
    id: "overlays",
    title: "Dialogs & Popovers",
    description:
      "Skutečné portály s focus managementem, návratem na trigger a řízeným zavíráním.",
    keyboard:
      "Enter otevře. Escape zavře nejvyšší vrstvu a vrátí focus. Dialog drží Tab uvnitř; Tooltip funguje i na focus.",
    entries: [
      entry(
        "Dialog",
        "Overlays.tsx",
        ["modal"],
        "trigger; title; description; children; open/onOpenChange; size: medium | large. Radix Dialog.",
      ),
      entry(
        "ConfirmationDialog",
        "Overlays.tsx",
        ["destruktivní potvrzení"],
        "trigger; title; description; confirmLabel; onConfirm: () => void | Promise<void>. Výchozí focus na Zrušit; busy + error.",
      ),
      entry(
        "Popover",
        "Overlays.tsx",
        ["nemodální"],
        "trigger; title; children. Floating UI: positioning, Escape, focus a kliknutí mimo.",
      ),
      entry(
        "Tooltip",
        "Overlays.tsx",
        ["nápověda"],
        "children: jeden focusovatelný ReactElement; text. Radix Tooltip s vlastním Providerem a portálem.",
      ),
    ],
  },
  {
    id: "feedback",
    title: "Feedback & Status",
    description:
      "Významové stavy, průběh operace a další krok, když zatím není co zobrazit.",
    keyboard:
      "Informační prvky nejsou focusovatelné. Zavření Alertu a akce Empty State fungují jako běžná tlačítka.",
    entries: [
      {
        ...entry(
          "Badge",
          "Feedback.tsx",
          ["neutral", "success", "warning", "error"],
          "tone; children.",
          "experiment",
          "Existující export katalogu, není doložené produkční použití nástroji. Knihovna jej přebírá se scoped styly.",
        ),
        source: "src/components/ui/Badge.tsx",
      },
      {
        ...entry(
          "Status",
          "Feedback.tsx",
          ["neutral", "success", "warning", "error"],
          "state; children.",
          "produkční",
          "Skutečný ToolStatus z components.jsx; Screenshot a konvertor obrázků. Text nese význam, barva jej doplňuje.",
        ),
        source: "src/tools/legacy/shared/react-ui/components.jsx",
      },
      entry(
        "Alert",
        "Feedback.tsx",
        ["info", "success", "warning", "error"],
        "title; children; tone; onDismiss?; error používá role=alert, ostatní role=status.",
      ),
      entry(
        "Progress",
        "Feedback.tsx",
        ["určitý", "neurčitý"],
        "label; value?: 0–100. Bez value statický neurčitý progress s ARIA rolí.",
      ),
      entry(
        "Loading",
        "Feedback.tsx",
        ["inline", "block"],
        "label; layout. role=status; při reduced motion statický indikátor.",
      ),
      entry(
        "EmptyState",
        "Feedback.tsx",
        ["s vysvětlením a akcí"],
        "title; description; action?: ReactNode.",
      ),
    ],
  },
  {
    id: "navigation",
    title: "Navigation & Tabs",
    description:
      "Přepínání obsahu, voleb, rozbalování a stránkování bez dalšího hlavního headeru.",
    keyboard:
      "Tabs: ←/→, Home/End; Segmented: nativní radio šipky; Disclosure: Enter/mezerník; Pagination: Tab a Enter.",
    entries: [
      entry(
        "Tabs",
        "Navigation.tsx",
        ["horizontální"],
        "items: {value,label,disabled,content}[]; value; onValueChange; label. Automatická aktivace, roving tabIndex.",
      ),
      entry(
        "SegmentedControl",
        "Navigation.tsx",
        ["jedna volba"],
        "items; value; onValueChange; label; disabled. Nativní radio group.",
      ),
      entry(
        "Disclosure",
        "Navigation.tsx",
        ["rozbalovací sekce"],
        "title; children; open?; onOpenChange?. Nativní details/summary.",
      ),
      entry(
        "Pagination",
        "Navigation.tsx",
        ["číslovaná"],
        "page; count; onPageChange; label?. Ohraničený výběr a aria-current=page.",
      ),
    ],
  },
];
export const sourceUrl = (path: string) =>
  `https://github.com/irisKaX/axolotl-2/blob/experiment/ds-library-v1/${path}`;
