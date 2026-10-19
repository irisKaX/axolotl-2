import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
const run = (file, args) => execFileSync(file, args, { stdio: "inherit" });
run("npm", ["run", "typecheck"]);
run("node", ["scripts/clean-build.mjs"]);
run("node", [
  "node_modules/vite/bin/vite.js",
  "build",
  "--base=/axolotl-preview/ds-library-v1-1/",
]);
run("node", ["scripts/finalize-build.mjs"]);
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
walk("src/pages/design-system/library");
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
      ],
      sourceHashes,
    },
    null,
    2,
  ),
);
