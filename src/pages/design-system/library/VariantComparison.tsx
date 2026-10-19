import { createElement, useState } from "react";
import { type Entry, designLabel } from "./model";
import { VariantControl } from "./Controls";
function Specimen({ entry, id }: { entry: Entry; id: string }) {
  const [actions, setActions] = useState(0),
    variant = entry.variants.find((v) => v.id === id)!;
  return (
    <div>
      <p>
        {variant.label} · {designLabel(variant.design)}
      </p>
      {createElement(entry.component, {
        ...entry.previewProps,
        ...variant.props,
        ...(entry.name === "Button"
          ? { onClick: () => setActions((n) => n + 1) }
          : {}),
      })}
      {entry.name === "Button" && (
        <output aria-label={`Aktivace ${variant.label}`}>
          Aktivace: {actions}
        </output>
      )}
    </div>
  );
}
/** Two real exports with the same sample data; no screenshots or component clones. */
export function VariantComparison({ entry }: { entry: Entry }) {
  const [left, setLeft] = useState(entry.variants[0].id),
    [right, setRight] = useState(entry.variants[1].id);
  return (
    <section
      className="ds-catalog-comparison"
      aria-label={`Porovnání ${entry.name}`}
    >
      <h3>Porovnat varianty</h3>
      <div className="ds-catalog-example-grid">
        <div>
          <VariantControl
            entry={entry}
            label="Levá varianta"
            value={left}
            onValueChange={setLeft}
          />
          <Specimen key={left} entry={entry} id={left} />
        </div>
        <div>
          <VariantControl
            entry={entry}
            label="Pravá varianta"
            value={right}
            onValueChange={setRight}
          />
          <Specimen key={right} entry={entry} id={right} />
        </div>
      </div>
    </section>
  );
}
