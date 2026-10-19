import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
export async function checkSurfaces(page, mobile, base, out) {
  const route = `${base}?catalog=library&section=surfaces#design-system`;
  const choose = async (p, label, value) => {
    await p.getByRole("combobox", { name: label, exact: true }).click();
    await p.getByRole("option", { name: value, exact: true }).click();
  };
  await page.goto(route);
  const studio = page.getByRole("region", {
    name: "Halo Soft v kontextu",
    exact: true,
  });
  for (const theme of ["dark", "light"]) {
    if ((await page.locator("html").getAttribute("data-theme")) !== theme)
      await page
        .getByRole("button", {
          name:
            theme === "dark"
              ? "Tmavý náhled knihovny"
              : "Světlý náhled knihovny",
          exact: true,
        })
        .click();
    await expect(
      studio
        .locator(".ds-surface-specimens")
        .locator(".ds-card,.ds-interactive-card,.ax-panel"),
    ).toHaveCount(6);
    await expect(page.locator("[data-halo],[data-surface-family]")).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("combobox", { name: "Intenzita Halo" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("switch", { name: "Porovnat tři rodiny" }),
    ).toHaveCount(0);
    for (const state of ["empty", "loading", "error", "warning", "success"]) {
      await choose(page, "Stav ukázkových karet", state);
      const result = await new AxeBuilder({ page })
        .include(".ds-surface-examples")
        .analyze();
      expect(
        result.violations,
        JSON.stringify(
          result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.failureSummary),
          })),
        ),
      ).toEqual([]);
    }
    await page.screenshot({
      path: `${out}/unified-${theme}-surfaces.png`,
      fullPage: true,
    });
    const card = studio.locator(".ds-interactive-card");
    await card.hover();
    expect(await card.evaluate((el) => getComputedStyle(el).transform)).toBe(
      "none",
    );
    const neutral = await card.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(neutral).not.toBe("rgb(124, 58, 237)");
    await card.focus();
    await page.keyboard.press("Space");
    await expect(card).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() => card.evaluate((el) => getComputedStyle(el).borderColor))
      .toBe("rgb(124, 58, 237)");
    await page.keyboard.press("Space");
    await studio
      .getByRole("switch", { name: "Načítání akcí", exact: true })
      .check();
    await card.click({ force: true });
    await expect(card).toHaveAttribute("aria-pressed", "false");
    await expect(card).toHaveAttribute("aria-busy", "true");
    await studio
      .getByRole("switch", { name: "Načítání akcí", exact: true })
      .uncheck();
    await studio
      .getByRole("switch", { name: "Neaktivní akce", exact: true })
      .check();
    await expect(card).toBeDisabled();
    await studio
      .getByRole("switch", { name: "Neaktivní akce", exact: true })
      .uncheck();
    await studio
      .getByRole("button", { name: "Vyzkoušet kontrolu", exact: true })
      .click();
    await expect(studio).toContainText("Titulek i popis jsou vyplněné");
    await studio
      .getByRole("button", { name: "Zavřít výsledek", exact: true })
      .click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await card.hover();
    expect(
      await card.evaluate((el) => getComputedStyle(el).transitionDuration),
    ).toBe("0s");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  await studio
    .getByRole("button", { name: "Obnovit přehled", exact: true })
    .click();
  await expect(studio).toContainText("Obnoveno 1×");
  await studio
    .getByRole("button", { name: "Uložit poznámku", exact: true })
    .click();
  await expect(
    studio.getByRole("button", { name: "Poznámka uložena", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const savedButton = studio.getByRole("button", {
    name: "Poznámka uložena",
    exact: true,
  });
  await savedButton.hover();
  await expect
    .poll(() =>
      savedButton.evaluate((el) => getComputedStyle(el).backgroundColor),
    )
    .toBe("rgb(124, 58, 237)");
  for (const width of [390, 320]) {
    await mobile.setViewportSize({ width, height: 844 });
    await mobile.goto(route);
    const card = mobile.locator(".ds-surface-examples .ds-interactive-card");
    await card.tap();
    await expect(card).toHaveAttribute("aria-pressed", "true");
    await card.tap();
    await expect(card).toHaveAttribute("aria-pressed", "false");
    expect(
      await mobile.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await mobile.screenshot({
      path: `${out}/unified-mobile-surfaces-${width}.png`,
      fullPage: true,
    });
  }
  await mobile
    .locator(".ds-surface-examples")
    .evaluate((el) => (el.style.fontSize = "200%"));
  expect(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto(`${base}?catalog=library#design-system`);
  const overview = page.getByRole("region", {
    name: "Vizuální přehled Design Systemu",
  });
  await expect(overview.locator("[data-system-theme]")).toHaveCount(2);
  const a = await new AxeBuilder({ page })
    .include(".ds-system-overview")
    .analyze();
  expect(
    a.violations,
    JSON.stringify(
      a.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.failureSummary),
      })),
    ),
  ).toEqual([]);
  for (const theme of ["dark", "light"]) {
    const column = overview.locator(`[data-system-theme=${theme}]`);
    await expect(column.locator(":scope > section")).toHaveCount(7);
    await column
      .getByRole("button", { name: "Otevřít dialog", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAttribute("data-theme", theme);
    await expect(dialog).toHaveAttribute("data-design", "unified");
    await page.keyboard.press("Escape");
    await expect(
      column.getByRole("button", { name: "Otevřít dialog", exact: true }),
    ).toBeFocused();
  }
  // Element screenshots can include fixed app chrome mid-image when taller than
  // the viewport. Hide only the shell/cursor for this component comparison capture.
  const comparisonStyle =
    '[aria-label="Ovládání Axolotlu"], .axolotl-cursor-layer, .axolotl-skip-link { visibility: hidden !important; }';
  await page.evaluate(() => document.activeElement?.blur());
  await overview.screenshot({
    path: `${out}/unified-system-dark-light.png`,
    style: comparisonStyle,
  });
  await mobile.goto(`${base}?catalog=library#design-system`);
  expect(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await mobile
    .getByRole("region", { name: "Vizuální přehled Design Systemu" })
    .screenshot({
      path: `${out}/unified-system-mobile.png`,
      style: comparisonStyle,
    });
  await page.goBack();
  await expect(studio).toBeVisible();
  await page.reload();
  await expect(studio).toBeVisible();
  console.log(
    "PASS Unified surfaces: one Halo Soft material, six real exports, semantic states, keyboard/actions, disabled/loading, dark/light axe, reduced motion, mobile, history and seven-category dual-theme overview with portals",
  );
}
