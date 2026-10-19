import { useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  FileSearch,
  RotateCw,
  Layers,
} from "lucide-react";
import { Button } from "../../../design-system/Button";
import {
  Card,
  InteractiveCard,
  ToolCard,
  WidgetCard,
  Panel,
  StateCard,
  Checkbox,
  Progress,
} from "../../../design-system/library";
import { ChoiceControl, BooleanControl } from "./Controls";
import "./surface-examples.css";
type State = "empty" | "loading" | "error" | "warning" | "success";
function Specimens({
  disabled,
  loading,
  state,
  selected,
  onSelect,
  saved,
  onSave,
  revision,
  onRefresh,
  task,
  onTask,
}: {
  disabled: boolean;
  loading: boolean;
  state: State;
  selected: boolean;
  onSelect: () => void;
  saved: boolean;
  onSave: () => void;
  revision: number;
  onRefresh: () => void;
  task: boolean;
  onTask: () => void;
}) {
  const [open, setOpen] = useState(false),
    [resolved, setResolved] = useState(false);
  const [lastState, setLastState] = useState(state);
  if (lastState !== state) {
    setLastState(state);
    setResolved(false);
  }
  return (
    <div className="ds-surface-specimens">
      <div>
        <p className="ds-surface-caption">01 / Content · Card</p>
        <Card
          title="Poznámky k projektu"
          footer={
            <span className="ds-surface-meta">
              Notebook / Dnes · 2 poznámky
            </span>
          }
        >
          <p className="ds-surface-lead">
            Dobré rozhraní nechá obsah vyniknout.
          </p>
          <p>
            Dokončit kontrolu stránky a připravit podklady pro další iteraci.
          </p>
          <div className="ds-surface-well">
            <Checkbox
              label="Zkontrolovat nadpisy"
              checked={task}
              onCheckedChange={onTask}
              disabled={disabled || loading}
            />
            <p className="ds-surface-meta">
              {task
                ? "Hotovo. Poznámka zůstává čitelná."
                : "Jeden konkrétní krok k dokončení."}
            </p>
          </div>
        </Card>
      </div>
      <div>
        <p className="ds-surface-caption">02 / Výběr · InteractiveCard</p>
        <InteractiveCard
          title="Kontrola obsahu"
          description={
            selected ? "Vybráno do pracovní sady" : "Vyber do pracovní sady"
          }
          aria-pressed={selected}
          disabled={disabled}
          loading={loading}
          onClick={onSelect}
        >
          <span className="ds-surface-selection-mark" aria-hidden="true">
            <Layers size={30} />
          </span>
        </InteractiveCard>
      </div>
      <div>
        <p className="ds-surface-caption">03 / Nástroj · ToolCard</p>
        <ToolCard
          title="Metadata"
          description="Připrav stránku na první dojem."
          metadata={
            <>
              <div className="ds-surface-tool-visual" aria-hidden="true">
                <FileSearch size={56} strokeWidth={1.25} />
                <span className="ds-surface-tool-tag">TITLE / OG / SEO</span>
              </div>
              <p className="ds-surface-meta">
                Titulky, popisy a náhled sdílení.
              </p>
            </>
          }
          action={
            <>
              <Button
                size="small"
                icon={<ArrowUpRight />}
                disabled={disabled}
                loading={loading}
                onClick={() => setOpen(!open)}
              >
                {open ? "Zavřít výsledek" : "Vyzkoušet kontrolu"}
              </Button>
              {open && (
                <p role="status" className="ds-surface-meta">
                  Titulek i popis jsou vyplněné. Ukázkový výsledek.
                </p>
              )}
            </>
          }
        />
      </div>
      <div>
        <p className="ds-surface-caption">04 / Dashboard · WidgetCard</p>
        <WidgetCard
          title="Kvalita projektu"
          actions={
            <Button
              size="small"
              variant="ghost"
              icon={<RotateCw />}
              disabled={disabled}
              loading={loading}
              onClick={onRefresh}
            >
              Obnovit přehled
            </Button>
          }
          footer={
            <span role="status" className="ds-surface-meta">
              {revision ? `Obnoveno ${revision}×` : "Posledních 7 kontrol"} ·
              Ukázková data
            </span>
          }
        >
          <div className="ds-surface-kpi">
            <strong>{24 + revision}</strong>
            <span>hotových kontrol</span>
          </div>
          <div className="ds-surface-bars" aria-hidden="true">
            {[32, 52, 45, 68, 63, 82, 94].map((height, i) => (
              <span key={i} style={{ height: `${height}%` }} />
            ))}
          </div>
          <Progress label="Pokrytí projektu" value={80} />
        </WidgetCard>
      </div>
      <div>
        <p className="ds-surface-caption">05 / Workspace · Panel</p>
        <Panel aria-label="Pracovní kontext Halo Soft">
          <p className="ds-surface-caption">WORKSPACE / KONTEXT</p>
          <h3>Vše na svém místě.</h3>
          <p>Prostor pro poznámky, formuláře a delší pracovní obsah.</p>
          <div className="ds-surface-well">
            <p>Revize úvodní stránky</p>
            <p className="ds-surface-meta">Obsah · Struktura · Přístupnost</p>
          </div>
          <Button
            size="small"
            variant="secondary"
            icon={<Bookmark />}
            aria-pressed={saved}
            disabled={disabled}
            loading={loading}
            onClick={onSave}
          >
            {saved ? "Poznámka uložena" : "Uložit poznámku"}
          </Button>
        </Panel>
      </div>
      <div>
        <p className="ds-surface-caption">06 / Zpětná vazba · StateCard</p>
        <StateCard
          state={resolved ? "success" : state}
          action={
            !resolved && (
              <Button
                size="small"
                disabled={disabled}
                loading={loading}
                onClick={() => setResolved(true)}
              >
                {state === "empty" ? "Přidat obsah" : "Vyřešit ukázkový stav"}
              </Button>
            )
          }
        />
      </div>
    </div>
  );
}
export function SurfaceExamples() {
  const [disabled, setDisabled] = useState(false),
    [loading, setLoading] = useState(false),
    [state, setState] = useState<State>("empty"),
    [selected, setSelected] = useState(false),
    [saved, setSaved] = useState(false),
    [revision, setRevision] = useState(0),
    [task, setTask] = useState(false);
  return (
    <section className="ds-surface-examples" aria-label="Halo Soft v kontextu">
      <header>
        <h2>Halo Soft v kontextu</h2>
        <p>
          Jeden klidný materiál. Šest skutečných komponent s různými úlohami,
          jemnou hranou a světlem.
        </p>
      </header>
      <div className="ds-surface-controls">
        <ChoiceControl
          label="Stav ukázkových karet"
          value={state}
          onValueChange={(v) => setState(v as State)}
          options={["empty", "loading", "error", "warning", "success"].map(
            (value) => ({ value, label: value }),
          )}
        />
        <BooleanControl
          label="Neaktivní akce"
          value={disabled}
          onValueChange={setDisabled}
        />
        <BooleanControl
          label="Načítání akcí"
          value={loading}
          onValueChange={setLoading}
        />
      </div>
      <Specimens
        disabled={disabled}
        loading={loading}
        state={state}
        selected={selected}
        onSelect={() => setSelected(!selected)}
        saved={saved}
        onSave={() => setSaved(!saved)}
        revision={revision}
        onRefresh={() => setRevision((n) => n + 1)}
        task={task}
        onTask={() => setTask(!task)}
      />
    </section>
  );
}
