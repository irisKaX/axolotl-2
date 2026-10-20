import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { checkLayout } from "./check-layout.mjs";
const base = process.env.LIBRARY_URL,
  out = process.env.LIBRARY_EVIDENCE || "docs/ds-library/evidence";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE || undefined,
  args: ["--no-sandbox"],
});
const desktop = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    locale: "cs-CZ",
  }),
  touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    locale: "cs-CZ",
  });
const page = await desktop.newPage(),
  mobile = await touch.newPage(),
  errors = [];
for (const p of [page, mobile]) {
  p.setDefaultTimeout(15000);
  p.on("pageerror", (e) => errors.push(e.message));
}
try {
  await checkLayout(page, mobile, base, out);
  if (errors.length) throw Error(errors.join("\n"));
} catch (error) {
  await page.screenshot({
    path: `${out}/layout-failure-desktop.png`,
    fullPage: true,
  });
  await mobile.screenshot({
    path: `${out}/layout-failure-mobile.png`,
    fullPage: true,
  });
  throw error;
} finally {
  await browser.close();
}
