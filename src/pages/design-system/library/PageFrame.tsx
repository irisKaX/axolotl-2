import type { ReactNode } from "react";
import { categories, sourceUrl, type CategoryId } from "./registry";
export function Playground({
  children,
  controls,
}: {
  children: ReactNode;
  controls: ReactNode;
}) {
  return (
    <section className="ds-catalog-playground-section">
      <h2>Playground</h2>
      <div className="ds-catalog-playground">
        <div className="ds-catalog-stage" aria-label="Živý playground">
          {children}
        </div>
        <aside
          className="ds-catalog-controls"
          aria-label="Vlastnosti komponenty"
        >
          {controls}
        </aside>
      </div>
    </section>
  );
}
export function Examples({
  children,
  title = "Varianty v kontextu",
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <section className="ds-catalog-examples">
      <h2>{title}</h2>
      <div className="ds-catalog-example-grid">{children}</div>
    </section>
  );
}
export function ApiReference({ category }: { category: CategoryId }) {
  const data = categories.find((c) => c.id === category)!;
  return (
    <section className="ds-catalog-api">
      <h2>API, zdroj a použití</h2>
      <p>{data.keyboard}</p>
      {data.entries.map((entry) => (
        <details key={entry.name}>
          <summary>
            {entry.name}{" "}
            <span>
              {entry.status} · {entry.variants.length}{" "}
              {entry.variants.length === 1 ? "varianta" : "varianty"}
            </span>
          </summary>
          <p>
            <strong>Varianty:</strong> {entry.variants.join(", ")}
          </p>
          <p>
            <code>{entry.api}</code>
          </p>
          <p>{entry.consumers}</p>
          <a href={sourceUrl(entry.source)} target="_blank" rel="noreferrer">
            {entry.source} ↗
          </a>
        </details>
      ))}
    </section>
  );
}
