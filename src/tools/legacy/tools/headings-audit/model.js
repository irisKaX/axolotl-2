export function analyzeHeadings(snapshot) {
  const headings=(snapshot.headings??[]).map((h,index)=>({...h,index,issues:[],children:[]}));
  const counts=Object.fromEntries([1,2,3,4,5,6].map(n=>[n,0])),issues=[],outline=[],ancestors=[];
  const add=(code,message,tone='warning',index)=>{
    const issue={code,message,tone,index};issues.push(issue);
    if(index!==undefined)headings[index].issues.push(issue);
  };
  let previous=0;
  headings.forEach((heading,index)=>{
    counts[heading.level]++;
    while(ancestors.length&&ancestors.at(-1).level>=heading.level)ancestors.pop();
    const parent=ancestors.at(-1);
    heading.parentIndex=parent?.index??null;
    heading.depth=ancestors.length;
    heading.skippedLevels=Array.from({length:Math.max(0,heading.level-(parent?.level??0)-1)},(_,offset)=>(parent?.level??0)+offset+1);
    (parent?.children??outline).push(heading);
    ancestors.push(heading);
    if(!heading.text.trim())add('heading-empty',`H${heading.level} je prázdný.`,'warning',index);
    if(!previous&&heading.level>1)add('outline-start',`Osnova začíná H${heading.level}; před ním chybí ${heading.skippedLevels.map(level=>`H${level}`).join(', ')}.`,'warning',index);
    if(previous&&heading.level>previous+1)add('level-skip',`Přeskočená úroveň H${previous} → H${heading.level}.`,'warning',index);
    previous=heading.level;
  });
  if(!counts[1])add('h1-missing',snapshot.truncated?'H1 ve zpracované části nenalezen — celá stránka: Neověřeno.':'Chybí skutečný nadpis H1.',snapshot.truncated?'warning':'error');
  if(counts[1]>1)add('h1-multiple',`Stránka obsahuje ${counts[1]} nadpisů H1.`);
  if(snapshot.truncated)add('truncated','Dosažen limit sběru. Úplnost: Neověřeno.');
  return {...snapshot,headings,outline,ariaHeadings:snapshot.ariaHeadings??[],counts,issues};
}
