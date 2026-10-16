import { expect, test, type Page } from "@playwright/test";

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("desktop categories, active tool, keyboard focus and both themes", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("#dashboard");
  const nav = page.getByRole("navigation", { name: "Hlavní navigace" });
  await expect(nav.getByRole("button", { name: "Můj workspace" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toHaveAttribute("aria-current", "page");
  await noOverflow(page);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  const left = await nav.boundingBox();
  const right = await page.locator("header .axolotl-header-control-row").boundingBox();
  const url = await page.locator("header .axolotl-url-bar").boundingBox();
  const bar = await page.locator("header .axolotl-header-bar").boundingBox();
  expect(bar!.height).toBeLessThanOrEqual(72);
  expect(left!.x + left!.width).toBeLessThan(url!.x);
  expect(url!.x + url!.width).toBeLessThan(right!.x);
  expect(Math.abs(left!.y + left!.height / 2 - right!.y - right!.height / 2)).toBeLessThan(2);
  expect(Math.abs(url!.y + url!.height / 2 - right!.y - right!.height / 2)).toBeLessThan(2);
  expect(left!.x + left!.width).toBeLessThan(right!.x);
  const media = nav.getByRole("button", { name: "Média", exact: true });
  await media.hover();
  await expect(media).toHaveAttribute("aria-expanded", "true");
  await nav.getByRole("link", { name: "QR", exact: true }).hover();
  await expect(page).toHaveURL(/#dashboard$/);
  await page.screenshot({ path: info.outputPath("pill-nav-dark.png") });
  await nav.getByRole("link", { name: "QR", exact: true }).click();
  await expect(page.getByRole("heading", { name: "QR generátor", exact: true })).toBeVisible();
  await expect(media).toHaveAttribute("aria-current", "true");
  await expect(media).toHaveAttribute("aria-expanded", "false");
  const control = nav.getByRole("button", { name: "Kontrola", exact: true });
  await control.focus();
  await page.keyboard.press("ArrowDown");
  await expect(nav.getByRole("link", { name: "Metadata", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(control).toBeFocused();
  await page.getByTitle("Přepnout na světlý režim", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Tmavý režim" })).not.toBeChecked();
  await nav.getByRole("link", { name: "Dashboard", exact: true }).click();
  await nav.getByRole("button", { name: "Můj workspace" }).hover();
  await expect(nav.getByRole("link", { name: "Poznámky" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({ path: info.outputPath("pill-nav-light.png") });
  expect(errors).toEqual([]);
});

test("mobile menu keeps categories open until a tool is selected", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("#dashboard");
  const nav = page.getByRole("navigation", { name: "Hlavní navigace" });
  await nav.getByRole("button", { name: "Otevřít navigaci" }).click();
  await nav.getByRole("button", { name: "Média", exact: true }).click();
  await expect(nav.getByRole("link", { name: "QR", exact: true })).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("pill-nav-mobile.png") });
  await nav.getByRole("link", { name: "QR", exact: true }).click();
  await expect(nav.getByRole("button", { name: "Otevřít navigaci" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("heading", { name: "QR generátor", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 768 });
  await nav.getByRole("button", { name: "Otevřít navigaci" }).click();
  await expect(nav.getByRole("button", { name: "Média", exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Média", exact: true })).toHaveAttribute("aria-current", "true");
  await noOverflow(page);
  expect(errors).toEqual([]);
});
