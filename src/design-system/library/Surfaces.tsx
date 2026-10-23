import {
  useId,
  type ReactNode,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";
import { EmptyState, Loading, Alert } from "./Feedback";
export function Card({
  title,
  children,
  footer,
  material = "flat",
  density = "comfortable",
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  material?: "flat" | "raised" | "outline-test";
  density?: "compact" | "comfortable";
}) {
  const id = useId();
  return (
    <article
      className="ds-card"
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
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section {...props} className={`ax-panel ${className}`}>
      {children}
    </section>
  );
}
export function InteractiveCard({
  title,
  description,
  loading = false,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> & {
  title: string;
  description: string;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
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
}: {
  state: "empty" | "loading" | "error" | "warning" | "success";
  action?: ReactNode;
}) {
  return (
    <Card title="Workspace">
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
}: {
  title: string;
  description: string;
  metadata?: ReactNode;
  action: ReactNode;
}) {
  return (
    <Card title={title} footer={action}>
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
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card title={title} footer={footer}>
      <div className="ds-widget-actions">{actions}</div>
      {children}
    </Card>
  );
}
