import { allowedImageUrl } from './model.js';
import { imageType } from './download.js';

const FORMATS = { 'image/jpeg':'jpg', 'image/svg+xml':'svg', 'image/x-icon':'ico', 'image/tiff':'tif' };
export const METADATA_LIMITS = { bytes:64 * 1024, totalBytes:16 * 1024 * 1024, files:500, concurrency:4, deadlineMs:20000, timeoutMs:5000 };

/** Inspect original file headers; responsive DOM dimensions are density-corrected. */
export function imageMetadata(bytes) {
  let mime;
  try { mime = imageType(bytes); } catch { return {}; }
  const result = { format:FORMATS[mime] || mime.slice(6) };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (at, length) => String.fromCharCode(...bytes.subarray(at, at + length));
  const dimensions = (width, height) => {
    if (Number.isSafeInteger(width) && Number.isSafeInteger(height) && width > 0 && height > 0)
      Object.assign(result, {width,height});
    return result;
  };
  if (mime === 'image/png' && bytes.length >= 24 && text(12,4) === 'IHDR')
    return dimensions(view.getUint32(16),view.getUint32(20));
  if (mime === 'image/gif' && bytes.length >= 10)
    return dimensions(view.getUint16(6,true),view.getUint16(8,true));
  if (mime === 'image/bmp' && bytes.length >= 26) {
    if (view.getUint32(14,true) === 12) return dimensions(view.getUint16(18,true),view.getUint16(20,true));
    if (bytes.length >= 54) return dimensions(view.getInt32(18,true),Math.abs(view.getInt32(22,true)));
  }
  if (mime === 'image/x-icon' && bytes.length >= 8) return dimensions(bytes[6] || 256,bytes[7] || 256);
  if (mime === 'image/jpeg') {
    for (let at=2;at+4<=bytes.length;) {
      if (bytes[at++] !== 255) break;
      while (bytes[at] === 255) at++;
      const marker=bytes[at++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || marker >= 208 && marker <= 215) continue;
      if (at+2>bytes.length) break;
      const length=view.getUint16(at);
      if (length<2 || at+length>bytes.length) break;
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length>=8)
        return dimensions(view.getUint16(at+5),view.getUint16(at+3));
      at+=length;
    }
  }
  if (mime === 'image/webp') {
    for (let at=12;at+8<=bytes.length;) {
      const chunk=text(at,4), length=view.getUint32(at+4,true), data=at+8;
      if (chunk === 'VP8X' && length>=10 && data+10<=bytes.length) {
        const u24 = p => bytes[p] | bytes[p+1]<<8 | bytes[p+2]<<16;
        return dimensions(1+u24(data+4),1+u24(data+7));
      }
      if (chunk === 'VP8L' && length>=5 && data+5<=bytes.length && bytes[data]===47) {
        const bits=view.getUint32(data+1,true);
        return dimensions((bits&16383)+1,((bits>>>14)&16383)+1);
      }
      if (chunk === 'VP8 ' && length>=10 && data+10<=bytes.length && text(data+3,3)==='\x9d\x01\x2a')
        return dimensions(view.getUint16(data+6,true)&16383,view.getUint16(data+8,true)&16383);
      if (length>bytes.length-data) break;
      at=data+length+(length&1);
    }
  }
  if (['image/avif','image/heic','image/heif'].includes(mime)) {
    // Spatial extents live in meta/iprp/ipco. The bounded prefix may end before
    // them; never infer dimensions from a filename or a srcset descriptor.
    for (let at=4;at+16<=bytes.length;at++)
      if (text(at,4)==='ispe' && view.getUint32(at-4)===20)
        return dimensions(view.getUint32(at+8),view.getUint32(at+12));
  }
  if (mime === 'image/svg+xml') {
    const root=new TextDecoder().decode(bytes).match(/<svg\b[^>]*>/i)?.[0] || '';
    const size=name=>Number(root.match(new RegExp('\\b'+name+'\\s*=\\s*["\\\']([\\d.]+)(?:px)?["\\\']','i'))?.[1]);
    return dimensions(size('width'),size('height'));
  }
  return result;
}

/** One bounded prefix request; cancel the stream even when Range is ignored. */
export async function probeImageMetadata(url, {signal, fetcher=globalThis.fetch, maxBytes=METADATA_LIMITS.bytes, timeoutMs=METADATA_LIMITS.timeoutMs}={}) {
  if (!allowedImageUrl(url)) return {bytesRead:0};
  const controller=new AbortController(), stop=()=>controller.abort();
  signal?.addEventListener('abort',stop,{once:true});
  if (signal?.aborted) stop();
  const timer=setTimeout(stop,timeoutMs);
  let bytesRead=0,reader,response;
  let rejectAbort;
  const aborted=new Promise((_,reject)=>{rejectAbort=()=>reject(new DOMException('Zjišťování zrušeno.','AbortError'));controller.signal.addEventListener('abort',rejectAbort,{once:true});});
  try {
    if (controller.signal.aborted) throw new DOMException('Zjišťování zrušeno.','AbortError');
    response=await Promise.race([fetcher(url,{signal:controller.signal,credentials:'omit',redirect:'follow',referrerPolicy:'no-referrer',headers:{Range:`bytes=0-${maxBytes-1}`}}),aborted]);
    if (!response.ok) return {bytesRead};
    if (response.status===206 && !/^bytes\s+0-\d+\//i.test(response.headers.get('content-range') || '')) {
      await response.body?.cancel();return {bytesRead};
    }
    reader=response.body?.getReader();
    if (!reader) return {bytesRead};
    const prefix=new Uint8Array(maxBytes);
    let result={};
    while (bytesRead<maxBytes && !controller.signal.aborted) {
      const {done,value}=await Promise.race([reader.read(),aborted]);
      if (done) break;
      const part=value.subarray(0,maxBytes-bytesRead);
      prefix.set(part,bytesRead);bytesRead+=part.length;
      result=imageMetadata(prefix.subarray(0,bytesRead));
      if (result.width && result.height) break;
      // A decisive non-image prefix must not consume the rest of an HTML page.
      if (!result.format && bytesRead>=4096) break;
    }
    return {...result,bytesRead};
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Zjišťování zrušeno.','AbortError');
    return {bytesRead};
  } finally {
    clearTimeout(timer);signal?.removeEventListener('abort',stop);controller.signal.removeEventListener('abort',rejectAbort);
    if (reader) { await reader.cancel().catch(()=>{});reader.releaseLock?.(); }
    else await response?.body?.cancel().catch(()=>{});
  }
}

/** Incremental metadata, bounded across the whole gallery, independent of selection. */
export async function inspectImageMetadata(items,{signal,onUpdate=()=>{},probe=probeImageMetadata,limits={}}={}) {
  const config={...METADATA_LIMITS,...limits},controller=new AbortController(),stop=()=>controller.abort();
  signal?.addEventListener('abort',stop,{once:true});if(signal?.aborted)stop();
  const timer=setTimeout(stop,config.deadlineMs);
  const queue=items.filter(item=>!item.width || !item.height || item.format==='unknown').sort((a,b)=>Number(!!a.variant)-Number(!!b.variant)).slice(0,config.files);
  let next=0,remaining=config.totalBytes;
  try {
    await Promise.all(Array.from({length:Math.min(config.concurrency,queue.length)},async()=>{
      while(next<queue.length && !controller.signal.aborted && remaining>0) {
        const item=queue[next++],maxBytes=Math.min(config.bytes,remaining);remaining-=maxBytes;
        let result={};
        try { result=await probe(item.url,{signal:controller.signal,maxBytes,timeoutMs:config.timeoutMs}); }
        catch { /* Unreachable sources remain available for preview/download. */ }
        remaining+=maxBytes-Math.min(maxBytes,Number.isFinite(result.bytesRead)?result.bytesRead:maxBytes);
        if (!controller.signal.aborted) onUpdate(item.url,result);
      }
    }));
  } finally {clearTimeout(timer);signal?.removeEventListener('abort',stop);}
}
