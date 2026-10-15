import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30_000,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173/axolotl-2/",
    viewport: { width: 1366, height: 768 },
    locale: "cs-CZ",
    timezoneId: "Europe/Prague",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE || undefined,
    },
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/axolotl-2/",
    reuseExistingServer: !process.env.CI,
  },
});
