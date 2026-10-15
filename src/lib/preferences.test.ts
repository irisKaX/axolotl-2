import { describe, it, expect, vi } from "vitest";
import { createPreferencesStore } from "./preferences";
import { system } from "../test/setup";

describe("appearance preferences", () => {
  it("restores the existing storage keys and saves all choices across reloads", () => {
    const store = createPreferencesStore();
    expect(store.getSnapshot().resolvedTheme).toBe("dark");
    store.set("theme", "light");
    store.set("textSize", "large");
    store.set("motion", "reduced");
    store.set("cursor", false);
    const next = createPreferencesStore();
    expect(next.getSnapshot()).toMatchObject({
      theme: "light",
      resolvedTheme: "light",
      textSize: "large",
      reducedMotion: true,
      cursor: false,
    });
  });
  it("follows system theme until a manual choice is made", () => {
    const store = createPreferencesStore();
    const stop = store.start();
    store.set("theme", "system");
    expect(store.getSnapshot().resolvedTheme).toBe("light");
    system("(prefers-color-scheme: dark)", true);
    expect(store.getSnapshot().resolvedTheme).toBe("dark");
    store.set("theme", "light");
    system("(prefers-color-scheme: dark)", false);
    system("(prefers-color-scheme: dark)", true);
    expect(store.getSnapshot().resolvedTheme).toBe("light");
    stop();
  });
  it("pauses cursor animation without discarding the stored switch choice", () => {
    const store = createPreferencesStore();
    const stop = store.start();
    store.set("cursor", true);
    system("(prefers-reduced-motion: reduce)", true);
    expect(store.getSnapshot()).toMatchObject({
      cursor: true,
      reducedMotion: true,
    });
    store.set("motion", "full");
    expect(store.getSnapshot().reducedMotion).toBe(false);
    stop();
  });
  it("rejects invalid choices and continues in memory if storage is blocked", () => {
    const store = createPreferencesStore();
    expect(store.set("theme", "invalid")).toMatchObject({ accepted: false });
    expect(store.set("__proto__", "light")).toMatchObject({ accepted: false });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(store.set("theme", "light")).toEqual({
      accepted: true,
      saved: false,
    });
    expect(store.getSnapshot().resolvedTheme).toBe("light");
  });
  it("syncs another tab, deduplicates notifications and removes listeners on stop", () => {
    const store = createPreferencesStore();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    const stop = store.start();
    localStorage.setItem("axolotl-2-theme", "light");
    window.dispatchEvent(
      new StorageEvent("storage", { key: "axolotl-2-theme" }),
    );
    expect(store.getSnapshot().theme).toBe("light");
    const calls = listener.mock.calls.length;
    window.dispatchEvent(
      new StorageEvent("storage", { key: "axolotl-2-theme" }),
    );
    expect(listener).toHaveBeenCalledTimes(calls);
    stop();
    off();
    localStorage.setItem("axolotl-2-theme", "dark");
    window.dispatchEvent(
      new StorageEvent("storage", { key: "axolotl-2-theme" }),
    );
    expect(store.getSnapshot().theme).toBe("light");
  });
});
