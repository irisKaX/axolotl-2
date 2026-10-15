import { useEffect, useRef } from "react";
import { usePreferences } from "./PreferencesProvider";
export function CursorEffects() {
  const { cursor, reducedMotion, resolvedTheme } = usePreferences();
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = layer.current;
    if (!root || !cursor || reducedMotion) return;
    const halo = document.createElement("div");
    halo.className = "axolotl-cursor-halo";
    root.append(halo);
    const particles = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
    const colors = ["#0050ff", "#8154c9", "#c76b47"];
    let idle: ReturnType<typeof setTimeout>,
      last = 0,
      x = 0,
      y = 0;
    const remove = (particle: HTMLElement) => {
      clearTimeout(particles.get(particle));
      particles.delete(particle);
      particle.remove();
    };
    function clear() {
      particles.forEach((_, particle) => remove(particle));
      clearTimeout(idle);
      halo.style.opacity = "0";
    }
    function particle(event: PointerEvent, burst = false, index = 0) {
      if (particles.size >= 80) return;
      const el = document.createElement("span"),
        angle = (index / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.55,
        distance = 22 + Math.random() * 24;
      const size = burst
        ? 2 + Math.random() * 2
        : resolvedTheme === "light"
          ? 3.6
          : 2 + Math.random();
      const duration = burst ? 560 : 650,
        delay = burst ? Math.random() * 45 : 0;
      el.className = `axolotl-cursor-particle ${burst ? "axolotl-cursor-spark" : "axolotl-cursor-trail"}`;
      Object.assign(el.style, {
        left: `${event.clientX}px`,
        top: `${event.clientY}px`,
        width: `${size}px`,
        height: `${size}px`,
      });
      for (const [key, value] of Object.entries({
        dx: `${burst ? Math.cos(angle) * distance : Math.random() * 14 - 7}px`,
        dy: `${burst ? Math.sin(angle) * distance : 6 + Math.random() * 14}px`,
        duration: `${duration}ms`,
        delay: `${delay}ms`,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))
        el.style.setProperty(`--axolotl-cursor-${key}`, value);
      el.addEventListener("animationend", () => remove(el), { once: true });
      root!.append(el);
      particles.set(
        el,
        setTimeout(() => remove(el), duration + delay + 100),
      );
    }
    function move(event: PointerEvent) {
      if (event.pointerType !== "mouse" || document.hidden) return;
      halo.style.transform = `translate(${event.clientX - 24}px,${event.clientY - 24}px)`;
      halo.style.opacity = ".8";
      clearTimeout(idle);
      idle = setTimeout(() => {
        halo.style.opacity = "0";
      }, 180);
      if (
        event.timeStamp - last < 32 ||
        Math.hypot(event.clientX - x, event.clientY - y) < 3
      )
        return;
      last = event.timeStamp;
      x = event.clientX;
      y = event.clientY;
      particle(event);
    }
    const click = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button === 0)
        for (let i = 0; i < 12; i++) particle(event, true, i);
    };
    const visibility = () => {
      if (document.hidden) clear();
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerdown", click);
    document.addEventListener("pointerleave", clear);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", clear);
    return () => {
      clear();
      halo.remove();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", click);
      document.removeEventListener("pointerleave", clear);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", clear);
    };
  }, [cursor, reducedMotion, resolvedTheme]);
  return (
    <div
      ref={layer}
      className="axolotl-cursor-layer"
      aria-hidden="true"
      hidden={!cursor || reducedMotion}
    />
  );
}
