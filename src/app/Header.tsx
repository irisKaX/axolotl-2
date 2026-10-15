import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { BrandLogo } from "../components/BrandLogo";
import { groups } from "./routes";
import { usePreferences } from "./PreferencesProvider";
import { useDisclosure } from "./useDisclosure";
import { Settings } from "./Settings";
import { UrlPicker } from "./UrlPicker";
export interface DisclosureProps {
  openId: string | null;
  setOpenId: (id: string | null) => void;
}
const timeFormat = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: "Europe/Prague",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const dateFormat = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: "Europe/Prague",
  weekday: "long",
  day: "numeric",
  month: "numeric",
  year: "numeric",
});
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setNow(new Date());
    const id = setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <time
      className="axolotl-clock"
      dateTime={now.toISOString()}
      title="Čas a datum v Praze"
      aria-live="off"
    >
      <span className="axolotl-clock-time">{timeFormat.format(now)}</span>
      <span className="axolotl-clock-date">{dateFormat.format(now)}</span>
    </time>
  );
}
function NavGroup({
  group,
  route,
  ...props
}: DisclosureProps & { group: (typeof groups)[number]; route: string }) {
  const menu = useDisclosure(group.id, props.openId, props.setOpenId);
  return (
    <div className="axolotl-nav-group" ref={menu.root} {...menu.rootProps}>
      <button
        className="axolotl-nav-trigger"
        id={`axolotl-nav-${group.id}-toggle`}
        ref={menu.trigger}
        {...menu.triggerProps}
        aria-controls={`axolotl-nav-${group.id}-dropdown`}
        data-axolotl-active={group.items.some((item) => item.route === route)}
      >
        {group.label}
        <Icon name="chevron" className="axolotl-nav-chevron" />
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
        <nav className="axolotl-navigation" aria-label="Hlavní navigace">
          <BrandLogo onNavigate={() => setOpenId(null)} />
          <a
            className="axolotl-nav-home"
            href="#dashboard"
            aria-label="Dashboard"
            title="Dashboard"
            aria-current={route === "dashboard" ? "page" : undefined}
            onClick={() => setOpenId(null)}
          >
            <Icon name="home" />
          </a>
          {groups.map((group) => (
            <NavGroup
              key={group.id}
              group={group}
              route={route}
              openId={openId}
              setOpenId={setOpenId}
            />
          ))}
        </nav>
        <div className="axolotl-controls">
          <Clock />
          <button
            className="axolotl-notifications-trigger"
            aria-label="Upozornění"
            title="Upozornění"
            disabled
          >
            <Icon name="bell" className="axolotl-settings-icon" />
          </button>
          <Settings openId={openId} setOpenId={setOpenId} />
          <label
            className="axolotl-theme-control"
            title={
              preferences.resolvedTheme === "dark"
                ? "Přepnout na světlý režim"
                : "Přepnout na tmavý režim"
            }
          >
            <input
              className="axolotl-theme-input"
              id="axolotl-theme-toggle"
              type="checkbox"
              aria-label="Tmavý režim"
              checked={preferences.resolvedTheme === "dark"}
              onChange={(e) =>
                preferences.setPreference(
                  "theme",
                  e.target.checked ? "dark" : "light",
                )
              }
            />
            <span className="axolotl-theme-track" aria-hidden="true" />
          </label>
        </div>
        <UrlPicker openId={openId} setOpenId={setOpenId} />
      </header>
    </>
  );
}
