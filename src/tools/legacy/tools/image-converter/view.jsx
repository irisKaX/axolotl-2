import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowRightLeft, Download, Eye, FileImage, Pencil, SplitSquareHorizontal, Square, Trash2, Upload, X } from 'lucide-react';
import { Button, IconButton, Panel, Status, ToolHeader } from '../../shared/react-ui/components.jsx';
import { ToolActivity } from '../../shared/react-ui/tool-parts.jsx';
import { Dialog } from '../../shared/react-ui/dialog.jsx';
import { ACCEPT, sizeChange, sizeLabel } from './policy.js';
import { mountComparison } from './comparison.js';

function useBlobUrl(blob) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!blob) { setUrl(null); return; }
    const next = URL.createObjectURL(blob); setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

function Filename({ row, disabled, controller }) {
  const [editing, setEditing] = useState(false), [value, setValue] = useState(row.outputName), [error, setError] = useState('');
  const input = useRef(null), trigger = useRef(null), cancelled = useRef(false);
  useEffect(() => { if (editing) { input.current?.focus(); input.current?.select(); } }, [editing]);
  function commit(focus = false) {
    if (cancelled.current || !editing) return;
    try { controller.rename(row.id, value); setError(''); setEditing(false); if (focus) requestAnimationFrame(() => trigger.current?.focus()); }
    catch (reason) { setError(reason.message); }
  }
  return <div className="convert-filename">
    <div className="convert-filename-line">
      {editing ? <input ref={input} className="convert-name-input" aria-label={'Název výsledku pro ' + row.file.name} aria-invalid={!!error} aria-describedby={error ? 'convert-name-error-' + row.id : undefined} value={value} disabled={disabled} onChange={event => setValue(event.target.value)} onBlur={() => commit()} onKeyDown={event => {
        if (event.key === 'Enter') { event.preventDefault(); commit(true); }
        if (event.key === 'Escape') { event.preventDefault(); cancelled.current = true; setError(''); setEditing(false); requestAnimationFrame(() => trigger.current?.focus()); }
      }} /> : <><span className="convert-filename-label" title={row.outputName}>{row.outputName}</span><IconButton ref={trigger} icon={Pencil} label={'Přejmenovat ' + row.outputName} disabled={disabled} variant="ghost" onClick={() => { cancelled.current = false; setValue(row.outputName); setEditing(true); }} /></>}
    </div>
    {error && <p id={'convert-name-error-' + row.id} className="convert-error" role="alert">{error}</p>}
  </div>;
}

function Preview({ row, active }) {
  const [open, setOpen] = useState(false);
  const url = useBlobUrl(open ? row.result?.blob : null);
  useEffect(() => { if (!active || !row.result) setOpen(false); }, [active, row.result]);
  return <Dialog id={'convert-preview-' + row.id} title={row.outputName} open={open} onOpenChange={setOpen} className="convert-preview" trigger={<IconButton icon={Eye} label={'Náhled ' + row.outputName} />}>
    <div className="convert-preview-image">{url && <img src={url} alt={row.outputName} />}</div>
    <p className="helper">{row.result.width} × {row.result.height} px · {sizeLabel(row.result.blob.size)}</p>
  </Dialog>;
}

function FileRow({ row, state, controller, app, active, onCompare, selected }) {
  const thumbnail = useBlobUrl(row.result?.thumbnail);
  return <article className={'convert-row ' + row.status} data-id={row.id} aria-busy={row.status === 'working'}>
    <div className="convert-thumb">{thumbnail ? <img src={thumbnail} alt="" /> : <FileImage size={25} aria-hidden="true" />}</div>
    <div className="convert-info">
      <Filename row={row} disabled={state.busy} controller={controller} />
      <p className="convert-meta">{row.file.name} · {row.result ? `${row.result.width} × ${row.result.height} px · ` : ''}{sizeLabel(row.file.size)}{row.result ? ' → ' + sizeLabel(row.result.blob.size) : ''}</p>
      {row.result && <p className="convert-output">{row.options.lossless ? 'Bezztrátově' : 'Kvalita ' + row.options.quality + ' / 100'}</p>}
      {row.error && <p className="convert-error">{row.error}</p>}
    </div>
    <div className="convert-row-status">
      <Status state={row.status === 'done' ? 'connected' : row.status === 'error' ? 'offline' : 'neutral'}>{({done:'Převedeno',error:'Chyba',working:'Převádím',pending:'Čeká'})[row.status]}</Status>
      {row.result && <span className="convert-size-change">{sizeChange(row.file.size, row.result.blob.size)}</span>}
      {row.status === 'working' && <span className="convert-sr-only">{row.phase}</span>}
    </div>
    <div className="convert-row-actions">
      {row.result && <><IconButton icon={SplitSquareHorizontal} label={'Porovnat ' + row.outputName} aria-pressed={selected} onClick={onCompare} /><Preview row={row} active={active} /><Button className="convert-download" aria-label={'Stáhnout ' + row.outputName} disabled={state.busy} onClick={() => app.run(() => controller.saveOne(row.id))}><Download size={16} aria-hidden="true" />WebP</Button></>}
      <IconButton icon={X} label={'Odebrat ' + row.file.name} variant="ghost" disabled={state.busy} onClick={() => controller.remove(row.id)} />
    </div>
  </article>;
}

function Comparison({ row, options, hostRef }) {
  const api = useRef(null);
  useLayoutEffect(() => {
    api.current = mountComparison(hostRef.current);
    return () => { api.current.destroy(); api.current = null; };
  }, [hostRef]);
  useLayoutEffect(() => { api.current?.update(row, options); }, [row, options]);
  return <section ref={hostRef} />;
}

export function createConverterView(controller) {
  return function ConverterView({ app, active }) {
    const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
    const [options, setOptions] = useState({lossless:true,quality:95});
    const [dragging, setDragging] = useState(false), [selectedId, setSelectedId] = useState(null);
    const fileInput = useRef(null), selectButton = useRef(null), comparisonHost = useRef(null);
    const {items, busy, running} = state;
    const done = items.filter(row => row.status === 'done'), failed = items.filter(row => row.status === 'error');
    const pending = items.filter(row => row.status === 'pending'), working = items.find(row => row.status === 'working');
    const selected = items.find(row => row.id === selectedId) || (items.length === 1 ? items[0] : null);
    const before = done.reduce((sum, row) => sum + row.file.size, 0), after = done.reduce((sum, row) => sum + row.result.blob.size, 0);
    useEffect(() => { if (!active) setDragging(false); }, [active]);
    const status = state.saving.size ? state.activity.label + '…' : state.zipBusy ? `Připravuji ZIP · ${state.zipProgress} %` : working ? `${working.phase} · ${working.file.name} · ${done.length + failed.length} / ${items.length}` : pending.length ? `${done.length} hotovo · ${pending.length} čeká${failed.length ? ' · ' + failed.length + ' chyb' : ''}` : `Dokončeno: ${done.length}/${items.length}${failed.length ? ' · ' + failed.length + ' souborů se nepodařilo převést' : ''}`;
    function compare(id) { setSelectedId(id); requestAnimationFrame(() => { comparisonHost.current?.scrollIntoView({block:'start'}); comparisonHost.current?.querySelector('.compare-stage')?.focus({preventScroll:true}); }); }
    return <>
      <ToolHeader title="Konverze obrázků" description="Převeďte obrázky do WebP. Jednotlivě nebo v celé dávce." actions={<ToolActivity {...state.activity} active={active} />} />
      <div className="convert-panels">
        <Panel className="convert-upload-panel" aria-label="Obrázky a nastavení">
          <div id="convert-drop" className={'convert-drop' + (dragging ? ' dragging' : '')} onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }} onDrop={event => { event.preventDefault(); setDragging(false); controller.addFiles(event.dataTransfer.files); }}>
            <span className="convert-upload-symbol"><Upload size={26} aria-hidden="true" /></span>
            <div><h2>Přetáhněte sem obrázky</h2><p>nebo je vyberte ze svého zařízení</p></div>
            <input ref={fileInput} id="convert-files" type="file" accept={ACCEPT} multiple hidden disabled={busy} onChange={event => { controller.addFiles(event.target.files); event.target.value = ''; }} />
            <Button ref={selectButton} id="convert-select" variant="primary" disabled={busy} onClick={() => fileInput.current?.click()}><Upload size={17} aria-hidden="true" />Vybrat obrázky</Button>
          </div>
          <p className="convert-support">PNG · JPG · WebP · AVIF · BMP · GIF bez animace</p>
          <section className="convert-settings" aria-label="Nastavení převodu">
            <fieldset className="convert-modes" disabled={busy}><legend className="convert-sr-only">Způsob komprese</legend>
              {[{value:true,id:'lossless',title:'Bezztrátově',text:'Maximální kvalita. Soubor může být větší.'},{value:false,id:'lossy',title:'Menší soubor',text:'Ztrátová komprese s vlastní kvalitou.'}].map(mode => <label className="convert-mode" key={mode.id}><input id={'convert-mode-' + mode.id} type="radio" name="convert-mode" checked={options.lossless === mode.value} onChange={() => setOptions(value => ({...value,lossless:mode.value}))} /><span><strong>{mode.title}</strong><small>{mode.text}</small></span></label>)}
            </fieldset>
            <div className="convert-quality" data-inactive={options.lossless || undefined}><label htmlFor="convert-quality">Kvalita</label><input id="convert-quality" type="range" min="1" max="100" value={options.quality} disabled={busy || options.lossless} onChange={event => setOptions(value => ({...value,quality:Number(event.target.value)}))} /><output htmlFor="convert-quality">{options.quality} / 100</output></div>
            <p className="convert-settings-note">Původní rozměry a průhlednost zůstanou. Výstup je v sRGB, bez EXIF metadat. Kvalita 100 není bezztrátový režim.</p>
          </section>
          {state.notice && <p id="convert-notice" className="notice warning" role="alert">{state.notice}</p>}
        </Panel>
        <Panel className={'convert-workspace' + (!items.length ? ' is-empty' : '')} aria-label="Fronta obrázků">
          {items.length ? <>
            <div className="convert-queue-heading"><h2>Vaše obrázky <span>{items.length}</span></h2><div className="convert-queue-actions">
              <Button id="convert-clear" variant="ghost" disabled={busy} onClick={() => { controller.clear(); setSelectedId(null); selectButton.current?.focus(); }}><Trash2 size={16} aria-hidden="true" />Vyprázdnit</Button>
              {running ? <Button id="convert-stop" onClick={() => app.run(() => controller.stop())}><Square size={15} aria-hidden="true" />Zastavit</Button> : <Button id="convert-start" variant="primary" disabled={busy} onClick={() => app.run(() => controller.start(options))}><ArrowRightLeft size={17} aria-hidden="true" />Převést do WebP <span>({pending.length || items.length})</span></Button>}
            </div></div>
            <div className="convert-progress"><p id="convert-status" className="helper" role="status">{status}</p><progress max={items.length} value={done.length + failed.length} aria-label="Průběh převodu obrázků" /></div>
            <div id="convert-list" className="convert-list">{items.map(row => <FileRow key={row.id} row={row} state={state} controller={controller} app={app} active={active} selected={row.id === selected?.id} onCompare={() => compare(row.id)} />)}</div>
            <footer className="convert-footer"><p id="convert-summary" className="helper">{done.length ? `${sizeLabel(before)} → ${sizeLabel(after)} · ${sizeChange(before, after)}. ZIP obsahuje ${done.length} úspěšně převedených souborů.` : 'Výsledky stáhnete jednotlivě nebo společně v ZIPu.'}</p><Button id="convert-zip" disabled={busy || !done.length} onClick={() => app.run(() => controller.saveAll())}><Download size={17} aria-hidden="true" />Stáhnout ZIP ({done.length})</Button></footer>
          </> : <div className="convert-empty"><FileImage size={28} aria-hidden="true" /><h2>Připraveno na vaše obrázky</h2><p>Přidejte první soubory. Výsledky, jejich velikost a možnosti stažení najdete tady.</p></div>}
        </Panel>
        <Panel className="convert-comparison-panel" hidden={!selected} aria-label="Porovnání obrázku"><Comparison row={selected} options={options} hostRef={comparisonHost} /></Panel>
      </div>
    </>;
  };
}
