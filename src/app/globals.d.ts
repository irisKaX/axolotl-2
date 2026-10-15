import type { Preferences } from "../lib/preferences";
import type { PageContext, BrowserConnection } from "../lib/browser-bridge";
declare global {
  interface Window {
    axolotlPreferences: {
      get: () => Preferences;
      set: (key: string, value: unknown) => boolean;
    };
    axolotlPageContext: Readonly<PageContext>;
    axolotlBrowserConnection: Readonly<BrowserConnection>;
  }
}
