import "./legacy-header.css";
import { useState, type CSSProperties, type ReactNode } from "react";
import { PreferencesProvider, usePreferences } from "../../app/PreferencesProvider";
import { createPreferencesStore, type PreferencesStore } from "../../lib/preferences";
import { pillNavThemes } from "../../components/navigation/PillNav";
import { PreviewControls, type HeaderVariant } from "./PreviewControls";
import { PreviewNavigation } from "./PreviewNavigation";
import { CursorEffects } from "../../app/CursorEffects";

function PreviewSurface({ variant, full, children }: { variant: HeaderVariant; full?: boolean; children?: ReactNode }) {
  const prefs = usePreferences();
  const [openId, setOpenId] = useState<string | null>(null);
  const connected = full && variant === "unified";
  return <div className="axolotl-header-preview" data-header-theme={prefs.resolvedTheme} data-motion={prefs.reducedMotion ? "reduced" : "full"} data-text-size={prefs.textSize} data-full={full || undefined}
    style={pillNavThemes[prefs.resolvedTheme] as CSSProperties}>
    {!full && <div className="axolotl-lab-theme-caption"><span className="axolotl-lab-theme-dot" />{prefs.resolvedTheme === "dark" ? "Tmavý režim" : "Světlý režim"}<span>Živé ovládání</span></div>}
    <div className={connected ? "axolotl-header-frame" : undefined}>
    <div className={`axolotl-lab-header-composition${connected ? " axolotl-header-bar" : ""}`} data-connected={connected || undefined}>
      {full && <PreviewNavigation openId={openId} setOpenId={setOpenId} />}
      <PreviewControls variant={variant} inline={!!connected} disclosure={full ? { openId, setOpenId } : undefined} />
    </div>
    </div>
    {children}
    <CursorEffects />
  </div>;
}

export function HeaderPreview({ variant, theme, instance, full, children, store: suppliedStore }: {
  variant: HeaderVariant; theme: "dark" | "light"; instance: string; full?: boolean; children?: ReactNode; store?: PreferencesStore;
}) {
  const [store] = useState(() => suppliedStore ?? createPreferencesStore({ storagePrefix: `axolotl-header-lab-${instance}`, initialTheme: theme }));
  return <PreferencesProvider store={store} scoped><PreviewSurface variant={variant} full={full}>{children}</PreviewSurface></PreferencesProvider>;
}
