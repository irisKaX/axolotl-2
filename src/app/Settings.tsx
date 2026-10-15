import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "../components/Icon";
import { usePreferences } from "./PreferencesProvider";
import { usePageContext } from "./PageContextProvider";
import { useDisclosure } from "./useDisclosure";
import type { DisclosureProps } from "./Header";
type View = "home" | "appearance" | "integrations" | "about";
const entries: { label: string; icon: IconName; view?: View }[] = [
  { label: "Profil", icon: "profile" },
  { label: "Vzhled a prostředí", icon: "appearance", view: "appearance" },
  { label: "Integrace", icon: "integrations", view: "integrations" },
  { label: "Oprávnění k webům", icon: "shield" },
  { label: "Upozornění", icon: "bell" },
  { label: "Data a soukromí", icon: "lock" },
  { label: "O aplikaci", icon: "info", view: "about" },
];
function Choice({
  id,
  label,
  value,
  onChange,
  children,
  note,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  note?: string;
}) {
  return (
    <div className="axolotl-setting-field">
      <label className="axolotl-setting-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="axolotl-setting-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={note ? `${id}-help` : undefined}
      >
        {children}
      </select>
      {note && (
        <span className="axolotl-setting-note" id={`${id}-help`}>
          {note}
        </span>
      )}
    </div>
  );
}
function Appearance() {
  const prefs = usePreferences();
  const [saveNote, setSaveNote] = useState(
    "Změny se ukládají automaticky do tohoto prohlížeče.",
  );
  function set(key: string, value: unknown) {
    const result = prefs.setPreference(key, value);
    setSaveNote(
      result.saved
        ? "Změny jsou uložené v tomto prohlížeči."
        : "Nastavení platí nyní. Prohlížeč nepovolil jeho uložení.",
    );
  }
  return (
    <>
      <Choice
        id="axolotl-theme-choice"
        label="Barevný režim"
        value={prefs.theme}
        onChange={(value) => set("theme", value)}
      >
        <option value="dark">Tmavý</option>
        <option value="light">Světlý</option>
        <option value="system">Podle systému</option>
      </Choice>
      <Choice
        id="axolotl-text-choice"
        label="Velikost textu"
        value={prefs.textSize}
        onChange={(value) => set("textSize", value)}
        note="Text v rozbalených nabídkách a obsahu aplikace."
      >
        <option value="standard">Výchozí</option>
        <option value="large">Větší (115 %)</option>
      </Choice>
      <Choice
        id="axolotl-motion-choice"
        label="Animace"
        value={prefs.motion}
        onChange={(value) => set("motion", value)}
        note="Omezení vypne pohybové přechody a pozastaví efekt kurzoru."
      >
        <option value="system">Podle systému</option>
        <option value="full">Zapnuté</option>
        <option value="reduced">Omezené</option>
      </Choice>
      <label className="axolotl-cursor-option" htmlFor="axolotl-cursor-toggle">
        <span className="axolotl-cursor-option-text">
          <span>Efekt kurzoru</span>
          <span className="axolotl-cursor-status">
            {prefs.reducedMotion
              ? "Pozastaveno"
              : prefs.cursor
                ? "Zapnuto"
                : "Vypnuto"}
          </span>
        </span>
        <span className="axolotl-cursor-switch">
          <input
            className="axolotl-cursor-input"
            id="axolotl-cursor-toggle"
            type="checkbox"
            role="switch"
            aria-label="Efekt kurzoru"
            aria-describedby="axolotl-cursor-description"
            checked={prefs.cursor}
            disabled={prefs.reducedMotion}
            onChange={(e) => set("cursor", e.target.checked)}
          />
          <span className="axolotl-cursor-switch-track" aria-hidden="true" />
        </span>
      </label>
      <p className="axolotl-cursor-description" id="axolotl-cursor-description">
        {prefs.reducedMotion
          ? "Efekt kurzoru je pozastavený při omezených animacích."
          : prefs.resolvedTheme === "dark"
            ? "Světlušky zanechávají jemnou světelnou stopu a při kliknutí se rozletí."
            : "Jemná barevná stopa je viditelná i na světlém pozadí."}
      </p>
      <p
        className="axolotl-setting-note axolotl-settings-save-note"
        role="status"
      >
        {saveNote}
      </p>
    </>
  );
}
function Integrations() {
  const { connection, store } = usePageContext();
  return (
    <>
      <h3 className="axolotl-setting-subtitle">Propojení s prohlížečem</h3>
      <p
        className="axolotl-browser-status"
        data-axolotl-status={connection.status}
        role="status"
      >
        {connection.status === "checking"
          ? "Ověřuji propojení…"
          : connection.status === "connected"
            ? "Prohlížeč je propojený"
            : "Prohlížeč není propojený"}
      </p>
      <p className="axolotl-setting-note">
        {connection.status === "connected"
          ? `Dostupných webových karet: ${connection.tabCount}. URL vybereš v hlavičce.`
          : "Pro výběr otevřených karet nainstaluj rozšíření Axolotl. URL můžeš zatím zadávat ručně."}
      </p>
      <div className="axolotl-settings-actions">
        <button
          className="axolotl-setting-action"
          aria-disabled={connection.status === "checking"}
          onClick={() => {
            if (connection.status !== "checking") store.refresh();
          }}
        >
          Ověřit propojení
        </button>
        <a
          className="axolotl-setting-action"
          href={`${import.meta.env.BASE_URL}downloads/axolotl-prohlizec.zip`}
          download
        >
          Stáhnout rozšíření
        </a>
      </div>
      <details className="axolotl-settings-help">
        <summary>Jak propojit prohlížeč</summary>
        <ol>
          <li>Stáhni ZIP a rozbal ho do složky, kterou si ponecháš.</li>
          <li>
            V Chrome otevři <code>chrome://extensions</code>, v Edge{" "}
            <code>edge://extensions</code>.
          </li>
          <li>
            Zapni <strong>Režim pro vývojáře</strong>, zvol{" "}
            <strong>Načíst rozbalené</strong> a vyber složku s rozšířením.
          </li>
          <li>
            Obnov Axolotl. Otevřené stránky pak vybereš ikonou karet vedle URL.
          </li>
        </ol>
        <p>
          Rozšíření předává Axolotlu názvy a URL běžných webových karet ze
          stejného okna. Nečte obsah stránek. Anonymní a interní karty se
          nezobrazují.
        </p>
        <p>
          Pro odpojení vypni nebo odeber rozšíření na stejné stránce rozšíření.
        </p>
      </details>
    </>
  );
}
function About({ close }: { close: () => void }) {
  return (
    <>
      <p className="axolotl-about-name">Axolotl 2.0</p>
      <p className="axolotl-about-version">Verze 2.0 · Ve vývoji</p>
      <p className="axolotl-setting-note">
        Pracovní prostor pro webové nástroje a osobní agendu. Nástroje a
        workspace zatím připravujeme.
      </p>
      <a
        className="axolotl-setting-action axolotl-design-link"
        href="#design-system"
        onClick={() => {
          close();
          document.getElementById("axolotl-workspace")?.focus();
        }}
      >
        Otevřít vzorník komponent <Icon name="arrow" />
      </a>
      <details className="axolotl-settings-help">
        <summary>Jak používat současnou verzi</summary>
        <ul>
          <li>
            Horní nabídky otevřeš najetím myši. Konkrétní položku vybereš
            kliknutím.
          </li>
          <li>
            Do URL řádku vlož adresu webu a potvrď Enterem. S rozšířením můžeš
            vybírat otevřené karty.
          </li>
          <li>
            Vzhled upravíš v nastavení. Přepínač v headeru přepíná přímo mezi
            světlým a tmavým režimem.
          </li>
        </ul>
      </details>
      <details className="axolotl-settings-help">
        <summary>Ovládání klávesnicí</summary>
        <p>
          Tab přechází mezi prvky. Enter nebo mezerník otevře nabídku, šipky
          procházejí položky. Escape nabídku zavře a vrátí fokus.
        </p>
      </details>
      <details className="axolotl-settings-help">
        <summary>Kde jsou uložená data</summary>
        <p>
          Nastavení vzhledu se ukládá lokálně v tomto prohlížeči. Ručně zadaná
          URL platí pro aktuální relaci karty. Přihlášení ani cloudová
          synchronizace zatím nejsou k dispozici.
        </p>
      </details>
      <div className="axolotl-settings-actions">
        <a
          className="axolotl-setting-action"
          href="https://github.com/irisKaX/axolotl-2"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
        <a
          className="axolotl-setting-action"
          href="https://github.com/irisKaX/axolotl-2/commits/main/"
          target="_blank"
          rel="noreferrer"
        >
          Historie změn ↗
        </a>
      </div>
    </>
  );
}
export function Settings({ openId, setOpenId }: DisclosureProps) {
  const menu = useDisclosure("settings", openId, setOpenId);
  const [view, setView] = useState<View>("home");
  const previous = useRef<HTMLElement | null>(null),
    back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menu.open) setView("home");
  }, [menu.open]);
  useEffect(() => {
    if (view !== "home") back.current?.focus();
  }, [view]);
  return (
    <div
      className="axolotl-settings"
      ref={menu.root}
      {...menu.rootProps}
      data-axolotl-open={menu.open}
      data-axolotl-view={view}
    >
      <button
        className="axolotl-settings-trigger"
        ref={menu.trigger}
        {...menu.triggerProps}
        aria-label="Nastavení"
        title="Nastavení"
        aria-controls="axolotl-settings-panel"
      >
        <Icon name="settings" className="axolotl-settings-icon" />
      </button>
      <section
        className="axolotl-settings-panel"
        id="axolotl-settings-panel"
        data-axolotl-panel
        hidden={!menu.open}
        aria-label="Nastavení"
      >
        {view === "home" ? (
          <div className="axolotl-settings-home">
            <h2 className="axolotl-settings-heading">Nastavení</h2>
            <ul className="axolotl-settings-list">
              {entries.map((entry) => (
                <li key={entry.label}>
                  <button
                    className="axolotl-settings-item"
                    id={entry.view ? `axolotl-${entry.view}-open` : undefined}
                    disabled={!entry.view}
                    onClick={(e) => {
                      if (entry.view) {
                        previous.current = e.currentTarget;
                        setView(entry.view);
                      }
                    }}
                  >
                    <Icon name={entry.icon} className="axolotl-settings-icon" />
                    <span>{entry.label}</span>
                    {entry.view && (
                      <Icon
                        name="chevron"
                        className="axolotl-settings-icon axolotl-settings-chevron"
                        style={{ transform: "rotate(-90deg)" }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="axolotl-settings-view">
            <div className="axolotl-appearance-header">
              <button
                ref={back}
                className="axolotl-appearance-back"
                aria-label="Zpět do nastavení"
                onClick={() => {
                  const id = previous.current?.id;
                  setView("home");
                  requestAnimationFrame(() => {
                    if (id) document.getElementById(id)?.focus();
                  });
                }}
              >
                <Icon name="chevron" style={{ transform: "rotate(90deg)" }} />
              </button>
              <h2 className="axolotl-appearance-title">
                {entries.find((entry) => entry.view === view)?.label}
              </h2>
            </div>
            {view === "appearance" ? (
              <Appearance />
            ) : view === "integrations" ? (
              <Integrations />
            ) : (
              <About close={() => menu.close()} />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
