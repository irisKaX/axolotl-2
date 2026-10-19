import { createContext, useContext, useState, type ReactNode } from "react";
import "./library.css";
const Context = createContext<{
  theme: "dark" | "light";
  reducedMotion: boolean;
  portal: HTMLElement | null;
}>({ theme: "dark", reducedMotion: false, portal: null });
/** Supply an explicit environment across portals; independent of application/tool providers. */
export function DesignSystemProvider({
  children,
  theme = "dark",
  reducedMotion = false,
}: {
  children: ReactNode;
  theme?: "dark" | "light";
  reducedMotion?: boolean;
}) {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  return (
    <Context.Provider value={{ theme, reducedMotion, portal }}>
      <div
        className="axo-ds-scope"
        data-theme={theme}
        data-motion={reducedMotion ? "reduced" : "full"}
      >
        {children}
        <div ref={setPortal} data-ds-portal-host />
      </div>
    </Context.Provider>
  );
}
export const useDesignSystem = () => useContext(Context);
