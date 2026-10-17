import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { FloatingFocusManager, FloatingPortal, autoUpdate, offset, safePolygon, shift, useClick, useDismiss, useFloating, useHover, useInteractions, useRole } from '@floating-ui/react';
import { usePreferences } from '../PreferencesProvider';
import s from './header.module.css';

type Open = { id: string; source: 'hover' | 'interaction' } | null;
type PopupContext = { active: Open; setActive: React.Dispatch<React.SetStateAction<Open>>; header: RefObject<HTMLElement | null> };
const Context = createContext<PopupContext | null>(null);
export function PopoverProvider({ children, header, route }: { children: ReactNode; header: RefObject<HTMLElement | null>; route: string }) {
  const [active, setActive] = useState<Open>(null);
  useEffect(() => setActive(null), [route]);
  return <Context.Provider value={{ active, setActive, header }}>{children}</Context.Provider>;
}
export function useHeaderPopovers() {
  const value = useContext(Context);
  if (!value) throw new Error('PopoverProvider required');
  return value;
}

type Trigger = (props: Record<string, unknown>, ref: (node: HTMLElement | null) => void, open: boolean) => ReactNode;
export function Popover({ id, title, trigger, children, wide = false, hover = true, align = 'end' }: {
  id: string; title: string; trigger: Trigger; children: (close: (restore?: boolean) => void) => ReactNode;
  wide?: boolean; hover?: boolean; align?: 'start' | 'end';
}) {
  const { active, setActive, header } = useHeaderPopovers();
  const prefs = usePreferences();
  const uid = useId();
  const open = active?.id === id;
  const source = active?.source;
  const triggerElement = useRef<HTMLElement | null>(null);
  const first = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  function close(restore = false) {
    setActive(previous => previous?.id === id ? null : previous);
    if (restore) triggerElement.current?.focus({ preventScroll: true });
  }
  const floating = useFloating({
    open, placement: `bottom-${align}`, strategy: 'fixed',
    onOpenChange(next, _event, reason) {
      if (!next && reason === 'hover' && panel.current?.contains(document.activeElement)) return;
      if (next) setActive({ id, source: reason === 'hover' ? 'hover' : 'interaction' });
      else close(reason === 'escape-key');
    },
    middleware: [offset(12), shift({ padding: wide ? 12 : 16, crossAxis: false })],
    whileElementsMounted: autoUpdate,
  });
  const hoverInteraction = useHover(floating.context, { enabled: hover, mouseOnly: true, move: false, delay: { close: 150 }, handleClose: safePolygon({ blockPointerEvents: false }) });
  const click = useClick(floating.context);
  const dismiss = useDismiss(floating.context);
  const role = useRole(floating.context, { role: 'dialog' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hoverInteraction, click, dismiss, role]);
  const [geometry, setGeometry] = useState({ width: 350, height: 500 });

  useEffect(() => {
    if (!open) return;
    // Floating UI 0.27 uses button-role focus guards for Safari/VoiceOver but
    // provides no name prop. Name only our own guards; retain their focus logic
    // and Chromium/Firefox aria-hidden behavior. Remove this shim upstream
    // when FloatingPortal exposes accessible guard labels.
    const roots = [header.current, panel.current?.parentElement].filter((root): root is HTMLElement => !!root);
    const label = `Pokračovat v ovládání: ${title}`;
    const nameGuards = () => roots.forEach(root => root.querySelectorAll('[data-floating-ui-focus-guard]').forEach(guard => {
      if (guard.getAttribute('aria-label') !== label) guard.setAttribute('aria-label', label);
    }));
    const observer = new MutationObserver(nameGuards);
    roots.forEach(root => observer.observe(root, { childList:true, subtree:true }));
    nameGuards();
    return () => observer.disconnect();
  }, [open, title, header, floating.elements.floating]);

  useLayoutEffect(() => {
    if (!open || !triggerElement.current || !header.current) return;
    const trigger = triggerElement.current;
    const headerElement = header.current;
    const update = () => {
      const h = headerElement.getBoundingClientRect();
      floating.refs.setPositionReference({ contextElement: headerElement, getBoundingClientRect: () => {
        const bar = headerElement.getBoundingClientRect();
        const button = trigger.getBoundingClientRect();
        return new DOMRect(wide ? bar.x : button.x, bar.bottom, wide ? bar.width : button.width, 0);
      } });
      const viewport = window.visualViewport;
      const bottom = viewport ? viewport.height + viewport.offsetTop : window.innerHeight;
      const availableWidth = viewport?.width ?? window.innerWidth;
      setGeometry({ width: wide ? Math.min(h.width, availableWidth - 24) : Math.min(350, availableWidth - 32), height: Math.max(0, bottom - h.bottom - 28) });
      floating.update();
    };
    const observer = new ResizeObserver(update);
    observer.observe(headerElement); observer.observe(trigger); update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => { observer.disconnect(); window.removeEventListener('resize', update); window.removeEventListener('scroll', update); window.visualViewport?.removeEventListener('resize', update); window.visualViewport?.removeEventListener('scroll', update); };
  }, [open, wide, header, floating.refs, floating.update]);

  useEffect(() => {
    if (!open || source === 'hover') return;
    const target = first.current;
    const element = panel.current;
    if (!target || !element) return;
    const reveal = () => {
      const item = target.getBoundingClientRect(), box = element.getBoundingClientRect();
      if (item.bottom > box.bottom - 16) element.scrollTop += item.bottom - box.bottom + 16;
      else if (item.top < box.top + 16) element.scrollTop -= box.top + 16 - item.top;
    };
    const frame = requestAnimationFrame(reveal);
    return () => cancelAnimationFrame(frame);
  }, [open, source, geometry.height]);

  return <>
    {trigger(getReferenceProps({ 'aria-expanded': open, 'aria-controls': open ? `${uid}-panel` : undefined,
      onKeyDown(event: React.KeyboardEvent) { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setActive({ id, source: 'interaction' }); } },
    }), node => { triggerElement.current = node; floating.refs.setReference(node); }, open)}
    {open && <FloatingPortal><FloatingFocusManager context={floating.context} modal={false} initialFocus={source === 'hover' ? -1 : first} returnFocus={false} closeOnFocusOut>
      <div {...getFloatingProps()} ref={node => {
        panel.current = node; floating.refs.setFloating(node);
        first.current = node?.querySelector<HTMLElement>('[aria-current="page"], [data-primary-focus]') ?? node?.querySelector<HTMLElement>('button:not(:disabled), a[href], input, select') ?? node;
      }} id={`${uid}-panel`} aria-label={title} tabIndex={-1} data-header-panel={id} data-header-theme={prefs.resolvedTheme} data-motion={prefs.reducedMotion ? 'reduced' : 'full'} data-text-size={prefs.textSize}
        className={`${s.scope} ${s.panel}`} style={{ ...floating.floatingStyles, width: geometry.width, maxHeight: `max(0px, calc(${geometry.height}px - env(safe-area-inset-bottom, 0px)))`, '--axo-header-transform-origin': `${align} top` } as CSSProperties}>
        {children(close)}
      </div>
    </FloatingFocusManager></FloatingPortal>}
  </>;
}
