import {requestTool} from './transport';
export interface RemoteTarget {tabId:number|null;url:string}
interface RemoteResponse {base64:string;status:number;statusText?:string;headers:[string,string][];url:string;redirected:boolean;type?:ResponseType}
interface RemoteInit extends RequestInit {purpose?:'image'|'search';kind?:'html'|'xml'|'text';maxBytes?:number;timeoutMs?:number}
export function createRemoteFetch(target:()=>RemoteTarget) {
  return async (input:RequestInfo|URL,init:RemoteInit={}):Promise<Response>=>{
    const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
    if(url.startsWith('data:'))return fetch(url,init);
    const headers=new Headers(init.headers),purpose=init.purpose??'image';
    const range=headers.get('range');
    const result=await requestTool('REMOTE_FETCH',{
      url,purpose,kind:init.kind??'html',credentials:init.credentials??'omit',redirect:init.redirect??'follow',
      maxBytes:init.maxBytes??(range?65536:purpose==='image'?25*1024*1024:2*1024*1024),
      timeoutMs:init.timeoutMs??30000,prefix:!!range,headers:range?{Range:range}:undefined,
    },target(),{signal:init.signal??undefined,timeoutMs:(init.timeoutMs??30000)+5000}) as RemoteResponse;
    const bytes=Uint8Array.from(atob(result.base64),char=>char.charCodeAt(0));
    const response=new Response([204,205,304].includes(result.status)?null:bytes,{status:result.status,statusText:result.statusText,headers:result.headers});
    Object.defineProperties(response,{url:{value:result.url},redirected:{value:result.redirected},...(result.type?{type:{value:result.type}}:{})});
    return response;
  };
}
