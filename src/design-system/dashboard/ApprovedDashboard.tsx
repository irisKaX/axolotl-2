import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppHeader } from '../../app/header/AppHeader';
import { usePreferences } from '../../app/PreferencesProvider';
import { PageContextProvider } from '../../app/PageContextProvider';
import { dashboardStyle } from '../tokens/dashboard';
import { createDashboardPageStore } from './previewContext';
import { BentoDashboard } from './BentoDashboard';
import { useApprovedHeaderFocus } from './useApprovedHeaderFocus';
import './dashboard.css';
import './header.css';

function DashboardScene({onNavigate}: {onNavigate?: (route: string)=>void}) {
  const prefs=usePreferences();
  const [route,setRoute]=useState('dashboard');
  const root=useRef<HTMLDivElement>(null);
  useApprovedHeaderFocus(root);
  useLayoutEffect(()=>{
    const node=root.current!;
    const header=node.querySelector('header')!;
    const update=()=>node.style.setProperty('--pg-header-height',`${header.getBoundingClientRect().height}px`);
    const observer=new ResizeObserver(update);observer.observe(header);update();
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    document.body.dataset.dsDashboardTheme=prefs.resolvedTheme;
    return ()=>{delete document.body.dataset.dsDashboardTheme;};
  },[prefs.resolvedTheme]);
  useEffect(()=>{
    const select=(event: MouseEvent)=>{
      if(event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
      const link=(event.target as Element).closest?.('a[href^="#"]');
      if(!link || !(root.current?.contains(link)||link.closest('[data-header-panel]')))return;
      event.preventDefault();
      const next=link.getAttribute('href')!.slice(1);
      if(next==='design-system') { location.href='?catalog=library#design-system';return; }
      setRoute(next);onNavigate?.(next);
    };
    document.addEventListener('click',select,true);
    return ()=>document.removeEventListener('click',select,true);
  },[onNavigate]);
  return <div ref={root} className="ds-dashboard" data-theme={prefs.resolvedTheme} data-motion={prefs.reducedMotion?'reduced':'full'} style={dashboardStyle()}>
    <div id="approved-header"><AppHeader route={route} onNavigate={()=>{}}/></div>
    <div className="ds-dashboard-content"><BentoDashboard/></div>
  </div>;
}

export function ApprovedDashboard({onNavigate}: {onNavigate?: (route: string)=>void}) {
  const [pageStore]=useState(createDashboardPageStore);
  return <PageContextProvider store={pageStore}>
    <DashboardScene onNavigate={onNavigate}/>
  </PageContextProvider>;
}
