import {
  ComponentControl,
  PropertyControl,
  VariantControl,
  BooleanControl,
} from "./Controls";
import { findEntry, type PageProps } from "./registry";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../../design-system/Button";
import {
  Card,
  Panel,
  InteractiveCard,
  StateCard,
  Status,
} from "../../../design-system/library";
import { Playground, Examples } from "./PageFrame";
export default function SurfacesPage({ category }: PageProps) {
  const [kind, setKind] = useState("Card"),
    [material, setMaterial] = useState<"flat" | "raised" | "outline-test">(
      "flat",
    ),
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
  const selectedEntry = findEntry(kind, [category]);
  return (
    <>
      <Playground
        controls={
          <>
            <ComponentControl
              category={category}
              value={kind}
              onValueChange={setKind}
            />
            {kind === "Card" && (
              <>
                <VariantControl
                  label="Materiál"
                  entry={selectedEntry}
                  value={material}
                  onValueChange={(v) => setMaterial(v as typeof material)}
                />
                <PropertyControl
                  label="Hustota"
                  entry={selectedEntry}
                  property="density"
                  value={density}
                  onValueChange={(v) => setDensity(v as typeof density)}
                />
              </>
            )}
            {kind === "Interactive Card" && (
              <BooleanControl
                label="Disabled"
                value={disabled}
                onValueChange={setDisabled}
              />
            )}{" "}
            {kind === "State Card" && (
              <PropertyControl
                label="Stav obsahu"
                entry={selectedEntry}
                property="state"
                value={state}
                onValueChange={(v) => {
                  setAdded(false);
                  setState(v as typeof state);
                }}
              />
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
        {findEntry("Card", [category]).variants.map((v) => (
          <Card
            key={v.id}
            title={
              v.id === "flat"
                ? "Flat"
                : v.id === "raised"
                  ? "Raised"
                  : v.label + " · Návrh"
            }
            material={v.props.material as typeof material}
          >
            <p>
              {v.id === "flat"
                ? "Klidný povrch pro běžný obsah."
                : v.id === "raised"
                  ? "Zvýšený povrch pro samostatný pracovní celek."
                  : "Technická fixture rozšíření existujícího materiálu."}
            </p>
          </Card>
        ))}
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
