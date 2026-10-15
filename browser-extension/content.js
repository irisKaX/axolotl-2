(() => {
  const clientId = typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()) + Math.random();
  const post = data => window.postMessage({ source: 'axolotl-extension', ...data }, location.origin);
  chrome.runtime.onMessage?.addListener((message, sender) => {
    if (sender.id !== chrome.runtime.id || message?.type !== 'AXOLOTL_TOOL_EVENT' || message.clientId !== clientId) return false;
    if (typeof message.event?.type === 'string') post({ type: 'AXOLOTL_TOOL_EVENT', event: message.event });
    return false;
  });
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== 'axolotl-page' || !['AXOLOTL_GET_TABS','AXOLOTL_TOOL_REQUEST'].includes(data.type) || typeof data.requestId !== 'string' || !data.requestId.length || data.requestId.length > 80) return;
    if (data.type === 'AXOLOTL_GET_TABS') {
      const reply = result => post({ type:'AXOLOTL_TABS',requestId:data.requestId,ok:result?.ok===true,tabs:result?.tabs||[],activeId:result?.activeId??null });
      try { chrome.runtime.sendMessage({type:'AXOLOTL_GET_TABS'}).then(reply).catch(()=>reply(null)); } catch { reply(null); }
      return;
    }
    if (typeof data.operation !== 'string' || data.operation.length > 64) return;
    post({type:'AXOLOTL_TOOL_ACK',requestId:data.requestId});
    const reply = result => post({type:'AXOLOTL_TOOL_RESPONSE',requestId:data.requestId,ok:result?.ok===true,data:result?.data,error:result?.error||(!result?'Aktualizujte rozšíření Axolotlu a obnovte aplikaci.':undefined),code:result?.code||(!result?'BRIDGE_UNAVAILABLE':undefined),detail:result?.detail,pause:!!result?.pause});
    try { chrome.runtime.sendMessage({type:'AXOLOTL_TOOL_REQUEST',requestId:data.requestId,operation:data.operation,payload:data.payload,target:data.target,clientId}).then(reply).catch(()=>reply(null)); } catch { reply(null); }
  });
})();
