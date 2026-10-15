function cancelled() {
 const error=new Error('Stahování bylo zrušeno.');error.name='AbortError';error.code='USER_CANCELED';return error;
}
/** A download ID means accepted, not saved. Keep the blob alive until a terminal state.
 * @param {Blob} blob
 * @param {string} filename
 * @param {{signal?: AbortSignal, timeoutMs?:number, downloads?:any}} options
 */
export async function saveDownload(blob, filename, { signal=undefined, timeoutMs=180000, downloads=globalThis.chrome?.downloads }={}) {
 if(signal?.aborted)throw cancelled();
 if(!downloads?.download||!downloads?.onChanged){
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=String(filename).split(/[\\/]/).pop()||'axolotl-export';
  link.hidden=true;document.body.append(link);
  try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  // A web page can offer a file, but cannot observe completion in the browser.
  return {state:'started'};
 }
 const url=URL.createObjectURL(blob);
 return new Promise((resolve,reject)=>{
  let id=null,settled=false,timer;const early=new Map();
  const cleanup=()=>{clearTimeout(timer);downloads.onChanged.removeListener(changed);downloads.onErased?.removeListener(erased);signal?.removeEventListener('abort',abort);early.clear();URL.revokeObjectURL(url);};
  const finish=(error)=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve({id,state:'complete'});};
  const cancelTransfer=()=>{if(id!==null&&downloads.cancel)Promise.resolve().then(()=>downloads.cancel(id)).catch(()=>{});};
  const abort=()=>{cancelTransfer();finish(cancelled());};
  const terminal=(state,error)=>{
   if(state==='complete')finish();
   else if(state==='interrupted')finish(error==='USER_CANCELED'?cancelled():new Error('Stahování bylo přerušeno'+(error?' ('+error+')':'')+'.'));
  };
  const changed=delta=>{
   if(!delta.state&&!delta.error)return;
   if(id===null){if(early.size<100)early.set(delta.id,{...early.get(delta.id),...delta});return;}
   if(delta.id===id)terminal(delta.state?.current,delta.error?.current);
  };
  const erased=erasedId=>{if(erasedId===id)finish(cancelled());};
  downloads.onChanged.addListener(changed);downloads.onErased?.addListener(erased);signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>{cancelTransfer();finish(new Error('Dokončení stažení se nepodařilo ověřit v časovém limitu. Zkontrolujte stahování v prohlížeči.'));},timeoutMs);
  Promise.resolve().then(()=>settled?null:downloads.download({url,filename,saveAs:true,conflictAction:'uniquify'})).then(async downloadId=>{
   id=downloadId;
   if(settled){cancelTransfer();return;}
   if(!Number.isInteger(id)){finish(new Error('Prohlížeč nepotvrdil zahájení stahování.'));return;}
   const delta=early.get(id);early.clear();if(delta)terminal(delta.state?.current,delta.error?.current);
   if(!settled&&downloads.search){
    try{const [item]=await downloads.search({id});if(!settled&&item)terminal(item.state,item.error);}catch{/* onChanged remains authoritative if search is unavailable. */}
   }
  }).catch(error=>finish(/USER_CANCELED|user cancel(?:ed|led)/i.test(error?.message||'')?cancelled():new Error('Uložení se nepodařilo: '+(error?.message||error))));
 });
}
