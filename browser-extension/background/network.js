import { normalizeHttpUrl, safeFilename } from '../shared/utils.js';
import { authenticationIssue } from '../shared/http-access.js';
function pdfBytes(response) {
  if (response.status === 206) {
    // Content-Length describes the range, not the complete PDF.
    const range = /^bytes\s+(\d+)-(\d+)\/(\d+)$/i.exec(response.headers.get('content-range') || '');
    if (!range) return null;
    const [start, end, total] = range.slice(1).map(Number);
    return [start, end, total].every(Number.isSafeInteger) && start <= end && end < total
      ? total : null;
  }
  const length = response.headers.get('content-length');
  const bytes = /^\d+$/.test(length || '') ? Number(length) : NaN;
  return Number.isSafeInteger(bytes) && bytes > 0 ? bytes : null;
}
function pdfFilename(response, fallbackUrl) {
  const header = response.headers.get('content-disposition') || '';
  // Quoted values may include semicolons; RFC 5987 filename* takes priority.
  const params = new Map();
  for (const match of header.matchAll(/;\s*(filename\*?)\s*=\s*(?:"((?:\\.|[^"\\])*)"|([^;]*))/gi))
    params.set(match[1].toLowerCase(), (match[2]?.replace(/\\(.)/g, '$1') ?? match[3]).trim());
  const extended = params.get('filename*')?.match(/^([^']*)'[^']*'(.*)$/);
  let value = '';
  if (extended)
    try {
      if (/^utf-?8$/i.test(extended[1])) value = decodeURIComponent(extended[2]);
      else if (/^(?:iso-8859-1|latin1)$/i.test(extended[1]))
        value = extended[2].replace(/%([\da-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    } catch {
      /* Invalid extended values fall back to the plain filename. */
    }
  value = value || params.get('filename') || '';
  if (value) return safeFilename(value, '');
  for (const url of [response.url, fallbackUrl])
    try {
      const name = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
      if (/\.pdf$/i.test(name)) return safeFilename(name, '');
    } catch {
      /* An opaque endpoint is not a real filename. */
    }
  return '';
}
export async function verifyPdf(value) {
  const url = normalizeHttpUrl(value);
  if (!url || url.length > 8192) throw new Error('Neplatná adresa dokumentu.');
  // Do not probe obvious action endpoints even when misleading page copy says “PDF”.
  if (/(?:[/?&=])(logout|signout|delete|remove|unsubscribe)(?:[/?&=]|$)/i.test(url))
    return { status: 'possible', reason: 'Akční URL se z bezpečnostních důvodů neověřuje.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  async function probe(method, headers) {
    const options = { method, ...(headers ? { headers } : {}), cache: 'no-store', signal: controller.signal };
    // Public redirects remain usable without forwarding the browser's session.
    // A successful HTML/login shell may still hide a protected document.
    // Retry an unconfirmed URL directly; a credentialed redirect must not reach an
    // action endpoint before the caller has any chance to inspect its target.
    const response = await fetch(url, { ...options, credentials: 'omit', redirect: 'follow' });
    const publicType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const unconfirmed = response.ok && publicType !== 'application/pdf';
    if (!unconfirmed && ![401, 403].includes(response.status) && !authenticationIssue(url, response))
      return response;
    await response.body?.cancel();
    try {
      return await fetch(url, { ...options, credentials: 'include', redirect: 'error' });
    } catch (error) {
      if (error.name === 'TypeError')
        throw Object.assign(
          new Error(
            'Ověření s relací prohlížeče se nezdařilo. Přesměrování s přihlášením se z bezpečnostních důvodů neprovádí; použijte přímou URL dokumentu.'
          ),
          { code: 'PDF_AUTH_REQUEST' }
        );
      throw error;
    }
  }
  try {
    let response = await probe('HEAD');
    if ([405, 501].includes(response.status)) {
      response = await probe('GET', { Range: 'bytes=0-1023' });
      await response.body?.cancel();
    }
    if (!response.ok)
      return {
        status: 'possible',
        reason: `Server odpověděl HTTP ${response.status}.`,
        httpStatus: response.status
      };
    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const bytes = pdfBytes(response);
    const filename = pdfFilename(response, url);
    if (contentType === 'application/pdf')
      return {
        status: 'pdf',
        contentType,
        bytes,
        finalUrl: response.url,
        filename,
        reason: 'Server potvrdil typ application/pdf.'
      };
    if (contentType && !['application/octet-stream', 'binary/octet-stream'].includes(contentType))
      return { status: 'other', contentType, reason: `Server vrací ${contentType}, nikoli PDF.` };
    return {
      status: 'possible',
      contentType,
      ...(filename ? { filename } : {}),
      reason: 'Server neuvádí jednoznačný typ PDF.'
    };
  } catch (error) {
    return {
      status: 'possible',
      reason:
        error.code === 'PDF_AUTH_REQUEST'
          ? error.message
          : error.name === 'AbortError'
            ? 'Server neodpověděl do 6,5 s.'
            : 'Typ nebylo možné ověřit. Může být potřeba přihlášení nebo přístup k serveru.'
    };
  } finally {
    clearTimeout(timer);
  }
}
export async function downloadFile({ url, name }) {
  const normalized = normalizeHttpUrl(url);
  if (!normalized) throw new Error('Stahování této adresy není podporované.');
  let filename = safeFilename(name);
  if (!/\.pdf$/i.test(filename)) filename = safeFilename(filename + '.pdf');
  const id = await chrome.downloads.download({
    url: normalized,
    filename: 'O2-Axolotl/PDF/' + filename,
    conflictAction: 'uniquify',
    saveAs: false
  });
  return { id };
}
export async function downloadScreenshot({ url, name }) {
  if (typeof url !== 'string' || !url.startsWith('blob:' + chrome.runtime.getURL('')))
    throw new Error('Snímek nepochází z O2 Axolotl.');
  const id = await chrome.downloads.download({
    url,
    filename: 'O2-Axolotl/' + safeFilename(name, 'screenshot.png'),
    conflictAction: 'uniquify',
    saveAs: true
  });
  return { id };
}
