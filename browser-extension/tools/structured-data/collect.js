/** Serialized into the inspected tab; deliberately has no module dependencies. */
export function collectStructuredData() {
  const documents=[],cards=[], roots=[document];let total=0,truncated=false;
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  const parentOf = node => node.assignedSlot || node.parentElement || node.getRootNode?.().host;
  const hasLayout = document.documentElement.getClientRects().length > 0;
  function visible(e){
    let branch=e;
    for(let n=e;n;n=n.parentElement || n.getRootNode?.().host){
      if(n.hidden||n.getAttribute('aria-hidden')==='true')return false;
      if(n.tagName==='DETAILS'&&!n.open&&n!==e){const summary=[...n.children].find(child=>child.tagName==='SUMMARY');if(branch!==summary)return false;}
      const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse'||s.contentVisibility==='hidden'||s.opacity==='0')return false;
      branch=n;
    }
    // Layout-less DOMs cannot supply rectangles. In a browser, require an actual
    // rendered box, without restricting it to the viewport (below-fold is valid).
    if(hasLayout&&!e.getClientRects().length&&getComputedStyle(e).display!=='contents')return false;
    if(hasLayout&&getComputedStyle(e).display!=='contents'){
      const rect=e.getBoundingClientRect();let left=rect.left,right=rect.right,top=rect.top,bottom=rect.bottom;
      let escapesClip=false,containingBlock;
      for(let child=e,parent=parentOf(e);parent;child=parent,parent=parentOf(parent)){
        if(!escapesClip&&/^(absolute|fixed)$/.test(getComputedStyle(child).position)&&'offsetParent' in child){containingBlock=child.offsetParent;escapesClip=true;}
        if(escapesClip){if(parent!==containingBlock)continue;escapesClip=false;}
        if(parent===document.documentElement||parent===document.body)continue;
        const css=getComputedStyle(parent),box=parent.getBoundingClientRect();
        if(css.display==='inline'||!parent.getClientRects().length)continue;
        const scaleX=parent.offsetWidth?box.width/parent.offsetWidth:1,scaleY=parent.offsetHeight?box.height/parent.offsetHeight:1;
        if(/^(hidden|clip)$/.test(css.overflowX||css.overflow)){const edge=box.left+parent.clientLeft*scaleX;left=Math.max(left,edge);right=Math.min(right,edge+parent.clientWidth*scaleX);}
        if(/^(hidden|clip)$/.test(css.overflowY||css.overflow)){const edge=box.top+parent.clientTop*scaleY;top=Math.max(top,edge);bottom=Math.min(bottom,edge+parent.clientHeight*scaleY);}
        if(right<=left||bottom<=top)return false;
      }
    }
    return true;
  }
  function struck(e){for(let n=e;n;n=n.parentElement || n.getRootNode?.().host){const style=getComputedStyle(n);if(n.matches('s,del,[class*="old-price"]')||/line-through/.test(style.textDecorationLine+' '+style.textDecoration))return true;}return false;}

  function text(e){if(!e||!visible(e))return '';let out='';for(const n of e.childNodes){if(n.nodeType===3)out+=n.textContent+' ';else if(n.nodeType===1&&!/^(SCRIPT|STYLE|SVG|NOSCRIPT)$/.test(n.tagName))out+=text(n)+' ';}return clean(out);}
  for(let ri=0;ri<roots.length;ri++){
    const root=roots[ri]; for(const e of root.querySelectorAll('*'))if(e.shadowRoot&&visible(e))roots.push(e.shadowRoot);
    for(const s of root.querySelectorAll('script[type="application/ld+json"]')){const original=s.textContent||'';const raw=original.slice(0,Math.max(0,Math.min(1048576,2097152-total)));total+=raw.length; const clipped=raw.length<original.length;truncated ||=clipped;documents.push({raw,truncated:clipped});if(total>=2097152)break;}
    const selector='.d3-tariff,[itemscope][itemtype*="Product"],[data-product-card],[data-product],article';
    for(const e of root.querySelectorAll(selector)){
      if(!visible(e)||e.parentElement?.closest(selector))continue;if(cards.length>=300){truncated=true;break;}
      const title=e.querySelector('.d3-tariff__title,[itemprop="name"],h1,h2,h3,h4');
      const titles=[text(title)]; if(title?.parentElement)for(const sibling of title.parentElement.children){const t=text(sibling);if(sibling!==title&&t&&t.length<100&&!/Kč|CZK/.test(t))titles.push(t);}
      const prices=[];const zones=[...e.querySelectorAll('.d3-tariff__price-comparison__box,.d3-tariff__price,.d3-tariff__price-block,[itemprop="price"],.price,[data-price]')];
      for(const zone of zones){if(zones.some(other=>other!==zone&&other.contains(zone)))continue;const evidence=text(zone);const leaves=[...zone.querySelectorAll('*')].filter(n=>!n.children.length&&visible(n));if(!leaves.length)leaves.push(zone);
        const hasOld=leaves.some(leaf=>struck(leaf)&&text(leaf));
        for(const leaf of leaves){const raw=text(leaf)||leaf.getAttribute('content')||'';const matches=[...raw.matchAll(/(\d[\d\s]*(?:[.,]\d{1,2})?)\s*(Kč|CZK|EUR|€|USD|\$)/g)];if(!matches.length&&leaf.getAttribute('itemprop')==='price'&&/^\d+(?:[.,]\d+)?$/.test(raw))matches.push([raw,raw,'']);
          for(const m of matches){const isOld=struck(leaf); const role=isOld?'old':/spolu/i.test(evidence)?'spolu':/samostatně|běžná/i.test(evidence)?'regular':hasOld?'promo':'current';prices.push({value:Number(m[1].replace(/\s/g,'').replace(',','.')),currency:/Kč|CZK/.test(m[2])?'CZK':/EUR|€/.test(m[2])?'EUR':/USD|\$/.test(m[2])?'USD':'',role,evidence,period:/30\s*dn/i.test(evidence)?'30 dní':/měs|month/i.test(evidence)?'měsíc':''});}
        }
      }
      const properties=[...e.querySelectorAll('[itemprop]')].filter(visible).map(n=>({name:n.getAttribute('itemprop'),value:n.getAttribute('content')||text(n)}));
      const full=text(e);if(full.length>20000)truncated=true;cards.push({title:titles[0],titles:titles.filter(Boolean),text:full.slice(0,20000),prices,properties,source:e.matches('.d3-tariff')?'O2 tarif':'Obecná produktová karta'});
    }
  }
  return {url:location.href,documents,cards,truncated,microdata:roots.some(r=>r.querySelector('[itemscope][itemtype*="Product"]'))?'Mikrodata karet zachycena; úplné vztahy mikrodat nejsou automaticky ověřeny.':''};
}
