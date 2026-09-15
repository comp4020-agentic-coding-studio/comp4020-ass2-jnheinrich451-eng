// Browser-only figure generation for local uploads; never saves or uploads files.
import {cropRect,filterPixels,type Edits} from '../src/lib/image-input';
export function prepareImage(source:HTMLCanvasElement,edits:Edits){
  const {x,y,size}=cropRect(source.width,source.height,edits);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
  ctx.fillStyle='#fff';ctx.fillRect(0,0,128,128);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(source,x,y,size,size,0,0,128,128);
  const pixels=filterPixels(ctx.getImageData(0,0,128,128).data,128,128,edits.filter);
  ctx.putImageData(new ImageData(pixels,128,128),0,0);
  return {pixels,preview:canvas.toDataURL('image/png'),crop:{x,y,size}};
}
