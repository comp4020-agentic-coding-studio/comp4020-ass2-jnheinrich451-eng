import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const read=(path:string)=>readFileSync(path,'utf8').replace(/\s+/g,' ');
describe('teaching precision and lab handoffs',()=>{
  it('separates the population mixture zero from the exact-copy empirical zero',()=>{
    const text=read('src/content/sessions/06-blind-spots.md');
    expect(text).toContain('X<sub>G</sub> = X<sub>R</sub>');
    expect(text).toContain('μ̂<sub>G</sub> = μ̂<sub>R</sub>');
    expect(text).toContain('Σ̂<sub>G</sub> = Σ̂<sub>R</sub>');
    expect(text).toContain('empirical FID is zero in exact arithmetic');
    expect(text).toContain('An arbitrary subsample does not guarantee these equalities');
    expect(text).toContain('nor does copying a training set guarantee zero against a separate evaluation set');
    expect(text).toContain('independently drawn finite samples need not score zero');
    expect(text).not.toContain('It carries R\'s mean and R\'s covariance because it was drawn from R');
    expect(text).not.toContain('the estimator is faultless');
    expect(text).toContain('about 4.1 component standard deviations');
    const offset=.9,withinVariance=1-offset**2;
    expect(withinVariance+offset**2).toBe(1);
    expect(2*offset/Math.sqrt(withinVariance)).toBeCloseTo(4.1,1);
  });
  it('shows why copying the reference differs from taking a subsample',()=>{
    const moments=(xs:number[])=>{
      const mean=xs.reduce((a,b)=>a+b,0)/xs.length;
      const variance=xs.reduce((sum,x)=>sum+(x-mean)**2,0)/(xs.length-1);
      return {mean,variance};
    };
    const score=(r:ReturnType<typeof moments>,g:ReturnType<typeof moments>)=>
      (r.mean-g.mean)**2+(Math.sqrt(r.variance)-Math.sqrt(g.variance))**2;
    const reference=[-1,0,1];
    const copied=moments([...reference]),subset=moments([0,1]);
    expect(copied).toEqual(moments(reference));
    expect(score(moments(reference),copied)).toBe(0);
    expect(subset.mean).toBe(.5);
    expect(score(moments(reference),subset)).toBeGreaterThan(0);
  });
  it('distinguishes squared transport cost from the distance itself',()=>{
    const text=read('src/content/sessions/02-frechet-distance.md');
    expect(text).toContain('squared Wasserstein-2 distance');
    expect(text).toContain('W₂ is the square root');
    expect(text).toContain('an optimal coupling can be chosen jointly Gaussian');
    expect(text).not.toContain('Without that restriction there is no closed form at all');
    expect(text).not.toContain('it will return something above both');
  });
  it('treats bias as an expectation, not a bound on every measured score',()=>{
    const text=read('src/content/sessions/05-the-bias.md');
    expect(text).toContain('in expectation');
    expect(text).toContain('An individual estimate can fall below');
    expect(text).not.toContain('Every FID you have ever read is too high');
    expect(text).not.toContain('The second number is lower.');
    expect(text).toContain('higher-order');
  });
  it('sends students from the lecture and sessions to a task with a retained result',()=>{
    for(const path of ['src/content/lectures/week-02.md','src/content/sessions/02-frechet-distance.md']){
      const text=read(path);expect(text).toContain('](/math-lab/#correlation)');expect(text).toMatch(/record/i);
    }
    const week5=read('src/content/sessions/05-the-bias.md');
    expect(week5).toContain('](/workspace/)');expect(week5).toContain('not the 2,048-dimensional bench');
    expect(week5).toContain('](/assessments/measurement-log/)');
  });
  it('has a finite-sample counterexample to the claim that every estimated FID exceeds its population value',()=>{
    // R uniform on {-1,1}; G uniform on {-1,1,3}. Both can produce the
    // finite sample [-1,1] with positive probability. Their empirical means
    // and covariances then coincide, although their population moments differ.
    const moments=(xs:number[])=>{const mean=xs.reduce((a,b)=>a+b,0)/xs.length;return {mean,sd:Math.sqrt(xs.reduce((sum,x)=>sum+(x-mean)**2,0)/xs.length)};};
    const squared=(r:ReturnType<typeof moments>,g:ReturnType<typeof moments>)=>(r.mean-g.mean)**2+(r.sd-g.sd)**2;
    const population=squared(moments([-1,1]),moments([-1,1,3]));
    const estimated=squared(moments([-1,1]),moments([-1,1]));
    expect(population).toBeGreaterThan(1);expect(estimated).toBe(0);
  });
});
