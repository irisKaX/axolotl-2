import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const source=readFileSync(new URL('../tools/screenshot/selection.js',import.meta.url),'utf8');
function setup(){
  const dom=new JSDOM('<main><div id="wrapper"><article id="article"><h2>Article</h2></article></div></main>',{runScripts:'outside-only'});
  const {window:w}=dom,events=[];
  w.Element.prototype.getBoundingClientRect=()=>({left:10,top:20,width:420,height:180,right:430,bottom:200});
  const api=w.__O2Tools={randomToken:()=> 'selection-1',emit:(type,session,data)=>events.push({type,session,data}),
    ui:()=>{const host=w.document.createElement('div');host.dataset.o2ToolsUi='picker';w.document.body.append(host);return {host,root:host.attachShadow({mode:'open'})};},
    button:(label,fn)=>{const b=w.document.createElement('button');b.textContent=label;b.addEventListener('click',fn);return b;}};
  w.eval(source);
  const el=id=>w.document.getElementById(id),fire=(target,type,options={})=>target.dispatchEvent(new w.MouseEvent(type,{bubbles:true,composed:true,cancelable:true,...options}));
  return {api,events,w,el,fire,close:()=>w.close(),button:label=>[...w.document.querySelector('[data-o2-tools-ui]').shadowRoot.querySelectorAll('button')].find(b=>b.textContent.includes(label))};
}
test('nested article can be selected directly from Elements without choosing its div wrapper',()=>{
  const s=setup();try{const result=s.api.selectElement(s.el('article'));assert.equal(result.tag,'article');assert.equal(s.api.selectedElement.el,s.el('article'));assert.equal(result.selectionId,'selection-1');}finally{s.close();}
});
test('selection rejects detached, hidden and foreign-document nodes',()=>{
  const s=setup();try{
    assert.throws(()=>s.api.selectElement(s.w.document.createElement('article')),/dostupný/);
    const article=s.el('article');article.getBoundingClientRect=()=>({width:0,height:0});
    assert.throws(()=>s.api.selectElement(article),/plochu/);
    const other=new JSDOM('<article></article>');try{assert.throws(()=>s.api.selectElement(other.window.document.querySelector('article')),/rám|strán|dokument/);}finally{other.window.close();}
  }finally{s.close();}
});
test('click freezes selection; arrow down enters article, Enter captures the exact nested node',()=>{
  const s=setup();try{
    s.api.pickStart({mode:'element',session:'A'});s.fire(s.el('wrapper'),'pointermove');s.fire(s.el('wrapper'),'click');
    assert.equal(s.events.length,0,'Do not capture before the user can refine the selection');
    s.w.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
    s.fire(s.el('wrapper'),'pointermove'); // A locked selection must survive incidental pointer movement.
    s.w.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
    assert.equal(s.api.selectedElement.el,s.el('article'));assert.equal(s.events[0].type,'PICK_RESULT');assert.equal(s.events[0].data.tag,'article');
    assert.equal(s.w.document.querySelector('[data-o2-tools-ui]'),null);
  }finally{s.close();}
});
test('parent navigation selects an article when the pointer hits its heading',()=>{
  const s=setup();try{s.api.pickStart({mode:'element',session:'A'});s.fire(s.el('article').firstElementChild,'click');
    s.w.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true,cancelable:true}));s.button('Pořídit snímek').click();
    assert.equal(s.api.selectedElement.el,s.el('article'));
  }finally{s.close();}
});
test('foreign cancellation is ignored, Escape cancels, and color mode stays removed',()=>{
  const s=setup();try{assert.equal(s.api.readColor,undefined);assert.throws(()=>s.api.pickStart({mode:'color',session:'A'}),/režim/);
    s.api.pickStart({mode:'element',session:'B'});s.api.pickCancel(false,'A');assert.ok(s.w.document.querySelector('[data-o2-tools-ui]'));
    s.w.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(s.events[0].type,'PICK_CANCEL');assert.equal(s.events[0].session,'B');
    assert.equal(s.w.document.querySelector('[data-o2-tools-ui]'),null);
  }finally{s.close();}
});
test('hierarchy starts collapsed and keeps the full path, including distant ancestors',()=>{
  const s=setup();try{
    const article=s.el('article');
    for(let i=0;i<8;i++){const wrapper=s.w.document.createElement('section');article.replaceWith(wrapper);wrapper.append(article);}
    s.api.pickStart({mode:'element',session:'A'});s.fire(article,'click');
    const root=s.w.document.querySelector('[data-o2-tools-ui]').shadowRoot;
    assert.equal(root.querySelector('details').open,false);
    assert.equal(root.querySelector('.tag').textContent,'<article>');
    assert.equal(root.querySelector('.selection-name').textContent,'#article');
    const path=[...root.querySelectorAll('.path button')];
    assert.equal(path.length,13);assert.equal(path[0].textContent,'html');
    path.find(b=>b.textContent==='div#wrapper').click();
    assert.equal(root.querySelector('.selection-name').textContent,'#wrapper');
    assert.equal(root.activeElement,root.querySelector('[aria-current=true]'));
  }finally{s.close();}
});
test('choosing another element clears the previous selection and disables capture until a new target',()=>{
  const s=setup();try{
    s.api.pickStart({mode:'element',session:'A'});s.fire(s.el('article'),'click');s.button('Vybrat jiný').click();
    const root=s.w.document.querySelector('[data-o2-tools-ui]').shadowRoot;
    assert.equal(s.button('Pořídit snímek').disabled,true);assert.equal(root.querySelector('.outline').hidden,true);
    s.w.dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));assert.equal(s.events.length,0);
    s.fire(s.el('wrapper'),'click');s.button('Pořídit snímek').click();assert.equal(s.api.selectedElement.el,s.el('wrapper'));
  }finally{s.close();}
});
test('child menu uses the displayed elements even if a page inserts a sibling before selection',()=>{
  const s=setup();try{
    s.api.pickStart({mode:'element',session:'A'});s.fire(s.el('wrapper'),'click');
    const root=s.w.document.querySelector('[data-o2-tools-ui]').shadowRoot,menu=root.querySelector('select');
    const sibling=s.w.document.createElement('aside');s.el('wrapper').prepend(sibling);
    menu.value='0';menu.dispatchEvent(new s.w.Event('change'));s.button('Pořídit snímek').click();
    assert.equal(s.api.selectedElement.el,s.el('article'));
  }finally{s.close();}
});
test('keyboard navigation works within the picker without taking over native controls; Escape restores focus',()=>{
  const s=setup();try{
    const previous=s.w.document.createElement('button');s.w.document.body.append(previous);previous.focus();
    s.api.pickStart({mode:'element',session:'A'});
    assert.equal(s.w.document.activeElement,previous,'Starting selection must not dismiss page content that depends on focus');
    s.fire(s.el('wrapper'),'click');
    const host=s.w.document.querySelector('[data-o2-tools-ui]'),root=host.shadowRoot;
    const key=(node,key)=>{const e=new s.w.KeyboardEvent('keydown',{key,bubbles:true,composed:true,cancelable:true});node.dispatchEvent(e);return e;};
    assert.equal(key(root.querySelector('summary'),'Enter').defaultPrevented,false);assert.equal(s.events.length,0);
    assert.equal(key(root.querySelector('select'),'ArrowDown').defaultPrevented,false);
    key(root.querySelector('.bar'),'ArrowDown');assert.equal(root.querySelector('.selection-name').textContent,'#article');
    s.button('Pořídit snímek').focus();key(s.button('Pořídit snímek'),'Escape');
    assert.equal(s.events[0].type,'PICK_CANCEL');assert.equal(s.w.document.activeElement,previous);
  }finally{s.close();}
});
