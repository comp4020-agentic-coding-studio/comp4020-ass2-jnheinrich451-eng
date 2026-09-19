import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {instrumentMeasurement,lensScore,reportRuns,verdictFor,type Lens,type Verdict} from '../src/lib/bench';
import {claimVerdict,reportOutcome,reportSentence,verdictSummary} from '../src/lib/bench-report';
const params={n:100,d:16,rho:0.9,shift:1,seed:51};
const lenses:Lens[]=['frame','temporal','joint'];
describe('lecture gadget evidence contracts',()=>{
  it('scores exactly the recordings exposed to the plot',()=>{
    const result=instrumentMeasurement(params);
    for(const candidate of ['plain','shift','shuffle'] as const){
      expect(result.candidates[candidate]).toHaveLength(params.n);
      for(const lens of lenses)expect(result.table[candidate][lens]).toBe(lensScore(lens,result.reference,result.candidates[candidate]));
    }
    const replay=instrumentMeasurement(params);
    expect(replay).toEqual(result);
    expect(instrumentMeasurement({...params,seed:52}).candidates.shuffle.slice(0,5)).not.toEqual(result.candidates.shuffle.slice(0,5));
  });
  it('uses the same two-baseline verdict in the grid and each report repeat',()=>{
    const results=reportRuns(params,3);
    for(let i=0;i<3;i++){
      const measured=instrumentMeasurement({...params,seed:(params.seed+104729*(i+1))>>>0});
      for(const lens of lenses){
        expect(measured.floors[lens]).toHaveLength(2);
        expect(measured.verdicts[lens]).toBe(verdictFor(lens,measured.table,measured.floors[lens]));
        expect(results.verdicts[lens][i]).toBe(measured.verdicts[lens]);
      }
    }
    expect(reportRuns(params,3)).toEqual(results);
  });
  it.each([
    ['support',['shift','shift','neither']],
    ['contradiction',['shuffle','shuffle','neither']],
    ['tie',['shift','shuffle','neither']],
    ['none',['neither','neither','neither']],
  ])('retains the full protocol for %s, including mixed outcomes',(_name,calls)=>{
    const verdicts={frame:calls,temporal:['neither','shuffle','shift'],joint:calls} as Record<Lens,Verdict[]>;
    const text=reportSentence(params,'joint','shift',verdicts);
    for(const value of ['N = 100','d = 16','rho = 0.9','E shift = 1','base seed = 51','3 repeats','Demonstration heuristic v1','two independent','do not establish certainty'])expect(text).toContain(value);
    expect(text).toContain('F in 1/3; no ordering under the heuristic in 1/3');
    expect(text).toContain(reportOutcome('shift',calls as Verdict[]));
  });
  it('names the instrument and the disagreement in the summary, so nothing needs decoding',()=>{
    // The page once said only "More repeats contradicted the claim than
    // supported it", with no instrument named and no word that another
    // instrument read the same recordings the other way.
    const E=Array(12).fill('shift') as Verdict[], F=Array(12).fill('shuffle') as Verdict[], none=Array(12).fill('neither') as Verdict[];
    const correlated={frame:E,temporal:F,joint:E};
    const claimE=claimVerdict('shift','joint',correlated);
    expect(claimE).toContain('You claimed E scores higher. Under whole-sequence scoring, 12 of 12 repeats agreed');
    expect(claimE).toContain('supports your claim');
    expect(claimE).toContain('Frame-to-frame differences scored F higher in 12 of 12.');
    expect(claimE).toContain('holds under some instruments and not others');
    const claimF=claimVerdict('shuffle','joint',correlated);
    expect(claimF).toContain('You claimed F scores higher. Under whole-sequence scoring, 0 of 12 repeats agreed; 12 scored E higher');
    expect(claimF).toContain('holds under some instruments and not others');
    expect(claimF).toContain('contradicts your claim');
    const independent=claimVerdict('shift','joint',{frame:E,temporal:none,joint:E});
    expect(independent).toContain('Frame-to-frame differences gave no ordering in 12 of 12.');
    // A claim that no instrument backs must never be told it holds somewhere.
    expect(claimVerdict('shuffle','joint',{frame:E,temporal:none,joint:E})).toContain('No instrument supports the claim');
    expect(claimVerdict('shift','joint',{frame:E,temporal:E,joint:E})).toContain('All three instruments support the claim');
  });
  it('does not suppress mixed outcomes when the first repeat gives no ordering',()=>{
    expect(verdictSummary('temporal',['neither','shift','shuffle'])).toContain('E ranked higher in 1/3 runs; F in 1/3');
  });
  it('separates the readable summary from reproducibility details and typesets the method',()=>{
    const html=readFileSync('dist/lectures/week-11/index.html','utf8');
    for(const label of ['Experiment summary','Reproduce this experiment','Recorded protocol and numerical method','Additional sample-size checks','not an AI-written report'])expect(html).toContain(label);
    expect(html).toContain('data-rp-outcome');
    expect(html).toContain('data-rp-protocol');
    expect(html).toContain('data-rp-counter');
    expect(html).toContain('<math');
    expect(html).toMatch(/<msub\b/);
    expect(html).toMatch(/<msup\b/);
    expect(html).toContain('not a calibrated statistical test');
  });
  it('qualifies the lecture claims and declares the heuristic',()=>{
    const week5=readFileSync('src/content/lectures/week-05.md','utf8');
    const week11=readFileSync('src/content/lectures/week-11.md','utf8');
    expect(week5).toContain('higher-order bias');
    expect(week5).not.toContain('extrapolation removes the direction');
    expect(week11).toContain('do not prove zero sampling uncertainty');
    expect(week11).not.toContain('Every protocol here');
  });
});
