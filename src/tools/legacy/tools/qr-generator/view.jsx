import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Copy, Download, Globe, QrCode } from 'lucide-react';
import { Button, IconButton } from '../../shared/react-ui/components.jsx';
import { Field, Select } from '../../shared/react-ui/fields.jsx';
import { PresentationStage as Stage, ToolHeading, WorkspaceCard } from '../../shared/react-ui/tool-parts.jsx';
import { createQr, paintQr, QR_SIZES, MAX_BYTES } from './model.js';
import { exportQrOutput } from './export.js';

const initial = { text: '', kind: 'url', size: 512, color: '#000000', background: 'solid', start: '#ffffff', end: '#e3eaff', angle: 135 };
const kindOptions = [{ value: 'url', label: 'Odkaz' }, { value: 'text', label: 'Běžný text' }];
const backgroundOptions = [{ value: 'solid', label: 'Jedna barva' }, { value: 'transparent', label: 'Bez pozadí' }, { value: 'gradient', label: 'Gradient' }];
const sizeOptions = QR_SIZES.map(size => ({ value: String(size), label: `${size} × ${size} px` }));

function ColorField({ id, label, value, onChange, hidden }) {
  return <div className="ax-field qr-field" hidden={hidden}><label htmlFor={id}>{label}</label><div className="qr-color-control"><input id={id} type="color" value={value} onChange={event => onChange(event.target.value)} /><span className="qr-color-value">{value.toUpperCase()}</span></div></div>;
}
function QrEmptyIcon() {
  return <span className="react-empty-icon" aria-hidden="true"><QrCode size={30} strokeWidth={1.6} /></span>;
}
export function QrView({ app, active, target }) {
  const [settings, setSettings] = useState(initial);
  const [rendered, setRendered] = useState({ qr: null, error: '', revision: 0 });
  const [exporting, setExporting] = useState(null);
  const [status, setStatus] = useState(null);
  const [completed, setCompleted] = useState(false);
  const canvasRef = useRef(null), inputRef = useRef(null);
  const revision = useRef(0), delay = useRef(0), alive = useRef(true), exportOperation = useRef(null);
  const qr = rendered.qr, pending = rendered.revision !== revision.current;
  const ready = !!qr && !pending && !exporting;
  const targetUsable = !target?.loading && /^https?:\/\//i.test(target?.url || '');
  function change(patch, typing = false) {
    revision.current++;
    exportOperation.current?.abort();
    delay.current = typing ? 150 : 0;
    setStatus(null); setCompleted(false);
    setSettings(value => ({ ...value, ...patch }));
  }
  useLayoutEffect(() => {
    const generation = revision.current;
    function render() {
      if (!alive.current || generation !== revision.current) return;
      let next = null, error = '';
      if (settings.text.trim()) {
        try {
          next = createQr(settings.text, { kind: settings.kind, size: settings.size, color: settings.color,
            background: { type: settings.background, color: settings.start, colorEnd: settings.end, angle: settings.angle } });
          const canvas = canvasRef.current;
          canvas.width = next.size; canvas.height = next.size;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Prohlížeč nemůže vytvořit obrázek QR kódu.');
          paintQr(context, next);
        } catch (reason) { next = null; error = reason.message; }
      }
      setRendered({ qr: next, error, revision: generation });
    }
    if (delay.current) { const timer = setTimeout(render, delay.current); return () => clearTimeout(timer); }
    const frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [settings]);
  useEffect(() => () => {
    alive.current = false; revision.current++;
    exportOperation.current?.abort();
  }, []);
  function useCurrent() {
    const source = app.target();
    if (!source || source.loading || !/^https?:\/\//i.test(source.url || '')) return;
    change({ kind: 'url', text: source.url });
    inputRef.current?.focus();
  }
  async function exportQr(format) {
    if (!ready || exportOperation.current || !alive.current) return;
    const generation = revision.current, snapshot = qr;
    const operation = new AbortController();
    exportOperation.current = operation; setExporting(format); setStatus(null);
    try {
      await exportQrOutput(snapshot, format, { signal: operation.signal });
      if (alive.current && generation === revision.current && !operation.signal.aborted) {
        setCompleted(true);
        setStatus({ kind: 'success', text: format === 'copy' ? 'QR kód je zkopírovaný jako obrázek PNG.' : `QR kód ve formátu ${format.toUpperCase()} byl předán prohlížeči ke stažení.` });
      }
    } catch (error) {
      if (alive.current && generation === revision.current && !operation.signal.aborted) setStatus(error.name === 'AbortError' || error.code === 'USER_CANCELED'
        ? { kind: 'info', text: 'Stahování bylo zrušeno. QR kód můžete stáhnout znovu.' }
        : { kind: 'error', text: error.message });
    } finally {
      if (exportOperation.current === operation) { exportOperation.current = null; if (alive.current) setExporting(null); }
    }
  }
  const message = pending ? null : (rendered.error ? { kind: 'error', text: rendered.error } : status);
  const activity = pending && settings.text.trim() ? { phase: 'working', label: 'Vytvářím QR kód', detail: 'Aktualizuji náhled podle zadaného obsahu.' }
    : exporting === 'copy' ? { phase: 'working', label: 'Kopíruji QR kód', detail: 'Čekám na potvrzení schránky.' }
    : exporting ? { phase: 'download', label: `Stahuji ${exporting.toUpperCase()}`, detail: 'Připravuji soubor ke stažení.' }
    : message?.kind === 'error' ? { phase: 'error', label: 'QR kód potřebuje pozornost', detail: message.text }
    : qr && !pending && !completed ? { phase: 'ready', label: 'QR kód je připravený', detail: 'Stáhněte PNG, SVG nebo zkopírujte obrázek.' }
    : { phase: 'idle', label: 'Čekám na text nebo odkaz', detail: completed ? 'Upravte obsah pro další QR kód.' : 'Vložte obsah a náhled se vytvoří automaticky.' };
  return <>
    <ToolHeading id="qr" title="QR generátor" description="Vložte odkaz nebo text. QR kód se vytvoří automaticky." active={active} activity={activity}/>
    <section className="workspace-board" data-workspace="qr" aria-label="Panely nástroje"><div className="workspace-grid">
      <WorkspaceCard id="content" title="Obsah a vzhled"><div className="qr-form">
        <div className="qr-form-header"><h2 className="atelier-inspector-title">Nastavení QR kódu</h2><Select id="qr-kind" aria-label="Typ obsahu" value={settings.kind} onValueChange={kind => change({ kind })} options={kindOptions} /></div>
        <div className="qr-content-input"><div className="qr-input-label"><label htmlFor="qr-content">{settings.kind === 'url' ? 'Odkaz k zakódování' : 'Text k zakódování'}</label><Button id="qr-current" variant="ghost" disabled={!targetUsable} onClick={useCurrent} title="Použije URL cílové karty z horní lišty."><Globe size={15} aria-hidden="true" />Aktuální stránka</Button></div>
          <textarea id="qr-content" ref={inputRef} value={settings.text} onChange={event => change({ text: event.target.value }, true)} aria-describedby="qr-content-note" rows={2} spellCheck={false} autoComplete="off" inputMode={settings.kind === 'url' ? 'url' : 'text'} placeholder={settings.kind === 'url' ? 'https://www.example.cz/stranka' : 'Napište nebo vložte text…'} />
          <p id="qr-content-note">Nejvýše {MAX_BYTES} bajtů včetně diakritiky a emoji.</p>
        </div>
        <div className="qr-settings"><Field id="qr-size" label="Velikost obrázku"><Select value={String(settings.size)} onValueChange={size => change({ size: Number(size) })} options={sizeOptions} /></Field><ColorField id="qr-color" label="Barva kódu" value={settings.color} onChange={color => change({ color })} /><Field id="qr-background-kind" label="Pozadí"><Select value={settings.background} onValueChange={background => change({ background })} options={backgroundOptions} /></Field></div>
        <section className="qr-background-settings" aria-label="Pozadí QR kódu">
          <div className="qr-background-colors" data-kind={settings.background} hidden={settings.background === 'transparent'}><ColorField id="qr-background-color" label="Barva pozadí" value={settings.start} onChange={start => change({ start })} /><ColorField hidden={settings.background !== 'gradient'} id="qr-background-end" label="Druhá barva" value={settings.end} onChange={end => change({ end })} />
            <div className="qr-background-angle" hidden={settings.background !== 'gradient'}><Field id="qr-background-angle" label="Směr"><input type="range" min="0" max="360" step="15" value={settings.angle} onChange={event => change({ angle: Number(event.target.value) })} /></Field><output htmlFor="qr-background-angle">{settings.angle}°</output></div>
          </div>
          <p className="qr-background-hint">{settings.background === 'transparent' ? 'PNG i SVG zachovají průhlednost. Použijte kontrastní podklad a ponechte volný okraj.' : 'Pozadí se zachová v PNG i SVG. Dbejte na kontrast s barvou kódu.'}</p>
        </section>
      </div></WorkspaceCard>
      <WorkspaceCard id="preview" title="Náhled a export"><div className="qr-result"><Stage><div className="qr-preview-frame" data-background={settings.background} aria-busy={pending || undefined}>
        <div className="empty-state" hidden={!!qr}><QrEmptyIcon /><h3>{rendered.error ? 'QR kód zatím nelze vytvořit' : 'Váš QR kód se objeví tady'}</h3><p className="muted">{rendered.error || 'Zadejte odkaz nebo text. Náhled se aktualizuje automaticky.'}</p></div>
        <canvas id="qr-preview" ref={canvasRef} hidden={!qr} role="img" aria-label="Náhled QR kódu" />
      </div></Stage><div className="qr-preview-meta" hidden={!qr}><p className="qr-detail small muted" hidden={!qr}>{qr && `${qr.size} × ${qr.size} px · ${qr.bytes} / ${MAX_BYTES} bajtů`}</p><details className="qr-encoded" hidden={!qr}><summary>Zakódovaný obsah</summary><p>{qr?.text}</p></details></div>
        <div className="qr-actions"><Button id="qr-png" variant="primary" aria-label="Stáhnout QR kód jako PNG" disabled={!ready} onClick={() => void exportQr('png')}><Download size={16} aria-hidden="true" />Stáhnout PNG</Button><Button id="qr-svg" aria-label="Stáhnout QR kód jako SVG" disabled={!ready} onClick={() => void exportQr('svg')}>SVG</Button><IconButton id="qr-copy" label="Kopírovat obrázek" icon={Copy} disabled={!ready} onClick={() => void exportQr('copy')} /></div>
        <p id="qr-status" className={`notice ${message?.kind || ''}`} role="status" aria-live="polite" hidden={!message}>{message?.text}</p>
        <details className="tool-help"><summary>Který formát stáhnout?</summary><div className="tool-help-content">PNG pro běžné použití, SVG pro tisk a libovolné zvětšení. Oba formáty zachovají zvolené pozadí i průhlednost. Volný ochranný okraj kolem kódu zůstává součástí souboru.<p className="qr-local-note small muted">Generování probíhá v prohlížeči. Obsah se nikam neodesílá ani neukládá do historie.</p></div></details>
</div></WorkspaceCard>
    </div></section>
  </>;
}
