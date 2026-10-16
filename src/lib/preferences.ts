export type Theme = "dark" | "light" | "system";
export interface Preferences {
  theme: Theme;
  motion: "system" | "full" | "reduced";
  textSize: "standard" | "large";
  cursor: boolean;
  resolvedTheme: "dark" | "light";
  reducedMotion: boolean;
}
const defaultKeys = {
  theme: "axolotl-2-theme",
  motion: "axolotl-2-motion",
  textSize: "axolotl-2-text-size",
  cursor: "axolotl-2-cursor-effects",
} as const;
type Key = keyof typeof defaultKeys;
const valid = (key: string, value: unknown): key is Key =>
  key === "theme"
    ? ["dark", "light", "system"].includes(String(value))
    : key === "motion"
      ? ["system", "full", "reduced"].includes(String(value))
      : key === "textSize"
        ? ["standard", "large"].includes(String(value))
        : key === "cursor" && typeof value === "boolean";
export function createPreferencesStore(options: {
  storagePrefix?: string;
  initialTheme?: "dark" | "light";
} = {}) {
  const keys: Record<Key, string> = options.storagePrefix
    ? Object.fromEntries(Object.keys(defaultKeys).map(key => [key, `${options.storagePrefix}-${key}`])) as Record<Key, string>
    : defaultKeys;
  const dark = matchMedia("(prefers-color-scheme: dark)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const listeners = new Set<() => void>();
  let state: Preferences;
  const resolve = (
    value: Omit<Preferences, "resolvedTheme" | "reducedMotion">,
  ): Preferences => ({
    ...value,
    resolvedTheme:
      value.theme === "system"
        ? dark.matches
          ? "dark"
          : "light"
        : value.theme,
    reducedMotion:
      value.motion === "reduced" ||
      (value.motion === "system" && reduced.matches),
  });
  function read() {
    const values = {
      theme: options.initialTheme ?? "dark",
      motion: "system",
      textSize: "standard",
      cursor: !reduced.matches,
    } as Preferences;
    for (const key of Object.keys(keys) as Key[]) {
      try {
        const raw = localStorage.getItem(keys[key]);
        const value =
          key === "cursor"
            ? raw === "true"
              ? true
              : raw === "false"
                ? false
                : null
            : raw;
        if (valid(key, value)) Object.assign(values, { [key]: value });
      } catch {
        /* Preferences work for this session if storage is unavailable. */
      }
    }
    return resolve(values);
  }
  state = read();
  function publish(next: Preferences) {
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    state = Object.freeze(next);
    listeners.forEach((listener) => listener());
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(key: string, value: unknown) {
      if (!valid(key, value)) return { accepted: false, saved: false };
      let saved = true;
      try {
        localStorage.setItem(keys[key], String(value));
      } catch {
        saved = false;
      }
      publish(resolve({ ...state, [key]: value }));
      return { accepted: true, saved };
    },
    start() {
      const media = () => publish(resolve(state));
      const storage = (event: StorageEvent) => {
        if (event.storageArea && event.storageArea !== localStorage) return;
        if (
          event.key === null ||
          Object.values(keys).includes(event.key as (typeof keys)[Key])
        )
          publish(read());
      };
      dark.addEventListener("change", media);
      reduced.addEventListener("change", media);
      window.addEventListener("storage", storage);
      return () => {
        dark.removeEventListener("change", media);
        reduced.removeEventListener("change", media);
        window.removeEventListener("storage", storage);
      };
    },
  };
}
export type PreferencesStore = ReturnType<typeof createPreferencesStore>;
