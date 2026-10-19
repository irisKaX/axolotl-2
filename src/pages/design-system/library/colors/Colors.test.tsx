import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { paints, copyValue } from "./paints";
import { paintInk, textContrast } from "./contrast";
import { CopyValue } from "./ColorSample";

const gradients = [
  "linear-gradient(135deg, hsla(27, 100%, 68%, 1) 0%, hsla(53, 100%, 49%, 1) 90%)",
  "linear-gradient(135deg, hsla(221, 100%, 50%, 1) 0%, hsla(221, 100%, 70%, 1) 90%)",
  "linear-gradient(135deg, hsla(240, 100%, 27%, 1) 0%, hsla(223, 100%, 45%, 1) 100%)",
  "linear-gradient(90deg, hsla(221, 100%, 50%, 1) 0%, hsla(286, 100%, 50%, 1) 100%)",
  "linear-gradient(135deg, hsla(154, 100%, 43%, 1) 0%, hsla(53, 100%, 49%, 1) 100%)",
  "linear-gradient(to right, #0acffe 0%, #495aff 100%)",
  "linear-gradient(to top, #b224ef 0%, #7579ff 100%)",
  "linear-gradient(-225deg, #AC32E4 0%, #7918F2 48%, #4801FF 100%)",
];
describe("Colors registry and safe presentation", () => {
  it("keeps the exact eight gradients and six unique solids with independent evidence", () => {
    expect(
      [
        "sunburst",
        "electric-blue",
        "deep-ocean",
        "electric-violet",
        "lime-energy",
        "arctic-blue",
        "neon-purple",
        "ultraviolet",
      ].map((id) => paints.find((p) => p.id === id)?.css),
    ).toEqual(gradients);
    expect(
      ["purple", "black", "light", "o2-blue", "white", "axolotl-violet"].map(
        (id) => paints.find((p) => p.id === id)?.css,
      ),
    ).toEqual([
      "#AC32E4",
      "#101014",
      "#F7F5FF",
      "#0050FF",
      "#FFFFFF",
      "#7C3AED",
    ]);
    expect(new Set(paints.map((p) => p.id)).size).toBe(paints.length);
    expect(
      paints.filter((p) => p.design === "approved").map((p) => p.id),
    ).toEqual(["o2-blue", "axolotl-violet"]);
    expect(
      paints
        .filter((p) => p.kind === "gradient")
        .every((p) => p.design === "draft" && !p.production),
    ).toBe(true);
  });
  it("copies the exact registry value, including the whole background declaration", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const paint = paints.find((p) => p.id === "ultraviolet")!;
    render(<CopyValue paint={paint} />);
    fireEvent.click(screen.getByRole("button", { name: /Kopírovat/ }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(`background: ${gradients[7]};`),
    );
    expect(await screen.findByText("Zkopírováno")).toBeVisible();
    expect(copyValue(paints[0])).toBe("#AC32E4");
  });
  it("reports clipboard failure without claiming success", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) },
      configurable: true,
    });
    render(<CopyValue paint={paints[0]} />);
    fireEvent.click(screen.getByRole("button", { name: /Kopírovat/ }));
    expect(await screen.findByText(/Kopírování se nezdařilo/)).toBeVisible();
    expect(screen.queryByText("Zkopírováno")).not.toBeInTheDocument();
  });
  it("uses a backing for a gradient crossing both black and white, not only endpoint averages", () => {
    expect(
      paintInk("linear-gradient(90deg, #000000 0%, #FFFFFF 100%)").backing,
    ).toBe(true);
    expect(paintInk("#101014").color).toBe("#FFFFFF");
    expect(paintInk("#FFFFFF").color).toBe("#101014");
    expect(paintInk(gradients[0]).backing).toBe(false);
    expect(textContrast("#FFFFFF", "#FFFFFF")).toBe(1);
    expect(textContrast("#000000", "#FFFFFF")).toBe(21);
    expect(
      textContrast("linear-gradient(90deg, #000000, #FFFFFF)", "#777777"),
    ).toBe(1);
    expect(paintInk("linear-gradient(red, transparent)").backing).toBe(true);
  });
});
