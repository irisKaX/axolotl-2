import { describe, it, expect, vi } from "vitest";
import { createPageStore, normalizeUrl } from "./browser-bridge";
const tabs = [
  { id: 1, title: "A", url: "https://example.cz/a" },
  { id: 2, title: "B", url: "https://example.cz/b" },
];
function connection() {
  const sent = vi.spyOn(window, "postMessage").mockImplementation(() => {});
  const store = createPageStore();
  const stop = store.start();
  const reply = (
    data: Record<string, unknown> = {},
    origin = location.origin,
  ) => {
    const request = sent.mock.calls.at(-1)![0];
    window.dispatchEvent(
      new MessageEvent("message", {
        origin,
        source: window,
        data: {
          source: "axolotl-extension",
          type: "AXOLOTL_TABS",
          requestId: request.requestId,
          ok: true,
          tabs,
          activeId: 2,
          ...data,
        },
      }),
    );
  };
  return { store, stop, reply };
}
describe("selected URL and extension bridge", () => {
  it("normalizes web URLs and rejects script URLs or whitespace", () => {
    expect(normalizeUrl("example.cz/test")).toBe("https://example.cz/test");
    expect(normalizeUrl("localhost:8000")).toBe("https://localhost:8000/");
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow();
    expect(() => normalizeUrl("some text")).toThrow();
  });
  it("retains a manual URL when the extension is absent and on reload", () => {
    vi.useFakeTimers();
    const { store, stop } = connection();
    store.commitManual("example.cz/work");
    vi.advanceTimersByTime(1900);
    expect(store.getSnapshot().context).toEqual({
      url: "https://example.cz/work",
      tabId: null,
      source: "manual",
    });
    expect(store.getSnapshot().connection.status).toBe("disconnected");
    stop();
    expect(createPageStore().getSnapshot().context.url).toBe(
      "https://example.cz/work",
    );
  });
  it("pins a selected tab then falls back to auto when that tab closes", () => {
    const { store, stop, reply } = connection();
    reply();
    expect(store.getSnapshot().context.tabId).toBe(2);
    store.selectTab(1);
    store.refresh();
    reply({ activeId: 2 });
    expect(store.getSnapshot().context.tabId).toBe(1);
    store.refresh();
    reply({ tabs: [tabs[1]], activeId: 2 });
    expect(store.getSnapshot().context).toEqual({
      url: "https://example.cz/b",
      tabId: 2,
      source: "auto",
    });
    stop();
  });
  it("ignores foreign/stale messages and filters malformed tab payloads", () => {
    const { store, stop, reply } = connection();
    reply({}, "https://other.test");
    reply({ requestId: "old" });
    expect(store.getSnapshot().connection.status).toBe("checking");
    reply({
      tabs: [
        tabs[0],
        { id: 9, title: "Bad", url: "javascript:alert(1)" },
        null,
        { id: "x", url: "https://example.cz/", title: "Bad" },
      ],
    });
    expect(store.getSnapshot().tabs).toEqual([tabs[0]]);
    stop();
  });
  it("clears an automatic selection after disconnect, keeps stopped stores idle", () => {
    vi.useFakeTimers();
    const { store, stop, reply } = connection();
    reply();
    store.refresh();
    vi.advanceTimersByTime(1900);
    expect(store.getSnapshot().context.url).toBe("");
    expect(store.getSnapshot().connection.status).toBe("disconnected");
    stop();
    const state = store.getSnapshot();
    vi.advanceTimersByTime(10000);
    expect(store.getSnapshot()).toBe(state);
  });
});
