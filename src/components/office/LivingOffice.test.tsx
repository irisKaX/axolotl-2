import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  return {
    ...view,
    store,
    advanceTo(elapsedMs: number) {
      clock.elapsedMs = elapsedMs;
      view.rerender(<PreferencesProvider store={store}><LivingOffice /></PreferencesProvider>);
    },
  };
}

describe("living office", () => {
  beforeEach(() => { clock.elapsedMs = 0; });
  afterEach(() => { vi.unstubAllGlobals(); });
  it("renders four separate workers and changes lighting without resetting a sip", () => {
    clock.elapsedMs = 8_000;
    const { store, container } = mount();
    const office = screen.getByRole("region", { name: "Axolotlí office" });
    expect(container.querySelectorAll("[data-office-actor]")).toHaveLength(4);
    const worker = container.querySelector('[data-office-actor="front"]')!;
    expect(worker).toHaveAttribute("data-activity", "sip");
    const location = worker.getAttribute("style");
    act(() => { store.set("theme", "light"); });
    expect(office).toHaveAttribute("data-theme", "light");
    expect(worker).toHaveAttribute("data-activity", "sip");
    expect(worker.getAttribute("style")).toBe(location);
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
  it("keeps the same visible cup through the start of a pickup", () => {
    const { container, advanceTo } = mount();
    const cup = container.querySelector<HTMLElement>('[data-office-cup="front"]');
    expect(cup).not.toBeNull();
    const resting = cup!.getAttribute("style");
    advanceTo(6_000);
    expect(container.querySelector('[data-office-cup="front"]')).toBe(cup);
    expect(cup!.getAttribute("style")).toBe(resting);
    expect(cup!.style.opacity).not.toBe("0");
    advanceTo(8_000);
    expect(container.querySelector('[data-office-cup="front"]')).toBe(cup);
  });
  it("offers a retry when room artwork fails and reveals the scene after successful retry", async () => {
    let fail = true;
    vi.stubGlobal("Image", class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(value: string) { queueMicrotask(() => fail && value.includes("office-room") ? this.onerror?.() : this.onload?.()); }
    });
    mount();
    expect(await screen.findByText("Office se nepodařilo načíst.")).toBeVisible();
    expect(screen.getByRole("region", { name: "Axolotlí office" })).toHaveAttribute("data-ready", "false");
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Načíst znovu" }));
    await waitFor(() => expect(screen.getByRole("region", { name: "Axolotlí office" })).toHaveAttribute("data-ready", "true"));
    expect(screen.queryByText("Office se nepodařilo načíst.")).not.toBeInTheDocument();
  });
  it("returns to still working poses when reduced motion is selected during a sip", () => {
    clock.elapsedMs = 8_000;
    const { store, container } = mount();
    expect(container.querySelector('[data-activity="sip"]')).not.toBeNull();
    act(() => { store.set("motion", "reduced"); });
    expect(container.querySelector('[data-activity="sip"]')).toBeNull();
    expect(container.querySelectorAll('[data-activity="work"]')).toHaveLength(3);
    expect(container.querySelector('[data-activity="laptop"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: "Pustit office" })).toBeDisabled();
  });
  it("keeps every worker at the same seat throughout coffee and phone actions", () => {
    const { container, advanceTo } = mount();
    const locations = () => [...container.querySelectorAll<HTMLElement>("[data-office-actor]")].map(worker => ({
      id: worker.dataset.officeActor,
      left: worker.style.left,
      top: worker.style.top,
      width: worker.style.width,
      away: worker.dataset.away,
    }));
    const seated = locations();
    expect(seated).toHaveLength(4);
    expect(seated.every(worker => worker.away === "false")).toBe(true);
    for (const time of [8_000, 20_500, 27_000, 60_000, 120_000, 240_000]) {
      advanceTo(time);
      expect(locations()).toEqual(seated);
      expect(container.querySelector('[data-activity="walk"], [data-activity="window"], [data-activity="coffee"]')).toBeNull();
    }
  });
  it("gives every worker separate hands without changing their body artwork while typing", () => {
    const { container, advanceTo } = mount();
    const workers = [...container.querySelectorAll("[data-office-actor]")];
    const bodies = workers.map(worker => worker.querySelector("[data-office-body]")?.getAttribute("style"));
    for (const worker of workers) {
      expect(worker.querySelector("[data-office-body]")).not.toBeNull();
      expect(worker.querySelectorAll("[data-office-hand]").length).toBeGreaterThan(0);
    }
    advanceTo(1_000);
    expect(workers.map(worker => worker.querySelector("[data-office-body]")?.getAttribute("style"))).toEqual(bodies);
  });
});
