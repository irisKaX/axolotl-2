import React,{useState} from 'react';
import {AlertTriangle,Check,ListTree} from 'lucide-react';
import {mountAuditTool} from '../../shared/audit/mount.jsx';
import {analyzeHeadings} from './model.js';
export {analyzeHeadings} from './model.js';

function Outline({nodes,onlyIssues,root=false}) {
  const visible=nodes.map(node=>({...node,branchHasIssues:node.issues.length||hasIssue(node)})).filter(node=>!onlyIssues||node.branchHasIssues);
  if(!visible.length)return null;
  return <ol className={root?'headings-outline':'headings-branch'}>{visible.map(heading=>{
    const context=onlyIssues&&!heading.issues.length;
    return <li key={heading.index} data-heading-index={heading.index} data-level={heading.level}>
      <div className={context?'headings-context':'headings-node'} data-warning={Boolean(heading.issues.length)}>
        <span className="headings-level">H{heading.level}</span>
        <div className="headings-node-content"><div className="headings-node-title"><strong>{heading.text||'(prázdný nadpis)'}</strong>{context&&<span className="headings-context-label">Nadřazený nadpis</span>}{heading.ariaHidden&&<span className="headings-aria-hidden">aria-hidden</span>}</div>
          {heading.skippedLevels.length>0&&heading.issues.some(issue=>['level-skip','outline-start'].includes(issue.code))&&<p className="headings-skip"><AlertTriangle size={14} aria-hidden="true"/>Chybí návaznost přes {heading.skippedLevels.map(level=>`H${level}`).join(', ')}{heading.parentIndex===null?' · bez předchozího nadřazeného nadpisu':''}</p>}
          {heading.issues.filter(issue=>!['level-skip','outline-start'].includes(issue.code)).map(issue=><p className="headings-node-issue" key={issue.code}>{issue.message}</p>)}
        </div><span className="headings-order" title="Pořadí v dokumentu">#{heading.index+1}</span>
      </div>
      <Outline nodes={heading.children} onlyIssues={onlyIssues}/>
    </li>;
  })}</ol>;
}
function hasIssue(node){return node.children.some(child=>child.issues.length||hasIssue(child));}

export function Results({result:r}) {
  const [onlyIssues,setOnlyIssues]=useState(false);
  return <div className="headings-results">
    <div className="headings-summary">{Object.entries(r.counts).map(([level,count])=><div className="headings-stat" data-level={level} data-empty={!count} key={level}><span>H{level}</span><strong>{count}</strong></div>)}</div>
    <section className="headings-checks" aria-labelledby="headings-checks-title" data-state={r.issues.length?'warning':'good'}><div className="headings-checks-heading">{r.issues.length?<AlertTriangle size={20} aria-hidden="true"/>:<Check size={20} aria-hidden="true"/>}<h3 id="headings-checks-title">{r.issues.length?'Zkontrolujte návaznost nadpisů':'Struktura bez upozornění'}</h3><span>{r.issues.length?`${r.issues.length} upozornění`:`${r.headings.length} nadpisů`}</span></div>{r.issues.length>0&&<ul>{r.issues.map((issue,index)=><li key={index} data-tone={issue.tone}>{issue.index!==undefined&&<span>#{issue.index+1}</span>}{issue.message}</li>)}</ul>}</section>
    <section className="audit-panel headings-hierarchy"><div className="headings-hierarchy-heading"><div><h3>Hierarchie nadpisů</h3><p>Pořadí na stránce a návaznost jednotlivých sekcí.</p></div><label className="headings-filter"><input type="checkbox" checked={onlyIssues} onChange={event=>setOnlyIssues(event.target.checked)}/>Pouze nadpisy s upozorněním</label></div>
      <div className="headings-legend"><span><i aria-hidden="true"/>Odsazení = nadřazená sekce</span><span>H1–H6 = skutečná úroveň</span></div>
      {onlyIssues&&<p className="headings-filter-note">Nadřazené nadpisy zůstávají zobrazené pro kontext.</p>}
      <Outline nodes={r.outline} onlyIssues={onlyIssues} root/>
      {!r.headings.length&&<p className="audit-empty">Žádné viditelné nativní nadpisy.</p>}
      {onlyIssues&&r.headings.length>0&&!r.headings.some(heading=>heading.issues.length)&&<p className="audit-empty">Žádné nadpisy s upozorněním. Celkové kontroly stránky najdete výše.</p>}
    </section>
    <section className="audit-panel headings-aria"><h3>ARIA nadpisy <span>{r.ariaHeadings.length}</span></h3><p className="audit-note">role="heading" je uveden zvlášť a nenahrazuje skutečný H1 v této kontrole.</p>{r.ariaHeadings.length?<ul>{r.ariaHeadings.map((heading,index)=><li key={index}><span>Úroveň {heading.level||'Neověřeno'}</span><strong>{heading.text||'(prázdný nadpis)'}</strong></li>)}</ul>:<p className="headings-aria-empty">Žádné samostatně označené ARIA nadpisy.</p>}</section>
    <p className="audit-note">Rozsah: viditelné H1–H6 v pořadí DOM v hlavním dokumentu a otevřených shadow roots, i pod prvním viewportem. Odsazení sleduje nejbližší předchozí nadpis nižší úrovně; přeskočené úrovně jsou označené. Skryté větve, zavřené details a běžné vizuálně skryté prvky jsou vynechány. Samotné aria-hidden neskrývá vizuálně viditelný nadpis; rámce a uzavřené shadow roots: Neověřeno.</p><p className="audit-note">Zdroj: {r.url}</p>
  </div>;
}
export function mount(root,app){return mountAuditTool(root,app,{id:'headings',title:'Nadpisy',description:'Viditelná struktura H1–H6 a samostatný přehled ARIA.',requestType:'HEADINGS_SCAN',analyze:analyzeHeadings,Results,icon:ListTree,help:'Kontroluje skutečné H1, prázdné nadpisy a skoky do hlubší úrovně. Návrat H4 → H2 je povolen. Pořadí odpovídá DOM, nikoli případnému vizuálnímu přeuspořádání CSS.'});}
