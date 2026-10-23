import { rename, writeFile } from "node:fs/promises";
await rename("dist/app.html", "dist/index.html");
await writeFile("dist/.nojekyll", "");

import {execFileSync} from 'node:child_process';
execFileSync('python3',['scripts/package-extension.py'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-extension-package.mjs','dist/downloads/axolotl-prohlizec.zip'],{stdio:'inherit'});
