import type { ComponentProps, MouseEvent, ReactNode, Ref } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import s from './header.module.css';

export function Control({ label, icon, className = '', children, ...props }: ComponentProps<'button'> & { label: string; icon?: IconName }) {
  return <button type="button" {...props} aria-label={label} title={label} className={`${s.control} ${className}`}>
    {icon && <Icon name={icon}/>} {children}
  </button>;
}

export function PanelHeading({ title, close, back, eyebrow }: { title: string; close: () => void; back?: () => void; eyebrow?: string }) {
  return <div className={s.panelHeading}>
    {back && <Control label="Zpět do nastavení" icon="chevron" className={s.back} onClick={back} autoFocus/>}
    <div>{eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}<h2>{title}</h2></div>
    <Control label="Zavřít nabídku" className={s.close} onClick={close}><span aria-hidden="true">×</span></Control>
  </div>;
}

type RowProps = {
  children: ReactNode; icon?: IconName; href?: string; onClick?: (event: MouseEvent<HTMLElement>) => void;
  active?: boolean; selected?: boolean; disabled?: boolean; subtitle?: string; id?: string;
  rowRef?: Ref<HTMLButtonElement>; onFocus?: () => void; onBlur?: ComponentProps<'button'>['onBlur'];
  navigation?: boolean; trailing?: ReactNode;
  external?: boolean;
};
export function PanelRow({ children, icon, href, onClick, active, selected, disabled, subtitle, id, rowRef, onFocus, onBlur, navigation, trailing, external }: RowProps) {
  const content = <>{icon && <Icon name={icon}/>}<span className={s.rowText}><span>{children}</span>{subtitle && <small>{subtitle}</small>}</span>{active && <span className={s.check} aria-hidden="true">✓</span>}{trailing}</>;
  return href
    ? <a id={id} className={s.row} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} onClick={onClick} aria-current={active ? 'page' : undefined} data-nav-item={navigation || undefined}>{content}</a>
    : <button id={id} ref={rowRef} type="button" className={s.row} onClick={onClick} onFocus={onFocus} onBlur={onBlur} aria-pressed={selected} disabled={disabled} data-nav-item={navigation || undefined}>{content}</button>;
}

export function PanelFooter({ children }: { children: ReactNode }) {
  return <div className={s.panelFooter}>{children}<kbd>esc</kbd></div>;
}
