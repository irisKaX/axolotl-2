// Run after build + preview-header-catalog.mjs --connected.
// Checks the delivered HTML, not layout: JSDOM does not render pixels.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import { JSDOM } from "jsdom";
import postcss from "postcss";

const html = await readFile(new URL("../dist/header-connected-review.html", import.meta.url), "utf8");
const css = postcss.parse(html.match(/<style>([\s\S]*?)<\/style>/)[1]);
const dom = new JSDOM(html.replace(/<style>[\s\S]*?<\/style>/, ""), {
  url: "https://preview.example.test/", runScripts: "dangerously", pretendToBeVisual: true,
  beforeParse(window) {
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.matchMedia = query => Object.assign(new window.EventTarget(), { matches: false, media: query });
    window.HTMLCanvasElement.prototype.getContext = () => null;
  },
});
await new Promise(resolve => setTimeout(resolve, 50));
after(() => dom.window.close());

test("delivered desktop header has no stale two-column rule overriding its three tracks", () => {
  const bar = dom.window.document.querySelector(".axolotl-header-bar");
  assert.ok(bar, "Connected header rendered");
  const tracks = [];
  css.walkRules(rule => {
    if (rule.parent.type !== "root") return; // conditional rules require a real browser
    if (!bar.matches(rule.selector)) return;
    rule.walkDecls("grid-template-columns", declaration => tracks.push(declaration.value));
  });
  assert.equal(tracks.at(-1), "minmax(0,570px) minmax(160px,1fr) auto");
});

test("delivered logo is a valid self-contained CSS image URL", () => {
  const mark = dom.window.document.querySelector(".axolotl-logo-art");
  assert.ok(mark);
  const value = mark.style.getPropertyValue("--axolotl-logo-image");
  assert.match(value, /^url\("[^"\n]+"\)$/, "Embedded SVG quotes must not terminate the CSS URL");
  assert.match(value, /^url\("data:image\/svg\+xml/);
});
