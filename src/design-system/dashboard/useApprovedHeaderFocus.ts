import { useEffect, type RefObject } from 'react';

/** The approved desktop styling hides ordinary panel close buttons. The shared
 * Header's default initial-focus ref can still point at that hidden button.
 * Keep this integration local to the catalog; hover must never move focus. */
export function useApprovedHeaderFocus(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const frames = new Set<number>();
    const repairFocus = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && !['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return;
      const trigger = (event.target as Element).closest<HTMLElement>('button[aria-haspopup="dialog"]');
      if (!trigger || !root.current?.contains(trigger)) return;
      const frame = requestAnimationFrame(() => {
        frames.delete(frame);
        const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
        if (!panel || trigger.getAttribute('aria-expanded') !== 'true') return;
        if (panel.contains(document.activeElement) && (document.activeElement as HTMLElement).checkVisibility()) return;
        // Match the shared Header's preference for the current/primary item,
        // then the first visible control, exactly as in the approved Playground.
        const preferred = panel.querySelector<HTMLElement>('[aria-current="page"], [data-primary-focus]');
        const target = preferred?.checkVisibility() ? preferred : Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select')).find(el => el.checkVisibility());
        target?.focus({ preventScroll: true });
      });
      frames.add(frame);
    };
    document.addEventListener('keydown', repairFocus, true);
    document.addEventListener('click', repairFocus, true);
    return () => {
      document.removeEventListener('keydown', repairFocus, true);
      document.removeEventListener('click', repairFocus, true);
      frames.forEach(cancelAnimationFrame);
    };
  }, [root]);
}
