import { useSyncExternalStore } from "react";
import GlowCursor from "../components/effects/GlowCursor";
import { usePreferences } from "./PreferencesProvider";

const pointerQuery = "(any-pointer: fine)";
const hasMouse = () => window.matchMedia(pointerQuery).matches;
const subscribePointer = (listener: () => void) => {
  const media = window.matchMedia(pointerQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};

export function CursorEffects() {
  const { cursor, reducedMotion, resolvedTheme } = usePreferences();
  const finePointer = useSyncExternalStore(subscribePointer, hasMouse, () => false);
  if (!cursor || reducedMotion || !finePointer) return null;

  return (
    <GlowCursor
      className="axolotl-cursor-layer"
      aria-hidden="true"
      color={resolvedTheme === "dark" ? "#5f8bff" : "#0050ff"}
      secondaryColor="#9466de"
      theme={resolvedTheme}
      intensity={1.3}
      trailWidth={3}
      linger={1.4}
      glow={1.2}
      hotspot={0.8}
      followSpeed={0.6}
      grain={0}
      clickBurst
      quality="medium"
      maxDevicePixelRatio={1.5}
    />
  );
}
