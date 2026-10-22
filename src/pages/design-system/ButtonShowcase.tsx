import { useEffect, useRef, useState } from "react";
import { Play, Bookmark, Trash2, Save, Download, Upload, Plus, Pencil, ExternalLink, Copy, FileOutput, NotebookPen } from "lucide-react";
import { ConfirmationDialog } from "../../design-system/library/Overlays";
import {
  Button, SplitButton,
  type ButtonVariant,
  type ButtonSize,
  type ButtonMotion,
} from "../../design-system/Button";
import "./ButtonShowcase.css";
import { buttonEntry, type Category } from "./library/registry";
import { propertyOptions } from "./library/model";

type ShowcaseType = ButtonVariant | "split";
const variants: ShowcaseType[] = [...buttonEntry.variants.map((v) => v.id as ButtonVariant), "split"];
const sizeNames = {small: "S", medium: "M", large: "L"};
const sizes = propertyOptions(buttonEntry, "size").map(
  (o) => o.value as ButtonSize,
);
const names = {...Object.fromEntries(buttonEntry.variants.map((v) => [v.id, v.label])), split: "Split Button"} as Record<ShowcaseType, string>;
const sample = (variant: ButtonVariant) =>
  variant === "destructive" ? (
    <Trash2 strokeWidth={1.7} />
  ) : variant === "icon" ? (
    <Bookmark strokeWidth={1.7} />
  ) : (
    <Play strokeWidth={1.7} />
  );
function Sample({
  variant,
  size = "medium",
  onSelect,
  ...props
}: {
  variant: ShowcaseType;
  size?: ButtonSize;
  motion?: ButtonMotion;
  starBorder?: { color: string; duration: number };
  disabled?: boolean;
  loading?: boolean;
  reducedMotion?: boolean;
  onClick?: () => void;
  onSelect?: (format: string) => void;
  id?: string;
}) {
  if (variant === "split") return <SplitButton {...props} size={size} menuLabel="Formát exportu"
    icon={<FileOutput strokeWidth={1.7} />} items={["CSV", "XLSX", "PNG"].map(label => ({id: label, label, onSelect: () => onSelect?.(label)}))}>Exportovat</SplitButton>;
  return variant === "icon" ? (
    <Button
      {...props}
      variant="icon"
      size={size}
      icon={sample(variant)}
      aria-label="Uložit do oblíbených"
    />
  ) : (
    <Button {...props} variant={variant} size={size} icon={sample(variant)}>
      {variant === "destructive" ? "Odstranit soubor" : "Spustit kontrolu"}
    </Button>
  );
}

/** The actual DS export is used in every specimen and in the async/form examples. */
export default function ButtonShowcase({
  preferenceHint = "Dark/light a velikost textu přebírá komponenta z nastavení aplikace. Omezení pohybu respektuje i nastavení systému.",
}: { preferenceHint?: string; category?: Category; testMode?: boolean } = {}) {
  const [variant, setVariant] = useState<ShowcaseType>("primary");
  const [size, setSize] = useState<ButtonSize>("medium");
  const [motion, setMotion] = useState<ButtonMotion>("none");
  const [color, setColor] = useState("#7c3aed"),
    [duration, setDuration] = useState(4);
  const [disabled, setDisabled] = useState(false),
    [loading, setLoading] = useState(false),
    [reduced, setReduced] = useState(false);
  const [busy, setBusy] = useState(false),
    [events, setEvents] = useState(0),
    [message, setMessage] = useState("Připraveno.");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const clicked = () => {
    setEvents((n) => n + 1);
    setMessage("Akce byla aktivována.");
  };
  const exported = (format: string) => {
    setEvents(n => n + 1);
    setMessage(`Ukázkový export: ${format}. Soubor se nevytváří.`);
  };
  const run = () => {
    setBusy(true);
    setMessage("Probíhá ukázková kontrola.");
    timer.current = setTimeout(() => {
      setBusy(false);
      setMessage("Kontrola dokončena.");
    }, 1000);
  };
  return (
    <section
      className="axo-button-showcase"
      aria-labelledby="axo-button-heading"
    >
      <div className="axo-button-showcase__heading">
        <div>
          <span className="axolotl-eyebrow">Components / Button</span>
          <h2 id="axo-button-heading">Button System V1</h2>
          <p>Sedm typů, jedna komponentová rodina. TweakCN theme · návrh k vizuálnímu schválení.</p>
        </div>
      </div>
      <div className="axo-button-showcase__playground">
        <div
          className="axo-button-showcase__stage"
          aria-label="Interaktivní náhled Button"
        >
          <Sample
            id="button-playground"
            variant={variant}
            size={size}
            motion={motion}
            starBorder={{ color, duration }}
            disabled={disabled}
            loading={loading}
            reducedMotion={reduced}
            onClick={variant === "split" ? () => exported("CSV") : clicked}
            onSelect={exported}
          />
          <p className="axo-button-showcase__hint">
            Hover a stisk vyzkoušej přímo. Tab ukáže focus, Enter a mezerník
            aktivují akci.
          </p>
          <output aria-label="Počet aktivací">Aktivace: {events}</output>
        </div>
        <div className="axo-button-showcase__controls">
          <fieldset>
            <legend>Varianta</legend>
            {variants.map((v) => (
              <label key={v}>
                <input
                  type="radio"
                  name="button-variant"
                  value={v}
                  checked={variant === v}
                  onChange={() => setVariant(v)}
                />
                {names[v]}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Velikost</legend>
            {sizes.map((s) => (
              <label key={s}>
                <input
                  type="radio"
                  name="button-size"
                  value={s}
                  checked={size === s}
                  onChange={() => setSize(s)}
                />
                {sizeNames[s]}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Stav</legend>
            <label>
              <input
                type="checkbox"
                checked={disabled}
                onChange={(e) => setDisabled(e.target.checked)}
              />
              Disabled
            </label>
            <label>
              <input
                type="checkbox"
                checked={loading}
                onChange={(e) => setLoading(e.target.checked)}
              />
              Loading
            </label>
          </fieldset>
          <fieldset>
            <legend>Motion</legend>
            <label>
              <input
                type="checkbox"
                checked={motion === "star-border"}
                onChange={(e) =>
                  setMotion(e.target.checked ? "star-border" : "none")
                }
              />
              Star Border
            </label>
            <label>
              <input
                type="checkbox"
                checked={reduced}
                onChange={(e) => setReduced(e.target.checked)}
              />
              Omezit pohyb
            </label>
          </fieldset>
          <div className="axo-button-showcase__motion-controls">
            <label>
              Barva stopy
              <input
                aria-label="Barva stopy"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
            <label htmlFor="button-duration">
              Doba oběhu: {duration} s
              <input
                id="button-duration"
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </label>
          </div>
          <p>{preferenceHint}</p>
        </div>
      </div>
      <section aria-labelledby="button-matrix-heading">
        <h3 id="button-matrix-heading">Varianty a velikosti</h3>
        <div className="axo-button-showcase__matrix">
          {variants.map((v) => (
            <section key={v} aria-label={names[v]}>
              <h4>{names[v]}</h4>
              {sizes.map((s) => (
                <div key={s}>
                  <span>{sizeNames[s]}</span>
                  <Sample variant={v} size={s} onClick={v === "split" ? () => exported("CSV") : clicked} onSelect={exported} />
                </div>
              ))}
            </section>
          ))}
        </div>
      </section>
      <section aria-labelledby="button-state-heading">
        <h3 id="button-state-heading">Stavy</h3>
        <p>Default, hover, pressed a focus-visible vyzkoušej na každé variantě výše: myší, Tab, Enter nebo mezerníkem. Split navíc podporuje šipky, Home/End, psaní názvu formátu a Escape; Tab nabídku opustí.</p>
        <div className="axo-button-showcase__states">
          {variants.map((v) => (
            <div key={v}>
              <h4>{names[v]}</h4>
              <span>Disabled</span><Sample variant={v} disabled />
              <span>Loading</span><Sample variant={v} loading />
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="button-context-heading">
        <h3 id="button-context-heading">V kontextu</h3>
        <div className="axo-button-showcase__contexts">
          <article>
            <h4>Asynchronní akce</h4>
            <p>
              Loading zachová zaměření, zablokuje opakovanou aktivaci a vypne
              světelné stopy.
            </p>
            <Button
              id="button-async"
              variant="primary"
              icon={<Play strokeWidth={1.7} />}
              motion={motion}
              loading={busy}
              loadingLabel="Probíhá kontrola"
              onClick={run}
            >
              Spustit kontrolu
            </Button>
          </article>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setMessage(
                "Formulář odeslán: " +
                  new FormData(e.currentTarget).get("workspace"),
              );
            }}
          >
            <h4>Nativní formulář</h4>
            <label htmlFor="button-workspace">
              Název workspace
              <input
                id="button-workspace"
                name="workspace"
                required
                defaultValue="Můj workspace"
              />
            </label>
            <Button type="submit" variant="secondary">
              Uložit workspace
            </Button>
          </form>
        </div>
        <p role="status" aria-live="polite">
          {message}
        </p>
      </section>
      <section aria-labelledby="button-actions-heading">
        <h3 id="button-actions-heading">Běžné pracovní akce</h3>
        <p>Popisek a ikona určují akci, varianta její důležitost. Tyto ukázky nepracují se skutečnými daty.</p>
        <div className="axo-button-showcase__actions">
          {([
            ["Uložit", "primary", Save], ["Stáhnout", "secondary", Download],
            ["Nahrát", "outline", Upload], ["Přidat", "primary", Plus],
            ["Upravit", "secondary", Pencil], ["Otevřít", "ghost", ExternalLink],
            ["Kopírovat", "secondary", Copy], ["Spustit kontrolu", "primary", Play],
            ["Uložit do Notebooku", "outline", NotebookPen],
          ] as const).map(([label, kind, Icon]) => <Button key={label} variant={kind}
            icon={<Icon strokeWidth={1.7} />} onClick={() => setMessage(`Ukázka akce: ${label}.`)}>{label}</Button>)}
          {["Smazat", "Smazat vše"].map(label => <ConfirmationDialog key={label}
            trigger={<Button variant="destructive" icon={<Trash2 strokeWidth={1.7} />}>{label}</Button>}
            title={label === "Smazat vše" ? "Smazat všechny ukázkové položky?" : "Smazat ukázkovou položku?"}
            description="Ukázka potvrzení nevratné akce. Žádná skutečná data se nesmažou."
            confirmLabel={label} onConfirm={() => setMessage(`Potvrzená ukázka: ${label}.`)} />)}
          <Sample variant="split" onClick={() => exported("CSV")} onSelect={exported} />
        </div>
      </section>
      <section aria-labelledby="button-guidelines-heading">
        <h3 id="button-guidelines-heading">Pravidla používání</h3>
        <dl className="axo-button-showcase__guidelines">
          <div><dt>Primary</dt><dd>Hlavní další krok. V jedné skupině akcí upřednostni jedinou primární akci.</dd></div>
          <div><dt>Secondary</dt><dd>Vedlejší akce na klidném vyplněném povrchu, například stáhnout nebo kopírovat.</dd></div>
          <div><dt>Outline</dt><dd>Alternativa s jasným obrysem, například nahrát nebo importovat.</dd></div>
          <div><dt>Ghost</dt><dd>Nenápadná doplňková akce. Hover i focus musí zachovat čitelný text a ikonu.</dd></div>
          <div><dt>Destructive</dt><dd>Mazání a nebezpečné operace pojmenuj přímo. Nevratné a hromadné akce potvrď dialogem; barva sama nestačí.</dd></div>
          <div><dt>Icon Button</dt><dd>Pro známé kompaktní akce. Vždy přidej aria-label nebo aria-labelledby; tooltip je jen doplněk.</dd></div>
          <div><dt>Split Button</dt><dd>Častá výchozí akce a její alternativy. Levá část zde exportuje CSV, šipka vybírá CSV, XLSX nebo PNG.</dd></div>
          <div><dt>Ikony a popisky</dt><dd>Krátké konkrétní sloveso, konzistentní Lucide ikona před textem. Navigaci na jinou adresu řeš odkazem.</dd></div>
          <div><dt>Loading a disabled</dt><dd>Loading zachová šířku a focus a blokuje opakování; stav sděl i textovou zprávou. Disabled je nedostupná akce — vysvětli její podmínku.</dd></div>
          <div><dt>Zaoblení a pohyb</dt><dd>Společný button radius je o 2 px větší; S má limit pod polovinou výšky. Star Border je volitelný, nemění rozměry a respektuje omezení pohybu.</dd></div>
        </dl>
      </section>
      <details>
        <summary>API, původ a stav schválení</summary>
        <p><code>src/design-system/Button</code> · Button a složený SplitButton používají stejný základ, sémantické tokeny a stavy.</p>
        <p><code>variant</code>: {buttonEntry.variants.map(v => v.id).join(" / ")}. <code>size</code>: small (S), medium (M), large (L). <code>motion</code>: none / star-border. <code>starBorder</code>: color, duration v sekundách.</p>
        <p>Nativní props a ref, icon, loading, loadingLabel, disabled, theme a reducedMotion. SplitButton navíc: menuLabel a items s id, label, onSelect a volitelným disabled.</p>
        <p>Návrh k vizuálnímu schválení, bez produkční integrace. Originální React Bits Star Border © 2026 David Haz, MIT + Commons Clause; licence a zdroj zůstávají vedle komponenty.</p>
      </details>
    </section>
  );
}
