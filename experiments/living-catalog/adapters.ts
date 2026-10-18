import type { Preferences, PreferencesStore } from '../../src/lib/preferences';
import { normalizeUrl, type PageSnapshot, type PageStore } from '../../src/lib/browser-bridge';

// Experiment-only adapters: no storage, extension transport or subscriptions.
export function memoryPreferences(initialTheme: 'dark' | 'light'): PreferencesStore {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const dark = matchMedia('(prefers-color-scheme: dark)');
  let state: Preferences = { theme:initialTheme, resolvedTheme:initialTheme, motion:'system', reducedMotion:reduced.matches, textSize:'standard', cursor:false };
  const listeners = new Set<() => void>();
  const resolve = () => { state = {...state, resolvedTheme:state.theme === 'system' ? (dark.matches ? 'dark':'light') : state.theme, reducedMotion:state.motion === 'reduced' || (state.motion === 'system' && reduced.matches)}; listeners.forEach(fn=>fn()); };
  return {getSnapshot:()=>state, subscribe:fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};}, set:(key,value)=>{const valid = key==='theme'?['dark','light','system'].includes(String(value)):key==='motion'?['system','full','reduced'].includes(String(value)):key==='textSize'?['standard','large'].includes(String(value)):key==='cursor'&&typeof value==='boolean';if(!valid)return {accepted:false,saved:false};state={...state,[key]:value};resolve();return {accepted:true,saved:false};}, start:()=>{reduced.addEventListener('change',resolve);dark.addEventListener('change',resolve);return()=>{reduced.removeEventListener('change',resolve);dark.removeEventListener('change',resolve);};}};
}
export function memoryPageStore(): PageStore {
  let state: PageSnapshot = {context:{url:'https://www.o2.cz/',tabId:null,source:'manual'},connection:{status:'disconnected',tabCount:0},tabs:[]};
  const listeners = new Set<() => void>();
  const store = {getSnapshot:()=>state,subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};},start:()=>()=>{},refresh:()=>{},selectAuto:()=>{},selectTab:()=>{},commitManual:(value:string)=>{const url=normalizeUrl(value);state={...state,context:{url,source:'manual',tabId:null}};listeners.forEach(fn=>fn());return url;}};
  return store as PageStore;
}
