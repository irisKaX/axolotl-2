import { sessionTarget, activateTab } from './sessions.js';
import { pageCall } from './page-api.js';
import { sleep } from '../shared/utils.js';
let beginQueue = Promise.resolve(),
  frameQueue = Promise.resolve(),
  leaseQueue = Promise.resolve(),
  lastFrameAt = 0;
const key = token => 'capture:' + token;
function mutateLease(work) {
  const result = leaseQueue.then(work);
  leaseQueue = result.catch(() => {});
  return result;
}
async function record(token, session) {
  const found = (await chrome.storage.session.get(key(token)))[key(token)];
  if (!found || found.session !== session.id)
    throw new Error('Relace snímání už není dostupná. Spusťte snímání znovu.');
  return found;
}
function refreshRecord(state) {
  return mutateLease(async () => {
    await record(state.token, { id: state.session });
    await chrome.storage.session.set({
      [key(state.token)]: state,
      ['capture-window:' + state.windowId]: state
    });
  });
}
export function captureBegin(session, payload, signal) {
  const check = () => { if (signal?.aborted) throw new DOMException('Snímání zrušeno.', 'AbortError'); };
  const result = beginQueue.then(async () => {
    check();
    const tab = await sessionTarget(session);
    const windowKey = 'capture-window:' + tab.windowId;
    const old = (await chrome.storage.session.get(windowKey))[windowKey];
    if (old && Date.now() - old.updatedAt < 90000)
      throw new Error('V tomto okně už běží snímání. Počkejte na dokončení.');
    if (old) await captureEnd({ id: old.session }, { token: old.token }, false).catch(() => {});
    const token = crypto.randomUUID();
    const state = {
      token,
      session: session.id,
      targetId: tab.id,
      windowId: tab.windowId,
      dashboardId: session.dashboardId,
      updatedAt: Date.now()
    };
    await mutateLease(() => chrome.storage.session.set({ [key(token)]: state, [windowKey]: state }));
    try {
      check();
      await activateTab(tab.id);
      await sleep(140);
      check();
      await record(token, session);
      const setup = await pageCall(tab.id, session.id, 'CAPTURE_BEGIN', { ...payload, token });
      check();
      state.documentId = setup.metrics.documentId;
      await refreshRecord(state);
      return setup;
    } catch (error) {
      const ended = await captureEnd(session, { token }, true).catch(() => null);
      // The page can finish setup after cancellation already removed its lease.
      if (!ended?.restored)
        await pageCall(tab.id, session.id, 'CAPTURE_END', { token }).catch(() => {});
      throw error;
    }
  });
  beginQueue = result.catch(() => {});
  return result;
}
async function activeCheck(state) {
  const [active] = await chrome.tabs.query({ active: true, windowId: state.windowId });
  if (active?.id !== state.targetId)
    throw new Error(
      'Snímání bylo přerušeno přepnutím karty. Snímek jiné karty se neuložil. Spusťte snímání znovu a během něj nepřepínejte karty.'
    );
}
export async function captureScroll(session, payload) {
  const state = await record(payload.token, session);
  await activeCheck(state);
  const metrics = await pageCall(state.targetId, session.id, 'CAPTURE_SCROLL', payload);
  if (metrics.documentId !== state.documentId)
    throw new Error('Stránka se během snímání obnovila. Zkuste to znovu.');
  state.updatedAt = Date.now();
  await refreshRecord(state);
  return metrics;
}
export function captureFrame(session, payload) {
  const result = frameQueue.then(async () => {
    const state = await record(payload.token, session);
    await sleep(Math.max(0, 650 - (Date.now() - lastFrameAt)));
    await activeCheck(state);
    const metrics = await pageCall(state.targetId, session.id, 'CAPTURE_METRICS');
    if (metrics.documentId !== state.documentId) throw new Error('Stránka se během snímání obnovila.');
    // Ending a capture can run while the throttle or page request is pending.
    await record(payload.token, session);
    lastFrameAt = Date.now();
    const dataUrl = await chrome.tabs.captureVisibleTab(state.windowId, { format: 'png' });
    await activeCheck(state);
    const after = await pageCall(state.targetId, session.id, 'CAPTURE_METRICS');
    const fields = [
      'documentId',
      'x',
      'y',
      'innerWidth',
      'innerHeight',
      'viewportWidth',
      'viewportHeight',
      'width',
      'height',
      'dpr'
    ];
    if (fields.some(field => after[field] !== metrics[field]))
      throw new Error('Stránka během snímání změnila polohu, rozměry nebo dokument. Spusťte snímání znovu.');
    // Unchanged geometry does not prove that the capture still owns its lease.
    await record(payload.token, session);
    return { dataUrl, metrics };
  });
  frameQueue = result.catch(() => {});
  return result;
}
export async function captureEnd(session, { token }, focus = true) {
  let state;
  try {
    state = await mutateLease(async () => {
      const current = await record(token, session);
      // Invalidate pending work before waiting for the page to restore itself.
      await chrome.storage.session.remove(key(token));
      return current;
    });
  } catch {
    return { restored: false };
  }
  let restored = false;
  try {
    const result = await pageCall(state.targetId, session.id, 'CAPTURE_END', { token });
    restored = !!result.restored;
  } catch {
    /* Source may have been closed or navigated. */
  }
  await mutateLease(async () => {
    const windowKey = 'capture-window:' + state.windowId,
      current = (await chrome.storage.session.get(windowKey))[windowKey];
    if (current?.token !== token) return;
    // Keep the window reserved through restoration/focus; an older cleanup
    // must neither release a newer lease nor activate its previous dashboard.
    if (focus && state.dashboardId) await activateTab(state.dashboardId).catch(() => {});
    await chrome.storage.session.remove(windowKey);
  });
  return { restored };
}
export async function sessionCaptures(session) {
  const all = await chrome.storage.session.get(null);
  return Object.entries(all)
    .filter(([k, v]) => k.startsWith('capture:') && v.session === session.id)
    .map(([, v]) => v);
}
