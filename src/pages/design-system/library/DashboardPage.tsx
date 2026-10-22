import type { PageProps } from "./model";
import "./consolidation.css";

export function ApprovedDashboard({ theme = "dark" }: { theme?: "dark" | "light" }) {
  return <iframe
    className="ds-approved-dashboard"
    title="Schválený Header, bento Dashboard a Office placeholder"
    src={`${import.meta.env.BASE_URL}library/dashboard/?theme=${theme}#dashboard`}
  />;
}

export default function DashboardPage({ previewTheme }: PageProps) {
  return <section aria-label="Schválený Dashboard">
    <p><strong>Schváleno.</strong> Header, pevné bento, Office placeholder a šest povrchů widgetů z Modular Playgroundu, revize <code>523c983</code>. Převzatý vzhled dosud není produkčně použitý.</p>
    <p>Živý Header zachovává nabídky, nastavení vzhledu a ruční URL. Nástroje a další pohledy uvnitř ukázky jsou návrhová data, nikoli skutečné výsledky kontrol.</p>
    <ApprovedDashboard theme={previewTheme} />
  </section>;
}
