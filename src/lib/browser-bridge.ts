export interface BrowserTab {
  id: number;
  title: string;
  url: string;
  documentToken?: string;
}
export interface PageContext {
  url: string;
  tabId: number | null;
  source: "manual" | "auto" | "tab";
}
export interface BrowserConnection {
  status: "checking" | "connected" | "disconnected";
  tabCount: number;
}
export interface PageSnapshot {
  context: PageContext;
  connection: BrowserConnection;
  tabs: BrowserTab[];
}
const storageKey = "axolotl-2-target-url";
export function normalizeUrl(value: string) {
  const text = value.trim();
  if (!text) return "";
  if (/\s/.test(text)) throw new Error("URL obsahuje mezery.");
  const scheme =
    /^[a-z][a-z\d+.-]*:/i.test(text) && !/^[^/:]+:\d+(?:[/?#]|$)/.test(text);
  const url = new URL(scheme ? text : `https://${text}`);
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname)
    throw new Error("Použij webovou URL.");
  return url.href;
}
export function createPageStore() {
  let context: PageContext = { url: "", tabId: null, source: "auto" };
  try {
    const saved = sessionStorage.getItem(storageKey);
    if (saved)
      context = { url: normalizeUrl(saved), tabId: null, source: "manual" };
  } catch {
    /* Optional storage. */
  }
  let state: PageSnapshot = {
    context,
    connection: { status: "checking", tabCount: 0 },
    tabs: [],
  };
  let automaticId: number | null = null;
  let pending: string | null = null;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let active = false;
  const listeners = new Set<() => void>();
  function publish(next: PageSnapshot) {
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    state = Object.freeze(next);
    listeners.forEach((listener) => listener());
  }
  function apply(tabs: BrowserTab[], status: BrowserConnection["status"]) {
    let context = state.context;
    if (context.source !== "manual") {
      const source =
        context.source === "tab" && tabs.some((tab) => tab.id === context.tabId)
          ? "tab"
          : "auto";
      const id = source === "tab" ? context.tabId : automaticId;
      const tab = tabs.find((tab) => tab.id === id);
      context = { source, url: tab?.url ?? "", tabId: tab?.id ?? null };
    }
    publish({
      context,
      tabs,
      connection: {
        status,
        tabCount: status === "connected" ? tabs.length : 0,
      },
    });
  }
  function request(force = false) {
    if (!active || document.hidden) return;
    if (force)
      publish({
        ...state,
        connection: { ...state.connection, status: "checking" },
      });
    if (pending) return;
    pending = crypto.randomUUID();
    window.postMessage(
      { source: "axolotl-page", type: "AXOLOTL_GET_TABS", requestId: pending },
      location.origin,
    );
    timeout = setTimeout(() => {
      pending = null;
      automaticId = null;
      apply([], "disconnected");
    }, 1800);
  }
  function receive(event: MessageEvent) {
    if (event.source !== window || event.origin !== location.origin || !active)
      return;
    const data = event.data;
    if (
      !data ||
      data.source !== "axolotl-extension" ||
      data.type !== "AXOLOTL_TABS" ||
      !pending ||
      data.requestId !== pending
    )
      return;
    clearTimeout(timeout);
    pending = null;
    const connected = data.ok === true && Array.isArray(data.tabs);
    const tabs: BrowserTab[] = connected
      ? data.tabs.filter((tab: unknown): tab is BrowserTab => {
          if (!tab || typeof tab !== "object") return false;
          const value = tab as BrowserTab;
          if (
            !Number.isInteger(value.id) ||
            typeof value.title !== "string" ||
            typeof value.url !== "string"
          )
            return false;
          try {
            return (
              /^https?:\/\//.test(value.url) &&
              normalizeUrl(value.url) === value.url
            );
          } catch {
            return false;
          }
        })
      : [];
    automaticId = tabs.some((tab) => tab.id === data.activeId)
      ? data.activeId
      : (tabs[0]?.id ?? null);
    apply(tabs, connected ? "connected" : "disconnected");
  }
  function clearManual() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* Optional storage. */
    }
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    commitManual(value: string) {
      const url = normalizeUrl(value);
      try {
        if (url) sessionStorage.setItem(storageKey, url);
        else clearManual();
      } catch {
        /* Optional storage. */
      }
      publish({ ...state, context: { url, tabId: null, source: "manual" } });
      return url;
    },
    selectTab(id: number) {
      const tab = state.tabs.find((tab) => tab.id === id);
      if (!tab) return;
      clearManual();
      publish({
        ...state,
        context: { url: tab.url, tabId: id, source: "tab" },
      });
    },
    selectAuto() {
      clearManual();
      const tab = state.tabs.find((tab) => tab.id === automaticId);
      publish({
        ...state,
        context: {
          source: "auto",
          url: tab?.url ?? "",
          tabId: tab?.id ?? null,
        },
      });
    },
    refresh: () => request(true),
    start() {
      active = true;
      const refresh = () => request(true),
        poll = () => request();
      window.addEventListener("message", receive);
      window.addEventListener("focus", poll);
      document.addEventListener("visibilitychange", poll);
      document.addEventListener("axolotl:browser-refresh", refresh);
      request();
      const interval = setInterval(poll, 2500);
      return () => {
        active = false;
        pending = null;
        clearTimeout(timeout);
        clearInterval(interval);
        window.removeEventListener("message", receive);
        window.removeEventListener("focus", poll);
        document.removeEventListener("visibilitychange", poll);
        document.removeEventListener("axolotl:browser-refresh", refresh);
      };
    },
  };
}
export type PageStore = ReturnType<typeof createPageStore>;
