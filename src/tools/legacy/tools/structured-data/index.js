import { mountAuditTool } from '../../shared/audit/mount.jsx';
import { Braces } from 'lucide-react';
import { analyzeStructuredData } from './model.js';
import { StructuredResults } from './view.jsx';
export function mount(root,app){return mountAuditTool(root,app,{id:'structured',title:'Strukturovaná data',description:'Odpovídají údaje ve schématu tomu, co zákazník vidí na stránce?',presentation:'focused',requestType:'STRUCTURED_SCAN',analyze:analyzeStructuredData,Results:StructuredResults,icon:Braces,help:'Načte JSON-LD a viditelné produktové karty včetně otevřeného shadow DOM. Ceny porovnává pouze v jednoznačně přiřazené kartě a stejné roli (běžná, akční, O2 Spolu). Neověřeno znamená nedostatek jednoznačných důkazů, nikoli správnost. Texty a další metadata zůstávají dostupné k ruční kontrole. Obsah iframe a uzavřený shadow DOM nejsou zahrnuty.'});}
