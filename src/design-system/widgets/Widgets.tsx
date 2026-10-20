import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, Search, QrCode } from "lucide-react";
import { Button } from "../Button";
import {
  WidgetCard,
  Field,
  Input,
  SegmentedControl,
  Badge,
  Status,
} from "../library";
import { paintQr } from "../../tools/legacy/tools/qr-generator/model.js";
import type {
  WidgetSize,
  SearchMode,
  SearchState,
  QrState,
  QrModel,
} from "./state";
import "./widgets.css";
export function FindPhraseWidget({
  size = "medium",
  value,
  mode,
  state,
  onValueChange,
  onModeChange,
  onSearch,
  detailAction,
}: {
  size?: WidgetSize;
  value: string;
  mode: SearchMode;
  state: SearchState;
  onValueChange: (value: string) => void;
  onModeChange: (mode: SearchMode) => void;
  onSearch: () => boolean;
  detailAction: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null),
    working = state.phase === "starting" || state.phase === "scanning";
  const terminal = ["success", "limited", "error"].includes(state.phase);
  const labels = {
    idle: "Čeká na zadání",
    starting: "Demo: hledání spuštěno",
    scanning: "Demo: probíhá skenování",
    success: "Demo: dokončeno",
    limited: "Demo: dokončeno s omezením",
    error: "Demo: hledání se nezdařilo",
  };
  return (
    <div className="ds-dashboard-widget" data-widget="search" data-size={size}>
      <WidgetCard
        title="Find Phrase / Asset Search"
        footer={
          <span className="ds-hint">
            Demo web: example.test · celý web. Žádný skutečný web se
            nekontroluje.
          </span>
        }
      >
        <div className="ds-widget-meta">
          <Badge>Demo</Badge>
          <span>
            Budoucí Tool ID: <code>search</code>
          </span>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!onSearch()) input.current?.focus();
          }}
        >
          <SegmentedControl
            label="Co hledat"
            value={mode}
            onValueChange={(v) => onModeChange(v as SearchMode)}
            disabled={working}
            items={[
              { value: "phrase", label: "Fráze" },
              { value: "asset", label: "Asset" },
            ]}
          />
          <Field
            label={mode === "asset" ? "ID nebo název assetu" : "Hledaná fráze"}
            error={state.inputError}
          >
            <Input
              ref={input}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={
                mode === "asset" ? "Např. hero-2026" : "Např. výhodné volání"
              }
              disabled={working}
              maxLength={240}
            />
          </Field>
          <Button
            type="submit"
            variant="primary"
            icon={<Search />}
            loading={working}
          >
            Hledat
          </Button>
        </form>
        <div
          className="ds-widget-result"
          role={state.phase === "error" ? "alert" : "status"}
          aria-live={state.phase === "error" ? "assertive" : "polite"}
          aria-atomic="true"
        >
          <Status
            state={
              state.phase === "error"
                ? "error"
                : state.phase === "limited"
                  ? "warning"
                  : state.phase === "success"
                    ? "success"
                    : "neutral"
            }
          >
            {labels[state.phase]}
          </Status>
          {state.phase === "scanning" && (
            <p>Ukázkový průběh · zpracováno 8 stránek, 2 nálezy.</p>
          )}
          {state.phase === "success" && (
            <p>Ukázkový výsledek: 3 nálezy na 24 stránkách.</p>
          )}
          {state.phase === "limited" && (
            <p>
              Ukázkový výsledek: 2 nálezy na 12 stránkách. Část demo webu byla
              nedostupná.
            </p>
          )}
          {state.phase === "error" && (
            <p>
              Simulovaná chyba přístupu. Upravte demo scénář v playgroundu a
              zkuste to znovu.
            </p>
          )}
        </div>
        {terminal && detailAction}
      </WidgetCard>
    </div>
  );
}
function QrPreview({ qr }: { qr: QrModel }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    try {
      const ctx = canvas.current?.getContext("2d");
      if (!ctx) throw Error();
      paintQr(ctx, qr);
      setError(false);
    } catch {
      setError(true);
    }
  }, [qr]);
  return (
    <div className="ds-widget-qr-preview">
      {error ? (
        <p role="alert">Prohlížeč nepodporuje náhled QR na plátně.</p>
      ) : null}
      <canvas
        ref={canvas}
        width={qr.size}
        height={qr.size}
        role="img"
        aria-label={`QR kód pro ${qr.text}`}
        hidden={error}
      />
      <p className="ds-hint">{qr.text}</p>
    </div>
  );
}
export function MiniQrWidget({
  size = "medium",
  value,
  state,
  onValueChange,
  onGenerate,
  onDownload,
}: {
  size?: WidgetSize;
  value: string;
  state: QrState;
  onValueChange: (value: string) => void;
  onGenerate: () => Promise<boolean>;
  onDownload: () => void;
}) {
  const input = useRef<HTMLInputElement>(null),
    working = state.phase === "working";
  return (
    <div className="ds-dashboard-widget" data-widget="qr" data-size={size}>
      <WidgetCard
        title="Mini QR"
        footer={
          <span className="ds-hint">
            Černý kód · bílé pozadí · PNG 512 × 512. URL se nikam neposílá.
          </span>
        }
      >
        <div className="ds-widget-meta">
          <Badge tone="success">Funkční QR / PNG</Badge>
          <span>
            Katalogový prototyp · Tool ID: <code>qr</code>
          </span>
        </div>
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (!(await onGenerate())) input.current?.focus();
          }}
        >
          <Field
            label="URL pro QR"
            hint="Webový odkaz; bez protokolu se doplní https://."
            error={state.inputError ? state.message : undefined}
          >
            <Input
              ref={input}
              inputMode="url"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="https://www.o2.cz/"
            />
          </Field>
          <Button
            type="submit"
            variant="primary"
            icon={<QrCode />}
            loading={working && !state.qr}
            disabled={working && !!state.qr}
          >
            Vytvořit QR
          </Button>
        </form>
        <div
          className="ds-widget-result"
          role={state.phase === "error" ? "alert" : "status"}
          aria-live={state.phase === "error" ? "assertive" : "polite"}
          aria-atomic="true"
        >
          <Status
            state={
              state.phase === "error"
                ? "error"
                : state.phase === "success"
                  ? "success"
                  : "neutral"
            }
          >
            {state.phase === "idle"
              ? "Připraveno pro váš odkaz"
              : state.phase === "error"
                ? state.message
                : state.phase === "working"
                  ? state.qr
                    ? "Připravuji PNG…"
                    : "Vytvářím QR…"
                  : state.message || "QR je připravený."}
          </Status>
        </div>
        {state.qr && (
          <>
            <QrPreview qr={state.qr} />
            <Button
              variant="secondary"
              icon={<Download />}
              loading={working}
              onClick={onDownload}
            >
              Stáhnout PNG
            </Button>
          </>
        )}
      </WidgetCard>
    </div>
  );
}
