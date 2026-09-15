import type * as Ort from 'onnxruntime-web/wasm';
// Load the already bundled runtime as an asset. Worker-only dependencies can
// otherwise miss Vite's development prebundle scan (504 Outdated Optimize Dep).
import runtimeUrl from '../../../node_modules/onnxruntime-web/dist/ort.wasm.bundle.min.mjs?url';
import wasmUrl from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url';
import mjsUrl from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url';
import {imageDistance} from '../../lib/image-fid';

const progress=(text:string)=>self.postMessage({type:'progress',text});
self.onmessage=async(event:MessageEvent<{base:string;mode:'jpeg'|'reference'|'custom';pixels?:{reference:Uint8ClampedArray[];candidate:Uint8ClampedArray[]}}>)=>{
  let session:Ort.InferenceSession|undefined;
  try{
    const {base,mode,pixels}=event.data,start=performance.now();
    const count=mode==='custom'?pixels?.reference.length??0:8;
    if(count<2||count>8||(mode==='custom'&&(pixels?.candidate.length!==count||[...pixels.reference,...pixels.candidate].some(p=>p.length!==128*128*4))))throw new Error('Invalid local image batch.');
    const ort=await import(/* @vite-ignore */ new URL(runtimeUrl,base).href) as typeof Ort;
    ort.env.wasm.numThreads=1;
    ort.env.wasm.wasmPaths={wasm:new URL(wasmUrl,base).href,mjs:new URL(mjsUrl,base).href};
    const get=async(path:string)=>{const r=await fetch(new URL(path,base));if(!r.ok)throw new Error(`Cannot load ${path} (${r.status}).`);return r;};
    progress('Loading model: 0 / 87 MB. Images stay in this browser.');
    const response=await get('fid-inception-v3.onnx');
    const reader=response.body!.getReader(),chunks:Uint8Array[]= [];let bytes=0,last=0;
    while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);bytes+=value.length;
      if(bytes-last>4e6){progress(`Loading model: ${(bytes/1e6).toFixed(0)} / 87 MB.`);last=bytes;}}
    const model=new Uint8Array(bytes);let offset=0;
    for(const chunk of chunks){model.set(chunk,offset);offset+=chunk.length;}chunks.length=0;
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',model)),v=>v.toString(16).padStart(2,'0')).join('');
    if(digest!=='0c9c5ec1201913dcdebdcccf8f6d8524145f599675a920c6f8995b4a0e4fbc73')throw new Error('Model integrity check failed.');
    progress('Preparing the browser inference engine. This can take a moment.');
    session=await ort.InferenceSession.create(model,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
    const canvas=new OffscreenCanvas(128,128),ctx=canvas.getContext('2d',{willReadFrequently:true})!;
    const encode=async(name:'reference'|'jpeg')=>{
      const features:number[][]=[];
      for(let i=1;i<=count;i++){
        progress(`Extracting Inception features: ${name==='reference'?'reference':'candidate'} image ${i} / ${count}.`);
        let rgba:Uint8ClampedArray;
        if(mode==='custom')rgba=pixels![name==='reference'?'reference':'candidate'][i-1];
        else{
          const blob=await(await get(`${name}-${i}.png`)).blob();
          const bitmap=await createImageBitmap(blob,{colorSpaceConversion:'none',premultiplyAlpha:'none'});
          ctx.drawImage(bitmap,0,0);bitmap.close();rgba=ctx.getImageData(0,0,128,128).data;
        }
        const data=new Float32Array(3*128*128);
        for(let p=0;p<128*128;p++)for(let channel=0;channel<3;channel++)data[channel*128*128+p]=rgba[p*4+channel]/255;
        const tensor=new ort.Tensor('float32',data,[1,3,128,128]);
        const output=await session!.run({images:tensor});
        if(output.features.data.length!==2048)throw new Error('Unexpected feature dimensions.');
        features.push(Array.from(output.features.data as Float32Array));
        tensor.dispose();for(const value of Object.values(output))value.dispose();
      }
      return features;
    };
    const reference=await encode('reference');
    // Exact same decoded pixels: reuse their actual extracted features.
    const candidate=mode==='reference'?reference:await encode('jpeg');
    progress('Calculating full empirical covariance distance.');
    const score=imageDistance(reference,candidate);
    self.postMessage({type:'result',score,mode,modelSha256:digest,seconds:(performance.now()-start)/1000,
      features:{reference,candidate}});
  }catch(error){self.postMessage({type:'error',text:error instanceof Error?error.message:String(error)});}
  finally{await session?.release();}
};
