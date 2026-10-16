import { expect, test, type Page } from "@playwright/test";

test.use({ reducedMotion: "no-preference" });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("axolotl-2-theme", "dark");
    localStorage.setItem("axolotl-2-motion", "system");
    localStorage.setItem("axolotl-2-cursor-effects", "false");
  });
});

async function expectNoOverflow(page: Page, vertical = false) {
  const size = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    viewportWidth: innerWidth,
    viewportHeight: innerHeight,
  }));
  expect(size.width).toBeLessThanOrEqual(size.viewportWidth);
  if (vertical) expect(size.height).toBeLessThanOrEqual(size.viewportHeight);
}

async function actors(page: Page) {
  return page.locator("[data-office-actor]").evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        id: element.getAttribute("data-office-actor"),
        activity: element.getAttribute("data-activity"),
        x: rect.x,
        y: rect.y,
      };
    }),
  );
}

test("loads the office only on the dashboard and releases it on route changes", async ({ page }) => {
  const officeChunks: string[] = [];
  page.on("request", (request) => {
    if (/\/LivingOffice-[^/]+\.js(?:\?|$)/.test(request.url())) officeChunks.push(request.url());
  });
  await page.goto("#kontrola/metadata");
  await expect(page.getByRole("main", { name: "Metadata" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Axolotlí office" })).toHaveCount(0);
  expect(officeChunks).toHaveLength(0);

  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  const office = page.getByRole("region", { name: "Axolotlí office" });
  await expect(office).toBeVisible();
  await expect(office).toHaveAttribute("data-ready", "true");
  await expect(office.locator("[data-office-actor]")).toHaveCount(4);
  expect(officeChunks).toHaveLength(1);
  await expectNoOverflow(page, true);

  await page.getByRole("button", { name: "Kontrola", exact: true }).click();
  await page.getByRole("link", { name: "Metadata", exact: true }).click();
  await expect(office).toHaveCount(0);
  await expect(page.locator("#axolotl-office-slot")).toHaveCount(0);
});

test("changes lighting without resetting a walk and pauses the scene", async ({ page }, info) => {
  await page.clock.install({ time: new Date("2026-10-16T12:00:00Z") });
  await page.goto("#dashboard");
  const office = page.locator(".living-office");
  await expect(office).toHaveAttribute("data-ready", "true");
  // Let React's lazy boundary and local artwork settle before freezing timers.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  await expect(office).toHaveAttribute("data-theme", "dark");
  await expect(office).toHaveAttribute("data-running", "true");
  await expect(page.locator("[data-office-actor]")).toHaveCount(4);
  const slotBefore = await page.locator("#axolotl-office-slot").boundingBox();

  // Advance active time through actual clock ticks rather than changing product state.
  await page.clock.runFor(16_500);
  const walker = page.locator('[data-office-actor][data-activity="walk"]');
  await expect(walker).toHaveCount(1);
  const walkingId = await walker.getAttribute("data-office-actor");
  const start = await walker.boundingBox();
  await page.clock.runFor(500);
  const moved = await walker.boundingBox();
  expect(Math.hypot(moved!.x - start!.x, moved!.y - start!.y)).toBeGreaterThan(1);

  await page.getByRole("checkbox", { name: "Tmavý režim" }).click();
  await expect(office).toHaveAttribute("data-theme", "light");
  await expect(walker).toHaveAttribute("data-office-actor", walkingId!);
  expect(await page.locator("#axolotl-office-slot").boundingBox()).toEqual(slotBefore);
  await page.screenshot({ path: info.outputPath("office-light.png") });

  await page.getByRole("button", { name: "Pozastavit office", exact: true }).click();
  await expect(office).toHaveAttribute("data-running", "false");
  const paused = await actors(page);
  await page.clock.runFor(4_000);
  expect(await actors(page)).toEqual(paused);
  await page.getByRole("button", { name: "Pustit office", exact: true }).click();
  await expect(office).toHaveAttribute("data-running", "true");
  await page.clock.resume();
  await expect.poll(() => actors(page)).not.toEqual(paused);
  await page.getByRole("checkbox", { name: "Tmavý režim" }).click();
  await expect(office).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: info.outputPath("office-dark.png") });
  await expectNoOverflow(page, true);
});

test("respects reduced motion on first load and after a preference change", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install({ time: new Date("2026-10-16T12:00:00Z") });
  await page.goto("#dashboard");
  const office = page.locator(".living-office");
  await expect(office).toHaveAttribute("data-ready", "true");
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  await expect(office).toHaveAttribute("data-running", "false");
  const resting = await actors(page);
  expect(resting).toHaveLength(4);
  expect(resting.every(({ activity }) => activity === "work" || activity === "laptop")).toBe(true);
  await page.clock.runFor(20_000);
  expect(await actors(page)).toEqual(resting);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(office).toHaveAttribute("data-running", "true");
  await page.clock.runFor(100);
  await page.clock.runFor(16_500);
  await expect(page.locator('[data-office-actor][data-activity="walk"]')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(office).toHaveAttribute("data-running", "false");
  await expect(page.locator('[data-office-actor][data-activity="walk"]')).toHaveCount(0);
  const settled = await actors(page);
  await page.clock.runFor(4_000);
  expect(await actors(page)).toEqual(settled);
});

test("keeps the panorama and pause control usable on a narrow large-text viewport", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("axolotl-2-text-size", "large"));
  await page.goto("#dashboard");
  const office = page.getByRole("region", { name: "Axolotlí office" });
  await expect(office).toBeVisible();
  await expect(office).toHaveAttribute("data-ready", "true");
  const pause = page.getByRole("button", { name: "Pozastavit office", exact: true });
  await expect(pause).toBeInViewport();
  await pause.click();
  await expect(page.getByRole("button", { name: "Pustit office", exact: true })).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: info.outputPath("office-mobile.png") });
});
