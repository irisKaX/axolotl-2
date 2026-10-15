let sequence = 0;
export class AuditController {
  constructor(app, { id, requestType, analyze = value => value }) {
    this.app = app; this.id = id; this.requestType = requestType; this.analyze = analyze;
    this.listeners = new Set(); this.operation = null; this.destroyed = false;
    this.state = { result: null, running: false, scanned: false, message: null, revision: 0, scannedAt: null, sourceUrl: '' };
  }
  getSnapshot = () => this.state;
  subscribe = listener => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  patch(next) {
    if (this.destroyed) return;
    this.state = { ...this.state, ...next }; for (const listener of this.listeners) listener();
  }
  alive(op) { return !this.destroyed && this.operation === op; }
  release(op) {
    if (this.operation !== op) return;
    this.operation = null; this.app.unlock(this.id); this.patch({ running: false });
  }
  async scan() {
    if (this.destroyed || this.operation) return;
    try { this.app.ensureTarget(); this.app.lock(this.id); }
    catch (error) { this.patch({ message: { kind: 'error', text: error.message } }); return; }
    const op = { scanId: `${this.id}-${Date.now()}-${++sequence}` };
    this.operation = op; this.patch({ running: true, message: null });
    try {
      const snapshot = await this.app.request(this.requestType, { scanId: op.scanId });
      if (!this.alive(op)) return;
      const result = this.analyze(snapshot);
      this.patch({ result, scanned: true, revision: this.state.revision + 1, scannedAt: new Date().toISOString(), sourceUrl: snapshot.url || this.app.target()?.url || '' });
    } catch (error) {
      if (this.alive(op)) this.patch({ message: { kind: 'error', text: error.message + (this.state.scanned ? ' Zobrazené výsledky jsou z předchozí kontroly.' : '') } });
    } finally { this.release(op); }
  }
  cancel() {
    const op = this.operation; if (!op) return;
    this.release(op);
    this.patch({ message: { kind: 'info', text: 'Kontrola byla zrušena.' + (this.state.scanned ? ' Zobrazené výsledky jsou z předchozí kontroly.' : '') } });
    void Promise.resolve().then(() => this.app.request('AUDIT_CANCEL', { scanId: op.scanId })).catch(() => {});
  }
  onTargetChange() {
    this.cancel();
    this.patch({ result: null, scanned: false, message: null, scannedAt: null, sourceUrl: '', revision: this.state.revision + 1 });
  }
  destroy() { if (this.destroyed) return; this.cancel(); this.destroyed = true; this.listeners.clear(); }
}
