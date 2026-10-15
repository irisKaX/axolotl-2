export interface ToolTarget { tabId: number | null; url: string }
export interface ToolEvent { type: string; data?: Record<string, unknown> }
export interface ToolRequestOptions { signal?: AbortSignal; timeoutMs?: number }
export interface ToolError extends Error { code?: string; detail?: unknown; pause?: boolean }
type Pending = { resolve: (data: unknown) => void; reject: (error: Error) => void; acknowledge: () => void };
const pending = new Map<string, Pending>();
const subscribers = new Set<(event: ToolEvent) => void>();
let listening = false;
function receive(event: MessageEvent) {
  if (event.source !== window || event.origin !== location.origin) return;
  const message = event.data;
  if (message?.source !== 'axolotl-extension') return;
  if (message.type === 'AXOLOTL_TOOL_EVENT') {
    if (message.event && typeof message.event.type === 'string')
      subscribers.forEach(listener => listener(message.event));
    return;
  }
  if (typeof message.requestId !== 'string') return;
  const request = pending.get(message.requestId);
  if (!request) return;
  if (message.type === 'AXOLOTL_TOOL_ACK') { request.acknowledge(); return; }
  if (message.type !== 'AXOLOTL_TOOL_RESPONSE') return;
  if (message.ok === true) request.resolve(message.data);
  else request.reject(Object.assign(new (message.code === 'NETWORK_ERROR' ? TypeError : Error)(typeof message.error === 'string' ? message.error : 'Rozšíření požadavek nedokončilo.'), {
    code: message.code, detail: message.detail, pause: !!message.pause,
    ...(message.code === 'ABORTED' ? { name: 'AbortError' } : {}),
  }));
}
function listen() { if (!listening) { window.addEventListener('message', receive); listening = true; } }
function unlisten() { if (listening && !pending.size && !subscribers.size) { window.removeEventListener('message', receive); listening = false; } }
export function subscribeToolEvents(listener: (event: ToolEvent) => void) {
  subscribers.add(listener); listen();
  return () => { subscribers.delete(listener); unlisten(); };
}
export function requestTool<T = unknown>(operation: string, payload: unknown, target: ToolTarget, options: ToolRequestOptions = {}): Promise<T> {
  if (options.signal?.aborted) return Promise.reject(new DOMException('Operace zrušena.', 'AbortError'));
  return new Promise<T>((resolve, reject) => {
    const requestId = crypto.randomUUID();
    let timer: ReturnType<typeof setTimeout>, presence: ReturnType<typeof setTimeout>;
    const finish = (callback: () => void) => {
      if (!pending.delete(requestId)) return;
      clearTimeout(timer); clearTimeout(presence); options.signal?.removeEventListener('abort', cancel); unlisten(); callback();
    };
    const stopRemote = () => window.postMessage({ source:'axolotl-page', type:'AXOLOTL_TOOL_REQUEST', requestId:crypto.randomUUID(), operation:'CANCEL_REQUEST', payload:{requestId}, target }, location.origin);
    const cancel = () => { finish(() => reject(new DOMException('Operace zrušena.', 'AbortError'))); stopRemote(); };
    const timeout = () => {
      finish(() => reject(Object.assign(new Error('Rozšíření neodpovědělo. Nainstalujte nebo aktualizujte propojení Axolotlu a obnovte tuto stránku.'), {code:'BRIDGE_TIMEOUT'})));
      stopRemote();
    };
    pending.set(requestId, { resolve:data=>finish(()=>resolve(data as T)), reject:error=>finish(()=>reject(error)), acknowledge:()=>clearTimeout(presence) });
    listen();
    const limit = options.timeoutMs ?? (operation === 'DOWNLOAD_FILE' ? 240000 : operation === 'REMOTE_FETCH' ? 45000 : 120000);
    timer=setTimeout(timeout, Math.max(1, Math.min(300000,limit)));
    presence=setTimeout(timeout, Math.min(1800,Math.max(1,limit)));
    options.signal?.addEventListener('abort',cancel,{once:true});
    try { window.postMessage({source:'axolotl-page',type:'AXOLOTL_TOOL_REQUEST',requestId,operation,payload,target}, location.origin); }
    catch (error) { finish(()=>reject(error)); }
  });
}
