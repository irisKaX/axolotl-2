import { forwardRef } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export const Button = forwardRef(function Button({ variant = 'secondary', className = '', children, ...props }, ref) {
  return <button type="button" {...props} ref={ref} data-variant={variant} className={`ax-button ax-button-${variant} ${className}`}>{children}</button>;
});

export const IconButton = forwardRef(function IconButton({ icon: Icon, label, className = '', ...props }, ref) {
  return <Button {...props} ref={ref} title={label} aria-label={label} className={`ax-icon-button ${className}`}><Icon className="icon" size={18} strokeWidth={1.8} aria-hidden="true" /></Button>;
});

export function Tooltip({ text, children }) {
  return <TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger><TooltipPrimitive.Portal><TooltipPrimitive.Content className="ax-ui ax-tooltip" sideOffset={7}>{text}<TooltipPrimitive.Arrow className="ax-tooltip-arrow" /></TooltipPrimitive.Content></TooltipPrimitive.Portal></TooltipPrimitive.Root>;
}
export const TooltipProvider = TooltipPrimitive.Provider;

export function Status({ children, state = 'neutral', className = '', ...props }) {
  return <span {...props} className={`ax-status ${className}`} data-state={state}><span className="ax-status-dot" aria-hidden="true" />{children}</span>;
}

export function Panel({ children, className = '', ...props }) {
  return <section {...props} className={`ax-panel ${className}`}>{children}</section>;
}

export function ToolHeader({ title, description, actions }) {
  return <div className="ax-tool-header"><div><h1>{title}</h1>{description && <p className="ax-tool-description">{description}</p>}</div>{actions}</div>;
}
