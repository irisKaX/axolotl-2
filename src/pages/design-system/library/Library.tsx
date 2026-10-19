import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { usePreferences } from "../../../app/PreferencesProvider";
import { Button } from "../../../design-system/Button";
import {
  DesignSystemProvider,
  Status,
  Disclosure,
} from "../../../design-system/library";
import ButtonShowcase from "../ButtonShowcase";
import { categories, type CategoryId } from "./registry";
import { ApiReference } from "./PageFrame";
import "./catalog.css";
const Forms = lazy(() => import("./FormsPage")),
  Surfaces = lazy(() => import("./SurfacesPage")),
  Overlays = lazy(() => import("./OverlaysPage")),
  Feedback = lazy(() => import("./FeedbackPage")),
  Navigation = lazy(() => import("./NavigationPage"));
const readSection = () => {
  const q = new URLSearchParams(location.search),
    s = q.get("section") || (q.get("catalog") === "buttons" ? "buttons" : "");
  return categories.some((c) => c.id === s) ? (s as CategoryId) : null;
};
const href = (id: CategoryId | null) =>
  `?catalog=library${id ? `&section=${id}` : ""}#design-system`;
export default function Library() {
  const prefs = usePreferences(),
    [section, setSection] = useState(readSection);
  const heading = useRef<HTMLHeadingElement>(null),
    first = useRef(true);
  const selected = categories.find((c) => c.id === section);
  useEffect(() => {
    const update = () => setSection(readSection());
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  useEffect(() => {
    document.title = `${selected?.title || "Design System Library V1"} · Axolotl`;
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
    history.pushState(null, "", href(id));
    setSection(id);
  }
  return (
    <DesignSystemProvider
      theme={prefs.resolvedTheme}
      reducedMotion={prefs.reducedMotion}
    >
      <section className="ds-catalog" aria-labelledby="library-heading">
        <div className="ds-catalog-top">
          <a href={href(null)} onClick={(e) => navigate(e, null)}>
            Axolotl / Design System
          </a>
          <div className="ds-actions">
            <Status state="neutral">Library V1 · k revizi</Status>
            <Button
              size="small"
              onClick={() =>
                prefs.setPreference(
                  "theme",
                  prefs.resolvedTheme === "dark" ? "light" : "dark",
                )
              }
            >
              {prefs.resolvedTheme === "dark"
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
            {selected?.title || "Design System Library V1"}
          </h1>
          <p>
            {selected?.description ||
              "Skutečné React komponenty. Jedna stránka pro každý typ, živé varianty a stav, který lze ověřit."}
          </p>
        </header>
        {selected && (
          <nav className="ds-catalog-nav" aria-label="Kategorie knihovny">
            <a href={href(null)} onClick={(e) => navigate(e, null)}>
              ← Přehled
            </a>
            {categories.map((c) => (
              <a
                key={c.id}
                href={href(c.id)}
                onClick={(e) => navigate(e, c.id)}
                aria-current={section === c.id ? "page" : undefined}
              >
                {c.title}
              </a>
            ))}
          </nav>
        )}
        {!selected ? (
          <>
            <div className="ds-catalog-categories">
              {categories.map((c, i) => (
                <a
                  className="ds-catalog-category"
                  key={c.id}
                  href={href(c.id)}
                  onClick={(e) => navigate(e, c.id)}
                >
                  <span className="ds-catalog-eyebrow">
                    0{i + 1} / {c.entries.length}{" "}
                    {c.entries.length === 1 ? "komponenta" : "komponent"}
                  </span>
                  <h2>{c.title}</h2>
                  <p>{c.description}</p>
                  <div className="ds-catalog-category-status">
                    {[...new Set(c.entries.map((e) => e.status))].map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                  <footer>
                    {c.entries.reduce((sum, e) => sum + e.variants.length, 0)}{" "}
                    dostupných variant <span>Otevřít playground ↗</span>
                  </footer>
                </a>
              ))}
            </div>
            <section className="ds-foundations">
              <h2>Pracovní foundations</h2>
              <p>
                Schválené akcenty: <strong>Axolotl Violet #7C3AED</strong> a{" "}
                <strong>O2 Blue #0050FF</strong>. Další povrchy, textové a
                významové barvy jsou pracovní návrh V1, nikoli schválená finální
                paleta.
              </p>
              <div className="ds-foundation-swatches">
                <span style={{ background: "#7C3AED", color: "#fff" }}>
                  Axolotl Violet
                </span>
                <span style={{ background: "#0050FF", color: "#fff" }}>
                  O2 Blue
                </span>
                <span>Neutrální povrch</span>
              </div>
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
                    Schválená reference Button
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
              {section === "buttons" ? (
                <ButtonShowcase />
              ) : section === "forms" ? (
                <Forms />
              ) : section === "surfaces" ? (
                <Surfaces />
              ) : section === "overlays" ? (
                <Overlays />
              ) : section === "feedback" ? (
                <Feedback />
              ) : (
                <Navigation />
              )}
            </Suspense>
            <ApiReference category={selected.id} />
          </>
        )}
        <footer className="ds-catalog-footer">
          {section === "buttons"
            ? "Button Lens 02: schválený vzhled."
            : "Nové povrchy a komponenty: pracovní V1 ke schválení."}{" "}
          Header a nástroje se nemění.{" "}
          <a href="https://github.com/irisKaX/axolotl-2/tree/experiment/ds-library-v1/docs/ds-library">
            API a technický report ↗
          </a>
        </footer>
      </section>
    </DesignSystemProvider>
  );
}
