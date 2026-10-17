import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { BrandMark } from '../../components/BrandLogo';
import { HeaderControls } from '../../app/HeaderControls';
import { WideNavigation } from './WideNavigation';
import { pillNavThemes } from '../../components/navigation/PillNav';
import { usePreferences } from '../../app/PreferencesProvider';
import { currentRoute, routeLabels } from '../../app/routes';
import { ToolWorkspace } from '../../tools/ToolWorkspace';
import { toolRoutes } from '../../tools/registry';
import { CompactNavigation } from './CompactNavigation';
import { variants, type Variant } from './variants';

export function Scene({ variant }: { variant: Variant }) {
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
  const description = variants.find(v => v.id === variant)!;
  // Wait until the native modal is unmounted: its inert background rejects focus.
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
    const update = () => setTop(Math.ceil(bar.current!.getBoundingClientRect().bottom + 12));
    const observer = new ResizeObserver(update); observer.observe(bar.current); update();
    return () => observer.disconnect();
  }, [compact]);
  const trigger = <button ref={toggle} type="button" className="hr-trigger" aria-label={open ? 'Zavřít navigaci' : 'Otevřít navigaci'} aria-expanded={open} aria-controls="responsive-navigation" aria-haspopup={variant === 'B' ? 'dialog' : undefined} onClick={() => { setOpenId(null); setOpen(!open); }} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpenId(null); setOpen(true); } }}>
    <span className="hr-burger" data-open={open}><i/><i/></span>{variant === 'C' && <><span>Menu</span><span className="hr-current">{routeLabels[route]}</span></>}
  </button>;
  const brand = <a href="#dashboard" className="hr-brand" aria-label="O₂ Axolotl – dashboard" onClick={() => { close(); setOpenId(null); }}><BrandMark/></a>;
  return <div className="hr-scene" data-variant={variant} data-compact={compact} data-motion={preferences.reducedMotion ? 'reduced' : 'full'} style={pillNavThemes[preferences.resolvedTheme] as CSSProperties}>
    <header ref={header} className="hr-header axolotl-header-frame" aria-label="Ovládání Axolotlu">
      <div ref={bar} className="hr-bar axolotl-header-bar">
        {!compact ? <WideNavigation route={route} openId={openId} setOpenId={changeControls}/> : variant === 'C' ? <>{brand}<div className="hr-command">{trigger}</div></> : <div className="hr-dock">{variant === 'B' ? <>{trigger}{brand}</> : <>{brand}{trigger}</>}</div>}
        <HeaderControls layout="inline" openId={openId} setOpenId={changeControls} idPrefix="responsive-lab"/>
      </div>
      {compact && open && <CompactNavigation variant={variant} route={route} top={top} trigger={toggle} close={close} select={() => { close(); requestAnimationFrame(() => content.current?.focus({ preventScroll: true })); }}/>}
    </header>
    <main ref={content} className="hr-workspace" tabIndex={-1} aria-label="Pracovní plocha">
      {toolRoutes[route] ? <ToolWorkspace route={route}/> : <div className="hr-context">
        <div className="hr-context-top"><span>O2 AXOLOTL / {routeLabels[route]?.toUpperCase()}</span><span>HEADER STUDY 01</span></div>
        <span className="hr-context-letter">{variant}</span><h1>{description.name}</h1><p>{compact ? description.description : 'Široký viewport: původní plná navigace. Zúžením okna vyzkoušej kompaktní řešení.'}</p>
        <div className="hr-context-line"/><div className="hr-context-bottom"><span>Pracovní plocha pro zkoušku navigace</span><span>Experiment · čeká na výběr</span></div>
      </div>}
    </main>
  </div>;
}
