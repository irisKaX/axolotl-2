import type { ReactNode, HTMLAttributes } from "react";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  CircleX,
  X,
  Inbox,
} from "lucide-react";
import { Badge as ExistingBadge } from "../../components/ui/Badge";
import { Button } from "../Button";
export type Tone = "neutral" | "success" | "warning" | "error";
export const Badge = ExistingBadge;
export function Status({children,state='neutral',className='',...props}:HTMLAttributes<HTMLSpanElement> & {state?:Tone}) {
 return <span {...props} className={`ax-status ${className}`} data-state={state}><span className="ax-status-dot" aria-hidden="true"/>{children}</span>;
}
const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: CircleX,
};
export function Alert({
  title,
  children,
  tone = "info",
  onDismiss,
}: {
  title: string;
  children: ReactNode;
  tone?: keyof typeof icons;
  onDismiss?: () => void;
}) {
  const Icon = icons[tone];
  return (
    <div
      className="ds-alert"
      data-tone={tone}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon size={20} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
      {onDismiss && (
        <Button
          variant="icon"
          size="small"
          icon={<X />}
          aria-label="Zavřít upozornění"
          onClick={onDismiss}
        />
      )}
    </div>
  );
}
export function Progress({ value, label }: { value?: number; label: string }) {
  const clamped =
    value === undefined ? undefined : Math.min(100, Math.max(0, value));
  return (
    <div className="ds-progress">
      <span>
        {label}
        {clamped !== undefined && (
          <span aria-hidden="true"> · {Math.round(clamped)} %</span>
        )}
      </span>
      {clamped === undefined ? (
        <div
          className="ds-progress-unknown"
          role="progressbar"
          aria-label={label}
        />
      ) : (
        <progress aria-label={label} max={100} value={clamped} />
      )}
    </div>
  );
}
export function Loading({
  label = "Načítání",
  layout = "inline",
}: {
  label?: string;
  layout?: "inline" | "block";
}) {
  return (
    <div className="ds-loading" data-layout={layout} role="status">
      <span className="ds-spinner" aria-hidden="true" />
      {label}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="ds-empty">
      <Inbox size={28} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
