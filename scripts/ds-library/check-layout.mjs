import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
export async function checkLayout(page, mobile, base, out) {
  await mkdir(out, { recursive: true });
  const capture = async (p, options) => {
    const reduced = await p.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    await p.emulateMedia({ reducedMotion: "reduce" });
    await p.mouse.move(0, 0);
    await p.screenshot(options);
    await p.emulateMedia({
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
  };
  const route = `${base}?catalog=library&section=layout#design-system`,
    measurements = [];
  const choose = async (p, label, name) => {
    await p.getByRole("combobox", { name: label, exact: true }).click();
    await p.getByRole("option", { name, exact: true }).click();
  };
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(route);
  const studio = page.locator(".dls"),
    office = studio.locator(".dls-office"),
    search = studio.locator('[data-layout-item="search-1"]'),
    qr = studio.locator('[data-layout-item="qr-2"]');
  await expect(office).toBeVisible();
  const storage = await page.evaluate(() =>
    JSON.stringify({ ...localStorage }),
  );
  const htmlTheme = await page.locator("html").getAttribute("data-theme");
  for (const theme of ["dark", "light"]) {
    if ((await studio.getAttribute("data-theme")) !== theme)
      await page
        .getByRole("button", {
          name:
            theme === "light"
              ? "Světlý náhled knihovny"
              : "Tmavý náhled knihovny",
          exact: true,
        })
        .click();
    for (const [width, height] of [
      [1366, 768],
      [1440, 900],
      [1920, 1080],
    ]) {
      await page.setViewportSize({ width, height });
      for (const [name, id] of [
        ["Vyvážený střed", "centered"],
        ["Pracovní patra", "staggered"],
      ]) {
        await studio.getByRole("radio", { name, exact: true }).check();
        await page.evaluate(() => scrollTo(0, 0));
        const boxes = await Promise.all(
          [
            page.getByRole("banner", { name: "Ovládání Axolotlu" }),
            office,
            search,
            qr,
            studio.getByRole("button", { name: "Notebook", exact: true }),
          ].map((x) => x.boundingBox()),
        );
        await capture(page, {
          path: `${out}/layout-${width}-${theme}-${id}.png`,
        });
        for (const box of boxes) {
          expect(box).not.toBeNull();
          expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.y + box.height).toBeLessThanOrEqual(height);
        }
        const center = boxes[1];
        expect(Math.abs(center.x + center.width / 2 - width / 2)).toBeLessThan(
          2,
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        measurements.push({
          width,
          height,
          theme,
          composition: id,
          header: boxes[0],
          office: boxes[1],
          search: boxes[2],
          qr: boxes[3],
        });
      }
    }
    await page.setViewportSize({ width: 1366, height: 768 });
    const axe = await new AxeBuilder({ page }).include(".ds-catalog").analyze();
    expect(axe.violations, JSON.stringify(axe.violations)).toEqual([]);
  }
  expect(await page.locator("html").getAttribute("data-theme")).toBe(htmlTheme);
  await studio
    .getByRole("radio", { name: "Vyvážený střed", exact: true })
    .check();
  await studio.getByRole("button", { name: "Notebook", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Strukturální placeholder",
  );
  await page.keyboard.press("Escape");
  await expect(
    studio.getByRole("button", { name: "Notebook", exact: true }),
  ).toBeFocused();
  await studio
    .getByRole("switch", { name: "Skutečné UI widgetů", exact: true })
    .check();
  await search.getByLabel("Hledaná fráze", { exact: true }).fill("internet");
  await search.getByLabel("Hledaná fráze", { exact: true }).press("Enter");
  await expect(
    search.getByText("Demo: dokončeno", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await qr.getByLabel("URL pro QR", { exact: true }).fill("https://www.o2.cz/");
  await qr.getByLabel("URL pro QR", { exact: true }).press("Enter");
  await expect(qr.locator("canvas")).toBeVisible();
  await studio
    .getByRole("button", { name: "Upravit Dashboard", exact: true })
    .click();
  await search
    .getByRole("button", { name: "Přesunout Find Phrase", exact: true })
    .focus();
  await page.keyboard.press("ArrowRight");
  await expect(search).toHaveAttribute("data-layout-zone", "right");
  await expect(search.getByLabel("Hledaná fráze", { exact: true })).toHaveValue(
    "internet",
  );
  await studio
    .getByRole("switch", { name: "Skutečné UI widgetů", exact: true })
    .uncheck();
  await studio
    .getByRole("switch", { name: "Skutečné UI widgetů", exact: true })
    .check();
  await expect(search.getByLabel("Hledaná fráze", { exact: true })).toHaveValue(
    "internet",
  );
  await studio
    .getByRole("switch", { name: "Skutečné UI widgetů", exact: true })
    .uncheck();
  await choose(page, "Umístění Find Phrase", "Levá zóna");
  // Real pointer gesture into an explicit target, including Escape cancellation.
  const handle = search.getByRole("button", {
    name: "Přesunout Find Phrase",
    exact: true,
  });
  await handle.scrollIntoViewIfNeeded();
  let a = await handle.boundingBox(),
    b = await studio
      .locator('.dls-drop-tray [data-layout-zone="bottom"]')
      .boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(search).toHaveAttribute("data-layout-zone", "left");
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(search).toHaveAttribute("data-layout-zone", "bottom");
  await choose(page, "Umístění Find Phrase", "Levá zóna");
  const resize = search.getByRole("button", {
    name: "Změnit rozměry Find Phrase",
    exact: true,
  });
  await resize.scrollIntoViewIfNeeded();
  a = await resize.boundingBox();
  const prior = await search.locator(":scope > .ds-card").boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 80, a.y + a.height / 2 - 60, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(search).toHaveAttribute("data-size", "large");
  const resized = await search.locator(":scope > .ds-card").boundingBox();
  expect(resized.width).toBeGreaterThan(prior.width);
  expect(resized.height).toBeLessThan(prior.height);
  const minBefore = await search
    .locator(":scope > .ds-card")
    .evaluate((el) => parseFloat(getComputedStyle(el).minHeight));
  await resize.focus();
  await page.keyboard.press("ArrowDown");
  await expect(search.locator(":scope > .ds-card")).toHaveCSS(
    "min-height",
    `${minBefore + 20}px`,
  );
  // Content is allowed to grow beyond its minimum; increase past that floor.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  expect(
    (await search.locator(":scope > .ds-card").boundingBox()).height,
  ).toBeGreaterThan(resized.height);
  await studio
    .locator(".dls-edit-bar")
    .getByRole("button", { name: "Přidat widget", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Obecný widget S · kompaktní", exact: true })
    .click();
  await expect(studio.locator(".dls-item")).toHaveCount(3);
  expect(
    (await studio.locator('[data-size="small"] > .ds-card').boundingBox())
      .height,
  ).toBeLessThan(240);
  await studio
    .getByRole("button", { name: "Odebrat Obecný widget", exact: true })
    .click();
  await expect(studio.locator(".dls-item")).toHaveCount(2);
  await expect(
    studio.getByRole("button", { name: "Odebrat Axolotl Office", exact: true }),
  ).toHaveCount(0);
  await expect(
    studio.getByRole("button", { name: "Odebrat Notebook", exact: true }),
  ).toHaveCount(0);
  await studio
    .getByRole("button", { name: "Obnovit výchozí", exact: true })
    .click();
  await expect(search).toHaveAttribute("data-layout-zone", "left");
  await expect(search).toHaveAttribute("data-size", "medium");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await studio
      .getByRole("button", { name: "Hotovo", exact: true })
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  const axeEdit = await new AxeBuilder({ page }).include(".dls").analyze();
  expect(axeEdit.violations, JSON.stringify(axeEdit.violations)).toEqual([]);
  await capture(page, {
    path: `${out}/layout-edit-desktop.png`,
    fullPage: true,
  });
  await studio.getByRole("button", { name: "Hotovo", exact: true }).click();
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(
    storage,
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const width of [1024, 768, 390, 320]) {
    await mobile.setViewportSize({ width, height: width > 700 ? 1024 : 844 });
    await mobile.goto(route);
    const d = mobile.locator(".dls");
    await expect(d.locator(".dls-office")).toBeVisible();
    await d
      .getByRole("button", { name: "Upravit Dashboard", exact: true })
      .tap();
    await choose(mobile, "Umístění Find Phrase", "Dolní zóna");
    await expect(d.locator('[data-layout-item="search-1"]')).toHaveAttribute(
      "data-layout-zone",
      "bottom",
    );
    await d.getByRole("button", { name: "Hotovo", exact: true }).tap();
    await d
      .getByRole("switch", { name: "Skutečné UI widgetů", exact: true })
      .tap();
    await expect(d.getByLabel("Hledaná fráze", { exact: true })).toBeVisible();
    expect(
      await d
        .getByLabel("Hledaná fráze", { exact: true })
        .evaluate((el) => el.getBoundingClientRect().width),
    ).toBeGreaterThanOrEqual(160);
    await d.getByLabel("Hledaná fráze", { exact: true }).fill("mobil");
    await d.getByRole("button", { name: "Hledat", exact: true }).tap();
    await expect(d.getByText("Demo: dokončeno", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    expect(
      await mobile.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await mobile.evaluate(() => scrollTo(0, 0));
    await capture(mobile, {
      path: `${out}/layout-mobile-${width}.png`,
      fullPage: true,
    });
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
  await page
    .getByRole("link", { name: "Axolotl / Design System", exact: true })
    .click();
  await expect(page.locator(".ds-catalog-category")).toHaveCount(9);
  await page.goBack();
  await expect(studio).toBeVisible();
  await page.goForward();
  await expect(page.locator(".ds-catalog-category")).toHaveCount(9);
  await writeFile(
    `${out}/layout-measurements.json`,
    JSON.stringify(measurements, null, 2),
  );
  console.log(
    "PASS Layout Studio: actual header and Office centered; 12 desktop composition/theme measurements; DnD/cancel/resize; stable real widgets; immutable anchors; reset/add/remove; keyboard/touch; isolated storage/theme; axe 0; responsive 1024/768/390/320; reduced motion and history",
  );
}
