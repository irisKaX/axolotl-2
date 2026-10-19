import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const baseline =
  process.env.REFERENCE_URL ||
  "http://127.0.0.1:4205/axolotl-preview/ds-library-v1-1/";
const target = process.env.COMPARE_URL;
const out = process.env.LIBRARY_EVIDENCE || "docs/ds-library/evidence";
await mkdir(out, { recursive: true });
const b = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE || undefined,
  args: ["--no-sandbox"],
});
const results = [];
async function capture(base, theme, kind) {
  const context = await b.newContext({
    viewport: { width: 1366, height: 768 },
    reducedMotion: "reduce",
  });
  const p = await context.newPage();
  p.setDefaultTimeout(15000);
  try {
    await p.goto(`${base}?catalog=library&section=navigation#design-system`);
    await p.locator(".ds-catalog-playground").waitFor();
    if ((await p.locator("html").getAttribute("data-theme")) !== theme)
      await p
        .getByRole("button", {
          name:
            theme === "dark"
              ? "Tmavý náhled knihovny"
              : "Světlý náhled knihovny",
          exact: true,
        })
        .click();
    await p.getByRole("combobox", { name: "Komponenta", exact: true }).click();
    await p.getByRole("option", { name: kind, exact: true }).click();
    await p.evaluate(() => document.fonts.ready);
    const stage = p.locator(".ds-catalog-playground");
    const selector = {
      Tabs: "[role=tab]",
      "Segmented Control": ".ds-segmented label",
      Disclosure: ".ds-disclosure summary",
      Pagination: ".ds-pagination > span > button",
    }[kind];
    const item = stage.locator(selector).last();
    const states = {};
    for (const state of ["default", "hover", "focus"]) {
      await p.mouse.move(0, 0);
      if (state === "hover") await item.hover();
      if (state === "focus") {
        (await item.locator("input").count())
          ? await item.locator("input").focus()
          : await item.focus();
      }
      states[state] = await stage.evaluate((el) =>
        [
          el,
          ...el.querySelectorAll(
            "button,input,summary,[role=tab],.ds-segmented span",
          ),
        ].map((n) => {
          const s = getComputedStyle(n),
            r = n.getBoundingClientRect();
          return {
            tag: n.tagName,
            text: n.textContent,
            width: r.width,
            height: r.height,
            background: s.background,
            color: s.color,
            border: s.border,
            radius: s.borderRadius,
            font: s.font,
            shadow: s.boxShadow,
            outline: s.outline,
            opacity: s.opacity,
          };
        }),
      );
    }
    await p.mouse.move(0, 0);
    await item.evaluate((el) => el.blur());
    await p.locator("h1").focus();
    const png = await stage.screenshot({
      path: `${out}/navigation-${theme}-${kind.replaceAll(" ", "-")}-${base === baseline ? "reference" : "current"}.png`,
      animations: "disabled",
    });
    return { states, png };
  } finally {
    await context.close();
  }
}
try {
  for (const theme of ["dark", "light"])
    for (const kind of [
      "Tabs",
      "Segmented Control",
      "Disclosure",
      "Pagination",
    ]) {
      const ref = await capture(baseline, theme, kind);
      if (target) {
        const next = await capture(target, theme, kind);
        expect(next.states, `${theme}/${kind} computed states`).toEqual(
          ref.states,
        );
        expect(next.png.equals(ref.png), `${theme}/${kind} screenshot`).toBe(
          true,
        );
      }
      results.push({ theme, kind, states: ref.states, compared: !!target });
      console.log(
        "PASS Navigation reference",
        theme,
        kind,
        target ? "identical" : "captured",
      );
    }
} finally {
  await writeFile(
    `${out}/navigation-reference.json`,
    JSON.stringify(results, null, 2),
  );
  await b.close();
}
