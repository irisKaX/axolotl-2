import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
function page(html){
 const dom=new JSDOM(html,{url:'https://www.o2.cz/osobni/ceniky-a-dokumenty',runScripts:'outside-only'});
 for(const file of ['content/core.js','tools/pdf-scout/page.js'])vm.runInContext(readFileSync(new URL('../../../../browser-extension/'+file,import.meta.url),'utf8'),dom.getInternalVMContext());
 return {dom,scan:options=>JSON.parse(JSON.stringify(dom.window.__O2Tools.pdfScan(options)))};
}
test('All 55 O2 table downloads are found, including 49 extensionless addresses',()=>{
 const {dom,scan}=page(readFileSync(new URL('./fixtures/o2-document-downloads.html',import.meta.url),'utf8'));
 try{
  const result=scan({deep:true});assert.equal(result.truncated,false);assert.equal(result.items.length,55);
  for(const row of dom.window.document.querySelectorAll('tbody tr')){
   const link=row.querySelector('a[href]'),item=result.items.find(i=>i.url===link.href);
   assert.ok(item,link.href);assert.equal(item.title,row.cells[0].textContent.trim().replace(/\s+/g,' '));
  }
  const main=result.items.find(i=>i.title==='Ceník základních služeb');
  assert.equal(main.filename,'Cenik_zakladnich_sluzeb_18_09_2026.pdf');
  const unnamed=result.items.find(i=>i.title==='Reklamační řád');assert.equal(unnamed.filename,'');assert.equal(unnamed.status,'possible');
  assert.equal(scan({deep:false}).items.length,6);
 }finally{dom.window.close();}
});
test('Download semantics find opaque URLs without admitting script/referrer noise',()=>{
 const {dom,scan}=page(`<link rel="canonical" href="/osobni/ceniky-a-dokumenty">
 <script src="https://cmp.test/cmp.php?referrer=ceniky-a-dokumenty"></script>
 <script src="/modifications.min.js?return=/download"></script>
 <a href="/file/1">Stáhnout</a><a href="/file/2" aria-label="Stažení souboru">↓</a>
 <a href="/file/3" download="guide.pdf">Příručka</a><a href="/file/4" type="application/pdf">Návod</a>
 <a href="/ordinary">Další stránka</a><a href="javascript:alert('pdf')">Stáhnout</a>
 <a href="/logout">Stáhnout PDF</a>`);
 try{const items=scan({deep:true}).items;assert.deepEqual(items.map(i=>new URL(i.url).pathname).sort(),['/file/1','/file/2','/file/3','/file/4']);assert.equal(items.find(i=>i.url.endsWith('/3')).filename,'guide.pdf');}
 finally{dom.window.close();}
});
test('Complete URL attributes preserve parentheses, apostrophes and signed query separators',()=>{
 const {dom,scan}=page(`<a href="/files/O'Brien (2026).pdf?token=one;two,three&amp;v=1">Roční přehled</a>`);
 try{const items=scan({deep:true}).items;assert.equal(items.length,1);assert.equal(items[0].url,"https://www.o2.cz/files/O'Brien%20(2026).pdf?token=one;two,three&v=1");assert.equal(items[0].title,'Roční přehled');}
 finally{dom.window.close();}
});
test('Table and aria labels enrich an earlier deduplicated discovery; page scripts stay unexecuted',()=>{
 const {dom,scan}=page(`<script type="application/json">{"pdf":"/one.pdf"}</script>
 <table><tr><td>Správný název</td><td><a href="/one.pdf">Stáhnout</a></td></tr></table>
 <a href="/two.pdf" aria-label="Stáhnout soubor Druhý dokument">Stáhnout</a>
 <button onclick="window.open('/three.pdf')">Třetí dokument</button>
 <script>throw new Error('must not run');</script>`);
 try{const items=scan({deep:true}).items;assert.equal(items.length,3);assert.equal(items.find(i=>i.url.endsWith('/one.pdf')).title,'Správný název');assert.equal(items.find(i=>i.url.endsWith('/two.pdf')).title,'Druhý dokument');}
 finally{dom.window.close();}
});
test('A meaningful link name wins over unrelated date cells in its row',()=>{
 const {dom,scan}=page('<table><tr><td>18. 9. 2026</td><td><a href="/terms.pdf">Obchodní podmínky</a></td></tr></table>');
 try{assert.equal(scan({deep:true}).items[0].title,'Obchodní podmínky');}finally{dom.window.close();}
});
test('the current O2 listing page is excluded even when its navigation label mentions documents',()=>{
 const {dom,scan}=page('<a href="/osobni/ceniky-a-dokumenty">Ceníky a dokumenty PDF</a><a href="/osobni/ceniky-a-dokumenty#ceniky">Stáhnout dokumenty</a><a href="/actual.pdf">Stáhnout PDF</a>');
 try{assert.deepEqual(scan({deep:true}).items.map(item=>item.url),['https://www.o2.cz/actual.pdf']);}finally{dom.window.close();}
});
