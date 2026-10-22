type DesignState = "draft" | "approved";
export type Paint = {
  id: string;
  name: string;
  kind: "solid" | "gradient";
  css: string;
  design: DesignState;
  production: boolean;
};
// Source of truth for display, live samples, approval evidence and clipboard.
// These are catalog options, never replacements for application tokens.
export const paints: readonly Paint[] = [
  {
    id: "purple",
    name: "Purple",
    kind: "solid",
    css: "#AC32E4",
    design: "draft",
    production: false,
  },
  {
    id: "black",
    name: "Black",
    kind: "solid",
    css: "#101014",
    design: "draft",
    production: false,
  },
  {
    id: "light",
    name: "Light",
    kind: "solid",
    css: "#F7F5FF",
    design: "draft",
    production: false,
  },
  {
    id: "o2-blue",
    name: "O2 Blue",
    kind: "solid",
    css: "#0050FF",
    design: "approved",
    production: true,
  },
  {
    id: "white",
    name: "White",
    kind: "solid",
    css: "#FFFFFF",
    design: "draft",
    production: false,
  },
  {
    id: "axolotl-violet",
    name: "Axolotl Violet",
    kind: "solid",
    css: "#7C3AED",
    design: "approved",
    production: true,
  },
  {
    id: "sunburst",
    name: "Sunburst",
    kind: "gradient",
    css: "linear-gradient(135deg, hsla(27, 100%, 68%, 1) 0%, hsla(53, 100%, 49%, 1) 90%)",
    design: "draft",
    production: false,
  },
  {
    id: "electric-blue",
    name: "Electric Blue",
    kind: "gradient",
    css: "linear-gradient(135deg, hsla(221, 100%, 50%, 1) 0%, hsla(221, 100%, 70%, 1) 90%)",
    design: "draft",
    production: false,
  },
  {
    id: "deep-ocean",
    name: "Deep Ocean",
    kind: "gradient",
    css: "linear-gradient(135deg, hsla(240, 100%, 27%, 1) 0%, hsla(223, 100%, 45%, 1) 100%)",
    design: "draft",
    production: false,
  },
  {
    id: "electric-violet",
    name: "Electric Violet",
    kind: "gradient",
    css: "linear-gradient(90deg, hsla(221, 100%, 50%, 1) 0%, hsla(286, 100%, 50%, 1) 100%)",
    design: "draft",
    production: false,
  },
  {
    id: "lime-energy",
    name: "Lime Energy",
    kind: "gradient",
    css: "linear-gradient(135deg, hsla(154, 100%, 43%, 1) 0%, hsla(53, 100%, 49%, 1) 100%)",
    design: "draft",
    production: false,
  },
  {
    id: "arctic-blue",
    name: "Arctic Blue",
    kind: "gradient",
    css: "linear-gradient(to right, #0acffe 0%, #495aff 100%)",
    design: "draft",
    production: false,
  },
  {
    id: "neon-purple",
    name: "Neon Purple",
    kind: "gradient",
    css: "linear-gradient(to top, #b224ef 0%, #7579ff 100%)",
    design: "draft",
    production: false,
  },
  {
    id: "ultraviolet",
    name: "Ultraviolet",
    kind: "gradient",
    css: "linear-gradient(-225deg, #AC32E4 0%, #7918F2 48%, #4801FF 100%)",
    design: "draft",
    production: false,
  },
];
export const getPaint = (id: string) => {
  const paint = paints.find((p) => p.id === id);
  if (!paint) throw new Error(`Unknown paint: ${id}`);
  return paint;
};
export const copyValue = (paint: Paint) =>
  paint.kind === "solid" ? paint.css : `background: ${paint.css};`;

/** CSS bindings used by consumers; values live only in the paint registry above. */
export const paletteVariables = Object.fromEntries(paints.map(p => [`--ds-paint-${p.id}`, p.css]));
