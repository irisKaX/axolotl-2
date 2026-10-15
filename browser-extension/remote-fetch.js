import { authenticationIssue } from './shared/http-access.js';
import { normalizeHttpUrl } from './shared/utils.js';
const retries = new Map();
const MAX_TEXT = 4 * 1024 * 1024, MAX_IMAGE = 25 * 1024 * 1024;
const allowedHeaders = ['content-type','content-length','content-range','content-disposition','content-encoding','etag','last-modified','accept-ranges'];
const failure = (code, message) => Object.assign(new Error(message), {code});
export function clearFetchSession(sessionId) { for (const key of retries.keys()) if (key.startsWith(sessionId+'|')) retries.delete(key); }
export async function remoteFetch(session, payload, signal) {
  const url = normalizeHttpUrl(payload.url);
  const purpose = payload.purpose;
  if (!url || url.length > 8192 || !['search','image'].includes(purpose)) throw failure('INVALID_REQUEST','Nepovolená adresa nebo účel načtení.');
  if (purpose === 'search' && new URL(url).origin !== new URL(session.targetUrl).origin) throw failure('URL_OUTSIDE_SCOPE','Adresa nepatří do prohledávaného webu.');
  const prefix = purpose === 'image' && payload.prefix === true;
  const maximum = prefix ? 65536 : purpose === 'image' ? MAX_IMAGE : ['xml','text'].includes(payload.kind) ? 10 * 1024 * 1024 : MAX_TEXT;
  const maxBytes = Number.isFinite(payload.maxBytes) ? Math.max(1,Math.min(maximum,Math.floor(payload.maxBytes))) : maximum;
  const credentials = payload.credentials === 'include' ? 'include' : 'omit';
  const retryKey = session.id+'|'+url;
  if (credentials === 'include') {
    const expires = retries.get(retryKey); retries.delete(retryKey);
    if (purpose !== 'search' || !expires || expires < Date.now() || payload.redirect !== 'error') throw failure('AUTH_NOT_ALLOWED','Přihlášená relace je povolena pouze pro ověřené opakování hledání.');
  }
  const headers = {Accept:purpose==='image'?'image/*,*/*;q=0.8':payload.kind==='html'?'text/html,application/xhtml+xml':'text/html,application/xml,text/xml,text/plain'};
  if (prefix) headers.Range = 'bytes=0-'+(maxBytes-1);
  if (payload.headers?.Range || payload.headers?.range || payload.range) {
    const range=payload.headers?.Range||payload.headers?.range||payload.range;
    if (!prefix || !/^bytes=0-\d+$/.test(range) || Number(range.slice(8)) >= 65536) throw failure('INVALID_RANGE','Rozsah obrázku překračuje povolený limit.');
    headers.Range=range;
  }
  const aborter = new AbortController();
  const abort = () => aborter.abort();
  signal.addEventListener('abort',abort,{once:true});
  let timedOut = false, reader, response;
  const timer = setTimeout(()=>{timedOut=true;abort();},Math.max(1,Math.min(30000,Number(payload.timeoutMs)||20000)));
  try {
    if(signal.aborted) throw new DOMException('Operace zrušena.','AbortError');
    response=await fetch(url,{method:'GET',headers,credentials,redirect:credentials==='include'?'error':'follow',referrerPolicy:'no-referrer',cache:'no-store',signal:aborter.signal});
    if (purpose==='search' && credentials==='omit' && authenticationIssue(url,response,payload.kind)) {
      retries.set(retryKey,Date.now()+30000);
      // Only metadata is needed to recognize the authentication response.
      await response.body?.cancel();
      return serialize(response,new Uint8Array(),url);
    }
    if (!prefix && Number(response.headers.get('content-length'))>maxBytes) throw failure('CONTENT_TOO_LARGE','Obsah překročil povolený limit velikosti.');
    const chunks=[];let size=0;
    reader=response.body?.getReader();
    if (reader) while(true) {
      if(aborter.signal.aborted) throw new DOMException('Operace zrušena.','AbortError');
      const {done,value}=await reader.read();if(done)break;
      if(size+value.byteLength>maxBytes && !prefix) throw failure('CONTENT_TOO_LARGE','Obsah překročil povolený limit velikosti.');
      const chunk=value.subarray(0,maxBytes-size);chunks.push(chunk);size+=chunk.byteLength;
      if(prefix && size>=maxBytes)break;
    }
    if(aborter.signal.aborted) throw new DOMException('Operace zrušena.','AbortError');
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    return serialize(response,bytes,url);
  } catch(error) {
    if(signal.aborted)throw new DOMException('Operace zrušena.','AbortError');
    if(timedOut)throw failure('TIMEOUT','Načtení překročilo časový limit.');
    throw error;
  } finally {
    clearTimeout(timer);signal.removeEventListener('abort',abort);
    if(reader){await reader.cancel().catch(()=>{});reader.releaseLock();}else await response?.body?.cancel().catch(()=>{});
    aborter.abort();
  }
}
function serialize(response,bytes,fallbackUrl) {
  let binary='';for(let offset=0;offset<bytes.length;offset+=32768)binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));
  return {base64:btoa(binary),status:response.status,statusText:response.statusText,headers:allowedHeaders.flatMap(name=>response.headers.has(name)?[[name,response.headers.get(name)]]:[]),url:response.url||fallbackUrl,redirected:!!response.redirected,type:response.type};
}
