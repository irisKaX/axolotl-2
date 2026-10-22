import { normalizeUrl, type PageStore } from '../../lib/browser-bridge';
// Same in-memory disconnected context as the approved Playground; no Tools integration.
export function createDashboardPageStore(): PageStore {
  let state: ReturnType<PageStore['getSnapshot']> = {context:{url:'https://www.o2.cz',tabId:null,source:'manual'},connection:{status:'disconnected',tabCount:0},tabs:[]};
  const listeners=new Set<()=>void>();
  return {
    getSnapshot:()=>state,
    subscribe(listener) { listeners.add(listener); return ()=>{listeners.delete(listener);}; },
    commitManual(value) { const url=normalizeUrl(value);state={...state,context:{url,tabId:null,source:'manual'}};listeners.forEach(fn=>fn());return url; },
    selectTab:()=>{},selectAuto:()=>{},refresh:()=>{},start:()=>()=>{},
  };
}
