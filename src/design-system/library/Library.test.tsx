import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "../Button";
import {
  DesignSystemProvider,
  Field,
  Input,
  Checkbox,
  Tabs,
  ConfirmationDialog,
  Progress,
} from "./index";

describe("Library V1 contracts", () => {
  it("reuses production Field to associate label, hint and invalid error", () => {
    const { rerender } = render(
      <Field label="E-mail" hint="Nápověda">
        <Input />
      </Field>,
    );
    expect(
      screen.getByRole("textbox", { name: "E-mail" }),
    ).toHaveAccessibleDescription("Nápověda");
    rerender(
      <Field label="E-mail" error="Neplatný e-mail">
        <Input />
      </Field>,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Neplatný e-mail",
    );
  });
  it("retains the real production checkbox indeterminate and disabled semantics", async () => {
    const change = vi.fn();
    const { rerender } = render(
      <Checkbox
        label="Vybrat"
        checked="indeterminate"
        onCheckedChange={change}
      />,
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
    await userEvent.setup().click(screen.getByRole("checkbox"));
    expect(change).toHaveBeenCalledWith(true);
    rerender(
      <Checkbox
        label="Vybrat"
        checked={false}
        onCheckedChange={change}
        disabled
      />,
    );
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
  it("moves Tabs focus and selection while skipping disabled items", async () => {
    function Demo() {
      const [value, set] = useState("one");
      return (
        <Tabs
          label="Výběr"
          value={value}
          onValueChange={set}
          items={[
            { value: "one", label: "První", content: "Obsah 1" },
            {
              value: "two",
              label: "Druhá",
              disabled: true,
              content: "Obsah 2",
            },
            { value: "three", label: "Třetí", content: "Obsah 3" },
          ]}
        />
      );
    }
    render(<Demo />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Třetí" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Třetí" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Obsah 3");
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "První" })).toHaveFocus();
  });
  it("confirmation focuses Cancel, awaits real work, and returns focus to its trigger", async () => {
    let done!: () => void;
    const confirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          done = resolve;
        }),
    );
    const user = userEvent.setup();
    render(
      <DesignSystemProvider>
        <ConfirmationDialog
          title="Odstranit?"
          description="Ukázka"
          trigger={<Button>Otevřít</Button>}
          confirmLabel="Odstranit"
          onConfirm={confirm}
        />
      </DesignSystemProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Otevřít" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Zrušit" })).toHaveFocus(),
    );
    await user.click(screen.getByRole("button", { name: "Odstranit" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Odstranit" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    done();
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Otevřít" })).toHaveFocus(),
    );
  });
  it("progress reports a bounded native value and a truly indeterminate state", () => {
    const { rerender } = render(<Progress label="Zpracování" value={120} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "100");
    rerender(<Progress label="Zpracování" />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("value");
  });
});
