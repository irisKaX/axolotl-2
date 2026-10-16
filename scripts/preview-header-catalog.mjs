import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Run npm run build first. This is a local review artifact, never a deployment.
const connected = process.argv.includes("--connected");
// public/assets contains previous releases. Only use CSS referenced by this build.
const manifest = JSON.parse(await readFile("dist/.vite/manifest.json", "utf8"));
const styles = new Set();
const visited = new Set();
function collectStyles(key) {
  if (visited.has(key)) return;
  visited.add(key);
  const chunk = manifest[key];
  if (!chunk) throw new Error(`Missing current preview chunk: ${key}. Run npm run build first.`);
  for (const dependency of chunk.imports ?? []) collectStyles(dependency);
  for (const path of chunk.css ?? []) styles.add(path);
}
collectStyles("app.html");
collectStyles("src/pages/header-lab/HeaderLab.tsx");
const css = (await Promise.all([...styles].map(path => readFile(resolve("dist", path), "utf8")))).join("\n");
const result = await build({
  entryPoints: ["src/pages/header-lab/standalone.tsx"],
  bundle: true, minify: true, write: false, format: "iife", platform: "browser", target: "chrome121",
  loader: { ".css": "empty" },
  // Raw SVG attributes contain quotes that break BrandMark's CSS url("...").
  plugins: [{ name: "embedded-svg", setup(builder) {
    builder.onLoad({ filter: /\.svg$/ }, async ({ path }) => ({
      contents: `export default ${JSON.stringify(`data:image/svg+xml;base64,${(await readFile(path)).toString("base64")}`)}`,
      loader: "js",
    }));
  } }],
  define: { "process.env.NODE_ENV": '"production"', "import.meta.env.BASE_URL": '"https://iriskax.github.io/axolotl-2/"' },
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const output = resolve(connected ? "dist/header-connected-review.html" : "dist/header-catalog-review.html");
await writeFile(output, `<!doctype html><html lang="cs" data-theme="dark" data-review="${connected ? "connected" : "catalog"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#050505"><title>${connected ? "Axolotl · Propojená navigace" : "Axolotl · Header A / B"}</title><style>${css}</style></head><body><div id="axolotl-root"></div><noscript>Pro živé porovnání zapni JavaScript.</noscript><script>${js}</script></body></html>`);
console.log(output);
