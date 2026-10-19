import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { DesignSystemProvider, useDesignSystem } from "./Provider";
import { categories } from "../../pages/design-system/library/registry";
function Probe() {
  const e = useDesignSystem();
  return (
    <output>
      {e.appearance}/{e.theme}
    </output>
  );
}
it("keeps the original visual environment as default outside the opt-in catalog", () => {
  render(
    <DesignSystemProvider>
      <Probe />
    </DesignSystemProvider>,
  );
  expect(screen.getByRole("status")).toHaveTextContent("original/dark");
});
it("inherits unified appearance through nested theme scopes without changing the theme owner", () => {
  render(
    <DesignSystemProvider appearance="unified" theme="dark">
      <DesignSystemProvider theme="light">
        <Probe />
      </DesignSystemProvider>
    </DesignSystemProvider>,
  );
  expect(screen.getByRole("status")).toHaveTextContent("unified/light");
});
it("keeps Button variants and motion API but records revised visuals as proposals", () => {
  const button = categories.find((c) => c.id === "buttons")!.entries[0];
  expect(button.variants).toHaveLength(5);
  expect(
    button.variants.every((v) => v.design === "draft" && !v.production),
  ).toBe(true);
  expect(button.properties.motion.options?.map((o) => o.value)).toEqual([
    "none",
    "star-border",
  ]);
});
