import { build } from 'vite';
import { copyFile,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=new URL('../../../',import.meta.url);
await build({configFile:fileURLToPath(new URL('./vite.config.ts',import.meta.url))});
await copyFile(new URL('./vendor/LICENSE.md',import.meta.url),new URL('dist-dark-veil/LICENSE-DarkVeil.txt',root));
await writeFile(new URL('dist-dark-veil/upstream.txt',root),'Dark Veil by David Haz / React Bits\nhttps://reactbits.dev/backgrounds/dark-veil\nSource: https://github.com/DavidHDev/react-bits/tree/c2a1408d9219a5bd7a2d9c93c9c499042f5fa34a/src/ts-default/Backgrounds/DarkVeil\nUnmodified upstream TSX and CSS. MIT + Commons Clause; see LICENSE-DarkVeil.txt.\n');
