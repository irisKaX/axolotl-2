// Presentation only: comparisons and certainty remain owned by model.js.
export const statusLabels={good:'Shoda',error:'Neshoda',warning:'Upozornění',unverified:'Neověřeno'};
export const counted=(n,one,few,many)=>`${n} ${n===1?one:n>=2&&n<=4?few:many}`;
export function counts(comparisons=[]){return comparisons.reduce((s,c)=>{s[c.status]=(s[c.status]||0)+1;return s;},{good:0,error:0,warning:0,unverified:0});}
export function outcome(comparisons=[],hasProducts=true){
 const c=counts(comparisons);
 if(c.error)return {tone:'error',text:counted(c.error,'neshoda','neshody','neshod')+' k opravě'};
 if(c.warning)return {tone:'warning',text:counted(c.warning,'upozornění','upozornění','upozornění')};
 if(c.unverified)return {tone:'neutral',text:counted(c.unverified,'údaj','údaje','údajů')+' k ověření'};
 if(c.good)return {tone:'good',text:'Porovnané údaje se shodují'};
 return {tone:'neutral',text:hasProducts?'Bez porovnatelných údajů':'Bez produktových dat'};
}
const names={name:'Název produktu',description:'Popis',sku:'SKU',productID:'ID produktu',productGroupID:'ID skupiny',brand:'Značka',url:'URL',image:'Obrázek',category:'Kategorie',availability:'Dostupnost',price:'Cena',priceCurrency:'Měna',validThrough:'Platnost do',validFrom:'Platnost od',priceSpecification:'Cenové podmínky',additionalProperty:'Další vlastnosti',isVariantOf:'Skupina produktu',offers:'Nabídky','@type':'Typ','@id':'Identifikátor','@context':'Kontext'};
export const fieldName=name=>names[name]||name;
export function comparisonName(comparison,product){
 const field=comparison.field;
 if(field.startsWith('additionalProperty: '))return field.slice(20);
 const offer=field.match(/^offers\[(\d+)\]\.(.+)$/);
 if(offer){const o=product.offers[Number(offer[1])];const label=offer[2]==='period'?'Účtovací období':fieldName(offer[2]);return o?.name?`${label} · ${o.name}`:product.offers.length>1?`${label} · nabídka ${Number(offer[1])+1}`:label;}
 return fieldName(field);
}

export const displayValue=value=>typeof value==='object'?JSON.stringify(value):String(value??'');
export const hasValue=value=>value!=null&&(typeof value==='string'?value.trim().length>0:Array.isArray(value)?value.length>0:typeof value==='object'?Object.keys(value).length>0:true);
export function safeStructuredUrl(value,base){
 if(typeof value!=='string'||!value.trim())return null;
 try{const url=new URL(value,base);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function productOverview(product,base){
 const prices=product.offers.map((offer,index)=>{
  const comparison=product.comparisons.find(c=>c.field===`offers[${index}].price`);
  const currency=product.comparisons.find(c=>c.field===`offers[${index}].priceCurrency`)?.schemaValue||'';
  const value=comparison?.schemaValue||'—',plain=String(value).replace(/\s/g,'').replace(',','.');
  const amount=/^\d+(?:\.\d+)?$/.test(plain)?Number(plain):null;
  const [whole,fraction]=plain.split('.');
  const formatted=amount!=null?whole.replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0')+(fraction!==undefined?','+fraction:''):value;
  const name=displayValue(offer.name),productName=displayValue(product.name);
  const label=(productName&&name.startsWith(productName)?name.slice(productName.length).replace(/^\s*[–—\-:]?\s*/, ''):name)||`Nabídka ${index+1}`;
  return {label,value:formatted,amount,currency,unit:currency==='CZK'?'Kč':currency,status:comparison?.status||'unverified'};
 });
 const numeric=prices.filter(p=>p.amount!=null&&Number.isFinite(p.amount));
 let headline={value:'—',unit:'',label:'Cena neuvedena'};
 if(numeric.length===prices.length&&numeric.length){
  if(numeric.some(p=>!hasValue(p.currency))){headline={value:numeric.length===1?numeric[0].value:'Více cen',unit:'',label:numeric.length===1?'Měna neuvedena':'Měna není u všech nabídek'};}
  else if(new Set(numeric.map(p=>p.currency)).size===1){const lowest=numeric.reduce((a,b)=>a.amount<=b.amount?a:b);headline={value:lowest.value,unit:lowest.unit,label:numeric.length>1?'Nejnižší cena ve schématu':'Cena ve schématu'};}
  else headline={value:'Více měn',unit:'',label:'Ceny ve schématu'};
 }else if(prices.length)headline={value:prices.length===1?prices[0].value:'Více nabídek',unit:prices.length===1?prices[0].unit:'',label:'Ceny ve schématu'};
 const links=[],seen=new Set();
 for(const [raw,label] of [[product.raw.url,'URL produktu'],...product.offers.map(o=>[o.url,'URL nabídky'])]){
  const url=safeStructuredUrl(raw,base);if(url&&!seen.has(url)){seen.add(url);links.push({url,label});}
 }
 const properties=product.raw.additionalProperty;
 return {prices,headline,links,metrics:[
  {label:'Název',value:hasValue(product.raw.name)?'Vyplněn':'Chybí',filled:hasValue(product.raw.name)},
  {label:'Popis',value:hasValue(product.raw.description)?'Vyplněn':'Chybí',filled:hasValue(product.raw.description)},
  {label:'Parametry',value:properties==null?0:Array.isArray(properties)?properties.length:1},
  {label:'Nabídky',value:product.offers.length},
  {label:'Ceny',value:prices.filter(p=>p.value!=='—').length+'/'+product.offers.length},
  {label:'Dostupnost',value:product.offers.filter(o=>hasValue(o.availability)).length+'/'+product.offers.length}
 ]};
}
