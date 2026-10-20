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
  const [localTheme, setLocalTheme] = useState<"dark" | "light" | null>(null);
  const { section, testMode } = route;
  const categories = getCategories(testMode);
  const heading = useRef<HTMLHeadingElement>(null),
    first = useRef(true);
  const selected = categories.find((c) => c.id === section);
  const previewTheme = selected?.isolatedTheme
    ? (localTheme ?? prefs.resolvedTheme)
    : prefs.resolvedTheme;
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
      appearance={section === "navigation" ? "original" : "unified"}
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
              <Status state="neutral">Library V1.1 · k revizi</Status>
            )}
            <Button
              size="small"
              onClick={() =>
                selected?.isolatedTheme
                  ? setLocalTheme(previewTheme === "dark" ? "light" : "dark")
                  : prefs.setPreference(
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
              "Skutečné React komponenty. Jedna stránka pro každý typ, živé varianty a stav, který lze ověřit."}
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
            <div className="ds-catalog-categories">
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
            <SystemOverview />
            <section className="ds-foundations">
              <h2>Pracovní foundations</h2>
              <p>
                Schválené akcenty:{" "}
                <strong>
                  {paints
                    .filter((p) => p.design === "approved")
                    .map((p) => `${p.name} ${p.css}`)
                    .join(" · ")}
                </strong>
                . Společné povrchy, text a interaktivní stavy vycházejí z
                referenčních Navigation & Tabs. Aktuální sjednocení komponent
                čeká na vizuální revizi.
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
              <Disclosure title="Historie a původní experimenty">
                <div className="ds-catalog-links">
                  <a href="?catalog=legacy#design-system">
                    Původní katalog v aplikaci
                  </a>
                  <a href="?catalog=headers#design-system">Header Lab A/B</a>
                  <a href="https://iriskax.github.io/axolotl-preview/ds-button-lens-02/">
                    Historický Lens 02 Button
                  </a>
                  <a href="https://iriskax.github.io/axolotl-preview/aperture-02-20261018/aperture-02.html">
                    Aperture 02
                  </a>
                  <a href="https://github.com/irisKaX/component-catalog">
                    Experimentální component-catalog
                  </a>
                </div>
              </Disclosure>
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
          {section === "buttons"
            ? "Button: sjednocený vzhled podle Navigation & Tabs, k revizi."
            : "Nové povrchy a komponenty: pracovní V1 ke schválení."}{" "}
          Header a nástroje se nemění.{" "}
          <a href="https://github.com/irisKaX/axolotl-2/tree/experiment/ds-library-v1-1/docs/ds-library/EXTENDING.md">
            API a technický report ↗
          </a>
        </footer>
      </section>
    </DesignSystemProvider>
  );
}
