import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { useDisclosure } from "./useDisclosure";

function Fixture() {
  const [openId, setOpenId] = useState<string | null>(null);
  const menu = useDisclosure("settings", openId, setOpenId);
  return (
    <div ref={menu.root} {...menu.rootProps}>
      <button ref={menu.trigger} {...menu.triggerProps}>Nastavení</button>
      <div data-axolotl-panel hidden={!menu.open}>Panel nastavení</div>
    </div>
  );
}

afterEach(() => { vi.useRealTimers(); });

it("keeps settings open after a touch pointerleave", () => {
  vi.useFakeTimers();
  render(<Fixture />);
  fireEvent.click(screen.getByRole("button", { name: "Nastavení" }));
  expect(screen.getByText("Panel nastavení").hasAttribute("hidden")).toBe(false);
  fireEvent.pointerLeave(screen.getByRole("button", { name: "Nastavení" }).parentElement!, { pointerType: "touch" });
  act(() => vi.advanceTimersByTime(300));
  expect(screen.getByText("Panel nastavení").hasAttribute("hidden")).toBe(false);
});

it("still dismisses mouse-hover menus after pointer leaves", () => {
  vi.useFakeTimers();
  const { container } = render(<Fixture />);
  const root = container.firstElementChild!;
  fireEvent.pointerEnter(root, { pointerType: "mouse" });
  expect(screen.getByText("Panel nastavení").hasAttribute("hidden")).toBe(false);
  fireEvent.pointerLeave(root, { pointerType: "mouse" });
  act(() => vi.advanceTimersByTime(300));
  expect(screen.getByText("Panel nastavení").hasAttribute("hidden")).toBe(true);
});
