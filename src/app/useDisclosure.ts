import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
/** Hover opens roots; descendants retain their own click actions. Click also supports touch. */
export function useDisclosure(
  id: string,
  openId: string | null,
  setOpenId: (id: string | null) => void,
) {
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const byHover = useRef(false);
  const currentOpenId = useRef(openId);
  currentOpenId.current = openId;
  const open = openId === id;
  const close = (focus = false) => {
    clearTimeout(timer.current);
    byHover.current = false;
    setOpenId(null);
    if (focus) trigger.current?.focus();
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) {
      clearTimeout(timer.current);
      byHover.current = false;
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: globalThis.PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpenId(null);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, setOpenId]);
  function keydown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (
      !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) ||
      ["SELECT", "INPUT", "TEXTAREA"].includes(
        (event.target as HTMLElement).tagName,
      )
    )
      return;
    event.preventDefault();
    setOpenId(id);
    requestAnimationFrame(() => {
      const items = Array.from(
        root.current?.querySelectorAll<HTMLElement>(
          "[data-axolotl-panel] a[href], [data-axolotl-panel] button:not(:disabled), [data-axolotl-panel] select, [data-axolotl-panel] input:not(:disabled)",
        ) ?? [],
      ).filter((el) => !el.closest("[hidden]"));
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : event.key === "ArrowDown"
              ? (index + 1) % items.length
              : index <= 0
                ? items.length - 1
                : index - 1;
      items[next]?.focus();
    });
  }
  return {
    root,
    trigger,
    open,
    close,
    triggerProps: {
      "aria-expanded": open,
      onClick: () => {
        if (open && byHover.current) byHover.current = false;
        else {
          byHover.current = false;
          setOpenId(open ? null : id);
        }
      },
    },
    rootProps: {
      onPointerEnter: (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        clearTimeout(timer.current);
        if (!open) {
          byHover.current = true;
          setOpenId(id);
        }
      },
      onPointerLeave: () => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          // A hidden menu can emit pointerleave after another category opened.
          if (currentOpenId.current !== id) return;
          if (
            !root.current
              ?.querySelector("[data-axolotl-panel]")
              ?.contains(document.activeElement)
          ) {
            byHover.current = false;
            setOpenId(null);
          }
        }, 150);
      },
      onBlur: (event: React.FocusEvent) => {
        // Clicking a label first blurs its neighbour to body (relatedTarget=null).
        // Keep it mounted for native label activation; outside clicks close above.
        if (event.relatedTarget && !root.current?.contains(event.relatedTarget as Node)) close();
      },
      onKeyDown: keydown,
    },
  };
}
