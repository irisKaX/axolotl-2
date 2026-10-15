import type {PageSnapshot, PageStore} from '../lib/browser-bridge';
import {requestTool, subscribeToolEvents} from './transport';
import {loadTool, toolRoutes, type ToolId} from './registry';
import {createRemoteFetch} from './remote-fetch';

export interface ToolTarget {id:number|null;url:string;connected:boolean;loading:boolean;documentToken?:string;reason:string}
export interface ToolInstance {
  onShow?():void; onHide?():void; onTargetChange?(target:ToolTarget):void;
  onEvent?(event:unknown):void; destroy():void;
}
export interface ToolModule {mount(root:HTMLElement,app:ToolApp):ToolInstance}
export interface ToolApp {
  request(operation:string,payload?:Record<string,unknown>):Promise<any>;
  target():ToolTarget; ensureTarget():void; lock(name:string):void; unlock(name:string):void;
  run<T>(task:()=>Promise<T>|T):Promise<T|undefined>; toast(message:string,kind?:string):void;
  refreshTarget():void; show(id:ToolId):void; session:string;
  fetch:ReturnType<typeof createRemoteFetch>;
}
export function resolveToolTarget(snapshot:PageSnapshot):ToolTarget {
  const {context,tabs,connection}=snapshot;
  const tab=tabs.find(item=>context.tabId===item.id || context.source==='manual' && item.url===context.url);
  return {id:tab?.id??null,url:context.url,connected:!!tab&&connection.status!=='disconnected',loading:false,
    documentToken:tab?.documentToken,
    reason:'Pro kontrolu vyberte otevřenou kartu v horní liště a připojte aktuální rozšíření Axolotl.'};
}
export function createToolRuntime(container:HTMLElement,store:Pick<PageStore,'getSnapshot'|'subscribe'|'refresh'>,toast:ToolApp['toast']) {
  const modules=new Map<ToolId,ToolInstance>(), roots=new Map<ToolId,HTMLElement>();
  const pending=new Map<ToolId,Promise<void>>(), locks=new Set<string>();
  let target=resolveToolTarget(store.getSnapshot()), current:ToolId|undefined, destroyed=false;
  let requests=new AbortController();
  const targetRef=()=>({tabId:target.id,url:target.url});
  const app:ToolApp={
    session:crypto.randomUUID(),target:()=>target,toast,
    request:(operation,payload={})=>requestTool(operation,payload,targetRef(),{signal:requests.signal}),
    fetch:createRemoteFetch(targetRef),
    ensureTarget(){if(!target.connected)throw new Error(target.reason);},
    lock(name){if(locks.size&&!locks.has(name))throw new Error('Jiný nástroj právě pracuje. Nejdříve ho dokončete nebo zastavte.');locks.add(name);},
    unlock(name){locks.delete(name);},
    async run(task){try{return await task();}catch(error){toast(error instanceof Error?error.message:String(error),'error');}},
    refreshTarget:()=>store.refresh(),
    show(id){const route=Object.keys(toolRoutes).find(route=>toolRoutes[route]===id);if(route)location.hash=route;},
  };
  const unsubscribe=store.subscribe(()=>{
    const next=resolveToolTarget(store.getSnapshot());
    const changed=target.id!==next.id||target.url!==next.url||target.documentToken!==next.documentToken||target.connected!==next.connected;
    if(changed){
      requests.abort();requests=new AbortController();
      for(const instance of modules.values())instance.onTargetChange?.(next);
      if(target.id!==null)void requestTool('SESSION_END',{},targetRef(),{timeoutMs:5000}).catch(()=>{});
    }
    target=next;
  });
  const unsubscribeEvents=subscribeToolEvents(event=>{
    if(!target.connected||event.data?.originTabId!==target.id||event.data?.sourceUrl!==target.url||event.data?.documentToken!==(target.documentToken??''))return;
    for(const instance of modules.values())instance.onEvent?.(event);
  });
  return {
    async show(route:string){
      const next=toolRoutes[route];
      if(current!==next&&current)modules.get(current)?.onHide?.();
      current=next;
      for(const [id,root] of roots)root.hidden=id!==current;
      if(!next||destroyed)return;
      if(!roots.has(next)){
        const root=document.createElement('section');root.id='view-'+next;
        root.className='axolotl-tool-root studio-tool';root.dataset.tool=next;
        root.setAttribute('aria-label',container.getAttribute('aria-label')||'Nástroj');
        root.textContent='Načítám nástroj…';roots.set(next,root);container.append(root);
      }
      if(!modules.has(next)&&!pending.has(next)){
        const root=roots.get(next)!;
        pending.set(next,(async()=>{
          try {
            const module=await loadTool(next);
            if(destroyed)return;
            root.replaceChildren();
            const instance=module.mount(root,app);modules.set(next,instance);
            root.hidden=current!==next;
          } catch(error){
            if(destroyed)return;
            const text=document.createElement('p');text.className='notice error';text.setAttribute('role','alert');
            text.textContent='Nástroj se nepodařilo načíst: '+(error instanceof Error?error.message:String(error));
            const retry=document.createElement('button');retry.className='axolotl-button';retry.textContent='Zkusit znovu';
            retry.onclick=()=>void this.show(route);root.replaceChildren(text,retry);
          } finally{pending.delete(next);}
        })());
      }
      await pending.get(next);
      if(!destroyed&&current===next)modules.get(next)?.onShow?.();
    },
    destroy(){
      destroyed=true;unsubscribe();unsubscribeEvents();
      requests.abort();
      if(target.id!==null)void requestTool('SESSION_END',{},targetRef(),{timeoutMs:5000}).catch(()=>{});
      // React owns nested tool roots. Unmount them after the parent commit.
      const instances=[...modules.values()];queueMicrotask(()=>instances.forEach(instance=>instance.destroy()));
      roots.clear();modules.clear();locks.clear();
    },
  };
}
