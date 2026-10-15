const list=v=>v==null?[]:Array.isArray(v)?v:[v];
const norm=v=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const display=v=>typeof v==='object'?JSON.stringify(v):String(v??'');
const row=(field,schemaValue,visibleValue,status,evidence)=>({field,schemaValue:display(schemaValue),visibleValue:display(visibleValue),status,evidence});
const type=(v,t)=>list(v?.['@type']).some(x=>String(x).split(/[\/#]/).pop()===t);
export function analyzeStructuredData(snapshot={}){
 const documents=[],errors=[],nodes=[],ids=new Map();
 function walk(v,depth=0){if(!v||typeof v!=='object'||depth>100)return;if(Array.isArray(v)){v.forEach(x=>walk(x,depth+1));return;}nodes.push(v);if(v['@id']&&Object.keys(v).length>1)ids.set(v['@id'],v);Object.values(v).forEach(x=>walk(x,depth+1));}
 for(const [index,doc] of (snapshot.documents||[]).entries()){const d={...doc,index};try{d.parsed=JSON.parse(doc.raw);walk(d.parsed);}catch(e){d.error=String(e.message);errors.push({document:index+1,message:d.error});}documents.push(d);}
 const resolve=v=>v?.['@id']&&ids.has(v['@id'])?{...ids.get(v['@id']),...v}:v;
 const unique=values=>{const seen=new Set();return values.filter(v=>{const key=v['@id']||v;if(seen.has(key))return false;seen.add(key);return true;});};
 const groupNodes=unique(nodes.filter(v=>type(v,'ProductGroup')));const productNodes=unique(nodes.filter(v=>type(v,'Product')));
 for(const g of groupNodes)for(const ref of list(g.hasVariant)){const p=resolve(ref);if(p&&(!productNodes.some(x=>x===p||p['@id']&&p['@id']===x['@id']))&&p.name)productNodes.push(p);}
 const cards=snapshot.cards||[];
 const products=productNodes.map((p,index)=>{
  const group=groupNodes.find(g=>list(g.hasVariant).some(ref=>ref===p||ref['@id']&&ref['@id']===p['@id']))||resolve(p.isVariantOf);
  const name=norm(p.name);const matches=cards.filter(c=>c.titles.some(t=>{const n=norm(t);return n&&name&&(n===name||name==='oneplay '+n);}));const card=matches.length===1?matches[0]:null;
  const comparisons=[];const reason=card?'Jednoznačně spárovaná produktová karta.':matches.length?'Více karet stejného názvu; nelze bezpečně přiřadit.':'Produkt nebyl jednoznačně přiřazen k viditelné kartě.';
  comparisons.push(row('name',p.name,card?.titles.join(' / ')||'—',card?'good':'unverified',reason));
  const offers=[];function addOffer(ref,depth=0){if(depth>10)return;const o=resolve(ref);if(!o||typeof o!=='object')return;offers.push(o);if(type(o,'AggregateOffer'))list(o.offers).forEach(v=>addOffer(v,depth+1));}list(p.offers).forEach(v=>addOffer(v));
  offers.forEach((o,oi)=>{
   const specs=list(o.priceSpecification).map(resolve);const price=o.price??specs.find(s=>s?.price!=null)?.price;const currency=o.priceCurrency??specs.find(s=>s?.priceCurrency)?.priceCurrency;const on=norm(o.name);const role=/spolu/.test(on)?'spolu':/bezna|regular/.test(on)?'regular':/akcni|promo|discount/.test(on)?'promo':'current';
   const evidence=card?.prices.filter(v=>role==='regular'?(['regular','old'].includes(v.role)||(offers.length===1&&v.role==='current')):role==='current'?['current','promo','regular'].includes(v.role):v.role===role)||[];
   const candidates=[...new Map(evidence.map(v=>[v.value+'|'+v.currency+'|'+v.period,v])).values()];const match=candidates.length===1?candidates[0]:null;
   if(price!=null){const amount=Number(String(price).replace(/\s/g,'').replace(',','.'));comparisons.push(row(`offers[${oi}].price`,price,match?.value??'—',match&&Number.isFinite(amount)?(match.value===amount?'good':'error'):'unverified',match?`${role}: ${match.evidence}`:reason+' Cena stejné role není jednoznačná.'));}
   else comparisons.push(row(`offers[${oi}].price`,o.lowPrice!=null?`${o.lowPrice}–${o.highPrice??'?'}`:'—','—','unverified','Souhrnná nabídka nebo chybějící jednotlivá cena; rozsah není potvrzen.'));
   if(currency)comparisons.push(row(`offers[${oi}].priceCurrency`,currency,match?.currency||'—',match?.currency?(currency===match.currency?'good':'error'):'unverified','Měna stejného cenového bloku.'));
   const period=/30\s*dni/.test(on)?'30 dní':/mesic|month/.test(on)?'měsíc':null;if(period)comparisons.push(row(`offers[${oi}].period`,period,match?.period||'—',match?.period?(period===match.period?'good':'error'):'unverified','Perioda z názvu nabídky a stejného cenového bloku.'));
   if(o.validThrough){const expired=Number.isFinite(Date.parse(o.validThrough))&&Date.parse(o.validThrough+'T23:59:59Z')<Date.now();comparisons.push(row(`offers[${oi}].validThrough`,o.validThrough,'—',expired?'warning':'unverified',expired?'Datum platnosti nabídky již uplynulo.':'Datum je metadata, viditelná platnost nebyla ověřena.'));}
  });
  for(const prop of list(p.additionalProperty).map(resolve)){
   const key=norm(prop?.name);const value=display(prop?.value);let regex=null;
   if(/kanal/.test(key))regex=/(\d+)\s*(?:televiznich\s*)?kanal/g;
   else if(/dat/.test(key))regex=/(\d+(?:[.,]\d+)?)\s*gb/g;
   else if(/rychlost/.test(key))regex=/(\d+(?:[.,]\d+)?)\s*(?:mb\/s|mbps)/g;
   else if(/volani|minut/.test(key))regex=/(\d+)\s*minut/g;
   const plain=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   let status='unverified',visible='—',evidence='Metadata; význam textu se automaticky neověřuje.';
   if(regex&&card){const schema=[...plain(value).matchAll(regex)].map(m=>m[1]);const vals=[...new Set([...plain(card.text).matchAll(regex)].map(m=>m[1]))];visible=vals.join(', ')||'—';if(/dat/.test(key)&&/\d+\s*(?:gb\s*)?\+\s*\d+\s*gb/i.test(card.text)){status='warning';visible=card.titles.join(' / ');evidence='Propagační součet dat; základní a bonusový objem vyžaduje kontrolu.';}else if(schema.length===1&&vals.length===1){status=Number(schema[0].replace(',','.'))===Number(vals[0].replace(',','.'))?'good':'error';evidence='Číselný údaj se stejnou jednotkou v téže kartě.';}else evidence='Žádný nebo více různých srovnatelných údajů v téže kartě.';}
   comparisons.push(row(`additionalProperty: ${prop?.name||'bez názvu'}`,value,visible,status,evidence));
  }
  return {index,name:p.name||'Produkt bez názvu',groupName:group?.name||'Bez skupiny',raw:p,group,offers,card,matched:!!card,comparisons,issues:comparisons.filter(c=>c.status!=='good')};
 });
 return {url:snapshot.url,documents,errors,cards,groups:groupNodes,products,offerCount:products.reduce((n,p)=>n+p.offers.length,0),truncated:!!snapshot.truncated,microdata:snapshot.microdata,issueCount:products.reduce((n,p)=>n+p.issues.length,0)+errors.length};
}
