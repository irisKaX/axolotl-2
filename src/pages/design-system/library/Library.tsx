import { ArrowUpRight } from "lucide-react";
import { Suspense, useEffect, useRef, useState, type MouseEvent } from "react";
import { usePreferences } from "../../../app/PreferencesProvider";
import { Button } from "../../../design-system/Button";
import {
  DesignSystemProvider,
  Status,
  Disclosure,
  Switch,
} from "../../../design-system/library";

import { getCategories, type CategoryId } from "./registry";
import { paints } from "./colors/paints";
import { designLabel } from "./model";
import { SystemOverview } from "./SystemOverview";
import { ApiReference } from "./PageFrame";
import "./catalog.css";
import "./consolidation.css";
const readRoute = () => {
  const q = new URLSearchParams(location.search),
    testMode = q.get("catalogTests") === "1";
  const id =
    q.get("section") || (q.get("catalog") === "buttons" ? "buttons" : "");
  return {
    section: getCategories(testMode).some((c) => c.id === id) ? id : null,
    testMode,
  };
};
const href = (id: CategoryId | null, testMode = false) =>
  `?catalog=library${id ? `&section=${id}` : ""}${testMode ? "&catalogTests=1" : ""}#design-system`;
export default function Library() {
  const prefs = usePreferences(),
    [route, setRoute] = useState(readRoute);
  const { section, testMode } = route;
  const categories = getCategories(testMode);
  const heading = useRef<HTMLHeadingElement>(null),
    first = useRef(true);
  const selected = categories.find((c) => c.id === section);
  const previewTheme = prefs.resolvedTheme;
  useEffect(() => {
    const update = () => setRoute(readRoute());
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  useEffect(() => {
    document.title = `${selected?.title || "Design System Library V1.1"} · Axolotl`;
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [section, selected?.title]);
  function navigate(e: MouseEvent<HTMLAnchorElement>, id: CategoryId | null) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    history.pushState(null, "", href(id, testMode));
    setRoute({ section: id, testMode });
  }
  function setTestMode(enabled: boolean) {
    const nextSection = getCategories(enabled).some((c) => c.id === section)
      ? section
      : null;
    const url = new URL(location.href);
    if (enabled) url.searchParams.set("catalogTests", "1");
    else url.searchParams.delete("catalogTests");
    if (section !== nextSection) url.searchParams.delete("section");
    history.pushState(null, "", url);
    setRoute({ section: nextSection, testMode: enabled });
  }
  const categoryNavigation = selected && (
    <nav className="ds-catalog-nav" aria-label="Kategorie knihovny">
      <a href={href(null, testMode)} onClick={(e) => navigate(e, null)}>
        ← Přehled
      </a>
      {categories.map((c) => (
        <a
          key={c.id}
          href={href(c.id, testMode)}
          onClick={(e) => navigate(e, c.id)}
          aria-current={section === c.id ? "page" : undefined}
        >
          {c.title}
        </a>
      ))}
    </nav>
  );
  return (
    <DesignSystemProvider
      appearance="unified"
      theme={prefs.resolvedTheme}
      reducedMotion={prefs.reducedMotion}
    >
      <section
        className="ds-catalog"
        data-workspace={selected?.workspace || undefined}
        aria-labelledby="library-heading"
      >
        <div className="ds-catalog-top">
          <a href={href(null, testMode)} onClick={(e) => navigate(e, null)}>
            Axolotl / Design System
          </a>
          {selected?.workspace && (
            <Disclosure title="Kategorie knihovny">
              {categoryNavigation}
            </Disclosure>
          )}
          <div className="ds-actions">
            <div>
              <Switch
                label="Zobrazit testovací komponenty"
                checked={testMode}
                onChange={(e) => setTestMode(e.currentTarget.checked)}
              />
            </div>
            {!selected?.workspace && (
              <Status state="neutral">Jediný katalog · Library V1.1</Status>
            )}
            <Button
              size="small"
              onClick={() =>
                prefs.setPreference(
                      "theme",
                      prefs.resolvedTheme === "dark" ? "light" : "dark",
                    )
              }
            >
              {previewTheme === "dark"
                ? "Světlý náhled knihovny"
                : "Tmavý náhled knihovny"}
            </Button>
          </div>
        </div>
        <header className="ds-catalog-heading">
          <span className="ds-catalog-eyebrow">
            {selected
              ? "Components / Live playground"
              : "O2 Axolotl 2.0 / Component Library"}
          </span>
          <h1 id="library-heading" ref={heading} tabIndex={-1}>
            {selected?.title || "Design System Library V1.1"}
          </h1>
          <p>
            {selected?.description ||
              "Jediný platný katalog vizuálního systému Axolotl 2.0. Každá komponenta má jeden zdroj a vlastní stav schválení."}
          </p>
        </header>
        {selected && !selected.workspace && categoryNavigation}

        {testMode && (
          <p role="status">
            Testovací režim · technické fixtures jsou návrh.{" "}
            <a
              href={href(
                getCategories().some((c) => c.id === section) ? section : null,
              )}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                setTestMode(false);
              }}
            >
              Ukončit testovací režim
            </a>
          </p>
        )}
        {!selected ? (
          <>
            <nav aria-label="Oblasti designového systému"><ul className="ds-catalog-map">
              <li><a href={href("foundations")} onClick={(e) => navigate(e, "foundations")}>Foundations</a></li>
              <li><a href="#themes">Themes</a></li>
              <li><a href="#components">Components</a></li>
              <li><a href={href("dashboard")} onClick={(e) => navigate(e, "dashboard")}>Dashboard</a></li>
              <li><a href={href("buttons")} onClick={(e) => navigate(e, "buttons")}>Motion · Star Border</a></li>
              <li><a href={href("brand")} onClick={(e) => navigate(e, "brand")}>Brand & Mascot</a></li>
              <li><a href="#guidelines">Guidelines</a></li>
            </ul></nav>
            <div className="ds-catalog-categories" id="components">
              {categories.map((c, i) => (
                <a
                  className="ds-catalog-category"
                  key={c.id}
                  href={href(c.id, testMode)}
                  onClick={(e) => navigate(e, c.id)}
                >
                  <span className="ds-catalog-eyebrow">
                    0{i + 1} / {c.entries.length}{" "}
                    {c.entries.length === 1 ? "komponenta" : "komponent"}
                  </span>
                  <h2>{c.title}</h2>
                  <p>{c.description}</p>
                  <div className="ds-catalog-category-status">
                    {[
                      ...new Set(
                        c.entries.flatMap((e) =>
                          e.variants.map((v) => designLabel(v.design)),
                        ),
                      ),
                    ].map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                  <footer>
                    {c.entries.reduce((sum, e) => sum + e.variants.length, 0)}{" "}
                    dostupných variant{" "}
                    <span>
                      Otevřít playground{" "}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </span>
                  </footer>
                </a>
              ))}
            </div>
            <div id="themes"><SystemOverview /></div>
            <section className="ds-foundations" id="foundations-summary">
              <h2>Foundations</h2><p>Barvy a gradienty, typografie a fonty, spacing, radius, elevation, shadows a borders vycházejí ze stávajících tokenů a skutečných komponent. Jednotný sémantický základ nyní určuje dodaný TweakCN export v přesných OKLCH hodnotách.</p>
              <p>
                Brandové akcenty (oddělené od theme):{" "}
                <strong>
                  {paints
                    .filter((p) => p.design === "approved")
                    .map((p) => `${p.name} ${p.css}`)
                    .join(" · ")}
                </strong>
                . Společné povrchy, text a interaktivní stavy vycházejí z
                jednoho TweakCN theme. Brandové barvy nepřepisují sémantické role.
              </p>
              <p>
                <a
                  href={href("colors", testMode)}
                  onClick={(e) => navigate(e, "colors")}
                >
                  Otevřít Colors & Gradients →
                </a>
              </p>
              <p>
                Počet variant nezahrnuje velikosti ani interakční stavy. Každý
                detail ukazuje přesný seznam a původ exportů.
              </p>
              <section id="guidelines" className="ds-catalog-guidelines">
                <h2>Guidelines · jeden zdroj pravdy</h2>
                <p>Nové komponenty, tokeny, témata, Header, Dashboard i maskot vznikají a spravují se nejprve v této Library V1.1. Rozšiřujeme existující export a registr, nevytváříme paralelní katalogy.</p>
                <ul>
                  <li><strong>Návrh:</strong> experiment nebo úprava čekající na schválení.</li>
                  <li><strong>Schváleno:</strong> konkrétní vizuální varianta potvrzená uživatelkou.</li>
                  <li><strong>Produkčně použito:</strong> přesná varianta skutečně používaná aplikací; tento údaj se eviduje nezávisle na schválení.</li>
                </ul>
                <p>Schválení katalogu neschvaluje automaticky jeho ukázky. Header a bento odpovídají revizi 523c983; Office zůstává placeholderem. Návrhové widgety zůstávají označené jako návrhy.</p>
                <p>Star Border je volitelný efekt existujícího Buttonu. Respektujeme klávesnici, focus, reduced motion a dark/light.</p>
                <p>V1, historické Header Labs, Layout Studios a ostatní experimentální preview jsou vyřazené jako aktivní zdroje. Historie zůstává v Gitu. Starý produkční katalog není autoritou; jeho živá routa zůstává do samostatně schválené produkční změny.</p>
                <p>Soukromá Inspiration Library zůstává soukromým zdrojem externích referencí. Její obsah se zde nezveřejňuje a neznamená schválení komponent.</p>
              </section>
            </section>
          </>
        ) : (
          <>
            <p className="ds-catalog-keyboard">{selected.keyboard}</p>
            <Suspense fallback={<p role="status">Načítám komponenty…</p>}>
              <selected.Page
                category={selected}
                testMode={testMode}
                previewTheme={previewTheme}
              />
            </Suspense>
            <ApiReference category={selected} />
          </>
        )}
        <footer className="ds-catalog-footer">
          Design System Library V1.1 · jediný katalog. Stav každé varianty je uveden v registru a technických detailech.
        </footer>
      </section>
    </DesignSystemProvider>
  );
}
