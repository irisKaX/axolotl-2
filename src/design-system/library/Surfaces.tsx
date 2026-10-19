import {
  useId,
  type ReactNode,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";
import { Panel as ToolPanel } from "../../tools/legacy/shared/react-ui/components.jsx";
import { EmptyState, Loading, Alert } from "./Feedback";
import type { SurfaceFamily } from "./surfaceFamilies";
import "./surfaces.css";
import { useHalo, HaloLayers, type HaloOptions } from "./halo";
export function Card({
  title,
  children,
  footer,
  family,
  halo,
  material = "flat",
  density = "comfortable",
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  family?: SurfaceFamily;
  halo?: HaloOptions;
  material?: "flat" | "raised" | "outline-test";
  density?: "compact" | "comfortable";
}) {
  const id = useId();
  const fx = useHalo<HTMLElement>(family === "halo" ? halo : undefined);
  return (
    <article
      {...fx}
      className="ds-card"
      data-surface-family={family}
      data-material={material}
      data-density={density}
      aria-labelledby={id}
    >
      {fx["data-halo"] && <HaloLayers />}
      <h3 id={id} data-halo-layer={halo ? "heading" : undefined}>
        {title}
      </h3>
      <div data-halo-layer={halo ? "content" : undefined}>{children}</div>
      {footer && (
        <footer data-halo-layer={halo ? "action" : undefined}>{footer}</footer>
      )}
    </article>
  );
}
/** Actual production Panel export with a typed boundary and local styling. */
export function Panel({
  children,
  family,
  halo,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & {
  family?: SurfaceFamily;
  halo?: HaloOptions;
}) {
  const fx = useHalo<HTMLElement>(family === "halo" ? halo : undefined);
  return (
    <ToolPanel
      {...props}
      {...fx}
      style={{ ...props.style, ...fx.style }}
      data-surface-family={family}
      className={className}
    >
      {fx["data-halo"] && <HaloLayers />}
      {halo ? <div data-halo-layer="content">{children}</div> : children}
    </ToolPanel>
  );
}
export function InteractiveCard({
  title,
  description,
  family,
  halo,
  loading = false,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> & {
  title: string;
  description: string;
  family?: SurfaceFamily;
  halo?: HaloOptions;
  loading?: boolean;
}) {
  const fx = useHalo<HTMLButtonElement>(
    family === "halo" && halo
      ? { ...halo, disabled: halo.disabled || loading || props.disabled }
      : undefined,
    "spatial",
  );
  return (
    <button
      type="button"
      {...props}
      {...fx}
      style={{ ...props.style, ...fx.style }}
      data-surface-family={family}
      aria-busy={loading || undefined}
      aria-disabled={loading || props["aria-disabled"]}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        props.onClick?.(event);
      }}
      className={`ds-interactive-card ${props.className || ""}`}
    >
      {fx["data-halo"] && <HaloLayers />}
      <strong data-halo-layer={halo ? "heading" : undefined}>{title}</strong>
      <span data-halo-layer={halo ? "content" : undefined}>{description}</span>
      {loading ? <Loading label="Načítám kartu…" /> : children}
    </button>
  );
}
export function StateCard({
  state,
  action,
  family,
  halo,
}: {
  state: "empty" | "loading" | "error" | "warning" | "success";
  family?: SurfaceFamily;
  halo?: HaloOptions;
  action?: ReactNode;
}) {
  return (
    <Card title="Workspace" family={family} halo={halo}>
      <div className="ds-state-card">
        {state === "empty" ? (
          <EmptyState
            title="Zatím bez widgetů"
            description="Přidej první položku do pracovní plochy."
            action={action}
          />
        ) : state === "loading" ? (
          <Loading layout="block" label="Načítám obsah workspace…" />
        ) : (
          <>
            <Alert
              tone={state}
              title={
                state === "error"
                  ? "Obsah není dostupný"
                  : state === "warning"
                    ? "Zkontroluj neuložené změny"
                    : "Vše je připravené"
              }
            >
              {state === "error"
                ? "Ukázkový požadavek se nezdařil. Zkus ho znovu."
                : state === "warning"
                  ? "Dvě poznámky čekají na uložení."
                  : "Pracovní obsah je aktuální."}
            </Alert>
            {action}
          </>
        )}
      </div>
    </Card>
  );
}

/** Content container with independent action slots; never a nested button. */
export function ToolCard({
  title,
  description,
  metadata,
  action,
  family,
  halo,
}: {
  title: string;
  description: string;
  metadata?: ReactNode;
  action: ReactNode;
  family?: SurfaceFamily;
  halo?: HaloOptions;
}) {
  return (
    <Card
      title={title}
      family={family}
      halo={halo ? { intensity: "cinematic", ...halo } : undefined}
      footer={action}
    >
      <p>{description}</p>
      <div className="ds-surface-meta">{metadata}</div>
    </Card>
  );
}
/** Actions are semantic controls supplied by the consumer; no dashboard engine. */
export function WidgetCard({
  title,
  children,
  actions,
  footer,
  family,
  halo,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  family?: SurfaceFamily;
  halo?: HaloOptions;
}) {
  return (
    <Card
      title={title}
      family={family}
      halo={halo ? { intensity: "spatial", ...halo } : undefined}
      footer={footer}
    >
      <div className="ds-widget-actions">{actions}</div>
      {children}
    </Card>
  );
}
