import { useEffect, useRef, useState } from "react";
import { createQr } from "../../tools/legacy/tools/qr-generator/model.js";
import { exportQrOutput } from "../../tools/legacy/tools/qr-generator/export.js";
import { saveDownload } from "../../tools/legacy/shared/download-file.js";
export type WidgetSize = "medium" | "large";
export type SearchMode = "phrase" | "asset";
export type SearchScenario = "success" | "limited" | "error";
export type SearchState = {
  phase: "idle" | "starting" | "scanning" | SearchScenario;
  inputError?: string;
};
export type QrModel = ReturnType<typeof createQr>;
export type QrState = {
  phase: "idle" | "working" | "success" | "error";
  qr?: QrModel;
  message?: string;
  inputError?: boolean;
};
/** Catalog-only simulation. No URL store, scanner, transport, or shared job. */
export function useFindPhraseDemo(scenario: SearchScenario = "success") {
  const [value, setValue] = useState(""),
    [mode, setMode] = useState<SearchMode>("phrase"),
    [state, setState] = useState<SearchState>({ phase: "idle" });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]),
    running = useRef(false);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    running.current = false;
  };
  useEffect(() => clear, []);
  function reset() {
    clear();
    setState({ phase: "idle" });
  }
  function onValueChange(next: string) {
    reset();
    setValue(next);
  }
  function onModeChange(next: SearchMode) {
    reset();
    setMode(next);
  }
  function onSearch() {
    if (running.current) return true;
    const q = value.trim();
    const inputError = !q
      ? mode === "asset"
        ? "Zadejte jeden asset."
        : "Zadejte jednu frázi."
      : q.length > 240
        ? "Zkraťte zadání na nejvýše 240 znaků."
        : undefined;
    if (inputError) {
      setState({ phase: "idle", inputError });
      return false;
    }
    clear();
    running.current = true;
    setState({ phase: "starting" });
    timers.current = [
      setTimeout(() => setState({ phase: "scanning" }), 500),
      setTimeout(() => {
        running.current = false;
        timers.current = [];
        setState({ phase: scenario });
      }, 1600),
    ];
    return true;
  }
  return { value, mode, state, onValueChange, onModeChange, onSearch, reset };
}
/** Pure local model/export adapter. Explicit web download avoids extension APIs. */
export function useMiniQr() {
  const [value, setValue] = useState(""),
    [state, setState] = useState<QrState>({ phase: "idle" });
  const operation = useRef<AbortController | null>(null),
    revision = useRef(0),
    busy = useRef(false);
  const cancel = () => {
    operation.current?.abort();
    operation.current = null;
    revision.current++;
    busy.current = false;
  };
  useEffect(() => cancel, []);
  function onValueChange(next: string) {
    cancel();
    setValue(next);
    setState({ phase: "idle" });
  }
  function reset() {
    cancel();
    setState({ phase: "idle" });
  }
  async function onGenerate() {
    if (busy.current) return true;
    cancel();
    const current = revision.current;
    busy.current = true;
    setState({ phase: "working" });
    try {
      // No artificial progress or delay: the operation is entirely local.
      const qr = await Promise.resolve().then(() => createQr(value));
      if (current !== revision.current) return false;
      setState({ phase: "success", qr });
      return true;
    } catch (error) {
      if (current === revision.current)
        setState({
          phase: "error",
          inputError: true,
          message:
            error instanceof Error
              ? error.message
              : "QR se nepodařilo vytvořit.",
        });
      return false;
    } finally {
      if (current === revision.current) busy.current = false;
    }
  }
  async function onDownload() {
    if (!state.qr || busy.current) return;
    const qr = state.qr;
    cancel();
    const current = revision.current,
      abort = new AbortController();
    operation.current = abort;
    busy.current = true;
    setState({ phase: "working", qr });
    try {
      const options = {
        signal: abort.signal,
        download: (
          blob: Blob,
          name: string,
          options: { signal?: AbortSignal } = {},
        ) => saveDownload(blob, name, { ...options, downloads: null }),
      };
      await exportQrOutput(qr, "png", options);
      if (current === revision.current)
        setState({
          phase: "success",
          qr,
          message: "PNG předáno prohlížeči ke stažení.",
        });
    } catch (error) {
      if (current === revision.current && !abort.signal.aborted)
        setState({
          phase: "error",
          qr,
          message:
            error instanceof Error
              ? error.message
              : "PNG se nepodařilo připravit.",
        });
    } finally {
      if (current === revision.current) {
        operation.current = null;
        busy.current = false;
      }
    }
  }
  return { value, state, onValueChange, onGenerate, onDownload, reset };
}
