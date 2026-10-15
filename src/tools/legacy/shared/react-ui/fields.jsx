import { cloneElement, useId } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus, ChevronDown, ChevronUp } from 'lucide-react';

export function Field({ id, label, hint, error, children }) {
  const generated = useId(), controlId = id || generated;
  const noteId = `${controlId}-note`;
  return <div className="ax-field"><label htmlFor={controlId}>{label}</label>{cloneElement(children, { id: controlId, 'aria-invalid': error ? true : undefined, 'aria-describedby': [children.props['aria-describedby'], (hint || error) && noteId].filter(Boolean).join(' ') || undefined })}{(hint || error) && <p id={noteId} className={error ? 'ax-field-error' : 'ax-field-hint'}>{error || hint}</p>}</div>;
}

export function Select({ id, options, placeholder, className = '', 'aria-describedby': describedBy, 'aria-invalid': invalid, 'aria-label': label, ...props }) {
  return <SelectPrimitive.Root {...props}>
    <SelectPrimitive.Trigger id={id} aria-describedby={describedBy} aria-invalid={invalid} aria-label={label} className={`ax-select ${className}`}><SelectPrimitive.Value placeholder={placeholder} /><SelectPrimitive.Icon><ChevronDown size={16} aria-hidden="true" /></SelectPrimitive.Icon></SelectPrimitive.Trigger>
    <SelectPrimitive.Portal><SelectPrimitive.Content className="ax-ui ax-select-menu" data-runtime-control="native" position="popper" sideOffset={6}>
      <SelectPrimitive.ScrollUpButton className="ax-select-scroll"><ChevronUp size={16} aria-hidden="true" /></SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport>{options.map(option => <SelectPrimitive.Item key={option.value} value={option.value} disabled={option.disabled} className="ax-select-option"><SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText><SelectPrimitive.ItemIndicator><Check size={16} aria-hidden="true" /></SelectPrimitive.ItemIndicator></SelectPrimitive.Item>)}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="ax-select-scroll"><ChevronDown size={16} aria-hidden="true" /></SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content></SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}

export function Checkbox({ id, label, ...props }) {
  const generated = useId(), controlId = id || generated;
  return <div className="ax-checkbox-field"><CheckboxPrimitive.Root {...props} id={controlId} className="ax-checkbox"><CheckboxPrimitive.Indicator>{props.checked==='indeterminate'?<Minus size={14} aria-hidden="true"/>:<Check size={14} aria-hidden="true" />}</CheckboxPrimitive.Indicator></CheckboxPrimitive.Root><label htmlFor={controlId}>{label}</label></div>;
}
