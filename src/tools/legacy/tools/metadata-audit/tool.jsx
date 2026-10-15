import React from 'react';
import {AlertTriangle,Check,FileSearch} from 'lucide-react';
import {mountAuditTool} from '../../shared/audit/mount.jsx';
import {analyzeMetadata} from './model.js';
export {analyzeMetadata} from './model.js';

function LengthMeter({kind,label,guidance}) {
  const {current,minimum,optimalMax,scale,status}=guidance;
  const statuses={missing:'Hodnota chybí',short:'Pod doporučeným rozsahem',optimal:'V doporučeném rozsahu',long:'Nad doporučeným rozsahem'};
  return <div className="metadata-length" data-state={status}>
    <div className="metadata-length-heading"><h3 id={`metadata-${kind}-label`}>{label}</h3><span className="metadata-length-status">{status==='optimal'&&<Check size={14} aria-hidden="true"/>}{statuses[status]}</span></div>
    <div className="metadata-length-count"><strong>{current}</strong><span>znaků nyní</span></div>
    <div className="metadata-meter" role="meter" aria-labelledby={`metadata-${kind}-label`} aria-valuemin={0} aria-valuemax={scale} aria-valuenow={current} aria-valuetext={`${current} znaků; redakční minimum ${minimum}, optimální rozsah ${minimum}–${optimalMax} znaků. ${statuses[status]}.`}>
      <span className="metadata-meter-fill" style={{width:`${current/scale*100}%`}}/>
      <span className="metadata-meter-range" style={{left:`${minimum/scale*100}%`,width:`${(optimalMax-minimum)/scale*100}%`}}/>
      <span className="metadata-meter-current" style={{left:`${current/scale*100}%`}}/>
    </div>
    <div className="metadata-length-legend"><span>Minimum doporučení <strong>{minimum}</strong></span><span><i aria-hidden="true"/>Optimální <strong>{minimum}–{optimalMax}</strong></span></div>
  </div>;
}

export function Results({result:r}) {
  const brandIssues=r.issues.filter(issue=>issue.code.startsWith('o2-'));
  const otherIssues=r.issues.filter(issue=>!issue.code.startsWith('o2-'));
  return <div className="metadata-results">
    <section className="metadata-checks" aria-labelledby="metadata-checks-title" data-state={r.issues.length?'warning':'good'}>
      <div className="metadata-checks-heading"><span className="metadata-checks-icon" aria-hidden="true">{r.issues.length?<AlertTriangle size={21}/>:<Check size={21}/>}</span><div><h2 id="metadata-checks-title">{r.issues.length?'Metadata potřebují pozornost':'Kontroly bez upozornění'}</h2><p>{r.issues.length?`${r.issues.length} upozornění · nejdříve zkontrolujte title a popis níže.`:'Title a popis splňují kontrolovaná redakční doporučení.'}</p></div></div>
      {brandIssues.length>0&&<div className="metadata-priority"><strong>Značka O2 patří pouze na konci title</strong>{brandIssues.map(issue=><p key={issue.code}>{issue.message}</p>)}<div className="metadata-example"><span>Vzor</span><span>Oneplay – až 154 kanálů a sport <b>| O2</b></span></div></div>}
      {otherIssues.length>0&&<ul className="metadata-check-list">{otherIssues.map(issue=><li key={issue.code} data-tone={issue.tone}><span className="metadata-issue-dot" aria-hidden="true"/><span>{issue.message}</span></li>)}</ul>}
    </section>
    <div className="metadata-fields">
      {[['title','Title',r.titles],['description','Meta description',r.descriptions]].map(([kind,label,values])=><section className="audit-panel metadata-field" key={kind}>
        <LengthMeter kind={kind} label={label} guidance={r.lengths[kind]}/>
        <div className="metadata-values"><span className="metadata-value-label">{values.length>1?'Nalezené hodnoty':'Načtená hodnota'}</span>{values.length?values.map((value,index)=><div className="metadata-value" key={index}>{values.length>1&&<small>Hodnota {index+1}{index===0?' · použita pro měření':''}</small>}<pre>{value||'(prázdná hodnota)'}</pre></div>):<p className="metadata-missing">Na stránce chybí.</p>}</div>
      </section>)}
    </div>
    <p className="metadata-guidance"><strong>Jak číst délku:</strong> doporučeno 50–60 znaků pro title a doporučeno 140–160 pro description. Minimum i optimální rozsah jsou redakční vodítka, nikoli pevné limity Googlu. Zobrazení závisí na šířce a zařízení; vyhledávač může text upravit. Počítají se Unicode znaky první načtené hodnoty.</p>
    <section className="audit-panel metadata-preview" aria-labelledby="metadata-preview-heading"><h3 id="metadata-preview-heading">Orientační náhled</h3><div className="metadata-snippet"><p className="metadata-preview-url">{r.url}</p><p className="metadata-preview-title">{r.title.trim()||'Title na stránce chybí'}</p><p className="metadata-preview-description">{r.description.trim()||'Meta description na stránce chybí.'}</p></div><p className="audit-note">Ukázka z první načtené hodnoty. Vyhledávač může text i podobu výsledku změnit; skutečný výsledek vyhledávání není ověřen.</p></section>
    {r.isO2&&<section className="audit-panel metadata-template"><div className="metadata-template-heading"><h3>Pořadí v O2 title</h3><span className="metadata-template-state" data-valid={Boolean(r.template)}>{r.template?'Pořadí je v pořádku':'Upravte pořadí nebo obsah'}</span></div><div className="metadata-formula"><span><small>01</small>Služba</span><span aria-hidden="true">→</span><span><small>02</small>Benefit</span><span aria-hidden="true">→</span><span><small>03</small>O2 na konci</span></div>{r.template&&<dl className="audit-kv"><dt>Služba</dt><dd>{r.template.service}</dd><dt>Benefit</dt><dd>{r.template.benefit}</dd><dt>Značka</dt><dd>{r.template.brand}</dd></dl>}<p className="audit-note">Začněte názvem služby a konkrétním přínosem. Značku uveďte jednou, až na konci. Oddělovačem může být pomlčka nebo svislá čára.</p></section>}
    <p className="audit-note metadata-source">Zdroj: {r.url}</p>
  </div>;
}
export function mount(root,app){return mountAuditTool(root,app,{id:'metadata',title:'Metadata',description:'Title a meta description aktuální stránky.',requestType:'METADATA_SCAN',analyze:analyzeMetadata,Results,icon:FileSearch,help:'Čte přesné hodnoty title a meta description bez změn stránky. O2 šablona se kontroluje pouze na o2.cz a jeho subdoménách.'});}
