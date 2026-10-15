import { ConversionQueue } from './queue.js';
import { ConverterClient } from './client.js';
import { saveBlob } from './download.js';

// Immutable snapshots bridge the mutable queue to React. Synchronous locks also
// cover two actions dispatched before React has painted the next state.
export class ConverterController {
  constructor(app, { client = new ConverterClient(), save = saveBlob,
    zip = async (...args) => (await import('./zip.js')).buildZip(...args) } = {}) {
    this.app = app;
    this.client = client;
    this.save = save;
    this.zip = zip;
    this.listeners = new Set();
    this.saving = new Set();
    this.destroyed = false;
    this.zipBusy = false;
    this.zipProgress = 0;
    this.downloaded = false;
    this.downloadController = null;
    this.notice = '';
    this.queue = new ConversionQueue((...args) => client.convert(...args), () => this.publish());
    this.publish();
  }
  getSnapshot = () => this.snapshot;
  subscribe = listener => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  get busy() { return !!this.queue.running || this.zipBusy || this.saving.size > 0; }
  activity() {
    const items = this.queue.items;
    if (this.saving.size) return { phase: 'download', label: this.saving.has('zip') ? 'Stahuji ZIP' : 'Stahuji obrázek' };
    if (this.zipBusy) return { phase: 'working', label: 'Připravuji ZIP', detail: this.zipProgress + ' %' };
    if (this.queue.running) return { phase: 'working', label: 'Převádím obrázky', detail: items.filter(row => ['done', 'error'].includes(row.status)).length + ' / ' + items.length };
    if (!items.length || this.downloaded) return { phase: 'idle', label: 'Čeká na obrázky' };
    if (items.some(row => row.status === 'pending')) return { phase: 'ready', label: 'Čeká na převod' };
    if (items.some(row => row.result)) return { phase: 'done', label: 'Čeká na stažení' };
    return { phase: 'error', label: 'Převod se nezdařil' };
  }
  publish() {
    if (this.destroyed) return;
    this.snapshot = { items: this.queue.items.map(row => ({ ...row })), running: !!this.queue.running,
      busy: this.busy, activity: this.activity(), saving: new Set(this.saving), zipBusy: this.zipBusy, zipProgress: this.zipProgress, notice: this.notice };
    for (const listener of this.listeners) listener();
  }
  addFiles(files) {
    if (this.destroyed) return { accepted: 0, rejected: [] };
    const list = [...(files || [])];
    if (this.busy || !list.length) {
      this.notice = this.busy ? 'Nejdříve dokončete nebo zastavte aktuální operaci.' : 'Vyberte soubory obrázků. Celé složky sem nepřidávejte.';
      this.publish();
      return { accepted: 0, rejected: [this.notice] };
    }
    const before = this.queue.items.length;
    this.downloaded = false;
    const rejected = this.queue.add(list);
    this.notice = rejected.join('\n');
    this.publish();
    return { accepted: this.queue.items.length - before, rejected };
  }
  clear() { if (this.destroyed || this.busy) return; this.notice = ''; this.downloaded = false; this.queue.clear(); }
  remove(id) { if (!this.destroyed && !this.busy) { this.downloaded = false; this.queue.remove(id); } }
  rename(id, value) {
    if (this.destroyed || this.busy) throw new Error('Počkejte na dokončení operace.');
    const name = this.queue.rename(id, value);
    this.publish();
    return name;
  }
  async start(options) {
    if (this.destroyed || this.busy) return;
    this.notice = '';
    this.downloaded = false;
    try { await this.queue.start(options); }
    finally { this.client.close(); }
  }
  stop() { return this.queue.stop(); }
  async saveOne(id) {
    if (this.destroyed || this.busy) return;
    const row = this.queue.items.find(item => item.id === id);
    if (!row?.result) return;
    this.downloaded = false;
    this.downloadController = new AbortController();
    this.saving.add(id); this.publish();
    try {
      await this.save(row.result.blob, row.outputName, { signal: this.downloadController.signal });
      if (!this.destroyed) { this.downloaded = true; this.app.toast('WebP bylo předáno prohlížeči ke stažení.'); }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'USER_CANCELED') throw error;
    } finally { this.downloadController = null; this.saving.delete(id); this.publish(); }
  }
  async saveAll() {
    if (this.destroyed || this.busy || !this.queue.items.some(row => row.result)) return;
    this.downloaded = false;
    this.zipBusy = true; this.zipProgress = 0; this.publish();
    try {
      const archive = await this.zip(this.queue.items, percent => { this.zipProgress = Math.round(percent); this.publish(); });
      if (this.destroyed) return;
      this.downloadController = new AbortController();
      this.saving.add('zip'); this.publish();
      await this.save(archive, 'O2-WebP-' + new Date().toISOString().slice(0, 10) + '.zip', { signal: this.downloadController.signal });
      if (!this.destroyed) { this.downloaded = true; this.app.toast('ZIP byl předán prohlížeči ke stažení.'); }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'USER_CANCELED') throw error;
    } finally { this.downloadController = null; this.saving.delete('zip'); this.zipBusy = false; this.publish(); }
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.listeners.clear();
    this.downloadController?.abort();
    this.queue.stop();
    this.client.close();
  }
}
