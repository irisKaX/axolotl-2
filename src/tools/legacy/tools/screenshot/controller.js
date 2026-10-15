import { captureImage } from './capture-client.js';
import { timestamp } from '../../shared/utils.js';
import { saveDownload } from '../../shared/download-file.js';

export function screenshotActivity(state) {
  if (state.waiting) return { phase: 'working', label: 'Čekám na označení prvku', detail: 'Vyberte a potvrďte prvek v cílové stránce.' };
  if (state.busy) return { phase: 'working', label: 'Pořizuji snímek', detail: state.progress };
  if (state.exporting) return state.exportKind === 'copy'
    ? { phase: 'working', label: 'Kopíruji obrázek', detail: 'Čekám na potvrzení schránky.' }
    : { phase: 'download', label: 'Stahuji PNG', detail: 'Připravuji soubor ke stažení.' };
  if (state.message?.kind === 'error') return { phase: 'error', label: 'Akci se nepodařilo dokončit', detail: state.message.text };
  if (state.result && !state.downloaded) return { phase: 'ready', label: 'Snímek je připravený', detail: 'Stáhněte PNG nebo zkopírujte obrázek.' };
  return { phase: 'idle', label: 'Čekám na výběr oblasti', detail: 'Zvolte viditelnou část, celou stránku nebo prvek.' };
}

export class ScreenshotController {
  constructor(app, { captureImage: takeImage = captureImage, saveDownload: download = saveDownload } = {}) {
    this.app = app; this.takeImage = takeImage; this.download = download; this.listeners = new Set();
    this.revision = 0; this.destroyed = false; this.operation = null; this.exportOperation = null; this.original = null;
    this.state = { result: null, url: null, busy: false, exporting: false, exportKind: null, downloaded: false, waiting: false, progress: '', message: null };
  }
  getSnapshot = () => this.state;
  subscribe = fn => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  patch(next) { if (this.destroyed) return; this.state = { ...this.state, ...next }; for (const fn of this.listeners) fn(); }
  message(text, kind = 'info') { this.patch({ message: text ? { text, kind } : null }); }
  begin(waiting = false) {
    if (this.destroyed || this.state.busy || this.state.exporting) return null;
    this.app.ensureTarget(); this.app.lock('screenshot');
    const operation = { revision: ++this.revision, aborter: new AbortController() };
    this.operation = operation;
    this.patch({ busy: true, waiting, message: null, progress: waiting ? 'Označte prvek v původní stránce, upřesněte výběr a potvrďte snímek. Esc výběr zruší.' : 'Připravuji snímání stránky…' });
    return operation;
  }
  alive(operation) { return !this.destroyed && this.operation === operation && !operation.aborter.signal.aborted; }
  finish(operation) {
    if (this.operation !== operation) return;
    this.operation = null; this.patch({ busy: false, waiting: false }); this.app.unlock('screenshot');
  }
  replaceResult(next, original = false) {
    if (this.destroyed) return;
    const url = URL.createObjectURL(next.blob);
    if (this.state.url) URL.revokeObjectURL(this.state.url);
    if (original) this.original = next;
    this.patch({ result: next, url, downloaded: false });
  }
  applyCrop(output, source) {
    if (this.state.result !== source || this.destroyed || this.state.busy || this.state.exporting) return;
    this.replaceResult({ ...source, ...output, cropped: true });
    this.message('Ořez je připravený k uložení. Původní snímek můžete obnovit.', 'success');
  }
  restore() {
    if (!this.original || this.state.busy || this.state.exporting) return;
    this.replaceResult(this.original); this.message('Původní snímek byl obnoven.', 'success');
  }
  remove() {
    if (this.destroyed || this.state.busy || this.state.exporting) return;
    if (this.state.url) URL.revokeObjectURL(this.state.url);
    this.original = null; this.patch({ result: null, url: null, message: null, downloaded: false }); this.app.toast('Snímek byl odstraněn.');
  }
  async selectElement() {
    const operation = this.begin(true); if (!operation) return;
    try { await this.app.request('PICK_START', { mode: 'element' }); }
    catch (error) { if (this.alive(operation)) { this.finish(operation); this.message(error.message, 'error'); } }
  }
  async cancel() {
    const operation = this.operation; if (!operation) return;
    operation.aborter.abort();
    if (this.state.waiting) {
      try { await this.app.request('PICK_CANCEL'); }
      finally { if (this.operation === operation) { this.finish(operation); this.message('Výběr byl zrušen.'); } }
    }
  }
  async capture(mode, selectionId) {
    if (!['visible', 'full', 'element'].includes(mode)) throw new Error('Neplatná oblast snímku.');
    const operation = this.begin(); if (!operation) return;
    const source = this.app.target()?.url;
    try {
      const captured = await this.takeImage(this.app.request, mode, selectionId, ({ index, count }) => {
        if (this.alive(operation)) this.patch({ progress: `Snímání stránky · ${index} / ${count} záběrů` });
      }, operation.aborter.signal);
      if (!this.alive(operation)) return;
      this.replaceResult({ ...captured, mode, source }, true);
      this.message('Snímek je připravený. Uložte PNG nebo zkopírujte obrázek.', 'success');
    } catch (error) {
      if (!this.destroyed && this.operation === operation) this.message(error.message, operation.aborter.signal.aborted ? 'info' : 'error');
    } finally { this.finish(operation); }
  }
  async export(kind, fn) {
    if (this.destroyed || !this.state.result || this.state.busy || this.state.exporting) return;
    const { result } = this.state, operation = new AbortController();
    this.exportOperation = operation;
    this.patch({ exporting: true, exportKind: kind, downloaded: kind === 'download' ? false : this.state.downloaded, message: null });
    try {
      await fn(result, operation.signal);
      if (this.destroyed || operation.signal.aborted) return;
      if (kind === 'download') {
        this.patch({ downloaded: true });
        this.message('PNG bylo předáno prohlížeči ke stažení.', 'success');
      } else {
        this.message('Obrázek je zkopírovaný. Vložte ho pomocí Ctrl+V / ⌘V.', 'success');
      }
    } catch (error) {
      if (this.destroyed || operation.signal.aborted) return;
      if (error.name === 'AbortError' || error.code === 'USER_CANCELED') this.message('Stahování bylo zrušeno. Snímek můžete stáhnout znovu.');
      else { this.message(error.message, 'error'); throw error; }
    } finally {
      if (this.exportOperation === operation) {
        this.exportOperation = null;
        this.patch({ exporting: false, exportKind: null });
      }
    }
  }
  save() { return this.export('download', (result, signal) => this.download(result.blob, `O2-Axolotl/o2-${result.mode}${result.cropped ? '-orez' : ''}-${timestamp()}.png`, { signal })); }
  copy() { return this.export('copy', async result => {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('Kopírování obrázku tady není dostupné. Použijte tlačítko PNG.');
    try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': result.blob })]); }
    catch { throw new Error('Prohlížeč nepovolil zápis do schránky. Klikněte znovu na Kopírovat obrázek, nebo použijte PNG.'); }
  }); }
  onEvent(event) {
    if (this.destroyed) return;
    if (event.type === 'CAPTURE_CANCEL') { this.operation?.aborter.abort(); return; }
    if (!this.state.waiting || event.data?.mode !== 'element') return;
    this.finish(this.operation);
    if (event.type === 'PICK_RESULT') this.app.run(() => this.capture('element', event.data.selectionId));
    else this.message(event.type === 'PICK_ERROR' ? event.data.error : 'Výběr byl zrušen.', event.type === 'PICK_ERROR' ? 'error' : 'info');
  }
  onTargetChange() {
    if (this.destroyed) return;
    this.operation?.aborter.abort();
    if (this.state.waiting) { this.finish(this.operation); this.message('Cílová stránka se změnila. Vyberte prvek znovu.', 'warning'); }
    if (this.state.result) this.message('Náhled patří předchozí cílové stránce. Nový snímek pořídíte výběrem režimu.', 'warning');
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true; this.operation?.aborter.abort(); this.exportOperation?.abort();
    if (this.operation) this.finish(this.operation);
    if (this.state.url) URL.revokeObjectURL(this.state.url);
    this.original = null; this.state = { ...this.state, result: null, url: null, busy: false, waiting: false, exporting: false, exportKind: null }; this.listeners.clear();
  }
}
