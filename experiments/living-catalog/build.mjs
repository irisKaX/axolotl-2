import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
const folder=path.dirname(new URL(import.meta.url).pathname);
const out=path.join(folder,'dist');await fs.mkdir(out,{recursive:true});
async function bundle(entry){const result=await build({entryPoints:[path.join(folder,entry)],bundle:true,write:false,outdir:out,minify:true,format:'iife',platform:'browser',jsx:'automatic',plugins:[{name:'exact-svg-bytes',setup(b){b.onLoad({filter:/\.svg$/},async args=>({contents:'export default '+JSON.stringify('data:image/svg+xml;base64,'+(await fs.readFile(args.path)).toString('base64')),loader:'js'}));}}],define:{'process.env.NODE_ENV':'"production"','import.meta.env.BASE_URL':'"https://iriskax.github.io/axolotl-2/"'},legalComments:'eof'});return {js:result.outputFiles.find(f=>f.path.endsWith('.js')).text,css:result.outputFiles.find(f=>f.path.endsWith('.css'))?.text||''};}
const escapeScript=s=>s.replace(/<\/script/gi,'<\\/script');
const example=await bundle('preview.jsx');
const preview=`<!doctype html><html lang="cs" data-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${example.css}</style></head><body><div id="example"></div><script>${escapeScript(example.js)}</script></body></html>`;
const app=await bundle('catalog.jsx');
for(const [direction,title] of [['aperture','01 / Aperture'],['atelier','02 / Atelier'],['float','03 / Float']]){const html=`<!doctype html><html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#16151b"><title>${title} — Axolotl Living Catalog</title><meta name="description" content="Izolovaná vizuální explorace Living Component Catalogu O2 Axolotl. Funkční Select, nezměněný produkční header a responzivní pracovní prostředí."><style>${app.css}</style></head><body data-direction="${direction}"><div id="root"></div><script>window.__SELECT_PREVIEW__=${escapeScript(JSON.stringify(preview))};</script><script>${escapeScript(app.js)}</script></body></html>`;await fs.writeFile(path.join(out,`${direction}.html`),html);}
await fs.copyFile(path.join(out,'aperture.html'),path.join(out,'index.html'));
console.log('Built 3 self-contained prototypes, plus default entry. Production files unchanged.');
