import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, renameSync } from "node:fs";
import { createHash } from "node:crypto";
const git = (...args) => execFileSync('git', args, {encoding:'utf8'}).trim();
const sourceCommit = git('rev-parse', 'HEAD');
const sourceClean = git('status', '--porcelain', '--untracked-files=no') === '';
if (process.env.SOURCE_COMMIT && (process.env.SOURCE_COMMIT !== sourceCommit || !sourceClean)) throw Error('Release source must be the exact clean pinned commit');
const run = (file, args) => execFileSync(file, args, { stdio: "inherit" });
run("npm", ["run", "typecheck"]);
process.env.VITE_SOURCE_COMMIT = sourceCommit;
const { build } = await import("vite");
await build({ base: "/axolotl-preview/ds-library-v1-1/", build: { rollupOptions: { input: "library.html" } } });
renameSync("dist/library.html", "dist/index.html");
run('python3',['scripts/package-extension.py']);
run(process.execPath,['scripts/check-extension-package.mjs','dist/downloads/axolotl-prohlizec.zip','dist/extension-package.json']);
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
walk("src/design-system/brand");
walk("src/design-system/library");
walk("src/design-system/widgets");
walk("src/pages/design-system/library");
walk("src/design-system/dashboard");
walk("src/design-system/tokens");
walk("src/design-system/theme");
walk("public/fonts/tweakcn");
walk("src/app/header");
walk("src/components/navigation");
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
      sourceCommit, sourceClean, sourceTree: git('rev-parse','HEAD^{tree}'),
      lockfileSha256: createHash('sha256').update(readFileSync('package-lock.json')).digest('hex'),
      extension: JSON.parse(readFileSync('dist/extension-package.json','utf8')),
      node: process.version,
      architecture: "react-canonical-v2",
      theme: "tweakcn-v1",
      themeRevision: "contrast-v1",
      themeSource: "src/design-system/tokens/tweakcn.export.css",
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
        "foundations",
      ],
      sourceHashes,
      consolidation: JSON.parse(readFileSync("docs/ds-library/consolidation-source.json", "utf8")),
    },
    null,
    2,
  ),
);
// Bind verification to the complete candidate payload. Provenance is the outer
// manifest and is deliberately excluded from its own file digest.
const artifactFiles = [];
function artifactWalk(dir) {
 for (const item of readdirSync(dir,{withFileTypes:true})) {
  const path=dir+'/'+item.name;
  if(item.isDirectory()) artifactWalk(path);
  else if(path!=='dist/provenance.json') artifactFiles.push(path);
 }
}
artifactWalk('dist');
const fileHashes=Object.fromEntries(artifactFiles.sort().map(path=>[path.slice(5),createHash('sha256').update(readFileSync(path)).digest('hex')]));
const provenance=JSON.parse(readFileSync('dist/provenance.json','utf8'));
provenance.fileHashes=fileHashes;
provenance.artifactDigest=createHash('sha256').update(JSON.stringify(fileHashes)).digest('hex');
writeFileSync('dist/provenance.json',JSON.stringify(provenance,null,2)+'\n');
