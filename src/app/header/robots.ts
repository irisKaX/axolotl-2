/** Observed sources only. Undefined means unavailable; an empty array means inspected. */
export interface RobotsObservation {
  entries?: {name:string;content:string}[];
  headers?: string[];
  truncated?: boolean;
}
export interface RobotsResult {
  state:'allowed'|'blocked'|'unknown';
  index:'povoleno'|'noindex'|'nezjištěno';
  follow:'povoleno'|'nofollow'|'nezjištěno';
  source:string;
  reason:string;
}
export function unknownRobots(reason:string):RobotsResult {
  return {state:'unknown',index:'nezjištěno',follow:'nezjištěno',source:'nedostupný',reason};
}
/** Googlebot web: combine applicable restrictions, never borrow another crawler's scope. */
export function evaluateRobots(observation:RobotsObservation):RobotsResult {
  let noindex=false,nofollow=false,uncertain=!!observation.truncated;
  const applies=(agent:string)=>['robots','googlebot','*',''].includes(agent.toLowerCase());
  const read=(content:string,agent:string)=>{
    if(!applies(agent))return;
    const directives=content.toLowerCase().split(/[\s,;]+/);
    noindex ||= directives.includes('noindex')||directives.includes('none');
    nofollow ||= directives.includes('nofollow')||directives.includes('none');
    // Expiration directives require a separate time-aware assessment; never turn these green.
    uncertain ||= /\bunavailable_after\s*:/.test(content.toLowerCase());
  };
  const metaAvailable=Array.isArray(observation.entries);
  const headersAvailable=Array.isArray(observation.headers);
  for(const entry of observation.entries??[]) {
    if(typeof entry?.name!=='string'||typeof entry.content!=='string'){uncertain=true;continue;}
    read(entry.content,entry.name.trim());
  }
  for(const header of observation.headers??[]) {
    if(typeof header!=='string'){uncertain=true;continue;}
    let agent='';
    for(const part of header.split(',')) {
      const scoped=part.trim().match(/^([\w*-]+)\s*:\s*(.*)$/);
      if(scoped&&!['max-snippet','max-image-preview','max-video-preview','unavailable_after'].includes(scoped[1].toLowerCase())) {
        agent=scoped[1].toLowerCase();read(scoped[2],agent);
      } else read(part,agent);
    }
  }
  const complete=metaAvailable&&headersAvailable&&!uncertain;
  return {
    state:noindex||nofollow?'blocked':complete?'allowed':'unknown',
    index:noindex?'noindex':complete?'povoleno':'nezjištěno',
    follow:nofollow?'nofollow':complete?'povoleno':'nezjištěno',
    source:metaAvailable&&headersAvailable?'robots meta + X-Robots-Tag':metaAvailable?'robots meta':headersAvailable?'X-Robots-Tag':'nedostupný',
    reason:uncertain?'Neúplná nebo nepodporovaná data; výsledek není plně ověřený.':!headersAvailable?'X-Robots-Tag není dostupný; kontrola je omezená na meta.':!metaAvailable?'Robots meta nejsou dostupná.':noindex||nofollow?'Nalezena blokující direktiva.':'V dostupných direktivách nebylo nalezeno noindex ani nofollow.',
  };
}
