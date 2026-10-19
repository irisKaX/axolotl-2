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
export function Card({
  title,
  children,
  footer,
  family,
  material = "flat",
  density = "comfortable",
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  family?: SurfaceFamily;
  material?: "flat" | "raised" | "outline-test";
  density?: "compact" | "comfortable";
}) {
  const id = useId();
  return (
    <article
      className="ds-card"
      data-surface-family={family}
      data-material={material}
      data-density={density}
      aria-labelledby={id}
    >
      <h3 id={id}>{title}</h3>
      <div>{children}</div>
      {footer && <footer>{footer}</footer>}
    </article>
  );
}
/** Actual production Panel export with a typed boundary and local styling. */
export function Panel({
  children,
  family,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement> & { family?: SurfaceFamily }) {
  return (
    <ToolPanel {...props} data-surface-family={family} className={className}>
      {children}
    </ToolPanel>
  );
}
export function InteractiveCard({
  title,
  description,
  family,
  loading = false,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> & {
  title: string;
  description: string;
  family?: SurfaceFamily;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
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
      <strong>{title}</strong>
      <span>{description}</span>
      {loading ? <Loading label="Načítám kartu…" /> : children}
    </button>
  );
}
export function StateCard({
  state,
  action,
  family,
}: {
  state: "empty" | "loading" | "error" | "warning" | "success";
  family?: SurfaceFamily;
  action?: ReactNode;
}) {
  return (
    <Card title="Workspace" family={family}>
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
}: {
  title: string;
  description: string;
  metadata?: ReactNode;
  action: ReactNode;
  family?: SurfaceFamily;
}) {
  return (
    <Card title={title} family={family} footer={action}>
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
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  family?: SurfaceFamily;
}) {
  return (
    <Card title={title} family={family} footer={footer}>
      <div className="ds-widget-actions">{actions}</div>
      {children}
    </Card>
  );
}
