export const METADATA_LENGTH_GUIDANCE = {
  title: {minimum:50,optimalMax:60,scale:80},
  description: {minimum:140,optimalMax:160,scale:200},
};

function lengthGuidance(value,kind) {
  const current=Array.from(value).length,{minimum,optimalMax,scale}=METADATA_LENGTH_GUIDANCE[kind];
  return {current,minimum,optimalMax,scale:Math.max(scale,current),status:!value.trim()?'missing':current<minimum?'short':current>optimalMax?'long':'optimal'};
}

export function analyzeMetadata(snapshot) {
  const titles=snapshot.titles??[],descriptions=snapshot.descriptions??[],title=titles[0]??'',description=descriptions[0]??'',issues=[];
  const issue=(code,message,tone='warning')=>issues.push({code,message,tone});
  for(const [key,values,label] of [['title',titles,'Title'],['description',descriptions,'Meta description']]) {
    if(!values.length)issue(`${key}-missing`,`${label} chybí.`,'error');
    else if(values.every(v=>!v.trim()))issue(`${key}-empty`,`${label} je prázdný.`,'error');
    if(values.length>1)issue(`${key}-duplicate`,`${label}: nalezeno ${values.length} hodnot. Zobrazená první hodnota nemusí být vybrána vyhledávačem.`);
  }
  const lengths={title:lengthGuidance(title,'title'),description:lengthGuidance(description,'description')};
  const titleLength=lengths.title.current,descriptionLength=lengths.description.current;
  if(title.trim()&&lengths.title.status!=='optimal')issue('title-length','Title je mimo redakční doporučení 50–60 znaků.');
  if(description.trim()&&lengths.description.status!=='optimal')issue('description-length','Description je mimo redakční doporučení 140–160 znaků.');
  let isO2=false;try{const host=new URL(snapshot.url).hostname;isO2=host==='o2.cz'||host.endsWith('.o2.cz');}catch{issue('url-unknown','Doména: Neověřeno.');}
  let template=null;
  if(isO2){
    const trimmed=title.trim();
    const brands=[...trimmed.matchAll(/(?<![\p{L}\p{N}])O[2₂](?![\p{L}\p{N}])/giu)];
    const misplaced=brands.some(match=>match.index+match[0].length!==trimmed.length);
    if(misplaced)issue('o2-brand-position','Značka O2 musí být pouze na konci title. Začněte službou a benefitem; úvodní nebo opakované O2 odstraňte.');
    const match=trimmed.match(/^(.+?)(?:\s+[-–—−]\s+|\s*\|\s*)(.+?)(?:\s+[-–—−]\s+|\s*\|\s*)(O2|O₂)$/iu);
    const hasParts=match&&match[1].trim()&&match[2].trim();
    if(hasParts&&!misplaced)template={service:match[1].trim(),benefit:match[2].trim(),brand:match[3]};
    else if(!hasParts)issue('o2-template','O2 title má začínat službou, pokračovat benefitem a končit značkou: „Služba – benefit | O2“. Povoleny jsou i pomlčky a O₂.');
  }
  return {...snapshot,titles,descriptions,title,description,titleLength,descriptionLength,lengths,isO2,template,issues};
}
