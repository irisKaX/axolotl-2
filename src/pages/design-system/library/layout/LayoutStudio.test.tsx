import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DesignSystemProvider } from "../../../../design-system/library";
import { LayoutStudio } from "./LayoutStudio";
function mount() {
  return render(
    <DesignSystemProvider appearance="unified">
      <LayoutStudio />
    </DesignSystemProvider>,
  );
}
describe("layout editor", () => {
  it("locks anchors, provides edit controls and returns to the default composition", () => {
    mount();
    expect(
      screen.getByRole("heading", { name: "Pracovní plocha", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Axolotl Office" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Notebook" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Odebrat/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Upravit Dashboard" }));
    expect(screen.getAllByRole("button", { name: /Odebrat/ })).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Odebrat Mini QR" }));
    expect(screen.getAllByRole("button", { name: /Odebrat/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Obnovit výchozí" }));
    expect(screen.getAllByRole("button", { name: /Odebrat/ })).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "Odebrat Axolotl Office" }),
    ).not.toBeInTheDocument();
  });
  it("retains real input state when moving and toggling structural content", () => {
    const { container } = mount();
    fireEvent.click(
      screen.getByRole("switch", { name: "Skutečné UI widgetů" }),
    );
    const search = container.querySelector(
      '[data-layout-item="search-1"]',
    ) as HTMLElement;
    fireEvent.change(within(search).getByLabelText("Hledaná fráze"), {
      target: { value: "Rozepsaný dotaz" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upravit Dashboard" }));
    fireEvent.keyDown(
      screen.getByRole("button", { name: "Přesunout Find Phrase" }),
      { key: "ArrowRight" },
    );
    expect(search).toHaveAttribute("data-layout-item", "search-1");
    expect(within(search).getByLabelText("Hledaná fráze")).toHaveValue(
      "Rozepsaný dotaz",
    );
    fireEvent.click(
      screen.getByRole("switch", { name: "Skutečné UI widgetů" }),
    );
    fireEvent.click(
      screen.getByRole("switch", { name: "Skutečné UI widgetů" }),
    );
    expect(within(search).getByLabelText("Hledaná fráze")).toHaveValue(
      "Rozepsaný dotaz",
    );
  });
});
