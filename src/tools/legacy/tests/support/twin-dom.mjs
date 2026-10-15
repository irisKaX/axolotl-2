// Deterministic DOM/geometry boundary. No CSS engine, image decoding or native
// browser behavior is simulated or claimed. Production collector/UI run intact.
export function installTwinDOM(){
  const names=['document','window','location','CSS','CSSStyleSheet','MutationObserver','getComputedStyle','innerWidth','innerHeight','scrollX','scrollY','chrome','requestAnimationFrame','cancelAnimationFrame'];
  const previous=Object.fromEntries(names.map(name=>[name,globalThis[name]])),listeners=[],observers=[],closedRoots=[],created=[];
  const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  class Node extends EventTarget{
    // Node's EventTarget does not match boolean capture=true during removal;
    // normalize to the equivalent options object used by browser DOM APIs.
    addEventListener(type,listener,options){return super.addEventListener(type,listener,typeof options==='boolean'?{capture:options}:options);}
    removeEventListener(type,listener,options){return super.removeEventListener(type,listener,typeof options==='boolean'?{capture:options}:options);}
    constructor(tag='',type=1,text=''){
      super();this.localName=tag;this.tagName=tag.toUpperCase();this.nodeType=type;this.data=text;this._attrs=new Map();this.childNodes=[];this.parentNode=null;this.style={};this.css={};this.dataset={};this.hidden=false;this.disabled=false;this.value='';this.tabIndex=-1;this.rect={left:20,top:180,right:420,bottom:220,width:400,height:40};this.clientWidth=400;this.clientHeight=40;this.clientLeft=0;this.clientTop=0;this.loading='';this.complete=true;this.naturalWidth=600;this.naturalHeight=400;
      this.classList={add:(...v)=>this.className=[...new Set([...this.className.split(' ').filter(Boolean),...v])].join(' '),remove:(...v)=>this.className=this.className.split(' ').filter(n=>!v.includes(n)).join(' '),contains:v=>this.className.split(' ').includes(v),toggle:(v,on)=>{on??=!this.classList.contains(v);if(on)this.classList.add(v);else this.classList.remove(v);return on;}};created.push(this);
    }
    get attributes(){return [...this._attrs].map(([name,value])=>({name,value}));}get id(){return this.getAttribute('id')||'';}set id(v){this.setAttribute('id',v);}get className(){return this.getAttribute('class')||'';}set className(v){this.setAttribute('class',v);}
    get children(){return this.childNodes.filter(n=>n.nodeType===1);}get parentElement(){return this.parentNode?.nodeType===1?this.parentNode:null;}get isConnected(){return this.nodeType===9||!!this.parentNode?.isConnected||!!this.host?.isConnected;}get length(){return this.data.length;}
    get src(){try{return this.hasAttribute('src')?new URL(this.getAttribute('src'),document.baseURI).href:'';}catch{return '';}}set src(value){this.setAttribute('src',value);}get currentSrc(){return this.getAttribute('src')?this.src:'';}get alt(){return this.getAttribute('alt')||'';}set alt(value){this.setAttribute('alt',value);}
    get textContent(){return this.nodeType===3||this.nodeType===8?this.data:this.childNodes.map(n=>n.textContent).join('');}set textContent(value){if(this.nodeType===3)this.data=String(value);else{this.replaceChildren();if(value!==''&&value!=null)this.append(new Node('',3,String(value)));}}
    setAttribute(k,v){this._attrs.set(k,String(v));}getAttribute(k){return this._attrs.get(k)??null;}hasAttribute(k){return this._attrs.has(k);}removeAttribute(k){this._attrs.delete(k);}
    append(...nodes){for(let node of nodes){if(typeof node==='string')node=new Node('',3,node);node.remove();this.childNodes.push(node);node.parentNode=this;}}
    replaceChildren(...nodes){for(const node of this.childNodes)node.parentNode=null;this.childNodes=[];this.append(...nodes);}remove(){if(this.parentNode){const list=this.parentNode.childNodes;list.splice(list.indexOf(this),1);this.parentNode=null;}}
    getRootNode(){return this.parentNode?this.parentNode.getRootNode():this;}
    contains(node){return this===node||this.childNodes.some(n=>n.contains(node));}
    attachShadow({mode}){const root=new Node('',11);root.host=this;root.mode=mode;this._shadow=root;if(mode==='closed')closedRoots.push(root);return root;}get shadowRoot(){return this._shadow?.mode==='open'?this._shadow:null;}
    matches(selector){return selector.split(',').some(part=>{
      part=part.trim();if(part==='*')return this.nodeType===1;if(part.startsWith('#'))return this.id===part.slice(1);if(part.startsWith('.'))return this.classList.contains(part.slice(1));
      const m=part.match(/^([a-z0-9-]+)?(?:\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\])?$/i);if(!m)return false;
      return (!m[1]||this.localName===m[1].toLowerCase())&&(!m[2]||(m[3]===undefined?this.hasAttribute(m[2]):this.getAttribute(m[2])===m[3]));
    });}
    querySelectorAll(selector){const out=[];const visit=node=>{for(const child of node.childNodes){if(child.nodeType===1&&child.matches(selector))out.push(child);visit(child);}};visit(this);return out;}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}getElementById(value){return this.querySelectorAll('*').find(n=>n.id===value)||null;}
    closest(selector){for(let n=this;n?.nodeType===1;n=n.parentElement)if(n.matches(selector))return n;return null;}
    getBoundingClientRect(){return this.rect;}getClientRects(){return this.css.display==='none'?[]:[this.rect];}
    scrollIntoView(){this.scrolled=true;}focus(){document.activeElement=this;}
    click(){this.dispatchEvent(new Event('click',{cancelable:true}));}
    cloneNode(deep=false){const next=new Node(this.localName,this.nodeType,this.data);for(const [k,v] of this._attrs)next.setAttribute(k,v);if(deep)for(const child of this.childNodes)next.append(child.cloneNode(true));return next;}
    get innerHTML(){return this.childNodes.map(n=>n.outerHTML).join('');}get outerHTML(){if(this.nodeType===3)return esc(this.data);return '<'+this.localName+[...this._attrs].map(([k,v])=>' '+k+'="'+esc(v)+'"').join('')+'>'+this.innerHTML+'</'+this.localName+'>';}
  }
  const document=new Node('',9);document.documentElement=new Node('html');document.append(document.documentElement);document.head=new Node('head');document.body=new Node('body');document.documentElement.append(document.head,document.body);document.title='Test';document.baseURI='https://site.test/page';document.activeElement=document.body;
  document.createElement=tag=>new Node(tag);document.createElementNS=(_,tag)=>new Node(tag);document.createTextNode=text=>new Node('',3,String(text));document.createDocumentFragment=()=>new Node('',11);document.getElementsByName=name=>document.querySelectorAll('*').filter(n=>n.getAttribute('name')===name);
  document.createRange=()=>({setStart(node,offset){this.startContainer=node;this.startOffset=offset;},setEnd(node,offset){this.endContainer=node;this.endOffset=offset;},selectNodeContents(node){this.startContainer=node;this.endContainer=node;this.startOffset=0;this.endOffset=node.length;},toString(){return this.startContainer.data.slice(this.startOffset,this.endOffset);},getClientRects(){return [this.startContainer.parentElement.getBoundingClientRect()];},getBoundingClientRect(){return this.getClientRects()[0];}});
  globalThis.document=document;globalThis.window=new EventTarget();window.scrollBy=()=>{};
  globalThis.location=new URL(document.baseURI);globalThis.CSS={escape:value=>value};globalThis.CSSStyleSheet=class{replaceSync(value){this.text=value;}};
  globalThis.getComputedStyle=node=>({display:'block',visibility:'visible',opacity:'1',fontSize:'16px',color:'rgb(0,0,0)',textShadow:'none',backgroundClip:'border-box',overflowX:'visible',overflowY:'visible',position:'static',clip:'auto',clipPath:'none',...node.css});
  globalThis.MutationObserver=class{constructor(callback){this.callback=callback;this.active=false;this.roots=[];observers.push(this);}observe(root){this.active=true;this.roots.push(root);}disconnect(){this.active=false;this.roots=[];}};
  globalThis.innerWidth=1400;globalThis.innerHeight=900;globalThis.scrollX=globalThis.scrollY=0;
  globalThis.chrome={runtime:{id:'test',getURL:path=>'chrome-extension://test/'+path,onMessage:{addListener(fn){listeners.push(fn);},removeListener(fn){listeners.splice(listeners.indexOf(fn),1);}},sendMessage:async()=>({ok:true,data:{}})}};
  globalThis.requestAnimationFrame=fn=>setTimeout(fn,0);globalThis.cancelAnimationFrame=clearTimeout;
  return {document,closedRoots,created,listeners,observers,element(tag,text='',attrs={}){const node=document.createElement(tag);if(text)node.textContent=text;for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);return node;},restore(){globalThis.__O2WebOpsTwin?.stop();delete globalThis.__O2WebOpsTwin;Object.assign(globalThis,previous);}};
}
