import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "../components/Icon";
import { Settings } from "./Settings";
import { UrlPicker } from "./UrlPicker";
import { useDisclosure } from "./useDisclosure";
import { usePreferences } from "./PreferencesProvider";

import { pillNavThemes } from "../components/navigation/PillNav";
import type { DisclosureProps } from "./useDisclosure";
// Retained for Header Lab; its styles are loaded by HeaderPreview.

export type HeaderVariant = "unified" | "spatial";
const clockFormat = new Intl.DateTimeFormat("cs-CZ", { timeZone: "Europe/Prague", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dateFormat = new Intl.DateTimeFormat("cs-CZ", { timeZone: "Europe/Prague", weekday: "short", day: "numeric", month: "numeric", year: "numeric" });

function HeaderClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  return <time className="axolotl-header-clock" dateTime={now.toISOString()} title="Čas a datum v Praze" aria-live="off">
    <span>{clockFormat.format(now)}</span><small>{dateFormat.format(now)}</small>
  </time>;
}

function Notifications({ openId, setOpenId, prefix }: { openId: string | null; setOpenId: (id: string | null) => void; prefix: string }) {
  const menu = useDisclosure("notifications", openId, setOpenId);
  return <div className="axolotl-header-notifications" ref={menu.root} {...menu.rootProps}>
    <button type="button" className="axolotl-header-icon-button" ref={menu.trigger} {...menu.triggerProps} aria-label="Upozornění" title="Upozornění" aria-controls={`${prefix}-notifications`}>
      <Icon name="bell" />
    </button>
    <section className="axolotl-header-notification-panel" id={`${prefix}-notifications`} data-axolotl-panel hidden={!menu.open} aria-label="Upozornění">
      <div className="axolotl-header-panel-heading"><h3>Upozornění</h3><button type="button" onClick={() => menu.close(true)} aria-label="Zavřít upozornění">×</button></div>
      <div className="axolotl-header-empty-bell"><Icon name="bell" /></div>
      <p><strong>Zatím žádná upozornění</strong></p>
      <p>Zdroj upozornění zatím není připojený.</p>
    </section>
  </div>;
}

export function HeaderControls({ variant = "unified", layout = "stacked", openId, setOpenId, idPrefix = "axolotl" }: DisclosureProps & { variant?: HeaderVariant; layout?: "stacked" | "inline"; idPrefix?: string }) {
  const prefix = idPrefix;
  const prefs = usePreferences();
  const root = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const point = useRef({ x: 50, y: 0 });
  function stopLighting() {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    root.current?.style.removeProperty("--header-pointer-x");
    root.current?.style.removeProperty("--header-pointer-y");
    root.current?.style.removeProperty("--header-pointer-on");
  }
  useEffect(() => {
    stopLighting();
    return stopLighting;
  }, [prefs.reducedMotion, variant]);
  return <div className="axolotl-header-controls" data-layout={layout} data-variant={variant} data-menu-open={!!openId} data-header-theme={prefs.resolvedTheme} data-motion={prefs.reducedMotion ? "reduced" : "full"} ref={root} style={pillNavThemes[prefs.resolvedTheme] as CSSProperties}
    onPointerMove={event => {
      if (variant !== "spatial" || prefs.reducedMotion || event.pointerType !== "mouse") return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      point.current = { x: (event.clientX - rect.left) / rect.width * 100, y: (event.clientY - rect.top) / rect.height * 100 };
      if (raf.current !== null) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        root.current?.style.setProperty("--header-pointer-x", `${point.current.x}%`);
        root.current?.style.setProperty("--header-pointer-y", `${point.current.y}%`);
        root.current?.style.setProperty("--header-pointer-on", "1");
      });
    }} onPointerLeave={stopLighting}>
    {layout === "inline" && <UrlPicker openId={openId} setOpenId={setOpenId} idPrefix={prefix} />}
    <div className="axolotl-header-control-row">
      <HeaderClock />
      <span className="axolotl-header-divider" aria-hidden="true" />
      <Notifications openId={openId} setOpenId={setOpenId} prefix={prefix} />
      <Settings openId={openId} setOpenId={setOpenId} idPrefix={prefix} />
      <label className="axolotl-header-theme" title={prefs.resolvedTheme === "dark" ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}>
        <input id={`${prefix}-theme-toggle`} type="checkbox" aria-label="Tmavý režim" checked={prefs.resolvedTheme === "dark"} onChange={event => prefs.setPreference("theme", event.target.checked ? "dark" : "light")} />
        <span className="axolotl-header-theme-track" aria-hidden="true"><span className="axolotl-header-theme-orb" /></span>
      </label>
    </div>
    {layout === "stacked" && <UrlPicker openId={openId} setOpenId={setOpenId} idPrefix={prefix} />}
  </div>;
}
