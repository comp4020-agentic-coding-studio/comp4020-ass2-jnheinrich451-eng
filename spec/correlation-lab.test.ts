import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {CORRELATION_INITIAL,parseCovariance,validateCovariance,withCorrelation,correlationMetrics,correlationFigure,contourPoints,type Covariance} from '../figures/correlation-lab';
describe('joint versus marginal Gaussian distance',()=>{
  it('shows a positive full distance despite matching marginals',()=>{
    const m=correlationMetrics(CORRELATION_INITIAL);
    expect(m.full).toBeCloseTo(4-2*(Math.sqrt(1.8)+Math.sqrt(.2)),12);
    expect(m.marginal).toEqual([0,0]);expect(m.eigenvalues[0]).toBeCloseTo(.2,12);expect(m.eigenvalues[1]).toBeCloseTo(1.8,12);
  });
  it('matches the diagonal formula and the identical reference exactly',()=>{
    expect(correlationMetrics([[1,0],[0,1]]).full).toBe(0);
    const m=correlationMetrics([[4,0],[0,.25]]);expect(m.full).toBe(1.25);expect(m.marginalTotal).toBe(1.25);
  });
  it('changes joint contours but keeps marginal paths identical when only correlation changes',()=>{
    const initial=correlationFigure(CORRELATION_INITIAL);
    for(const rho of [-.98,-.8,0,.5,.98]){
      const figure=correlationFigure(withCorrelation(CORRELATION_INITIAL,rho));
      expect(figure.marginalPaths).toEqual(initial.marginalPaths);
      expect(figure.jointPaths[1]).not.toEqual(initial.jointPaths[1]);
    }
  });
  it('preserves variances and sign symmetry against I across the supported domain',()=>{
    for(const a of [.05,1,4])for(const d of [.05,1,4])for(const rho of [0,.1,.5,.98]){
      const positive=withCorrelation([[a,0],[0,d]],rho),negative=withCorrelation(positive,-rho);
      expect(positive[0][0]).toBe(a);expect(positive[1][1]).toBe(d);
      const m=correlationMetrics(positive);expect(m.full).toBeGreaterThanOrEqual(0);
      expect(m.full).toBeCloseTo(correlationMetrics(negative).full,12);
      expect(m.full+1e-12).toBeGreaterThanOrEqual(m.marginalTotal);
      expect(m.eigenvalues[0]*m.eigenvalues[1]).toBeCloseTo(a*d-positive[0][1]**2,12);
    }
  });
  it('plots actual covariance contours rather than a decorative ellipse',()=>{
    const matrix:Covariance=[[2,-.7],[-.7,.5]],[[a,b],[,d]]=matrix,det=a*d-b*b;
    for(const radius of [1,2])for(const [x,y] of contourPoints(matrix,radius)){
      expect((d*x*x-2*b*x*y+a*y*y)/det).toBeCloseTo(radius**2,10);
    }
  });
  it('has finite paths throughout the numerical domain and keeps contours inside fixed axes',()=>{
    for(const a of [.05,4])for(const d of [.05,4])for(const rho of [-.98,.98]){
      const figure=correlationFigure(withCorrelation([[a,0],[0,d]],rho));
      expect([...figure.jointPaths.flat(),...figure.marginalPaths.flat()].every(p=>!p.includes('NaN')&&!p.includes('Infinity'))).toBe(true);
      expect(figure.joint.flat(2).every(([x,y])=>Math.abs(x)<=6&&Math.abs(y)<=6)).toBe(true);
    }
  });
  it.each(['null','[]','[[1, 0], [0]]','[[1, "0"], [0, 1]]','[[1, 0.2], [0.3, 1]]','[[1, 1], [1, 1]]','[[1, 2], [2, 1]]','[[0, 0], [0, 1]]','[[5, 0], [0, 1]]','[[1, 0.99], [0.99, 1]]','[[1/2, 0], [0, 1]]','[[1e309, 0], [0, 1]]'])(
    'rejects unsupported or invalid matrix %s',source=>expect(()=>parseCovariance(source)).toThrow());
  it('rejects nonfinite correlation and clones rather than mutates input',()=>{
    expect(()=>withCorrelation(CORRELATION_INITIAL,NaN)).toThrow();expect(()=>withCorrelation(CORRELATION_INITIAL,1)).toThrow();
    const matrix=validateCovariance(CORRELATION_INITIAL);matrix[0][0]=3;expect(CORRELATION_INITIAL[0][0]).toBe(1);
  });
  it('provides accessible static plots and course connections',()=>{
    const html=readFileSync('dist/math-lab/index.html','utf8');
    for(const text of ['id="correlation"','Candidate covariance','Mahalanobis','positive-definite','/sessions/02-frechet-distance/','/sessions/06-blind-spots/'])expect(html).toContain(text);
  });
});
