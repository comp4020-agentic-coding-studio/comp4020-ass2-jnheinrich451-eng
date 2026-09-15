import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {imageDistance} from '../src/lib/image-fid';
const fixture=JSON.parse(readFileSync('public/image-lab/reference.json','utf8'));
describe('image lab full covariance calculation',()=>{
  it('returns zero for identical features and reordered copies',()=>{
    const a=[[1,2],[3,4],[5,1],[0,6]];
    expect(imageDistance(a,a).total).toBe(0);
    expect(imageDistance(a,[...a].reverse()).total).toBe(0);
  });
  it('matches the one-dimensional sample mean and standard deviation expression',()=>{
    // Mean 0 vs 2; unbiased sample SD sqrt(2) vs 2sqrt(2).
    const result=imageDistance([[-1],[1]],[[0],[4]]);
    expect(result.mean).toBeCloseTo(4,12);
    expect(result.covariance).toBeCloseTo(2,12);
    expect(result.total).toBeCloseTo(6,12);
  });
  it('retains correlation rather than comparing only marginal variances',()=>{
    const a=[[-1,-1],[1,1]],b=[[-1,1],[1,-1]];
    expect(imageDistance(a,b).mean).toBe(0);
    expect(imageDistance(a,b).covariance).toBeCloseTo(8,12);
  });
  it('supports unequal sample counts and symmetry',()=>{
    const a=[[1,2],[3,4],[5,1]],b=[[0,6],[3,2],[1,2],[7,0]];
    expect(imageDistance(a,b).total).toBeCloseTo(imageDistance(b,a).total,10);
  });
  it('agrees with independently calculated NumPy SVD reference features',()=>{
    for(const name of ['reference','jpeg']){
      const result=imageDistance(fixture.features.reference,fixture.features[name]);
      for(const term of ['mean','covariance','total'] as const)expect(result[term]).toBeCloseTo(fixture.scores[name][term],7);
    }
  });
  it('rejects invalid and undersized feature sets instead of inventing scores',()=>{
    for(const b of [[],[[1]],[[NaN],[2]],[[1,2],[3,4]],[[Infinity],[2]]])expect(()=>imageDistance([[1],[2]],b)).toThrow();
  });
  it('ships a scoped browser-only prototype with truthful method and controls',()=>{
    const html=readFileSync('dist/image-lab/index.html','utf8');
    expect(html).toContain('not eight independent dataset samples');
    expect(html).toContain('87 MB model');
    expect(html).toContain('Identity control / identical pixels');
    expect(html).toContain('full sample covariance');
    expect(html).toContain('data-stop');
    expect(html).toContain('data-export');
    expect(html).not.toContain('rel="preload" href="/image-lab/fid-inception');
  });
  it('places explicit multi-selection guidance and accessible feedback beside the chooser',()=>{
    const html=readFileSync('dist/image-lab/index.html','utf8');
    const upload=html.match(/<section[^>]*class="il-upload"[\s\S]*?<\/section>/)![0];
    expect(upload).toContain('Select 2–8 images together');
    expect(upload).toContain('Choose 2–8 local images');
    expect(upload).toContain('Ctrl-click');expect(upload).toContain('Command-click');
    expect(upload).toMatch(/data-upload-status[^>]*role="status"/);
    expect(upload).toContain('aria-describedby="il-upload-guide il-upload-feedback"');
    expect(upload.indexOf('data-upload-status')).toBeGreaterThan(upload.indexOf('data-upload '));
    expect(upload.indexOf('data-upload-status')).toBeLessThan(upload.indexOf('id="il-upload-limits"'));
  });
});
