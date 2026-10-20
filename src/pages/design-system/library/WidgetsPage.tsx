import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../design-system/Button";
import {
  DesignSystemProvider,
  Dialog,
  Status,
} from "../../../design-system/library";
import {
  useFindPhraseDemo,
  useMiniQr,
  type SearchScenario,
  type WidgetSize,
} from "../../../design-system/widgets/state";
import { Playground, Examples } from "./PageFrame";
import { ComponentControl, PropertyControl, ChoiceControl } from "./Controls";
import { findEntry, type PageProps, type Category } from "./registry";
import "./widgets-page.css";
const scenarios = [
  { value: "success", label: "Dokončeno" },
  { value: "limited", label: "Dokončeno s omezením" },
  { value: "error", label: "Chyba přístupu" },
];
function ToolHandoff() {
  return (
    <Dialog
      trigger={
        <Button variant="ghost" size="small" icon={<ArrowUpRight />}>
          Otevřít v nástroji
        </Button>
      }
      title="Ukázka předání do nástroje"
      description="Demo výsledek se do skutečného nástroje nepřenáší."
    >
      <p>
        V budoucnu zde stejnou běhovou úlohu převezme nástroj{" "}
        <strong>Hledání na webu</strong> (Tool ID: <code>search</code>). V této
        verzi zůstáváte v katalogu; žádný sken ani nástroj se nespustil.
      </p>
    </Dialog>
  );
}
function DashboardContext({ category }: { category: Category }) {
  const search = useFindPhraseDemo(),
    qr = useMiniQr();
  const Search = findEntry("FindPhraseWidget", [category]).component,
    Qr = findEntry("MiniQrWidget", [category]).component;
  return (
    <>
      <Examples title="V kontextu budoucího Dashboardu">
        <div className="ds-widget-context-item">
          <Search {...search} detailAction={<ToolHandoff />} />
        </div>
        <div className="ds-widget-context-item">
          <Qr {...qr} />
        </div>
      </Examples>
      <p className="ds-hint">
        Dvě nezávislé ukázky. Pouze kompozice widgetů, bez změny skutečného
        Dashboardu nebo ukládání rozložení.
      </p>
    </>
  );
}
export default function WidgetsPage({
  category,
  previewTheme = "dark",
}: PageProps) {
  const [kind, setKind] = useState("Find Phrase / Asset Search"),
    [size, setSize] = useState<WidgetSize>("medium"),
    [scenario, setScenario] = useState<SearchScenario>("success");
  const search = useFindPhraseDemo(scenario),
    qr = useMiniQr(),
    entry = findEntry(kind, [category]),
    Component = entry.component,
    isSearch = entry.name === "FindPhraseWidget";
  return (
    <DesignSystemProvider theme={previewTheme}>
      <div className="ds-widget-studio">
        <p>
          Jedna rychlá akce na widget. Find Phrase je lokální demo; Mini QR
          skutečně vytváří a nabízí PNG ke stažení. Oba exporty jsou návrhy pro
          budoucí Dashboard.
        </p>
        <Playground
          controls={
            <>
              <ComponentControl
                category={category}
                value={entry.label}
                onValueChange={setKind}
              />
              <PropertyControl
                entry={entry}
                property="size"
                label="Velikost widgetu"
                value={size}
                onValueChange={(v) => setSize(v as WidgetSize)}
              />
              {isSearch ? (
                <ChoiceControl
                  label="Demo scénář"
                  value={scenario}
                  options={scenarios}
                  onValueChange={(v) => {
                    search.reset();
                    setScenario(v as SearchScenario);
                  }}
                />
              ) : (
                <p className="ds-hint">
                  Chybu vyzkoušíte neplatným odkazem, například
                  javascript:alert(1). Výstupní PNG má vždy 512 × 512 px.
                </p>
              )}
              <Button
                variant="ghost"
                onClick={() => (isSearch ? search.reset() : qr.reset())}
              >
                Resetovat stav ukázky
              </Button>
              <p className="ds-hint">
                M: do 440 px · L: do 600 px. Na mobilu se widget přizpůsobí
                šířce. Velikost S zde není podporovaná, aby vstup zůstal
                pohodlný.
              </p>
              <Status state="neutral">Návrh · v produkci se nepoužívá</Status>
            </>
          }
        >
          <div className="ds-widget-stage-context">
            <p className="ds-widget-context-label">Dashboard / rychlá akce</p>
            <Component
              size={size}
              {...(isSearch
                ? { ...search, detailAction: <ToolHandoff /> }
                : qr)}
            />
          </div>
        </Playground>
        <DashboardContext category={category} />
      </div>
    </DesignSystemProvider>
  );
}
