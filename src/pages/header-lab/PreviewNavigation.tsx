import { useId } from "react";
import type { DisclosureProps } from "../../app/Header";
import PillNav, { type PillNavLinkProps } from "../../components/navigation/PillNav";
import { Icon } from "../../components/Icon";
import { BrandMark } from "../../components/BrandLogo";
import { groups } from "../../app/routes";
import { usePreferences } from "../../app/PreferencesProvider";
import { useDisclosure } from "../../app/useDisclosure";
import type { ReactNode } from "react";

function PreviewGroup({ group, openId, setOpenId, pillProps, children, closeMenu, mobile }: {
  group: (typeof groups)[number]; openId: string | null; setOpenId: (id: string | null) => void;
  pillProps: PillNavLinkProps; children: ReactNode; closeMenu: () => void; mobile: boolean;
}) {
  const menu = useDisclosure(group.id, openId, setOpenId);
  const id = `axolotl-lab-nav-${useId().replace(/:/g, "")}`;
  return <div className="axolotl-nav-group axolotl-pill-group" data-mobile={mobile || undefined} ref={menu.root} {...menu.rootProps}>
    <button {...pillProps} className={`${pillProps.className} axolotl-pill-trigger`} type="button" id={`${id}-trigger`} ref={menu.trigger} {...menu.triggerProps} aria-controls={`${id}-panel`}>{children}</button>
    <div className="axolotl-nav-dropdown" id={`${id}-panel`} data-axolotl-panel hidden={!menu.open}>
      <ul className="axolotl-nav-list" aria-labelledby={`${id}-trigger`}>
        {group.items.map(item => <li key={item.route}><a className="axolotl-nav-link" href={`#${item.route}`} onClick={() => { menu.close(); closeMenu(); }}><Icon name={item.icon} /><span>{item.label}</span></a></li>)}
      </ul>
    </div>
  </div>;
}

/** The existing PillNav and its production configuration; no new left-side design. */
export function PreviewNavigation({ openId, setOpenId }: DisclosureProps) {
  const prefs = usePreferences();
  return <div className="axolotl-lab-navigation">
    <PillNav logo={<BrandMark />} logoAlt="O₂ Axolotl – dashboard" logoHref="#dashboard" ariaLabel="Hlavní navigace náhledu"
      theme={prefs.resolvedTheme} reducedMotion={prefs.reducedMotion} itemStyle="pill" hoverEffect="fill" indicator="pill" highlightColor="#7c3aed" highlightTextColor="#ffffff" intro={false} activeHref="#dashboard"
      items={[
        { label: "Dashboard", ariaLabel: "Dashboard", href: "#dashboard", icon: <Icon name="home" />, iconOnly: true },
        ...groups.map(group => ({ label: group.label, href: `#${group.id}`, icon: <Icon name={group.id === "osobni" ? "profile" : group.id === "media" ? "obrazky" : "shield"} />, trailing: <Icon name="chevron" className="axolotl-nav-chevron" /> })),
      ]}
      onItemClick={() => setOpenId(null)} onLogoClick={() => setOpenId(null)} onMenuToggle={() => setOpenId(null)}
      renderItem={(item, pillProps, children, mobile, closeMenu) => {
        const group = groups.find(candidate => item.href === `#${candidate.id}`);
        return group ? <PreviewGroup group={group} openId={openId} setOpenId={setOpenId} pillProps={pillProps} mobile={mobile} closeMenu={closeMenu}>{children}</PreviewGroup> : undefined;
      }} />
  </div>;
}
