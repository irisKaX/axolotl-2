// Build the pinned approved header plus the local, reviewable UI polish patch. Never modify production source.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(process.env.AXOLOTL_SOURCE || root);
const revision='02a2ff32b8da590d0d7232c063a43d62bc736e7d';
const scratch=mkdtempSync(path.join(tmpdir(),'axolotl-approved-header-'));
try {
  const archive=execFileSync('git',['archive',revision,'src'],{cwd:source,maxBuffer:20*1024*1024});
  execFileSync('tar',['-x','-C',scratch],{input:archive});
  execFileSync('git',['apply',path.join(root,'public/library/dashboard/header-ui-polish.patch')],{cwd:scratch});
  const {build}=await import(pathToFileURL(path.join(source,'node_modules/esbuild/lib/main.js')).href);
  await build({entryPoints:[path.join(root,'public/library/dashboard/header-entry.tsx')],bundle:true,minify:true,format:'iife',jsx:'automatic',target:'es2022',outfile:path.join(root,'public/library/dashboard/approved-header/header.js'),alias:{'@approved':path.join(scratch,'src')},nodePaths:[path.join(source,'node_modules')],loader:{'.svg':'file'},assetNames:'[name]-[hash]',publicPath:'./approved-header/',define:{'process.env.NODE_ENV':'"production"','import.meta.env.BASE_URL':'"/axolotl-preview/ds-library-v1-1/"'},legalComments:'linked'});
  copyFileSync(path.join(scratch,'src/components/effects/LICENSE.react-bits.md'),path.join(root,'public/library/dashboard/approved-header/LICENSE.react-bits.md'));
  writeFileSync(path.join(root,'public/library/dashboard/approved-header/source.json'),JSON.stringify({repository:'irisKaX/axolotl-2',ref:'main',commit:revision,component:'src/app/header/AppHeader.tsx',sourceChanges:false,previewPatch:"../header-ui-polish.patch"},null,2)+'\n');
} finally {rmSync(scratch,{recursive:true,force:true});}
