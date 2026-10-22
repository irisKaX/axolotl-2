import { readImages } from './background/images.js';
import { readAudit, cancelAudit, cancelSessionAudits } from './background/audits.js';
import { readIndexation } from './background/indexation.js';
import { highlightImageAudit } from './background/image-highlight.js';
import { getSession, sessionTarget, activateTab, status, allSessions, removeSession } from './background/sessions.js';
import { supportedUrl, normalizeHttpUrl } from './shared/utils.js';
import { pageCall, scanFrames } from './background/page-api.js';
import { verifyPdf, downloadFile } from './background/network.js';
import { captureBegin, captureScroll, captureFrame, captureEnd, sessionCaptures } from './background/capture.js';
import { remoteFetch, clearFetchSession } from './remote-fetch.js';
const sessionsQueue = new Map(), running = new Map(), cancelled = new Map(), activeSessions = new Map();
const cancellationKey = (sender, message, requestId) => [sender.tab.id, sender.documentId || "", message.clientId, requestId].join("|");
export const documentTokens = globalThis.__axolotlDocumentTokens = new Map();
const operations = new Set(['TARGET_STATUS','TARGET_INDEXATION','TARGET_ACTIVATE','DASHBOARD_ACTIVATE','PDF_SCAN','SEARCH_SCAN','METADATA_SCAN','HEADINGS_SCAN','STRUCTURED_SCAN','IMAGE_AUDIT_SCAN','AUDIT_CANCEL','IMAGE_AUDIT_HIGHLIGHT','IMAGES_SCAN','PDF_VERIFY','DOWNLOAD_FILE','PICK_START','PICK_CANCEL','CAPTURE_BEGIN','CAPTURE_SCROLL','CAPTURE_FRAME','CAPTURE_END','REMOTE_FETCH','CANCEL_REQUEST','REMOTE_FETCH_CANCEL','SITE_ACCESS','TARGET_CHANGE','SESSION_END']);
const events = new Set(['PICK_RESULT','PICK_CANCEL','PICK_ERROR','RETURN_DASHBOARD','CAPTURE_CANCEL']);
const error = (code,message) => Object.assign(new Error(message),{code});
export function isAxolotl(value) { try { const url=new URL(value);return url.origin==='https://iriskax.github.io' && ['/axolotl-2','/axolotl-2/','/axolotl-preview/ds-library-v1-1/'].includes(url.pathname); }catch{return false;} }
export function authorizeSender(sender) {
  if(sender.id!==chrome.runtime.id || sender.frameId!==0 || !Number.isInteger(sender.tab?.id) || sender.tab.incognito || !isAxolotl(sender.url)) throw error('FORBIDDEN','Nepovolený zdroj požadavku.');
}
async function validateTarget(sender,target) {
  if(!Number.isInteger(target?.tabId)||typeof target.url!=='string')throw error('TARGET_REQUIRED','Vyberte otevřenou webovou kartu v záhlaví Axolotlu.');
  let tab;try{tab=await chrome.tabs.get(target.tabId);}catch{throw error('TARGET_CLOSED','Cílová karta byla zavřena.');}
  if(tab.windowId!==sender.tab.windowId||tab.incognito||!supportedUrl(tab.url)||isAxolotl(tab.url))throw error('INVALID_TARGET','Tato cílová karta není povolena. Vyberte webovou stránku ve stejném okně.');
  if(tab.url!==target.url||tab.status==='loading')throw error('STALE_TARGET','Cílová stránka se změnila. Vyberte ji znovu.');
  return tab;
}
async function cleanupSession(session) {
  if(activeSessions.get(session.dashboardId)===session.id)activeSessions.delete(session.dashboardId);
  cancelSessionAudits(session.id);clearFetchSession(session.id);
  for(const work of running.values())if(work.session.id===session.id)work.controller.abort();
  // Invalidate before waiting for capture restoration or page cleanup.
  await removeSession(session.id);
  for(const capture of await sessionCaptures(session))await captureEnd(session,{token:capture.token},false).catch(()=>{});
  await pageCall(session.targetId,session.id,'CLEANUP_SESSION').catch(()=>{});
}
async function ensureSession(sender,message) {
  const key=sender.tab.id,previous=sessionsQueue.get(key)||Promise.resolve();
  const work=previous.catch(()=>{}).then(async()=>{
    const tab=await validateTarget(sender,message.target);
    const dashboard=await chrome.tabs.get(sender.tab.id);
    if(dashboard.status==='loading'||dashboard.incognito||dashboard.windowId!==sender.tab.windowId||!isAxolotl(dashboard.url))throw error('FORBIDDEN','Relace aplikace již není povolena.');
    const existing=(await allSessions()).find(item=>item.dashboardId===sender.tab.id);
    const token=documentTokens.get(tab.id)||'';
    if(existing && existing.clientId===message.clientId && existing.documentId===sender.documentId && existing.targetId===tab.id && existing.targetUrl===tab.url && existing.documentToken===token){activeSessions.set(sender.tab.id,existing.id);return existing;}
    if(existing)await cleanupSession(existing);
    const session={id:crypto.randomUUID(),dashboardId:sender.tab.id,windowId:sender.tab.windowId,documentId:sender.documentId,clientId:message.clientId,targetId:tab.id,targetUrl:tab.url,documentToken:token,createdAt:Date.now()};
    await chrome.storage.session.set({['session:'+session.id]:session});activeSessions.set(sender.tab.id,session.id);return session;
  });
  sessionsQueue.set(key,work);try{return await work;}finally{if(sessionsQueue.get(key)===work)sessionsQueue.delete(key);}
}
async function endSession(sender,message) {
  const key=sender.tab.id,previous=sessionsQueue.get(key)||Promise.resolve();
  const work=previous.catch(()=>{}).then(async()=>{
    const session=(await allSessions()).find(item=>item.dashboardId===key);
    if(!session || session.clientId!==message.clientId || session.documentId!==sender.documentId || session.targetId!==message.target?.tabId || session.targetUrl!==message.target?.url)return {ended:false};
    await cleanupSession(session);return {ended:true};
  });
  sessionsQueue.set(key,work);try{return await work;}finally{if(sessionsQueue.get(key)===work)sessionsQueue.delete(key);}
}
function ownedRequest(sender,message) {
  const id=message.payload?.requestId||message.payload?.fetchId;
  return [...running.values()].find(work=>(work.requestId===id||work.fetchId===id)&&work.session.dashboardId===sender.tab.id&&work.session.clientId===message.clientId&&work.session.documentId===sender.documentId);
}
export async function handleToolRequest(message,sender) {
  authorizeSender(sender);
  if(typeof message.requestId!=='string'||!message.requestId.length||message.requestId.length>80||typeof message.clientId!=='string'||!message.clientId.length||message.clientId.length>80||!operations.has(message.operation))throw error('INVALID_REQUEST','Neznámá nebo neplatná operace.');
  if(message.operation==='SESSION_END')return endSession(sender,message);
  if(['CANCEL_REQUEST','REMOTE_FETCH_CANCEL'].includes(message.operation)) {
    const work=ownedRequest(sender,message);if(!work){
      const id=message.payload?.requestId||message.payload?.fetchId;
      if(typeof id==='string'&&id.length<=80){
        for(const [key,until] of cancelled)if(until<Date.now())cancelled.delete(key);
        cancelled.set(cancellationKey(sender,message,id),Date.now()+60000);
        if(cancelled.size>512)cancelled.delete(cancelled.keys().next().value);
      }
      return {cancelled:false};
    }
    work.controller.abort();if(work.scanId)cancelAudit(work.session.id,work.scanId);
    if(work.operation.startsWith('CAPTURE_')||work.operation==='PICK_START') {
      for(const capture of await sessionCaptures(work.session))await captureEnd(work.session,{token:capture.token},false).catch(()=>{});
      await pageCall(work.session.targetId,work.session.id,'PICK_CANCEL').catch(()=>{});
    }
    return {cancelled:true};
  }
  const session=await ensureSession(sender,message),payload=message.payload||{},controller=new AbortController();
  if(activeSessions.get(session.dashboardId)!==session.id)throw new DOMException('Operace zrušena.','AbortError');
  const cancelKeys=[message.requestId,payload.fetchId].filter(Boolean).map(id=>cancellationKey(sender,message,id));
  if(cancelKeys.some(key=>cancelled.has(key))){for(const key of cancelKeys)cancelled.delete(key);throw new DOMException('Operace zrušena.','AbortError');}
  const requestKey=session.id+'|'+message.requestId;
  if(running.has(requestKey))throw error('DUPLICATE_REQUEST','Požadavek již probíhá.');
  const current=[...running.values()].filter(work=>work.session.id===session.id);
  if(current.length>=32 || message.operation==='REMOTE_FETCH'&&current.filter(work=>work.operation==='REMOTE_FETCH').length>=8)throw error('BUSY','Probíhá příliš mnoho požadavků. Zkuste to za chvíli.');
  const work={session,controller,operation:message.operation,requestId:message.requestId,scanId:payload.scanId,fetchId:payload.fetchId};running.set(requestKey,work);
  if(typeof payload.scanId==='string'&&/^[\w-]{1,120}$/.test(payload.scanId))controller.signal.addEventListener('abort',()=>cancelAudit(session.id,payload.scanId),{once:true});
  try {
    const data=await dispatch(session,message.operation,payload,controller.signal);
    if(controller.signal.aborted)throw new DOMException('Operace zrušena.','AbortError');
    const live=await getSession(session.id).catch(()=>null);
    if(!live || session.documentToken!==(documentTokens.get(session.targetId)||''))throw error('STALE_TARGET','Cílová stránka se změnila.');
    await sessionTarget(session);
    return data;
  }finally{running.delete(requestKey);}
}
async function dispatch(session,operation,payload,signal) {
  switch(operation) {
    case 'TARGET_STATUS': case 'TARGET_CHANGE': return {...await status(session),documentToken:session.documentToken};
    case 'SITE_ACCESS': {
      const url=normalizeHttpUrl(payload.url||session.targetUrl);if(!url)throw error('INVALID_URL','Neplatná adresa stránky.');
      const origin=new URL(url).origin+'/*';return chrome.permissions.contains({origins:[origin]});
    }
    case 'TARGET_INDEXATION': return readIndexation(await sessionTarget(session),payload);
    case 'TARGET_ACTIVATE': await activateTab((await sessionTarget(session)).id);return {};
    case 'DASHBOARD_ACTIVATE': await activateTab(session.dashboardId);return {};
    case 'PDF_SCAN': return scanFrames(session.targetId,session.id,payload);
    case 'SEARCH_SCAN':case 'METADATA_SCAN':case 'HEADINGS_SCAN':case 'STRUCTURED_SCAN':case 'IMAGE_AUDIT_SCAN':return readAudit(await sessionTarget(session),operation,{sessionId:session.id,scanId:payload.scanId});
    case 'AUDIT_CANCEL':return cancelAudit(session.id,payload.scanId);
    case 'IMAGE_AUDIT_HIGHLIGHT': {const tab=await sessionTarget(session),result=await highlightImageAudit(tab,payload);await activateTab(tab.id);return result;}
    case 'IMAGES_SCAN':return readImages(await sessionTarget(session));
    case 'PDF_VERIFY':return verifyPdf(payload.url);
    case 'DOWNLOAD_FILE': {const {id}=await downloadFile(payload);return waitForDownload(id,signal);}
    case 'PICK_START': {
      if(payload.mode!=='element')throw error('INVALID_MODE','Neznámý režim výběru.');
      if((await sessionCaptures(session)).length)throw error('CAPTURE_ACTIVE','Nejdříve dokončete snímání.');
      await activateTab(session.targetId);
      if(signal.aborted)throw new DOMException('Operace zrušena.','AbortError');
      const result=await pageCall(session.targetId,session.id,'PICK_START',payload);
      if(signal.aborted){await pageCall(session.targetId,session.id,'PICK_CANCEL').catch(()=>{});throw new DOMException('Operace zrušena.','AbortError');}
      return result;
    }
    case 'PICK_CANCEL':return pageCall(session.targetId,session.id,'PICK_CANCEL');
    case 'CAPTURE_BEGIN':return captureBegin(session,payload,signal);
    case 'CAPTURE_SCROLL':return captureScroll(session,payload);
    case 'CAPTURE_FRAME':return captureFrame(session,payload);
    case 'CAPTURE_END':return captureEnd(session,payload);
    case 'REMOTE_FETCH':return remoteFetch(session,payload,signal);
  }
}
function waitForDownload(id,signal) {
  return new Promise((resolve,reject)=>{
    let settled=false,checking=false;
    const finish=(failure,value)=>{if(settled)return;settled=true;clearInterval(interval);clearTimeout(timer);signal.removeEventListener('abort',abort);chrome.downloads.onChanged?.removeListener(change);failure?reject(failure):resolve(value);};
    const abort=()=>{void chrome.downloads.cancel(id).catch(()=>{});finish(new DOMException('Stahování zrušeno.','AbortError'));};
    const check=async()=>{if(checking||settled)return;checking=true;try{const [item]=await chrome.downloads.search({id});if(item?.state==='complete')finish(null,{id,state:'complete',bytesReceived:item.bytesReceived});else if(item?.state==='interrupted')finish(error('DOWNLOAD_INTERRUPTED','Stahování bylo přerušeno: '+(item.error||'neznámá chyba')));}catch(e){finish(e);}finally{checking=false;}};
    const change=delta=>{if(delta.id===id)void check();};
    const interval=setInterval(check,800),timer=setTimeout(()=>{void chrome.downloads.cancel(id).catch(()=>{});finish(error('DOWNLOAD_TIMEOUT','Stažení nebylo v časovém limitu potvrzeno.'));},235000);
    chrome.downloads.onChanged?.addListener(change);signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();else void check();
  });
}
export async function handlePageEvent(message,sender) {
  if(sender.id!==chrome.runtime.id||sender.frameId!==0||!sender.tab?.id||sender.tab.incognito||!events.has(message.type))throw error('FORBIDDEN','Nepovolený zdroj události.');
  const session=await getSession(message.session);
  if(session.targetId!==sender.tab.id||session.windowId!==sender.tab.windowId||session.targetUrl!==sender.url||session.documentToken!==(documentTokens.get(sender.tab.id)||''))throw error('STALE_TARGET','Cílová karta se změnila.');
  await sessionTarget(session);
  const dashboard=await chrome.tabs.get(session.dashboardId);
  if(!isAxolotl(dashboard.url)||dashboard.incognito||dashboard.windowId!==session.windowId)throw error('FORBIDDEN','Relace aplikace již není povolena.');
  if(message.type==='CAPTURE_CANCEL')await captureEnd(session,message.data||{},false);
  await getSession(session.id);
  await activateTab(session.dashboardId).catch(()=>{});
  // Page events can wait on browser APIs while another target replaces their session.
  await getSession(session.id);
  await chrome.tabs.sendMessage(session.dashboardId,{type:'AXOLOTL_TOOL_EVENT',clientId:session.clientId,event:{type:message.type,data:{...message.data,originTabId:sender.tab.id,sourceUrl:session.targetUrl,documentToken:session.documentToken,sessionId:session.id}}},{frameId:0,...(session.documentId?{documentId:session.documentId}:{})});
  return {};
}
export async function cleanupTab(id, removed=false) {
  if(removed)documentTokens.delete(id);else documentTokens.set(id,crypto.randomUUID());
  for(const session of await allSessions())if(session.dashboardId===id||session.targetId===id)await cleanupSession(session);
}
