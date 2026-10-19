import { useEffect, useRef, useState } from "react";
import { Button } from "../../../design-system/Button";
import {
  Card,
  Panel,
  InteractiveCard,
  StateCard,
  Field,
  Select,
  Switch,
  Status,
} from "../../../design-system/library";
import { Playground, Examples } from "./PageFrame";
export default function SurfacesPage() {
  const [kind, setKind] = useState("Card"),
    [material, setMaterial] = useState<"flat" | "raised">("flat"),
    [density, setDensity] = useState<"compact" | "comfortable">("comfortable"),
    [state, setState] = useState<"empty" | "loading" | "error">("empty"),
    [disabled, setDisabled] = useState(false),
    [selected, setSelected] = useState(false),
    [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function retry() {
    setState("loading");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setState("empty");
      setAdded(true);
    }, 600);
  }
  return (
    <>
      <Playground
        controls={
          <>
            <Field label="Komponenta">
              <Select
                value={kind}
                onValueChange={setKind}
                options={[
                  "Card",
                  "Panel",
                  "Interactive Card",
                  "State Card",
                ].map((v) => ({ value: v, label: v }))}
              />
            </Field>
            {kind === "Card" && (
              <>
                <Field label="Materiál">
                  <Select
                    value={material}
                    onValueChange={(v) => setMaterial(v as typeof material)}
                    options={["flat", "raised"].map((v) => ({
                      value: v,
                      label: v,
                    }))}
                  />
                </Field>
                <Field label="Hustota">
                  <Select
                    value={density}
                    onValueChange={(v) => setDensity(v as typeof density)}
                    options={["compact", "comfortable"].map((v) => ({
                      value: v,
                      label: v,
                    }))}
                  />
                </Field>
              </>
            )}
            {kind === "Interactive Card" && (
              <Switch
                label="Disabled"
                checked={disabled}
                onChange={(e) => setDisabled(e.target.checked)}
              />
            )}{" "}
            {kind === "State Card" && (
              <Field label="Stav obsahu">
                <Select
                  value={state}
                  onValueChange={(v) => {
                    setAdded(false);
                    setState(v as typeof state);
                  }}
                  options={["empty", "loading", "error"].map((v) => ({
                    value: v,
                    label: v,
                  }))}
                />
              </Field>
            )}
            <p className="ds-hint">
              Povrchy jsou pracovní V1. Žádný layout engine ani produkční widget
              se nemění.
            </p>
          </>
        }
      >
        <div className="ds-catalog-wide-demo">
          {kind === "Card" ? (
            <Card
              title="Přehled kontroly"
              material={material}
              density={density}
              footer={<Status state="success">Kontrola dokončena</Status>}
            >
              <p>
                Čitelné místo pro obsah nástroje, souhrn výsledků nebo budoucí
                widget.
              </p>
              <strong>24 zkontrolovaných položek</strong>
            </Card>
          ) : kind === "Panel" ? (
            <Panel aria-label="Pracovní panel">
              <h3>Pracovní plocha</h3>
              <p>Skutečný export Panel ze sdíleného UI nástrojů.</p>
              <Button onClick={() => setAdded((v) => !v)}>
                {added ? "Odebrat poznámku" : "Přidat poznámku"}
              </Button>
              {added && (
                <p role="status">Poznámka je přidaná do této ukázky.</p>
              )}
            </Panel>
          ) : kind === "Interactive Card" ? (
            <InteractiveCard
              title="Metadata"
              description={
                selected
                  ? "Karta je vybraná."
                  : "Vyber kartu klávesnicí nebo dotykem."
              }
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => setSelected((v) => !v)}
            />
          ) : added && state !== "loading" ? (
            <Card title="Widget připraven">
              <p>Ukázkový obsah workspace je dostupný.</p>
              <Button onClick={() => setAdded(false)}>
                Obnovit prázdný stav
              </Button>
            </Card>
          ) : (
            <StateCard
              state={state}
              action={
                <Button
                  onClick={state === "error" ? retry : () => setAdded(true)}
                >
                  {state === "error" ? "Zkusit znovu" : "Přidat widget"}
                </Button>
              }
            />
          )}
        </div>
      </Playground>
      <Examples>
        <Card title="Flat" material="flat">
          <p>Klidný povrch pro běžný obsah.</p>
        </Card>
        <Card title="Raised" material="raised">
          <p>Zvýšený povrch pro samostatný pracovní celek.</p>
        </Card>
        <StateCard
          state="empty"
          action={
            <Button onClick={() => setAdded(true)}>Přidat první widget</Button>
          }
        />
        <StateCard state="loading" />
        <StateCard
          state="error"
          action={<Button onClick={() => setAdded(true)}>Zkusit znovu</Button>}
        />
        <InteractiveCard
          title="Interaktivní karta"
          description={selected ? "Vybráno" : "Klikni pro výběr"}
          aria-pressed={selected}
          onClick={() => setSelected((v) => !v)}
        />
      </Examples>
      <p role="status">{added ? "Ukázková akce byla provedena." : ""}</p>
    </>
  );
}
