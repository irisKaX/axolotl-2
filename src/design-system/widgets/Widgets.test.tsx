import {
  act,
  fireEvent,
  render,
  screen,
  renderHook,
} from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { DesignSystemProvider } from "../library";
import { FindPhraseWidget, MiniQrWidget } from "./Widgets";
import { useFindPhraseDemo, useMiniQr } from "./state";
import * as qrExport from "../../tools/legacy/tools/qr-generator/export.js";
import * as downloads from "../../tools/legacy/shared/download-file.js";
function Search({
  scenario = "success",
}: {
  scenario?: "success" | "limited" | "error";
}) {
  const demo = useFindPhraseDemo(scenario);
  return (
    <DesignSystemProvider appearance="unified">
      <FindPhraseWidget
        {...demo}
        detailAction={<button>Otevřít v nástroji</button>}
      />
    </DesignSystemProvider>
  );
}
function Qr() {
  return <MiniQrWidget {...useMiniQr()} />;
}
it("rejects empty search and focuses its only input", () => {
  render(<Search />);
  fireEvent.click(screen.getByRole("button", { name: "Hledat" }));
  expect(screen.getByLabelText("Hledaná fráze")).toHaveFocus();
  expect(screen.getByText("Zadejte jednu frázi.")).toBeVisible();
});
it.each(["success", "limited", "error"] as const)(
  "runs only a local %s demo through starting and scanning",
  (scenario) => {
    vi.useFakeTimers();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const view = render(<Search scenario={scenario} />);
    fireEvent.change(screen.getByLabelText("Hledaná fráze"), {
      target: { value: "výhodné volání" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Hledat" }));
    expect(screen.getByText("Demo: hledání spuštěno")).toBeVisible();
    expect(screen.getByRole("button", { name: "Hledat" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText("Demo: probíhá skenování")).toBeVisible();
    act(() => vi.advanceTimersByTime(1100));
    expect(
      screen.getByText(
        scenario === "success"
          ? "Demo: dokončeno"
          : scenario === "limited"
            ? "Demo: dokončeno s omezením"
            : "Demo: hledání se nezdařilo",
      ),
    ).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  },
);
it("validates an empty asset and treats a filename with spaces as one query", () => {
  const v = render(<Search />);
  fireEvent.click(screen.getByRole("radio", { name: "Asset" }));
  fireEvent.click(screen.getByRole("button", { name: "Hledat" }));
  expect(screen.getByText("Zadejte jeden asset.")).toBeVisible();
  fireEvent.change(screen.getByLabelText("ID nebo název assetu"), {
    target: { value: "hero banner.png" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Hledat" }));
  expect(screen.getByText("Demo: hledání spuštěno")).toBeVisible();
  v.unmount();
});
it("cancels its local timers on unmount", () => {
  vi.useFakeTimers();
  const { result, unmount } = renderHook(() => useFindPhraseDemo());
  act(() => result.current.onValueChange("hero-2026"));
  act(() => {
    result.current.onSearch();
  });
  expect(vi.getTimerCount()).toBe(2);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("rejects unsafe QR schemes and returns focus to the URL field", async () => {
  render(<Qr />);
  fireEvent.change(screen.getByLabelText("URL pro QR"), {
    target: { value: "javascript:alert(1)" },
  });
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Vytvořit QR" })),
  );
  expect(screen.getByLabelText("URL pro QR")).toHaveFocus();
  expect(screen.getByLabelText("URL pro QR")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(screen.getByLabelText("URL pro QR")).toHaveAccessibleDescription(
    /platný webový odkaz/,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("platný webový odkaz");
  expect(
    screen.queryByRole("button", { name: "Stáhnout PNG" }),
  ).not.toBeInTheDocument();
});
it("ignores a generated result after the input has changed", async () => {
  const { result } = renderHook(() => useMiniQr());
  act(() => result.current.onValueChange("www.o2.cz"));
  await act(async () => {
    const generation = result.current.onGenerate();
    result.current.onValueChange("https://example.test/new");
    await generation;
  });
  expect(result.current.value).toBe("https://example.test/new");
  expect(result.current.state).toEqual({ phase: "idle" });
});
it("uses only the web download adapter, handles export errors and permits retry", async () => {
  const download = vi
    .spyOn(downloads, "saveDownload")
    .mockResolvedValue({ state: "started" });
  const exportQr = vi
    .spyOn(qrExport, "exportQrOutput")
    .mockRejectedValueOnce(new Error("PNG nelze vytvořit."))
    .mockImplementationOnce(async (_qr, _format, options) => {
      await options!.download!(new Blob(["png"]), "qr-code.png", {});
    });
  const { result } = renderHook(() => useMiniQr());
  act(() => result.current.onValueChange("www.o2.cz"));
  await act(async () => {
    await result.current.onGenerate();
  });
  await act(async () => {
    await result.current.onDownload();
  });
  expect(result.current.state).toMatchObject({
    phase: "error",
    message: "PNG nelze vytvořit.",
  });
  expect(result.current.state.qr).toBeDefined();
  await act(async () => {
    await result.current.onDownload();
  });
  expect(result.current.state).toMatchObject({
    phase: "success",
    message: "PNG předáno prohlížeči ke stažení.",
  });
  expect(exportQr).toHaveBeenCalledTimes(2);
  expect(download).toHaveBeenCalledWith(
    expect.any(Blob),
    "qr-code.png",
    expect.objectContaining({ downloads: null }),
  );
});
it("blocks duplicate downloads and aborts pending export when the URL changes", async () => {
  let finish!: () => void;
  let signal!: AbortSignal;
  const exportQr = vi
    .spyOn(qrExport, "exportQrOutput")
    .mockImplementation((_qr, _format, options) => {
      signal = (options as { signal: AbortSignal }).signal;
      return new Promise<void>((resolve) => {
        finish = resolve;
      });
    });
  const { result } = renderHook(() => useMiniQr());
  act(() => result.current.onValueChange("www.o2.cz"));
  await act(async () => {
    await result.current.onGenerate();
  });
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.onDownload();
  });
  await act(async () => {
    await result.current.onDownload();
  });
  expect(exportQr).toHaveBeenCalledTimes(1);
  act(() => result.current.onValueChange("https://example.test/new"));
  expect(signal.aborted).toBe(true);
  await act(async () => {
    finish();
    await pending;
  });
  expect(result.current.state).toEqual({ phase: "idle" });
});
it("creates a real fixed black/white QR and invalidates it when the URL changes", async () => {
  const { result } = renderHook(() => useMiniQr());
  act(() => result.current.onValueChange("www.o2.cz"));
  await act(async () => {
    await result.current.onGenerate();
  });
  expect(result.current.state.phase).toBe("success");
  expect(result.current.state.qr).toMatchObject({
    text: "https://www.o2.cz/",
    size: 512,
    color: "#000000",
    background: { type: "solid", color: "#ffffff" },
  });
  act(() => result.current.onValueChange("https://example.test/changed"));
  expect(result.current.state.phase).toBe("idle");
  expect(result.current.state.qr).toBeUndefined();
});
