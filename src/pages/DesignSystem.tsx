import { useId, useState, lazy, Suspense } from "react";
import { ToolCard, type CardSize } from "../components/ToolCard";
import { Icon } from "../components/Icon";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Dialog } from "../components/ui/Dialog";
import { usePreferences } from "../app/PreferencesProvider";
const ButtonShowcase = lazy(() => import("./design-system/ButtonShowcase"));
const HeaderLab = lazy(() => import("./header-lab/HeaderLab"));
const title = "Axolotl — tvůj prostor pro web";
const description =
  "Webové nástroje, poznámky a přehled o stránce. Všechno, co potřebuješ, v jednom pracovním prostoru.";
const sizes: CardSize[] = ["S", "M", "L"];
function DetailButton({
  label = "Prohlédnout ukázku",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog
      title="Ukázková metadata"
      description="Tato data jsou připravená pro posouzení vzhledu. Nejde o kontrolu aktuální URL."
      trigger={
        <Button variant="ghost" size="small">
          {label}
          <Icon name="arrow" />
        </Button>
      }
    >
      {children}
    </Dialog>
  );
}
function MetaRows({ extended = false }: { extended?: boolean }) {
  return (
    <dl className="axolotl-meta-rows">
      <div>
        <dt>Title</dt>
        <dd>{title}</dd>
      </div>
      <div>
        <dt>Description</dt>
        <dd>{description}</dd>
      </div>
      {extended && (
        <>
          <div>
            <dt>Canonical</dt>
            <dd>https://example.com/</dd>
          </div>
          <div>
            <dt>Jazyk stránky</dt>
            <dd>Čeština · cs</dd>
          </div>
        </>
      )}
    </dl>
  );
}
function Metadata({ size }: { size: CardSize }) {
  return (
    <ToolCard
      size={size}
      title="Metadata"
      icon="metadata"
      footer={
        <>
          <span className="axolotl-card-footnote">example.com</span>
          <DetailButton>
            <MetaRows extended />
          </DetailButton>
        </>
      }
    >
      {size === "S" ? (
        <>
          <div className="axolotl-card-metric">
            <strong>
              3<span>/3</span>
            </strong>
            <Badge tone="success">Vyplněno</Badge>
          </div>
          <p className="axolotl-card-muted">Title, description a canonical</p>
        </>
      ) : (
        <>
          <div className="axolotl-card-status">
            <span>Základní údaje stránky</span>
            <Badge tone="success">
              <Icon name="check" />
              Vyplněno
            </Badge>
          </div>
          {size === "L" && (
            <div className="axolotl-search-preview">
              <span className="axolotl-eyebrow">Náhled výsledku hledání</span>
              <small>example.com</small>
              <h4>{title}</h4>
              <p>{description}</p>
            </div>
          )}
          <MetaRows extended={size === "L"} />
        </>
      )}
    </ToolCard>
  );
}
function QRPlaceholder({ large = false }: { large?: boolean }) {
  return (
    <div
      className={`axolotl-qr-placeholder ${large ? "axolotl-qr-placeholder-large" : ""}`}
      aria-label="Místo pro náhled QR kódu"
    >
      <Icon name="qr" />
      <span>Náhled QR</span>
    </div>
  );
}
function QR({ size }: { size: CardSize }) {
  const id = useId();
  return (
    <ToolCard
      size={size}
      title="QR kód"
      icon="qr"
      footer={
        <>
          <span className="axolotl-card-footnote">Čeká na propojení</span>
          <Button size="small" disabled>
            <Icon name="arrow" />
            Vytvořit QR
          </Button>
        </>
      }
    >
      {size === "S" ? (
        <div className="axolotl-qr-compact">
          <QRPlaceholder />
          <p className="axolotl-card-muted">Z aktuální URL jedním kliknutím.</p>
        </div>
      ) : (
        <div
          className={`axolotl-qr-layout ${size === "L" ? "axolotl-qr-layout-large" : ""}`}
        >
          <QRPlaceholder large={size === "L"} />
          <div className="axolotl-qr-fields">
            <label className="axolotl-field" htmlFor={id}>
              URL pro QR kód
              <input
                id={id}
                className="axolotl-input"
                defaultValue="https://example.com"
                type="url"
              />
            </label>
            <p className="axolotl-card-muted">
              Ukázka vstupu. Generátor přidáme s hotovým nástrojem.
            </p>
            {size === "L" && (
              <div className="axolotl-field-pair">
                <label className="axolotl-field" htmlFor={`${id}-format`}>
                  Formát
                  <select
                    className="axolotl-input"
                    id={`${id}-format`}
                    defaultValue="png"
                  >
                    <option value="png">PNG</option>
                    <option value="svg">SVG</option>
                  </select>
                </label>
                <label className="axolotl-field" htmlFor={`${id}-size`}>
                  Velikost
                  <select
                    className="axolotl-input"
                    id={`${id}-size`}
                    defaultValue="512"
                  >
                    <option value="256">256 × 256</option>
                    <option value="512">512 × 512</option>
                    <option value="1024">1024 × 1024</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </ToolCard>
  );
}
function QuickActions({ size }: { size: CardSize }) {
  const [message, setMessage] = useState("");
  return (
    <ToolCard
      size={size}
      title="Rychlé akce"
      icon="bolt"
      footer={
        <span className="axolotl-card-footnote" role="status">
          {message || "Akce jsou zatím ukázkové."}
        </span>
      }
    >
      <div
        className={`axolotl-quick-actions ${size === "M" ? "axolotl-quick-actions-wide" : ""}`}
      >
        {[
          {
            name: "metadata" as const,
            label: "Metadata",
            detail: "Základní údaje stránky",
          },
          {
            name: "qr" as const,
            label: "QR kód",
            detail: "Odkaz k okamžitému sdílení",
          },
          {
            name: "screenshot" as const,
            label: "Screenshot",
            detail: "Zachycení aktuální stránky",
          },
          {
            name: "poznamky" as const,
            label: "Poznámka",
            detail: "Místo pro rychlou myšlenku",
          },
        ].map((action) => (
          <button
            key={action.name}
            className="axolotl-quick-action"
            onClick={() =>
              setMessage(`${action.label}: nástroj přidáme později.`)
            }
          >
            <Icon name={action.name} />
            <span>
              {action.label}
              {size === "M" && <small>{action.detail}</small>}
            </span>
            <Icon name="arrow" />
          </button>
        ))}
      </div>
    </ToolCard>
  );
}
function Components() {
  const [state, setState] = useState("empty"),
    [message, setMessage] = useState("");
  return (
    <div className="axolotl-component-grid">
      <section className="axolotl-component-block">
        <h3>Tlačítka a akce</h3>
        <p>Jedna hlavní akce, doplňující ovládání v klidnější podobě.</p>
        <div className="axolotl-component-row">
          <Button
            variant="primary"
            onClick={() => setMessage("Ukázková akce proběhla.")}
          >
            <Icon name="plus" />
            Přidat kartu
          </Button>
          <Button onClick={() => setMessage("Náhled vedlejší akce.")}>
            Upravit
          </Button>
          <Button
            variant="ghost"
            onClick={() => setMessage("Ukázka byla zrušena.")}
          >
            Zrušit
          </Button>
          <Button disabled>Nedostupné</Button>
        </div>
        <span className="axolotl-card-muted" role="status">
          {message || "Vyzkoušej kliknutí nebo ovládání klávesnicí."}
        </span>
      </section>
      <section className="axolotl-component-block">
        <h3>Pole a nabídky</h3>
        <p>Stejné proporce pro vstupy i výběr hodnot.</p>
        <div className="axolotl-field-pair">
          <label className="axolotl-field" htmlFor="axolotl-sample-name">
            Název karty
            <input
              className="axolotl-input"
              id="axolotl-sample-name"
              placeholder="Například Moje metadata"
            />
          </label>
          <label className="axolotl-field" htmlFor="axolotl-sample-size">
            Velikost
            <select className="axolotl-input" id="axolotl-sample-size">
              <option>S · kompaktní</option>
              <option>M · rozšířená</option>
              <option>L · s detailem</option>
            </select>
          </label>
        </div>
      </section>
      <section className="axolotl-component-block">
        <h3>Štítky a význam barev</h3>
        <p>Barva doplňuje text; samotná nikdy nenese celou informaci.</p>
        <div className="axolotl-component-row">
          <Badge>Ukázková data</Badge>
          <Badge tone="success">
            <Icon name="check" />V pořádku
          </Badge>
          <Badge tone="warning">Vyžaduje pozornost</Badge>
          <Badge tone="error">Nepodařilo se načíst</Badge>
        </div>
      </section>
      <section className="axolotl-component-block">
        <div className="axolotl-state-heading">
          <h3>Stavy nástroje</h3>
          <label
            className="axolotl-visually-hidden"
            htmlFor="axolotl-sample-state"
          >
            Stav nástroje
          </label>
          <select
            id="axolotl-sample-state"
            className="axolotl-input"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="empty">Prázdno</option>
            <option value="loading">Načítání</option>
            <option value="error">Chyba</option>
          </select>
        </div>
        <div className="axolotl-state-preview" role="status">
          {state === "loading" ? (
            <>
              <span className="axolotl-spinner" />
              <strong>Načítání údajů</strong>
              <span>Ukázka průběhu zpracování.</span>
            </>
          ) : state === "error" ? (
            <>
              <Icon name="info" />
              <strong>Údaje se nepodařilo načíst</strong>
              <span>Zkontroluj URL a zkus to znovu.</span>
              <Button size="small" onClick={() => setState("loading")}>
                Zkusit znovu · ukázka
              </Button>
            </>
          ) : (
            <>
              <Icon name="empty" />
              <strong>Zatím tu nic není</strong>
              <span>Začni zadáním URL v hlavičce.</span>
            </>
          )}
        </div>
      </section>
      <section className="axolotl-component-block axolotl-token-block">
        <h3>Plochy, barvy a rytmus</h3>
        <div className="axolotl-palette">
          {[
            ["card", "Karta"],
            ["raised", "Ovládání"],
            ["primary", "Hlavní text"],
            ["secondary", "Vedlejší text"],
            ["accent", "Akcent"],
          ].map(([token, label]) => (
            <div key={token}>
              <span data-axolotl-swatch={token} />
              <small>{label}</small>
            </div>
          ))}
        </div>
        <p>
          Mezery 4 / 8 / 12 / 16 / 24 / 32 · Karty 24 px · Pole 16 px · Tlačítka
          do oblouku.
        </p>
      </section>
    </div>
  );
}

function ButtonGallery() {
  const [color, setColor] = useState("#6699ff");
  const [duration, setDuration] = useState(3);
  const [clicks, setClicks] = useState(0);
  return (
    <div className="axolotl-button-gallery">
      <section className="axolotl-component-block axolotl-star-demo">
        <div className="axolotl-star-heading">
          <div>
            <span className="axolotl-eyebrow">React Bits · Animation</span>
            <h2>Star Border</h2>
            <p>Světelná stopa putující po obvodu tlačítka. Živá ukázka pro Axolotl.</p>
          </div>
          <a href="https://reactbits.dev/animations/star-border" target="_blank" rel="noopener noreferrer">Zdroj ↗</a>
        </div>
        <div className="axolotl-star-stage">
          <button
            type="button"
            className="axolotl-star-border"
            style={{ "--star-color": color, "--star-duration": `${duration}s` } as React.CSSProperties}
            onClick={() => setClicks((count) => count + 1)}
          >
            <span>Vyzkoušet Star Border <span aria-hidden="true">✦</span></span>
          </button>
          <span className="axolotl-card-muted" role="status">
            {clicks ? `Kliknutí: ${clicks}` : "Klikni na tlačítko a vyzkoušej animaci."}
          </span>
        </div>
        <div className="axolotl-star-controls">
          <label className="axolotl-field">Barva světla
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} aria-label="Barva světla Star Border" />
          </label>
          <label className="axolotl-field">Doba oběhu: {duration.toFixed(1)} s
            <input type="range" min="1" max="8" step="0.5" value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
          </label>
        </div>
      </section>
    </div>
  );
}

const tabs = [
  ["metadata", "Metadata"],
  ["qr", "QR kód"],
  ["quick", "Rychlé akce"],
  ["components", "Komponenty"],
  ["buttons", "Tlačítka"],
  ["headers", "Hlavička · A/B"],
] as const;
export function DesignSystem() {
  const [tab, setTab] = useState<string>(["headers", "buttons"].includes(new URLSearchParams(location.search).get("catalog") || "") ? new URLSearchParams(location.search).get("catalog")! : "metadata");
  const { resolvedTheme, setPreference } = usePreferences();
  return (
    <section
      className="axolotl-design-system"
      aria-labelledby="axolotl-design-heading"
    >
      <div className="axolotl-design-intro">
        <div>
          <span className="axolotl-eyebrow">Axolotl 2.0 · Design systém</span>
          <h1 id="axolotl-design-heading">Vzorník komponent</h1>
          <p>
            První návrh karet a společných prvků. Stejný základ, různá míra
            detailu.
          </p>
        </div>
        <div className="axolotl-design-tools">
          <Badge>{tab === "headers" ? "Živé ovládání" : "Ukázková data"}</Badge>
          <Button
            size="small"
            onClick={() =>
              setPreference(
                "theme",
                resolvedTheme === "dark" ? "light" : "dark",
              )
            }
          >
            {resolvedTheme === "dark" ? "Světlý náhled" : "Tmavý náhled"}
            <Icon name="appearance" />
          </Button>
        </div>
      </div>
      <div className="axolotl-design-toolbar">
        <div
          className="axolotl-design-tabs"
          role="tablist"
          aria-label="Kategorie vzorníku"
        >
          {tabs.map(([id, label], index) => (
            <button
              role="tab"
              aria-selected={tab === id}
              aria-controls={`axolotl-design-panel-${id}`}
              id={`axolotl-design-tab-${id}`}
              tabIndex={tab === id ? 0 : -1}
              key={id}
              onClick={() => setTab(id)}
              onKeyDown={(e) => {
                if (
                  ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                ) {
                  e.preventDefault();
                  const next =
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? tabs.length - 1
                        : (index +
                            (e.key === "ArrowRight" ? 1 : tabs.length - 1)) %
                          tabs.length;
                  setTab(tabs[next][0]);
                  document
                    .getElementById(`axolotl-design-tab-${tabs[next][0]}`)
                    ?.focus();
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="axolotl-design-note">Návrh 01</span>
      </div>
      <div
        role="tabpanel"
        id={`axolotl-design-panel-${tab}`}
        aria-labelledby={`axolotl-design-tab-${tab}`}
        tabIndex={0}
        className="axolotl-design-panel"
      >
        {tab === "headers" ? (
          <Suspense fallback={<p role="status">Načítám varianty hlavičky…</p>}><HeaderLab /></Suspense>
        ) : tab === "buttons" ? (
          <>
            <Suspense fallback={<p role="status">Načítám Button…</p>}><ButtonShowcase /></Suspense>
            <details><summary>Původní demonstrační Star Border (legacy)</summary><ButtonGallery /></details>
          </>
        ) : tab === "components" ? (
          <Components />
        ) : (
          <>
            <div
              className={`axolotl-variants ${tab === "quick" ? "axolotl-variants-two" : ""}`}
            >
              {(tab === "quick" ? sizes.slice(0, 2) : sizes).map((size) => (
                <div
                  className="axolotl-variant"
                  data-size={size}
                  key={`${tab}-${size}`}
                >
                  <div className="axolotl-variant-label">
                    <span>
                      {size}{" "}
                      <span>
                        ·{" "}
                        {size === "S"
                          ? "Rychlý přehled"
                          : size === "M"
                            ? "Více souvislostí"
                            : "Prostor pro detail"}
                      </span>
                    </span>
                    <small>
                      {size === "S"
                        ? "1 × 1"
                        : size === "M"
                          ? "2 × 1"
                          : "2 × 2"}
                    </small>
                  </div>
                  {tab === "metadata" ? (
                    <Metadata size={size} />
                  ) : tab === "qr" ? (
                    <QR size={size} />
                  ) : (
                    <QuickActions size={size} />
                  )}
                </div>
              ))}
            </div>
            <p className="axolotl-design-caption">
              <Icon name="info" />
              Karty ukazují směr vzhledu. Do dashboardu je zasadíme po jeho
              doladění.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
