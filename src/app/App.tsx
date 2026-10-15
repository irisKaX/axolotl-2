import { useEffect, useState } from "react";
import { Header } from "./Header";
import { CursorEffects } from "./CursorEffects";
import { currentRoute, routeLabels } from "./routes";
import { DesignSystem } from "../pages/DesignSystem";
export function App() {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const update = () => setRoute(currentRoute());
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
      <Header route={route} />
      <main
        className="axolotl-workspace"
        id="axolotl-workspace"
        aria-label={routeLabels[route]}
        tabIndex={-1}
      >
        {route === "design-system" ? (
          <DesignSystem />
        ) : (
          <section
            className="axolotl-view"
            data-axolotl-route={route}
            aria-label={routeLabels[route]}
          >
            {route === "dashboard" && (
              <div
                className="axolotl-office-slot"
                id="axolotl-office-slot"
                data-axolotl-slot="office"
                aria-hidden="true"
              />
            )}
          </section>
        )}
      </main>
      <CursorEffects />
    </>
  );
}
