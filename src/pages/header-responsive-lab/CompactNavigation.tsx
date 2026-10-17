import { useEffect, useLayoutEffect, useRef, useState, type RefObject, type KeyboardEvent, type CSSProperties } from 'react';
import { Icon } from '../../components/Icon';
import { groups } from '../../app/routes';
import { isCommandShelf, type Variant } from './variants';

export function CompactNavigation({ variant, route, top, trigger, close, select, open }: {
  variant: Variant; open: boolean; route: string; top: number; trigger: RefObject<HTMLButtonElement | null>;
  close: (restore?: boolean) => void; select: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const activeGroup = groups.find(group => group.items.some(item => item.route === route))?.id;
  const [expanded, setExpanded] = useState<string[]>(variant === 'C' ? groups.map(g => g.id) : []);
  const initialFocusPending = useRef(false);
  // Each C2 opening starts from the current page, never previous exploration.
  useLayoutEffect(() => {
    initialFocusPending.current = variant === 'C2' && open;
    if (initialFocusPending.current) setExpanded(activeGroup ? [activeGroup] : []);
  }, [variant, open, activeGroup]);
  // Wait for the restored group to commit, then focus before paint. A delayed
  // animation frame could steal the next keyboard action after opening.
  useLayoutEffect(() => {
    if (!initialFocusPending.current) return;
    const ready = activeGroup ? expanded.length === 1 && expanded[0] === activeGroup : expanded.length === 0;
    if (!ready) return;
    initialFocusPending.current = false;
    if (panel.current) panel.current.scrollTop = 0;
    const element = panel.current;
    if (!element) return;
    const active = variant === 'C2' && activeGroup ? element.querySelector<HTMLElement>('[aria-current=page]') : null;
    const target = active ?? element.querySelector<HTMLElement>('a,button');
    target?.focus({ preventScroll: true });
    // Reveal the current tool inside the overlay only, without scrolling
    // the document (or the Lab's containing iframe).
    if (active) {
      const itemBox = active.getBoundingClientRect();
      const panelBox = element.getBoundingClientRect();
      if (itemBox.bottom > panelBox.bottom - 16) element.scrollTop += itemBox.bottom - panelBox.bottom + 16;
      else if (itemBox.top < panelBox.top + 16) element.scrollTop -= panelBox.top + 16 - itemBox.top;
    }
  }, [variant, open, activeGroup, expanded]);
  const modal = variant === 'B';
  const closeRef = useRef(close); closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    if (modal) dialog.current?.showModal();
    if (variant !== 'C2') panel.current?.querySelector<HTMLElement>('a,button')?.focus({ preventScroll: true });
    const previousOverflow = document.body.style.overflow;
    if (modal) document.body.style.overflow = 'hidden';
    const outside = (event: PointerEvent) => {
      if (modal) return;
      if (!panel.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) closeRef.current(false);
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopPropagation(); closeRef.current(true);
    };
    const blur = (event: FocusEvent) => {
      if (!modal && !panel.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) closeRef.current(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    document.addEventListener('focusin', blur);
    return () => {
      if (modal) document.body.style.overflow = previousOverflow;
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('focusin', blur);
    };
  }, [modal, trigger, open, variant, activeGroup, route]);
  function keys(event: KeyboardEvent) {
    const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('a,button') ?? []).filter(el => !el.closest('[hidden]'));
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (modal && event.key === 'Tab') {
      if (event.shiftKey && at === 0) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && at === items.length - 1) { event.preventDefault(); items[0]?.focus(); }
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (at + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }
  const content = <div ref={panel} id="responsive-navigation" className={`hr-panel hr-panel-${variant}${variant === 'C2' ? ' hr-panel-C' : ''}`} data-open={open} inert={!open} aria-hidden={!open || undefined} onKeyDown={keys}>
    <div className="hr-panel-heading"><div><span>AXOLOTL / NAVIGACE</span><strong>{isCommandShelf(variant) ? 'Kam se vydáme?' : 'Tvůj pracovní prostor'}</strong></div><button type="button" className="hr-close" aria-label="Zavřít nabídku" onClick={() => close(true)}>×</button></div>
    <nav aria-label="Kompaktní navigace">
      <a className="hr-home" href="#dashboard" aria-current={route === 'dashboard' ? 'page' : undefined} onClick={select}><Icon name="home"/><span>Dashboard</span><span aria-hidden="true">{variant === 'C2' && route === 'dashboard' ? '✓' : '↗'}</span></a>
      <div className="hr-groups">{groups.map((group, index) => {
        const open = expanded.includes(group.id);
        return <section className="hr-group" key={group.id}>
          <button type="button" className="hr-group-toggle" aria-expanded={open} aria-controls={`hr-group-${group.id}`} onClick={() => setExpanded(old => old.includes(group.id) ? old.filter(id => id !== group.id) : variant === 'C2' ? [group.id] : [...old, group.id])}>
            <span className="hr-group-number" aria-hidden="true">0{index + 1}</span><span>{group.label}</span><Icon name="chevron"/>
          </button>
          <ul id={`hr-group-${group.id}`} hidden={!open}>{group.items.map(item => <li key={item.route}>
            <a href={`#${item.route}`} aria-current={route === item.route ? 'page' : undefined} onClick={select}><Icon name={item.icon}/><span>{item.label}</span>{variant === 'C2' && route === item.route && <span className="hr-active-indicator" aria-hidden="true">✓</span>}</a>
          </li>)}</ul>
        </section>;
      })}</div>
    </nav>
    <div className="hr-panel-footer"><span>{variant === 'B' ? 'Zpět do aplikace zavřením panelu' : 'Vyber nástroj nebo pokračuj v práci'}</span><kbd>esc</kbd></div>
  </div>;
  if (!modal) return content;
  return <dialog className="hr-drawer" ref={dialog} aria-label="Navigace Axolotlu" style={{ top, height: `calc(100dvh - ${top + 16}px)`, '--hr-drawer-top': `${top - 6}px` } as CSSProperties} onCancel={event => { event.preventDefault(); close(true); }} onClick={event => { if (event.target === event.currentTarget) close(true); }}>{content}</dialog>;
}
