import { describe,expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import {INITIAL,distance,setParameter,lockScore,curves,density} from '../figures/math-lab';
describe('maths lab invariants',()=>{
  it('separates location and spread and keeps the worked pair equal',()=>{
    expect(distance(INITIAL)).toEqual({location:2.25,spread:.25,total:2.5});
    expect(distance({mu:2,sigma:1})).toEqual({location:4,spread:0,total:4});
    expect(distance({mu:0,sigma:3})).toEqual({location:0,spread:4,total:4});
    expect(distance({mu:0,sigma:1}).total).toBe(0);
  });
  it('preserves D=4 across both controls and mean signs in locked mode',()=>{
    for(const side of [-1,1] as const)for(let i=0;i<=100;i++){
      const locked={...lockScore(INITIAL,true),side};
      for(const next of [setParameter(locked,'mu',-2+i/25),setParameter(locked,'sigma',1+i/50)]){
        expect(distance(next).total).toBeCloseTo(4,12);expect(next.sigma).toBeGreaterThanOrEqual(1);expect(next.sigma).toBeLessThanOrEqual(3);
      }
    }
  });
  it('rejects invalid numbers and constrains the UI domain',()=>{
    expect(()=>distance({mu:0,sigma:0})).toThrow();expect(()=>setParameter(INITIAL,'mu',NaN)).toThrow();
    expect(setParameter(INITIAL,'sigma',-2).sigma).toBe(.25);
    expect(setParameter(lockScore(INITIAL,true),'mu',99).mu).toBe(2);
  });
  it('generates finite density curves and integrates near one on a wide interval',()=>{
    expect(curves(INITIAL).paths.every(p=>!p.includes('NaN'))).toBe(true);
    let area=0;for(let x=-10;x<10;x+=.001)area+=density(x,{mu:0,sigma:1})*.001;
    expect(area).toBeCloseTo(1,6);
  });
  it('ships a static accessible explanation linked from the workspace',()=>{
    const html=readFileSync('dist/math-lab/index.html','utf8');
    expect(html).toContain('not image-based FID');expect(html).toContain('role="slider"');expect(html).toContain('standard deviation');
    expect(readFileSync('dist/workspace/index.html','utf8')).toContain('/math-lab/');
  });
});
