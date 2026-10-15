import { connectionError } from './page-errors.js';

// Self-contained because Chrome serializes this function into the isolated world.
// Only read the loaded document: no fetch, navigation, extra permissions or DOM writes.
export function collectIndexation() {
  if (!['text/html', 'application/xhtml+xml'].includes(document.contentType)) return null;
  const entries = [];
  let truncated = false;
  for (const element of document.querySelectorAll('meta[name]')) {
    const name = (element.getAttribute('name') || '').trim().toLowerCase();
    if (name !== 'robots' && !/(?:bot|spider|crawler)/.test(name) && !['slurp', 'yandex'].includes(name)) continue;
    const content = element.getAttribute('content') || '';
    if (entries.length >= 128) { truncated = true; break; }
    if (content.length > 4096) truncated = true;
    entries.push({ name, content: content.slice(0, 4096) });
  }
  return { url: location.href, source: 'meta', entries, truncated };
}

export async function readIndexation(tab, expected = {}) {
  const stale = () => new Error('Cílová stránka se během čtení meta robots změnila.');
  if (expected.id !== tab.id || expected.url !== tab.url || tab.status === 'loading') throw stale();
  let frames;
  try {
    frames = await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] }, world: 'ISOLATED', func: collectIndexation });
  } catch (error) { throw connectionError(error); }
  const frame = frames.find(item => item.frameId === 0), result = frame?.result;
  if (!result || result.url !== tab.url || !Array.isArray(result.entries)) throw new Error('Meta robots nejsou dostupná.');
  let current, identity;
  try {
    current = await chrome.tabs.get(tab.id);
    identity = await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] }, world: 'ISOLATED', func: () => location.href });
  } catch (error) { throw connectionError(error); }
  const currentFrame = identity.find(item => item.frameId === 0);
  if (current.url !== tab.url || current.status === 'loading' || currentFrame?.result !== tab.url ||
      !frame.documentId || frame.documentId !== currentFrame?.documentId) throw stale();
  return { ...result, id: tab.id, documentId: frame.documentId };
}
