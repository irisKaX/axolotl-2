import { useEffect, useId, useRef, useState } from 'react';
import { Copy, Check, PanelsTopLeft } from 'lucide-react';
import { SeoIndicator } from './SeoIndicator';
import { Icon } from '../../components/Icon';
import { usePageContext } from '../PageContextProvider';
import { Popover } from './Popover';
import { PanelFooter, PanelHeading, PanelRow } from './PanelUI';
import s from './header.module.css';

function Tabs({ close, adopt }: { close: (restore?: boolean) => void; adopt: (url: string) => void }) {
  const { context, connection, tabs, store } = usePageContext();
  const auto = useRef<HTMLButtonElement>(null);
  const focused = useRef<number | null>(null);
  useEffect(() => {
    if (focused.current !== null && !tabs.some(tab => tab.id === focused.current)) {
      if (document.activeElement === document.body) auto.current?.focus({ preventScroll: true });
      focused.current = null;
    }
  }, [tabs]);
  return <>
    <PanelHeading title="Otevřené karty" close={() => close(true)}/>
    <p className={s.note} role="status">{connection.status === 'checking' ? 'Ověřuji propojení…' : connection.status === 'connected' ? tabs.length ? 'Vyber stránku pro práci v Axolotlu.' : 'V tomto okně není otevřená jiná webová stránka.' : 'URL můžeš zadat ručně. Pro výběr karet připoj rozšíření Axolotl.'}</p>
    {connection.status === 'connected' ? <>
      <PanelRow rowRef={auto} selected={context.source === 'auto'} icon="tabs" subtitle="Automaticky podle poslední aktivní stránky" onClick={() => { store.selectAuto(); adopt(store.getSnapshot().context.url); close(true); }}>Aktuální karta</PanelRow>
      <ul className={s.list}>{tabs.map(tab => <li key={tab.id}><PanelRow selected={context.source !== 'manual' && context.tabId === tab.id} subtitle={tab.url} onFocus={() => { focused.current = tab.id; }} onBlur={event => { if (event.relatedTarget) focused.current = null; }} onClick={() => { store.selectTab(tab.id); adopt(store.getSnapshot().context.url); close(true); }}>{tab.title || new URL(tab.url).hostname}</PanelRow></li>)}</ul>
    </> : <><p className={s.note}>Nainstaluj rozšíření Axolotl a obnov aplikaci. Ruční URL můžeš používat i bez propojení.</p><PanelRow href="https://github.com/irisKaX/axolotl-2/blob/main/browser-extension/README.md" icon="integrations" external>Jak propojit prohlížeč ↗</PanelRow></>}
    <PanelFooter>Aktuální URL nástrojů</PanelFooter>
  </>;
}

export function UrlControl() {
  const { context, store } = usePageContext();
  const [draft, setDraft] = useState(context.url);
  const [invalid, setInvalid] = useState(false);
  const [copyStatus,setCopyStatus] = useState('');
  const copyTimer=useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copySequence=useRef(0);
  useEffect(()=>()=>{clearTimeout(copyTimer.current);copySequence.current++;},[]);
  useEffect(()=>{setCopyStatus('');},[draft]);
  const input = useRef<HTMLInputElement>(null);
  const editing = useRef(false), dirty = useRef(false);
  const id = useId();
  function adopt(url: string) { setDraft(url); setInvalid(false); dirty.current = false; input.current?.setCustomValidity(''); }
  useEffect(() => { if (!editing.current) adopt(context.url); }, [context]);
  function commit() {
    try { adopt(store.commitManual(draft)); return true; }
    catch { setInvalid(true); input.current?.setCustomValidity('Zadej platnou adresu webu, například https://example.cz.'); return false; }
  }
  async function copyUrl() {
    if (dirty.current && !commit()) return;
    const value=store.getSnapshot().context.url;
    const sequence=++copySequence.current;
    try { await navigator.clipboard.writeText(value); if(sequence===copySequence.current&&value===store.getSnapshot().context.url)setCopyStatus('URL zkopírována.'); }
    catch { if(sequence===copySequence.current)setCopyStatus('Kopírování není dostupné. Vyber URL a použij Ctrl/Cmd+C.'); }
    clearTimeout(copyTimer.current); copyTimer.current=setTimeout(()=>setCopyStatus(''),2500);
  }
  return <div className={s.urlGroup}><SeoIndicator draft={draft}/><form className={s.url} data-header-url onSubmit={event => { event.preventDefault(); if (commit()) input.current?.blur(); }} noValidate>
    <label htmlFor={id} className={s.urlLabel}><Icon name="link"/><span className={s.visuallyHidden}>Aktuální URL</span></label>
    <input id={id} ref={input} type="text" inputMode="url" spellCheck={false} autoComplete="off" placeholder="Vlož URL stránky" title={context.url || 'Vlož URL stránky'} value={draft} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-error` : undefined}
      onFocus={() => { editing.current = true; }} onChange={event => { copySequence.current++; setDraft(event.target.value); dirty.current = true; setInvalid(false); event.target.setCustomValidity(''); }}
      onBlur={() => { editing.current = false; if (dirty.current) commit(); else adopt(store.getSnapshot().context.url); }}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); adopt(store.getSnapshot().context.url); input.current?.blur(); } }}/>
    <button type="button" className={s.copyTrigger} aria-label="Kopírovat URL" disabled={!draft.trim()} onClick={copyUrl}>{copyStatus==='URL zkopírována.'?<Check aria-hidden="true"/>:<Copy aria-hidden="true"/>}</button>
    <Popover id="tabs" title="Otevřené karty" hover={false} trigger={(props, ref) => <button {...props} ref={ref} type="button" className={s.tabsTrigger} aria-label="Vybrat kartu prohlížeče"><PanelsTopLeft aria-hidden="true"/><Icon name="chevron"/></button>}>
      {close => <Tabs close={close} adopt={adopt}/>}
    </Popover>
    {invalid && <span id={`${id}-error`} className={s.urlError} role="alert">Zadej platnou webovou URL.</span>}
    <span role="status" className={copyStatus?s.urlFeedback:s.visuallyHidden}>{copyStatus}</span>
  </form></div>;
}
