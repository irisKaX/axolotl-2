import { useEffect, useRef, useState } from "react";

const FRAME_MS = Math.ceil(1000 / 12);

/** Advances only while the office is visible and motion is enabled. */
export function useOfficeClock({ paused }: { paused: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== "hidden");
  const [inViewport, setInViewport] = useState(() => typeof IntersectionObserver === "undefined");
  const running = !paused && pageVisible && inViewport;

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", updateVisibility);
    updateVisibility();

    const element = ref.current;
    const observer = typeof IntersectionObserver === "undefined" || !element ? null : new IntersectionObserver((entries) => {
      const entry = entries.find((item) => item.target === element);
      if (entry) setInViewport(entry.isIntersecting);
    });
    if (element) observer?.observe(element);

    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    let previous = performance.now();
    let timer: ReturnType<typeof setTimeout>;
    let disposed = false;
    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const delta = Math.max(0, now - previous);
      previous = now;
      setElapsedMs((elapsed) => elapsed + delta);
      timer = setTimeout(tick, FRAME_MS);
    };
    timer = setTimeout(tick, FRAME_MS);
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [running]);

  return { elapsedMs, running, ref };
}
