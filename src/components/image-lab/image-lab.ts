import {pairedFeatureDistance,shuffledOrder,type ImageDistance} from '../../lib/image-fid';
import {validateFiles,imageDimensions,IMAGE_LIMITS,DEFAULT_EDITS,type Edits} from '../../lib/image-input';
import {prepareImage} from '../../../figures/image-lab-process';
type Mode='jpeg'|'reference'|'custom';
interface Result {type:'result';score:ImageDistance;mode:Mode;modelSha256:string;seconds:number;features:{reference:number[][];candidate:number[][]}}
type Prepared=ReturnType<typeof prepareImage>;

class ImageLab extends HTMLElement {
  private worker?:Worker;
  private timer?:ReturnType<typeof setTimeout>;
  private controller?:AbortController;
  private result?:Result;
  private order=Array.from({length:8},(_,i)=>i);
  private sources:HTMLCanvasElement[]=[];
  private metadata:{sha256:string;width:number;height:number;bytes:number}[]=[];
  private prepared?:{reference:Prepared[];candidate:Prepared[]};
  private applied:Edits={...DEFAULT_EDITS};
  private pending=false;
  private loading=false;
  private version=0;
  private el<T extends Element=HTMLElement>(selector:string){return this.querySelector<T>(selector)!;}
  private get mode(){return this.el<HTMLSelectElement>('[data-mode]').value as Mode;}
  private get base(){return new URL(this.dataset.base!,location.href).href;}
  private text(selector:string,value:string){this.el(selector).textContent=value;}
  private uploadFeedback(text:string,state:'idle'|'loading'|'ready'|'error'='idle'){
    const feedback=this.el('[data-upload-status]');feedback.textContent=text;feedback.dataset.state=state;
    this.el('[data-files]').setAttribute('aria-invalid',String(state==='error'));
  }
  private controls(){
    this.el<HTMLFieldSetElement>('[data-editor]').disabled=this.loading;
    this.el<HTMLButtonElement>('[data-run]').disabled=this.loading||this.pending||!!this.worker;
    this.el<HTMLButtonElement>('[data-stop]').disabled=!this.loading&&!this.worker;
    for(const selector of ['[data-shuffle]','[data-restore]'])this.el<HTMLButtonElement>(selector).disabled=this.loading||!!this.worker;
  }
  private invalidate(text:string){
    this.cancel();this.result=undefined;this.el<HTMLElement>('[data-results]').hidden=true;
    this.dataset.state='ready';this.text('[data-status]',text);this.controls();
  }
  private render(){
    const custom=this.mode==='custom',n=custom?this.sources.length:8;
    this.el<HTMLElement>('[data-editor]').hidden=!custom;
    this.text('[data-reference-count]',`01 / ${n} images`);this.text('[data-candidate-count]',`02 / ${n} images`);
    this.text('[data-order-note]',`Candidate source order: ${this.order.map(i=>i+1).join(' → ')}. Only correspondence changes when you shuffle; the image collection stays fixed.`);
    for(const kind of ['reference','candidate'] as const){
      this.querySelectorAll<HTMLImageElement>(`[data-${kind}]`).forEach((img,position)=>{
        const figure=img.closest('figure')!;figure.hidden=position>=n;
        if(position>=n){img.removeAttribute('src');return;}
        const index=kind==='reference'?position:this.order[position];
        img.src=custom?this.prepared![kind][index].preview:`${this.base}${kind==='reference'?'reference':this.mode}-${index+1}.png`;
        img.alt=`${custom?'Local':'Supplied'} ${kind} image ${index+1}, displayed at position ${position+1}`;
        img.dataset.sourceIndex=String(index+1);
        figure.querySelector('figcaption')!.textContent=kind==='reference'?`R ${index+1}`:`Position ${position+1} · source ${index+1}`;
      });
    }
    this.text('[data-reference-note]',custom?'Fixed centre-square crops of your local images. This reference does not move when you edit the candidate.':'Eight fixed crops of one photograph. The same inputs are used every run.');
    this.text('[data-candidate-note]',custom?'Candidate crops and filters are applied to the actual pixels shown here, not just the preview styling.':this.mode==='jpeg'?'JPEG quality 10, decoded and saved as PNG. Compression changes the pixels; saving as PNG does not undo it.':'Exact copies of the reference pixels. This is not a new random sample from the same distribution.');
    this.text('[data-question]',custom?'Can changing the crop or pixel values move the measured distance?':this.mode==='jpeg'?'Can compression move FID even when the photographed subject has not changed?':'Identical collections can have FID zero even when their displayed pairing is wrong.');
  }
  private readEdits():Edits{return {zoom:+this.el<HTMLInputElement>('[data-edit=zoom]').value,x:+this.el<HTMLInputElement>('[data-edit=x]').value,y:+this.el<HTMLInputElement>('[data-edit=y]').value,filter:this.el<HTMLSelectElement>('[data-edit=filter]').value as Edits['filter']};}
  private resetEdits(){
    for(const [key,value] of Object.entries(DEFAULT_EDITS))this.el<HTMLInputElement>(`[data-edit=${key}]`).value=String(value);
    this.updateOutputs();
  }
  private updateOutputs(){const edits=this.readEdits();for(const key of ['zoom','x','y'] as const)this.text(`[data-output=${key}]`,`${edits[key]}${key==='zoom'?'×':'%'}`);}
  private apply(){
    if(!this.sources.length||this.loading)return;
    this.invalidate('Processing changed. Measure these pixels again.');this.applied=this.readEdits();
    this.prepared={reference:this.sources.map(source=>prepareImage(source,DEFAULT_EDITS)),candidate:this.sources.map(source=>prepareImage(source,this.applied))};
    this.pending=false;this.render();this.controls();
    this.text('[data-edit-note]',`Applied: zoom ${this.applied.zoom}×, position ${this.applied.x}% / ${this.applied.y}%, filter ${this.applied.filter}. The previews are the pixels that will be measured.`);
  }
  private async loadFiles(files:File[]){
    const generation=++this.version;this.loading=true;this.invalidate('Previous measurement cleared while local files are checked.');
    this.uploadFeedback(`Checking ${files.length} selected ${files.length===1?'image':'images'}. Nothing is uploaded.`,'loading');
    const sources:HTMLCanvasElement[]=[],metadata:typeof this.metadata=[];
    try{
      validateFiles(files);let totalPixels=0;const inputs=[];
      // Validate every header before decoding any image.
      for(const file of files){
        if(generation!==this.version)return;
        const bytes=new Uint8Array(await file.arrayBuffer()),size=imageDimensions(bytes);totalPixels+=size.width*size.height;
        if(totalPixels>IMAGE_LIMITS.totalPixels)throw new Error('Choose at most 32 megapixels in total.');
        inputs.push({file,bytes,size});
      }
      for(const {file,bytes,size} of inputs){
        if(generation!==this.version)return;
        const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
        try{
          if(generation!==this.version)return;
          if(bitmap.width*bitmap.height!==size.width*size.height)throw new Error('Decoded dimensions do not match the image header.');
          const source=document.createElement('canvas'),scale=Math.min(1,1024/Math.max(bitmap.width,bitmap.height));
          source.width=Math.max(1,Math.round(bitmap.width*scale));source.height=Math.max(1,Math.round(bitmap.height*scale));
          const ctx=source.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,source.width,source.height);
          ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,0,0,source.width,source.height);
          const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
          sources.push(source);metadata.push({sha256,width:bitmap.width,height:bitmap.height,bytes:file.size});
        }finally{bitmap.close();}
      }
      if(generation!==this.version)return;
      this.sources=sources;this.metadata=metadata;this.loading=false;
      this.el<HTMLOptionElement>('option[value=custom]').disabled=false;this.el<HTMLSelectElement>('[data-mode]').value='custom';
      this.order=sources.map((_,i)=>i);this.resetEdits();this.apply();
      this.text('[data-source-note]',`${sources.length} local images loaded. Only prepared pixels are held in memory; clear them or leave this page to discard them.`);
      this.text('[data-status]','Local images ready. Identity settings are applied; measure or edit the candidate.');
      this.uploadFeedback(`${sources.length} images loaded. Reference and candidate copies are ready.`,'ready');
    }catch(error){if(generation===this.version){
      this.loading=false;
      const reason=files.length===1?'Only 1 image selected. Select 2–8 images together in the file picker.':error instanceof Error?error.message:'Could not decode those images.';
      this.uploadFeedback(`Selection not loaded: ${reason} Previous images are unchanged.`,'error');
      this.invalidate('No new images loaded. See the feedback beside the file-selection button.');
    }}
    finally{if(generation===this.version){this.loading=false;this.controls();this.el<HTMLInputElement>('[data-files]').value='';}}
  }
  private paired(){
    if(!this.result)return;
    const value=pairedFeatureDistance(this.result.features.reference,this.result.features.candidate,this.order);
    this.text('[data-paired]',value.toFixed(3));
    this.text('[data-pairing-status]',`Candidate source order: ${this.order.map(i=>i+1).join(' → ')}. FID is unchanged by order; only the paired readout is recalculated.`);
  }
  private report(){
    const r=this.result!;
    return {lab:'SLOP8412 Image lab',createdAt:new Date().toISOString(),...r,type:undefined,
      candidateOrder:this.order.map(i=>i+1),featureOrder:'Both feature arrays remain in original source order; candidateOrder uses one-based indices.',
      pairedFeatureDistance:pairedFeatureDistance(r.features.reference,r.features.candidate,this.order),pairedDefinition:'Mean across displayed pairs of squared Euclidean feature distance; not FID.',
      runtime:'onnxruntime-web 1.22.0 / WASM CPU / single thread',imageSize:[128,128],counts:{reference:this.order.length,candidate:this.order.length},
      encoder:'pytorch-fid 0.3.0 FID-specific Inception-v3, pool3 2048, ONNX opset 17',
      preprocessing:'RGB float32 [0,1]; model bilinear resize 299x299 align_corners=False; normalise [-1,1]',
      covariance:'Full sample covariance, ddof=1, sample-factor SVD; float64 distance arithmetic',
      source:r.mode==='custom'?'User-selected local images':'NASA / Eileen Collins, via scikit-image (public domain)',
      localImages:r.mode==='custom'?this.metadata:undefined,
      processing:r.mode==='custom'?{...this.applied,workingSizes:this.sources.map(c=>[c.width,c.height]),referenceCrops:this.prepared!.reference.map(p=>p.crop),candidateCrops:this.prepared!.candidate.map(p=>p.crop),pipeline:'Browser EXIF orientation and colour decoding; white alpha composite; high-quality canvas resize max edge 1024; square crop to 128; pixel filter. Browser-dependent resizing. Grayscale: .299R+.587G+.114B; blur: 5x5 edge-clamped box; brightness: 1.3 or 0.7 with clipping.'}:r.mode==='jpeg'?'Pillow JPEG quality=10 subsampling=2; decoded pixels stored as PNG':'Identical reference pixels; extracted features reused',
      warning:'Tiny empirical experiment, not a model-quality benchmark. Supplied crops overlap. Export contains image-derived features; treat local-image records as private.',userAgent:navigator.userAgent};
  }
  private measure(){
    if(this.loading||this.pending)return;
    this.invalidate('Starting local inference…');
    const fail=(message:string)=>{this.invalidate(message);this.dataset.state='error';};
    try{
      this.worker=new Worker(new URL('./image-worker.ts',import.meta.url),{type:'module'});this.controls();this.dataset.state='running';
      this.timer=setTimeout(()=>fail('Stopped after three minutes. No score reported. Try a desktop browser.'),180000);
      this.worker.onerror=()=>fail('The image engine could not start. Check the connection and try a current desktop browser. No score reported.');
      this.worker.onmessage=(event:MessageEvent<Result|{type:'progress'|'error';text:string}>)=>{
        const message=event.data;
        if(message.type==='progress'){this.text('[data-status]',message.text);return;}
        if(message.type==='error'){fail(message.text+' No score reported.');return;}
        this.result=message as Result;this.cancel();this.controls();this.dataset.state='complete';
        for(const term of ['total','mean','covariance'] as const)this.text(`[data-value=${term}]`,this.result.score[term].toFixed(3));
        this.text('[data-interpretation]',this.result.score.total===0?'These collections have identical empirical moments. That does not establish that their displayed pairs match.':'The estimated feature moments differ. This score alone does not establish visual quality or correct correspondence.');
        this.text('[data-runtime]',`${this.order.length} reference + ${this.order.length} candidate images · 2,048 features · full sample covariance · ${this.result.seconds.toFixed(1)} seconds · WASM CPU`);
        this.paired();this.el<HTMLElement>('[data-results]').hidden=false;this.text('[data-status]','Complete. Features were extracted from these images in this browser.');
      };
      this.worker.postMessage({base:this.base,mode:this.mode,pixels:this.mode==='custom'?{reference:this.prepared!.reference.map(p=>p.pixels),candidate:this.prepared!.candidate.map(p=>p.pixels)}:undefined});
    }catch(error){fail(error instanceof Error?error.message:'Could not start the image engine.');}
  }
  connectedCallback(){
    this.controller?.abort();this.controller=new AbortController();const {signal}=this.controller;
    const on=(selector:string,event:string,fn:()=>void)=>this.el(selector).addEventListener(event,fn,{signal});
    on('[data-mode]','change',()=>{
      if(this.loading)this.uploadFeedback('File selection cancelled. Previous images are unchanged.');
      this.version++;this.loading=false;this.pending=false;this.order=Array.from({length:this.mode==='custom'?this.sources.length:8},(_,i)=>i);
      this.invalidate('Settings changed. Measure again to produce a matching result.');if(this.mode==='custom')this.apply();else this.render();
    });
    on('[data-upload]','click',()=>this.el<HTMLInputElement>('[data-files]').click());
    on('[data-files]','change',()=>{const files=[...this.el<HTMLInputElement>('[data-files]').files??[]];if(files.length)void this.loadFiles(files);});
    on('[data-demo]','click',()=>{
      this.version++;this.loading=false;this.pending=false;this.sources=[];this.metadata=[];this.prepared=undefined;
      this.el<HTMLInputElement>('[data-files]').value='';this.el<HTMLOptionElement>('option[value=custom]').disabled=true;
      this.el<HTMLSelectElement>('[data-mode]').value='jpeg';this.order=Array.from({length:8},(_,i)=>i);
      this.invalidate('Local images cleared. Supplied demo restored.');this.render();this.text('[data-source-note]','Using the supplied eight-crop example.');
      this.uploadFeedback('Local images cleared. Select 2–8 images together to try another set.');
    });
    for(const input of this.querySelectorAll('[data-edit]'))input.addEventListener('input',()=>{
      this.pending=true;this.invalidate('Unapplied edits. Apply crop and filter before measuring.');this.updateOutputs();this.text('[data-edit-note]','Unapplied edits: the image previews still show the last applied settings.');
    },{signal});
    on('[data-apply]','click',()=>this.apply());on('[data-reset-edits]','click',()=>{this.resetEdits();this.apply();});
    for(const action of ['shuffle','restore'])on(`[data-${action}]`,'click',()=>{
      this.order=action==='shuffle'?shuffledOrder(this.order):this.order.map((_,i)=>i);this.render();this.paired();this.text('[data-order-note]',`Candidate source order: ${this.order.map(i=>i+1).join(' → ')}. Only correspondence changed; the image collection is unchanged.`);
    });
    on('[data-stop]','click',()=>{if(this.loading)this.uploadFeedback('File selection stopped. Previous images are unchanged.');this.version++;this.loading=false;this.invalidate('Stopped. No score reported.');});
    on('[data-run]','click',()=>this.measure());
    on('[data-export]','click',()=>{
      if(!this.result)return;const url=URL.createObjectURL(new Blob([JSON.stringify(this.report(),null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='slop8412-image-measurement.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    document.addEventListener('astro:before-swap',()=>{this.version++;this.cancel();},{signal});this.dataset.ready='true';
  }
  private cancel(){this.worker?.terminate();this.worker=undefined;clearTimeout(this.timer);}
  disconnectedCallback(){this.version++;this.cancel();this.controller?.abort();this.sources=[];this.metadata=[];this.prepared=undefined;this.result=undefined;}
}
if(!customElements.get('image-lab'))customElements.define('image-lab',ImageLab);
