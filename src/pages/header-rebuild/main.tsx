import { StrictMode, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppHeader } from '../../app/header/AppHeader';
import { PreferencesProvider } from '../../app/PreferencesProvider';
import { PageContextProvider } from '../../app/PageContextProvider';
import { CursorEffects } from '../../app/CursorEffects';
import { currentRoute, routeLabels } from '../../app/routes';
import { createPreferencesStore } from '../../lib/preferences';
import { createPageStore } from '../../lib/browser-bridge';
import { ToolWorkspace } from '../../tools/ToolWorkspace';
import { toolRoutes } from '../../tools/registry';
import { Icon } from '../../components/Icon';
import '../../styles/app.css';
import './preview.css';

const DesignSystem = lazy(() => import('../DesignSystem').then(module => ({ default: module.DesignSystem })));
const params = new URLSearchParams(location.search);
const preferences = createPreferencesStore({ storagePrefix:'axolotl-header-rebuild', initialTheme:params.get('theme') === 'light' ? 'light' : 'dark' });
if (params.has('theme')) preferences.set('theme', params.get('theme'));
if (params.has('motion')) preferences.set('motion', params.get('motion'));

// The isolated Vite config namespaces bridge persistence at build time.
const pageStore = createPageStore();

function Preview() {
  const [route, setRoute] = useState(currentRoute);
  const workspace = useRef<HTMLElement>(null);
  const focusWorkspace = () => requestAnimationFrame(() => workspace.current?.focus({ preventScroll:true }));
  useEffect(() => { const navigate = () => { setRoute(currentRoute()); focusWorkspace(); }; window.addEventListener('hashchange', navigate); return () => window.removeEventListener('hashchange', navigate); }, []);
  useEffect(() => { document.title = `${routeLabels[route]} · Axolotl Header Preview`; }, [route]);
  return <>
    <a href="#axolotl-workspace" className="axolotl-skip-link" onClick={event => { event.preventDefault(); workspace.current?.focus(); }}>Přejít na obsah</a>
    <AppHeader route={route} onNavigate={focusWorkspace}/>
    <main id="axolotl-workspace" ref={workspace} tabIndex={-1} className="rebuild-workspace" aria-label={routeLabels[route]}>
      {toolRoutes[route] ? <ToolWorkspace route={route}/> : route === 'design-system' ? <Suspense fallback={<p>Načítám vzorník…</p>}><DesignSystem/></Suspense> : <div className="rebuild-context">
        <div className="rebuild-meta"><span>O₂ AXOLOTL / PRACOVNÍ PROSTOR</span><span>NÁHLED HEADERU</span></div>
        <h1>Prostor pro dobrou práci.</h1><p>Vyber nástroj a vyzkoušej navigaci v kontextu aplikace.</p>
        <div className="rebuild-shortcuts">{[
          { route:'kontrola/metadata', title:'Metadata', note:'Title, description a sdílení', icon:'metadata' as const },
          { route:'kontrola/nadpisy', title:'Nadpisy', note:'Struktura a hierarchie stránky', icon:'nadpisy' as const },
          { route:'media/qr', title:'QR generátor', note:'Od odkazu k hotovému kódu', icon:'qr' as const },
        ].map(item => <a key={item.route} href={`#${item.route}`}><Icon name={item.icon}/><span><strong>{item.title}</strong><small>{item.note}</small></span><span aria-hidden="true">↗</span></a>)}</div>
        <div className="rebuild-foot"><span>Refined Spatial · C2</span><span>Samostatný náhled · produkce beze změny</span></div>
      </div>}
    </main><CursorEffects/>
  </>;
}
createRoot(document.getElementById('axolotl-root')!).render(<StrictMode><PreferencesProvider store={preferences}><PageContextProvider store={pageStore}><Preview/></PageContextProvider></PreferencesProvider></StrictMode>);
