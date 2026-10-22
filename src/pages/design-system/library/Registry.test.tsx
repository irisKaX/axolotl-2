import { describe, it, expect } from "vitest";
import * as registry from "./registry";
import { Button } from "../../../design-system/Button";
import { Card } from "../../../design-system/library";

describe("Catalog extensibility contract", () => {
  it("binds every page to a loader and every record to the actual React export", () => {
    expect(registry.categories.every((c) => typeof c.load === "function")).toBe(
      true,
    );
    expect(
      registry.categories
        .flatMap((c) => c.entries)
        .every((e) => e.component && typeof e.component !== "string"),
    ).toBe(true);
    expect(registry.categories[0].entries[0].component).toBe(Button);
    expect(
      registry.categories.find((c) => c.id === "surfaces")!.entries[0]
        .component,
    ).toBe(Card);
  });
  it("keeps independent design/production decisions on unique variants, never sizes or states", () => {
    const entries = registry.categories.flatMap((c) => c.entries);
    for (const entry of entries) {
      expect(entry).not.toHaveProperty("status");
      expect(new Set(entry.variants.map((v) => v.id)).size).toBe(
        entry.variants.length,
      );
      for (const variant of entry.variants) {
        expect(["draft", "approved"]).toContain(variant.design);
        expect(typeof variant.production).toBe("boolean");
      }
    }
    const button = entries.find((e) => e.name === "Button")!;
    expect(button.variants.map((v) => v.id)).toEqual([
      "primary",
      "secondary",
      "ghost",
      "icon",
      "destructive",
    ]);
    expect(button.properties.size.options!.map((o) => o.value)).toEqual([
      "small",
      "medium",
      "large",
    ]);
    expect(entries.find((e) => e.name === "Checkbox")!.variants).toHaveLength(
      1,
    );
  });
  it("adds fixtures only in test mode without mutating normal records", () => {
    expect(registry.getCategories).toBeTypeOf("function");
    const normal = registry.getCategories(false),
      test = registry.getCategories(true);
    expect(normal).toHaveLength(11);
    expect(test).toHaveLength(12);
    const normalCard = normal.find((c) => c.id === "surfaces")!.entries[0];
    const testCard = test.find((c) => c.id === "surfaces")!.entries[0];
    expect(normalCard.variants).toHaveLength(2);
    expect(testCard.variants).toHaveLength(3);
    expect(testCard.variants.at(-1)).toMatchObject({
      id: "outline-test",
      design: "draft",
      production: false,
    });
    expect(test.at(-1)!.entries[0].variants[0]).toMatchObject({
      design: "draft",
      production: false,
    });
    expect(
      registry.getCategories(false).find((c) => c.id === "surfaces")!.entries[0]
        .variants,
    ).toHaveLength(2);
  });
});

it("registers only the two usable Dashboard widget exports as proposals", () => {
  const widgets = registry.categories.find((c) => c.id === "widgets");
  expect(
    widgets,
    "Dashboard Widgets must use the existing category registry",
  ).toBeDefined();
  expect(widgets!.entries.map((e) => e.name)).toEqual([
    "FindPhraseWidget",
    "MiniQrWidget",
  ]);
  expect(
    widgets!.entries.every(
      (e) =>
        e.variants.length === 1 &&
        e.variants[0].design === "draft" &&
        !e.variants[0].production,
    ),
  ).toBe(true);
  expect(
    widgets!.entries[0].properties.size.options!.map((o) => o.value),
  ).toEqual(["medium", "large"]);
});
