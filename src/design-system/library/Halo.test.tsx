import { Profiler } from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi, beforeEach } from "vitest";
import {
  Card,
  InteractiveCard,
  ToolCard,
  WidgetCard,
  Panel,
  StateCard,
} from "./Surfaces";

import { categories } from "../../pages/design-system/library/registry";

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
it("preserves original Halo unless the new API is explicitly enabled", () => {
  const { rerender } = render(
    <Card family="halo" title="Original">
      Content
    </Card>,
  );
  expect(screen.getByRole("article")).not.toHaveAttribute("data-halo");
  rerender(
    <Card family="halo" halo={{}} title="New">
      Content
    </Card>,
  );
  expect(screen.getByRole("article")).toHaveAttribute("data-halo", "soft");
});
it("chooses purpose-specific defaults on all six actual exports", () => {
  render(
    <>
      <Card family="halo" halo={{}} title="Content">
        Text
      </Card>
      <InteractiveCard
        family="halo"
        halo={{}}
        title="Pick"
        description="Select"
      />
      <ToolCard
        family="halo"
        halo={{}}
        title="Tool"
        description="Action"
        action={<button>Open</button>}
      />
      <WidgetCard family="halo" halo={{}} title="Widget">
        Data
      </WidgetCard>
      <Panel family="halo" halo={{}} aria-label="Panel">
        Text
      </Panel>
      <StateCard family="halo" halo={{}} state="empty" />
    </>,
  );
  expect(screen.getByRole("article", { name: "Content" })).toHaveAttribute(
    "data-halo",
    "soft",
  );
  expect(screen.getByRole("button", { name: /Pick/ })).toHaveAttribute(
    "data-halo",
    "spatial",
  );
  expect(screen.getByRole("article", { name: "Tool" })).toHaveAttribute(
    "data-halo",
    "cinematic",
  );
  expect(screen.getByRole("article", { name: "Widget" })).toHaveAttribute(
    "data-halo",
    "spatial",
  );
  expect(screen.getByRole("region", { name: "Panel" })).toHaveAttribute(
    "data-halo",
    "soft",
  );
  expect(screen.getByRole("article", { name: "Workspace" })).toHaveAttribute(
    "data-halo",
    "soft",
  );
});
it("retains keyboard selection and blocks loading activation", async () => {
  const user = userEvent.setup(),
    click = vi.fn();
  const { rerender } = render(
    <InteractiveCard
      family="halo"
      halo={{ intensity: "cinematic" }}
      title="Choose"
      description="Item"
      onClick={click}
    />,
  );
  await user.tab();
  await user.keyboard("{Enter} ");
  expect(click).toHaveBeenCalledTimes(2);
  rerender(
    <InteractiveCard
      family="halo"
      halo={{ intensity: "cinematic" }}
      loading
      title="Choose"
      description="Item"
      onClick={click}
    />,
  );
  await user.keyboard("{Enter} ");
  expect(click).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("button")).toHaveAttribute(
    "data-halo-disabled",
    "true",
  );
});
it("treats Halo presets as proposals independently of the original family's approval", () => {
  for (const entry of categories.find((c) => c.id === "surfaces")!.entries)
    for (const intensity of ["soft", "spatial", "cinematic"]) {
      const v = entry.variants.find((v) => v.id === `halo-${intensity}`)!;
      expect(v).toMatchObject({
        design: "draft",
        production: false,
        props: { family: "halo", halo: { intensity } },
      });
    }
});
it("uses CSS writes without React commits and releases observers/listeners on unmount", () => {
  const callbacks: FrameRequestCallback[] = [];
  const raf = vi
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((cb) => {
      callbacks.push(cb);
      return callbacks.length;
    });
  const cancel = vi
    .spyOn(window, "cancelAnimationFrame")
    .mockImplementation(() => {});
  const original = window.matchMedia;
  window.matchMedia = vi
    .fn()
    .mockImplementation((q: string) => ({
      matches: q.includes("pointer: fine"),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  const commit = vi.fn();
  const { unmount } = render(
    <Profiler id="halo" onRender={commit}>
      <Card family="halo" halo={{ intensity: "cinematic" }} title="Card">
        Text
      </Card>
    </Profiler>,
  );
  const el = screen.getByRole("article");
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 300,
    bottom: 200,
    width: 300,
    height: 200,
    toJSON() {},
  });
  const before = commit.mock.calls.length;
  act(() => {
    el.dispatchEvent(
      new MouseEvent("pointermove", {
        clientX: 250,
        clientY: 40,
        bubbles: true,
      }),
    );
    callbacks.shift()?.(16);
  });
  expect(el.style.getPropertyValue("--halo-ry")).not.toBe("0.000deg");
  expect(commit).toHaveBeenCalledTimes(before);
  unmount();
  expect(cancel).toHaveBeenCalled();
  expect(el.dataset.haloRunning).toBe("false");
  window.matchMedia = original;
  raf.mockRestore();
  cancel.mockRestore();
});
it("does not schedule pointer animation when every effect is disabled", () => {
  const raf = vi.spyOn(window, "requestAnimationFrame");
  const original = window.matchMedia;
  window.matchMedia = vi
    .fn()
    .mockImplementation((q: string) => ({
      matches: q.includes("pointer: fine"),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  const { unmount } = render(
    <Card
      family="halo"
      halo={{
        effects: {
          spotlight: false,
          edge: false,
          tilt: false,
          parallax: false,
          ambient: false,
          sheen: false,
          lift: false,
        },
      }}
      title="Still"
    >
      Text
    </Card>,
  );
  const el = screen.getByRole("article");
  const before = raf.mock.calls.length;
  act(() =>
    el.dispatchEvent(
      new MouseEvent("pointermove", {
        clientX: 100,
        clientY: 50,
        bubbles: true,
      }),
    ),
  );
  expect(raf).toHaveBeenCalledTimes(before);
  expect(el.dataset.haloMotion).toBe("static");
  unmount();
  window.matchMedia = original;
  raf.mockRestore();
});
