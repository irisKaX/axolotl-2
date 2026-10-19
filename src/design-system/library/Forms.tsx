import {
  forwardRef,
  useId,
  useEffect,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  Field as ToolField,
  Checkbox as ToolCheckbox,
} from "../../tools/legacy/shared/react-ui/fields.jsx";
import { useDesignSystem } from "./Provider";
export type ControlSize = "small" | "medium" | "large";
/** Reuse the actual production field's label/error/description association. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id?: string;
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactElement;
}) {
  return (
    <ToolField id={id} label={label} hint={hint} error={error}>
      {children}
    </ToolField>
  );
}
export const Input = forwardRef<
  HTMLInputElement,
  Omit<ComponentProps<"input">, "size"> & { size?: ControlSize }
>(function Input({ size = "medium", className = "", ...props }, ref) {
  return (
    <input
      {...props}
      ref={ref}
      data-size={size}
      className={`ds-input ${className}`}
    />
  );
});
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<"textarea"> & { size?: ControlSize }
>(function Textarea({ size = "medium", className = "", ...props }, ref) {
  return (
    <textarea
      rows={4}
      {...props}
      ref={ref}
      data-size={size}
      className={`ds-input ds-textarea ${className}`}
    />
  );
});
type Option = { value: string; label: string; disabled?: boolean };
export function Select({
  options,
  size = "medium",
  id,
  placeholder = "Vyber možnost",
  ...props
}: ComponentProps<typeof SelectPrimitive.Root> & {
  options: Option[];
  size?: ControlSize;
  id?: string;
  placeholder?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const env = useDesignSystem();
  const [localOpen, setLocalOpen] = useState(props.defaultOpen ?? false);
  const open = props.open ?? localOpen;
  function changeOpen(value: boolean) {
    setLocalOpen(value);
    props.onOpenChange?.(value);
  }
  // Installed Radix packages use different DismissableLayer versions. Own Escape at
  // the window boundary so closing this list never also dismisses its parent dialog.
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      changeOpen(false);
    };
    window.addEventListener("keydown", escape, true);
    return () => window.removeEventListener("keydown", escape, true);
  });
  const {
    "aria-label": label,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    ...root
  } = props;
  return (
    <SelectPrimitive.Root {...root} open={open} onOpenChange={changeOpen}>
      <SelectPrimitive.Trigger
        data-ds-select-trigger
        id={id}
        className="ds-input ds-select"
        data-size={size}
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown size={16} aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal container={env.portal ?? undefined}>
        <SelectPrimitive.Content
          data-ds-select
          className="axo-ds-scope ds-select-menu"
          data-theme={env.theme}
          data-motion={env.reducedMotion ? "reduced" : "full"}
          position="popper"
          sideOffset={6}
          collisionPadding={12}
        >
          <SelectPrimitive.ScrollUpButton className="ds-select-scroll">
            <ChevronUp size={16} />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport>
            {options.map((o) => (
              <SelectPrimitive.Item
                className="ds-select-item"
                key={o.value}
                value={o.value}
                disabled={o.disabled}
              >
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check size={16} aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="ds-select-scroll">
            <ChevronDown size={16} />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
export function Checkbox({
  label,
  hint,
  error,
  id,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  checked: boolean | "indeterminate";
  onCheckedChange: (value: boolean | "indeterminate") => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}) {
  const generated = useId(),
    controlId = id || generated,
    note = hint || error;
  return (
    <div className="ds-choice-field">
      <ToolCheckbox
        {...props}
        id={controlId}
        label={label}
        aria-describedby={note ? controlId + "-note" : undefined}
        aria-invalid={!!error || undefined}
      />
      {note && (
        <p id={controlId + "-note"} className={error ? "ds-error" : "ds-hint"}>
          {note}
        </p>
      )}
    </div>
  );
}
export function RadioGroup({
  label,
  options,
  value,
  onValueChange,
  name,
  disabled,
  error,
  hint,
}: {
  label: string;
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <fieldset
      className="ds-radio-group"
      disabled={disabled}
      aria-describedby={error || hint ? id + "-note" : undefined}
      aria-invalid={!!error || undefined}
    >
      <legend>{label}</legend>
      {options.map((o) => (
        <label key={o.value} className="ds-choice">
          <input
            type="radio"
            name={name || id}
            value={o.value}
            checked={value === o.value}
            disabled={o.disabled}
            onChange={() => onValueChange(o.value)}
          />
          <span>{o.label}</span>
        </label>
      ))}
      {(error || hint) && (
        <p id={id + "-note"} className={error ? "ds-error" : "ds-hint"}>
          {error || hint}
        </p>
      )}
    </fieldset>
  );
}
export function Switch({
  label,
  hint,
  error,
  ...props
}: Omit<ComponentProps<"input">, "type" | "size"> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const generated = useId(),
    id = props.id || generated;
  return (
    <div className="ds-choice-field">
      <label className="ds-choice ds-switch">
        <input
          {...props}
          id={id}
          type="checkbox"
          role="switch"
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? id + "-note" : undefined}
        />
        <span className="ds-switch-track" aria-hidden="true" />
        <span>{label}</span>
      </label>
      {(error || hint) && (
        <p id={id + "-note"} className={error ? "ds-error" : "ds-hint"}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
export function Slider({
  label,
  hint,
  error,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
}: {
  label: string;
  hint?: string;
  error?: string;
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="ds-slider">
      <label htmlFor={id}>
        {label}
        <span aria-hidden="true">{value}</span>
      </label>
      <input
        id={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onValueChange(e.currentTarget.valueAsNumber)}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? id + "-note" : undefined}
      />
      {(error || hint) && (
        <p id={id + "-note"} className={error ? "ds-error" : "ds-hint"}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
