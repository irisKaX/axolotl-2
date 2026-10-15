import {describe,it,expect,vi} from 'vitest';
import type {PageSnapshot,PageStore} from '../lib/browser-bridge';
import type {ToolApp} from './runtime';
const capture=vi.hoisted(()=>({app:null as ToolApp|null,events:[] as unknown[]}));
vi.mock('./registry',()=>({toolRoutes:{'media/pdf-scout':'pdf'},loadTool:async()=>({mount(_root:HTMLElement,app:ToolApp){capture.app=app;return {onEvent:(event:unknown)=>capture.events.push(event),destroy(){}};}})}));
import {createToolRuntime} from './runtime';
function fixture(){
  let state:PageSnapshot={context:{url:'https://a.example/',tabId:1,source:'tab'},connection:{status:'connected',tabCount:2},tabs:[{id:1,title:'A',url:'https://a.example/',documentToken:'A1'},{id:2,title:'B',url:'https://b.example/',documentToken:'B1'}]};
  const listeners=new Set<()=>void>();
  const store:Pick<PageStore,'getSnapshot'|'subscribe'|'refresh'>={getSnapshot:()=>state,subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};},refresh(){}};
  const runtime=createToolRuntime(document.createElement('div'),store,()=>{});
  const change=()=>{state={...state,context:{url:'https://b.example/',tabId:2,source:'tab'}};listeners.forEach(fn=>fn());};
  return {runtime,change};
}
describe('target-scoped tool work',()=>{
  it('aborts pending page work immediately when switching tabs',async()=>{
    vi.spyOn(window,'postMessage').mockImplementation(()=>{});
    const {runtime,change}=fixture();await runtime.show('media/pdf-scout');
    const pending=capture.app!.request('DOWNLOAD_FILE',{url:'https://a.example/file.pdf'});
    const rejected=expect(pending).rejects.toMatchObject({name:'AbortError'});
    change();await rejected;runtime.destroy();
  });
  it('ignores a late picker event from the old tab or an older document',async()=>{
    vi.spyOn(window,'postMessage').mockImplementation(()=>{});capture.events=[];
    const {runtime,change}=fixture();await runtime.show('media/pdf-scout');change();
    const emit=(data:unknown)=>window.dispatchEvent(new MessageEvent('message',{source:window,origin:location.origin,data:{source:'axolotl-extension',type:'AXOLOTL_TOOL_EVENT',event:{type:'PICK_RESULT',data}}}));
    emit({originTabId:1,sourceUrl:'https://a.example/',documentToken:'A1'});
    emit({originTabId:2,sourceUrl:'https://b.example/',documentToken:'OLD'});
    expect(capture.events).toHaveLength(0);
    emit({originTabId:2,sourceUrl:'https://b.example/',documentToken:'B1'});
    expect(capture.events).toHaveLength(1);runtime.destroy();
  });
});
