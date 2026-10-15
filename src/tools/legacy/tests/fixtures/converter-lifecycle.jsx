import { mount } from '../../tools/image-converter/index.js';
window.workers = [];
window.Worker = class {
  constructor() { workers.push(this); }
  postMessage(message) { this.message = message; }
  terminate() { this.terminated = true; }
};
window.downloads = [];
const downloadListeners = new Set();
window.chrome = {
  runtime: { getURL: path => '/' + path },
  downloads: {
    onChanged: { addListener: listener => downloadListeners.add(listener), removeListener: listener => downloadListeners.delete(listener) },
    async download(options) { const id = downloads.length + 1; downloads.push({ id, state: 'in_progress', options }); return id; },
    async search({ id }) { return downloads.filter(item => item.id === id); },
    async cancel(id) { window.finishDownload(id, 'interrupted', 'USER_CANCELED'); }
  }
};
window.finishDownload = (id, state = 'complete', error) => {
  const item = downloads.find(item => item.id === id); Object.assign(item, { state, error });
  for (const listener of downloadListeners) listener({ id, state: { current: state }, ...(error ? { error: { current: error } } : {}) });
};
window.created = []; window.revoked = [];
const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
URL.createObjectURL = blob => { const url = create(blob); created.push(url); return url; };
URL.revokeObjectURL = url => { revoked.push(url); revoke(url); };
window.toasts = [];
window.app = { target: () => ({ connected: false }), toast(message) { toasts.push(message); }, run: task => task() };
window.tool = mount(document.querySelector('#view-convert'), app);
window.addSample = async () => tool.addFiles([new File([await (await fetch('/tests/fixtures/converter/alpha.png')).blob()], 'alpha.png')]);
window.complete = async index => {
  const worker = workers[index];
  const blob = await (await fetch('/tests/fixtures/converter/still.webp')).blob();
  worker.onmessage({ data: { id: worker.message.id, result: { buffer: await blob.arrayBuffer(), thumbnail: blob, width: 32, height: 24 } } });
};
