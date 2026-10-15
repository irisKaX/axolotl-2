import { supportedUrl } from '../shared/utils.js';
const prefix = 'session:';
export async function createSession(tab) {
  const id = crypto.randomUUID();
  const state = { id, targetId: tab?.id ?? null, dashboardId: null, createdAt: Date.now() };
  await chrome.storage.session.set({ [prefix + id]: state });
  const dashboard = await chrome.tabs.create({
    url: chrome.runtime.getURL(`dashboard/index.html?session=${id}`),
    ...(tab?.windowId ? { windowId: tab.windowId } : {}),
    ...(tab?.id ? { openerTabId: tab.id } : {})
  });
  state.dashboardId = dashboard.id;
  await chrome.storage.session.set({ [prefix + id]: state });
  return id;
}
export async function getSession(id) {
  if (typeof id !== 'string' || !/^[\w-]{1,64}$/.test(id))
    throw new Error('Chybí platná relace. Otevřete O2 Axolotl ikonou u webové stránky.');
  const result = await chrome.storage.session.get(prefix + id);
  if (!result[prefix + id])
    throw new Error('Relace už není dostupná. Otevřete O2 Axolotl znovu ikonou rozšíření.');
  return result[prefix + id];
}
export async function updateSession(id, changes) {
  const state = { ...(await getSession(id)), ...changes };
  await chrome.storage.session.set({ [prefix + id]: state });
  return state;
}
export async function sessionTarget(session, requireSupported = true) {
  let tab;
  try {
    tab = await chrome.tabs.get(session.targetId);
  } catch {
    throw new Error('Původní karta byla zavřena. Vyberte jinou přes „Změnit kartu“.');
  }
  if (session.windowId !== undefined && (tab.windowId !== session.windowId || tab.incognito || (session.targetUrl && tab.url !== session.targetUrl)))
    throw Object.assign(new Error('Cílová karta se změnila. Vyberte ji znovu.'), {code:'STALE_TARGET'});
  if (requireSupported && !supportedUrl(tab.url))
    throw new Error(
      'Na této stránce prohlížeč nástroje nepovoluje. Vyberte běžnou webovou stránku (HTTP nebo HTTPS).'
    );
  return tab;
}
export async function activateTab(id) {
  const tab = await chrome.tabs.get(id);
  await chrome.windows.update(tab.windowId, { focused: true });
  await chrome.tabs.update(id, { active: true });
  return tab;
}
export async function status(session) {
  try {
    const tab = await sessionTarget(session, false);
    return {
      connected: supportedUrl(tab.url),
      loading: tab.status === 'loading',
      exists: true,
      id: tab.id,
      url: tab.url,
      title: tab.title || tab.url,
      favIconUrl: tab.favIconUrl || '',
      reason: supportedUrl(tab.url) ? '' : 'Tato karta není podporovaná. Vyberte běžnou webovou stránku.'
    };
  } catch (error) {
    return { connected: false, exists: false, reason: error.message };
  }
}
export async function removeSession(id) {
  await chrome.storage.session.remove(prefix + id);
}
export async function allSessions() {
  const all = await chrome.storage.session.get(null);
  return Object.entries(all)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value);
}
