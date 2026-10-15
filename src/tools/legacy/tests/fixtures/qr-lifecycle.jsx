import { mount } from '../../tools/qr-generator/index.js';
const listeners = new Set();
window.downloadRequests = [];
window.chrome = { downloads: {
  onChanged: { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) },
  async download(options) {
    const id = downloadRequests.length + 1;
    downloadRequests.push({ id, ...options, state: 'in_progress' });
    const link = document.createElement('a'); link.href = options.url; link.download = options.filename;
    document.body.append(link); link.click(); link.remove();
    return id;
  },
  async search({ id }) { return downloadRequests.filter(item => item.id === id); },
  async cancel(id) { window.finishDownload(id, 'interrupted', 'USER_CANCELED'); }
} };
window.finishDownload = (id, state = 'complete', error) => {
  const item = downloadRequests.find(item => item.id === id); Object.assign(item, { state, error });
  for (const fn of listeners) fn({ id, state: { current: state }, ...(error ? { error: { current: error } } : {}) });
};
window.target = { connected: true, loading: false, url: 'https://example.com/source' };
window.tool = mount(document.querySelector('#view-qr'), { target: () => window.target });
