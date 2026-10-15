// Standalone so Chrome can serialize this collector into an isolated page world.
// HTML is parsed only inside template.content: no document insertion or resources.
export function collectSearchPage({html,url}={}) {
  const live=typeof html!=='string', sourceUrl=url||location.href;
  let root;
  if(live)root=document.documentElement;
  else {const template=document.createElement('template');template.innerHTML=html;root=template.content;}
  let baseUrl=live?document.baseURI:sourceUrl;
  if(!live){const base=root.querySelector('base[href]');if(base)try{baseUrl=new URL(base.getAttribute('href'),sourceUrl).href;}catch{}}
  const references=[],links=[],parts=[],components=[];
  const main={visible:[],text:[]};let visited=0,size=0,textSize=0,referenceSize=0,truncated=false;
  const seenLinks=new Set(),seenNodes=new Set(),componentOwners=new Map();
  const plain=s=>String(s||'').replace(/\s+/g,' ').trim();
  const append=(s,bucket=main)=>{if(size+s.length>1000000)truncated=true;if(size>=1000000)return;const part=s.slice(0,1000000-size);size+=part.length;parts.push(part);bucket.visible.push(part);};
  const appendText=(s,bucket)=>{if(textSize+s.length>1000000)truncated=true;if(textSize>=1000000)return;const part=s.slice(0,1000000-textSize);textSize+=part.length;bucket.text.push(part);};
  // Only site chrome is separated. Navigation and headers inside main/article
  // remain page content; a wrapper containing main can never swallow the page.
  const region=node=>{
    if(node.nodeType!==1)return null;
    const tag=node.tagName.toLowerCase(),role=node.getAttribute('role'),names=(node.id+' '+node.getAttribute('class')).toLowerCase();
    if(!['header','footer','nav'].includes(tag)&&!['banner','contentinfo','navigation'].includes(role)&&!/(?:^|\s)(?:(?:site|global)[-_](?:header|footer|nav)|mega[-_]?menu)(?:\s|$)/.test(names))return null;
    if(node.closest('main,article,[role="main"],template,noscript')||node.querySelector('main,[role="main"]'))return null;
    if(tag==='header'||role==='banner'||/(?:^|\s)(?:site|global)[-_]header(?:\s|$)/.test(names))return {kind:'header',label:'Hlavička a menu'};
    if(tag==='footer'||role==='contentinfo'||/(?:^|\s)(?:site|global)[-_]footer(?:\s|$)/.test(names))return {kind:'footer',label:'Patička webu'};
    if(tag==='nav'||role==='navigation'||/(?:^|\s)(?:mega[-_]?menu|global[-_]nav|site[-_]nav)(?:\s|$)/.test(names))return {kind:'navigation',label:'Společná navigace'};
    return null;
  };
  const hasAsset=value=>{if(/[aA]\d+/.test(value))return true;try{return /[aA]\d+/.test(decodeURIComponent(value));}catch{return false;}};
  const reference=(tag,attribute,value,label='',format='')=>{
    if(!value)return;
    if(references.length>=10000||referenceSize>=4000000){truncated=true;return;}
    const limit=Math.min(65536,4000000-referenceSize);
    if(value.length>limit)truncated=true;
    value=value.slice(0,limit);referenceSize+=value.length;
    references.push({tag:tag.toLowerCase(),attribute,value,label:plain(label).slice(0,150),...(format?{format}:{})});
  };
  const cssReferences=(tag,attribute,value,label='')=>{
    for(const match of value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi))reference(tag,attribute,match[2],label,'url');
  };
  const stack=[{node:root,hidden:false,visibility:'visible',bucket:main,textExcluded:false,local:false}];
  while(stack.length){
    let {node,hidden,separator,visibility:inheritedVisibility,bucket,textExcluded,local}=stack.pop();
    if(separator){if(!hidden)append('\n',bucket);if(!textExcluded)appendText('\n',bucket);continue;}
    if(++visited>100000){truncated=true;break;}
    if(seenNodes.has(node))continue;seenNodes.add(node);
    if(node.nodeType===3){if(bucket!==main)componentOwners.set(node,bucket);if(!hidden&&!['hidden','collapse'].includes(inheritedVisibility))append(node.textContent||'',bucket);if(!textExcluded)appendText(node.textContent||'',bucket);continue;}
    if(node.nodeType!==1&&node.nodeType!==11)continue;
    const tag=(node.tagName||'').toUpperCase();
    const component=bucket===main&&!local?region(node):null;
    if(component){append('\n',main);appendText('\n',main);bucket={...component,node,visible:[],text:[]};components.push(bucket);}
    if(bucket!==main)componentOwners.set(node,bucket);
    local=local||['MAIN','ARTICLE','TEMPLATE','NOSCRIPT'].includes(tag)||node.getAttribute?.('role')==='main';
    textExcluded=textExcluded||['HEAD','TITLE','SCRIPT','STYLE'].includes(tag);
    let invisible=hidden||['HEAD','TITLE','TEXTAREA','SELECT','SCRIPT','STYLE','TEMPLATE','NOSCRIPT'].includes(tag)||!!node.hidden;
    const css=node.nodeType===1?(live?getComputedStyle(node):node.style):null;
    const visibility=['visible','hidden','collapse'].includes(css?.visibility)?css.visibility:inheritedVisibility;
    if(css&&(css.display==='none'||css.contentVisibility==='hidden'||css.opacity==='0'))invisible=true;
    if(node.attributes)for(const attr of node.attributes){
      if(!attr.value||/^on/i.test(attr.name))continue;
      if(!/^(?:href|src|srcset|poster|data|style|data-[\w-]+|xlink:href)$/i.test(attr.name)&&!hasAsset(attr.value))continue;
      reference(tag,attr.name,attr.value,node.getAttribute('aria-label')||node.getAttribute('alt')||(tag==='META'?node.getAttribute('name')||node.getAttribute('property'):tag==='A'?node.textContent:''),tag==='META'&&node.getAttribute('name')==='lbxid'?'lbxid':'');
    }
    // Data blocks are references, never visible phrase text or executable code.
    if(tag==='SCRIPT'){
      if(/^(?:application\/(?:ld\+)?json|speculationrules)$/i.test(node.getAttribute('type')||'')){
        const content=node.textContent||'';
        if(content.length>2000000)truncated=true;
        else try{
          const pending=[{value:JSON.parse(content),path:'$'}];let entries=0;
          while(pending.length){
            if(++entries>100000){truncated=true;break;}
            const {value,path}=pending.pop();
            if(typeof value==='string'&&hasAsset(value))reference(tag,'JSON',value,path);
            else if(value&&typeof value==='object')for(const key of Object.keys(value))pending.push({value:value[key],path:(path+'.'+key).slice(0,150)});
          }
        }catch{/* Invalid JSON is not treated as executable JavaScript. */}
      }
      continue;
    }
    if(tag==='STYLE'){cssReferences(tag,'CSS url',node.textContent||'');continue;}
    if(live&&css&&!invisible)for(const property of ['backgroundImage','maskImage','listStyleImage','borderImageSource']){
      const value=css[property]||'';
      if(value.includes('url(')&&value!==node.style?.[property])cssReferences(tag,'CSS '+property,value);
    }
    const pageLink=tag==='A'||tag==='AREA'||tag==='LINK'&&/(?:^|\s)(?:next|prev)(?:\s|$)/i.test(node.getAttribute('rel')||'');
    if(pageLink&&node.hasAttribute('href'))try{const href=new URL(node.getAttribute('href'),baseUrl).href;if(!seenLinks.has(href)){seenLinks.add(href);if(links.length<10000)links.push(href);else truncated=true;}}catch{}
    const block=tag==='BR'||(css?.display?/^(?:block|flex|grid|flow-root|list-item|table(?:-row|-cell|-caption|-row-group)?)$/.test(css.display):/^(?:ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DIV|DL|DT|DD|FOOTER|FORM|H[1-6]|HEADER|HR|LI|MAIN|NAV|OL|P|PRE|SECTION|TABLE|TD|TH|TR|UL)$/.test(tag));
    if(block){if(!invisible)append('\n',bucket);if(!textExcluded)appendText('\n',bucket);stack.push({separator:true,bucket,hidden:invisible,textExcluded});}
    let children=Array.from(node.childNodes);
    if(tag==='TEMPLATE')children=Array.from(node.content?.childNodes||[]);
    if(tag==='NOSCRIPT'&&!node.children.length){const template=document.createElement('template');template.innerHTML=node.textContent||'';children=Array.from(template.content.childNodes);}
    if(live&&node.shadowRoot){
      // Inspect unassigned light-DOM references after the rendered tree. Slotted
      // nodes are visited in the shadow tree first, so their text is counted once.
      for(let i=children.length-1;i>=0;i--)stack.push({node:children[i],hidden:true,visibility,bucket,textExcluded,local});
      children=Array.from(node.shadowRoot.childNodes);
    }
    if(live&&tag==='SLOT'){const assigned=node.assignedNodes({flatten:true});if(assigned.length)children=assigned;}
    for(let i=children.length-1;i>=0;i--){const child=children[i];stack.push({node:child,visibility,bucket,textExcluded,local,hidden:invisible||(tag==='DETAILS'&&!node.open&&child.tagName!=='SUMMARY')});}
  }
  // Serialize bounded DOM tokens, including open shadow roots, without cloning a
  // potentially huge live document or inserting any resource-bearing elements.
  const componentNodes=new Set(components.map(c=>c.node)),voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  let markupSize=0,markupNodes=0;
  const serialize=(start,omitComponents)=>{
    const output=[],pending=[{node:start,raw:false}];
    const appendMarkup=value=>{const left=Math.max(0,2000000-markupSize);if(value.length>left)truncated=true;const part=value.slice(0,left);markupSize+=part.length;output.push(part);};
    const escape=value=>String(value).slice(0,Math.max(0,2000000-markupSize)+1).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    while(pending.length){
      if(markupSize>=2000000||markupNodes>=100000){truncated=true;break;}
      const entry=pending.pop(),node=entry.node;
      if(entry.token!==undefined){appendMarkup(entry.token);continue;}
      if(omitComponents&&(componentNodes.has(node)||componentOwners.has(node))){appendMarkup('\n');continue;}
      markupNodes++;
      if(node.nodeType===3){appendMarkup(entry.raw?node.textContent:escape(node.textContent));continue;}
      if(node.nodeType===8){appendMarkup('<!--'+String(node.textContent).slice(0,2000001-markupSize)+'-->');continue;}
      if(node.nodeType!==1&&node.nodeType!==11)continue;
      const tag=node.localName||'';
      if(tag){
        appendMarkup('<'+tag);
        for(const attr of node.attributes){if(markupSize>=2000000){truncated=true;break;}appendMarkup(' '+attr.name+'="'+escape(attr.value)+'"');}
        appendMarkup('>');if(voidTags.has(tag))continue;
        pending.push({token:'</'+tag+'>'});
      }
      if(live&&node.shadowRoot){pending.push({token:'</template>'});pending.push({node:node.shadowRoot,raw:false});pending.push({token:'<template shadowrootmode="open">'});}
      let children=(tag==='template'?node.content:node).childNodes;
      if(!omitComponents&&live&&tag==='slot'){const assigned=node.assignedNodes({flatten:true});if(assigned.length)children=assigned;}
      for(let i=children.length-1;i>=0;i--)pending.push({node:children[i],raw:tag==='script'||tag==='style'||tag==='noscript'});
    }
    return output.join('');
  };
  const phraseContent={visible:plain(main.visible.join('')),text:plain(main.text.join('')),html:serialize(root,true)};
  const fingerprint=value=>{let a=2166136261,b=5381;for(let i=0;i<value.length;i++){a=Math.imul(a^value.charCodeAt(i),16777619);b=Math.imul(b,33)^value.charCodeAt(i);}return (a>>>0).toString(36)+'-'+(b>>>0).toString(36);};
  const shared=components.map(({node,kind,label,visible,text})=>{
    const content=plain(text.join(''));
    const targets=[...node.querySelectorAll('a[href]')].map(a=>{const href=a.getAttribute('href');try{const target=new URL(href,baseUrl);return href.startsWith('#')&&new URL(baseUrl).origin+new URL(baseUrl).pathname===new URL(sourceUrl).origin+new URL(sourceUrl).pathname?target.hash:target.href;}catch{return href;}}).join('\n');
    return {id:kind+'-'+fingerprint(content+'\n'+targets),kind,label,visible:plain(visible.join('')),text:content,html:serialize(node,false)};
  });
  return {url:sourceUrl,baseUrl,title:plain(live?document.title:root.querySelector('title')?.textContent)||sourceUrl,text:plain(parts.join('')),phraseContent,components:shared,references,links,truncated,source:live?'live':'html'};
}
