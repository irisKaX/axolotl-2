import { useEffect, useRef, useState } from "react";
import { Button } from "../../../design-system/Button";
import {
  Badge,
  Status,
  Alert,
  Progress,
  Loading,
  EmptyState,
  Card,
  Field,
  Select,
  Slider,
  Switch,
  type Tone,
} from "../../../design-system/library";
import { Playground, Examples } from "./PageFrame";
const meanings = {
  neutral: "Připraveno",
  success: "Kontrola dokončena",
  warning: "Vyžaduje pozornost",
  error: "Kontrola selhala",
};
export default function FeedbackPage() {
  const [kind, setKind] = useState("Badge"),
    [tone, setTone] = useState<Tone>("neutral"),
    [progress, setProgress] = useState(35),
    [indeterminate, setIndeterminate] = useState(false),
    [layout, setLayout] = useState<"inline" | "block">("inline"),
    [dismissible, setDismissible] = useState(true),
    [visible, setVisible] = useState(true),
    [count, setCount] = useState(0),
    [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  function run() {
    if (timer.current) clearInterval(timer.current);
    setProgress(0);
    setRunning(true);
    let value = 0;
    timer.current = setInterval(() => {
      value += 10;
      setProgress(value);
      if (value >= 100) {
        clearInterval(timer.current!);
        timer.current = null;
        setRunning(false);
      }
    }, 150);
  }
  return (
    <>
      <Playground
        controls={
          <>
            <Field label="Komponenta">
              <Select
                value={kind}
                onValueChange={(v) => {
                  setKind(v);
                  setVisible(true);
                }}
                options={[
                  "Badge",
                  "Status",
                  "Alert",
                  "Progress",
                  "Loading",
                  "Empty State",
                ].map((v) => ({ value: v, label: v }))}
              />
            </Field>
            {["Badge", "Status", "Alert"].includes(kind) && (
              <Field label="Význam">
                <Select
                  value={tone}
                  onValueChange={(v) => setTone(v as Tone)}
                  options={Object.entries(meanings).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Field>
            )}
            {kind === "Alert" && (
              <>
                <Switch
                  label="Lze zavřít"
                  checked={dismissible}
                  onChange={(e) => setDismissible(e.target.checked)}
                />
                <Button onClick={() => setVisible(true)}>
                  Zobrazit upozornění
                </Button>
              </>
            )}
            {kind === "Progress" && (
              <>
                <Switch
                  label="Neurčitý průběh"
                  checked={indeterminate}
                  onChange={(e) => setIndeterminate(e.target.checked)}
                />
                {!indeterminate && (
                  <>
                    <Slider
                      label="Dokončení (%)"
                      value={progress}
                      onValueChange={setProgress}
                      disabled={running}
                    />
                    <Button loading={running} onClick={run}>
                      Spustit ukázkový průběh
                    </Button>
                  </>
                )}
              </>
            )}
            {kind === "Loading" && (
              <Field label="Rozložení">
                <Select
                  value={layout}
                  onValueChange={(v) => setLayout(v as typeof layout)}
                  options={[
                    { value: "inline", label: "Inline" },
                    { value: "block", label: "Block" },
                  ]}
                />
              </Field>
            )}
            <p className="ds-hint">
              Význam je vždy vyjádřen textem. Žádný stav se neopírá pouze o
              barvu.
            </p>
          </>
        }
      >
        <div className="ds-catalog-wide-demo">
          {kind === "Badge" ? (
            <Badge tone={tone}>{meanings[tone]}</Badge>
          ) : kind === "Status" ? (
            <Status state={tone}>{meanings[tone]}</Status>
          ) : kind === "Alert" ? (
            visible ? (
              <Alert
                tone={tone === "neutral" ? "info" : tone}
                title={meanings[tone]}
                onDismiss={dismissible ? () => setVisible(false) : undefined}
              >
                Tato zpráva vysvětluje aktuální stav ukázky a další postup.
              </Alert>
            ) : (
              <p role="status">
                Upozornění bylo zavřeno. Znovu ho otevři v ovládání.
              </p>
            )
          ) : kind === "Progress" ? (
            <Progress
              label="Zpracování ukázky"
              value={indeterminate ? undefined : progress}
            />
          ) : kind === "Loading" ? (
            <Loading label="Načítám výsledky kontroly…" layout={layout} />
          ) : count === 0 ? (
            <EmptyState
              title="Zatím žádné poznámky"
              description="Přidej první poznámku do této ukázky."
              action={
                <Button variant="primary" onClick={() => setCount(1)}>
                  Přidat poznámku
                </Button>
              }
            />
          ) : (
            <Card title="Poznámka 01">
              <p>První poznámka je připravená.</p>
              <Button onClick={() => setCount(0)}>Obnovit prázdný stav</Button>
            </Card>
          )}
        </div>
      </Playground>
      <Examples title="Významové varianty">
        {(Object.keys(meanings) as Tone[]).map((t) => (
          <Card title={meanings[t]} key={t}>
            <div className="ds-catalog-stack">
              <Badge tone={t}>{meanings[t]}</Badge>
              <Status state={t}>{meanings[t]}</Status>
              <Alert title={meanings[t]} tone={t === "neutral" ? "info" : t}>
                Text vysvětluje, co se právě děje.
              </Alert>
            </div>
          </Card>
        ))}
        <Card title="Průběh a načítání">
          <div className="ds-catalog-stack">
            <Progress label="Dokončeno" value={progress} />
            <Progress label="Čekám na odpověď" />
            <Loading label="Zpracování pokračuje" />
          </div>
        </Card>
        <Card title="Prázdné výsledky">
          <EmptyState
            title="Nic jsme nenašli"
            description="Zkus změnit filtr nebo přidat novou položku."
            action={
              <Button onClick={() => setCount((v) => v + 1)}>
                Přidat položku
              </Button>
            }
          />
          <p role="status">Přidané položky: {count}</p>
        </Card>
      </Examples>
    </>
  );
}
