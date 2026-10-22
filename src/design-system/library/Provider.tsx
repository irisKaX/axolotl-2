import { createContext, useContext, useState, type CSSProperties, type ReactNode } from "react";
import { paletteVariables } from "../tokens/paints";
import "./library.css";
import "./unified.css";
const Context = createContext<{
  theme: "dark" | "light";
  reducedMotion: boolean;
  portal: HTMLElement | null;
  appearance: "original" | "unified";
}>({
  theme: "dark",
  reducedMotion: false,
  portal: null,
  appearance: "original",
});
/** Supply an explicit environment across portals; independent of application/tool providers. */
export function DesignSystemProvider({
  children,
  theme = "dark",
  reducedMotion = false,
  appearance,
}: {
  children: ReactNode;
  theme?: "dark" | "light";
  reducedMotion?: boolean;
  appearance?: "original" | "unified";
}) {
  const inherited = useContext(Context);
  const visual = appearance ?? inherited.appearance;
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  return (
    <Context.Provider
      value={{ theme, reducedMotion, portal, appearance: visual }}
    >
      <div
        className="axo-ds-scope"
        style={paletteVariables as CSSProperties}
        data-theme={theme}
        data-design={visual}
        data-motion={reducedMotion ? "reduced" : "full"}
      >
        {children}
        <div ref={setPortal} data-ds-portal-host />
      </div>
    </Context.Provider>
  );
}
export const useDesignSystem = () => useContext(Context);
