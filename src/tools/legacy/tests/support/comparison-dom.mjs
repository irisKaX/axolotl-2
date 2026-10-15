// Minimal DOM/API adapter for component lifecycle and interaction contracts.
// No browser rendering, image decoding or layout is claimed by these tests.
export function installDOM(){
  const previous={document:globalThis.document,ResizeObserver:globalThis.ResizeObserver};
  const urls=new Set(),create=URL.createObjectURL,revoke=URL.revokeObjectURL;
  URL.createObjectURL=blob=>{const url=create(blob);urls.add(url);return url;};
  URL.revokeObjectURL=url=>{urls.delete(url);revoke(url);};
  let hold=false;const waiting=[];
  class Node extends EventTarget{
    constructor(tag){
      super();this.tagName=tag;this.children=[];this.attributes=new Map();this.style={};this.hidden=false;this.disabled=false;
      this.clientWidth=1000;this.clientHeight=500;this.className='';this._text='';this.captured=null;
      this.classList={
        add:(...names)=>{this.className=[...new Set([...this.className.split(' ').filter(Boolean),...names])].join(' ');},
        remove:(...names)=>{this.className=this.className.split(' ').filter(n=>!names.includes(n)).join(' ');},
        toggle:(name,on)=>{if(on)this.classList.add(name);else this.classList.remove(name);}
      };
    }
    set textContent(value){this._text=String(value);this.children=[];}
    get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this._text='';this.children=[...nodes];}
    setAttribute(key,value){this.attributes.set(key,String(value));}
    getAttribute(key){return this.attributes.get(key)??null;}
    removeAttribute(key){this.attributes.delete(key);if(key==='src')this.src='';}
    focus(){}
    setPointerCapture(id){this.captured=id;}
    hasPointerCapture(id){return this.captured===id;}
    releasePointerCapture(){this.captured=null;}
    getBoundingClientRect(){return {left:100,width:this.clientWidth,top:0,height:this.clientHeight};}
    async decode(){
      // Ensure each displayed source really refers to a live image Blob.
      const bytes=await (await fetch(this.src)).arrayBuffer();if(!bytes.byteLength)throw new Error('Empty image');
      if(hold)await new Promise(resolve=>waiting.push(resolve));
      this.naturalWidth=32;this.naturalHeight=24;
    }
  }
  globalThis.document={createElement:tag=>new Node(tag)};
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  return {
    host:()=>new Node('section'),urls,
    holdDecodes(){hold=true;},finishDecodes(){hold=false;for(const resolve of waiting.splice(0))resolve();},
    get waiting(){return waiting.length;},
    restore(){for(const url of urls)revoke(url);URL.createObjectURL=create;URL.revokeObjectURL=revoke;Object.assign(globalThis,previous);}
  };
}
export function find(root,match){if(match(root))return root;for(const child of root.children){const result=find(child,match);if(result)return result;}return null;}
export const byId=(root,id)=>find(root,node=>node.id===id);
export const byClass=(root,name)=>find(root,node=>node.className.split(' ').includes(name));
export function emit(node,type,props={}){const event=new Event(type,{cancelable:true});Object.assign(event,props);node.dispatchEvent(event);return event;}
export async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setImmediate(resolve));}throw new Error('Timed out waiting for component state');}
