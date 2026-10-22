import {useEffect,useState,useRef} from 'react';
import {usePageContext} from '../PageContextProvider';
import {requestTool} from '../../tools/transport';
import {evaluateRobots,unknownRobots,type RobotsObservation,type RobotsResult} from './robots';

export function useRobotsStatus(draft:string) {
  const {context,connection,tabs}=usePageContext();
  const documentToken=tabs.find(tab=>tab.id===context.tabId)?.documentToken??'';
  const key=JSON.stringify([context.url,context.tabId,context.source,connection.status,documentToken,draft]);
  const identity=useRef({key,revision:0});
  if(identity.current.key!==key)identity.current={key,revision:identity.current.revision+1};
  const requestKey=key+identity.current.revision;
  const [settled,setSettled]=useState<{key:string;result:RobotsResult}|null>(null);
  const reason=draft!==context.url?'URL se upravuje; předchozí výsledek byl zneplatněn.':!context.url?'Vyber kartu nebo zadej URL.':connection.status!=='connected'?'Rozšíření není připojené; stránka nebyla ověřena.':context.tabId===null?'Ručně zadanou URL nelze číst bez výběru otevřené karty.':null;
  useEffect(()=>{
    if(reason)return;
    const controller=new AbortController();
    requestTool<RobotsObservation&{id:number;url:string;documentId:string}>('TARGET_INDEXATION',{id:context.tabId,url:context.url},context,{signal:controller.signal,timeoutMs:8000}).then(data=>{
      if(controller.signal.aborted)return;
      if(!data||data.id!==context.tabId||data.url!==context.url||!data.documentId||!Array.isArray(data.entries))throw Error('Odpověď neodpovídá aktuální stránce.');
      setSettled({key:requestKey,result:evaluateRobots(data)});
    }).catch(error=>{
      if(!controller.signal.aborted)setSettled({key:requestKey,result:unknownRobots(error instanceof Error?error.message:'Kontrola není dostupná.')});
    });
    return ()=>controller.abort();
  },[requestKey,reason,context.tabId,context.url]);
  // Key comparison clears stale results synchronously, before effects or delayed replies.
  return reason?unknownRobots(reason):settled?.key===requestKey?settled.result:unknownRobots('Kontrola probíhá…');
}
