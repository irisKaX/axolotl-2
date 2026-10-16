/** Self-contained review artifact. The normal application uses the catalog route. */
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { PreferencesProvider } from "../../app/PreferencesProvider";
import { PageContextProvider } from "../../app/PageContextProvider";
import { createPreferencesStore } from "../../lib/preferences";
import { createPageStore, type PageSnapshot } from "../../lib/browser-bridge";
import HeaderLab, { HeaderWorkbench } from "./HeaderLab";

const page = createPageStore();
// A downloaded file has no extension-authorized origin. Keep real manual URL
// actions, but do not attempt postMessage to the invalid targetOrigin "null".
let previous: PageSnapshot | undefined, offline: PageSnapshot;
const pageStore = location.protocol === "file:" || location.origin === "null" ? {
  ...page,
  start: () => () => {},
  refresh: () => document.dispatchEvent(new Event("axolotl-header-lab-offline-check")),
  getSnapshot() {
    const current = page.getSnapshot();
    if (current !== previous) {
      previous = current;
      offline = { ...current, connection: { status: "disconnected", tabCount: 0 }, tabs: [] };
    }
    return offline;
  },
} : page;

// Navigation links remain real destinations in the application, not demo actions.
document.addEventListener("click", event => {
  const link = (event.target as Element).closest?.('a[href^="#"]');
  if (!link) return;
  event.preventDefault();
  window.open(`https://iriskax.github.io/axolotl-2/${link.getAttribute("href")}`, "_blank", "noopener,noreferrer");
});

function ReviewContent() {
  const [notice, setNotice] = useState(false);
  useEffect(() => {
    const show = () => setNotice(true);
    document.addEventListener("axolotl-header-lab-offline-check", show);
    return () => document.removeEventListener("axolotl-header-lab-offline-check", show);
  }, []);
  return <main className="axolotl-design-system" style={{ paddingTop: 24 }}>
    {notice && <p className="axolotl-lab-offline-notice" role="status">Kontrola dokončena: stažený soubor nemá přístup k rozšíření. Skutečné karty vybírej v <a href="https://iriskax.github.io/axolotl-2/" target="_blank" rel="noreferrer">aplikaci Axolotl</a>. Zde můžeš použít ruční URL. <button type="button" onClick={() => setNotice(false)} aria-label="Zavřít informaci o propojení">×</button></p>}
    {document.documentElement.dataset.review === "connected" ? <>
      <HeaderWorkbench connectedOnly />
      <p className="axolotl-lab-footnote">Živý náhled propojené navigace. Ruční URL, nastavení a přepínače fungují; skutečné karty prohlížeče vyžadují aplikaci na adrese povolené rozšířením. Odkazy na nástroje otevírají veřejnou aplikaci.</p>
    </> : <HeaderLab />}
  </main>;
}

createRoot(document.getElementById("axolotl-root")!).render(
  <StrictMode>
    <PreferencesProvider store={createPreferencesStore({ storagePrefix: "axolotl-header-lab-shell", initialTheme: "dark" })}>
      <PageContextProvider store={pageStore}>
        <ReviewContent />
      </PageContextProvider>
    </PreferencesProvider>
  </StrictMode>,
);
