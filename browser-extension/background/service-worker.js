import '../background.js';
import { handleToolRequest, handlePageEvent, cleanupTab } from '../tool-bridge.js';
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  const task=message?.type==='AXOLOTL_TOOL_REQUEST'?()=>handleToolRequest(message,sender):message?.channel==='o2-content'?()=>handlePageEvent(message,sender):null;
  if(!task)return false;
  task().then(data=>respond({ok:true,data})).catch(error=>respond({ok:false,error:error.message,code:error.name==='AbortError'?'ABORTED':error.name==='TypeError'?'NETWORK_ERROR':error.code,detail:error.detail,pause:!!error.pause}));
  return true;
});
chrome.tabs.onRemoved.addListener(id=>{void cleanupTab(id,true).catch(()=>{});});
chrome.tabs.onUpdated.addListener((id,change)=>{if(change.status==='loading'||change.url)void cleanupTab(id).catch(()=>{});});
