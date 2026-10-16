import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DesignSystem } from "./DesignSystem";
import { PreferencesProvider } from "../app/PreferencesProvider";
import { PageContextProvider } from "../app/PageContextProvider";
import { createPreferencesStore } from "../lib/preferences";
import { createPageStore } from "../lib/browser-bridge";
import { system } from "../test/setup";

async function catalog() {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(680);
  const post = vi.spyOn(window, "postMessage").mockImplementation(() => {});
  const page = createPageStore();
  const user = userEvent.setup();
  const view = render(<PreferencesProvider><PageContextProvider store={page}><DesignSystem /></PageContextProvider></PreferencesProvider>);
  await user.click(screen.getByRole("tab", { name: "Hlavička · A/B" }));
  await screen.findByRole("region", { name: "Varianta A – tmavý režim" });
  return { ...view, user, page, post };
}

describe("isolated header catalog", () => {
  it("keeps preview preferences separate from production preferences", () => {
    localStorage.setItem("axolotl-2-theme", "dark");
    const preview = createPreferencesStore({ storagePrefix: "axolotl-header-lab-test", initialTheme: "light" });
    expect(preview.getSnapshot().resolvedTheme).toBe("light");
    preview.set("theme", "dark");
    preview.set("theme", "light");
    expect(localStorage.getItem("axolotl-2-theme")).toBe("dark");
    expect(createPreferencesStore({ storagePrefix: "axolotl-header-lab-test", initialTheme: "dark" }).getSnapshot().theme).toBe("light");
  });

  it("scoped preference providers never replace the page theme or public preferences API", () => {
    const store = createPreferencesStore();
    store.set("theme", "light");
    document.documentElement.dataset.theme = "dark";
    const api = window.axolotlPreferences;
    render(<PreferencesProvider store={store} scoped><span>Scoped content</span></PreferencesProvider>);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.axolotlPreferences).toBe(api);
  });

  it("shows both variants in both themes and toggles only the chosen preview", async () => {
    const { user } = await catalog();
    const darkA = screen.getByRole("region", { name: "Varianta A – tmavý režim" });
    const lightA = screen.getByRole("region", { name: "Varianta A – světlý režim" });
    expect(screen.getByRole("region", { name: "Varianta B – tmavý režim" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Varianta B – světlý režim" })).toBeVisible();
    expect(darkA.querySelector("[data-header-theme]")).toHaveAttribute("data-header-theme", "dark");
    await user.click(within(darkA).getByRole("checkbox", { name: "Tmavý režim" }));
    expect(darkA.querySelector("[data-header-theme]")).toHaveAttribute("data-header-theme", "light");
    expect(lightA.querySelector("[data-header-theme]")).toHaveAttribute("data-header-theme", "light");
    expect(document.documentElement.dataset.theme).toBe("dark");
    const ids = [...document.querySelectorAll("[id]")].map(el => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses the actual shared URL store and extension response rather than example tabs", async () => {
    const { user, page, post } = await catalog();
    const a = within(screen.getByRole("region", { name: "Varianta A – tmavý režim" }));
    const b = within(screen.getByRole("region", { name: "Varianta B – světlý režim" }));
    await user.type(a.getByRole("textbox", { name: "Aktuální URL" }), "o2.cz{Enter}");
    expect(page.getSnapshot().context.url).toBe("https://o2.cz/");
    expect(b.getByRole("textbox", { name: "Aktuální URL" })).toHaveValue("https://o2.cz/");
    const request = post.mock.calls.find(([m]) => m.type === "AXOLOTL_GET_TABS")![0];
    act(() => window.dispatchEvent(new MessageEvent("message", { source: window, origin: location.origin, data: { source: "axolotl-extension", type: "AXOLOTL_TABS", requestId: request.requestId, ok: true, activeId: 42, tabs: [{ id: 42, title: "Skutečná odpověď bridge", url: "https://example.test/real" }] } })));
    const trigger = b.getByRole("button", { name: "Vybrat kartu prohlížeče" });
    await user.click(trigger);
    await user.click(b.getByRole("button", { name: /Skutečná odpověď bridge/ }));
    expect(page.getSnapshot().context.tabId).toBe(42);
    expect(a.getByRole("textbox", { name: "Aktuální URL" })).toHaveValue("https://example.test/real");
    expect(trigger).toHaveFocus();
  });

  it("keeps settings labels, back navigation and Escape focus scoped to their preview", async () => {
    const { user } = await catalog();
    const scope = within(screen.getByRole("region", { name: "Varianta B – světlý režim" }));
    const trigger = scope.getByRole("button", { name: "Nastavení" });
    await user.click(trigger);
    await user.click(scope.getByRole("button", { name: "Vzhled a prostředí" }));
    await user.selectOptions(scope.getByLabelText("Animace"), "reduced");
    expect(scope.getByRole("switch", { name: "Efekt kurzoru" })).toBeDisabled();
    await user.click(scope.getByRole("button", { name: "Zpět do nastavení" }));
    await vi.waitFor(() => expect(scope.getByRole("button", { name: "Vzhled a prostředí" })).toHaveFocus());
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens an honest notification empty state and offers actual viewport widths", async () => {
    const { user } = await catalog();
    const scope = within(screen.getByRole("region", { name: "Varianta A – tmavý režim" }));
    await user.click(scope.getByRole("button", { name: "Upozornění" }));
    expect(scope.getByText("Zatím žádná upozornění")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(scope.getByRole("button", { name: "Upozornění" })).toHaveFocus();
    const viewport = screen.getByRole("region", { name: "Celá hlavička" }).querySelector("[data-preview-width]");
    expect(viewport).toHaveAttribute("data-preview-width", "1366");
    await user.click(screen.getByRole("button", { name: "390 px" }));
    expect(viewport).toHaveAttribute("data-preview-width", "390");
  });

  it("disables cursor-tracking lighting when reduced motion is requested", async () => {
    system("(prefers-reduced-motion: reduce)", true);
    await catalog();
    const area = screen.getByRole("region", { name: "Varianta B – tmavý režim" }).querySelector<HTMLElement>(".axolotl-header-controls")!;
    const event = new MouseEvent("pointermove", { bubbles: true, clientX: 150, clientY: 30 });
    Object.defineProperty(event, "pointerType", { value: "mouse" });
    fireEvent(area, event);
    expect(area.style.getPropertyValue("--header-pointer-x")).toBe("");
  });

  it("keeps workbench theme buttons synchronized with its live switch", async () => {
    const { user } = await catalog();
    const workbench = within(screen.getByRole("region", { name: "Celá hlavička" }));
    await user.click(workbench.getByRole("checkbox", { name: "Tmavý režim" }));
    expect(workbench.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "true");
    await user.click(workbench.getByRole("button", { name: "Dark" }));
    expect(workbench.getByRole("checkbox", { name: "Tmavý režim" })).toBeChecked();
  });
});
