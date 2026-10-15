import { rm } from "node:fs/promises";
import {execFileSync} from "node:child_process";
execFileSync('python3',['scripts/package-extension.py'],{stdio:'inherit'});
await rm("dist", { recursive: true, force: true });
