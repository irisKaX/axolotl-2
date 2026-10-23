import { Field, Select, Switch } from "../../../design-system/library";
import { componentOptions, type Category, type Entry } from "./model";
import { propertyOptions, variantOptions } from "./model";
export function ChoiceControl({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onValueChange} options={options} />
    </Field>
  );
}
export function ComponentControl({
  category,
  ...props
}: {
  category: Category;
  value: string;
  onValueChange: (v: string) => void;
}) {
  return (
    <ChoiceControl
      label="Komponenta"
      options={componentOptions(category)}
      {...props}
    />
  );
}
export function PropertyControl({
  entry,
  property,
  ...props
}: {
  entry: Entry;
  property: string;
  label: string;
  value: string;
  onValueChange: (v: string) => void;
}) {
  return (
    <ChoiceControl options={propertyOptions(entry, property)} {...props} />
  );
}
export function VariantControl({
  entry,
  ...props
}: {
  entry: Entry;
  label: string;
  value: string;
  onValueChange: (v: string) => void;
}) {
  return <ChoiceControl options={variantOptions(entry)} {...props} />;
}
export function BooleanControl({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <Switch
      label={label}
      checked={value}
      onChange={(e) => onValueChange(e.currentTarget.checked)}
    />
  );
}
