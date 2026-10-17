import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { BrandMark } from '../../components/BrandLogo';
import { HeaderControls } from '../../app/HeaderControls';
import { WideNavigation } from '../header-responsive-lab/WideNavigation';
import { pillNavThemes } from '../../components/navigation/PillNav';
import { usePreferences } from '../../app/PreferencesProvider';
import { currentRoute, routeLabels } from '../../app/routes';
import { ToolWorkspace } from '../../tools/ToolWorkspace';
import { toolRoutes } from '../../tools/registry';
import { CompactNavigation } from '../header-responsive-lab/CompactNavigation';
import { studies, tokenStyles, type VisualVariant } from './design';
import { DashboardContext } from './DashboardContext';

// Isolated scene adapter from approved C2. Navigation and controls remain shared.
export function VisualScene({ visual }: { visual: VisualVariant }) {
  const variant = 'C2';
  const preferences = usePreferences();
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 1180px)').matches);
  const [route, setRoute] = useState(currentRoute);
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [top, setTop] = useState(100);
  const header = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLElement>(null);
  const description = studies.find(v => v.id === visual)!;
  // Preserve the approved C2 focus-return timing; the overlay is nonmodal.
  const close = (restore = false) => { setOpen(false); if (restore) requestAnimationFrame(() => toggle.current?.focus({ preventScroll: true })); };
  const changeControls = (id: string | null) => { setOpenId(id); if (id) setOpen(false); };
  useEffect(() => {
    const query = matchMedia('(max-width: 1180px)');
    const resize = () => { setCompact(query.matches); setOpen(false); setOpenId(null); };
    query.addEventListener('change', resize);
    const navigate = () => { setRoute(currentRoute()); setOpen(false); setOpenId(null); requestAnimationFrame(() => content.current?.focus({ preventScroll: true })); };
    window.addEventListener('hashchange', navigate);
    return () => { query.removeEventListener('change', resize); window.removeEventListener('hashchange', navigate); };
  }, []);
  useLayoutEffect(() => {
    if (!bar.current) return;
    const update = () => {
      const bottom = bar.current!.getBoundingClientRect().bottom;
      setTop(Math.ceil(bottom + 12));
      const viewport = window.visualViewport;
      const available = (viewport ? viewport.height + viewport.offsetTop : window.innerHeight) - bottom - 28;
      header.current?.style.setProperty('--hr-overlay-height', `${Math.max(0, available)}px`);
    };
    const observer = new ResizeObserver(update); observer.observe(bar.current); update();
    // C2's scrollable overlay follows the actual available visual viewport.
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [compact]);
  const trigger = <button ref={toggle} type="button" className="hr-trigger" aria-label={open ? 'Zavřít navigaci' : 'Otevřít navigaci'} aria-expanded={open} aria-controls="responsive-navigation" onClick={() => { setOpenId(null); setOpen(!open); }} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpenId(null); setOpen(true); } }}>
    <span className="hr-burger" data-open={open}><i/><i/></span><span>Menu</span><span className="hr-current">{routeLabels[route]}</span>
  </button>;
  const brand = <a href="#dashboard" className="hr-brand" aria-label="O₂ Axolotl – dashboard" onClick={() => { close(); setOpenId(null); }}><BrandMark/></a>;
  return <div className="hr-scene vu-scene" data-visual={visual} data-vu-theme={preferences.resolvedTheme} data-variant={variant} data-compact={compact} data-motion={preferences.reducedMotion ? 'reduced' : 'full'} style={{ ...pillNavThemes[preferences.resolvedTheme], ...tokenStyles(visual, preferences.resolvedTheme) } as CSSProperties}>
    <header ref={header} className="hr-header axolotl-header-frame" aria-label="Ovládání Axolotlu">
      <div ref={bar} className="hr-bar axolotl-header-bar">
        {!compact ? <WideNavigation route={route} openId={openId} setOpenId={changeControls}/> : <>{brand}<div className="hr-command">{trigger}</div></>}
        <HeaderControls layout="inline" openId={openId} setOpenId={changeControls} idPrefix="visual-lab"/>
      </div>
      {compact && <CompactNavigation open={open} variant={variant} route={route} top={top} trigger={toggle} close={close} select={() => { close(); requestAnimationFrame(() => content.current?.focus({ preventScroll: true })); }}/>}
    </header>
    <main ref={content} className="hr-workspace" tabIndex={-1} aria-label="Pracovní plocha">
      {toolRoutes[route] ? <ToolWorkspace route={route}/> : <DashboardContext name={description.name} visual={visual}/>}
    </main>
  </div>;
}
