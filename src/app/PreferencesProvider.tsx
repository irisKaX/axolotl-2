import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createPreferencesStore,
  type Preferences,
  type PreferencesStore,
} from "../lib/preferences";
export function applyPreferences(value: Preferences) {
  const root = document.documentElement;
  root.dataset.theme = value.resolvedTheme;
  root.dataset.motion = value.reducedMotion ? "reduced" : "full";
  root.dataset.textSize = value.textSize;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      "content",
      value.resolvedTheme === "dark" ? "#050505" : "#FAFAFA",
    );
}
const Context = createContext<PreferencesStore | null>(null);
export function PreferencesProvider({
  children,
  store,
  scoped = false,
}: {
  children: ReactNode;
  store?: PreferencesStore;
  /** Catalog instances share components without changing page-wide preferences. */
  scoped?: boolean;
}) {
  const [value] = useState(() => store ?? createPreferencesStore());
  const snapshot = useSyncExternalStore(value.subscribe, value.getSnapshot);
  useLayoutEffect(() => value.start(), [value]);
  useLayoutEffect(() => {
    if (scoped) return;
    applyPreferences(snapshot);
    window.axolotlPreferences = {
      get: value.getSnapshot,
      set: (key, item) => value.set(key, item).accepted,
    };
    document.dispatchEvent(
      new CustomEvent("axolotl:preferences-change", { detail: snapshot }),
    );
  }, [snapshot, value, scoped]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePreferences() {
  const store = useContext(Context);
  if (!store) throw new Error("PreferencesProvider is required.");
  return {
    ...useSyncExternalStore(store.subscribe, store.getSnapshot),
    setPreference: store.set,
  };
}
