import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { PreferencesProvider } from "./PreferencesProvider";
import { PageContextProvider } from "./PageContextProvider";
import { createPageStore } from "../lib/browser-bridge";
import { system } from "../test/setup";

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
  beforeEach(async () => {
    history.replaceState(null, "", location.pathname + location.hash);
    // Drain the hashchange queued by test setup before mounting routing effects.
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));
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
  it("opens root menus by mouse without activating items", async () => {
    const user = userEvent.setup();
    mount();
    const media = screen.getByRole("button", { name: "Média" });
    fireEvent.mouseEnter(media);
    await waitFor(() => expect(media).toHaveAttribute("aria-expanded", "true"));
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
    Object.defineProperty(Element.prototype, 'scrollIntoView', {configurable:true,value:()=>{}});
    try {
      for (const [label, option] of [['Barevný režim','Světlý'],['Animace','Omezené']]) {
        screen.getByRole('combobox',{name:label}).focus();
        await user.keyboard('{Enter}');
        await user.click(screen.getByRole('option',{name:option}));
      }
    } finally {Reflect.deleteProperty(Element.prototype,'scrollIntoView');}
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
    // Floating UI moves initial focus asynchronously after positioning the portal.
    await waitFor(() => expect(screen.getByRole("button", { name: "Zavřít nabídku" })).toHaveFocus());
    await user.tab();
    expect(screen.getByRole("link", { name: "Metadata" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Kontrola" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Kontrola" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
  it("opens notifications in the shared header menu flow and restores focus", async () => {
    const user = userEvent.setup();
    mount();
    const notifications = screen.getByRole("button", { name: "Upozornění" });
    expect(notifications).toBeEnabled();
    await user.click(notifications);
    expect(screen.getByText("Zatím žádná upozornění")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(notifications).toHaveFocus();
    expect(notifications).toHaveAttribute("aria-expanded", "false");
    await user.click(notifications);
    await user.click(screen.getByRole("button", { name: "Média" }));
    expect(notifications).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("button", { name: "Nastavení" }));
    expect(screen.getByRole("button", { name: "Média" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Vzhled a prostředí" })).toBeVisible();
  });
  it("follows the inline header order from URL to tab picker and notifications", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("textbox", { name: "Aktuální URL" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "Vybrat kartu prohlížeče" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Upozornění" })).toHaveFocus();
  });
  it("clicking the cursor setting label disables the effect and persists after remount", async () => {
    system("(any-pointer: fine)", true);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const user = userEvent.setup();
    const app = mount();
    expect(document.querySelector(".axolotl-cursor-layer")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nastavení" }));
    await user.click(screen.getByRole("button", { name: "Vzhled a prostředí" }));
    await user.click(screen.getByText("Efekt kurzoru", { exact: true }));
    expect(screen.getByRole("switch", { name: "Efekt kurzoru" })).not.toBeChecked();
    expect(document.querySelector(".axolotl-cursor-layer")).toBeNull();
    expect(localStorage.getItem("axolotl-2-cursor-effects")).toBe("false");
    app.unmount();
    mount();
    expect(document.querySelector(".axolotl-cursor-layer")).toBeNull();
  });
  it("a late pointer leave from a closed category cannot close the next category", () => {
    vi.useFakeTimers();
    mount();
    const media = screen.getByRole("button", { name: "Média" });
    fireEvent.click(media);
    fireEvent.click(screen.getByRole("link", { name: /^Dashboard$/ }));
    // Hiding a dropdown can dispatch pointerleave after it was already closed.
    fireEvent.mouseLeave(media);
    const control = screen.getByRole("button", { name: "Kontrola" });
    fireEvent.click(control);
    act(() => vi.advanceTimersByTime(200));
    expect(control).toHaveAttribute("aria-expanded", "true");
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
  it("routes historical catalog entry to the single Library without mounting a gallery", () => {
    history.replaceState(null, "", "?catalog=legacy#design-system");
    mount();
    expect(screen.getByRole('link',{name:'Otevřít Design System Library V1.1'})).toHaveAttribute('href','https://iriskax.github.io/axolotl-preview/ds-library-v1-1/?catalog=library&section=dashboard&theme=dark#design-system');
    expect(screen.queryAllByRole('article')).toHaveLength(0);
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
