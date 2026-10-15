// DOM identity/event adapter, not a browser or CSS/layout renderer.
import {installDOM,find} from './comparison-dom.mjs';
export function installWorkspaceDOM(){
  const previous={window:globalThis.window,chrome:globalThis.chrome,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
  const dom=installDOM(),baseCreate=document.createElement;
  const proto=Object.getPrototypeOf(dom.host());
  const text=Object.getOwnPropertyDescriptor(proto,'textContent');
  const created=[];
  const wrap=node=>{node.style.setProperty=function(key,value){this[key]=value;};node.dataset={};node.parentNode=null;node.ownerDocument=document;created.push(node);return node;};
  document.createElement=tag=>{const node=wrap(baseCreate(tag));if(tag==='template')node.content={firstElementChild:wrap(baseCreate('svg'))};return node;};
  document.createElementNS=(_,tag)=>document.createElement(tag);
  document.createTextNode=value=>{const node=document.createElement('#text');node.textContent=value;return node;};
  document.body=document.createElement('body');document.activeElement=document.body;
  Object.defineProperty(proto,'textContent',{set(value){for(const node of this.children)node.parentNode=null;text.set.call(this,value);},get:text.get});
  Object.defineProperty(proto,'lastChild',{get(){return this.children.at(-1)||null;}});
  Object.defineProperty(proto,'firstChild',{get(){return this.children[0]||null;}});
  Object.defineProperty(proto,'options',{get(){return this.children.filter(node=>node.tagName==='option');}});
  Object.defineProperty(proto,'selectedOptions',{get(){return [this.options.find(node=>node.value===this.value)||this.options[0]].filter(Boolean);}});
  proto.remove=function(){if(this.parentNode){const list=this.parentNode.children;list.splice(list.indexOf(this),1);this.parentNode=null;}};
  proto.append=function(...nodes){for(let node of nodes){if(typeof node==='string')node=document.createTextNode(node);node.remove();this.children.push(node);node.parentNode=this;}};
  proto.replaceChildren=function(...nodes){for(const child of [...this.children])child.remove();this._text='';this.append(...nodes);};
  proto.insertBefore=function(node,before){if(node===before)return;node.remove();const index=this.children.indexOf(before);if(index===-1)throw new Error('Reference node missing');this.children.splice(index,0,node);node.parentNode=this;};
  proto.contains=function(node){return node===this||this.children.some(child=>child.contains(node));};
  proto.focus=function(){document.activeElement=this;};
  proto.click=function(){if(!this.disabled)this.dispatchEvent(new Event('click',{cancelable:true}));};
  function match(node,selector){
    if(selector.startsWith('#'))return node.id===selector.slice(1);
    if(selector.startsWith('.'))return node.className.split(' ').includes(selector.slice(1));
    const attr=selector.match(/^\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\]$/);
    if(attr){const value=attr[1].startsWith('data-')?node.dataset[attr[1].slice(5)]:node.getAttribute(attr[1]);return attr[2]===undefined?value!=null:value===attr[2];}
    return node.tagName.toLowerCase()===selector.toLowerCase();
  }
  proto.querySelectorAll=function(selector){const results=[];function visit(node){for(const child of node.children){if(selector.split(',').some(s=>match(child,s.trim())))results.push(child);visit(child);}}visit(this);return results;};
  proto.querySelector=function(selector){return this.querySelectorAll(selector)[0]||null;};
  proto.getBoundingClientRect=function(){return this.rect||{left:0,right:1000,top:0,bottom:200,width:1000,height:200};};
  document.getElementById=id=>find(document.body,n=>n.id===id);
  document.querySelector=selector=>document.body.querySelector(selector);
  document.querySelectorAll=selector=>document.body.querySelectorAll(selector);
  const events=new EventTarget();document.addEventListener=events.addEventListener.bind(events);document.removeEventListener=events.removeEventListener.bind(events);
  const values={},storage={async get(key){return {[key]:values[key]};},async set(next){Object.assign(values,structuredClone(next));},async remove(key){delete values[key];}};
  globalThis.chrome={storage:{local:storage,session:storage},downloads:{onChanged:{addListener(){}}}};
  globalThis.window=new EventTarget();window.innerHeight=900;window.scrollBy=()=>{};
  document.defaultView=window;
  globalThis.requestAnimationFrame=fn=>setTimeout(fn,16);globalThis.cancelAnimationFrame=clearTimeout;
  return {...dom,created,storage,values,host(){const node=document.createElement('section');document.body.append(node);return node;},restore(){dom.restore();Object.assign(globalThis,previous);}};
}
