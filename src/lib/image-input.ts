export const IMAGE_LIMITS={count:8,fileBytes:5_000_000,totalBytes:20_000_000,pixels:16_000_000,totalPixels:32_000_000,edge:4096};
export interface Edits {zoom:number;x:number;y:number;filter:'none'|'grayscale'|'blur'|'brighten'|'darken'}
export const DEFAULT_EDITS:Edits={zoom:1,x:50,y:50,filter:'none'};
export function validateFiles(files:{size:number;type:string}[]){
  if(files.length<2||files.length>IMAGE_LIMITS.count)throw new Error('Choose 2–8 images. FID needs at least two images per set.');
  if(files.some(f=>!['image/jpeg','image/png'].includes(f.type)))throw new Error('Only JPEG and PNG files are supported. SVG, GIF and WebP are not accepted.');
  if(files.some(f=>f.size<=0||f.size>IMAGE_LIMITS.fileBytes))throw new Error('Each image must be nonempty and at most 5 MB.');
  if(files.reduce((sum,f)=>sum+f.size,0)>IMAGE_LIMITS.totalBytes)throw new Error('Choose at most 20 MB of images in total.');
}
/** Read dimensions before decoding to reject oversized/decompression-heavy inputs. */
export function imageDimensions(bytes:Uint8Array):{width:number;height:number} {
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let width=0,height=0;
  if(bytes.length>=24&&v.getUint32(0)===0x89504e47&&v.getUint32(4)===0x0d0a1a0a&&v.getUint32(12)===0x49484452){
    width=v.getUint32(16);height=v.getUint32(20);
    for(let p=8;p+12<=bytes.length;){
      const length=v.getUint32(p),kind=v.getUint32(p+4);
      if(kind===0x6163544c)throw new Error('Animated PNG is not supported. Choose a static image.');
      if(length>bytes.length-p-12)break;p+=length+12;
    }
  }
  else if(bytes[0]===255&&bytes[1]===216){
    let p=2;
    while(p+3<bytes.length){
      if(bytes[p++]!==255)break;while(bytes[p]===255)p++;
      const marker=bytes[p++];if(marker===0xd9||marker===0xda)break;
      if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
      if(p+2>bytes.length)break;const length=v.getUint16(p);
      if(length<2||p+length>bytes.length)break;
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&length>=8){height=v.getUint16(p+3);width=v.getUint16(p+5);break;}
      p+=length;
    }
  }
  if(!width||!height)throw new Error('Could not read a valid JPEG/PNG image header.');
  if(width>IMAGE_LIMITS.edge||height>IMAGE_LIMITS.edge||width*height>IMAGE_LIMITS.pixels)throw new Error('Each image must be at most 4096 pixels per side and 16 megapixels.');
  return {width,height};
}
export function cropRect(width:number,height:number,edits:Edits){
  if(![width,height,edits.zoom,edits.x,edits.y].every(Number.isFinite)||width<=0||height<=0||edits.zoom<1||edits.zoom>3||edits.x<0||edits.x>100||edits.y<0||edits.y>100)throw new Error('Invalid crop settings.');
  const size=Math.min(width,height)/edits.zoom;
  return {x:(width-size)*edits.x/100,y:(height-size)*edits.y/100,size};
}
/** Filters alter the actual 128x128 inference pixels, not just a CSS preview. */
export function filterPixels(input:Uint8ClampedArray,width:number,height:number,filter:Edits['filter']){
  const out=new Uint8ClampedArray(input);
  if(filter==='none')return out;
  if(filter==='blur'){
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)for(let c=0;c<3;c++){
      let total=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)total+=input[(Math.max(0,Math.min(height-1,y+dy))*width+Math.max(0,Math.min(width-1,x+dx)))*4+c];
      out[(y*width+x)*4+c]=total/25;
    }
  }else for(let p=0;p<input.length;p+=4){
    if(filter==='grayscale'){const gray=.299*input[p]+.587*input[p+1]+.114*input[p+2];out[p]=out[p+1]=out[p+2]=gray;}
    else for(let c=0;c<3;c++)out[p+c]=input[p+c]*(filter==='brighten'?1.3:.7);
  }
  return out;
}
