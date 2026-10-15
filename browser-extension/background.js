const AXOLOTL_ORIGIN = 'https://iriskax.github.io';

function isAxolotl(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin === AXOLOTL_ORIGIN && (parsed.pathname === '/axolotl-2' || parsed.pathname.startsWith('/axolotl-2/'));
  } catch { return false; }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || sender.frameId !== 0 || !sender.tab || !isAxolotl(sender.url) || message?.type !== 'AXOLOTL_GET_TABS') return false;
  chrome.tabs.query({ windowId: sender.tab.windowId }).then(allTabs => {
    const eligible = allTabs.filter(tab => !tab.incognito && /^https?:\/\//.test(tab.url || '') && !isAxolotl(tab.url));
    const active = eligible.find(tab => tab.active) || [...eligible].sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
    const tabs = eligible.sort((a, b) => a.index - b.index).map(tab => ({ id: tab.id, title: tab.title || '', url: tab.url }));
    sendResponse({ ok: true, tabs, activeId: active?.id ?? null });
  }).catch(() => sendResponse({ ok: false, tabs: [], activeId: null }));
  return true;
});
