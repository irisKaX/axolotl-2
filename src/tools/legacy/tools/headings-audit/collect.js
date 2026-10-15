export function collectHeadings() {
  const headings=[],ariaHeadings=[],cap=5000;let visited=0,truncated=false;
  function hidden(el){const s=getComputedStyle(el);if(el.hidden||s.display==='none'||s.contentVisibility==='hidden'||(s.opacity!==''&&Number(s.opacity)===0))return true;
    const clip=s.clip?.replace(/\s/g,'');if(clip&&clip!=='auto'&&/^rect\(0(px)?,0(px)?,0(px)?,0(px)?\)$/.test(clip))return true;
    if(s.clipPath&&s.clipPath!=='none'&&/inset\(50%/.test(s.clipPath))return true;
    if(parseFloat(s.width)<=1&&parseFloat(s.height)<=1&&s.overflow==='hidden')return true;return false;}
  const parentOf=node=>node.assignedSlot||node.parentElement||node.getRootNode()?.host;
  function rendered(el){
    const style=getComputedStyle(el);
    if(style.visibility==='hidden'||style.visibility==='collapse')return false;
    if(!Array.from(el.getClientRects()).some(r=>r.width>0&&r.height>0))return false;
    const rect=el.getBoundingClientRect();let left=rect.left,right=rect.right,top=rect.top,bottom=rect.bottom;
    let escapesClip=false,containingBlock;
    for(let child=el,parent=parentOf(el);parent;child=parent,parent=parentOf(parent)){
      if(!escapesClip&&/^(absolute|fixed)$/.test(getComputedStyle(child).position)&&'offsetParent' in child){containingBlock=child.offsetParent;escapesClip=true;}
      if(escapesClip){if(parent!==containingBlock)continue;escapesClip=false;}
      if(parent===document.body||parent===document.documentElement)continue;
      const css=getComputedStyle(parent);if(css.display==='inline'||!parent.getClientRects().length)continue;
      const clipX=/^(hidden|clip)$/.test(css.overflowX||css.overflow),clipY=/^(hidden|clip)$/.test(css.overflowY||css.overflow);
      if(!clipX&&!clipY)continue;
      const box=parent.getBoundingClientRect(),scaleX=parent.offsetWidth?box.width/parent.offsetWidth:1,scaleY=parent.offsetHeight?box.height/parent.offsetHeight:1;
      if(clipX){const edge=box.left+parent.clientLeft*scaleX;left=Math.max(left,edge);right=Math.min(right,edge+parent.clientWidth*scaleX);}
      if(clipY){const edge=box.top+parent.clientTop*scaleY;top=Math.max(top,edge);bottom=Math.min(bottom,edge+parent.clientHeight*scaleY);}
      if(right<=left||bottom<=top)return false;
    }
    return true;
  }
  function text(el){function read(node){if(node.nodeType===3){const visibility=getComputedStyle(node.parentElement).visibility;return visibility==='hidden'||visibility==='collapse'?'':node.textContent;}if(node.nodeType!==1)return '';if(hidden(node))return '';return Array.from(node.childNodes,read).join('');}return Array.from(el.childNodes,read).join('').replace(/\s+/g,' ').trim();}
  function walk(el){if(++visited>100000){truncated=true;return;}if(hidden(el))return;
    const level=/^H[1-6]$/.test(el.tagName)?Number(el.tagName[1]):null;
    const visible=(level||el.getAttribute('role')?.split(/\s+/).includes('heading'))&&rendered(el);
    if(level&&visible){if(headings.length<cap)headings.push({level,text:text(el),ariaHidden:el.getAttribute('aria-hidden')==='true'});else truncated=true;}
    if(el.getAttribute('role')?.split(/\s+/).includes('heading')&&visible){if(ariaHeadings.length<cap)ariaHeadings.push({level:el.getAttribute('aria-level'),text:text(el)});else truncated=true;}
    const assigned=el.tagName==='SLOT'?el.assignedElements({flatten:true}):[];
    const children=assigned.length?assigned:el.shadowRoot?Array.from(el.shadowRoot.children):Array.from(el.children);
    for(const child of children){if(el.tagName==='DETAILS'&&!el.open&&child.tagName!=='SUMMARY')continue;walk(child);if(visited>100000)break;}
  }
  if(document.body)walk(document.body);return {url:location.href,headings,ariaHeadings,truncated};
}
