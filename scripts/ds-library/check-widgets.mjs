import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import jsQR from "jsqr";
import { readFile, mkdir } from "node:fs/promises";
export async function checkWidgets(page, mobile, base, out) {
  await mkdir(out, { recursive: true });
  const screenshot = async (p, path) => {
    await p.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await p.screenshot({ path, fullPage: true });
  };
  const route = `${base}?catalog=library&section=widgets#design-system`;
  const choose = async (p, label, value) => {
    await p.getByRole("combobox", { name: label, exact: true }).click();
    await p.getByRole("option", { name: value, exact: true }).click();
  };
  await page.goto(route);
  await expect(
    page.getByRole("heading", { name: "Dashboard Widgets", exact: true }),
  ).toBeVisible();
  const stage = page.locator(".ds-catalog-stage"),
    search = stage.locator("[data-widget=search]");
  const requests = [];
  page.on("request", (r) => {
    if (["fetch", "xhr"].includes(r.resourceType())) requests.push(r.url());
  });
  const before = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  for (const theme of ["dark", "light"]) {
    const scope = page.locator(".ds-widget-studio").locator("..");
    if ((await scope.getAttribute("data-theme")) !== theme)
      await page
        .getByRole("button", {
          name:
            theme === "dark"
              ? "Tmavý náhled knihovny"
              : "Světlý náhled knihovny",
          exact: true,
        })
        .click();
    await expect(scope).toHaveAttribute("data-theme", theme);
    // Opaque local backing is required: axe cannot infer a WebGL backdrop.
    expect(
      await page
        .locator(".ds-widget-studio")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe(theme === "light" ? "rgb(238, 234, 243)" : "rgb(32, 30, 38)");
    await search.getByRole("button", { name: "Hledat", exact: true }).click();
    await expect(
      search.getByLabel("Hledaná fráze", { exact: true }),
    ).toBeFocused();
    await expect(
      search.getByText("Zadejte jednu frázi.", { exact: true }),
    ).toBeVisible();
    await search
      .getByLabel("Hledaná fráze", { exact: true })
      .fill("výhodné volání");
    for (const [scenario, result] of [
      ["Dokončeno", "Demo: dokončeno"],
      ["Dokončeno s omezením", "Demo: dokončeno s omezením"],
      ["Chyba přístupu", "Demo: hledání se nezdařilo"],
    ]) {
      await choose(page, "Demo scénář", scenario);
      await search.getByLabel("Hledaná fráze", { exact: true }).press("Enter");
      await expect(
        search.getByText("Demo: hledání spuštěno", { exact: true }),
      ).toBeVisible();
      await expect(
        search.getByText("Demo: probíhá skenování", { exact: true }),
      ).toBeVisible();
      await expect(search.getByText(result, { exact: true })).toBeVisible();
      const axe = await new AxeBuilder({ page })
        .include(".ds-widget-studio")
        .analyze();
      expect(axe.violations, JSON.stringify(axe.violations)).toEqual([]);
    }
    await search
      .getByRole("button", { name: "Otevřít v nástroji", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "Demo výsledek se do skutečného nástroje nepřenáší",
    );
    await page.keyboard.press("Escape");
    await expect(
      search.getByRole("button", { name: "Otevřít v nástroji", exact: true }),
    ).toBeFocused();
    expect(page.url()).toContain("section=widgets");
    await choose(page, "Demo scénář", "Dokončeno");
    await search.getByLabel("Hledaná fráze", { exact: true }).fill("");
    await choose(page, "Velikost widgetu", "L · širší plocha");
    await expect(search).toHaveAttribute("data-size", "large");
    await screenshot(page, `${out}/widgets-${theme}-search.png`);
    await choose(page, "Komponenta", "Mini QR");
    const qr = stage.locator("[data-widget=qr]");
    await qr
      .getByLabel("URL pro QR", { exact: true })
      .fill("javascript:alert(1)");
    await qr.getByRole("button", { name: "Vytvořit QR", exact: true }).click();
    await expect(qr.getByRole("alert")).toContainText("platný webový odkaz");
    await expect(qr.getByLabel("URL pro QR", { exact: true })).toBeFocused();
    await qr
      .getByLabel("URL pro QR", { exact: true })
      .fill("www.o2.cz/cesta?widget=1#test");
    await qr.getByLabel("URL pro QR", { exact: true }).press("Enter");
    await expect(
      qr.getByText("QR je připravený.", { exact: true }),
    ).toBeVisible();
    const pixels = await qr.locator("canvas").evaluate((c) => ({
      data: Array.from(
        c.getContext("2d").getImageData(0, 0, c.width, c.height).data,
      ),
      width: c.width,
      height: c.height,
    }));
    expect(
      jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)
        ?.data,
    ).toBe("https://www.o2.cz/cesta?widget=1#test");
    expect(new Set(pixels.data).size).toBe(2); // opaque black and white only
    const downloadPromise = page.waitForEvent("download");
    await qr.getByRole("button", { name: "Stáhnout PNG", exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("qr-code.png");
    const file = `${out}/widget-qr-${theme}.png`;
    await download.saveAs(file);
    const buffer = await readFile(file);
    expect([...buffer.subarray(0, 8)]).toEqual([
      137, 80, 78, 71, 13, 10, 26, 10,
    ]);
    // Decode the actual downloaded PNG, independent of the model and preview canvas.
    const imagePixels = await page.evaluate(async (b64) => {
      const i = new Image();
      i.src = "data:image/png;base64," + b64;
      await i.decode();
      const c = document.createElement("canvas");
      c.width = i.width;
      c.height = i.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(i, 0, 0);
      return {
        width: i.width,
        height: i.height,
        data: Array.from(ctx.getImageData(0, 0, i.width, i.height).data),
      };
    }, buffer.toString("base64"));
    expect(imagePixels.width).toBe(512);
    expect(imagePixels.height).toBe(512);
    expect(jsQR(new Uint8ClampedArray(imagePixels.data), 512, 512)?.data).toBe(
      "https://www.o2.cz/cesta?widget=1#test",
    );
    await expect(qr.getByRole("status")).toContainText(
      "PNG předáno prohlížeči",
    );
    const axe = await new AxeBuilder({ page })
      .include(".ds-widget-studio")
      .analyze();
    expect(axe.violations, JSON.stringify(axe.violations)).toEqual([]);
    await screenshot(page, `${out}/widgets-${theme}-qr.png`);
    await qr
      .getByLabel("URL pro QR", { exact: true })
      .fill("https://example.test/new");
    await expect(
      qr.getByRole("button", { name: "Stáhnout PNG", exact: true }),
    ).toHaveCount(0);
    await choose(page, "Komponenta", "Find Phrase / Asset Search");
  }
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(
    before,
  );
  await search.getByRole("radio", { name: "Fráze", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    search.getByRole("radio", { name: "Asset", exact: true }),
  ).toBeChecked();
  await search
    .getByLabel("ID nebo název assetu", { exact: true })
    .fill("hero-2026");
  await search
    .getByLabel("ID nebo název assetu", { exact: true })
    .press("Enter");
  await expect(
    search.getByText("Demo: dokončeno", { exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await search
      .getByRole("button", { name: "Hledat", exact: true })
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .getByRole("switch", { name: "Zobrazit testovací komponenty", exact: true })
    .check();
  await expect(
    search.getByLabel("ID nebo název assetu", { exact: true }),
  ).toHaveValue("hero-2026");
  await page.goBack();
  await expect(
    search.getByLabel("ID nebo název assetu", { exact: true }),
  ).toHaveValue("hero-2026");
  await page.goForward();
  await expect(
    page.getByRole("switch", {
      name: "Zobrazit testovací komponenty",
      exact: true,
    }),
  ).toBeChecked();
  for (const width of [390, 320]) {
    await mobile.setViewportSize({ width, height: 844 });
    await mobile.goto(route);
    const mobileTheme = width === 320 ? "light" : "dark";
    if (
      (await mobile
        .locator(".ds-widget-studio")
        .locator("..")
        .getAttribute("data-theme")) !== mobileTheme
    )
      await mobile
        .getByRole("button", {
          name:
            mobileTheme === "light"
              ? "Světlý náhled knihovny"
              : "Tmavý náhled knihovny",
          exact: true,
        })
        .click();
    for (const kind of ["Find Phrase / Asset Search", "Mini QR"]) {
      await choose(mobile, "Komponenta", kind);
      const widget = mobile.locator(".ds-catalog-stage .ds-dashboard-widget");
      expect(
        await widget
          .locator('form input:not([type="radio"])')
          .evaluate((el) => el.getBoundingClientRect().width),
      ).toBeGreaterThanOrEqual(160);
      if (kind === "Mini QR") {
        await widget
          .getByLabel("URL pro QR", { exact: true })
          .fill("https://www.o2.cz/");
        await widget
          .getByRole("button", { name: "Vytvořit QR", exact: true })
          .tap();
        await expect(widget.locator("canvas")).toBeVisible();
      } else {
        await widget
          .getByLabel("Hledaná fráze", { exact: true })
          .fill("internet");
        await widget.getByRole("button", { name: "Hledat", exact: true }).tap();
        await expect(
          widget.getByText("Demo: dokončeno", { exact: true }),
        ).toBeVisible();
      }
      expect(
        await mobile.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await screenshot(
        mobile,
        `${out}/widgets-mobile-${width}-${kind === "Mini QR" ? "qr" : "search"}.png`,
      );
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
  console.log(
    "PASS Dashboard Widgets: isolated demo lifecycle, validation/focus, M/L, local dark/light, axe 0, actual QR + downloaded PNG decoded, no network/storage/tool bridge, keyboard, history, touch 390/320 and reduced motion",
  );
}
