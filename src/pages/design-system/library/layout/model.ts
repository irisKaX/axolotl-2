import type { Layout as GridLayout, LayoutItem } from 'react-grid-layout';
export const compositions = [
  { value: 'centered', label: 'Vyvážený střed', description: 'Office mezi dvěma pracovními widgety.' },
  { value: 'staggered', label: 'Pracovní patra', description: 'Levá zóna výše, pravá níže. Office zůstává uprostřed.' },
] as const;
export type Composition = typeof compositions[number]['value'];
export type Kind = 'search' | 'qr' | 'generic';
export type Size = 'small' | 'medium' | 'large';
export type Item = { id: string; kind: Kind; size: Size };
export type View = 'desktop' | 'tablet' | 'mobile';
export const columns = { desktop: 24, tablet: 12, mobile: 4 };
export const dimensions = {
  search: { title: 'Find Phrase', minHeight: 12, height: 16 },
  qr: { title: 'Mini QR', minHeight: 14, height: 17 },
  generic: { title: 'Obecný widget', minHeight: 7, height: 11 },
};
export type Layout = { composition: Composition; items: Item[]; nextId: number; layouts: Partial<Record<View, GridLayout>> };
export const viewFor = (width: number): View => width >= 900 ? 'desktop' : width >= 600 ? 'tablet' : 'mobile';
export function minWidth(item: Item, view: View) {
  return item.kind === 'generic' ? { desktop: 4, tablet: 3, mobile: 2 }[view] : { desktop: 6, tablet: 5, mobile: 4 }[view];
}
export function overlaps(a: LayoutItem, b: LayoutItem) {
  return a.i !== b.i && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
export function available(layout: GridLayout, item: LayoutItem, cols: number) {
  return item.x >= 0 && item.y >= 0 && item.x + item.w <= cols && !layout.some(other => overlaps(item, other));
}
function vacant(layout: GridLayout, item: LayoutItem, cols: number): LayoutItem {
  const bottom = Math.max(0, ...layout.map(x => x.y + x.h));
  for (let y = 0; y <= bottom; y++) for (let x = 0; x <= cols - item.w; x++) {
    const next = { ...item, x, y };
    if (available(layout, next, cols)) return next;
  }
  return { ...item, x: 0, y: bottom };
}
function geometry(item: Item, view: View): LayoutItem {
  const w = Math.min(columns[view], item.kind === 'generic'
    ? { small: minWidth(item, view), medium: Math.round(columns[view] / 3), large: Math.round(columns[view] / 2) }[item.size]
    : view === 'desktop' ? 8 : view === 'tablet' ? 6 : 4);
  return { i: item.id, x: 0, y: 0, w: Math.max(w, minWidth(item, view)),
    h: item.kind === 'generic' ? { small: 8, medium: 11, large: 16 }[item.size] : dimensions[item.kind].height,
    minW: minWidth(item, view), minH: dimensions[item.kind].minHeight };
}
export function preset(items: Item[], view: View, composition: Composition): GridLayout {
  const offset = composition === 'staggered' ? 4 : 0;
  const office: LayoutItem = { i: 'office', static: true, x: view === 'desktop' ? 8 : view === 'tablet' ? 3 : 0,
    y: view === 'desktop' ? 4 + offset / 2 : view === 'tablet' ? 21 + offset : 16,
    w: view === 'desktop' ? 8 : view === 'tablet' ? 6 : 4, h: 12 };
  const result: LayoutItem[] = [office];
  items.forEach((item, index) => {
    const next = geometry(item, view);
    if (index === 0) { next.x = 0; next.y = 0; }
    else if (index === 1) {
      next.x = view === 'desktop' ? 16 : view === 'tablet' ? 6 : 0;
      next.y = view === 'mobile' ? 28 : offset;
    }
    result.push(index < 2 && available(result, next, columns[view]) ? next : vacant(result, next, columns[view]));
  });
  return result;
}
export function initialLayout(): Layout {
  return { composition: 'centered', nextId: 3, layouts: {}, items: [
    { id: 'search-1', kind: 'search', size: 'medium' }, { id: 'qr-2', kind: 'qr', size: 'medium' },
  ] };
}
export const layoutFor = (state: Layout, view: View): GridLayout => state.layouts[view] ?? preset(state.items, view, state.composition);
export type Action =
  | { type: 'composition'; value: Composition }
  | { type: 'add'; kind: Kind; size?: Size }
  | { type: 'remove'; id: string }
  | { type: 'commit'; view: View; layout: GridLayout }
  | { type: 'adjust'; view: View; id: string; patch: Partial<Pick<LayoutItem, 'x' | 'y' | 'w' | 'h'>> }
  | { type: 'reset' };
export function reduceLayout(state: Layout, action: Action): Layout {
  if (action.type === 'reset') return { ...initialLayout(), composition: state.composition };
  if (action.type === 'composition') return { ...state, composition: action.value, layouts: {} };
  if (action.type === 'add') {
    const item: Item = { id: `${action.kind}-${state.nextId}`, kind: action.kind, size: action.size ?? 'medium' };
    const layouts = { ...state.layouts };
    for (const view of Object.keys(columns) as View[]) {
      const current = layoutFor(state, view);
      layouts[view] = [...current, vacant(current, geometry(item, view), columns[view])];
    }
    return { ...state, nextId: state.nextId + 1, items: [...state.items, item], layouts };
  }
  if (action.type === 'remove') {
    if (!state.items.some(item => item.id === action.id)) return state;
    return { ...state, items: state.items.filter(item => item.id !== action.id),
      layouts: Object.fromEntries((Object.keys(columns) as View[]).map(view => [view, layoutFor(state, view).filter(item => item.i !== action.id)])) };
  }
  const current = layoutFor(state, action.view);
  if (action.type === 'commit') {
    const office = current.find(item => item.i === 'office')!;
    // Accept only a complete, collision-free result; fixed Office cannot drift.
    const next = action.layout.map(item => item.i === 'office' ? office : { ...item });
    if (next.length !== current.length || new Set(next.map(item => item.i)).size !== current.length ||
      next.some(item => !current.some(old => old.i === item.i) || !available(next, item, columns[action.view]) || item.w < (item.minW ?? 1) || item.h < (item.minH ?? 1))) return state;
    return { ...state, layouts: { ...state.layouts, [action.view]: next } };
  }
  const old = current.find(item => item.i === action.id);
  if (!old || old.static) return state;
  const next = { ...old, ...action.patch };
  next.w = Math.max(old.minW ?? 1, Math.min(columns[action.view], next.w));
  next.h = Math.max(old.minH ?? 1, next.h);
  next.x = Math.max(0, Math.min(columns[action.view] - next.w, next.x));
  next.y = Math.max(0, next.y);
  if (!available(current, next, columns[action.view])) return state;
  return { ...state, layouts: { ...state.layouts, [action.view]: current.map(item => item.i === next.i ? next : item) } };
}
