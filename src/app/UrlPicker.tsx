import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { usePageContext } from "./PageContextProvider";
import { useDisclosure } from "./useDisclosure";
import type { DisclosureProps } from "./Header";
export function UrlPicker({ openId, setOpenId }: DisclosureProps) {
  const { context, connection, tabs, store } = usePageContext();
  const menu = useDisclosure("tabs", openId, setOpenId);
  const [draft, setDraft] = useState(context.url),
    [invalid, setInvalid] = useState(false);
  const input = useRef<HTMLInputElement>(null),
    editing = useRef(false),
    dirty = useRef(false);
  const autoOption = useRef<HTMLButtonElement>(null);
  const focusedTab = useRef<number | null>(null);
  function adopt(url: string) {
    setDraft(url);
    setInvalid(false);
    dirty.current = false;
    input.current?.setCustomValidity("");
  }
  useEffect(() => {
    if (!editing.current) adopt(context.url);
  }, [context]);
  useEffect(() => {
    if (
      focusedTab.current !== null &&
      !tabs.some((tab) => tab.id === focusedTab.current)
    ) {
      if (menu.open && document.activeElement === document.body) {
        (autoOption.current ?? menu.trigger.current)?.focus();
      }
      focusedTab.current = null;
    }
  }, [tabs, menu.open, menu.trigger]);
  function commit() {
    try {
      const url = store.commitManual(draft);
      setDraft(url);
      setInvalid(false);
      dirty.current = false;
      input.current?.setCustomValidity("");
      return true;
    } catch {
      setInvalid(true);
      input.current?.setCustomValidity(
        "Zadej platnou adresu webu, například https://example.cz.",
      );
      input.current?.reportValidity();
      return false;
    }
  }
  const connected = connection.status === "connected";
  return (
    <div className="axolotl-url-context" aria-label="Aktuální URL">
      <form
        className="axolotl-url-bar"
        id="axolotl-url-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (commit()) input.current?.blur();
        }}
      >
        <label htmlFor="axolotl-current-url" className="axolotl-url-label">
          <Icon name="link" />
          <span className="axolotl-visually-hidden">Aktuální URL</span>
        </label>
        <input
          ref={input}
          className="axolotl-url-input"
          id="axolotl-current-url"
          type="text"
          inputMode="url"
          spellCheck={false}
          autoComplete="off"
          placeholder="Vlož URL stránky"
          title={context.url || "Vlož URL stránky"}
          value={draft}
          aria-invalid={invalid || undefined}
          onFocus={() => {
            editing.current = true;
          }}
          onChange={(e) => {
            setDraft(e.target.value);
            dirty.current = true;
            setInvalid(false);
            e.target.setCustomValidity("");
          }}
          onBlur={() => {
            editing.current = false;
            if (dirty.current) commit();
            else setDraft(context.url);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              dirty.current = false;
              setDraft(context.url);
              setInvalid(false);
              e.currentTarget.setCustomValidity("");
              input.current?.blur();
            }
          }}
        />
        <div id="axolotl-tabs-control" ref={menu.root} {...menu.rootProps}>
          <button
            type="button"
            className="axolotl-tabs-trigger"
            aria-label="Vybrat kartu prohlížeče"
            ref={menu.trigger}
            {...menu.triggerProps}
            aria-controls="axolotl-tabs-panel"
          >
            <Icon name="tabs" />
            <Icon name="chevron" className="axolotl-nav-chevron" />
          </button>
          <section
            className="axolotl-tabs-panel"
            id="axolotl-tabs-panel"
            hidden={!menu.open}
            data-axolotl-panel
            aria-labelledby="axolotl-tabs-heading"
          >
            <div className="axolotl-tabs-surface">
              <h2 className="axolotl-tabs-heading" id="axolotl-tabs-heading">
                Otevřené karty
              </h2>
              <p className="axolotl-tabs-status" role="status">
                {connection.status === "checking"
                  ? "Ověřuji propojení…"
                  : connected
                    ? tabs.length
                      ? "Vyber stránku pro práci v Axolotlu."
                      : "V tomto okně zatím není otevřená jiná webová stránka."
                    : "URL můžeš zadat ručně. Pro výběr karet připoj rozšíření Axolotl."}
              </p>
              {connected && (
                <>
                  <button
                    type="button"
                    className="axolotl-tab-option axolotl-tab-auto"
                    ref={autoOption}
                    aria-pressed={context.source === "auto"}
                    onClick={() => {
                      store.selectAuto();
                      adopt(store.getSnapshot().context.url);
                      menu.close(true);
                    }}
                  >
                    <span>Aktuální karta</span>
                    <small>Automaticky podle poslední aktivní stránky</small>
                  </button>
                  <ul className="axolotl-tabs-list">
                    {tabs.map((tab) => (
                      <li key={tab.id}>
                        <button
                          type="button"
                          className="axolotl-tab-option"
                          onFocus={() => {
                            focusedTab.current = tab.id;
                          }}
                          onBlur={(event) => {
                            if (event.relatedTarget) focusedTab.current = null;
                          }}
                          aria-pressed={
                            context.source !== "manual" &&
                            context.tabId === tab.id
                          }
                          onClick={() => {
                            store.selectTab(tab.id);
                            adopt(tab.url);
                            menu.close(true);
                          }}
                        >
                          <span>{tab.title || new URL(tab.url).hostname}</span>
                          <small>{tab.url}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {!connected && (
                <a
                  className="axolotl-tabs-connect"
                  href="https://github.com/irisKaX/axolotl-2/blob/main/browser-extension/README.md"
                  target="_blank"
                  rel="noreferrer"
                >
                  Připojit prohlížeč <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
