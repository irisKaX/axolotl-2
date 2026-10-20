import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1366, height: 1000 }, reducedMotion: "reduce" });
const out = process.env.LIBRARY_EVIDENCE || "docs/ds-library/evidence";
await mkdir(out, { recursive: true });
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", e => errors.push(e.message));
try {
  await page.goto(`${process.env.LIBRARY_URL}?catalog=library&section=layout#design-system`);
  await page.getByRole("button", { name: "Upravit Dashboard", exact: true }).click();
  const add = async () => {
    await page.getByRole("button", { name: "Přidat widget", exact: true }).first().click();
    await page.getByRole("button", { name: "Obecný widget M · doporučená", exact: true }).click();
  };
  await add();
  await add();
  const first = page.locator('[data-layout-item="generic-3"]');
  const second = page.locator('[data-layout-item="generic-4"]');
  const board = page.locator(".dls-board");
  const handle = first.getByRole("button", { name: "Změnit rozměry Obecný widget" });
  const minHeight = () => first.evaluate(el => el.style.getPropertyValue("--dls-height"));
  const drag = async (dx, dy) => {
    await handle.scrollIntoViewIfNeeded();
    const r = await handle.boundingBox();
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await page.mouse.down();
    await page.mouse.move(r.x + r.width / 2 + dx, r.y + r.height / 2 + dy, { steps: 12 });
    await page.mouse.up();
  };
  const initialHeight = await minHeight();
  const a = await first.boundingBox(), b = await board.boundingBox();
  await drag(b.width - a.width, 0);
  expect(Math.abs((await first.boundingBox()).width - b.width)).toBeLessThan(2);
  expect(await minHeight()).toBe(initialHeight);
  await handle.focus();
  await page.keyboard.press("ArrowDown");
  expect(parseFloat(await minHeight())).toBe(parseFloat(initialHeight) + 20);
  expect(Math.abs((await first.boundingBox()).width - b.width)).toBeLessThan(2);
  await handle.press("ArrowLeft");
  const twoColumns = await first.boundingBox();
  expect(twoColumns.width).toBeLessThan(b.width - 100);
  const next = await second.boundingBox();
  expect(Math.abs(next.y - twoColumns.y)).toBeLessThan(2);
  expect(next.x).toBeGreaterThanOrEqual(twoColumns.x + twoColumns.width);
  const heightBeforeDrag = parseFloat(await minHeight());
  await drag(0, 60);
  expect(parseFloat(await minHeight())).toBe(heightBeforeDrag + 60);
  expect(Math.abs((await first.boundingBox()).width - twoColumns.width)).toBeLessThan(2);
  await first.getByRole("combobox", { name: "Šířka Obecný widget" }).click();
  await page.getByRole("option", { name: "Celá šířka", exact: true }).click();
  for (const composition of ["Vyvážený střed", "Pracovní patra"]) {
    await page.getByRole("radio", { name: composition, exact: true }).check();
    expect(Math.abs((await first.boundingBox()).width - b.width)).toBeLessThan(2);
    await expect(page.locator(".dls-office")).toBeVisible();
  }
  for (const width of [1024, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const card = await first.boundingBox(), area = await board.boundingBox(), other = await second.boundingBox();
    expect(Math.abs(card.width - area.width)).toBeLessThan(2);
    expect(other.y).toBeGreaterThanOrEqual(card.y + card.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
  console.log("PASS resize: new widgets, pointer width/height independently, full width, keyboard/select, gap filling, both compositions, 1024/390 responsive");
} catch (error) {
  await page.screenshot({ path: `${out}/resize-failure.png`, fullPage: true });
  throw error;
} finally {
  await browser.close();
}
