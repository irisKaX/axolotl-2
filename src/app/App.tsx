import { useEffect, useRef, useState } from "react";
import { AppHeader } from "./header/AppHeader";
import { CursorEffects } from "./CursorEffects";
import { currentRoute, routeLabels } from "./routes";
import { DesignSystem } from "../pages/DesignSystem";
import { ToolWorkspace } from "../tools/ToolWorkspace";
import { toolRoutes } from "../tools/registry";

export function App() {
  const [route, setRoute] = useState(currentRoute);
  const workspace = useRef<HTMLElement>(null);
  const focusWorkspace = () => requestAnimationFrame(() => workspace.current?.focus({ preventScroll: true }));
  useEffect(() => {
    const update = () => { setRoute(currentRoute()); focusWorkspace(); };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    document.title =
      route === "dashboard"
        ? "Axolotl 2.0"
        : `${routeLabels[route]} · Axolotl 2.0`;
  }, [route]);
  return (
    <>
      <a
        href="#axolotl-workspace"
        className="axolotl-skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("axolotl-workspace")?.focus();
        }}
      >
        Přejít na obsah
      </a>
      <AppHeader route={route} onNavigate={focusWorkspace} />
      <main
        ref={workspace}
        className="axolotl-workspace"
        id="axolotl-workspace"
        aria-label={routeLabels[route]}
        tabIndex={-1}
      >
        <ToolWorkspace route={route}/>
        {route === "design-system" ? (
          <DesignSystem />
        ) : !toolRoutes[route] ? (
          <section
            className="axolotl-view"
            data-axolotl-route={route}
            aria-label={routeLabels[route]}
          >
          </section>
        ) : null}
      </main>
      <CursorEffects />
    </>
  );
}
