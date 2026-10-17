import { useEffect, useRef, useState, type RefObject, type KeyboardEvent, type CSSProperties } from 'react';
import { Icon } from '../../components/Icon';
import { groups } from '../../app/routes';
import type { Variant } from './variants';

export function CompactNavigation({ variant, route, top, trigger, close, select }: {
  variant: Variant; route: string; top: number; trigger: RefObject<HTMLButtonElement | null>;
  close: (restore?: boolean) => void; select: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState<string[]>(variant === 'C' ? groups.map(g => g.id) : []);
  const modal = variant === 'B';
  const closeRef = useRef(close); closeRef.current = close;
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    panel.current?.querySelector<HTMLElement>('a,button')?.focus({ preventScroll: true });
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
  }, [modal, trigger]);
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
  const content = <div ref={panel} id="responsive-navigation" className={`hr-panel hr-panel-${variant}`} onKeyDown={keys}>
    <div className="hr-panel-heading"><div><span>AXOLOTL / NAVIGACE</span><strong>{variant === 'C' ? 'Kam se vydáme?' : 'Tvůj pracovní prostor'}</strong></div><button type="button" className="hr-close" aria-label="Zavřít nabídku" onClick={() => close(true)}>×</button></div>
    <nav aria-label="Kompaktní navigace">
      <a className="hr-home" href="#dashboard" aria-current={route === 'dashboard' ? 'page' : undefined} onClick={select}><Icon name="home"/><span>Dashboard</span><span aria-hidden="true">↗</span></a>
      <div className="hr-groups">{groups.map((group, index) => {
        const open = expanded.includes(group.id);
        return <section className="hr-group" key={group.id}>
          <button type="button" className="hr-group-toggle" aria-expanded={open} aria-controls={`hr-group-${group.id}`} onClick={() => setExpanded(old => open ? old.filter(id => id !== group.id) : [...old, group.id])}>
            <span className="hr-group-number" aria-hidden="true">0{index + 1}</span><span>{group.label}</span><Icon name="chevron"/>
          </button>
          <ul id={`hr-group-${group.id}`} hidden={!open}>{group.items.map(item => <li key={item.route}>
            <a href={`#${item.route}`} aria-current={route === item.route ? 'page' : undefined} onClick={select}><Icon name={item.icon}/><span>{item.label}</span></a>
          </li>)}</ul>
        </section>;
      })}</div>
    </nav>
    <div className="hr-panel-footer"><span>{variant === 'B' ? 'Zpět do aplikace zavřením panelu' : 'Vyber nástroj nebo pokračuj v práci'}</span><kbd>esc</kbd></div>
  </div>;
  if (!modal) return content;
  return <dialog className="hr-drawer" ref={dialog} aria-label="Navigace Axolotlu" style={{ top, height: `calc(100dvh - ${top + 16}px)`, '--hr-drawer-top': `${top - 6}px` } as CSSProperties} onCancel={event => { event.preventDefault(); close(true); }} onClick={event => { if (event.target === event.currentTarget) close(true); }}>{content}</dialog>;
}
