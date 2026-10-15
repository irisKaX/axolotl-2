import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
export const queries = new Map<string, MediaQueryList>();
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  queries.clear();
  window.location.hash = "#dashboard";
  vi.stubGlobal("matchMedia", (query: string) => {
    if (!queries.has(query)) {
      const target = new EventTarget();
      Object.assign(target, {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
      });
      queries.set(query, target as MediaQueryList);
    }
    return queries.get(query)!;
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
export function system(query: string, value: boolean) {
  const media = matchMedia(query);
  Object.defineProperty(media, "matches", { value, configurable: true });
  media.dispatchEvent(new Event("change"));
}
