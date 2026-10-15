import { collectImages } from '../tools/image-download/collect.js';
import { connectionError } from './page-errors.js';
export async function readImages(tab) {
  let frames;
  try {
    frames = await chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [0] },
      world: 'ISOLATED',
      func: collectImages
    });
  } catch (error) {
    throw connectionError(error);
  }
  const frame = frames.find(frame => frame.frameId === 0), result = frame?.result;
  if (!result || !Array.isArray(result.items))
    throw new Error('Obrázky z cílové karty nelze přečíst. Zkontrolujte přístup rozšíření.');
  const current = await chrome.tabs.get(tab.id);
  let identity;
  try {
    identity = await chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [0] }, world: 'ISOLATED', func: () => null
    });
  } catch (error) { throw connectionError(error); }
  if (result.url !== tab.url || current.url !== tab.url || current.status === 'loading' ||
      (frame.documentId && frame.documentId !== identity.find(item => item.frameId === 0)?.documentId))
    throw new Error('Cílová stránka se během skenu změnila. Spusťte sken znovu.');
  return result;
}
