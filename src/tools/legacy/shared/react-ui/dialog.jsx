import * as Primitive from '@radix-ui/react-dialog';
import { cloneElement } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './components.jsx';

// A portal is its own React-owned surface; legacy form enhancers must skip it.
export function Dialog({ id, title, description, trigger, open, onOpenChange, children, onCloseAutoFocus, className = '' }) {
  return <Primitive.Root open={open} onOpenChange={onOpenChange}>
    {trigger && <Primitive.Trigger asChild>{cloneElement(trigger, { 'aria-controls': id })}</Primitive.Trigger>}
    <Primitive.Portal>
      <Primitive.Overlay className="ax-ui ax-dialog-overlay" />
      <Primitive.Content onCloseAutoFocus={onCloseAutoFocus} id={id} className={`ax-ui ax-dialog ${className}`} data-runtime-control="native" aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}>
        <div className="ax-dialog-heading">
          <Primitive.Title id={`${id}-title`}>{title}</Primitive.Title>
          <Primitive.Close asChild><IconButton icon={X} label="Zavřít" className="dialog-close" /></Primitive.Close>
        </div>
        {description && <Primitive.Description id={`${id}-description`} className="ax-dialog-description">{description}</Primitive.Description>}
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  </Primitive.Root>;
}
