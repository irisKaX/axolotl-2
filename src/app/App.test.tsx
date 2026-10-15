import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { PreferencesProvider } from "./PreferencesProvider";
import { PageContextProvider } from "./PageContextProvider";
import { createPageStore } from "../lib/browser-bridge";
function mount() {
  const page = createPageStore();
  return {
    ...render(
      <PreferencesProvider>
        <PageContextProvider store={page}>
          <App />
        </PageContextProvider>
      </PreferencesProvider>,
    ),
    page,
  };
}
describe("migrated application", () => {
  beforeEach(() => {
    // jsdom has no layout; browser tests cover actual responsive measurements.
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(680);
  });
  it("marks the active PillNav category for a direct tool link and returns home", async () => {
    location.hash = "#kontrola/metadata";
    const user = userEvent.setup();
    mount();
    const control = screen.getByRole("button", { name: "Kontrola" });
    expect(control).toHaveAttribute("aria-current", "true");
    await user.click(control);
    expect(screen.getByRole("link", { name: "Metadata" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("link", { name: /^Dashboard$/ }));
    await screen.findByRole("main", { name: "Dashboard" });
    expect(screen.getByRole("link", { name: /^Dashboard$/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Kontrola" })).not.toHaveAttribute("aria-current");
  });
  it("keeps the office blank and opens root menus by mouse without activating items", async () => {
    const user = userEvent.setup();
    mount();
    expect(
      document.getElementById("axolotl-office-slot"),
    ).toBeEmptyDOMElement();
    const media = screen.getByRole("button", { name: "Média" });
    // jsdom does not supply PointerEvent properties by default.
    const enter = new MouseEvent("pointerover", { bubbles: true });
    Object.defineProperty(enter, "pointerType", { value: "mouse" });
    fireEvent(media, enter);
    expect(media).toHaveAttribute("aria-expanded", "true");
    await user.hover(screen.getByRole("link", { name: "QR" }));
    expect(location.hash).toBe("#dashboard");
    await user.click(screen.getByRole("link", { name: "QR" }));
    await screen.findByRole("main", { name: "QR" });
    expect(media).toHaveAttribute("aria-expanded", "false");
  });
  it("settings subviews activate on click; preferences remain after remount", async () => {
    const user = userEvent.setup();
    let app = mount();
    await user.click(screen.getByRole("button", { name: "Nastavení" }));
    await user.hover(
      screen.getByRole("button", { name: "Vzhled a prostředí" }),
    );
    expect(screen.queryByLabelText("Barevný režim")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Vzhled a prostředí" }),
    );
    await user.selectOptions(screen.getByLabelText("Barevný režim"), "light");
    await user.selectOptions(screen.getByLabelText("Animace"), "reduced");
    expect(
      screen.getByRole("switch", { name: "Efekt kurzoru" }),
    ).toBeDisabled();
    expect(document.documentElement.dataset.theme).toBe("light");
    app.unmount();
    app = mount();
    expect(
      screen.getByRole("checkbox", { name: "Tmavý režim" }),
    ).not.toBeChecked();
    expect(document.documentElement.dataset.motion).toBe("reduced");
    app.unmount();
  });
  it("Escape returns keyboard focus to the menu trigger", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Kontrola" }));
    await user.tab();
    expect(screen.getByRole("link", { name: "Metadata" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Kontrola" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Kontrola" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
  it("does not overwrite a URL being edited and Escape restores the committed URL", async () => {
    const user = userEvent.setup();
    const { page } = mount();
    act(() => {
      page.commitManual("example.com");
    });
    const input = screen.getByRole("textbox", { name: "Aktuální URL" });
    await user.click(input);
    await user.clear(input);
    await user.type(input, "rozpracovano.cz");
    act(() => {
      page.commitManual("other.example");
    });
    expect(input).toHaveValue("rozpracovano.cz");
    await user.keyboard("{Escape}");
    expect(input).toHaveValue("https://other.example/");
    await user.clear(input);
    await user.type(input, "novy.example{Enter}");
    expect(page.getSnapshot().context.url).toBe("https://novy.example/");
  });
  it("exposes all eight sample variants without pretending QR generation works", async () => {
    location.hash = "#design-system";
    const user = userEvent.setup();
    mount();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    await user.click(
      screen.getAllByRole("button", { name: "Prohlédnout ukázku" })[0],
    );
    expect(
      screen.getByRole("dialog", { name: "Ukázková metadata" }),
    ).toBeVisible();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("tab", { name: "QR kód" }));
    expect(screen.getAllByRole("article")).toHaveLength(3);
    screen
      .getAllByRole("button", { name: "Vytvořit QR" })
      .forEach((button) => expect(button).toBeDisabled());
    await user.click(screen.getByRole("tab", { name: "Rychlé akce" }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
    await user.click(
      within(screen.getAllByRole("article")[0]).getByRole("button", {
        name: "Poznámka",
      }),
    );
    expect(
      screen.getByText("Poznámka: nástroj přidáme později."),
    ).toBeVisible();
  });
  it("clears native validity when an external valid URL replaces an invalid draft", async () => {
    const user = userEvent.setup();
    const { page } = mount();
    const input = screen.getByRole("textbox", { name: "Aktuální URL" });
    await user.type(input, "javascript:alert(1){Enter}");
    expect(input).toBeInvalid();
    await user.click(screen.getByRole("button", { name: "Nastavení" }));
    act(() => {
      page.commitManual("valid.example");
    });
    expect(input).toHaveValue("https://valid.example/");
    expect(input).toBeValid();
  });
  it("cleans up polling and cursor particles on unmount", () => {
    vi.useFakeTimers();
    const post = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    const app = mount();
    const before = post.mock.calls.length;
    app.unmount();
    act(() => vi.advanceTimersByTime(10000));
    expect(post).toHaveBeenCalledTimes(before);
    expect(document.querySelector(".axolotl-cursor-layer")).toBeNull();
  });
});
