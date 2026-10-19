import type { Category } from "./model";
import { useState } from "react";
import { ArrowUpRight, Bookmark, RotateCw } from "lucide-react";
import { Button } from "../../../design-system/Button";
import {
  Card,
  InteractiveCard,
  ToolCard,
  WidgetCard,
  Panel,
  StateCard,
  Status,
  Progress,
  surfaceFamilies,
  type SurfaceFamily,
} from "../../../design-system/library";
import { ChoiceControl, BooleanControl } from "./Controls";
import "./surfaces-studio.css";

/** Same content and state for every family; only material changes in comparison. */
function SurfaceSet({
  family,
  disabled,
  busy,
  state,
  selected,
  setSelected,
  saved,
  setSaved,
  count,
  setCount,
}: {
  family: SurfaceFamily;
  disabled: boolean;
  busy: boolean;
  state: "empty" | "loading" | "error" | "warning" | "success";
  selected: boolean;
  setSelected: (v: boolean) => void;
  saved: boolean;
  setSaved: (v: boolean) => void;
  count: number;
  setCount: (v: number) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [previousState, setPreviousState] = useState(state);
  if (previousState !== state) {
    setPreviousState(state);
    setRecovered(false);
  }
  return (
    <div className="ds-surfaces-set">
      <div>
        <p className="ds-surfaces-type">01 / Base Card</p>
        <Card
          family={family}
          title="Dnešní soustředění"
          footer={<Status state="success">Připraveno k práci</Status>}
        >
          <p>Dokončit audit vstupní stránky a připravit poznámky pro tým.</p>
          <div className="ds-surfaces-metric">
            24 <span>ověřených položek</span>
          </div>
        </Card>
      </div>
      <div>
        <p className="ds-surfaces-type">02 / Interactive Card</p>
        <InteractiveCard
          family={family}
          title="Metadata"
          description={
            selected ? "Vybráno do pracovní sady" : "Vybrat do pracovní sady"
          }
          aria-pressed={selected}
          disabled={disabled}
          loading={busy}
          onClick={() => setSelected(!selected)}
        >
          <span className="ds-surface-meta">SEO · Obsah · Kontrola URL</span>
        </InteractiveCard>
      </div>
      <div>
        <p className="ds-surfaces-type">03 / Tool Card</p>
        <ToolCard
          family={family}
          title="Kontrola metadat"
          description="Ověř titulky, popisy a náhled sdílení na jednom místě."
          metadata="Nástroj / SEO · Poslední kontrola dnes"
          action={
            <Button
              size="small"
              icon={<ArrowUpRight />}
              disabled={disabled}
              loading={busy}
              onClick={() => setOpened(!opened)}
            >
              {opened ? "Zavřít ukázku" : "Otevřít ukázku"}
            </Button>
          }
        />
        {opened && (
          <p role="status">
            Ukázkový výsledek: titulek a popis jsou vyplněné. Produkční nástroj
            se nespouští.
          </p>
        )}
      </div>
      <div>
        <p className="ds-surfaces-type">04 / Dashboard Widget</p>
        <WidgetCard
          family={family}
          title="Kontrola projektu"
          actions={
            <Button
              variant="ghost"
              size="small"
              icon={<RotateCw />}
              disabled={disabled}
              loading={busy}
              onClick={() => setCount(count + 1)}
            >
              Obnovit
            </Button>
          }
          footer={
            <span className="ds-surface-meta" role="status">
              {count
                ? `Obnoveno ${count}× v ukázce`
                : "Poslední kontrola · před chvílí"}
            </span>
          }
        >
          <div className="ds-surfaces-metric">
            {24 + count}
            <span>hotových kontrol</span>
          </div>
          <Progress value={80} label="Pokrytí projektu" />
        </WidgetCard>
      </div>
      <div>
        <p className="ds-surfaces-type">05 / Panel / Surface</p>
        <Panel
          family={family}
          aria-label={`Projektové poznámky · ${surfaceFamilies.find((f) => f.id === family)!.label}`}
        >
          <h3>Projektové poznámky</h3>
          <p>
            Připravit alternativní texty pro úvodní galerii. Zkontrolovat
            návaznost nadpisů.
          </p>
          <Button
            size="small"
            variant="secondary"
            icon={<Bookmark />}
            aria-pressed={saved}
            disabled={disabled}
            loading={busy}
            onClick={() => setSaved(!saved)}
          >
            {saved ? "Poznámka uložena" : "Uložit poznámku"}
          </Button>
        </Panel>
      </div>
      <div>
        <p className="ds-surfaces-type">06 / State Card</p>
        <StateCard
          family={family}
          state={recovered ? "success" : state}
          action={
            <Button
              size="small"
              disabled={disabled}
              loading={busy}
              onClick={() => setRecovered(true)}
            >
              {state === "empty" ? "Přidat obsah" : "Vyřešit ukázkový stav"}
            </Button>
          }
        />
      </div>
    </div>
  );
}
export function SurfaceStudio({ category }: { category: Category }) {
  const [family, setFamily] = useState<SurfaceFamily>("obsidian");
  const [compare, setCompare] = useState(false),
    [disabled, setDisabled] = useState(false),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(false),
    [saved, setSaved] = useState(false),
    [count, setCount] = useState(0);
  const [state, setState] = useState<
    "empty" | "loading" | "error" | "warning" | "success"
  >("empty");
  const visible = surfaceFamilies.filter((f) => compare || f.id === family);
  return (
    <section
      className="ds-surfaces-studio"
      aria-label="Prémiové rodiny povrchů"
    >
      <header>
        <p className="ds-surfaces-type">Materiály / interakce / prostor</p>
        <h2>Tři povrchy. Stejný pracovní obsah.</h2>
        <p>
          Vyber rodinu nebo je porovnej vedle sebe. Stav schválení je uveden u
          každé rodiny. Dark/light přepíná horní ovládání katalogu.
        </p>
      </header>
      <div className="ds-surfaces-controls">
        <ChoiceControl
          label="Stylová rodina"
          value={family}
          onValueChange={(v) => setFamily(v as SurfaceFamily)}
          options={surfaceFamilies.map((f) => ({
            value: f.id,
            label: f.label,
          }))}
        />
        <ChoiceControl
          label="Stav ukázkových karet"
          value={state}
          onValueChange={(v) => setState(v as typeof state)}
          options={[
            { value: "empty", label: "Empty" },
            { value: "loading", label: "Loading" },
            { value: "error", label: "Error" },
            { value: "warning", label: "Warning" },
            { value: "success", label: "Success" },
          ]}
        />
        <BooleanControl
          label="Porovnat tři rodiny"
          value={compare}
          onValueChange={setCompare}
        />
        <BooleanControl
          label="Neaktivní akce"
          value={disabled}
          onValueChange={setDisabled}
        />
        <BooleanControl
          label="Načítání akcí"
          value={busy}
          onValueChange={setBusy}
        />
      </div>
      <div className="ds-surfaces-families" data-compare={compare}>
        {visible.map((f) => (
          <section
            key={f.id}
            className="ds-surfaces-family"
            aria-label={f.label}
          >
            <header>
              <h3>
                {f.label}{" "}
                <span>
                  {category.entries.every(
                    (entry) =>
                      entry.variants.find((v) => v.id === f.id)?.design ===
                      "approved",
                  )
                    ? "Schváleno"
                    : "Návrh"}
                </span>
              </h3>
              <p>{f.description}</p>
            </header>
            <SurfaceSet
              family={f.id}
              disabled={disabled}
              busy={busy}
              state={state}
              selected={selected}
              setSelected={setSelected}
              saved={saved}
              setSaved={setSaved}
              count={count}
              setCount={setCount}
            />
          </section>
        ))}
      </div>
    </section>
  );
}
