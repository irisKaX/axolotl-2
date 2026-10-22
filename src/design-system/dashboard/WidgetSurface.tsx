import { useId, type ReactNode } from 'react';
export type WidgetNumber = 1 | 2 | 3 | 4 | 5 | 6;
// Original paths, not approximations from a different icon family.
const paths = {
  home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  1:'m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  2:'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h4v4h-6z',
  3:'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M7 12h10',
  4:'m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18',
  5:'M3 3h18v18H3zM3 16l6-6 5 5 3-3 4 4M16 7h.01',
  6:'M5 3h9l5 5v13H5zM14 3v6h5M8 13h8M8 17h5',
};
function SurfaceIcon({name}: {name: keyof typeof paths}) {
  return <svg className="ds-bento-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]}/></svg>;
}
export function BorderBeam() { return <span className="pg-border-beam" aria-hidden="true"/>; }
export function WidgetSurface({number, children, title = `Widget ${number}`}: {number: WidgetNumber; children?: ReactNode; title?: string}) {
  const id=useId();
  return <section className="ds-bento-cell ds-widget-surface" data-widget={number} aria-labelledby={id}>
    {[1,3,4,5].includes(number) && <BorderBeam/>}
    <SurfaceIcon name={number}/>
    {children}
    <h2 id={id} className="ds-bento-label">{title}</h2>
  </section>;
}
export function OfficePlaceholder() {
  const id=useId();
  return <section className="ds-bento-cell ds-office" aria-labelledby={id}>
    <SurfaceIcon name="home"/><h2 id={id} className="ds-bento-label">Axolotl Office</h2>
  </section>;
}
