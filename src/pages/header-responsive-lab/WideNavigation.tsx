import { useId, type ReactNode } from 'react';
import PillNav, { type PillNavLinkProps } from '../../components/navigation/PillNav';
import { BrandMark } from '../../components/BrandLogo';
import { Icon } from '../../components/Icon';
import { groups } from '../../app/routes';
import { useDisclosure } from '../../app/useDisclosure';
import { usePreferences } from '../../app/PreferencesProvider';
import type { DisclosureProps } from '../../app/Header';

function Group({ group, route, pillProps, children, mobile, closeMenu, ...disclosure }: DisclosureProps & {
  group: typeof groups[number]; route: string; pillProps: PillNavLinkProps; children: ReactNode; mobile: boolean; closeMenu: () => void;
}) {
  const menu = useDisclosure(group.id, disclosure.openId, disclosure.setOpenId);
  const id = useId();
  return <div className="axolotl-nav-group axolotl-pill-group" data-mobile={mobile || undefined} ref={menu.root} {...menu.rootProps}>
    <button {...pillProps} className={`${pillProps.className} axolotl-pill-trigger`} type="button" ref={menu.trigger} {...menu.triggerProps} id={`${id}-trigger`} aria-controls={`${id}-panel`} aria-current={group.items.some(i => i.route === route) ? 'true' : undefined}>{children}</button>
    <div className="axolotl-nav-dropdown" id={`${id}-panel`} data-axolotl-panel hidden={!menu.open}><ul className="axolotl-nav-list" aria-labelledby={`${id}-trigger`}>{group.items.map(item => <li key={item.route}><a href={`#${item.route}`} className="axolotl-nav-link" aria-current={item.route === route ? 'page' : undefined} onClick={() => { menu.close(); closeMenu(); }}><Icon name={item.icon}/><span>{item.label}</span></a></li>)}</ul></div>
  </div>;
}
/** Production PillNav configuration and disclosure hook; Lab-local routing state. */
export function WideNavigation({ route, ...disclosure }: DisclosureProps & { route: string }) {
  const prefs = usePreferences();
  const active = route === 'dashboard' ? '#dashboard' : `#${groups.find(g => g.items.some(i => i.route === route))?.id ?? route}`;
  return <div className="axolotl-lab-navigation"><PillNav logo={<BrandMark/>} logoAlt="O₂ Axolotl – dashboard" logoHref="#dashboard" ariaLabel="Hlavní navigace náhledu" theme={prefs.resolvedTheme} reducedMotion={prefs.reducedMotion} itemStyle="pill" hoverEffect="fill" indicator="pill" highlightColor="#7c3aed" highlightTextColor="#ffffff" intro={false} activeHref={active}
    items={[{ label: 'Dashboard', href: '#dashboard', icon: <Icon name="home"/>, iconOnly: true }, ...groups.map(group => ({ label: group.label, href: `#${group.id}`, icon: <Icon name={group.id === 'osobni' ? 'profile' : group.id === 'media' ? 'obrazky' : 'shield'}/>, trailing: <Icon name="chevron" className="axolotl-nav-chevron"/> }))]}
    onItemClick={() => disclosure.setOpenId(null)} onLogoClick={() => disclosure.setOpenId(null)} onMenuToggle={() => disclosure.setOpenId(null)}
    renderItem={(item, pillProps, children, mobile, closeMenu) => { const group = groups.find(g => item.href === `#${g.id}`); return group ? <Group {...disclosure} group={group} route={route} pillProps={pillProps} mobile={mobile} closeMenu={closeMenu}>{children}</Group> : undefined; }}/></div>;
}
