import { filterImages, imageFilename, allowedImageUrl } from './model.js';
import { fetchImage, prepareArchive, saveImageBlob } from './download.js';
import { inspectImageMetadata } from './metadata.js';
import { formatBytes, timestamp, safeFilename } from '../../shared/utils.js';
export class ImagesController {
  constructor(app, { fetch = fetchImage, archive = prepareArchive, save = saveImageBlob, metadata = inspectImageMetadata } = {}) {
    this.app=app;this.fetch=fetch;this.archive=archive;this.save=save;this.metadata=metadata;this.metadataOperation=null;this.listeners=new Set();this.generation=0;this.destroyed=false;this.operation=null;
    this.state={items:[],selected:new Set(),states:new Map(),scanned:false,scanRevision:0,truncated:false,framesSkipped:0,unsupported:0,running:false,phase:'',downloadStage:'',metadataPending:false,page:0,filters:{query:'',format:'',minWidth:0,minHeight:0,variants:false},message:null,downloadStatus:null};
  }
  getSnapshot=()=>this.state;
  subscribe=fn=>{this.listeners.add(fn);return()=>this.listeners.delete(fn);};
  patch(next){if(this.destroyed)return;this.state={...this.state,...next};for(const fn of this.listeners)fn();}
  patchItems(items){
    const lastPage=Math.max(0,Math.ceil(filterImages(items,this.state.filters).length/48)-1);
    this.patch({items,page:Math.min(this.state.page,lastPage)});
  }
  filtered(){return filterImages(this.state.items,this.state.filters);}
  setFilters(next){if(!this.state.running)this.patch({filters:{...this.state.filters,...next},page:0});}
  setPage(page){if(!this.state.running)this.patch({page:Math.max(0,Math.min(page,Math.ceil(this.filtered().length/48)-1))});}
  select(url,checked){if(this.state.running||this.destroyed)return;const selected=new Set(this.state.selected);checked?selected.add(url):selected.delete(url);this.patch({selected,downloadStatus:null});}
  selectAll(checked){if(this.state.running||this.destroyed)return;const selected=new Set(this.state.selected);for(const item of this.filtered())checked?selected.add(item.url):selected.delete(item.url);this.patch({selected,downloadStatus:null});}
  clearSelection(){if(!this.state.running)this.patch({selected:new Set(),downloadStatus:null});}
  rename(url,value){
    if(this.state.running||this.destroyed)throw Error('Počkejte na dokončení operace.');
    if(!String(value).trim())throw Error('Zadejte název souboru.');
    const name=safeFilename(value,'obrazek').normalize('NFC');
    this.patch({items:this.state.items.map(item=>item.url===url?{...item,name,outputName:name}:item)});return name;
  }
  begin(phase){
    if(this.destroyed||this.state.running)return null;
    if(phase==='scan')this.app.ensureTarget();this.app.lock('images');
    const op={epoch:this.generation,aborter:new AbortController()};this.operation=op;
    this.patch({running:true,phase,downloadStage:phase==='download'?'prepare':'',message:null,downloadStatus:null});return op;
  }
  alive(op){return !this.destroyed&&op.epoch===this.generation&&this.operation===op;}
  finish(op){if(this.operation!==op)return;this.operation=null;this.patch({running:false,phase:'',downloadStage:''});this.app.unlock('images');}
  async scan(){
    const op=this.begin('scan');if(!op)return;
    try{const result=await this.app.request('IMAGES_SCAN');if(!this.alive(op))return;
      this.patch({items:result.items.filter(item=>allowedImageUrl(item.url)).map(item=>({...item,metadataStatus:!item.width||!item.height||item.format==='unknown'?'pending':'done'})),selected:new Set(),states:new Map(),page:0,scanned:true,metadataPending:false,scanRevision:this.state.scanRevision+1,truncated:!!result.truncated,framesSkipped:result.framesSkipped||0,unsupported:result.unsupported||0});
      this.resolveMetadata();
    }catch(error){if(this.alive(op))this.patch({message:{text:error.message,kind:'error'}});}
    finally{this.finish(op);}
  }
  stopMetadata(){this.metadataOperation?.abort();this.metadataOperation=null;}
  resolveMetadata(){
    this.stopMetadata();
    if(!this.state.items.some(item=>item.metadataStatus==='pending'))return;
    const aborter=new AbortController(),epoch=this.generation;this.metadataOperation=aborter;
    const current=()=>!this.destroyed&&!aborter.signal.aborted&&this.metadataOperation===aborter&&epoch===this.generation;
    this.patch({metadataPending:true});
    Promise.resolve().then(()=>this.metadata(this.state.items,{signal:aborter.signal,onUpdate:(url,result)=>{
      if(!current())return;
      const {width,height,format}=result;
      this.patchItems(this.state.items.map(item=>item.url===url?{...item,...(format?{format}:{}),...(width&&height?{width,height}:{}),metadataStatus:'done'}:item));
    }})).catch(()=>{}).finally(()=>{
      if(!current())return;
      this.metadataOperation=null;this.patch({metadataPending:false,items:this.state.items.map(item=>item.metadataStatus==='pending'?{...item,metadataStatus:'unavailable'}:item)});
    });
  }
  recordDimensions(url,width,height,revision=this.state.scanRevision){
    if(this.destroyed||revision!==this.state.scanRevision||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return;
    const item=this.state.items.find(item=>item.url===url);
    if(!item||item.width&&item.height)return;
    this.patchItems(this.state.items.map(item=>item.url===url?{...item,width,height}:item));
  }
  cancel(){if(this.operation&&this.state.phase==='download'){this.operation.aborter.abort();this.patch({downloadStatus:{text:'Stahování bylo zrušeno.',kind:'info'}});}}
  async download(url){
    const chosen=url?this.state.items.filter(item=>item.url===url):this.state.items.filter(item=>this.state.selected.has(item.url));if(!chosen.length)return;
    const op=this.begin('download');if(!op)return;const signal=op.aborter.signal,single=url?chosen[0]:null;
    const status=(text,kind='info')=>{if(this.alive(op))this.patch({downloadStatus:{text,kind}});};
    const progress=update=>{
      if(!this.alive(op)||signal.aborted)return;
      if(update.phase==='zip'){this.patch({downloadStage:'zip'});status('Připravuji ZIP: '+update.percent+' %');return;}
      status(`Stahuji obrázky: ${update.completed} / ${update.total}`);
      if(update.ok!==undefined){const states=new Map(this.state.states);states.set(update.item.url,{text:update.ok?'Připraveno · '+formatBytes(update.bytes):update.reason,error:!update.ok});this.patch({states});}
    };
    try{
      if(single){
        status('Stahuji '+single.name+'…');const blob=await this.fetch(single.url,{signal});if(!this.alive(op)||signal.aborted)return;
        this.patch({downloadStage:'save'});status('Vyberte umístění souboru a potvrďte uložení…');
        await this.save(blob,imageFilename(single.url,blob.type,new Set(),single.outputName),{signal});if(!this.alive(op)||signal.aborted)return;
        const states=new Map(this.state.states);states.set(single.url,{text:'Předáno ke stažení · '+formatBytes(blob.size),complete:true});this.patch({states});status('Obrázek byl předán prohlížeči ke stažení.','success');
      }else{
        const result=await this.archive(chosen,{signal,onProgress:progress});if(!this.alive(op)||signal.aborted)return;
        this.patch({downloadStage:'save'});status('Vyberte umístění ZIPu a potvrďte uložení…');
        await this.save(result.blob,'obrazky-'+timestamp()+'.zip',{signal});if(!this.alive(op)||signal.aborted)return;
        const failures=new Set(result.failures.map(item=>item.url)),states=new Map(this.state.states);
        for(const item of chosen)if(!failures.has(item.url)&&!states.get(item.url)?.error)states.set(item.url,{text:'Staženo v ZIPu',complete:true});
        this.patch({states});
        status(`ZIP s ${result.succeeded} obrázky byl předán prohlížeči ke stažení.`+(result.failures.length?` ${result.failures.length} souborů se nepodařilo stáhnout. Jejich seznam najdete i v ZIPu.`:''),result.failures.length?'warning':'success');
      }
    }catch(error){if(this.alive(op)){const canceled=signal.aborted||error.name==='AbortError'||error.code==='USER_CANCELED',text=canceled?'Uložení bylo zrušeno.':error.message;status(text,canceled?'info':'error');const states=new Map(this.state.states);if(single)states.set(single.url,{text:canceled?'Uložení zrušeno':text,error:!canceled});else for(const item of chosen)if(!states.get(item.url)?.error)states.set(item.url,{text:canceled?'Uložení ZIPu zrušeno':'ZIP nebyl uložen',error:!canceled});this.patch({states});}}
    finally{this.finish(op);}
  }
  onTargetChange(){this.generation++;this.stopMetadata();this.operation?.aborter.abort();if(this.operation)this.finish(this.operation);this.patch({metadataPending:false,items:[],selected:new Set(),states:new Map(),scanned:false,truncated:false,framesSkipped:0,unsupported:0,page:0,message:null,downloadStatus:null});}
  destroy(){if(this.destroyed)return;this.destroyed=true;this.generation++;this.stopMetadata();this.operation?.aborter.abort();if(this.operation)this.finish(this.operation);this.listeners.clear();}
}
