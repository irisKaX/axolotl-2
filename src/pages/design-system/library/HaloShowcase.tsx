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
  haloEffects,
  haloIntensities,
  type HaloOptions,
  type HaloIntensity,
  type HaloEffect,
} from "../../../design-system/library";
import { ChoiceControl, BooleanControl } from "./Controls";
import { paints } from "./colors/paints";
import type { Category } from "./model";
import "./halo-showcase.css";
const labels = {
  soft: "Halo Soft",
  spatial: "Halo Spatial",
  cinematic: "Halo Cinematic",
  original: "Původní Halo",
};
const descriptions = {
  soft: "Satén, čisté hrany a klid pro dlouhou práci.",
  spatial: "Vrstvený povrch, světlo pod kurzorem a oddělený obsah.",
  cinematic: "Výrazný náklon, více hloubkových vrstev a světelná reakce.",
  original: "Referenční materiál z předchozí iterace, beze změny.",
};
const effectLabels: Record<HaloEffect, string> = {
  spotlight: "Světlo pod kurzorem",
  edge: "Světelný obrys",
  tilt: "3D náklon",
  parallax: "Parallax vrstev",
  ambient: "Ambientní světlo",
  sheen: "Odlesk",
  lift: "Zdvih karty",
};
type State = "empty" | "loading" | "error" | "warning" | "success";
function Specimens({
  options,
  label,
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
  options?: HaloOptions;
  label: string;
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
  const halo = options
    ? { ...options, disabled: disabled || loading }
    : undefined;
  return (
    <div className="ds-halo-specimens">
      <div>
        <p className="ds-halo-caption">01 / Content · Card</p>
        <Card
          family="halo"
          halo={halo}
          title="Poznámky k projektu"
          footer={
            <span className="ds-halo-meta">Notebook / Dnes · 2 poznámky</span>
          }
        >
          <p className="ds-halo-lead">Dobré rozhraní nechá obsah vyniknout.</p>
          <p>
            Dokončit kontrolu stránky a připravit podklady pro další iteraci.
          </p>
          <div className="ds-halo-well">
            <Checkbox
              label="Zkontrolovat nadpisy"
              checked={task}
              onCheckedChange={onTask}
              disabled={disabled || loading}
            />
            <p className="ds-halo-meta">
              {task
                ? "Hotovo. Poznámka zůstává čitelná."
                : "Jeden konkrétní krok k dokončení."}
            </p>
          </div>
        </Card>
      </div>
      <div>
        <p className="ds-halo-caption">02 / Výběr · InteractiveCard</p>
        <InteractiveCard
          family="halo"
          halo={halo}
          title="Kontrola obsahu"
          description={
            selected ? "Vybráno do pracovní sady" : "Vyber do pracovní sady"
          }
          aria-pressed={selected}
          disabled={disabled}
          loading={loading}
          onClick={onSelect}
        >
          <span className="ds-halo-selection-mark" aria-hidden="true">
            <Layers size={30} />
          </span>
        </InteractiveCard>
      </div>
      <div>
        <p className="ds-halo-caption">03 / Nástroj · ToolCard</p>
        <ToolCard
          family="halo"
          halo={halo}
          title="Metadata"
          description="Připrav stránku na první dojem."
          metadata={
            <>
              <div className="ds-halo-tool-visual" aria-hidden="true">
                <span className="ds-halo-tool-orbit" />
                <FileSearch size={56} strokeWidth={1.25} />
                <span className="ds-halo-tool-tag">TITLE / OG / SEO</span>
              </div>
              <p className="ds-halo-meta">Titulky, popisy a náhled sdílení.</p>
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
                <p role="status" className="ds-halo-meta">
                  Titulek i popis jsou vyplněné. Ukázkový výsledek.
                </p>
              )}
            </>
          }
        />
      </div>
      <div>
        <p className="ds-halo-caption">04 / Dashboard · WidgetCard</p>
        <WidgetCard
          family="halo"
          halo={halo}
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
            <span role="status" className="ds-halo-meta">
              {revision ? `Obnoveno ${revision}×` : "Posledních 7 kontrol"} ·
              Ukázková data
            </span>
          }
        >
          <div className="ds-halo-kpi">
            <strong>{24 + revision}</strong>
            <span>hotových kontrol</span>
          </div>
          <div className="ds-halo-bars" aria-hidden="true">
            {[32, 52, 45, 68, 63, 82, 94].map((height, i) => (
              <span key={i} style={{ height: `${height}%` }} />
            ))}
          </div>
          <Progress label="Pokrytí projektu" value={80} />
        </WidgetCard>
      </div>
      <div>
        <p className="ds-halo-caption">05 / Workspace · Panel</p>
        <Panel
          family="halo"
          halo={halo}
          aria-label={`Pracovní kontext · ${label}`}
        >
          <p className="ds-halo-caption">WORKSPACE / KONTEXT</p>
          <h3>Vše na svém místě.</h3>
          <p>Prostor pro poznámky, formuláře a delší pracovní obsah.</p>
          <div className="ds-halo-well">
            <p>Revize úvodní stránky</p>
            <p className="ds-halo-meta">Obsah · Struktura · Přístupnost</p>
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
        <p className="ds-halo-caption">06 / Zpětná vazba · StateCard</p>
        <StateCard
          family="halo"
          halo={halo}
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
export function HaloShowcase({ category }: { category: Category }) {
  const [intensity, setIntensity] = useState<HaloIntensity>("cinematic"),
    [view, setView] = useState("single"),
    [accent, setAccent] = useState("axolotl-violet");
  const [effects, setEffects] = useState<Partial<Record<HaloEffect, boolean>>>(
    {},
  );
  const [disabled, setDisabled] = useState(false),
    [loading, setLoading] = useState(false),
    [state, setState] = useState<State>("empty");
  const [selected, setSelected] = useState(false),
    [saved, setSaved] = useState(false),
    [revision, setRevision] = useState(0),
    [task, setTask] = useState(false);
  const list: (HaloIntensity | "original")[] =
    view === "compare"
      ? [...haloIntensities]
      : view === "original"
        ? ["original", intensity]
        : [intensity];
  const color = paints.find((p) => p.id === accent)!.css;
  const effectValue = (key: HaloEffect) =>
    effects[key] ??
    (intensity === "soft" ? key === "edge" || key === "ambient" : true);
  return (
    <section className="ds-halo-showcase" aria-label="Halo 2.0">
      <header className="ds-halo-intro">
        <p className="ds-halo-caption">HALO 2.0 / MATERIÁL V POHYBU</p>
        <h2>Světlo, které vnímá pohyb.</h2>
        <p>
          Přejeď kurzorem přes kartu a její hrany. Tři intenzity jednoho
          materiálu — od klidného obsahu po prostorový nástroj.
        </p>
      </header>
      <div className="ds-halo-controls">
        <ChoiceControl
          label="Intenzita Halo"
          value={intensity}
          onValueChange={(v) => setIntensity(v as HaloIntensity)}
          options={haloIntensities.map((v) => ({ value: v, label: labels[v] }))}
        />
        <ChoiceControl
          label="Porovnání Halo"
          value={view}
          onValueChange={setView}
          options={[
            { value: "single", label: "Vybraná intenzita" },
            { value: "compare", label: "Tři intenzity vedle sebe" },
            { value: "original", label: "Původní Halo + vybraná intenzita" },
          ]}
        />
        <ChoiceControl
          label="Světelný akcent"
          value={accent}
          onValueChange={setAccent}
          options={paints
            .filter((p) => p.kind === "solid")
            .map((p) => ({ value: p.id, label: p.name }))}
        />
      </div>
      <details className="ds-halo-settings">
        <summary>Efekty a interakční stavy</summary>
        <p className="ds-halo-meta">
          Výchozí nastavení se řídí intenzitou. Změněný přepínač platí pro
          všechny nové ukázky; původní Halo zůstává referencí. Soft zůstává bez
          náklonu a posunu i při zapnutí těchto přepínačů.
        </p>
        <div className="ds-halo-toggles">
          {haloEffects.map((key) => (
            <BooleanControl
              key={key}
              label={effectLabels[key]}
              value={effectValue(key)}
              onValueChange={(value) =>
                setEffects((v) => ({ ...v, [key]: value }))
              }
            />
          ))}
        </div>
        <Button variant="ghost" size="small" onClick={() => setEffects({})}>
          Obnovit výchozí efekty
        </Button>
        <div className="ds-halo-controls">
          <ChoiceControl
            label="Stav Halo obsahu"
            value={state}
            onValueChange={(v) => setState(v as State)}
            options={["empty", "loading", "error", "warning", "success"].map(
              (v) => ({ value: v, label: v }),
            )}
          />
          <BooleanControl
            label="Neaktivní Halo akce"
            value={disabled}
            onValueChange={setDisabled}
          />
          <BooleanControl
            label="Načítání Halo akcí"
            value={loading}
            onValueChange={setLoading}
          />
        </div>
      </details>
      <p className="ds-halo-meta">
        Dark/light: horní přepínač katalogu. Na dotykovém zařízení a při omezení
        pohybu zůstává stabilní materiál; akce a obsah jsou plně dostupné.
      </p>
      <div className="ds-halo-columns" data-view={view}>
        {list.map((v) => (
          <section className="ds-halo-column" key={v} aria-label={labels[v]}>
            <header>
              <h3>
                {labels[v]}{" "}
                <span className="ds-halo-meta">
                  {category.entries.every(
                    (e) =>
                      e.variants.find(
                        (x) =>
                          x.id === (v === "original" ? "halo" : `halo-${v}`),
                      )?.design === "approved",
                  )
                    ? "Schváleno"
                    : "Návrh"}
                </span>
              </h3>
              <p>{descriptions[v]}</p>
            </header>
            <Specimens
              label={labels[v]}
              options={
                v === "original"
                  ? undefined
                  : { intensity: v, effects, accent: color }
              }
              disabled={disabled}
              loading={loading}
              state={state}
              selected={selected}
              onSelect={() => setSelected(!selected)}
              saved={saved}
              onSave={() => setSaved(!saved)}
              revision={revision}
              onRefresh={() => setRevision((x) => x + 1)}
              task={task}
              onTask={() => setTask(!task)}
            />
          </section>
        ))}
      </div>
      <details className="ds-halo-settings">
        <summary>Skutečné exporty a vlastnosti</summary>
        <p>
          Card, InteractiveCard, ToolCard, WidgetCard, Panel a StateCard
          používají společné volitelné <code>halo</code>. Původní{" "}
          <code>family="halo"</code> bez této vlastnosti zachovává původní
          vzhled.
        </p>
        <pre>{`<ToolCard family="halo"\n  halo={{ intensity: "${intensity}", accent: "${color}",\n    effects: ${JSON.stringify(effects)} }}\n  title="Metadata" description="…" action={action} />`}</pre>
        <p>
          Bez výslovné intenzity: Card/Panel/StateCard → Soft;
          InteractiveCard/WidgetCard → Spatial; ToolCard → Cinematic. Technický
          registr a zdrojové soubory jsou níže v API.
        </p>
      </details>
    </section>
  );
}
