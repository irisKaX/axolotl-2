import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "../../../design-system/Button";
import {
  Badge,
  Card,
  Panel,
  DesignSystemProvider,
} from "../../../design-system/library";
import { useDesignSystem } from "../../../design-system/library/Provider";
import { ChoiceControl } from "./Controls";
import type { PageProps } from "./model";
import { ColorSample } from "./colors/ColorSample";
import { paints, getPaint } from "./colors/paints";
import { paintInk, textContrast } from "./colors/contrast";
import "./colors.css";

export default function ColorsPage({ previewTheme }: PageProps) {
  const environment = useDesignSystem();
  const theme = previewTheme ?? environment.theme;
  const [selected, setSelected] = useState("sunburst");
  const [actions, setActions] = useState(0);
  const [textSurface, setTextSurface] = useState("");
  const playground = useRef<HTMLHeadingElement>(null);
  const textStage = useRef<HTMLDivElement>(null);
  const paint = getPaint(selected),
    ink = paintInk(paint.css);
  useLayoutEffect(() => {
    if (textStage.current) {
      // Computed theme colors remain OKLCH. Resolve only this contrast sample
      // through the browser's sRGB canvas; the canonical tokens stay in OKLCH.
      const color = getComputedStyle(textStage.current).backgroundColor;
      const ctx = document.createElement('canvas').getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setTextSurface(`rgb(${r}, ${g}, ${b})`);
      } else setTextSurface(color); // Unsupported environments fail closed.
    }
  }, [theme]);
  const textRatio = textContrast(paint.css, textSurface);
  function select(id: string) {
    setSelected(id);
    playground.current?.focus({ preventScroll: true });
    playground.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }
  const variables = {
    "--paint-fill": paint.css,
    "--paint-ink": ink.color,
    "--paint-text-backing": ink.backing ? "#FFFFFF" : "transparent",
  } as CSSProperties;
  return (
    <DesignSystemProvider
      theme={theme}
      reducedMotion={environment.reducedMotion}
    >
      <div className="ds-colors" data-preview-theme={theme}>
        <p className="ds-hint">
          Klikni na vzorek pro vyzkoušení, na HEX nebo CSS pro kopírování.
          Přepínač náhledu v horní liště mění pouze kontext této stránky.
        </p>
        <section aria-labelledby="solid-colors-heading">
          <h2 id="solid-colors-heading">Solid Colors</h2>
          <p>
            Samostatné barevné možnosti. Stávající tokeny aplikace zůstávají
            beze změny.
          </p>
          <div className="ds-color-grid ds-color-solids">
            {paints
              .filter((p) => p.kind === "solid")
              .map((p) => (
                <ColorSample
                  key={p.id}
                  paintId={p.id}
                  selected={selected === p.id}
                  onSelect={select}
                />
              ))}
          </div>
        </section>
        <section aria-labelledby="gradient-library-heading">
          <h2 id="gradient-library-heading">Gradient Library</h2>
          <p>
            {paints.filter((p) => p.kind === "gradient").length} návrhových
            gradientů. Náhled i kopírovaná deklarace čtou přesnou hodnotu ze
            stejného registru.
          </p>
          <div className="ds-color-grid ds-color-gradients">
            {paints
              .filter((p) => p.kind === "gradient")
              .map((p) => (
                <ColorSample
                  key={p.id}
                  paintId={p.id}
                  selected={selected === p.id}
                  onSelect={select}
                />
              ))}
          </div>
        </section>
        <section aria-labelledby="colors-playground-heading">
          <h2 id="colors-playground-heading" ref={playground} tabIndex={-1}>
            Live Playground
          </h2>
          <div className="ds-color-playground-controls">
            <ChoiceControl
              label="Barva nebo gradient"
              value={selected}
              onValueChange={setSelected}
              options={paints.map((p) => ({ value: p.id, label: p.name }))}
            />
            <p className="ds-hint">
              {ink.backing
                ? "Pro běžný text nelze přes celou plochu zaručit kontrast 4,5 : 1. Popisky proto mají neutrální podklad."
                : `Kontrast popisků alespoň ${ink.minimum.toFixed(2)} : 1. Konzervativní kontrola celé barevné plochy.`}
            </p>
          </div>
          <div
            className="ds-color-live"
            style={variables}
            data-text-backing={ink.backing}
            data-selected-paint={paint.id}
          >
            <div className="ds-color-ui-row">
              <div>
                <h3>Button</h3>
                <Button
                  className="ds-paint-button"
                  theme={theme}
                  onClick={() => setActions((n) => n + 1)}
                >
                  Vyzkoušet akci
                </Button>
              </div>
              <div>
                <h3>Badge</h3>
                <span className="ds-paint-badge">
                  <Badge>
                    <span className="ds-paint-text">Připraveno</span>
                  </Badge>
                </span>
              </div>
            </div>
            <output className="ds-hint" aria-live="polite">
              {actions
                ? `Provedené akce: ${actions}`
                : "Ukázkové tlačítko je funkční."}
            </output>
            <div className="ds-paint-card">
              <Card title="Prostor pro nápady">
                <p>
                  <span className="ds-paint-text">
                    Čitelnost, materiál a barva na skutečné Card.
                  </span>
                </p>
              </Card>
            </div>
            <Panel className="ds-paint-panel">
              <h3>
                <span className="ds-paint-text">Větší plocha</span>
              </h3>
              <p>
                <span className="ds-paint-text">
                  {paint.name} · prostor pro budoucí obsah workspace.
                </span>
              </p>
            </Panel>
            <div className="ds-color-text-stage" ref={textStage}>
              <h3>Text na neutrální ploše</h3>
              {textRatio >= 4.5 ? (
                <p
                  className="ds-painted-text"
                  style={
                    paint.kind === "gradient"
                      ? {
                          backgroundImage: paint.css,
                          color: "transparent",
                          backgroundClip: "text",
                        }
                      : { color: paint.css }
                  }
                >
                  Axolotl · Prostor pro tvorbu
                </p>
              ) : (
                <p>
                  Barevný text je v tomto kontextu skrytý: kontrola nepotvrdila
                  kontrast 4,5 : 1. Vyzkoušej jinou barvu nebo opačný režim.
                </p>
              )}
              <p className="ds-hint" data-text-contrast>
                {textRatio >= 4.5
                  ? `Kontrast textu alespoň ${textRatio.toFixed(2)} : 1.`
                  : "Bezpečný náhled používá neutrální text."}
              </p>
            </div>
          </div>
          <p className="ds-hint">
            Skutečné exporty Button, Card, Badge a Panel se přebarvují pouze
            uvnitř této ukázky. Výchozí Lens 02, Star Border a produkční
            komponenty se nemění.
          </p>
        </section>
      </div>
    </DesignSystemProvider>
  );
}
