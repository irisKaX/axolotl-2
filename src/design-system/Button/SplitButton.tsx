import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  autoUpdate, flip, offset, shift, FloatingFocusManager, FloatingPortal,
  useClick, useDismiss, useFloating, useInteractions, useListNavigation, useRole, useTypeahead,
} from '@floating-ui/react';
import { Button, type ButtonProps } from './Button';
import { useDesignSystem } from '../library/Provider';
import './SplitButton.css';

export type SplitButtonItem = { id: string; label: string; onSelect: () => void; disabled?: boolean };
export type SplitButtonProps = Omit<Extract<ButtonProps, {children: ReactNode}>, 'children'> & {
  children: ReactNode;
  /** Accessible name of the independent menu trigger and its menu. */
  menuLabel: string;
  items: SplitButtonItem[];
};

/** Two native Buttons share size, variant, motion and blocking behavior. */
export const SplitButton = forwardRef<HTMLButtonElement, SplitButtonProps>(function SplitButton({
  children, menuLabel, items, variant = 'primary', size = 'medium', disabled = false,
  loading = false, motion, starBorder, reducedMotion, theme, ...primaryProps
}, ref) {
  const env = useDesignSystem();
  const blocked = disabled || loading || primaryProps['aria-disabled'] === true || primaryProps['aria-disabled'] === 'true';
  const [open, setOpen] = useState(false), [activeIndex, setActiveIndex] = useState<number | null>(null);
  const list = useRef<Array<HTMLElement | null>>([]);
  const labels = useRef<Array<string | null>>([]);
  labels.current = items.map(item => item.disabled ? null : item.label);
  const floating = useFloating({
    open: open && !blocked, onOpenChange: value => setOpen(value && !blocked),
    placement: 'bottom-end', strategy: 'fixed',
    middleware: [offset(8), flip({padding:12}), shift({padding:12})],
    whileElementsMounted: autoUpdate,
  });
  const {getReferenceProps, getFloatingProps, getItemProps} = useInteractions([
    useClick(floating.context, {enabled: !blocked}),
    useDismiss(floating.context, {bubbles: false}),
    useRole(floating.context, {role: 'menu'}),
    useListNavigation(floating.context, {
      listRef: list, activeIndex, onNavigate: setActiveIndex, loop: true,
      disabledIndices: items.flatMap((item, i) => item.disabled ? [i] : []),
    }),
    useTypeahead(floating.context, {listRef: labels, activeIndex, onMatch: setActiveIndex}),
  ]);
  useEffect(() => { if (blocked) setOpen(false); }, [blocked]);
  const shared = {variant, size, disabled, motion, starBorder, reducedMotion, theme};
  const parentDialog = floating.elements.domReference?.closest('[data-ds-modal]') as HTMLElement | null;
  return <>
    <span className="axo-ds-split" data-size={size}>
      <Button {...primaryProps} {...shared} ref={ref} loading={loading} data-split-part="action">{children}</Button>
      <Button {...getReferenceProps()} {...shared} ref={floating.refs.setReference}
        aria-label={menuLabel} aria-disabled={blocked || undefined} loading={loading}
        disabled={disabled || items.length === 0} data-split-part="menu" title={menuLabel}
        icon={<ChevronDown strokeWidth={1.7} aria-hidden="true" />}>{null}</Button>
    </span>
    {open && !blocked && <FloatingPortal root={parentDialog ?? env.portal ?? undefined}>
      <FloatingFocusManager context={floating.context} modal={false} returnFocus>
        <div {...getFloatingProps()} ref={floating.refs.setFloating} style={floating.floatingStyles}
          className="axo-ds-scope axo-ds-split-menu" data-theme={theme ?? env.theme}
          data-design={env.appearance} data-motion={reducedMotion || env.reducedMotion ? 'reduced' : 'full'}
          aria-label={menuLabel}>
          {items.map((item, index) => <Button key={item.id} variant="ghost" size={size}
            {...getItemProps({onClick: () => {setOpen(false); item.onSelect();}})}
            ref={node => {list.current[index] = node;}}
            role="menuitem" tabIndex={activeIndex === index ? 0 : -1} disabled={item.disabled}>
            {item.label}
          </Button>)}
        </div>
      </FloatingFocusManager>
    </FloatingPortal>}
  </>;
});
