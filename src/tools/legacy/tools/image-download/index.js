import { mountReactTool } from '../../shared/react-ui/mount-tool.jsx';
import { fetchImage, prepareArchive } from './download.js';
import { inspectImageMetadata, probeImageMetadata } from './metadata.js';
import { ImagesController } from './controller.js';
import { createImagesView } from './view.jsx';
export function mount(root,app){
  root.classList.add('image-download-tool');const controller=new ImagesController(app, {fetch:(url,options)=>fetchImage(url,{...options,fetcher:app.fetch}),archive:(items,options)=>prepareArchive(items,{...options,fetcher:app.fetch}),metadata:(items,options)=>inspectImageMetadata(items,{...options,probe:(url,options)=>probeImageMetadata(url,{...options,fetcher:app.fetch})})});
  const lifecycle=mountReactTool(root,app,createImagesView(controller));
  const beforeUnload=event=>{if(controller.getSnapshot().running){event.preventDefault();event.returnValue='';}};
  window.addEventListener('beforeunload',beforeUnload);
  return {...lifecycle,scanCurrent:()=>controller.scan(),
    onTargetChange(target){controller.onTargetChange();lifecycle.onTargetChange(target);},
    destroy(){controller.destroy();lifecycle.destroy();window.removeEventListener('beforeunload',beforeUnload);}
  };
}
