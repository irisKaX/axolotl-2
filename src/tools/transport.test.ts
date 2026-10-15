import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestTool, subscribeToolEvents } from './transport';
const target = {tabId: 3, url:'https://example.test/'};
const reply = (data: Record<string, unknown>, origin=location.origin, source: Window=window) => window.dispatchEvent(new MessageEvent('message',{origin,source,data:{source:'axolotl-extension',type:'AXOLOTL_TOOL_RESPONSE',...data}}));
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();});
describe('privileged tool transport',()=>{
 it('correlates concurrent replies and rejects foreign, stale and wrong-window replies',async()=>{
  const sent=vi.spyOn(window,'postMessage').mockImplementation(()=>{});
  const a=requestTool('METADATA_SCAN',{},target),b=requestTool('HEADINGS_SCAN',{},target);
  const [first,second]=sent.mock.calls.map(([message])=>message);
  reply({requestId:first.requestId,ok:true,data:'foreign'},'https://evil.test');
  reply({requestId:'old',ok:true,data:'stale'});
  reply({requestId:second.requestId,ok:true,data:'second'});
  reply({requestId:first.requestId,ok:true,data:'first'});
  expect(await Promise.all([a,b])).toEqual(['first','second']);
 });
 it('cancels the exact remote request and ignores late completion',async()=>{
  const sent=vi.spyOn(window,'postMessage').mockImplementation(()=>{});const controller=new AbortController();
  const pending=requestTool('REMOTE_FETCH',{url:target.url},target,{signal:controller.signal});
  const rejected=expect(pending).rejects.toMatchObject({name:'AbortError'});const id=sent.mock.calls[0][0].requestId;
  controller.abort();await rejected;
  expect(sent.mock.calls[1][0]).toMatchObject({operation:'CANCEL_REQUEST',payload:{requestId:id}});
  reply({requestId:id,ok:true,data:'late'});
 });
 it('times out absent or outdated extension with a useful error',async()=>{
  vi.useFakeTimers();vi.spyOn(window,'postMessage').mockImplementation(()=>{});
  const pending=requestTool('IMAGES_SCAN',{},target,{timeoutMs:100});
  const rejected=expect(pending).rejects.toMatchObject({code:'BRIDGE_TIMEOUT'});
  await vi.advanceTimersByTimeAsync(101);await rejected;
 });
 it('forwards structured errors and allows event unsubscribe',async()=>{
  const sent=vi.spyOn(window,'postMessage').mockImplementation(()=>{});const pending=requestTool('PDF_SCAN',{},target);
  reply({requestId:sent.mock.calls[0][0].requestId,ok:false,error:'Obnovte stránku',code:'STALE_TARGET',pause:true,detail:'Changed'});
  await expect(pending).rejects.toMatchObject({message:'Obnovte stránku',code:'STALE_TARGET',pause:true,detail:'Changed'});
  const listener=vi.fn(),off=subscribeToolEvents(listener);
  reply({type:'AXOLOTL_TOOL_EVENT',event:{type:'PICK_CANCEL',data:{originTabId:3}}});off();
  reply({type:'AXOLOTL_TOOL_EVENT',event:{type:'PICK_CANCEL',data:{}}});expect(listener).toHaveBeenCalledTimes(1);
 });
});
