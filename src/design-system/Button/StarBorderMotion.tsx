import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
  type ReactNode,
} from "react";
import StarBorder from "./vendor/StarBorder";

const HostContext = createContext<HTMLButtonElement | null>(null);

/** Attach the unmodified engine to the existing button. No nested interactive node. */
const MotionHost = forwardRef<HTMLButtonElement, { children?: ReactNode }>(
  function MotionHost({ children }, ref) {
    const host = useContext(HostContext);
    useImperativeHandle(ref, () => host!, [host]);
    // The Button owns className, surface and semantics; upstream supplies the canvas.
    return <>{children}</>;
  },
);

export type StarBorderOptions = {
  color?: string;
  /** Seconds per orbit, minimum 0.3. */ duration?: number;
};

export function StarBorderMotion({
  host,
  reducedMotion,
  color = "#7C3AED",
  duration = 4,
}: StarBorderOptions & {
  host: HTMLButtonElement;
  reducedMotion: boolean;
}) {
  const [environment, setEnvironment] = useState<{
    theme: "dark" | "light";
    quiet: boolean;
    radius: number;
  } | null>(null);
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = matchMedia("(forced-colors: active)");
    const read = () =>
      setEnvironment({
        radius: parseFloat(getComputedStyle(host).borderTopLeftRadius) || 0,
        theme:
          host.closest("[data-theme]")?.getAttribute("data-theme") === "light"
            ? "light"
            : "dark",
        quiet:
          reduce.matches ||
          contrast.matches ||
          document.hidden ||
          Boolean(host.closest('[data-motion="reduced"]')),
      });
    const observer = new MutationObserver(read);
    for (let node: HTMLElement | null = host; node; node = node.parentElement) {
      observer.observe(node, {
        attributes: true,
        attributeFilter: ["data-theme", "data-motion", "data-design"],
      });
    }
    reduce.addEventListener("change", read);
    contrast.addEventListener("change", read);
    document.addEventListener("visibilitychange", read);
    read();
    return () => {
      observer.disconnect();
      reduce.removeEventListener("change", read);
      contrast.removeEventListener("change", read);
      document.removeEventListener("visibilitychange", read);
    };
  }, [host]);
  if (!environment || environment.quiet || reducedMotion) return null;
  const seconds = Number.isFinite(duration) ? Math.max(0.3, duration) : 4;
  return (
    <HostContext.Provider value={host}>
      <StarBorder
        as={MotionHost}
        color={color}
        duration={seconds}
        radius={environment.radius}
        theme={environment.theme}
        stars={2}
        hover="brighten"
        clickPulse={false}
        sparkle={false}
      />
    </HostContext.Provider>
  );
}
