import { useState } from 'react';
import type { PageProps } from './model';
import { ApprovedDashboard } from '../../../design-system/dashboard/ApprovedDashboard';
export { ApprovedDashboard } from '../../../design-system/dashboard/ApprovedDashboard';
export default function DashboardPage({previewTheme}:PageProps) {
  const [route,setRoute]=useState('dashboard');
  return <section aria-label="Schválený Dashboard">
    <p><strong>Schváleno.</strong> Header, bento, Office placeholder a šest widgetových povrchů z revize <code>523c983</code>. Skutečné React komponenty; přesný katalogový vzhled zatím není produkčně použitý.</p>
    <p role="status">Navigační ukázka: {route}. Napojení widgetů na Tools není součástí návrhu.</p>
    <ApprovedDashboard theme={previewTheme} onNavigate={setRoute}/>
  </section>;
}
