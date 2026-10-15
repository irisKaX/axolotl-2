export class ConverterClient {
  constructor(
    createWorker = () =>
      new Worker(new URL('./worker.js', import.meta.url), {
        type: 'module', name: 'O2 WebP converter'
      })
  ) {
    this.createWorker = createWorker;
    this.worker = null;
    this.pending = null;
    this.counter = 0;
  }
  convert(file, options, { signal, onPhase = () => {} } = {}) {
    if (signal?.aborted) return Promise.reject(new DOMException('Přerušeno', 'AbortError'));
    if (this.pending) return Promise.reject(new Error('Jiný obrázek se právě převádí.'));
    if (!this.worker) {
      this.worker = this.createWorker();
      this.worker.onmessage = ({ data }) => {
        if (!this.pending || data.id !== this.pending.id) return;
        if (data.phase) {
          this.pending.onPhase(data.phase);
          return;
        }
        if (data.error) {
          this.fail(new Error(data.error), true);
          return;
        }
        const done = this.pending;
        this.pending = null;
        done.cleanup();
        const { buffer, ...result } = data.result;
        done.resolve({ ...result, blob: new Blob([buffer], { type: 'image/webp' }) });
      };
      this.worker.onerror = event => {
        event.preventDefault?.();
        this.fail(new Error('Převod selhal. Obnovte rozšíření a zkuste menší obrázek.'), true);
      };
      this.worker.onmessageerror = () => this.fail(new Error('Výsledek převodu se nepodařilo předat.'), true);
    }
    return new Promise((resolve, reject) => {
      const id = ++this.counter;
      const abort = () => this.fail(new DOMException('Přerušeno', 'AbortError'), true);
      const timer = setTimeout(
        () =>
          this.fail(
            new Error('Převod překročil časový limit 3 minut. Zkuste menší obrázek nebo úspornější režim.'),
            true
          ),
        180000
      );
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
      };
      this.pending = { id, resolve, reject, cleanup, onPhase };
      signal?.addEventListener('abort', abort, { once: true });
      try {
        this.worker.postMessage({ id, file, options });
      } catch (error) {
        this.fail(error, true);
      }
    });
  }
  fail(error, terminate = false) {
    if (terminate) {
      this.worker?.terminate();
      this.worker = null;
    }
    const current = this.pending;
    this.pending = null;
    if (current) {
      current.cleanup();
      current.reject(error);
    }
  }
  close() {
    this.fail(new DOMException('Přerušeno', 'AbortError'), true);
  }
}
