import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPageStore, type PageStore } from "../lib/browser-bridge";
const Context = createContext<PageStore | null>(null);
export function PageContextProvider({
  children,
  store,
}: {
  children: ReactNode;
  store?: PageStore;
}) {
  const [value] = useState(() => store ?? createPageStore());
  const snapshot = useSyncExternalStore(value.subscribe, value.getSnapshot);
  useEffect(() => value.start(), [value]);
  useEffect(() => {
    window.axolotlPageContext = Object.freeze({ ...snapshot.context });
    document.dispatchEvent(
      new CustomEvent("axolotl:url-change", { detail: snapshot.context }),
    );
  }, [snapshot.context]);
  useEffect(() => {
    window.axolotlBrowserConnection = Object.freeze({ ...snapshot.connection });
    document.dispatchEvent(
      new CustomEvent("axolotl:browser-connection-change", {
        detail: snapshot.connection,
      }),
    );
  }, [snapshot.connection]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePageContext() {
  const store = useContext(Context);
  if (!store) throw new Error("PageContextProvider is required.");
  return { ...useSyncExternalStore(store.subscribe, store.getSnapshot), store };
}
