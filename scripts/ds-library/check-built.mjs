import { spawn } from "node:child_process";
const server = spawn(
  "node",
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4199",
    "--base=/axolotl-preview/ds-library-v1-1/",
  ],
  { stdio: "inherit" },
);
const url = "http://127.0.0.1:4199/axolotl-preview/ds-library-v1-1/";
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(url)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!ready) throw new Error("Built preview did not start");
  if (process.argv.slice(2).length) throw new Error('Historical Layout Studio checks are archived; use the canonical Library checks');
  const check = "scripts/ds-library/check.mjs";
  const child = spawn("node", [check], {
    stdio: "inherit",
    env: { ...process.env, LIBRARY_URL: url },
  });
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", resolve);
  });
  if (code !== 0) throw new Error(`Browser verification failed: ${code}`);
} finally {
  server.kill("SIGTERM");
}
