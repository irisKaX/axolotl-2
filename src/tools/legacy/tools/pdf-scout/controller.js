import { safeFilename } from '../../shared/utils.js';

export function downloadName(item) {
  const name = item.filename || item.title || item.name || 'dokument';
  return safeFilename(/\.pdf$/i.test(name) ? name : name + '.pdf');
}
const idleActivity = () => ({ phase: 'idle', label: 'Připraven hledat PDF', detail: 'Prohledejte stránku a vyberte dokumenty ke stažení.' });
const terminalDownload = state => ['complete', 'interrupted'].includes(state);

export class PdfController {
  constructor(app, {
    downloads = globalThis.chrome?.downloads?.onChanged,
    searchDownloads = globalThis.chrome?.downloads?.search?.bind(globalThis.chrome?.downloads),
    completionDelay = 2600
  } = {}) {
    this.app = app;
    this.downloads = downloads;
    this.searchDownloads = searchDownloads;
    this.completionDelay = completionDelay;
    this.listeners = new Set();
    this.generation = 0;
    this.destroyed = false;
    this.operation = null;
    this.downloadBatch = null;
    this.downloadEvents = new Map();
    this.activityTimer = null;
    this.state = { items: [], running: false, stopping: false, scanned: false, deep: true, coverage: '', progress: '', message: null, confirmation: null, activity: idleActivity() };
    this.downloadChanged = delta => {
      if (!delta.state || !this.downloadBatch) return;
      const state = delta.state.current;
      // An event may arrive before DOWNLOAD_FILE returns its ID. Keep it only
      // for the current batch; unrelated downloads never change tool activity.
      if (this.downloadEvents.size >= 500) this.downloadEvents.delete(this.downloadEvents.keys().next().value);
      this.downloadEvents.set(delta.id, state);
      this.observeDownload(delta.id, state);
    };
    downloads?.addListener(this.downloadChanged);
  }
  subscribe = listener => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  getSnapshot = () => this.state;
  patch(next) {
    if (this.destroyed) return;
    this.state = { ...this.state, ...next };
    for (const fn of this.listeners) fn();
  }
  updateItemBy(predicate, next) { this.patch({ items: this.state.items.map(item => predicate(item) ? { ...item, ...next } : item) }); }
  clearActivityTimer() { clearTimeout(this.activityTimer); this.activityTimer = null; }
  selectionActivity() {
    if (this.downloadBatch || this.state.running) return;
    this.clearActivityTimer();
    const count = this.state.items.filter(item => item.selected && item.status !== 'other').length;
    this.patch({ activity: { phase: 'ready', label: count ? `Vybráno ke stažení: ${count}` : 'Vyberte dokumenty', detail: count ? 'Výběr je připraven ke stažení.' : 'Dokumenty zůstanou neoznačené, dokud je nevyberete.' } });
  }
  setDeep(deep) { if (!this.state.running) this.patch({ deep }); }
  select(url, selected) {
    if (!this.state.running && !this.state.confirmation) {
      this.updateItemBy(item => item.url === url && item.status !== 'other', { selected, selectionEdited: true });
      this.selectionActivity();
    }
  }
  selectAll(selected) {
    if (!this.state.running && !this.state.confirmation) {
      this.updateItemBy(item => item.status !== 'other', { selected, selectionEdited: true });
      this.selectionActivity();
    }
  }
  begin(needsTarget = true) {
    if (this.destroyed || this.operation || this.state.confirmation) return null;
    if (needsTarget) this.app.ensureTarget();
    this.clearActivityTimer();
    this.app.lock('pdf');
    const op = { epoch: this.generation, stop: false };
    this.operation = op;
    this.patch({ running: true, stopping: false, message: null });
    return op;
  }
  alive(op) { return !this.destroyed && this.operation === op && op.epoch === this.generation; }
  finish(op) {
    if (this.operation !== op) return;
    this.operation = null;
    this.app.unlock('pdf');
    this.patch({ running: false, stopping: false });
  }
  cancel() {
    if (!this.operation) return;
    this.operation.stop = true;
    this.patch({ stopping: true, progress: 'Zastavuji. Dokončí se právě běžící požadavky.' });
  }
  resetDownloadTracking() { this.downloadBatch = null; this.downloadEvents.clear(); }
  async scan() {
    const op = this.begin();
    if (!op) return;
    this.resetDownloadTracking();
    this.patch({ progress: 'Prohledávám obsah stránky…', activity: { phase: 'working', label: 'Hledám PDF na stránce', detail: 'Procházím odkazy a vložené dokumenty.' } });
    try {
      const result = await this.app.request('PDF_SCAN', { deep: this.state.deep });
      if (!this.alive(op)) return;
      this.patch({ items: result.items.filter(item => item.status !== 'other').map(item => ({ ...item, selected: false, selectionEdited: false, checkedNetwork: false })), scanned: true, coverage: `${result.truncated ? 'Sken dosáhl limitu, seznam nemusí být úplný. ' : ''}${result.framesSkipped ? 'Některé vložené rámce nebylo možné přečíst. ' : ''}` });
      await this.verifyItems(op);
    } catch (error) {
      if (this.alive(op)) this.patch({ progress: '', message: { kind: 'error', text: error.message }, activity: { phase: 'error', label: 'Hledání se nezdařilo', detail: error.message } });
    } finally { this.finish(op); }
  }
  async verify() {
    if (!this.state.items.length) return;
    const op = this.begin();
    if (!op) return;
    this.resetDownloadTracking();
    try { await this.verifyItems(op); } finally { this.finish(op); }
  }
  async verifyItems(op) {
    let candidates = [...this.state.items.filter(item => !item.checkedNetwork), ...this.state.items.filter(item => item.checkedNetwork && !['pdf', 'other'].includes(item.status))];
    if (!candidates.length) candidates = this.state.items;
    const batch = candidates.slice(0, 120);
    let cursor = 0, done = 0;
    const progress = () => `Ověřeno ${done} / ${batch.length} adres${op.stop ? ' · zastavuji' : ''}…`;
    this.patch({ progress: progress(), activity: { phase: 'working', label: 'Ověřuji dokumenty', detail: progress() } });
    await Promise.all(Array.from({ length: Math.min(4, batch.length) }, async () => {
      while (!op.stop && this.alive(op) && cursor < batch.length) {
        const original = batch[cursor++];
        let result;
        try { result = await this.app.request('PDF_VERIFY', { url: original.url }); }
        catch (error) { result = { status: 'possible', reason: error.message }; }
        if (!this.alive(op)) return;
        const item = this.state.items.find(item => item.url === original.url);
        if (!item) continue;
        if (result.status === 'other') {
          // HTML listing pages and other confirmed formats are not PDF results.
          this.patch({ items: this.state.items.filter(item => item.url !== original.url) });
        } else {
          const next = { ...result, checkedNetwork: true };
          if (!result.filename && item.filename) next.filename = item.filename;
          if (result.status === 'possible' && item.status === 'link') next.status = 'link';
          this.updateItemBy(item => item.url === original.url, next);
        }
        done++;
        this.patch({ progress: progress(), activity: { phase: 'working', label: 'Ověřuji dokumenty', detail: progress() } });
      }
    }));
    if (!this.alive(op)) return;
    const items = this.state.items, verified = items.filter(item => item.status === 'pdf').length, unknown = items.length - verified;
    const text = this.state.coverage + (unknown ? `${unknown} adres zatím nemá potvrzený typ PDF. Důvod je uveden u každého dokumentu. ` : '') + (candidates.length > 120 ? 'Jeden běh ověřuje nejvýše 120 adres. Dalším kliknutím ověříte další. ' : '') + (op.stop ? 'Další požadavky byly zastaveny.' : '');
    this.patch({ progress: `Ověřená PDF: ${verified}${unknown ? ` · Typ zatím neověřen: ${unknown}` : ''}.`, message: text ? { text, kind: 'warning' } : null, activity: { phase: 'ready', label: op.stop ? 'Hledání bylo zastaveno' : items.length ? 'Dokumenty k výběru' : 'Žádné PDF nenalezeno', detail: items.length ? `${verified ? `${verified} ověřených PDF` : ''}${verified && unknown ? ' · ' : ''}${unknown ? `${unknown} neověřených adres` : ''}` : 'Můžete prohledat jinou stránku nebo hledání zopakovat.' } });
  }
  async download() {
    if (this.destroyed || this.operation || this.state.confirmation) return;
    const selected = this.state.items.filter(item => item.selected && item.status !== 'other');
    if (!selected.length) return;
    const count = selected.filter(item => item.status !== 'pdf').length;
    if (count) { this.patch({ confirmation: { count, epoch: this.generation, urls: selected.map(item => item.url) } }); return; }
    await this.downloadItems(selected);
  }
  dismissConfirmation() { this.patch({ confirmation: null }); }
  async confirmDownload() {
    const confirmation = this.state.confirmation;
    if (!confirmation) return;
    this.dismissConfirmation();
    if (this.destroyed || confirmation.epoch !== this.generation) return;
    await this.downloadItems(this.state.items.filter(item => confirmation.urls.includes(item.url) && item.status !== 'other'));
  }
  observeDownload(id, state) {
    const batch = this.downloadBatch;
    const tracked = batch?.files.get(id);
    if (!tracked || batch.epoch !== this.generation || this.destroyed) return;
    // A delayed search result must never overwrite a terminal onChanged event.
    if (terminalDownload(tracked.state)) return;
    tracked.state = state;
    this.updateItemBy(item => item.downloadId === id, { downloadState: state === 'complete' ? 'Dokončeno' : state === 'interrupted' ? 'Přerušeno' : 'Stahování' });
    this.refreshDownloadActivity(batch);
  }
  refreshDownloadActivity(batch) {
    if (this.downloadBatch !== batch || batch.epoch !== this.generation || this.destroyed) return;
    const files = [...batch.files.values()], complete = files.filter(item => item.state === 'complete').length;
    const interrupted = files.filter(item => item.state === 'interrupted').length;
    const pending = files.filter(item => !terminalDownload(item.state)).length;
    if (!batch.queued || pending) {
      this.patch({ activity: { phase: 'download', label: batch.queued ? 'Stahuji dokumenty' : 'Předávám ke stažení', detail: `Dokončeno ${complete} / ${batch.total}${batch.failed ? ` · Chyba předání: ${batch.failed}` : ''}${interrupted ? ` · Přerušeno: ${interrupted}` : ''}.` } });
      return;
    }
    const failed = batch.failed + interrupted;
    const text = `${complete} souborů bylo staženo do O2-Axolotl/PDF.${batch.failed ? ` ${batch.failed} souborů se nepodařilo předat.` : ''}${interrupted ? ` ${interrupted} stahování bylo přerušeno.` : ''}${batch.stopped ? ' Přidávání dalších souborů bylo zastaveno.' : ''}`;
    this.patch({ message: { kind: failed || batch.stopped ? 'warning' : 'success', text }, activity: { phase: failed || batch.stopped ? 'error' : 'done', label: failed ? 'Stahování s chybou' : batch.stopped ? 'Stahování zastaveno' : 'Dokumenty stažené', detail: text } });
    this.downloadBatch = null;
    this.downloadEvents.clear();
    this.clearActivityTimer();
    this.activityTimer = setTimeout(() => { this.activityTimer = null; this.patch({ activity: idleActivity() }); }, this.completionDelay);
  }
  async downloadItems(selected) {
    if (!selected.length) return;
    const op = this.begin(false);
    if (!op) return;
    // Keep in-flight IDs from a previous click until the browser reports their
    // outcome, including when the same document is downloaded a second time.
    const previous = this.downloadBatch;
    const batch = previous || { epoch: this.generation, files: new Map(), total: 0, failed: 0, stopped: false };
    batch.total += selected.length;
    batch.queued = false;
    this.downloadBatch = batch;
    if (!previous) this.downloadEvents.clear();
    let started = 0;
    this.patch({ progress: 'Předávám vybrané soubory ke stažení…' });
    this.refreshDownloadActivity(batch);
    try {
      for (const item of selected) {
        if (op.stop || !this.alive(op)) break;
        try {
          const result = await this.app.request('DOWNLOAD_FILE', { url: item.url, name: downloadName(item) });
          if (!this.alive(op)) return;
          if (!Number.isInteger(result?.id) || result.id < 0) throw new Error('Prohlížeč nepotvrdil přijetí souboru ke stažení.');
          batch.files.set(result.id, { state: 'in_progress' });
          this.updateItemBy(candidate => candidate.url === item.url, { downloadId: result.id, downloadState: 'Stahování' });
          started++;
          if (result.state === 'complete') this.observeDownload(result.id, 'complete');
          if (this.downloadEvents.has(result.id)) this.observeDownload(result.id, this.downloadEvents.get(result.id));
          if (this.searchDownloads) {
            // Chrome may complete a small download before the request returns.
            // Search recovers that state even if no event reached this view.
            Promise.resolve().then(() => this.searchDownloads({ id: result.id })).then(rows => {
              if (this.downloadBatch !== batch) return;
              const found = rows?.find(row => row.id === result.id);
              if (found?.state) this.observeDownload(result.id, found.state);
            }).catch(() => { /* Keep waiting for actual browser events. */ });
          }
        } catch (error) {
          if (!this.alive(op)) return;
          this.updateItemBy(candidate => candidate.url === item.url, { downloadState: 'Chyba stažení', reason: error.message });
          batch.failed++;
        }
        this.patch({ progress: `Předáno ke stažení: ${started} / ${selected.length}` });
        this.refreshDownloadActivity(batch);
      }
      if (this.alive(op)) {
        batch.queued = true;
        batch.stopped ||= op.stop;
        this.patch({ message: { kind: batch.failed ? 'warning' : 'info', text: `${started} souborů předáno ke stažení. Čekám na potvrzení prohlížeče.${batch.failed ? ` ${batch.failed} souborů se nepodařilo předat.` : ''}${op.stop ? ' Přidávání dalších souborů bylo zastaveno.' : ''}` } });
        this.refreshDownloadActivity(batch);
      }
    } finally { this.finish(op); }
  }
  onTargetChange() {
    this.generation++;
    this.clearActivityTimer();
    this.resetDownloadTracking();
    if (this.operation) this.operation.stop = true;
    this.patch({ items: [], scanned: false, coverage: '', progress: '', message: null, confirmation: null, activity: idleActivity() });
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.generation++;
    this.clearActivityTimer();
    this.resetDownloadTracking();
    if (this.operation) { this.operation.stop = true; this.finish(this.operation); }
    this.downloads?.removeListener?.(this.downloadChanged);
    this.listeners.clear();
  }
}
