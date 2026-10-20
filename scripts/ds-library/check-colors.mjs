import { expect } from "@playwright/test";
import {
  paints,
  copyValue,
} from "../../src/pages/design-system/library/colors/paints.ts";
import AxeBuilder from "@axe-core/playwright";

export async function checkColors(page, mobile, base, out) {
  const route = `${base}?catalog=library&section=colors#design-system`;
  await page.goto(`${base}?catalog=library&section=buttons#design-system`);
  const originalButton = page.locator("#button-playground.axo-ds-button");
  await expect(originalButton).toBeVisible();
  const originalStyle = await originalButton.evaluate((el) => ({
    background: getComputedStyle(el).background,
    color: getComputedStyle(el).color,
    radius: getComputedStyle(el).borderRadius,
  }));
  await page.goto(route);
  await expect(
    page.getByRole("heading", { name: "Colors & Gradients", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".ds-color-sample[data-kind=solid]")).toHaveCount(
    paints.filter((p) => p.kind === "solid").length,
  );
  await expect(
    page.locator(".ds-color-sample[data-kind=gradient]"),
  ).toHaveCount(paints.filter((p) => p.kind === "gradient").length);
  const before = await page.evaluate(() => ({
    html: document.documentElement.dataset.theme,
    storage: { ...localStorage },
  }));
  const toggle = page.getByRole("button", { name: /náhled knihovny/ });
  for (const theme of ["dark", "light"]) {
    if (
      (await page.locator(".ds-colors").getAttribute("data-preview-theme")) !==
      theme
    )
      await toggle.click();
    await expect(page.locator(".ds-colors")).toHaveAttribute(
      "data-preview-theme",
      theme,
    );
    expect(
      await page.evaluate(() => ({
        html: document.documentElement.dataset.theme,
        storage: { ...localStorage },
      })),
    ).toEqual(before);
    const axe = await new AxeBuilder({ page }).include(".ds-catalog").analyze();
    expect(
      axe.violations,
      JSON.stringify(
        axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ),
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${out}/colors-${theme}-desktop.png`,
      fullPage: true,
    });
  }
  // Genuine Clipboard API writes/reads on the isolated preview origin.
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(base).origin,
  });
  await page
    .getByRole("button", { name: "Vyzkoušet Purple", exact: true })
    .focus();
  await page.keyboard.press("Tab");
  await expect(
    page.locator('[data-paint-id="purple"] .ds-color-copy'),
  ).toBeFocused();
  const samples = page.locator(".ds-color-sample");
  for (let i = 0; i < (await samples.count()); i++) {
    const sample = samples.nth(i),
      button = sample.getByRole("button", { name: /Kopírovat/ });
    const id = await sample.getAttribute("data-paint-id");
    const exact = copyValue(paints.find((p) => p.id === id));
    await expect(button.locator("code")).toHaveText(exact);
    await button.focus();
    await page.keyboard.press(i % 2 ? "Space" : "Enter");
    await expect(sample.getByRole("status")).toHaveText("Zkopírováno");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      exact,
    );
    expect(
      await button.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe("none");
  }
  await samples.first().locator("code").click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "#AC32E4",
  );
  await page
    .getByRole("button", { name: "Vyzkoušet Electric Violet", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Live Playground", exact: true }),
  ).toBeFocused();
  await expect(page.locator(".ds-color-live")).toHaveAttribute(
    "data-selected-paint",
    "electric-violet",
  );
  await expect(page.locator(".ds-color-live")).toHaveAttribute(
    "data-text-backing",
    "true",
  );
  await page
    .getByRole("button", { name: "Vyzkoušet akci", exact: true })
    .click();
  await expect(page.locator(".ds-color-live output")).toHaveText(
    "Provedené akce: 1",
  );
  await page
    .getByRole("combobox", { name: "Barva nebo gradient", exact: true })
    .click();
  await page.getByRole("option", { name: "Black", exact: true }).click();
  await expect(page.locator(".ds-painted-text")).toBeVisible(); // local light mode
  await toggle.click();
  await expect(page.locator(".ds-painted-text")).toHaveCount(0); // Black on dark is withheld
  await expect(page.locator(".ds-color-live output")).toHaveText(
    "Provedené akce: 1",
  );
  expect(
    await page.evaluate(() => ({
      html: document.documentElement.dataset.theme,
      storage: { ...localStorage },
    })),
  ).toEqual(before);
  await page
    .getByRole("combobox", { name: "Barva nebo gradient", exact: true })
    .click();
  await page.getByRole("option", { name: "White", exact: true }).click();
  await expect(page.locator(".ds-painted-text")).toBeVisible();
  const originalViewport = page.viewportSize();
  await page.setViewportSize({ width: originalViewport.width, height: 1200 });
  await page
    .locator(".ds-color-live")
    .evaluate((el) =>
      window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 150),
    );
  await page
    .locator(".ds-color-live")
    .screenshot({ path: `${out}/colors-playground.png` });
  await page.setViewportSize(originalViewport);
  // Test-mode toggle preserves selected paint, local theme, and demo actions.
  await page
    .getByRole("switch", { name: "Zobrazit testovací komponenty" })
    .check();
  await expect(page.locator(".ds-color-live")).toHaveAttribute(
    "data-selected-paint",
    "white",
  );
  await expect(page.locator(".ds-colors")).toHaveAttribute(
    "data-preview-theme",
    "dark",
  );
  await page
    .getByRole("switch", { name: "Zobrazit testovací komponenty" })
    .uncheck();
  await page
    .getByRole("navigation", { name: "Kategorie knihovny" })
    .getByRole("link", { name: "← Přehled", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Otevřít Colors & Gradients →", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Colors & Gradients", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.locator(".ds-catalog-category")).toHaveCount(8);
  await page.goForward();
  await expect(page.locator(".ds-colors")).toBeVisible();
  await page.reload();
  await expect(page.locator(".ds-colors")).toBeVisible();
  // Failure feedback remains truthful; no success message on rejected writes.
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("Denied")) },
    }),
  );
  const purple = page.locator("[data-paint-id=purple]");
  await purple.getByRole("button", { name: /Kopírovat/ }).click();
  await expect(purple.getByRole("status")).toContainText(
    "Kopírování se nezdařilo",
  );
  await page.goto(`${base}?catalog=library&section=buttons#design-system`); // remove clipboard override
  await expect(originalButton).toBeVisible();
  expect(
    await originalButton.evaluate((el) => ({
      background: getComputedStyle(el).background,
      color: getComputedStyle(el).color,
      radius: getComputedStyle(el).borderRadius,
    })),
  ).toEqual(originalStyle);

  await mobile
    .context()
    .grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(base).origin,
    });
  for (const width of [390, 320]) {
    await mobile.setViewportSize({ width, height: 844 });
    await mobile.goto(route);
    for (const id of ["purple", "ultraviolet"]) {
      await mobile.locator(`[data-paint-id="${id}"] code`).tap();
      expect(await mobile.evaluate(() => navigator.clipboard.readText())).toBe(
        copyValue(paints.find((p) => p.id === id)),
      );
    }
    for (const theme of ["dark", "light"]) {
      if (
        (await mobile
          .locator(".ds-colors")
          .getAttribute("data-preview-theme")) !== theme
      )
        await mobile.getByRole("button", { name: /náhled knihovny/ }).tap();
      expect(
        await mobile.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await mobile
        .getByRole("button", { name: "Vyzkoušet Sunburst", exact: true })
        .tap();
      await expect(mobile.locator(".ds-color-live")).toHaveAttribute(
        "data-selected-paint",
        "sunburst",
      );
      await mobile
        .getByRole("combobox", { name: "Barva nebo gradient", exact: true })
        .tap();
      const box = await mobile.getByRole("listbox").boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      await mobile
        .getByRole("option", { name: "Ultraviolet", exact: true })
        .tap();
      await mobile.evaluate(() => window.scrollTo(0, 0));
      await mobile.screenshot({
        path: `${out}/colors-mobile-${width}-${theme}.png`,
        fullPage: true,
      });
    }
  }
  await mobile.evaluate(() =>
    document.documentElement.style.setProperty("--axolotl-text-scale", "2"),
  );
  expect(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await mobile.evaluate(() =>
    document.documentElement.style.removeProperty("--axolotl-text-scale"),
  );
}
