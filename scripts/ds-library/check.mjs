import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
const base =
  process.env.LIBRARY_URL || "http://127.0.0.1:4198/axolotl-2/app.html";
const out = process.env.LIBRARY_EVIDENCE || "docs/ds-library/evidence";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE || undefined,
  args: ["--no-sandbox"],
});
const errors = [],
  checks = [];
const pass = (s) => {
  checks.push(s);
  console.log("PASS", s);
};
const route = (id) =>
  `${base}?catalog=library${id ? "&section=" + id : ""}#design-system`;
async function choose(page, label, value) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}
try {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    locale: "cs-CZ",
  });
  context.setDefaultTimeout(15000);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(route(""));
  await expect(
    page.getByRole("heading", {
      name: "Design System Library V1",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".ds-catalog-category")).toHaveCount(6);
  await expect(
    page.getByRole("banner", { name: "Ovládání Axolotlu" }),
  ).toBeVisible();
  for (const theme of ["dark", "light"]) {
    for (const id of [
      "",
      "buttons",
      "forms",
      "surfaces",
      "overlays",
      "feedback",
      "navigation",
    ]) {
      await page.goto(route(id));
      await expect(page.locator(".ds-catalog-heading")).toBeVisible();
      if ((await page.locator("html").getAttribute("data-theme")) !== theme)
        await page
          .getByRole("button", {
            name:
              theme === "light"
                ? "Světlý náhled knihovny"
                : "Tmavý náhled knihovny",
            exact: true,
          })
          .click();
      if (id && id !== "buttons")
        await expect(page.locator(".ds-catalog-playground")).toBeVisible();
      if (id === "buttons")
        await expect(page.locator("#button-playground")).toBeVisible();
      await page.waitForTimeout(200);
      const axe = await new AxeBuilder({ page })
        .include(".ds-catalog")
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
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `${out}/${theme}-${id || "home"}.png`,
        fullPage: true,
      });
    }
    pass(
      `${theme}: overview + six actual pages, axe 0 violations and no horizontal overflow`,
    );
  }
  await page.goto(route(""));
  await page
    .locator(".ds-catalog-category")
    .filter({ hasText: "Inputs & Forms" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Inputs & Forms", exact: true }),
  ).toBeFocused();
  await page.goBack();
  await expect(
    page.getByRole("heading", {
      name: "Design System Library V1",
      exact: true,
    }),
  ).toBeVisible();
  pass("Category links, deep links, history Back and heading focus");
  await page.goto(route("forms"));
  await page
    .getByRole("button", { name: "Uložit formulář", exact: true })
    .click();
  const email = page.getByRole("textbox", { name: "E-mail", exact: true });
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAccessibleDescription(/Zadej platný e-mail/);
  await email.fill("iris@example.cz");
  await page
    .getByRole("checkbox", { name: "Souhlasím s uložením ukázky" })
    .check();
  await page.getByRole("button", { name: "Uložit formulář" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "formulář uložen" }),
  ).toBeVisible();
  for (const kind of [
    "Input",
    "Textarea",
    "Select",
    "Checkbox",
    "Radio",
    "Switch",
    "Slider",
  ]) {
    await choose(page, "Komponenta", kind);
    await page.getByRole("switch", { name: "Disabled", exact: true }).check();
    const demo = page.locator("[data-demo=form]");
    await expect(demo.locator("input,textarea,button").first()).toBeDisabled();
    await page.getByRole("switch", { name: "Disabled", exact: true }).uncheck();
    await page.getByRole("switch", { name: "Invalid", exact: true }).check();
    await expect(demo.locator("[aria-invalid=true]").first()).toBeVisible();
    await page.getByRole("switch", { name: "Invalid", exact: true }).uncheck();
  }
  await choose(page, "Komponenta", "Slider");
  const slider = page.getByRole("slider", { name: "Intenzita náhledu" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("41");
  await choose(page, "Komponenta", "Checkbox");
  await page.getByRole("button", { name: "Nastavit indeterminate" }).click();
  await expect(
    page.getByRole("checkbox", { name: "Zahrnout do výběru" }),
  ).toHaveAttribute("aria-checked", "mixed");
  pass(
    "All seven form exports: disabled/invalid; validation focus; slider keyboard; indeterminate checkbox",
  );
  await page.goto(route("overlays"));
  const open = page.getByRole("button", {
    name: "Otevřít dialog",
    exact: true,
  });
  await open.click();
  let dialog = page.getByRole("dialog", {
    name: "Upravit workspace",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("data-theme", "light");
  await choose(page, "Viditelnost", "Sdílený");
  await expect(dialog).toBeVisible();
  await page
    .getByRole("combobox", { name: "Viditelnost", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Nápověda v dialogu" }).click();
  let popover = page.getByRole("dialog", { name: "Nápověda k workspace" });
  await expect(popover).toBeVisible();
  await popover.getByRole("textbox").fill("Test");
  await page.keyboard.press("Escape");
  await expect(popover).toHaveCount(0);
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  const axe = await new AxeBuilder({ page }).include(".ds-dialog").analyze();
  expect(
    axe.violations,
    JSON.stringify(
      axe.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ),
  ).toEqual([]);
  await page.screenshot({ path: `${out}/dialog-nested-select.png` });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
  await choose(page, "Komponenta", "Confirmation Dialog");
  await page.getByRole("button", { name: "Otevřít potvrzení" }).click();
  await expect(
    page.getByRole("button", { name: "Zrušit", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Odstranit soubor", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "soubor byl odstraněn" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Otevřít potvrzení" }),
  ).toBeFocused();
  await choose(page, "Komponenta", "Tooltip");
  const tip = page.getByRole("button", {
    name: "Zobrazit nápovědu",
    exact: true,
  });
  await tip.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  pass(
    "Dialog focus trap, nested Select/Popover Escape ownership, cancel-first confirmation, async result, Tooltip focus + Escape and portalled theme",
  );
  await page.goto(route("navigation"));
  let stage = page.getByLabel("Živý playground");
  await stage.getByRole("tab", { name: "Přehled" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(stage.getByRole("tab", { name: "Detaily" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await stage.getByRole("textbox").fill("Zůstává zachováno");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await expect(stage.getByRole("textbox")).toHaveValue("Zůstává zachováno");
  await page.getByRole("switch", { name: "Zakázat Historii" }).check();
  await stage.getByRole("tab", { name: "Detaily" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(stage.getByRole("tab", { name: "Přehled" })).toBeFocused();
  await choose(page, "Komponenta", "Segmented Control");
  await stage.getByRole("radio", { name: "Přehled" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(stage.getByRole("radio", { name: "Detaily" })).toBeChecked();
  await choose(page, "Komponenta", "Disclosure");
  await stage.locator("summary").focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("switch", { name: "Otevřená sekce" }),
  ).toBeChecked();
  await choose(page, "Komponenta", "Pagination");
  await stage.getByRole("button", { name: "Další", exact: true }).click();
  await expect(
    stage.getByRole("button", { name: "Stránka 2" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(stage).toContainText("Výsledek 6");
  pass(
    "Tabs arrows/Home and disabled skipping, radio arrows, native Disclosure, real paginated content",
  );
  await page.goto(route("feedback"));
  await choose(page, "Komponenta", "Progress");
  await page.getByRole("button", { name: "Spustit ukázkový průběh" }).click();
  await expect(
    page.getByRole("progressbar", { name: "Zpracování ukázky" }),
  ).toHaveAttribute("value", "100");
  await choose(page, "Komponenta", "Alert");
  await stage.getByRole("button", { name: "Zavřít upozornění" }).click();
  await expect(stage).toContainText("Upozornění bylo zavřeno");
  await choose(page, "Komponenta", "Empty State");
  await stage.getByRole("button", { name: "Přidat poznámku" }).click();
  await expect(stage).toContainText("První poznámka je připravená");
  pass(
    "Progress completes, Alert dismisses, Empty State action produces content",
  );
  await page.goto(route("surfaces"));
  await choose(page, "Komponenta", "Interactive Card");
  await stage.getByRole("button", { name: /Metadata/ }).click();
  await expect(stage.getByRole("button", { name: /Metadata/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await choose(page, "Komponenta", "State Card");
  await choose(page, "Stav obsahu", "error");
  await stage.getByRole("button", { name: "Zkusit znovu" }).click();
  await expect(stage).toContainText("Widget připraven");
  pass(
    "Interactive Card selection and State Card retry produce actual state changes",
  );
  await page.goto(route("buttons"));
  const approvedButton = page
    .locator("#button-playground.axo-ds-button")
    .first();
  await page.keyboard.press("Tab");
  await approvedButton.focus();
  expect(
    await approvedButton.evaluate((el) => getComputedStyle(el).fontFamily),
  ).toContain("ui-sans-serif");
  expect(
    await approvedButton.evaluate((el) => getComputedStyle(el).outlineOffset),
  ).toBe("5px");
  await page.getByLabel("Star Border", { exact: true }).check();
  const canvas = page.locator("#button-playground canvas");
  await expect(canvas).toHaveCount(1);
  await page.locator("#button-playground").scrollIntoViewIfNeeded();
  const frame = await canvas.evaluate((c) => c.toDataURL());
  await page.waitForTimeout(180);
  expect(await canvas.evaluate((c) => c.toDataURL())).not.toBe(frame);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveCount(0);
  pass("Unmodified Button actual export and live Star Border / reduced motion");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  mobileContext.setDefaultTimeout(15000);
  const mobile = await mobileContext.newPage();
  mobile.on("pageerror", (e) => errors.push(e.message));
  for (const theme of ["dark", "light"])
    for (const id of [
      "",
      "buttons",
      "forms",
      "surfaces",
      "overlays",
      "feedback",
      "navigation",
    ]) {
      await mobile.goto(route(id));
      await expect(mobile.locator(".ds-catalog")).toBeVisible();
      if ((await mobile.locator("html").getAttribute("data-theme")) !== theme)
        await mobile
          .getByRole("button", {
            name:
              theme === "light"
                ? "Světlý náhled knihovny"
                : "Tmavý náhled knihovny",
            exact: true,
          })
          .tap();
      if (id && id !== "buttons")
        await expect(mobile.locator(".ds-catalog-playground")).toBeVisible();
      expect(
        await mobile.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (theme === "dark")
        await mobile.screenshot({ path: `${out}/mobile-${id || "home"}.png` });
    }
  await mobile.goto(route("overlays"));
  await mobile
    .getByRole("button", { name: "Otevřít dialog", exact: true })
    .tap();
  await mobile.getByRole("combobox", { name: "Viditelnost" }).tap();
  const rect = await mobile.getByRole("listbox").boundingBox();
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(391);
  await mobile.getByRole("option", { name: "Sdílený" }).tap();
  await mobile.screenshot({ path: `${out}/mobile-dialog.png` });
  await mobile.keyboard.press("Escape");
  pass(
    "390px touch: six pages + overview in both themes, dialog and nested Select within viewport",
  );
  await mobile.goto(route("forms"));
  await mobile.setViewportSize({ width: 320, height: 700 });
  await mobile.evaluate(() =>
    document.documentElement.style.setProperty("--axolotl-text-scale", "2"),
  );
  expect(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  pass("320px layout with 200% component text");
  await page.goto(route(""));
  await page.getByRole("button", { name: "Nastavení", exact: true }).click();
  await page
    .getByRole("button", { name: "Vzhled a prostředí", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Barevný režim" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  pass("Existing AppHeader settings and providers remain functional");
  expect(errors).toEqual([]);
  pass("No browser runtime errors");
} finally {
  await writeFile(
    `${out}/verification.json`,
    JSON.stringify(
      { base, browser: browser.version(), checks, errors },
      null,
      2,
    ),
  );
  await browser.close();
}
