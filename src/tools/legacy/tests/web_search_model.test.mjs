import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {collectSearchPage} from '../tools/web-search/collect.js';
import {searchSnapshot,validateOptions} from '../tools/web-search/model.js';
const url='https://www.o2.cz/osobni/oneplay';
function scan(html,live=false){const w=new JSDOM(live?html:'',{url,runScripts:'outside-only'}).window;const value=w.eval('('+collectSearchPage.toString()+')')(live?{}:{html,url});w.close();return value;}
const search=(html,query,rest={})=>searchSnapshot(scan(html),validateOptions({query,...rest}));
test('literal phrase crosses inline nodes, normalizes NBSP and excludes script/style/template/hidden content',()=>{
 const r=search('<p>One<b>play</b>&nbsp; Extra <em>Sport</em></p><script>Oneplay Extra Sport</script><style>Oneplay Extra Sport</style><template>Oneplay Extra Sport</template><p hidden>Oneplay Extra Sport</p>','oneplay extra sport');
 assert.equal(r.count,1);assert.match(r.matches[0].excerpt,/Oneplay Extra Sport/);
});
test('Czech accents and case can be controlled independently, regex characters stay literal',()=>{
 const html='<p>Příliš žluťoučký KŮŇ. Cena (199 Kč).</p>';
 assert.equal(search(html,'prilis').count,0);assert.equal(search(html,'prilis',{ignoreDiacritics:true}).count,1);
 assert.equal(search(html,'kůň',{caseSensitive:true}).count,0);assert.equal(search(html,'kůň').count,1);
 assert.equal(search(html,'(199 Kč)').count,1);
});
test('assets match full tokens including encoded IDs and explicit attributes, not longer IDs or scripts',()=>{
 const r=search('<a href="/docs/a452399/file.pdf">Ceník</a><img src="/a4523999.webp"><img data-asset="A452399"><a href="/docs/%61452399/x">Encoded</a><p>a452399</p><script>var unused="a452399"</script>','a452399',{kind:'asset'});
 assert.equal(r.count,3);assert.ok(r.matches.every(x=>x.attribute));
 assert.equal(search('<a href="/a123/x"></a><img src="/a456.png">','a123, a456',{kind:'asset'}).count,2);
});
test('asset references inside hidden content remain distinguishable from visible phrase content',()=>{
 const s=scan('<div style="display:none"><a href="/a123/x">Secret phrase</a></div>',true);
 assert.equal(searchSnapshot(s,validateOptions({query:'Secret phrase'})).count,0);
 assert.equal(searchSnapshot(s,validateOptions({query:'a123',kind:'asset'})).count,1);
});
test('invalid input is rejected before scanning, excerpts are bounded and source title retained',()=>{
 assert.throws(()=>validateOptions({query:' '}));assert.throws(()=>validateOptions({query:'123',kind:'asset'}));
 const s=scan('<title>Tarify</title><p>'+('Oneplay '.repeat(300))+'</p>');const r=searchSnapshot(s,validateOptions({query:'Oneplay'}));
 assert.equal(r.count,300);assert.equal(r.title,'Tarify');assert.equal(r.matches.length,8);assert.ok(r.matches.every(m=>m.excerpt.length<=240));
});
test('page collector includes open shadow text and does not duplicate slotted text',()=>{
 const w=new JSDOM('<div id="host"><p>Slotted text</p></div>',{url,runScripts:'outside-only'}).window;
 w.document.querySelector('#host').attachShadow({mode:'open'}).innerHTML='<span>Shadow phrase</span><slot></slot>';
 const s=w.eval('('+collectSearchPage.toString()+')')();assert.match(s.text,/Shadow phrase/);assert.equal((s.text.match(/Slotted text/g)||[]).length,1);w.close();
});

test('SVG scripts and styles are not visible phrase evidence',()=>{
 const s=scan('<svg><script>secret phrase</script><style>secret phrase</style></svg><p>Actual text</p>');
 assert.equal(searchSnapshot(s,validateOptions({query:'secret phrase'})).count,0);
});
test('HTML base URL controls links and asset references without changing result page URL',()=>{
 const html='<base href="https://cdn.example.test/assets/"><a href="next">Next</a><img src="photo.jpg">';
 for(const live of [false,true]){
  const view=new JSDOM(live?html:'',{url:'https://www.o2.cz/a123/start',runScripts:'outside-only'}).window;
  const s=view.eval('('+collectSearchPage.toString()+')')(live?{}:{html,url:'https://www.o2.cz/a123/start'});
  assert.equal(s.url,'https://www.o2.cz/a123/start');assert.deepEqual(Array.from(s.links),['https://cdn.example.test/assets/next']);
  assert.equal(searchSnapshot(s,validateOptions({kind:'asset',query:'a123'})).count,0);view.close();
 }
});
test('srcset data payloads and URL commas cannot be reinterpreted as relative asset URLs',()=>{
 const s={url:'https://example.test/start',references:[{attribute:'srcset',tag:'img',value:'data:image/png;base64,a123 1x, /img/a456.webp 2x'}]};
 assert.equal(searchSnapshot(s,validateOptions({query:'a123',kind:'asset'})).count,0);
 assert.equal(searchSnapshot(s,validateOptions({query:'a456',kind:'asset'})).count,1);
});
