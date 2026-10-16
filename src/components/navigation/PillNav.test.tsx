import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import PillNav from "./PillNav";

it.each([96, 320])("opens a %ipx dropdown from its actual toggle", async panelWidth => {
  // jsdom supplies no layout or WAAPI; these are the measured layout inputs.
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (this: HTMLElement) {
    return this.classList.contains("axolotl-pill-nav__panel") ? panelWidth : 44;
  });
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
    return this.classList.contains("axolotl-pill-nav__panel") ? 240 : 44;
  });
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (this: HTMLElement) {
    return this.classList.contains("axolotl-pill-nav__toggle") ? 52 : 0;
  });
  const original = Object.getOwnPropertyDescriptor(Element.prototype, "animate");
  const panelFrames: Keyframe[][] = [];
  Object.defineProperty(Element.prototype, "animate", { configurable: true, value: function (this: Element, frames: Keyframe[]) {
    if (this.classList.contains("axolotl-pill-nav__panel")) panelFrames.push(frames);
    return { cancel() {}, onfinish: null };
  } });
  try {
    const user = userEvent.setup();
    render(<PillNav logo="logo.svg" collapse="always" intro={false} reducedMotion={false} items={[{ label: "Dashboard", href: "#dashboard" }]} />);
    await user.click(screen.getByRole("button", { name: "Otevřít navigaci" }));
    expect(panelFrames[0][0].clipPath).toBe(`inset(0px ${panelWidth - 96}px 196px 52px round 22px)`);
  } finally {
    if (original) Object.defineProperty(Element.prototype, "animate", original);
    else Reflect.deleteProperty(Element.prototype, "animate");
  }
});
