import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreferencesProvider } from "../../app/PreferencesProvider";
import { createPreferencesStore } from "../../lib/preferences";
import { LivingOffice } from "./LivingOffice";

const clock = vi.hoisted(() => ({ elapsedMs: 0 }));
vi.mock("./useOfficeClock", () => ({
  useOfficeClock: ({ paused }: { paused: boolean }) => ({
    elapsedMs: clock.elapsedMs, running: !paused, ref: { current: null },
  }),
}));

function mount() {
  const store = createPreferencesStore();
  const view = render(<PreferencesProvider store={store}><LivingOffice /></PreferencesProvider>);
  return { ...view, store };
}

describe("living office", () => {
  beforeEach(() => { clock.elapsedMs = 0; });
  it("renders four separate workers and changes lighting without returning a visitor to their desk", () => {
    clock.elapsedMs = 18_000;
    const { store, container } = mount();
    const office = screen.getByRole("region", { name: "Axolotlí office" });
    expect(container.querySelectorAll("[data-office-actor]")).toHaveLength(4);
    const visitor = container.querySelector('[data-office-actor="front"]')!;
    expect(visitor).toHaveAttribute("data-activity", "walk");
    const location = visitor.getAttribute("style");
    act(() => { store.set("theme", "light"); });
    expect(office).toHaveAttribute("data-theme", "light");
    expect(visitor).toHaveAttribute("data-activity", "walk");
    expect(visitor.getAttribute("style")).toBe(location);
    expect(container.querySelectorAll('[data-office-actor="front"]')).toHaveLength(1);
  });
  it("offers an accessible pause and resume action", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Pozastavit office" }));
    expect(screen.getByRole("region", { name: "Axolotlí office" })).toHaveAttribute("data-running", "false");
    fireEvent.click(screen.getByRole("button", { name: "Pustit office" }));
    expect(screen.getByRole("region", { name: "Axolotlí office" })).toHaveAttribute("data-running", "true");
  });
  it("takes the mug off the desk while its worker drinks", () => {
    clock.elapsedMs = 8_000;
    const { container } = mount();
    expect(container.querySelector('[data-office-actor="front"]')).toHaveAttribute("data-activity", "sip");
    expect(container.querySelector('[data-office-mug="front"]')).toBeNull();
    expect(container.querySelectorAll("[data-office-mug]")).toHaveLength(2);
  });
  it("offers a retry when an artwork request fails and reveals the scene after successful retry", async () => {
    let fail = true;
    vi.stubGlobal("Image", class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(value: string) { queueMicrotask(() => fail && value.includes("office-walk") ? this.onerror?.() : this.onload?.()); }
    });
    mount();
    expect(await screen.findByText("Office se nepodařilo načíst.")).toBeVisible();
    expect(screen.getByRole("region", { name: "Axolotlí office" })).toHaveAttribute("data-ready", "false");
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Načíst znovu" }));
    await waitFor(() => expect(screen.getByRole("region", { name: "Axolotlí office" })).toHaveAttribute("data-ready", "true"));
    expect(screen.queryByText("Office se nepodařilo načíst.")).not.toBeInTheDocument();
  });
  it("settles all workers at their workstations when reduced motion is selected mid-walk", () => {
    clock.elapsedMs = 19_000;
    const { store, container } = mount();
    expect(container.querySelector('[data-activity="walk"]')).not.toBeNull();
    act(() => { store.set("motion", "reduced"); });
    expect(container.querySelector('[data-activity="walk"]')).toBeNull();
    expect(container.querySelectorAll('[data-activity="work"]')).toHaveLength(3);
    expect(container.querySelector('[data-activity="laptop"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: "Pustit office" })).toBeDisabled();
  });
});
