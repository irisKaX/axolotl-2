import type { ReactNode } from 'react';
import { OfficePlaceholder, WidgetSurface, type WidgetNumber } from './WidgetSurface';
export function BentoDashboard({widgets = {}}: { widgets?: Partial<Record<WidgetNumber, ReactNode>> }) {
  return <div className="ds-bento" aria-label="Dashboard">
    <OfficePlaceholder/>
    {([1,2,3,4,5,6] as const).map(number => <WidgetSurface key={number} number={number}>{widgets[number]}</WidgetSurface>)}
  </div>;
}
