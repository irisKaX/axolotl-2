import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
export async function checkHalo(page, mobile, base, out) {
  const choose = async (p, label, value) => {
    await p.getByRole("combobox", { name: label, exact: true }).click();
    await p.getByRole("option", { name: value, exact: true }).click();
  };
  const route = `${base}?catalog=library&section=surfaces#design-system`;
  await page.goto(route);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const studio = page.getByRole("region", { name: "Halo 2.0", exact: true });
  const read = (card) =>
    card.evaluate((el) => ({
      matrix: getComputedStyle(el).transform,
      rx: el.style.getPropertyValue("--halo-rx"),
      ry: el.style.getPropertyValue("--halo-ry"),
      x: el.style.getPropertyValue("--halo-x"),
      angle: el.style.getPropertyValue("--halo-angle"),
      hot: el.style.getPropertyValue("--halo-hot"),
      running: el.dataset.haloRunning,
      layer: getComputedStyle(el.querySelector("[data-halo-layer=content]"))
        .transform,
    }));
  const evidence = [];
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
    await choose(page, "Porovnání Halo", "Tři intenzity vedle sebe");
    for (const intensity of ["soft", "spatial", "cinematic"])
      await expect(studio.locator(`[data-halo=${intensity}]`)).toHaveCount(6);
    const axe = await new AxeBuilder({ page })
      .include(".ds-halo-showcase")
      .analyze();
    expect(
      axe.violations,
      JSON.stringify(
        axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      ),
    ).toEqual([]);
    for (const intensity of ["soft", "spatial", "cinematic"]) {
      const card = studio.locator(
        `.ds-interactive-card[data-halo=${intensity}]`,
      );
      await card.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await expect(card).toHaveAttribute("data-halo-running", "false");
      const rest = await read(card),
        box = await card.boundingBox();
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.25);
      await expect
        .poll(async () => Number((await read(card)).hot))
        .toBeGreaterThan(0.98);
      await expect(card).toHaveAttribute("data-halo-running", "false");
      const right = await read(card);
      if (intensity === "soft") {
        expect(right.ry).toBe("0.000deg");
      } else {
        expect(Math.abs(parseFloat(right.ry))).toBeGreaterThan(
          intensity === "cinematic" ? 3 : 1,
        );
        expect(right.matrix).not.toBe(rest.matrix);
        expect(right.layer).not.toBe(rest.layer);
      }
      await card.screenshot({
        path: `${out}/halo-${theme}-${intensity}-hover.png`,
      });
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.7);
      await expect
        .poll(async () => parseFloat((await read(card)).x))
        .toBeLessThan(35);
      const left = await read(card);
      expect(left.angle).not.toBe(right.angle);
      await page.mouse.down();
      await expect
        .poll(() =>
          card.evaluate((el) =>
            Number(el.style.getPropertyValue("--halo-scale")),
          ),
        )
        .toBeLessThan(0.99);
      await page.mouse.move(0, 0);
      await page.mouse.up();
      await expect.poll(async () => Number((await read(card)).hot)).toBe(0);
      await expect(card).toHaveAttribute("data-halo-running", "false");
      expect((await read(card)).ry).toBe("0.000deg");
      await card.focus();
      await page.keyboard.press("Space");
      await expect(card).toHaveAttribute("aria-pressed", "true");
      expect(
        await card.evaluate((el) => getComputedStyle(el).outlineStyle),
      ).toBe("solid");
      await card.screenshot({
        path: `${out}/halo-${theme}-${intensity}-focus.png`,
      });
      await page.keyboard.press("Space");
      evidence.push({ theme, intensity, rest, right, left });
    }
    await studio
      .locator(".ds-halo-columns")
      .evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.screenshot({ path: `${out}/halo-${theme}-comparison.png` });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `${out}/halo-${theme}-desktop.png`,
      fullPage: true,
    });
  }
  await studio.getByText("Efekty a interakční stavy", { exact: true }).click();
  await choose(page, "Porovnání Halo", "Vybraná intenzita");
  await choose(page, "Intenzita Halo", "Halo Cinematic");
  const card = studio.locator(".ds-interactive-card[data-halo]");
  for (const label of [
    "Světlo pod kurzorem",
    "Světelný obrys",
    "3D náklon",
    "Parallax vrstev",
    "Ambientní světlo",
    "Odlesk",
    "Zdvih karty",
  ])
    await studio.getByRole("switch", { name: label, exact: true }).uncheck();
  await card.hover();
  await expect(card).toHaveAttribute("data-halo-effects", "");
  await expect(card).toHaveAttribute("data-halo-running", "false");
  await expect(card).toHaveAttribute("data-halo-motion", "static");
  expect((await read(card)).ry).toBe("0.000deg");
  expect((await read(card)).layer).toBe("none");
  for (const cls of ["spot", "edge", "ambient", "sheen"])
    expect(
      await card
        .locator(`.ds-halo-${cls}`)
        .evaluate((el) => getComputedStyle(el).opacity),
    ).toBe("0");
  await studio
    .getByRole("button", { name: "Obnovit výchozí efekty", exact: true })
    .click();
  await studio
    .getByRole("switch", { name: "Načítání Halo akcí", exact: true })
    .check();
  await card.click({ force: true });
  await expect(card).toHaveAttribute("aria-pressed", "false");
  await expect(card).toHaveAttribute("data-halo-motion", "static");
  await studio
    .getByRole("switch", { name: "Načítání Halo akcí", exact: true })
    .uncheck();
  await studio
    .getByRole("switch", { name: "Neaktivní Halo akce", exact: true })
    .check();
  await expect(card).toBeDisabled();
  await studio
    .getByRole("switch", { name: "Neaktivní Halo akce", exact: true })
    .uncheck();
  await studio
    .getByRole("button", { name: "Vyzkoušet kontrolu", exact: true })
    .click();
  await expect(studio).toContainText("Titulek i popis jsou vyplněné");
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
  for (const state of ["loading", "error", "warning", "success"]) {
    await choose(page, "Stav Halo obsahu", state);
    const a = await new AxeBuilder({ page })
      .include(".ds-halo-showcase")
      .analyze();
    expect(a.violations.map((v) => v.id)).toEqual([]);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await card.hover();
  await expect(card).toHaveAttribute("data-halo-motion", "static");
  expect((await read(card)).matrix).toBe("none");
  expect((await read(card)).layer).toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await card.hover();
  await expect
    .poll(async () => Number((await read(card)).hot))
    .toBeGreaterThan(0.9);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(card).toHaveAttribute("data-halo-running", "false");
  expect((await read(card)).hot).toBe("0.0000");
  await choose(page, "Porovnání Halo", "Původní Halo + vybraná intenzita");
  await expect(studio.locator(".ds-halo-column")).toHaveCount(2);
  await expect(
    studio
      .getByRole("region", { name: "Původní Halo", exact: true })
      .locator("[data-halo]"),
  ).toHaveCount(0);
  for (const width of [390, 320]) {
    await mobile.setViewportSize({ width, height: 844 });
    await mobile.goto(route);
    const m = mobile.getByRole("region", { name: "Halo 2.0", exact: true });
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
      const mc = m.locator(".ds-interactive-card");
      await mc.tap();
      await expect(mc).toHaveAttribute("data-halo-motion", "static");
      expect(await mc.evaluate((el) => getComputedStyle(el).transform)).toBe(
        "none",
      );
      await expect(
        m.getByRole("button", { name: "Vyzkoušet kontrolu", exact: true }),
      ).toBeEnabled();
      expect(
        await mobile.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await m
        .locator(".ds-halo-columns")
        .evaluate((el) => el.scrollIntoView({ block: "start" }));
      await mobile.screenshot({
        path: `${out}/halo-${theme}-mobile-${width}-detail.png`,
      });
      await mobile.evaluate(() => window.scrollTo(0, 0));
      await mobile.screenshot({
        path: `${out}/halo-${theme}-mobile-${width}.png`,
        fullPage: true,
      });
    }
  }
  await mobile
    .locator(".ds-halo-showcase")
    .evaluate((el) => (el.style.fontSize = "200%"));
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
  await writeFile(
    `${out}/halo-interactions.json`,
    JSON.stringify(evidence, null, 2),
  );
  console.log(
    "PASS Halo 2.0: actual pointer position, distinct tilt/parallax, edge direction, sleep/reset, all effect toggles, keyboard/pressed, disabled/loading, dark/light axe, touch, reduced motion and history",
  );
}
