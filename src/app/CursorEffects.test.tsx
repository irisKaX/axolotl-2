import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createPreferencesStore } from "../lib/preferences";
import { system } from "../test/setup";
import { CursorEffects } from "./CursorEffects";
import { PreferencesProvider } from "./PreferencesProvider";

describe("Glow Cursor integration", () => {
  it("releases the effect when disabled or motion is reduced, and restores the saved choice", () => {
    system("(any-pointer: fine)", true);
    const context = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const store = createPreferencesStore();
    const { container, unmount } = render(<PreferencesProvider store={store}><CursorEffects /></PreferencesProvider>);
    expect(container.querySelector("canvas")).toBeInTheDocument();
    expect(context).toHaveBeenCalledWith("webgl2", expect.any(Object));
    act(() => { store.set("cursor", false); });
    expect(container.querySelector("canvas")).toBeNull();
    act(() => { store.set("cursor", true); store.set("motion", "reduced"); });
    expect(container.querySelector("canvas")).toBeNull();
    act(() => { store.set("motion", "full"); });
    expect(container.querySelector("canvas")).toBeInTheDocument();
    unmount();
    expect(container).toBeEmptyDOMElement();
  });

  it("does not allocate a graphics context on a touch-only device and responds to a connected mouse", () => {
    const context = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<PreferencesProvider><CursorEffects /></PreferencesProvider>);
    expect(context).not.toHaveBeenCalled();
    act(() => { system("(any-pointer: fine)", true); });
    expect(container.querySelector("canvas")).toBeInTheDocument();
    act(() => { system("(any-pointer: fine)", false); });
    expect(container.querySelector("canvas")).toBeNull();
  });
});
