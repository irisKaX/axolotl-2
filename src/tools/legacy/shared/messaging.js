export const sessionId = new URLSearchParams(location.search).get('session');
export async function request(type, payload = {}) {
  if (!globalThis.chrome?.runtime?.id)
    throw new Error('O2 Axolotl se musí načíst jako rozšíření prohlížeče, ne otevřením HTML souboru.');
  let result;
  let timer;
  try {
    const response = chrome.runtime.sendMessage({ channel: 'o2-dashboard', session: sessionId, type, payload });
    // Connection reads must not leave the header or tab picker pending forever.
    // File scans, capture and downloads have their own operation lifecycles.
    result = await (['TARGET_STATUS', 'TARGET_LIST'].includes(type)
      ? Promise.race([
          response,
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('Připojení překročilo časový limit.')), 4000);
          })
        ])
      : response);
  } catch (error) {
    throw new Error(
      `Rozšíření neodpovídá. Obnovte tuto kartu; po aktualizaci rozšíření ho otevřete znovu ikonou. (${error.message})`
    );
  } finally {
    clearTimeout(timer);
  }
  if (!result?.ok)
    throw Object.assign(new Error(result?.error || 'Rozšíření nevrátilo odpověď.'), {
      code: result?.code,
      detail: result?.detail,
      pause: !!result?.pause
    });
  return result.data;
}
export function subscribe(listener) {
  const handler = (message, sender) => {
    if (sender.id === chrome.runtime.id && message?.channel === 'o2-event' && message.session === sessionId)
      listener(message);
  };
  chrome.runtime.onMessage.addListener(handler);
  return () => chrome.runtime.onMessage.removeListener(handler);
}
