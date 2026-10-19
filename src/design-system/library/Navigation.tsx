import { useId, useRef, type ReactNode, type KeyboardEvent } from "react";
import { Button } from "../Button";
type Choice = { value: string; label: string; disabled?: boolean };
export function Tabs({
  items,
  value,
  onValueChange,
  label,
}: {
  items: (Choice & { content: ReactNode })[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
}) {
  const id = useId(),
    refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const key = (event: KeyboardEvent, current: string) => {
    const enabled = items.filter((i) => !i.disabled);
    let next = enabled.findIndex((i) => i.value === current);
    if (event.key === "ArrowRight") next = (next + 1) % enabled.length;
    else if (event.key === "ArrowLeft")
      next = (next - 1 + enabled.length) % enabled.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    else return;
    event.preventDefault();
    const item = enabled[next];
    if (item) {
      onValueChange(item.value);
      refs.current[item.value]?.focus();
    }
  };
  return (
    <div className="ds-tabs">
      <div role="tablist" aria-label={label}>
        {items.map((i) => (
          <button
            key={i.value}
            ref={(node) => {
              refs.current[i.value] = node;
            }}
            type="button"
            role="tab"
            disabled={i.disabled}
            id={`${id}-${i.value}-tab`}
            aria-controls={`${id}-${i.value}-panel`}
            aria-selected={value === i.value}
            tabIndex={value === i.value ? 0 : -1}
            onKeyDown={(e) => key(e, i.value)}
            onClick={() => onValueChange(i.value)}
          >
            {i.label}
          </button>
        ))}
      </div>
      {items.map((i) => (
        <div
          key={i.value}
          role="tabpanel"
          tabIndex={0}
          id={`${id}-${i.value}-panel`}
          aria-labelledby={`${id}-${i.value}-tab`}
          hidden={value !== i.value}
        >
          {i.content}
        </div>
      ))}
    </div>
  );
}
export function SegmentedControl({
  items,
  value,
  onValueChange,
  label,
  disabled,
}: {
  items: Choice[];
  value: string;
  onValueChange: (v: string) => void;
  label: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <fieldset className="ds-segmented" disabled={disabled}>
      <legend>{label}</legend>
      <div>
        {items.map((i) => (
          <label key={i.value}>
            <input
              type="radio"
              name={id}
              value={i.value}
              checked={value === i.value}
              disabled={i.disabled}
              onChange={() => onValueChange(i.value)}
            />
            <span>{i.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
export function Disclosure({
  title,
  children,
  open,
  onOpenChange,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  return (
    <details
      className="ds-disclosure"
      open={open}
      onToggle={(e) => onOpenChange?.(e.currentTarget.open)}
    >
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}
export function Pagination({
  page,
  count,
  onPageChange,
  label = "Stránkování",
}: {
  page: number;
  count: number;
  onPageChange: (p: number) => void;
  label?: string;
}) {
  const total = Math.max(1, Math.floor(count)),
    current = Math.max(1, Math.min(total, page));
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((p) => p > 0 && p <= total)
    .sort((a, b) => a - b);
  return (
    <nav className="ds-pagination" aria-label={label}>
      <Button
        size="small"
        disabled={current === 1}
        onClick={() => onPageChange(current - 1)}
      >
        Předchozí
      </Button>
      {pages.map((p, i) => (
        <span key={p}>
          {i > 0 && p - pages[i - 1] > 1 && <span aria-hidden="true">…</span>}
          <button
            type="button"
            aria-label={`Stránka ${p}`}
            aria-current={p === current ? "page" : undefined}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        </span>
      ))}
      <Button
        size="small"
        disabled={current === total}
        onClick={() => onPageChange(current + 1)}
      >
        Další
      </Button>
    </nav>
  );
}
