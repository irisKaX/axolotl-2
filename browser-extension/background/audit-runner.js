import { connectionError } from './page-errors.js';
const jobs = new Map(), cancelled = new Map();
function keyFor(sessionId, scanId) {
  if (typeof scanId !== 'string' || !/^[\w-]{1,120}$/.test(scanId)) throw Error('Neplatná kontrola stránky.');
  return `${sessionId}:${scanId}`;
}
function prune() { for (const [key, expires] of cancelled) if (expires < Date.now()) cancelled.delete(key); }
export function cancelAudit(sessionId, scanId) {
  prune(); const key = keyFor(sessionId, scanId);
  if (jobs.has(key)) jobs.get(key).abort();
  else { cancelled.set(key, Date.now() + 60000); if (cancelled.size > 1000) cancelled.delete(cancelled.keys().next().value); }
  return {};
}
export function cancelSessionAudits(sessionId) {
  for (const [key, controller] of jobs) if (key.startsWith(`${sessionId}:`)) controller.abort();
}
export async function runPageAudit(tab, collector, { sessionId, scanId, probe } = {}) {
  prune(); const key = keyFor(sessionId, scanId);
  if (cancelled.has(key)) { cancelled.delete(key); throw Error('Kontrola byla zrušena.'); }
  if (jobs.has(key)) throw Error('Tato kontrola už probíhá.');
  const controller = new AbortController(); jobs.set(key, controller);
  const timer = setTimeout(() => controller.abort(), 30000);
  const check = () => { if (controller.signal.aborted) throw Error('Kontrola byla zrušena nebo vypršel časový limit.'); };
  try {
    check(); let frames;
    try { frames = await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] }, world: 'ISOLATED', func: collector }); }
    catch (error) { throw connectionError(error); }
    check(); const frame = frames.find(item => item.frameId === 0), snapshot = frame?.result;
    if (!snapshot || snapshot.url !== tab.url) throw Error('Cílová stránka se během kontroly změnila. Spusťte kontrolu znovu.');
    const result = probe ? await probe(snapshot, { signal: controller.signal }) : snapshot;
    check();
    const current = await chrome.tabs.get(tab.id);
    let identity;
    try { identity = await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] }, world: 'ISOLATED', func: () => null }); }
    catch (error) { throw connectionError(error); }
    check();
    if (current.url !== tab.url || current.status === 'loading' || (frame.documentId && frame.documentId !== identity.find(item => item.frameId === 0)?.documentId))
      throw Error('Cílová stránka se během kontroly změnila. Spusťte kontrolu znovu.');
    return result;
  } finally { clearTimeout(timer); if (jobs.get(key) === controller) jobs.delete(key); }
}
