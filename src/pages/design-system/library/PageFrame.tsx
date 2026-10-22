import type { ReactNode } from "react";
import { sourceUrl, type Category } from "./registry";
import { designLabel } from "./model";
import { VariantComparison } from "./VariantComparison";
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
export function ApiReference({ category: data }: { category: Category }) {
  return (
    <section className="ds-catalog-api">
      <h2>API, zdroj a použití</h2>
      <p>{data.keyboard}</p>
      {data.entries.map((entry) => (
        <details key={entry.name}>
          <summary>
            {entry.name}{" "}
            <span>
              {entry.variants.length}{" "}
              {entry.variants.length === 1 ? "varianta" : "varianty"}
            </span>
          </summary>
          <p>
            <strong>Varianty:</strong>{" "}
            {entry.variants
              .map((v) => `${v.label} · ${designLabel(v.design)}`)
              .join(", ")}
          </p>
          <p>
            <code>{entry.api}</code>
          </p>
          <p>
            <strong>Produkční použití:</strong>{" "}
            {entry.variants
              .map(
                (v) =>
                  `${v.label}: ${v.production ? "Produkčně použito" : "Zatím se nepoužívá"}`,
              )
              .join("; ")}
          </p>
          <p>{entry.consumers}</p>
          <p>
            <strong>Skutečný export:</strong> <code>{entry.name}</code>
          </p>
          <p>
            <strong>Podporované vlastnosti:</strong>{" "}
            {Object.entries(entry.properties)
              .map(
                ([name, p]) =>
                  `${name}${p.options ? " (" + p.options.map((o) => o.label).join(", ") + ")" : ""}`,
              )
              .join("; ")}
          </p>
          {entry.variants.length > 1 && entry.previewProps && (
            <VariantComparison entry={entry} />
          )}
          <a href={sourceUrl(entry.source)} target="_blank" rel="noreferrer">
            {entry.source} ↗
          </a>
        </details>
      ))}
    </section>
  );
}
