import { readdir, readFile, writeFile, copyFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
const check = process.argv.includes("--check");
const files = [
  "index.html",
  ".nojekyll",
  ...(await readdir("dist/assets")).map((file) => `assets/${file}`),
  "downloads/axolotl-prohlizec.zip",
];
const manifestPath='build-assets.json';
if (check) {
  for (const file of files) {
    const expected = await readFile(join("dist", file));
    let actual;
    try {
      actual = await readFile(file);
    } catch {
      throw new Error(
        `Missing published build: ${file}. Run npm run publish:prepare.`,
      );
    }
    if (!expected.equals(actual))
      throw new Error(
        `Published build differs: ${file}. Run npm run publish:prepare.`,
      );
  }
  console.log("Published root matches the tested build.");
} else {
  let previous=[];
  try{previous=JSON.parse(await readFile(manifestPath,'utf8'));}catch{/* First migration build. */}
  for(const file of previous) if(/^assets\/[\w.-]+$/.test(file)&&!files.includes(file))await rm(file,{force:true});
  // Only remove files produced by this Vite entry, never legacy or user assets.
  for (const file of await readdir("assets"))
    if (/^app-[\w-]+\.(js|css)$/.test(file)) await rm(join("assets", file));
  await mkdir('downloads',{recursive:true});
  for (const file of files) await copyFile(join("dist", file), file);
  await writeFile(manifestPath,JSON.stringify(files.filter(file=>file.startsWith('assets/')),null,2)+'\n');
  await writeFile(".nojekyll", "");
  console.log("Prepared root build for the existing GitHub Pages source.");
}
