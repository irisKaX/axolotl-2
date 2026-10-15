import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import {
  PreferencesProvider,
  applyPreferences,
} from "./app/PreferencesProvider";
import { PageContextProvider } from "./app/PageContextProvider";
import { createPreferencesStore } from "./lib/preferences";
import "./styles/app.css";
const preferences = createPreferencesStore();
applyPreferences(preferences.getSnapshot());
createRoot(document.getElementById("axolotl-root")!).render(
  <StrictMode>
    <PreferencesProvider store={preferences}>
      <PageContextProvider>
        <App />
      </PageContextProvider>
    </PreferencesProvider>
  </StrictMode>,
);
