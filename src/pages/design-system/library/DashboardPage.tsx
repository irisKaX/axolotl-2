import { useState } from 'react';
import { ApprovedDashboard } from '../../../design-system/dashboard/ApprovedDashboard';
export { ApprovedDashboard } from '../../../design-system/dashboard/ApprovedDashboard';
export default function DashboardPage() {
  const [route,setRoute]=useState('dashboard');
  return <section aria-label="Schválený Dashboard">
    <p><strong>TweakCN theme.</strong> Zachovaná schválená bento struktura, Header, Office placeholder a šest widgetů. Nové sémantické povrchy z dodaného CSS; katalogový vzhled zatím není produkčně použitý.</p>
    <p role="status">Navigační ukázka: {route}. Napojení widgetů na Tools není součástí návrhu.</p>
    <p>SEO puntík vyhodnocuje robots direktivy pro Googlebot (web), nikoli skutečnou indexaci. Bez připojeného rozšíření je neutrální. Současný bridge čte meta z vybrané karty; X-Robots-Tag zatím neposkytuje.</p>
    <ApprovedDashboard onNavigate={setRoute}/>
  </section>;
}
