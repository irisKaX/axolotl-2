import { expect, test } from "@playwright/test";

test("cursor can be disabled from its label and restored from the switch", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("#dashboard");
  await expect(page.locator(".axolotl-cursor-layer canvas")).toHaveCount(1);
  await page.getByRole("button", { name: "Nastavení", exact: true }).hover();
  await page.getByRole("button", { name: "Vzhled a prostředí", exact: true }).click();
  await page.locator(".axolotl-cursor-option-text").click();
  const toggle = page.getByRole("switch", { name: "Efekt kurzoru" });
  await expect(toggle).not.toBeChecked();
  await expect(page.locator(".axolotl-cursor-layer")).toHaveCount(0);
  await page.mouse.move(500, 500);
  await page.reload();
  await expect(page.locator(".axolotl-cursor-layer")).toHaveCount(0);
  await page.getByRole("button", { name: "Nastavení", exact: true }).hover();
  await page.getByRole("button", { name: "Vzhled a prostředí", exact: true }).click();
  await toggle.check();
  await expect(page.locator(".axolotl-cursor-layer canvas")).toHaveCount(1);
  await toggle.uncheck();
  await expect(page.locator(".axolotl-cursor-layer")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("converter compares actual WebP with hover, drag, zoom and keyboard", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("#media/konvertor-obrazku");
  // A deterministic transparent test image reveals clipping/alignment mistakes.
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200; canvas.height = 720;
    const c = canvas.getContext("2d")!;
    const gradient = c.createLinearGradient(100, 0, 1100, 720);
    gradient.addColorStop(0, "#2563eb"); gradient.addColorStop(.5, "#7c3aed"); gradient.addColorStop(1, "#eab08d");
    c.fillStyle = gradient; c.fillRect(60, 60, 1080, 600);
    for (let i = 0; i < 12; i++) {
      c.strokeStyle = "#ffffff66"; c.lineWidth = 2;
      c.beginPath(); c.arc(600, 360, 36 + i * 23, 0, Math.PI * 2); c.stroke();
    }
    c.fillStyle = "white"; c.font = "600 54px sans-serif"; c.fillText("Axolotl / Compare", 125, 160);
    c.clearRect(900, 450, 180, 150);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#convert-files").setInputFiles({ name: "compare.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
  await page.getByRole("button", { name: /^Převést do WebP/ }).click();
  await page.getByRole("button", { name: "Porovnat compare.webp", exact: true }).click();
  const stage = page.locator(".compare-stage");
  const slider = page.getByRole("slider", { name: "Dělicí čára porovnání před a po" });
  await expect(slider).toBeVisible();
  await expect(stage.locator("img")).toHaveCount(2);
  await stage.scrollIntoViewIfNeeded();
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width * .3, box.y + box.height * .45);
  await expect(slider).toHaveAttribute("aria-valuenow", "30");
  await expect(stage.locator(".compare-original")).toHaveCSS("clip-path", "inset(0px 70% 0px 0px)");
  await expect(stage.locator(".compare-result")).toHaveCSS("clip-path", "inset(0px 0px 0px 30%)");
  await stage.screenshot({ path: info.outputPath("compare-dark.png") });
  await page.getByRole("button", { name: "Přiblížit oba obrázky", exact: true }).click();
  await expect(stage).toHaveAttribute("data-axolotl-compare-mode", "drag");
  await slider.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("Shift+ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "10");
  const zoomBox = (await stage.boundingBox())!;
  await page.mouse.move(zoomBox.x + zoomBox.width * .1, zoomBox.y + zoomBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(zoomBox.x + zoomBox.width * .7, zoomBox.y + zoomBox.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(slider).toHaveAttribute("aria-valuenow", "70");
  const [original, result] = await stage.locator("img").evaluateAll(images => images.map(image => (image as HTMLElement).style.cssText));
  expect(original).toBe(result);
  await page.getByTitle("Přepnout na světlý režim", { exact: true }).click();
  await stage.screenshot({ path: info.outputPath("compare-light.png") });
  expect(errors).toEqual([]);
});
