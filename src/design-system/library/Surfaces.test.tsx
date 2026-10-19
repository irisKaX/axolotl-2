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
import { surfaceFamilies } from "./surfaceFamilies";

it("retains default materials and only applies a family when requested", () => {
  const { rerender } = render(<Card title="Report">Content</Card>);
  expect(screen.getByRole("article", { name: "Report" })).not.toHaveAttribute(
    "data-surface-family",
  );
  rerender(
    <Card family="halo" title="Report">
      Content
    </Card>,
  );
  expect(screen.getByRole("article", { name: "Report" })).toHaveAttribute(
    "data-surface-family",
    "halo",
  );
});
it("supports keyboard activation and blocks loading without dropping focus", async () => {
  const click = vi.fn();
  const user = userEvent.setup();
  const { rerender } = render(
    <InteractiveCard
      family="halo"
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
        family="studio"
        title="Tool"
        description="Description"
        action={<button onClick={click}>Open</button>}
      />
      <WidgetCard
        family="obsidian"
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
  const { rerender } = render(<StateCard family="halo" state="empty" />);
  expect(screen.getByText("Zatím bez widgetů")).toBeVisible();
  rerender(<StateCard family="halo" state="loading" />);
  expect(screen.getByRole("status")).toHaveTextContent("Načítám");
  rerender(<StateCard family="halo" state="error" />);
  expect(screen.getByRole("alert")).toHaveTextContent("Obsah není dostupný");
  rerender(<StateCard family="halo" state="warning" />);
  expect(screen.getByRole("status")).toHaveTextContent("neuložené");
  rerender(<StateCard family="halo" state="success" />);
  expect(screen.getByRole("status")).toHaveTextContent("připravené");
});
it("registers all three families for all six real exports as proposals without production use", () => {
  const entries = categories.find((c) => c.id === "surfaces")!.entries;
  expect(entries).toHaveLength(6);
  for (const entry of entries)
    for (const family of surfaceFamilies) {
      const v = entry.variants.find((v) => v.id === family.id)!;
      expect(v.props.family).toBe(family.id);
      expect(v.design).toBe("draft");
      expect(v.production).toBe(false);
    }
});
