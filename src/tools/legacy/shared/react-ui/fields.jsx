import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

export {Field,CheckboxControl as Checkbox} from '../../../../design-system/library/Forms';

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
