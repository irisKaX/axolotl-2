import { useState } from 'react';
import { ApprovedDashboard } from '../../../design-system/dashboard/ApprovedDashboard';
export { ApprovedDashboard } from '../../../design-system/dashboard/ApprovedDashboard';
export default function DashboardPage() {
  const [route,setRoute]=useState('dashboard');
  return <section aria-label="Schválený Dashboard">
    <p><strong>TweakCN theme.</strong> Zachovaná schválená bento struktura, Header, Office placeholder a šest widgetů. Nové sémantické povrchy z dodaného CSS; katalogový vzhled zatím není produkčně použitý.</p>
    <p role="status">Navigační ukázka: {route}. Napojení widgetů na Tools není součástí návrhu.</p>
    <ApprovedDashboard onNavigate={setRoute}/>
  </section>;
}
