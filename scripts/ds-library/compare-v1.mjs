import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const root =
  process.env.VISUAL_HOST || "http://127.0.0.1:4201/axolotl-preview/";
const out = process.env.LIBRARY_EVIDENCE || "docs/ds-library/evidence";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE || undefined,
  args: ["--no-sandbox"],
});
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  for (const theme of ["dark", "light"])
    for (const section of [
      "buttons",
      "forms",
      "surfaces",
      "overlays",
      "feedback",
      "navigation",
    ]) {
      const captures = [];
      for (const version of ["ds-library-v1", "ds-library-v1-1"]) {
        await page.goto(
          `${root}${version}/?catalog=library&section=${section}#design-system`,
        );
        const stage = page.locator(
          section === "buttons"
            ? ".axo-button-showcase__playground"
            : ".ds-catalog-playground",
        );
        await expect(stage).toBeVisible();
        if ((await page.locator("html").getAttribute("data-theme")) !== theme)
          await page
            .getByRole("button", {
              name:
                theme === "light"
                  ? "Světlý náhled knihovny"
                  : "Tmavý náhled knihovny",
              exact: true,
            })
            .click();
        await page.evaluate(() => document.fonts.ready);
        // This comparison covers unchanged specimens, not the intentionally
        // added toolbar control (covered by check-toggle screenshots/tests).
        // Remove only that new wrapper to equalize page height/background.
        await page.locator('.ds-catalog-top .ds-switch').evaluateAll((nodes) => {
          for (const node of nodes) node.parentElement.remove();
        });
        const styles = await stage.evaluate((el) =>
          [
            el,
            ...el.querySelectorAll(
              "button,input,textarea,[role=tab],.ds-card,.badge",
            ),
          ].map((node) => {
            const s = getComputedStyle(node),
              r = node.getBoundingClientRect();
            return {
              tag: node.tagName,
              text: node.textContent,
              width: r.width,
              height: r.height,
              background: s.background,
              color: s.color,
              radius: s.borderRadius,
              font: s.font,
              fontFamily: s.fontFamily,
              border: s.border,
              shadow: s.boxShadow,
              outline: s.outline,
            };
          }),
        );
        const png = await stage.screenshot({
          path: `${out}/compare-${theme}-${section}-${version}.png`,
          animations: "disabled",
        });
        captures.push({ styles, png });
      }
      expect(
        captures[1].styles,
        `${theme}/${section} computed styles and geometry`,
      ).toEqual(captures[0].styles);
      const equal = captures[0].png.equals(captures[1].png);
      results.push({
        theme,
        section,
        computedStylesEqual: true,
        pngIdentical: equal,
      });
      console.log(
        "COMPARE",
        theme,
        section,
        "styles equal; PNG identical:",
        equal,
      );
      expect(equal, `${theme}/${section} original playground pixels`).toBe(
        true,
      );
    }
} finally {
  await writeFile(
    `${out}/visual-v1-comparison.json`,
    JSON.stringify(results, null, 2),
  );
  await browser.close();
}
