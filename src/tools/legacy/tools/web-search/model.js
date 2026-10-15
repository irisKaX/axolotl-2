import {normalizePageLimit} from './limits.js';
export function validateOptions(input={}) {
  const kind=input.kind==='asset'?'asset':'phrase',scope=input.scope==='site'?'site':'page',query=String(input.query||'').trim();
  if(!query)throw Error(kind==='asset'?'Zadejte ID assetu.':'Zadejte hledanou frázi.');
  if(query.length>500)throw Error('Dotaz může mít nejvýše 500 znaků.');
  const assets=kind==='asset'?[...new Set(query.split(/[\s,;]+/).filter(Boolean).map(s=>s.toLowerCase()))]:[];
  if(kind==='asset'&&(assets.length>20||assets.some(a=>!/^a\d{1,20}$/.test(a))))throw Error('Asset zadejte jako a452399. Více ID oddělte mezerou nebo čárkou (nejvýše 20).');
  const maxPages=normalizePageLimit(input.maxPages);
  const phraseSource=['visible','text','html'].includes(input.phraseSource)?input.phraseSource:'visible';
  const sharedComponents=['separate','exclude','include'].includes(input.sharedComponents)?input.sharedComponents:'separate';
  return {kind,scope,query,assets,maxPages,phraseSource,sharedComponents,caseSensitive:!!input.caseSensitive,ignoreDiacritics:!!input.ignoreDiacritics};
}
const normalize=(s,o)=>{let v=String(s).normalize('NFC').replace(/\s+/g,' ').trim();if(o.ignoreDiacritics)v=v.normalize('NFD').replace(/\p{M}/gu,'');return o.caseSensitive?v:v.toLocaleLowerCase('cs');};
function srcsetUrls(value){
  const urls=[];let at=0;
  while(at<value.length){
    while(at<value.length&&/[\s,]/.test(value[at]))at++;
    const start=at;while(at<value.length&&!/\s/.test(value[at]))at++;
    let url=value.slice(start,at);if(!url)break;
    if(url.endsWith(',')){urls.push(url.replace(/,+$/,''));continue;}
    urls.push(url);let parens=0;
    while(at<value.length){const char=value[at++];if(char==='(')parens++;else if(char===')')parens=Math.max(0,parens-1);else if(char===','&&!parens)break;}
  }
  return urls;
}
function assetValues(ref,base){
  const urlValues=value=>{try{const u=new URL(value,base);if(!/^https?:$/.test(u.protocol))return '';let path=u.pathname+' '+u.hash;try{path=decodeURIComponent(path);}catch{}return path+' '+[...u.searchParams].filter(([key])=>/^_?linka$|^(?:id|asset(?:_?id)?)$/i.test(key)).map(([,v])=>v).join(' ');}catch{return '';}};
  if(ref.format==='lbxid')return ref.value.replace(/(?<=\d)(?=a\d)/gi,' ');
  if(ref.format==='url')return urlValues(ref.value);
  if(ref.attribute==='style')return [...ref.value.matchAll(/url\(\s*['"]?([^'"\s)]+)/gi)].map(m=>urlValues(m[1])).join(' ');
  if(/^(?:data-)?srcset$/.test(ref.attribute))return srcsetUrls(ref.value).map(urlValues).join(' ');
  if(/^(?:href|src|poster|data|xlink:href)$/.test(ref.attribute))return urlValues(ref.value);
  let value=ref.value;try{value=decodeURIComponent(value);}catch{}return value;
}
export function searchSnapshot(snapshot,options){
  const matches=[],components=[];let count=0,capped=false;
  if(options.kind==='phrase'){
    const source=options.phraseSource||'visible',mode=options.sharedComponents||'separate';
    const find=value=>{
      const original=String(value||'').normalize('NFC').replace(/\s+/g,' ').trim(),text=normalize(original,options),query=normalize(options.query,options);
      const evidence=[];let at=0,index,total=0;
      while(query&&(index=text.indexOf(query,at))!==-1){total++;if(evidence.length<8){const start=Math.max(0,index-70),end=Math.min(text.length,index+query.length+100);evidence.push({excerpt:(start?'…':'')+original.slice(start,end)+(end<text.length?'…':''),kind:source==='html'?'html':'text'});}at=index+query.length;if(total>=10000){capped=true;break;}}
      return {count:total,matches:evidence};
    };
    const page=find(snapshot.phraseContent?.[source]??snapshot.text);
    count=page.count;matches.push(...page.matches);
    if(mode!=='exclude')for(const component of snapshot.components||[]){
      const r=find(component[source]);if(!r.count)continue;
      if(mode==='include'){count+=r.count;matches.push(...r.matches.slice(0,Math.max(0,8-matches.length)));}
      else {
        // HTML evidence can differ even when visible menu labels and links match.
        let hash=2166136261;const value=source==='html'?component.html:'';
        for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);
        components.push({id:component.id+(source==='html'?'-'+(hash>>>0).toString(36):''),label:component.label,kind:component.kind,...r,source:snapshot.source||'html',truncated:!!snapshot.truncated||capped});
      }
    }
  }else for(const ref of snapshot.references||[]){
    const value=assetValues(ref,snapshot.baseUrl||snapshot.url);
    const ids=options.assets.filter(id=>new RegExp('(?<![\\p{L}\\p{N}])'+id+'(?![\\p{L}\\p{N}])','iu').test(value));
    if(!ids.length)continue;count++;
    if(matches.length<8){
      const index=ref.value.toLowerCase().indexOf(ids[0]),start=Math.max(0,index-100);
      matches.push({...ref,assets:ids,excerpt:(start?'…':'')+ref.value.slice(start,start+500)+(start+500<ref.value.length?'…':''),kind:'asset'});
    }
  }
  return {url:snapshot.url,baseUrl:snapshot.baseUrl||snapshot.url,title:snapshot.title||snapshot.url,source:snapshot.source||'html',count,matches,components,truncated:!!snapshot.truncated||capped};
}
