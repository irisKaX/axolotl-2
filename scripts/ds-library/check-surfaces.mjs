import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
export async function checkSurfaces(page, mobile, base, out) {
  const route = `${base}?catalog=library&section=surfaces#design-system`;
  const choose = async (p, label, value) => {
    await p.getByRole("combobox", { name: label, exact: true }).click();
    await p.getByRole("option", { name: value, exact: true }).click();
  };
  await page.goto(route);
  const studio = page.getByRole("region", { name: "Prémiové rodiny povrchů" });
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
    await studio
      .getByRole("switch", { name: "Porovnat tři rodiny", exact: true })
      .check();
    await expect(studio.locator(".ds-surfaces-family")).toHaveCount(3);
    for (const family of ["obsidian", "halo", "studio"])
      await expect(
        studio.locator(`[data-surface-family=${family}]`),
      ).toHaveCount(6);
    for (const state of ["Empty", "Loading", "Error", "Warning", "Success"]) {
      await choose(page, "Stav ukázkových karet", state);
      const axe = await new AxeBuilder({ page })
        .include(".ds-surfaces-studio")
        .analyze();
      expect(
        axe.violations,
        JSON.stringify(
          axe.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
        ),
      ).toEqual([]);
    }
    await choose(page, "Stav ukázkových karet", "Empty");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `${out}/surfaces-${theme}-desktop.png`,
      fullPage: true,
    });
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const family of ["obsidian", "halo", "studio"]) {
    const card = studio.locator(
      `.ds-interactive-card[data-surface-family=${family}]`,
    );
    await card.hover();
    await expect
      .poll(() => card.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe("none");
    const hover = await card.evaluate((el) => getComputedStyle(el).transform);
    await page.mouse.down();
    await expect
      .poll(() => card.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe(hover);
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }
  const item = studio.locator(".ds-interactive-card").first();
  await item.focus();
  await page.keyboard.press("Enter");
  await expect(item).toHaveAttribute("aria-pressed", "true");
  expect(await item.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe(
    "solid",
  );
  await page.keyboard.press("Space");
  await expect(item).toHaveAttribute("aria-pressed", "false");
  await studio
    .getByRole("switch", { name: "Načítání akcí", exact: true })
    .check();
  // Intentionally bypass Playwright actionability to exercise the loading guard.
  await item.click({ force: true });
  await item.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(item).toHaveAttribute("aria-pressed", "false");
  await expect(item).toHaveAttribute("aria-busy", "true");
  await studio
    .getByRole("switch", { name: "Načítání akcí", exact: true })
    .uncheck();
  await studio
    .getByRole("switch", { name: "Neaktivní akce", exact: true })
    .check();
  await expect(item).toBeDisabled();
  await studio
    .getByRole("switch", { name: "Neaktivní akce", exact: true })
    .uncheck();
  await studio
    .getByRole("button", { name: "Otevřít ukázku", exact: true })
    .first()
    .click();
  await expect(studio).toContainText("Ukázkový výsledek");
  await studio
    .getByRole("button", { name: "Obnovit", exact: true })
    .first()
    .click();
  await expect(
    studio.getByText("Obnoveno 1× v ukázce", { exact: true }),
  ).toHaveCount(3);
  await studio
    .getByRole("button", { name: "Uložit poznámku", exact: true })
    .first()
    .click();
  await expect(
    studio.getByRole("button", { name: "Poznámka uložena", exact: true }),
  ).toHaveCount(3);
  await choose(page, "Stav ukázkových karet", "Error");
  await studio
    .getByRole("button", { name: "Vyřešit ukázkový stav", exact: true })
    .first()
    .click();
  await expect(studio).toContainText("Vše je připravené");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await item.hover();
  expect(await item.evaluate((el) => getComputedStyle(el).transform)).toBe(
    "none",
  );
  expect(
    await item.evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  await studio
    .getByRole("switch", { name: "Porovnat tři rodiny", exact: true })
    .uncheck();
  for (const name of ["Obsidian", "Halo", "Studio Outline"]) {
    await choose(page, "Stylová rodina", name);
    await expect(studio.locator(".ds-surfaces-family")).toHaveCount(1);
  }
  for (const width of [390, 320]) {
    await mobile.setViewportSize({ width, height: 844 });
    await mobile.goto(route);
    const m = mobile.locator(".ds-surfaces-studio");
    for (const theme of ["dark", "light"]) {
      if ((await mobile.locator("html").getAttribute("data-theme")) !== theme)
        await mobile
          .getByRole("button", {
            name:
              theme === "dark"
                ? "Tmavý náhled knihovny"
                : "Světlý náhled knihovny",
            exact: true,
          })
          .tap();
      await m
        .getByRole("switch", { name: "Porovnat tři rodiny", exact: true })
        .check();
      expect(
        await mobile.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await m.locator(".ds-interactive-card").first().tap();
      await mobile.evaluate(() => window.scrollTo(0, 0));
      await mobile.screenshot({
        path: `${out}/surfaces-${theme}-mobile-${width}.png`,
        fullPage: true,
      });
    }
  }
  await mobile.evaluate(
    () =>
      (document.querySelector(".ds-surfaces-studio").style.fontSize = "200%"),
  );
  expect(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto(`${base}?catalog=library&section=colors#design-system`);
  await page.goBack();
  await expect(studio).toBeVisible();
  await page.reload();
  await expect(studio).toBeVisible();
  console.log(
    "PASS Surfaces: 3 families × 6 real types; dark/light × 5 content states axe 0; actions, keyboard, loading, disabled, reduced motion, touch 390/320, text 200%, deep link/history",
  );
}
