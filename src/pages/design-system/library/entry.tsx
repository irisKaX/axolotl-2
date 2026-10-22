import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PreferencesProvider, applyPreferences } from "../../../app/PreferencesProvider";
import { createPreferencesStore } from "../../../lib/preferences";
import Library from "./Library";
import { LibraryTheme } from "../../../design-system/theme/LibraryTheme";
import "../../../styles/app.css";

// The existing Library has its own build entry; production App and routes are untouched.
const preferences = createPreferencesStore({ storagePrefix: "axolotl-library-v1-1" });
applyPreferences(preferences.getSnapshot());
const url = new URL(location.href);
if (["legacy", "headers"].includes(url.searchParams.get("catalog") || "")) {
  url.searchParams.set("catalog", "library");
  url.searchParams.set("section", "dashboard");
}
if (url.searchParams.get("section") === "layout") url.searchParams.set("section", "dashboard");
url.hash = "design-system";
history.replaceState(null, "", url);
createRoot(document.getElementById("axolotl-root")!).render(
  <StrictMode><PreferencesProvider store={preferences}>
    <LibraryTheme><a className="axolotl-skip-link" href="#library-main">Přejít na katalog</a>
    <main id="library-main"><Library /></main></LibraryTheme>
  </PreferencesProvider></StrictMode>,
);
