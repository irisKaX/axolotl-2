import { forwardRef, useCallback, useImperativeHandle, useRef, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import { StarBorderMotion, type StarBorderOptions } from './StarBorderMotion';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'destructive';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonMotion = 'none' | 'star-border';
type NativeProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'dangerouslySetInnerHTML' | 'aria-busy'>;
type AccessibleIcon = { 'aria-label': string; 'aria-labelledby'?: string } | { 'aria-labelledby': string; 'aria-label'?: string };
export type ButtonProps = NativeProps & {
  size?: ButtonSize;
  motion?: ButtonMotion;
  starBorder?: StarBorderOptions;
  loading?: boolean;
  /** Visual replacement only; accessible name remains the action's name. */
  loadingLabel?: string;
  /** Inherit the nearest data-theme when omitted. No application provider required. */
  theme?: 'dark' | 'light';
  /** Can reduce motion, never override the user's OS preference. */
  reducedMotion?: boolean;
} & (
  { variant: 'icon'; icon: ReactElement; children?: never } & AccessibleIcon |
  { variant?: Exclude<ButtonVariant, 'icon'>; icon?: ReactElement; children: ReactNode }
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'secondary', size = 'medium', motion = 'none', starBorder,
  icon, children, loading = false, loadingLabel, disabled = false,
  reducedMotion = false, theme, type = 'button', className = '',
  onClick, onClickCapture, 'aria-disabled': ariaDisabled, ...native
}, forwardedRef) {
  const root = useRef<HTMLButtonElement>(null);
  const [host, setHost] = useState<HTMLButtonElement | null>(null);
  const attach = useCallback((node: HTMLButtonElement | null) => { root.current = node; setHost(node); }, []);
  useImperativeHandle(forwardedRef, () => root.current!, []);
  const blocked = disabled || loading || ariaDisabled === true || ariaDisabled === 'true';
  const guard = (event: MouseEvent<HTMLButtonElement>, handler?: typeof onClick) => {
    if (blocked) { event.preventDefault(); event.stopPropagation(); return; }
    handler?.(event);
  };
  return <button {...native} ref={attach} type={type} disabled={disabled}
    aria-disabled={blocked || undefined} aria-busy={loading || undefined}
    className={('axo-ds-button ' + className).trim()}
    data-variant={variant} data-size={size} data-motion-variant={motion}
    data-loading={loading || undefined} data-theme={theme}
    data-motion={reducedMotion ? 'reduced' : undefined}
    data-has-icon={Boolean(icon) || variant === 'icon' || undefined}
    onClick={event => guard(event, onClick)} onClickCapture={event => guard(event, onClickCapture)}>
    {host && motion === 'star-border' && !blocked &&
      <StarBorderMotion host={host} reducedMotion={reducedMotion} {...starBorder} />}
    {(icon || variant === 'icon') && <span className="axo-ds-button__icon" aria-hidden="true">
      {loading ? <Spinner /> : icon}
    </span>}
    {variant !== 'icon' && <span className="axo-ds-button__label">
      <span className={loading && loadingLabel ? 'axo-ds-button__invisible' : undefined}>{children}</span>
      {loadingLabel && <span className={'axo-ds-button__loading-label' + (!loading ? ' axo-ds-button__invisible' : '')} aria-hidden="true">{loadingLabel}</span>}
    </span>}
    {loading && !icon && variant !== 'icon' && <span className="axo-ds-button__loading-overlay" aria-hidden="true"><Spinner /></span>}
  </button>;
});

function Spinner() {
  return <svg className="axo-ds-button__spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="12" cy="12" r="9" opacity=".22" />
    <path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round" />
  </svg>;
}
