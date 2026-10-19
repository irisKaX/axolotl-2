import { useEffect, useRef, type CSSProperties } from "react";
import { useDesignSystem } from "./Provider";
import "./halo.css";

export const haloIntensities = ["soft", "spatial", "cinematic"] as const;
export type HaloIntensity = (typeof haloIntensities)[number];
export const haloEffects = [
  "spotlight",
  "edge",
  "tilt",
  "parallax",
  "ambient",
  "sheen",
  "lift",
] as const;
export type HaloEffect = (typeof haloEffects)[number];
export type HaloOptions = {
  intensity?: HaloIntensity;
  effects?: Partial<Record<HaloEffect, boolean>>;
  /** CSS color; catalog choices resolve from the existing paints registry. */
  accent?: string;
  disabled?: boolean;
};
const profiles = {
  soft: { tilt: 0, shift: 0, lift: 0 },
  spatial: { tilt: 3.5, shift: 4, lift: 4 },
  cinematic: { tilt: 10, shift: 12, lift: 8 },
};
export function haloSettings(
  options: HaloOptions,
  fallback: HaloIntensity = "soft",
) {
  const intensity = options.intensity ?? fallback;
  const enabled = Object.fromEntries(
    haloEffects.map((key) => [
      key,
      options.effects?.[key] ??
        (intensity === "soft" ? key === "edge" || key === "ambient" : true),
    ]),
  ) as Record<HaloEffect, boolean>;
  return { intensity, enabled, profile: profiles[intensity] };
}
/** Original Axolotl implementation: pointer events update CSS, never React state. */
export function useHalo<T extends HTMLElement>(
  options: HaloOptions | undefined,
  fallback: HaloIntensity = "soft",
) {
  const ref = useRef<T>(null);
  const { reducedMotion } = useDesignSystem();
  const settings = haloSettings(options ?? {}, fallback);
  const effects = haloEffects.filter((key) => settings.enabled[key]).join(" ");
  const intensity = settings.intensity;
  const active = !!options;
  const disabled = !!options?.disabled;
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const enabled = new Set(effects.split(" "));
    const profile = profiles[intensity];
    let frame = 0,
      previous = 0,
      visible = true,
      inside = false;
    let bounds: DOMRect | null = null;
    const current = { x: 0.5, y: 0.5, hot: 0, press: 0 };
    const target = { ...current };
    const permitted = () =>
      effects.length > 0 &&
      fine.matches &&
      !reduced.matches &&
      !reducedMotion &&
      !disabled &&
      visible &&
      !document.hidden;
    const write = () => {
      const nx = current.x * 2 - 1,
        ny = current.y * 2 - 1;
      const hot = current.hot;
      const values = {
        "--halo-x": `${(current.x * 100).toFixed(2)}%`,
        "--halo-y": `${(current.y * 100).toFixed(2)}%`,
        "--halo-hot": hot.toFixed(4),
        "--halo-edge": (
          hot *
          (0.18 + 0.82 * Math.max(Math.abs(nx), Math.abs(ny)))
        ).toFixed(4),
        "--halo-angle": `${((Math.atan2(ny, nx) * 180) / Math.PI + 90).toFixed(2)}deg`,
        "--halo-rx": `${(enabled.has("tilt") ? -ny * profile.tilt * hot : 0).toFixed(3)}deg`,
        "--halo-ry": `${(enabled.has("tilt") ? nx * profile.tilt * hot : 0).toFixed(3)}deg`,
        "--halo-px": `${(enabled.has("parallax") ? nx * profile.shift * hot : 0).toFixed(3)}px`,
        "--halo-py": `${(enabled.has("parallax") ? ny * profile.shift * hot : 0).toFixed(3)}px`,
        "--halo-lift": `${(enabled.has("lift") ? -profile.lift * hot : 0).toFixed(3)}px`,
        "--halo-scale": (1 - current.press * 0.018).toFixed(4),
      };
      for (const [key, value] of Object.entries(values))
        el.style.setProperty(key, value);
    };
    const tick = (now: number) => {
      frame = 0;
      if (!permitted()) {
        reset();
        return;
      }
      const dt = Math.min(50, previous ? now - previous : 16);
      previous = now;
      const mix = 1 - Math.exp(-dt / (inside ? 65 : 130));
      let unsettled = false;
      for (const key of ["x", "y", "hot", "press"] as const) {
        current[key] += (target[key] - current[key]) * mix;
        if (Math.abs(target[key] - current[key]) < 0.0007)
          current[key] = target[key];
        else unsettled = true;
      }
      write();
      if (unsettled) frame = requestAnimationFrame(tick);
      else {
        el.dataset.haloRunning = "false";
        el.style.removeProperty("will-change");
      }
    };
    const wake = () => {
      if (!permitted() || frame) return;
      previous = 0;
      el.dataset.haloRunning = "true";
      el.style.willChange = "transform";
      frame = requestAnimationFrame(tick);
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      inside = false;
      bounds = null;
      Object.assign(current, { x: 0.5, y: 0.5, hot: 0, press: 0 });
      Object.assign(target, current);
      write();
      el.dataset.haloRunning = "false";
      el.style.removeProperty("will-change");
      el.dataset.haloMotion = permitted() ? "enabled" : "static";
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !permitted()) return;
      if (!bounds) bounds = el.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      inside = true;
      target.x = Math.max(
        0,
        Math.min(1, (event.clientX - bounds.left) / bounds.width),
      );
      target.y = Math.max(
        0,
        Math.min(1, (event.clientY - bounds.top) / bounds.height),
      );
      target.hot = 1;
      wake();
    };
    const leave = () => {
      inside = false;
      bounds = null;
      Object.assign(target, { x: 0.5, y: 0.5, hot: 0, press: 0 });
      wake();
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || event.pointerType === "touch" || !permitted())
        return;
      target.press = 1;
      wake();
    };
    const up = () => {
      if (!target.press) return;
      target.press = 0;
      wake();
    };
    const visibility = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (!visible) reset();
      else el.dataset.haloMotion = permitted() ? "enabled" : "static";
    });
    visibility.observe(el);
    const resize = new ResizeObserver(reset);
    resize.observe(el);
    el.addEventListener("pointerenter", move);
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointercancel", reset);
    window.addEventListener("pointerup", up);
    window.addEventListener("blur", reset);
    window.addEventListener("scroll", reset, { capture: true, passive: true });
    document.addEventListener("visibilitychange", reset);
    fine.addEventListener("change", reset);
    reduced.addEventListener("change", reset);
    reset();
    return () => {
      reset();
      visibility.disconnect();
      resize.disconnect();
      el.removeEventListener("pointerenter", move);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointercancel", reset);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("blur", reset);
      window.removeEventListener("scroll", reset, true);
      document.removeEventListener("visibilitychange", reset);
      fine.removeEventListener("change", reset);
      reduced.removeEventListener("change", reset);
    };
  }, [active, disabled, effects, intensity, reducedMotion]);
  return {
    ref,
    "data-halo": active ? intensity : undefined,
    "data-halo-effects": active ? effects : undefined,
    "data-halo-disabled": active && disabled ? "true" : undefined,
    style: active
      ? ({ "--halo-accent": options?.accent ?? "#7C3AED" } as CSSProperties)
      : undefined,
  };
}
export function HaloLayers() {
  return (
    <span className="ds-halo-fx" aria-hidden="true">
      <span className="ds-halo-ambient" />
      <span className="ds-halo-spot" />
      <span className="ds-halo-edge" />
      <span className="ds-halo-sheen" />
    </span>
  );
}
