import {useEffect,useRef,useState} from 'react';
import {usePageContext} from '../app/PageContextProvider';
import {createToolRuntime} from './runtime';
import {localTools,toolRoutes} from './registry';
export function ToolWorkspace({route}:{route:string}) {
  const {store,context,connection}=usePageContext();
  const host=useRef<HTMLDivElement>(null),runtime=useRef<ReturnType<typeof createToolRuntime>|null>(null);
  const [message,setMessage]=useState<{text:string;kind:string}|null>(null);
  const initialRoute=useRef(route);
  useEffect(()=>{
    const root=host.current!;
    // A private container prevents a StrictMode cleanup from unmounting a new root.
    const surface=document.createElement('div');root.append(surface);
    const instance=createToolRuntime(surface,store,(text,kind='info')=>setMessage({text,kind}));
    runtime.current=instance;void instance.show(initialRoute.current);
    return()=>{runtime.current=null;instance.destroy();surface.remove();};
  },[store]);
  useEffect(()=>{setMessage(null);void runtime.current?.show(route);},[route]);
  const id=toolRoutes[route];
  const needsBrowser=!!id&&!localTools.has(id);
  return <div className="axolotl-tools" hidden={!id}>
    {needsBrowser && (connection.status==='disconnected'||!context.url) && <aside className="axolotl-tool-connection" aria-label="Propojení nástroje">
      <span>{connection.status==='disconnected'?'Pro práci s otevřenou stránkou připoj rozšíření Axolotl.':'Vyber cílovou kartu v horní liště.'}</span>
      {connection.status==='disconnected'&&<a href="downloads/axolotl-prohlizec.zip" download>Stáhnout rozšíření</a>}
    </aside>}
    {message&&<div className={'axolotl-tool-toast '+message.kind} role="status"><span>{message.text}</span><button aria-label="Zavřít zprávu" onClick={()=>setMessage(null)}>×</button></div>}
    <div ref={host}/>
  </div>;
}
