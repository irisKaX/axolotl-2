import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import {
  Card,
  InteractiveCard,
  StateCard,
  ToolCard,
  WidgetCard,
} from "./Surfaces";
import { categories } from "../../pages/design-system/library/registry";

it("retains default material and density API without experiment configuration", () => {
  const { rerender } = render(<Card title="Report">Content</Card>);
  expect(screen.getByRole("article")).toHaveAttribute("data-material", "flat");
  rerender(
    <Card title="Report" material="raised" density="compact">
      Content
    </Card>,
  );
  expect(screen.getByRole("article")).toHaveAttribute(
    "data-material",
    "raised",
  );
  expect(screen.getByRole("article")).toHaveAttribute(
    "data-density",
    "compact",
  );
});
it("supports keyboard activation and blocks loading without dropping focus", async () => {
  const click = vi.fn();
  const user = userEvent.setup();
  const { rerender } = render(
    <InteractiveCard title="Choose" description="Item" onClick={click} />,
  );
  await user.tab();
  await user.keyboard("{Enter} ");
  expect(click).toHaveBeenCalledTimes(2);
  rerender(
    <InteractiveCard
      title="Choose"
      description="Item"
      loading
      onClick={click}
    />,
  );
  expect(screen.getByRole("button")).toHaveFocus();
  await user.keyboard("{Enter} ");
  await user.click(screen.getByRole("button"));
  expect(click).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  rerender(
    <InteractiveCard
      title="Choose"
      description="Item"
      disabled
      onClick={click}
    />,
  );
  expect(screen.getByRole("button")).toBeDisabled();
});
it("keeps action slots independent of container semantics", async () => {
  const click = vi.fn();
  const user = userEvent.setup();
  render(
    <>
      <ToolCard
        title="Tool"
        description="Description"
        action={<button onClick={click}>Open</button>}
      />
      <WidgetCard
        title="Widget"
        actions={<button onClick={click}>Refresh</button>}
      >
        Content
      </WidgetCard>
    </>,
  );
  expect(screen.getAllByRole("article")).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: "Open" }));
  await user.click(screen.getByRole("button", { name: "Refresh" }));
  expect(click).toHaveBeenCalledTimes(2);
});
it("provides empty, busy, error, warning and success content", () => {
  const { rerender } = render(<StateCard state="empty" />);
  expect(screen.getByText("Zatím bez widgetů")).toBeVisible();
  rerender(<StateCard state="loading" />);
  expect(screen.getByRole("status")).toHaveTextContent("Načítám");
  rerender(<StateCard state="error" />);
  expect(screen.getByRole("alert")).toHaveTextContent("Obsah není dostupný");
  rerender(<StateCard state="warning" />);
  expect(screen.getByRole("status")).toHaveTextContent("neuložené");
  rerender(<StateCard state="success" />);
  expect(screen.getByRole("status")).toHaveTextContent("připravené");
});
it("registers Theme Card elevations, no historical family controls", () => {
  const entries = categories.find((c) => c.id === "surfaces")!.entries;
  expect(entries).toHaveLength(6);
  for (const entry of entries) {
    expect(entry.properties).not.toHaveProperty("family");
    expect(entry.properties).not.toHaveProperty("halo");
    for (const v of entry.variants) {
      expect(v.label).toContain("Theme Card");
      expect(v.production).toBe(false);
      expect(v.design).toBe("draft");
    }
  }
});
