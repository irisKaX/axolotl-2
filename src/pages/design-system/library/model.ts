import {
  lazy,
  type ComponentProps,
  type ComponentType,
  type ElementType,
  type LazyExoticComponent,
} from "react";
export type DesignState = "draft" | "approved";
export type ApprovalReference = { sourceCommit:string; previewCommit:string; scope:string[]; decision:string };
export type Variant = {
  approvalReference?: ApprovalReference;
  productionConsumers?: string[];
  id: string;
  label: string;
  design: DesignState;
  production: boolean;
  props: Record<string, unknown>;
};
export type Property = {
  kind: "select" | "boolean" | "range" | "text" | "callback" | "node";
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  note?: string;
};
export type Entry = {
  approvalReference?: ApprovalReference;
  name: string;
  label: string;
  source: string;
  component: ElementType;
  variants: Variant[];
  properties: Record<string, Property>;
  consumers: string;
  api: string;
  previewProps?: Record<string, unknown>;
};
export type PageProps = {
  category: Category;
  testMode: boolean;
  previewTheme?: "dark" | "light";
};
export type Category = {
  workspace?: boolean;
  isolatedTheme?: boolean;
  id: string;
  title: string;
  description: string;
  keyboard: string;
  entries: Entry[];
  load: () => Promise<{ default: ComponentType<PageProps> }>;
  Page: LazyExoticComponent<ComponentType<PageProps>>;
};
export type CategoryId = string;
/** Props and capability keys are checked against the real export at registration time. */
export function defineEntry<C extends ElementType>(
  component: C,
  config: Omit<
    Entry,
    "component" | "variants" | "properties" | "previewProps" | "label"
  > & {
    label?: string;
    variants: (Omit<Variant, "props"> & {
      props: Partial<ComponentProps<C>>;
    })[];
    properties: Partial<Record<keyof ComponentProps<C>, Property>>;
    previewProps?: Partial<ComponentProps<C>>;
  },
): Entry {
  return {
    ...config,
    label: config.label ?? config.name,
    component,
    properties: config.properties as Record<string, Property>,
  };
}
export function defineCategory(config: Omit<Category, "Page">): Category {
  return { ...config, Page: lazy(config.load) };
}
export function variant<P extends Record<string, unknown>>(
  id: string,
  label: string,
  props: P,
  design: DesignState = "draft",
  production = false,
) {
  return { id, label, props, design, production };
}
export const selectProperty = (values: string[]): Property => ({
  kind: "select",
  options: values.map((value) => ({ value, label: value })),
});
export const designLabel = (value: DesignState) =>
  value === "approved" ? "Schváleno" : "Návrh";
export function variantOptions(entry: Entry) {
  return entry.variants.map((v) => ({ value: v.id, label: v.label }));
}
export function propertyOptions(entry: Entry, prop: string) {
  const property = entry.properties[prop];
  if (property?.kind !== "select" || !property.options)
    throw new Error(`${entry.name}.${prop} is not a select property`);
  return property.options;
}

export function findEntry(name: string, list: Category[]): Entry {
  const entry = list
    .flatMap((c) => c.entries)
    .find((e) => e.name === name || e.label === name);
  if (!entry) throw new Error(`Unregistered component: ${name}`);
  return entry;
}
export function componentOptions(category: Category) {
  return category.entries.map((e) => ({ value: e.label, label: e.label }));
}
// Release build injects its exact source revision; unbuilt local dev links to the accepted source reference.
export const sourceUrl = (path: string) =>
  `https://github.com/irisKaX/axolotl-2/blob/${import.meta.env.VITE_SOURCE_COMMIT || '63bda318f5556b12b629016e821e08feb7374281'}/${path}`;
