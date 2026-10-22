// Preview adapter. The pinned production Header receives only the local PanelHeading polish patch.
import { useEffect, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppHeader } from '@approved/app/header/AppHeader';
import { PreferencesProvider, usePreferences } from '@approved/app/PreferencesProvider';
import { PageContextProvider } from '@approved/app/PageContextProvider';
import { createPreferencesStore } from '@approved/lib/preferences';
import { normalizeUrl } from '@approved/lib/browser-bridge';

const bridge = window.playgroundBridge;
const routes = {
  'dashboard':'dashboard', 'widgets':'dashboard', 'workspace':'osobni-prostor/poznamky',
  'tools/find':'kontrola/hledani-na-webu', 'tools/metadata':'kontrola/metadata',
  'tools/headings':'kontrola/nadpisy', 'tools/qr':'media/qr',
  'tools/convert':'media/konvertor-obrazku', 'tools/images':'media/obrazky-z-webu',
  'tools/pdf':'media/pdf-scout', 'tools/screenshot':'media/screenshot',
  'tools/audit':'kontrola/obrazky', 'tools/schema':'kontrola/strukturovana-data'
};
const preferences = createPreferencesStore({storagePrefix:'axolotl-playground-evolution-v1',initialTheme:bridge.get().theme});
const explicitTheme = new URLSearchParams(location.search).get('theme');
if (explicitTheme === 'dark' || explicitTheme === 'light') preferences.set('theme', explicitTheme);
// In-memory URL adapter: keep the approved capsule and dropdown UI, without activating browser/tool integrations.
let snapshot = {context:{url:bridge.get().url,tabId:null,source:'manual'},connection:{status:'disconnected',tabCount:0},tabs:[]};
const listeners = new Set<()=>void>();
const pageStore = {
  getSnapshot:()=>snapshot,
  subscribe:(listener:()=>void)=>{listeners.add(listener);return ()=>listeners.delete(listener);},
  commitManual:(value:string)=>{const url=normalizeUrl(value);snapshot={...snapshot,context:{url,tabId:null,source:'manual'}};bridge.setUrl(url);listeners.forEach(fn=>fn());return url;},
  selectTab:()=>{},selectAuto:()=>{},refresh:()=>{},start:()=>()=>{}
};
function Header() {
  const prefs = usePreferences();
  useLayoutEffect(() => {
    const header = document.querySelector('#approved-header header') as HTMLElement;
    const update = () => document.getElementById('approved-header')!.style.setProperty('--pg-header-bottom', `${header.getBoundingClientRect().bottom}px`);
    const observer = new ResizeObserver(update);
    observer.observe(header);
    window.addEventListener('resize', update);
    update();
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, []);
  const [route,setRoute] = useState(()=>routes[bridge.get().route] || 'dashboard');
  useEffect(()=>{const update=()=>setRoute(routes[bridge.get().route] || 'dashboard');document.addEventListener('playground:view-change',update);return ()=>document.removeEventListener('playground:view-change',update);},[]);
  useEffect(()=>{bridge.setTheme(prefs.resolvedTheme);},[prefs.resolvedTheme]);
  return <AppHeader route={route} onNavigate={()=>{}}/>;
}
createRoot(document.getElementById('approved-header')!).render(<PreferencesProvider store={preferences}><PageContextProvider store={pageStore}><Header/></PageContextProvider></PreferencesProvider>);
// The original About panel keeps its link to the existing library.
document.addEventListener('click',event=>{const link=(event.target as Element)?.closest('a[href="#design-system"]');if(link){event.preventDefault();window.parent.location.href=new URL('../../?catalog=library#design-system',location.href).href;}});
