import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {instrumentMeasurement,lensScore,reportRuns,verdictFor,type Lens,type Verdict} from '../src/lib/bench';
import {reportOutcome,reportSentence,verdictSummary} from '../src/lib/bench-report';
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
