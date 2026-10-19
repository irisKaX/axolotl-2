import {
  useId,
  type ReactNode,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";
import { Panel as ToolPanel } from "../../tools/legacy/shared/react-ui/components.jsx";
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
  material?: "flat" | "raised";
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
    <ToolPanel {...props} className={className}>
      {children}
    </ToolPanel>
  );
}
export function InteractiveCard({
  title,
  description,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> & {
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      {...props}
      className={`ds-interactive-card ${props.className || ""}`}
    >
      <strong>{title}</strong>
      <span>{description}</span>
      {children}
    </button>
  );
}
export function StateCard({
  state,
  action,
}: {
  state: "empty" | "loading" | "error";
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
            <Alert tone="error" title="Obsah není dostupný">
              Ukázkový požadavek se nezdařil. Zkus ho znovu.
            </Alert>
            {action}
          </>
        )}
      </div>
    </Card>
  );
}
