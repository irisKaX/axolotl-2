import {readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const project = fileURLToPath(new URL('../', import.meta.url));
const directory = new URL('../src/tools/legacy/tests/', import.meta.url);
const toolFiles = readdirSync(directory)
  .filter(name => name.endsWith('.test.mjs'))
  .sort()
  .map(name => fileURLToPath(new URL(name, directory)));
const bridgeDirectory = new URL('../tests/', import.meta.url);
const bridgeFiles = readdirSync(bridgeDirectory)
  .filter(name => /^bridge-.*\.test\.(?:mjs|cjs)$/.test(name))
  .sort()
  .map(name => fileURLToPath(new URL(name, bridgeDirectory)));

if (toolFiles.length === 0) throw new Error('No imported tool regression tests found.');
if (bridgeFiles.length === 0) throw new Error('No companion bridge regression tests found.');
const files = [...toolFiles, ...bridgeFiles];
const result = spawnSync(process.execPath, ['--test', ...process.argv.slice(2), ...files], {
  cwd: project,
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
