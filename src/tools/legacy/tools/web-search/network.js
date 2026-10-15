import {redirectFailure,diagnosticUrl} from './diagnostics.js';
import {authenticationIssue} from '../../shared/http-access.js';
import {PAGE_MAX_BYTES,SITEMAP_MAX_BYTES,REQUEST_TIMEOUT_MS} from './limits.js';
export async function fetchSearchText(url,{signal,kind='html',maxBytes=kind==='html'?PAGE_MAX_BYTES:SITEMAP_MAX_BYTES,timeoutMs=REQUEST_TIMEOUT_MS,onBytes=()=>{},fetchImpl=fetch,allowUrl=value=>{try{const u=new URL(value);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password&&u.origin===new URL(url).origin;}catch{return false;}}}={}){
  const aborter=new AbortController();let reader,timedOut=false,sessionRetried=false;
  const stop=()=>aborter.abort();if(signal?.aborted)stop();else signal?.addEventListener('abort',stop,{once:true});
  const timer=setTimeout(()=>{timedOut=true;stop();},timeoutMs);
  const failure=(code,message,extra={})=>Object.assign(Error(message),{code,...extra});
  let rejectAbort;const interrupted=new Promise((_,reject)=>{rejectAbort=()=>reject(timedOut?failure('TIMEOUT','Vypršel časový limit načítání.'):new DOMException('Hledání zastaveno.','AbortError'));});
  aborter.signal.addEventListener('abort',rejectAbort,{once:true});
  try{
    if(aborter.signal.aborted)throw new DOMException('Hledání zastaveno.','AbortError');
    if(!allowUrl(url))throw failure('URL_OUTSIDE_SCOPE','Adresa nepatří do prohledávaného webu.');
    // Public requests stay anonymous. On a recognized login/401 response,
    // retry only the original allowed URL with its existing browser session.
    // Never follow a credentialed redirect or read a cookie value in JavaScript.
    const requestOptions={method:'GET',referrerPolicy:'no-referrer',cache:'no-store',signal:aborter.signal,headers:{Accept:kind==='html'?'text/html,application/xhtml+xml':'application/xml,text/xml,text/plain'}};
    const request=options=>Promise.race([fetchImpl(url,{...requestOptions,...options}),interrupted]);
    let sessionUsed=false,response=await request({credentials:'omit',redirect:'follow'});
    if(authenticationIssue(url,response,kind)){
      const publicFinalUrl=response.url||url,publicStatus=response.status;
      void response.body?.cancel();
      const sessionFailure=(destination=publicFinalUrl,status=publicStatus)=>failure('AUTH_SESSION_REQUIRED','Web vrátil přihlášení a stránku se nepodařilo načíst ani s existující relací prohlížeče. Otevřete původní adresu v běžné kartě, obnovte ji a zkuste hledání znovu.',{finalUrl:diagnosticUrl(destination),status,sessionRetried:true});
      sessionRetried=true;
      try{response=await request({credentials:'include',redirect:'error'});sessionUsed=true;}
      catch(error){if(error instanceof TypeError&&!aborter.signal.aborted)throw sessionFailure();throw error;}
      if(authenticationIssue(url,response,kind)){void response.body?.cancel();throw sessionFailure(response.url||url,response.status);}
    }
    const finalUrl=response.url||url;
    if(!allowUrl(finalUrl)){void response.body?.cancel();throw redirectFailure(finalUrl,url,response.status);}
    if(response.type==='opaqueredirect'||response.status>=300&&response.status<400){void response.body?.cancel();throw failure('REDIRECT_FAILED','Server nedokončil přesměrování na cílovou stránku.');}
    if(!response.ok){void response.body?.cancel();throw failure('HTTP_ERROR',`HTTP ${response.status}`,{status:response.status});}
    const type=(response.headers.get('content-type')||'').split(';')[0].trim();
    if(kind==='html'&&!/^(text\/html|application\/xhtml\+xml)$/i.test(type)){void response.body?.cancel();throw Error('Adresa nevrátila HTML stránku.');}
    if(kind!=='html'&&type&&!/^(?:text\/|application\/(?:xml|octet-stream))/i.test(type)&&!(kind==='xml'&&/^application\/(?:x-)?gzip$/i.test(type))){void response.body?.cancel();throw Error('Adresa nevrátila textovou mapu webu.');}
    const sizeError=()=>failure('CONTENT_TOO_LARGE',`Překročena maximální velikost ${kind==='html'?'stránky':'mapy webu'} (${(maxBytes/(1024*1024)).toLocaleString('cs-CZ')} MiB).`);
    if(Number(response.headers.get('content-length'))>maxBytes){void response.body?.cancel();throw sizeError();}
    const charset=/charset\s*=\s*["']?([^;"'\s]+)/i.exec(response.headers.get('content-type')||'')?.[1]||'utf-8';let decoder;
    try{decoder=new TextDecoder(charset);}catch{decoder=new TextDecoder();}
    let bytes=0,text='';const mapChunks=kind==='xml'?[]:null,prefix=[];reader=response.body?.getReader();
    if(!reader)throw Error('Server neposkytl obsah.');
    while(true){
      const chunk=await Promise.race([reader.read(),interrupted]);if(chunk.done)break;
      bytes+=chunk.value.byteLength;onBytes(chunk.value.byteLength);if(bytes>maxBytes)throw sizeError();
      if(mapChunks){mapChunks.push(chunk.value);for(const byte of chunk.value.subarray(0,2-prefix.length))prefix.push(byte);}
      else text+=decoder.decode(chunk.value,{stream:true});
    }
    if(mapChunks){
      // Fetch already decodes HTTP Content-Encoding. Detect the remaining gzip
      // signature rather than the URL/header to support raw .xml.gz files too.
      if(prefix[0]===31&&prefix[1]===139){
        let expandedBytes=0;
        try{
          reader=new Blob(mapChunks).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
          while(true){
            const chunk=await Promise.race([reader.read(),interrupted]);if(chunk.done)break;
            expandedBytes+=chunk.value.byteLength;if(expandedBytes>maxBytes)throw sizeError();
            text+=decoder.decode(chunk.value,{stream:true});
          }
        }catch(error){if(['CONTENT_TOO_LARGE','TIMEOUT'].includes(error.code)||error.name==='AbortError')throw error;throw failure('SITEMAP_ENCODING_ERROR','Komprimovanou mapu webu se nepodařilo rozbalit.');}
      }else for(const chunk of mapChunks)text+=decoder.decode(chunk,{stream:true});
    }
    return {text:text+decoder.decode(),bytes,url:finalUrl,redirected:!!response.redirected||finalUrl!==url,sessionUsed};
  }catch(error){
    if(sessionRetried&&error&&typeof error==='object')error.sessionRetried=true;
    if(error instanceof TypeError&&!aborter.signal.aborted)throw failure('NETWORK_ERROR','Síťové načtení selhalo. Prohlížeč neposkytl odpověď serveru; příčinou může být přístup rozšíření, připojení nebo blokování požadavku.',{detail:error.message,...(sessionRetried?{sessionRetried:true}:{})});
    throw error;
  }finally{
    clearTimeout(timer);signal?.removeEventListener('abort',stop);aborter.signal.removeEventListener('abort',rejectAbort);void reader?.cancel().catch(()=>{});aborter.abort();
  }
}
