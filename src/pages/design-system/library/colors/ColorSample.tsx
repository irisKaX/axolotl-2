import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { getPaint, copyValue, type Paint } from "./paints";
import { designLabel } from "../model";

export function CopyValue({ paint }: { paint: Paint }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  async function copy() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(copyValue(paint));
      if (!mounted.current) return;
      setStatus("copied");
      timer.current = setTimeout(() => setStatus("idle"), 2200);
    } catch {
      if (mounted.current) setStatus("error");
    }
  }
  return (
    <div className="ds-color-value">
      <button
        type="button"
        className="ds-color-copy"
        onClick={copy}
        aria-label={`Kopírovat ${copyValue(paint)} · ${paint.name}`}
      >
        <code>{copyValue(paint)}</code>
        {status === "copied" ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Copy size={16} aria-hidden="true" />
        )}
      </button>
      <span className="ds-color-copy-status" role="status" aria-live="polite">
        {status === "copied"
          ? "Zkopírováno"
          : status === "error"
            ? "Kopírování se nezdařilo. Označte hodnotu a zkopírujte ji ručně."
            : ""}
      </span>
    </div>
  );
}
/** A real catalog export; every specimen and clipboard value resolves its registry ID. */
export function ColorSample({
  paintId,
  selected = false,
  onSelect,
}: {
  paintId: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const paint = getPaint(paintId);
  return (
    <article
      className="ds-color-sample"
      data-paint-id={paint.id}
      data-kind={paint.kind}
    >
      <button
        type="button"
        className="ds-color-swatch"
        style={{ background: paint.css }}
        aria-label={`Vyzkoušet ${paint.name}`}
        aria-pressed={selected}
        onClick={() => onSelect?.(paint.id)}
        disabled={!onSelect}
      >
        {selected && (
          <span className="ds-color-selected">
            <Check size={18} aria-hidden="true" />
          </span>
        )}
      </button>
      <div className="ds-color-caption">
        <h3>{paint.name}</h3>
        <span>{designLabel(paint.design)}</span>
      </div>
      <CopyValue paint={paint} />
    </article>
  );
}
