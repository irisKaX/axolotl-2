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
        away: element.getAttribute("data-away"),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    }),
  );
}

async function positions(page: Page) {
  return (await actors(page)).map(({ activity: _activity, ...position }) => position);
}

async function workerParts(page: Page) {
  return page.locator("[data-office-actor]").evaluateAll((elements) =>
    elements.map((element) => {
      const measure = (part: Element) => {
        const rect = part.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, transform: getComputedStyle(part).transform };
      };
      return {
        id: element.getAttribute("data-office-actor"),
        body: measure(element.querySelector("[data-office-body]")!),
        hands: [...element.querySelectorAll("[data-office-hand]")].map(measure),
      };
    }),
  );
}

async function readyWithFrozenClock(page: Page) {
  await page.clock.install({ time: new Date("2026-10-16T12:00:00Z") });
  await page.goto("#dashboard");
  const office = page.locator(".living-office");
  await expect(office).toHaveAttribute("data-ready", "true");
  // React's lazy boundary and artwork must settle before freezing the clock.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  return office;
}

test("loads office artwork only on the dashboard, never requests walking sprites and releases the scene on navigation", async ({ page }) => {
  const officeChunks: string[] = [];
  const artwork: string[] = [];
  page.on("request", (request) => {
    if (/\/LivingOffice-[^/]+\.js(?:\?|$)/.test(request.url())) officeChunks.push(request.url());
    if (/\/office-[^/]+\.webp(?:\?|$)/.test(request.url())) artwork.push(request.url());
  });
  await page.goto("#kontrola/metadata");
  await expect(page.getByRole("main", { name: "Metadata" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Axolotlí office" })).toHaveCount(0);
  expect(officeChunks).toHaveLength(0);
  expect(artwork).toHaveLength(0);

  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  const office = page.getByRole("region", { name: "Axolotlí office" });
  await expect(office).toBeVisible();
  await expect(office).toHaveAttribute("data-ready", "true");
  await expect(office.locator("[data-office-actor]")).toHaveCount(4);
  expect(officeChunks).toHaveLength(1);
  expect(artwork.length).toBeGreaterThan(0);
  expect(artwork.some(url => /office-walk/.test(url))).toBe(false);
  await expectNoOverflow(page, true);

  await page.getByRole("button", { name: "Kontrola", exact: true }).click();
  await page.getByRole("link", { name: "Metadata", exact: true }).click();
  await expect(office).toHaveCount(0);
  await expect(page.locator("#axolotl-office-slot")).toHaveCount(0);
});

test("changes lighting during a sip without moving workers and pauses their small actions", async ({ page }, info) => {
  const office = await readyWithFrozenClock(page);
  await expect(office).toHaveAttribute("data-theme", "dark");
  await expect(office).toHaveAttribute("data-running", "true");
  const initialPositions = await positions(page);
  const slotBefore = await page.locator("#axolotl-office-slot").boundingBox();

  await page.clock.runFor(7_000);
  const front = page.locator('[data-office-actor="front"]');
  await expect(front).toHaveAttribute("data-activity", "sip");
  expect(await positions(page)).toEqual(initialPositions);
  await page.getByRole("checkbox", { name: "Tmavý režim" }).click();
  await expect(office).toHaveAttribute("data-theme", "light");
  await expect(front).toHaveAttribute("data-activity", "sip");
  expect(await positions(page)).toEqual(initialPositions);
  expect(await page.locator("#axolotl-office-slot").boundingBox()).toEqual(slotBefore);
  await page.screenshot({ path: info.outputPath("office-light.png") });

  await page.getByRole("button", { name: "Pozastavit office", exact: true }).click();
  await expect(office).toHaveAttribute("data-running", "false");
  const paused = await actors(page);
  const pausedParts = await workerParts(page);
  await page.clock.runFor(4_000);
  expect(await actors(page)).toEqual(paused);
  expect(await workerParts(page)).toEqual(pausedParts);
  await page.getByRole("button", { name: "Pustit office", exact: true }).click();
  await expect(office).toHaveAttribute("data-running", "true");
  await page.clock.runFor(6_000);
  await expect(front).toHaveAttribute("data-activity", "work");
  expect(await positions(page)).toEqual(initialPositions);
  await page.getByRole("checkbox", { name: "Tmavý režim" }).click();
  await expect(office).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: info.outputPath("office-dark.png") });
  await expectNoOverflow(page, true);
});

test("animates keyboard hands, including the beanbag worker, while all bodies stay fixed", async ({ page }) => {
  await readyWithFrozenClock(page);
  await expect(page.locator("[data-office-body]")).toHaveCount(4);
  const initial = await workerParts(page);
  const samples = [initial];
  for (let sample = 0; sample < 6; sample++) {
    await page.clock.runFor(260);
    samples.push(await workerParts(page));
  }
  for (const worker of initial) {
    expect(worker.hands.length, `${worker.id} needs working hands`).toBeGreaterThan(0);
    const states = samples.map(sample => sample.find(value => value.id === worker.id)!);
    expect(states.every(state => JSON.stringify(state.body) === JSON.stringify(worker.body)), `${worker.id} body must not bob`).toBe(true);
    expect(new Set(states.map(state => JSON.stringify(state.hands))).size, `${worker.id} hands should type`).toBeGreaterThan(1);
    for (const state of states) {
      state.hands.forEach((hand, index) => {
        const original = worker.hands[index];
        expect(Math.hypot(hand.x - original.x, hand.y - original.y), `${worker.id} keyboard movement should be small`).toBeLessThan(5);
      });
    }
  }
});

test("keeps every worker seated while coffee and phone activities advance", async ({ page }) => {
  await readyWithFrozenClock(page);
  const initialPositions = await positions(page);
  expect(initialPositions).toHaveLength(4);
  expect(initialPositions.every(worker => worker.away === "false")).toBe(true);
  const seen = new Set<string | null>();
  for (let sample = 0; sample < 15; sample++) {
    await page.clock.runFor(2_000);
    const current = await actors(page);
    current.forEach(worker => seen.add(worker.activity));
    expect(await positions(page)).toEqual(initialPositions);
    expect(current.every(worker => ["work", "laptop", "sip", "phone"].includes(worker.activity!))).toBe(true);
  }
  expect(seen.has("sip")).toBe(true);
  expect(seen.has("phone")).toBe(true);
});

test("respects reduced motion on first load and after a preference change", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const office = await readyWithFrozenClock(page);
  await expect(office).toHaveAttribute("data-running", "false");
  const resting = await actors(page);
  const restingParts = await workerParts(page);
  expect(resting).toHaveLength(4);
  expect(resting.every(({ activity }) => activity === "work" || activity === "laptop")).toBe(true);
  await page.clock.runFor(20_000);
  expect(await actors(page)).toEqual(resting);
  expect(await workerParts(page)).toEqual(restingParts);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(office).toHaveAttribute("data-running", "true");
  await page.clock.runFor(7_000);
  await expect(page.locator('[data-office-actor="front"]')).toHaveAttribute("data-activity", "sip");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(office).toHaveAttribute("data-running", "false");
  await expect(page.locator('[data-activity="sip"], [data-activity="phone"]')).toHaveCount(0);
  const settled = await actors(page);
  const settledParts = await workerParts(page);
  await page.clock.runFor(4_000);
  expect(await actors(page)).toEqual(settled);
  expect(await workerParts(page)).toEqual(settledParts);
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
