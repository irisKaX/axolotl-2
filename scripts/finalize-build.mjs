import { rename, writeFile } from "node:fs/promises";
await rename("dist/app.html", "dist/index.html");
await writeFile("dist/.nojekyll", "");
