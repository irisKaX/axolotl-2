import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "../components/Icon";
import { BrandMark } from "../components/BrandLogo";
import PillNav, { pillNavThemes, type PillNavLinkProps } from "../components/navigation/PillNav";
import { groups } from "./routes";
import { usePreferences } from "./PreferencesProvider";
import { useDisclosure } from "./useDisclosure";
import { HeaderControls } from "./HeaderControls";
export interface DisclosureProps {
  openId: string | null;
  setOpenId: (id: string | null) => void;
}
function NavGroup({
  group,
  route,
  pillProps,
  children,
  mobile,
  closeMenu,
  ...props
}: DisclosureProps & { group: (typeof groups)[number]; route: string; pillProps: PillNavLinkProps; children: ReactNode; mobile: boolean; closeMenu: () => void }) {
  const menu = useDisclosure(group.id, props.openId, props.setOpenId);
  return (
    <div className="axolotl-nav-group axolotl-pill-group" data-mobile={mobile || undefined} ref={menu.root} {...menu.rootProps}>
      <button
        {...pillProps}
        className={`${pillProps.className} axolotl-pill-trigger`}
        type="button"
        aria-current={group.items.some((item) => item.route === route) ? "true" : undefined}
        id={`axolotl-nav-${group.id}-toggle`}
        ref={menu.trigger}
        {...menu.triggerProps}
        aria-controls={`axolotl-nav-${group.id}-dropdown`}
        data-axolotl-active={group.items.some((item) => item.route === route)}
      >
        {children}
      </button>
      <div
        className="axolotl-nav-dropdown"
        id={`axolotl-nav-${group.id}-dropdown`}
        data-axolotl-panel
        hidden={!menu.open}
      >
        <ul
          className="axolotl-nav-list"
          aria-labelledby={`axolotl-nav-${group.id}-toggle`}
        >
          {group.items.map((item) => (
            <li key={item.route}>
              <a
                className="axolotl-nav-link"
                href={`#${item.route}`}
                aria-current={route === item.route ? "page" : undefined}
                onClick={() => {
                  menu.close();
                  closeMenu();
                  document.getElementById("axolotl-workspace")?.focus();
                }}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
export function Header({ route }: { route: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const preferences = usePreferences();
  useEffect(() => setOpenId(null), [route]);
  return (
    <>
      <svg
        className="axolotl-icon-definitions"
        width="0"
        height="0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="axolotl-icon-gradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="12"
            x2="24"
            y2="12"
          >
            <stop
              offset="0%"
              style={{ stopColor: "var(--axolotl-settings-accent-start)" }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "var(--axolotl-settings-accent-end)" }}
            />
          </linearGradient>
        </defs>
      </svg>
      <header className="axolotl-header" aria-label="Ovládání Axolotlu">
        <div className="axolotl-header-bar" style={pillNavThemes[preferences.resolvedTheme] as CSSProperties}>
        <div className="axolotl-navigation">
          <PillNav
            logo={<BrandMark />}
            logoAlt="O₂ Axolotl – dashboard"
            logoHref="#dashboard"
            ariaLabel="Hlavní navigace"
            theme={preferences.resolvedTheme}
            reducedMotion={preferences.reducedMotion}
            itemStyle="pill"
            hoverEffect="fill"
            indicator="pill"
            highlightColor="#7c3aed"
            highlightTextColor="#ffffff"
            intro={false}
            activeHref={route === "dashboard" ? "#dashboard" : `#${groups.find((group) => group.items.some((item) => item.route === route))?.id ?? route}`}
            items={[
              { label: "Dashboard", ariaLabel: "Dashboard", href: "#dashboard", icon: <Icon name="home" />, iconOnly: true },
              ...groups.map((group) => ({
                label: group.label,
                href: `#${group.id}`,
                icon: <Icon name={group.id === "osobni" ? "profile" : group.id === "media" ? "obrazky" : "shield"} />,
                trailing: <Icon name="chevron" className="axolotl-nav-chevron" />,
              })),
            ]}
            onItemClick={() => setOpenId(null)}
            onLogoClick={() => setOpenId(null)}
            onMenuToggle={() => setOpenId(null)}
            renderItem={(item, pillProps, content, mobile, closeMenu) => {
              const group = groups.find((candidate) => item.href === `#${candidate.id}`);
              return group ? <NavGroup group={group} route={route} openId={openId} setOpenId={setOpenId} pillProps={pillProps} mobile={mobile} closeMenu={closeMenu}>{content}</NavGroup> : undefined;
            }}
          />
        </div>
        <HeaderControls layout="inline" openId={openId} setOpenId={setOpenId} />
        </div>
      </header>
    </>
  );
}
