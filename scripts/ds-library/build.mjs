import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, renameSync } from "node:fs";
import { createHash } from "node:crypto";
const run = (file, args) => execFileSync(file, args, { stdio: "inherit" });
run("npm", ["run", "typecheck"]);
const { build } = await import("vite");
await build({ base: "/axolotl-preview/ds-library-v1-1/", build: { rollupOptions: { input: "library.html" } } });
renameSync("dist/library.html", "dist/index.html");
writeFileSync("dist/.nojekyll", "");
const files = [];
function walk(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = dir + "/" + item.name;
    if (item.isDirectory()) walk(path);
    else if (!path.endsWith(".test.tsx")) files.push(path);
  }
}
walk("src/design-system/Button");
walk("src/design-system/library");
walk("src/design-system/widgets");
walk("src/pages/design-system/library");
walk("public/library");
const sourceHashes = Object.fromEntries(
  files.map((path) => [
    path,
    createHash("sha256").update(readFileSync(path)).digest("hex"),
  ]),
);
writeFileSync(
  "dist/provenance.json",
  JSON.stringify(
    {
      previewCommit: execFileSync("git", ["rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim(),
      base: "/axolotl-preview/ds-library-v1-1/",
      entry: "#design-system",
      categories: [
        "buttons",
        "forms",
        "surfaces",
        "overlays",
        "feedback",
        "navigation",
        "colors",
        "widgets",
        "dashboard",
        "brand",
      ],
      sourceHashes,
      consolidation: JSON.parse(readFileSync("docs/ds-library/consolidation-source.json", "utf8")),
    },
    null,
    2,
  ),
);
