import { highlightImageSource } from '../tools/image-audit/highlight.js';
import { connectionError } from './page-errors.js';

export async function highlightImageAudit(tab, payload) {
  if (!payload || typeof payload.scanToken !== 'string' || typeof payload.sourceId !== 'string' ||
      typeof payload.selector !== 'string' || typeof payload.url !== 'string' || payload.pageUrl !== tab.url || tab.status === 'loading')
    throw new Error('Stránka nebo obrázek se od kontroly změnily. Spusťte kontrolu znovu.');
  let frames;
  try {
    frames = await chrome.scripting.executeScript({target:{tabId:tab.id, frameIds:[0]}, world:'ISOLATED', func:highlightImageSource, args:[payload]});
  } catch (error) { throw connectionError(error); }
  const result = frames.find(frame => frame.frameId === 0)?.result;
  if (!result?.ok) throw new Error(result?.error || 'Zdroj obrázku už není dostupný. Spusťte kontrolu znovu.');
  return result;
}
