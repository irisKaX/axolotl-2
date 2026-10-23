import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { usePreferences } from '../PreferencesProvider';
import { Navigation } from './Navigation';
import { Popover, PopoverProvider, useHeaderPopovers } from './Popover';
import { Control, PanelFooter, PanelHeading } from './PanelUI';
import { SettingsPanel } from './SettingsPanel';
import { UrlControl } from './UrlControl';
import s from './header.module.css';
import {headerStatusStylesheet} from '../../design-system/tokens/theme';

const clock = new Intl.DateTimeFormat('cs-CZ', { timeZone:'Europe/Prague', hour:'2-digit', minute:'2-digit', hourCycle:'h23' });
const date = new Intl.DateTimeFormat('cs-CZ', { timeZone:'Europe/Prague', weekday:'short', day:'numeric', month:'numeric', year:'numeric' });
function HeaderClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const refresh = () => setNow(new Date()); const interval = setInterval(refresh, 1000); document.addEventListener('visibilitychange', refresh); return () => { clearInterval(interval); document.removeEventListener('visibilitychange', refresh); }; }, []);
  return <time dateTime={now.toISOString()} className={s.clock} title="Čas a datum v Praze" aria-live="off"><span>{clock.format(now)}</span><small>{date.format(now)}</small></time>;
}
function Actions({ onNavigate }: { onNavigate: () => void }) {
  const prefs = usePreferences();
  return <div className={s.actions}>
    <HeaderClock/><span className={s.divider} aria-hidden="true"/>
    <Popover id="notifications" title="Upozornění" trigger={(props, ref) => <Control {...props} ref={ref} label="Upozornění" icon="bell" className={s.bell}/>}>
      {close => <><PanelHeading title="Upozornění" close={() => close(true)}/><div className={s.empty}><Icon name="bell"/><h3>Zatím žádná upozornění</h3><p>Zdroj upozornění zatím není připojený.</p></div><PanelFooter>Upozornění Axolotlu</PanelFooter></>}
    </Popover>
    <Popover id="settings" title="Nastavení" trigger={(props, ref) => <Control {...props} ref={ref} label="Nastavení" icon="settings"/>}>
      {close => <SettingsPanel close={close} onNavigate={onNavigate}/>}
    </Popover>
    <label className={s.theme} title={prefs.resolvedTheme === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}>
      <input type="checkbox" aria-label="Tmavý režim" checked={prefs.resolvedTheme === 'dark'} onChange={event => prefs.setPreference('theme', event.target.checked ? 'dark' : 'light')}/>
      <span className={s.themeTrack} aria-hidden="true"><span className={s.themeOrb}/></span>
    </label>
  </div>;
}
function Layout({ route, onNavigate, header }: { route: string; onNavigate: () => void; header: React.RefObject<HTMLElement | null> }) {
  const prefs = usePreferences();
  const { setActive } = useHeaderPopovers();
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 1180px)').matches);
  const [reserved, setReserved] = useState(112);
  const lastCompact = useRef(compact);
  useLayoutEffect(() => {
    const query = matchMedia('(max-width: 1180px)');
    const update = () => {
      // Large text needs an earlier compact transition; one owner, no PillNav auto-collapse.
      const next = query.matches || (prefs.textSize === 'large' && window.innerWidth <= 1360);
      setCompact(next);
      if (next !== lastCompact.current) {
        const ownedFocus = header.current?.contains(document.activeElement) || document.activeElement?.closest('[data-header-panel]');
        setActive(null);
        if (ownedFocus) requestAnimationFrame(() => header.current?.querySelector<HTMLElement>(next ? '[aria-label="Otevřít navigaci"]' : 'a[href="#dashboard"]')?.focus({ preventScroll:true }));
        lastCompact.current = next;
      }
      if (header.current) setReserved(Math.ceil(header.current.getBoundingClientRect().bottom + 24));
    };
    query.addEventListener('change', update); window.addEventListener('resize', update);
    const observer = new ResizeObserver(update); if (header.current) observer.observe(header.current); update();
    return () => { query.removeEventListener('change', update); window.removeEventListener('resize', update); observer.disconnect(); };
  }, [prefs.textSize, setActive, header]);
  return <div style={{ height: reserved }} data-header-space>
    <header ref={header} className={`${s.scope} ${s.header}`} aria-label="Ovládání Axolotlu" data-compact={compact} data-header-theme={prefs.resolvedTheme} data-motion={prefs.reducedMotion ? 'reduced' : 'full'} data-text-size={prefs.textSize}>
      <Navigation route={route} compact={compact} onNavigate={onNavigate}/><UrlControl/><Actions onNavigate={onNavigate}/>
    </header>
  </div>;
}
export function AppHeader({ route, onNavigate }: { route: string; onNavigate: () => void }) {
  const header = useRef<HTMLElement>(null);
  return <><style data-header-status>{headerStatusStylesheet}</style><PopoverProvider header={header} route={route}><Layout header={header} route={route} onNavigate={onNavigate}/></PopoverProvider></>;
}
