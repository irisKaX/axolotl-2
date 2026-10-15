import { mountReactTool } from '../../shared/react-ui/mount-tool.jsx';
import { PdfController } from './controller.js';
import { createPdfView } from './view.jsx';
export function mount(root,app){
 root.classList.add('pdf-scout-tool');const controller=new PdfController(app),lifecycle=mountReactTool(root,app,createPdfView(controller));
 return {...lifecycle,scanCurrent:()=>controller.scan(),onHide(){controller.dismissConfirmation();lifecycle.onHide();},onTargetChange(target){controller.onTargetChange();lifecycle.onTargetChange(target);},destroy(){controller.destroy();lifecycle.destroy();}};
}
