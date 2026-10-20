export const compositions = [
  {
    value: "centered",
    label: "Vyvážený střed",
    description: "Office mezi dvěma pracovními widgety.",
  },
  {
    value: "staggered",
    label: "Pracovní patra",
    description: "Levá zóna výše, pravá níže. Office zůstává uprostřed.",
  },
] as const;
export type Composition = (typeof compositions)[number]["value"];
export type Kind = "search" | "qr" | "generic";
export type Zone = "left" | "right" | "bottom";
export type Size = "small" | "medium" | "large";
export type Item = {
  id: string;
  kind: Kind;
  zone: Zone;
  size: Size;
  height: number;
  span?: number;
};
export const zoneOptions = [
  { value: "left", label: "Levá zóna" },
  { value: "right", label: "Pravá zóna" },
  { value: "bottom", label: "Dolní zóna" },
] as const;
export const dimensions = {
  search: {
    title: "Find Phrase",
    minWidth: 280,
    wideWidth: 360,
    minHeight: 240,
    maxHeight: 560,
    height: 300,
  },
  qr: {
    title: "Mini QR",
    minWidth: 280,
    wideWidth: 360,
    minHeight: 280,
    maxHeight: 600,
    height: 300,
  },
  generic: {
    title: "Obecný widget",
    minWidth: 200,
    wideWidth: 360,
    minHeight: 140,
    maxHeight: 520,
    height: 220,
  },
} as const;
export type Layout = {
  composition: Composition;
  items: Item[];
  nextId: number;
};
export function initialLayout(): Layout {
  return {
    composition: "centered",
    nextId: 3,
    items: [
      {
        id: "search-1",
        kind: "search",
        zone: "left",
        size: "medium",
        height: 300,
      },
      { id: "qr-2", kind: "qr", zone: "right", size: "medium", height: 300 },
    ],
  };
}
export type Action =
  | { type: "composition"; value: Composition }
  | { type: "add"; kind: Kind; size?: Size }
  | { type: "remove"; id: string }
  | { type: "move"; id: string; zone: Zone; before?: string }
  | { type: "step"; id: string; direction: -1 | 1 }
  | { type: "resize"; id: string; size: Size; height: number; span?: number }
  | { type: "reset" };
export function reduceLayout(state: Layout, action: Action): Layout {
  if (action.type === "reset") return initialLayout();
  if (action.type === "composition")
    return { ...state, composition: action.value };
  if (action.type === "add") {
    const size =
      action.kind === "generic" ? (action.size ?? "medium") : "medium";
    return {
      ...state,
      nextId: state.nextId + 1,
      items: [
        ...state.items,
        {
          id: `${action.kind}-${state.nextId}`,
          kind: action.kind,
          zone: "bottom",
          size,
          height:
            action.kind === "generic"
              ? { small: 160, medium: 220, large: 300 }[size]
              : dimensions[action.kind].height,
        },
      ],
    };
  }
  const item = state.items.find((x) => x.id === action.id);
  if (!item) return state;
  if (action.type === "remove")
    return { ...state, items: state.items.filter((x) => x !== item) };
  if (action.type === "resize") {
    const size =
      item.kind !== "generic" && action.size === "small"
        ? "medium"
        : action.size;
    const { minHeight, maxHeight } = dimensions[item.kind];
    return {
      ...state,
      items: state.items.map((x) =>
        x === item
          ? {
              ...x,
              size,
              ...(action.span === undefined ? {} : { span: Math.max(1, Math.min(3, action.span)) }),
              height: Math.max(minHeight, Math.min(maxHeight, action.height)),
            }
          : x,
      ),
    };
  }
  if (action.type === "step") {
    const peers = state.items.filter((x) => x.zone === item.zone);
    const target = peers[peers.indexOf(item) + action.direction];
    if (!target) return state;
    const items = [...state.items],
      a = items.indexOf(item),
      b = items.indexOf(target);
    [items[a], items[b]] = [items[b], items[a]];
    return { ...state, items };
  }
  if (action.before === item.id) return state;
  const items = state.items.filter((x) => x !== item);
  const index = items.findIndex(
    (x) => x.id === action.before && x.zone === action.zone,
  );
  items.splice(index < 0 ? items.length : index, 0, {
    ...item,
    zone: action.zone,
  });
  return { ...state, items };
}
export function itemWidth(item: Item) {
  if (item.size === "large") return dimensions[item.kind].wideWidth;
  return item.kind === "generic" && item.size === "small" ? 200 : 280;
}
export const itemSpan = (item: Item) => item.span ?? 1;

// First-fit placement fills earlier holes when a later small card fits them.
// Stable item keys stay under the same React parent when changing zones.
export function packBottom(items: Item[]) {
  const occupied: boolean[][] = [];
  return items.map((item) => {
    const span = itemSpan(item);
    for (let row = 0; ; row++) {
      occupied[row] ??= [false, false, false];
      for (let column = 0; column <= 3 - span; column++) {
        if (occupied[row].slice(column, column + span).some(Boolean)) continue;
        occupied[row].fill(true, column, column + span);
        return { row, column: column + 1, span };
      }
    }
  });
}
