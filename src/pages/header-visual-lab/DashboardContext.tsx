import { Icon } from '../../components/Icon';
export function DashboardContext({ name, visual }: { name: string; visual: string }) {
  return <div className="vu-context">
    <div className="vu-context-meta"><span>O₂ AXOLOTL / PRACOVNÍ PROSTOR</span><span>VIZUÁLNÍ STUDIE {visual}</span></div>
    <h1>Prostor pro dobrou práci.</h1><p>Vyber nástroj a vyzkoušej navigaci v kontextu aplikace.</p>
    <div className="vu-shortcuts">
      <a href="#kontrola/metadata"><Icon name="metadata"/><span><strong>Metadata</strong><small>Title, description a sdílení</small></span><span aria-hidden="true">↗</span></a>
      <a href="#kontrola/nadpisy"><Icon name="nadpisy"/><span><strong>Nadpisy</strong><small>Struktura a hierarchie stránky</small></span><span aria-hidden="true">↗</span></a>
      <a href="#media/qr"><Icon name="qr"/><span><strong>QR generátor</strong><small>Od odkazu k hotovému kódu</small></span><span aria-hidden="true">↗</span></a>
    </div>
    <div className="vu-context-foot"><span>{name}</span><span>Vizuální návrh · funkční základ C2</span></div>
  </div>;
}
