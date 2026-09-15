import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {validateFiles,imageDimensions,cropRect,DEFAULT_EDITS,filterPixels} from '../src/lib/image-input';
import {imageDistance,pairedFeatureDistance,shuffledOrder} from '../src/lib/image-fid';
const file={size:100,type:'image/png'};
describe('local image controls',()=>{
  it('bounds counts, compressed bytes and supported formats',()=>{
    expect(()=>validateFiles([file,file])).not.toThrow();
    for(const files of [[file],Array(9).fill(file),[{...file,size:5_000_001},file],[{...file,type:'image/svg+xml'},file],[{...file,size:0},file],Array(5).fill({...file,size:5_000_000})])expect(()=>validateFiles(files)).toThrow();
  });
  it('checks real headers before allocating decoded pixels',()=>{
    expect(imageDimensions(readFileSync('public/image-lab/reference-1.png'))).toEqual({width:128,height:128});
    const header=new Uint8Array(readFileSync('public/image-lab/reference-1.png'));new DataView(header.buffer).setUint32(16,100000);
    expect(()=>imageDimensions(header)).toThrow('4096');
    expect(()=>imageDimensions(new Uint8Array([1,2,3]))).toThrow();
    const jpeg=new Uint8Array([255,216,255,192,0,11,8,0,100,0,200,1,1,0,0,255,217]);
    expect(imageDimensions(jpeg)).toEqual({width:200,height:100});
  });
  it('keeps crop bounds within the source',()=>{
    expect(cropRect(400,200,DEFAULT_EDITS)).toEqual({x:100,y:0,size:200});
    expect(cropRect(400,200,{...DEFAULT_EDITS,zoom:2,x:100,y:100})).toEqual({x:300,y:100,size:100});
    expect(()=>cropRect(200,200,{...DEFAULT_EDITS,zoom:0})).toThrow();
  });
  it('rejects animated PNG before decoding',()=>{
    const png=new Uint8Array(readFileSync('public/image-lab/reference-1.png'));
    const animated=new Uint8Array(png.length+12);animated.set(png.subarray(0,33));animated.set(png.subarray(33),45);
    new DataView(animated.buffer).setUint32(37,0x6163544c);
    expect(()=>imageDimensions(animated)).toThrow('Animated PNG');
  });
  it('applies numeric filters to pixels without mutating the reference',()=>{
    const input=new Uint8ClampedArray([200,100,0,255,0,100,200,255]);
    expect([...filterPixels(input,2,1,'none')]).toEqual([...input]);
    // Uint8ClampedArray uses ties-to-even (118.5 becomes 118).
    expect([...filterPixels(input,2,1,'grayscale')]).toEqual([118,118,118,255,82,82,82,255]);
    expect(filterPixels(input,2,1,'brighten')[0]).toBe(255);
    expect(filterPixels(input,2,1,'darken')[0]).toBe(140);
    expect(filterPixels(input,2,1,'blur')[0]).toBe(120);
    expect(input[0]).toBe(200);
  });
  it('separates pairing sensitivity from FID invariance',()=>{
    const a=[[0,0],[2,0],[0,2]],order=[2,0,1];
    expect(pairedFeatureDistance(a,a,[0,1,2])).toBe(0);
    expect(pairedFeatureDistance(a,a,order)).toBeCloseTo(16/3);
    expect(imageDistance(a,order.map(i=>a[i])).total).toBe(0);
    expect(()=>pairedFeatureDistance(a,a,[0,0,2])).toThrow();
  });
  it('shuffles without duplicating or losing images, including identity draws',()=>{
    const a=[0,1,2,3],b=shuffledOrder(a,()=>.9999);
    expect(b).not.toEqual(a);expect([...b].sort()).toEqual(a);expect(a).toEqual([0,1,2,3]);
  });
});
