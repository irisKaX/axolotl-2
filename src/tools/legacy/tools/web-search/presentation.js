export const formatCount=(n,one,few,many)=>`${Number(n||0).toLocaleString('cs-CZ')} ${n===1?one:n>=2&&n<=4?few:many}`;
function resourceUrl(value,base){try{const u=new URL(value,base);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function describeAssetMatch(match,base){
 const tag=String(match.tag||'').toLowerCase(),attr=String(match.attribute||'').toLowerCase(),label=String(match.label||'').toLowerCase();
 const direct=resourceUrl(match.value,base),plain={link:null,linkLabel:'Otevřít odkaz',order:4};
 if(tag==='meta'&&/^(?:og:image(?::(?:url|secure_url))?|twitter:image(?::src)?)$/.test(label))return {...plain,title:'Obrázek pro sdílení',description:'Asset je určený pro náhled při sdílení odkazu na stránku.',link:direct,linkLabel:'Otevřít obrázek',order:0};
 if(tag==='meta')return {...plain,title:'Metadata stránky',description:'ID assetu je uvedené v technických údajích stránky.'};
 if(attr==='json')return {...plain,title:'Data stránky',description:'ID assetu je uvedené v datovém bloku stránky.',order:3};
 if(attr==='style'||attr.startsWith('css '))return {...plain,title:'Pozadí nebo grafika prvku',description:'ID assetu je uvedené v nastavení vzhledu prvku.',order:1};
 if(['img','source'].includes(tag)&&/^(?:src|srcset|data-src|data-srcset|data-lazy-src)$/.test(attr))return {...plain,title:'Obrázek ve stránce',description:'ID assetu je uvedené ve zdroji obrázku. Viditelnost obrázku není tímto nálezem ověřena.',link:/srcset$/.test(attr)?null:direct,linkLabel:'Otevřít obrázek',order:1};
 if(attr==='poster')return {...plain,title:'Náhled videa',description:'Asset je uvedený jako náhledový obrázek videa.',link:direct,linkLabel:'Otevřít obrázek',order:1};
 if(attr==='href'||attr==='xlink:href')return {...plain,title:direct&&/\.pdf$/i.test(new URL(direct).pathname)?'Odkaz na PDF':'Odkaz na asset',description:match.label?`ID assetu je uvedené v odkazu „${match.label}“.`:'ID assetu je uvedené v odkazu na stránce.',link:direct,order:2};
 if(attr==='id')return {...plain,title:'Identifikátor prvku',description:'ID assetu je součástí označení prvku nebo komponenty.',order:2};
 if(attr.startsWith('data-'))return {...plain,title:'Nastavení prvku',description:'ID assetu je uložené v nastavení prvku stránky.',order:3};
 return {...plain,title:'Záznam ve zdroji stránky',description:'ID assetu je uvedené ve zdrojových údajích stránky.'};
}
export function highlightParts(value,query,options={}){
 const original=String(value||'').normalize('NFC');
 const fold=s=>{let v=s.normalize('NFC');if(options.ignoreDiacritics)v=v.normalize('NFD').replace(/\p{M}/gu,'');return options.caseSensitive?v:v.toLocaleLowerCase('cs');};
 const needle=fold(String(query||'').replace(/\s+/g,' ').trim());
 if(!needle)return [{text:original,match:false}];
 let normalized='',offset=0;const positions=[];
 for(const char of original){const part=fold(char);for(let i=0;i<part.length;i++)positions.push({start:offset,end:offset+char.length});normalized+=part;offset+=char.length;}
 const parts=[];let at=0,last=0,index;
 while((index=normalized.indexOf(needle,at))!==-1){
  const start=positions[index].start,end=positions[index+needle.length-1].end;
  if(start>last)parts.push({text:original.slice(last,start),match:false});
  if(end>last)parts.push({text:original.slice(Math.max(last,start),end),match:true});
  last=end;at=index+needle.length;
 }
 if(last<original.length)parts.push({text:original.slice(last),match:false});
 return parts.length?parts:[{text:original,match:false}];
}
export function searchStatus(result,running){
 if(running)return result.phase==='maps'?'Zjišťuji stránky webu':'Hledání probíhá';
 if(result.cancelled)return 'Hledání zastaveno';
 if(result.failed)return 'Hledání se nepodařilo dokončit';
 if(result.limit)return 'Hledání skončilo na limitu';
 if(result.errors?.length||result.mapErrors?.length||result.truncatedPages)return 'Dokončeno s omezeními';
 return 'Hledání dokončeno';
}
export function compactExcerpt(value,query,options={}){
 const text=String(value||'').replace(/\s+/g,' ').trim().normalize('NFC');
 if(text.length<=150)return text;
 const parts=highlightParts(text,query,options),index=parts.findIndex(part=>part.match);
 const matchStart=index<0?0:parts.slice(0,index).reduce((n,part)=>n+part.text.length,0);
 const matchLength=index<0?0:parts[index].text.length;
 const start=Math.max(0,matchStart-45),end=Math.min(text.length,Math.max(start+145,matchStart+matchLength+60));
 return (start?'… ':'')+text.slice(start,end).trim()+(end<text.length?' …':'');
}
