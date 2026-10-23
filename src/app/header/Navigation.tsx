import { useId, useState, type CSSProperties, type KeyboardEvent } from 'react';
import PillNav from '../../components/navigation/PillNav';
import { AnimatedAxolotlLogo } from '../../design-system/brand';
import { Icon } from '../../components/Icon';
import { groups, routeLabels } from '../routes';
import { usePreferences } from '../PreferencesProvider';
import { Popover, useHeaderPopovers } from './Popover';
import { PanelFooter, PanelHeading, PanelRow } from './PanelUI';
import s from './header.module.css';

function navigationKeys(event: KeyboardEvent) {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[data-nav-item]')).filter(el => !el.closest('[hidden]'));
  if (!items.length) return;
  event.preventDefault();
  const index = items.indexOf(document.activeElement as HTMLElement);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
  items[next]?.focus({ preventScroll: true });
  const panel = event.currentTarget.closest<HTMLElement>('[data-header-panel]');
  if (panel) {
    const row = items[next].getBoundingClientRect(), box = panel.getBoundingClientRect();
    if (row.bottom > box.bottom - 16) panel.scrollTop += row.bottom - box.bottom + 16;
    if (row.top < box.top + 16) panel.scrollTop -= box.top + 16 - row.top;
  }
}

function CompactPanel({ route, close, select }: { route: string; close: () => void; select: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(() => groups.find(g => g.items.some(i => i.route === route))?.id ?? null);
  const id = useId();
  return <>
    <PanelHeading title="Kam se vydáme?" eyebrow="AXOLOTL / NAVIGACE" close={close}/>
    <nav aria-label="Kompaktní navigace" onKeyDown={navigationKeys} data-navigation="compact">
      <div className={s.homeRow}><PanelRow href="#dashboard" icon="home" active={route === 'dashboard'} navigation onClick={select}>Dashboard</PanelRow></div>
      <div className={s.groups}>{groups.map((group, index) => <section key={group.id} className={s.group}>
        <button type="button" className={s.groupToggle} data-nav-item aria-expanded={expanded === group.id} aria-controls={`${id}-${group.id}`} onClick={() => setExpanded(old => old === group.id ? null : group.id)}>
          <span className={s.groupNumber} aria-hidden="true">0{index + 1}</span><span>{group.label}</span><Icon name="chevron"/>
        </button>
        <ul id={`${id}-${group.id}`} hidden={expanded !== group.id} className={s.list}>{group.items.map(item => <li key={item.route}>
          <PanelRow href={`#${item.route}`} icon={item.icon} active={item.route === route} onClick={select} navigation>{item.label}</PanelRow>
        </li>)}</ul>
      </section>)}</div>
    </nav>
    <PanelFooter>Vyber nástroj nebo pokračuj v práci</PanelFooter>
  </>;
}

export function Navigation({ route, compact, onNavigate }: { route: string; compact: boolean; onNavigate: () => void }) {
  const prefs = usePreferences();
  const { setActive } = useHeaderPopovers();
  const select = () => { setActive(null); onNavigate(); };
  if (compact) return <>
    <a className={s.brand} href="#dashboard" aria-label="O₂ Axolotl – dashboard" onClick={select}><AnimatedAxolotlLogo size="small" decorative paused={prefs.reducedMotion}/></a>
    <div className={s.menuSlot}><Popover id="navigation" title="Navigace" wide hover={false} align="start" trigger={(props, ref, open) =>
      <button {...props} ref={ref} type="button" className={s.menuTrigger} aria-label={open ? 'Zavřít navigaci' : 'Otevřít navigaci'}>
        <span className={s.burger} data-open={open} aria-hidden="true"><i/><i/></span><span>Menu</span><span className={s.current}>{routeLabels[route]}</span>
      </button>}>
      {close => <CompactPanel route={route} close={() => close(true)} select={select}/>}
    </Popover></div>
  </>;
  const active = route === 'dashboard' ? '#dashboard' : `#${groups.find(g => g.items.some(i => i.route === route))?.id ?? route}`;
  return <div className={s.desktopNavigation}><PillNav logo={<AnimatedAxolotlLogo size="small" decorative paused={prefs.reducedMotion}/>} logoHoverMotion={false} logoAlt="O₂ Axolotl – dashboard" logoHref="#dashboard" ariaLabel="Hlavní navigace" theme={prefs.resolvedTheme} reducedMotion={prefs.reducedMotion}
    collapse="never" itemStyle="pill" hoverEffect="fill" indicator="pill" highlightColor="#7c3aed" highlightTextColor="#ffffff" intro={false} activeHref={active} onLogoClick={select} onItemClick={select}
    style={{ '--pn-h':'48px', '--pn-inner':'48px', '--pn-pad':'0px', '--pn-x':'var(--axo-nav-padding)', '--pn-gap':'var(--axo-nav-gap)', '--pn-item-gap':'var(--axo-nav-gap)', '--pn-mark':'48px', '--pn-font':'calc(14px * var(--axo-text-scale))', '--pn-ring':'var(--axo-focus)' } as CSSProperties}
    items={[{ label:'Dashboard', ariaLabel:'Dashboard', href:'#dashboard', icon:<Icon name="home"/>, iconOnly:true }, ...groups.map(group => ({ label:group.label, href:`#${group.id}`, icon:<Icon name={group.id === 'osobni' ? 'profile' : group.id === 'media' ? 'obrazky' : 'shield'}/>, trailing:<Icon name="chevron"/> }))]}
    renderItem={(item, pillProps, children) => {
      const group = groups.find(g => item.href === `#${g.id}`);
      if (!group) return undefined;
      return <Popover id={`group:${group.id}`} title={group.label} align="start" trigger={(props, ref) => <button {...pillProps} {...props} ref={ref} type="button" className={`${pillProps.className} ${s.pillTrigger}`} aria-current={group.items.some(i => i.route === route) ? 'true' : undefined}>{children}</button>}>
        {close => <><PanelHeading title={group.label} close={() => close(true)}/><nav aria-label={group.label} data-navigation="desktop" onKeyDown={navigationKeys}><ul className={s.list}>{group.items.map(i => <li key={i.route}><PanelRow href={`#${i.route}`} active={i.route === route} icon={i.icon} onClick={select} navigation>{i.label}</PanelRow></li>)}</ul></nav><PanelFooter>Vyber nástroj</PanelFooter></>}
      </Popover>;
    }}/></div>;
}
