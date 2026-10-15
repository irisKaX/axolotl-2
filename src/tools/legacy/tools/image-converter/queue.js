import { LIMITS, makeOptions, outputFilename, validateFile } from './policy.js';

export class ConversionQueue {
  constructor(convert, onChange = () => {}) {
    this.convert = convert;
    this.onChange = onChange;
    this.items = [];
    this.running = null;
    this.controller = null;
    this.nextId = 1;
  }
  add(files) {
    if (this.running) throw new Error('Před přidáním obrázků dokončete nebo zastavte převod.');
    const used = new Set(this.items.map(r => r.outputName.toLowerCase()));
    let bytes = this.items.reduce((sum, r) => sum + r.file.size, 0);
    const rejected = [];
    for (const file of files) {
      try {
        validateFile(file);
        if (this.items.length >= LIMITS.files)
          throw new Error('Do jedné dávky lze přidat nejvýše 100 obrázků.');
        if (bytes + file.size > LIMITS.batchBytes) throw new Error('Dávka překračuje celkový limit 250 MB.');
        this.items.push({
          id: this.nextId++,
          file,
          outputName: outputFilename(file.name, used),
          status: 'pending',
          result: null,
          error: '',
          phase: ''
        });
        bytes += file.size;
      } catch (error) {
        rejected.push(file.name + ': ' + error.message);
      }
    }
    this.onChange();
    return rejected;
  }
  remove(id) {
    if (this.running) return;
    this.items = this.items.filter(r => r.id !== id);
    this.onChange();
  }
  clear() {
    if (this.running) return;
    this.items = [];
    this.onChange();
  }
  rename(id, value) {
    if (this.running) throw new Error('Počkejte na dokončení převodu.');
    if (!String(value).trim()) throw new Error('Zadejte název souboru.');
    const row = this.items.find(item => item.id === id);
    if (!row) throw new Error('Obrázek už není ve frontě.');
    const used = new Set(this.items.filter(item => item !== row).map(item => item.outputName.toLowerCase()));
    row.outputName = outputFilename(value, used);
    // The UI updates the label in place; a full render would swallow a click after blur.
    return row.outputName;
  }
  start(options) {
    if (this.running) return this.running;
    const settings = makeOptions(options);
    if (!this.items.length) return Promise.resolve();
    if (!this.items.some(r => r.status === 'pending'))
      for (const row of this.items) {
        row.status = 'pending';
        row.result = null;
        row.error = '';
      }
    this.controller = new AbortController();
    // Defer work until running is assigned so UI cannot reenter from onChange.
    this.running = Promise.resolve()
      .then(() => this.process(settings))
      .finally(() => {
        this.running = null;
        this.controller = null;
        this.onChange();
      });
    this.onChange();
    return this.running;
  }
  async process(options) {
    const signal = this.controller.signal;
    let outputBytes = this.items.reduce((sum, r) => sum + (r.result?.blob.size || 0), 0);
    for (const row of this.items) {
      if (signal.aborted) break;
      if (row.status !== 'pending') continue;
      row.status = 'working';
      row.phase = 'Načítám obrázek';
      row.error = '';
      this.onChange();
      try {
        const result = await this.convert(row.file, options, {
          signal,
          onPhase: phase => {
            row.phase = phase;
            this.onChange();
          }
        });
        if (signal.aborted) throw new DOMException('Přerušeno', 'AbortError');
        if (outputBytes + result.blob.size > LIMITS.outputBytes)
          throw new Error('Výsledky překračují 250 MB. Uložte hotové soubory a zpracujte menší dávku.');
        outputBytes += result.blob.size;
        row.result = result;
        row.options = { ...options };
        row.status = 'done';
      } catch (error) {
        row.status = signal.aborted ? 'pending' : 'error';
        row.error = signal.aborted ? '' : error.message;
      } finally {
        row.phase = '';
        this.onChange();
      }
    }
  }
  stop() {
    this.controller?.abort();
    return this.running || Promise.resolve();
  }
}
