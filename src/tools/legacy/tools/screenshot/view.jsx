import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { Camera, Copy, Crop, Download, Expand, MousePointer2, Monitor, RotateCcw, Trash2 } from 'lucide-react';
import { Button, IconButton, Status } from '../../shared/react-ui/components.jsx';
import { EmptyState, Message, PresentationStage, ToolHeading, WorkspaceCard } from '../../shared/react-ui/tool-parts.jsx';
import { formatBytes } from '../../../../../browser-extension/shared/utils.js';
import { createCropEditor } from './crop-view.js';
import { screenshotActivity } from './controller.js';
const modes=[['visible','Viditelná část','Přesně to, co je teď vidět v cílové kartě.',Monitor],['full','Celá stránka','Od začátku do konce, spojená do jednoho PNG.',Expand],['element','Vybraný prvek','Označte prvek a upřesněte výběr v HTML hierarchii.',MousePointer2]];
export function createScreenshotView(controller) {
  return function ScreenshotView({app,active}) {
    const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot);
    const cropHost=useRef(null),crop=useRef(null),save=useRef(null),first=useRef(null);
    const {result,url,busy,exporting}=state,locked=busy||exporting;
    useLayoutEffect(()=>{
      crop.current=createCropEditor((output,source)=>{controller.applyCrop(output,source);requestAnimationFrame(()=>save.current?.focus({preventScroll:true}));});
      cropHost.current.append(crop.current.node);
      return ()=>{crop.current.destroy();crop.current=null;};
    },[]);
    useEffect(()=>{crop.current?.close();},[result,busy]);
    useEffect(()=>{if(!active)crop.current?.close();},[active]);
    return <>
      <ToolHeading id="screenshot" title="Screenshot Tool" description="Zachyťte výřez, celou stránku nebo vybraný prvek." active={active} activity={screenshotActivity(state)}/>
      <section className="workspace-board" data-workspace="screenshot"><div className="workspace-grid">
        <WorkspaceCard id="capture" title="Pořízení snímku" className="screenshot-capture-card"><div className="capture-modes screenshot-modes">{modes.map(([mode,name,description,Icon],index)=><button key={mode} ref={index===0?first:undefined} type="button" id={'capture-'+mode} className="capture-mode screenshot-mode" disabled={locked} onClick={()=>app.run(()=>mode==='element'?controller.selectElement():controller.capture(mode))}><Icon className="icon" aria-hidden="true"/><strong>{name}</strong><span>{description}</span><span className="mode-action">{mode==='element'?'Vybrat na stránce →':'Pořídit snímek →'}</span></button>)}</div>
          <Message id="screenshot-status" value={state.message}/><div className="progress-wrap" hidden={!busy}><span role="status">{state.progress}</span><Button id="screenshot-cancel" onClick={()=>app.run(()=>controller.cancel())}>Zrušit</Button></div>
        </WorkspaceCard>
        <WorkspaceCard id="preview" title="Náhled a uložení">
          {result?<><div className="preview-header card-title-pair"><div><h2>Náhled snímku</h2><p className="helper">{result.width} × {result.height} px · {formatBytes(result.blob.size)}</p></div><Status state="connected">{result.cropped?'Oříznutý snímek':modes.find(m=>m[0]===result.mode)?.[1]}</Status></div>
            <PresentationStage variant="capture"><div className="image-preview"><img id="screenshot-preview" src={url} alt="Pořízený snímek cílové stránky"/></div></PresentationStage>
            <div className="preview-actions screenshot-result-actions"><Button ref={save} id="screenshot-save" variant="primary" disabled={locked} onClick={()=>app.run(()=>controller.save())}><Download size={17} aria-hidden="true"/>Stáhnout PNG</Button><IconButton id="screenshot-copy" icon={Copy} label="Kopírovat obrázek" disabled={locked} onClick={()=>app.run(()=>controller.copy())}/>{result.mode==='full'&&<IconButton id="screenshot-crop" icon={Crop} label="Oříznout" disabled={locked} onClick={()=>crop.current.open(result,url)}/>}{result.cropped&&<Button id="screenshot-restore" disabled={locked} onClick={()=>controller.restore()}><RotateCcw size={16} aria-hidden="true"/>Vrátit původní</Button>}<IconButton id="screenshot-delete" icon={Trash2} label="Smazat snímek" variant="danger" disabled={locked} onClick={()=>{controller.remove();first.current?.focus({preventScroll:true});}}/></div>
          </>:<PresentationStage variant="capture"><EmptyState icon={Camera} title="Tady bude váš screenshot">Vyberte režim snímání. Výsledek uložíte jako PNG nebo zkopírujete.</EmptyState></PresentationStage>}
        </WorkspaceCard>
      </div></section><div ref={cropHost} data-runtime-control="native"/>
    </>;
  };
}
