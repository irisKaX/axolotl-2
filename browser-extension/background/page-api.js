import { connectionError } from './page-errors.js';
const FILES = [
  'shared/design-system/scrollbar-skin.js',
  'content/core.js',
  'tools/pdf-scout/page.js',
  'tools/screenshot/selection.js',
  'tools/screenshot/page.js',
  'content/page-bridge.js'
];
const injections = new Map();
export async function ensurePage(tabId, { immediate = false } = {}) {
  if (injections.has(tabId)) return injections.get(tabId);
  const task = (async () => {
    try {
      const ping = await chrome.tabs.sendMessage(tabId, { channel: 'o2-page', type: 'PING' }, { frameId: 0 });
      if (ping?.ok && ping.data?.version === '1.3.4') return;
    } catch {
      /* First use or source navigation: inject the isolated bridge. */
    }
    try {
      await chrome.scripting.executeScript({
        target: { tabId, frameIds: [0] },
        files: FILES,
        injectImmediately: immediate
      });
      await chrome.scripting.insertCSS({
        target: { tabId, frameIds: [0] },
        files: ['content/overlay.css'],
        origin: 'USER'
      });
    } catch (error) {
      throw connectionError(error);
    }
  })();
  injections.set(tabId, task);
  try {
    await task;
  } finally {
    injections.delete(tabId);
  }
}
export async function pageCall(tabId, session, type, payload = {}) {
  if (type === 'PICK_START') await ensureScreenshotSelection(tabId);
  else await ensurePage(tabId);
  let result;
  try {
    result = await chrome.tabs.sendMessage(
      tabId,
      { channel: 'o2-page', session, type, payload },
      { frameId: 0 }
    );
  } catch (error) {
    throw connectionError(error);
  }
  if (!result?.ok) throw new Error(result?.error || 'Stránka neodpověděla.');
  return result.data;
}
/** Refresh only the picker on pages that still have a compatible older bridge. */
export async function ensureScreenshotSelection(tabId) {
  await ensurePage(tabId);
  try {
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [0] },
      files: ['shared/design-system/scrollbar-skin.js', 'tools/screenshot/selection.js']
    });
  } catch (error) {
    throw connectionError(error);
  }
}
/** PDF scan additionally collects accessible subframes; an inaccessible frame never discards main-page results. */
export async function scanFrames(tabId, session, payload) {
  await ensurePage(tabId);
  // Older page bridges remain valid. Refresh only the versioned PDF collector
  // before asking that bridge to scan; other tools need no reinjection.
  try {
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [0] },
      files: ['tools/pdf-scout/page.js']
    });
  } catch (error) {
    throw connectionError(error);
  }
  const main = await pageCall(tabId, session, 'PDF_SCAN', payload);
  let sub = [];
  let framesSkipped = false;
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['content/core.js', 'tools/pdf-scout/page.js']
    });
    const results = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: deep => {
        if (window === window.top || !globalThis.__O2Tools?.pdfScan) return null;
        return globalThis.__O2Tools.pdfScan({ deep });
      },
      args: [!!payload.deep]
    });
    sub = results.filter(r => r.frameId !== 0 && r.result).map(r => r.result);
  } catch {
    framesSkipped = true;
  }
  const all = new Map();
  for (const result of [main, ...sub])
    for (const item of result.items) {
      const prev = all.get(item.url);
      if (prev) {
        prev.sources = [...new Set([...prev.sources, ...item.sources])];
        if (!prev.title && item.title) prev.title = item.title;
        if (!prev.filename && item.filename) prev.filename = item.filename;
      } else all.set(item.url, item);
    }
  return {
    items: [...all.values()].slice(0, 2000),
    truncated: all.size > 2000 || [main, ...sub].some(r => r.truncated),
    frames: 1 + sub.length,
    framesSkipped
  };
}
