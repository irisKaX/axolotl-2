import { collectSearchPage } from '../tools/web-search/collect.js';
import { collectMetadata } from '../tools/metadata-audit/collect.js';
import { collectHeadings } from '../tools/headings-audit/collect.js';
import { collectStructuredData } from '../tools/structured-data/collect.js';
import { collectImageAudit } from '../tools/image-audit/collect.js';
import { probeImageResources } from '../tools/image-audit/probe.js';
import { runPageAudit } from './audit-runner.js';
export { cancelAudit, cancelSessionAudits } from './audit-runner.js';
const collectors={SEARCH_SCAN:collectSearchPage,METADATA_SCAN:collectMetadata,HEADINGS_SCAN:collectHeadings,STRUCTURED_SCAN:collectStructuredData,IMAGE_AUDIT_SCAN:collectImageAudit};
export function readAudit(tab,type,options){
 const collector=collectors[type];if(!collector)throw Error('Neznámá kontrola.');
 return runPageAudit(tab,collector,{...options,probe:type==='IMAGE_AUDIT_SCAN'?probeImageResources:undefined});
}
