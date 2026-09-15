import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {calculateGrades,gradeBand,type GradeRow} from '../src/lib/grades';
const {nodes}=JSON.parse(readFileSync('dist/api/index.json','utf8'));
const assessments=nodes.filter((n:{type:string})=>n.type==='assessments');
const rows:GradeRow[]=assessments.flatMap((a:any)=>a.meta.marking.criteria.map((c:any,i:number)=>({id:`${a.id}:${i}`,assessment:a.id,criterion:c.name,weight:a.meta.weight,maximum:c.weight})));
describe('grade planning arithmetic',()=>{
  it('derives eleven criteria from the four published rubrics',()=>{
    expect(rows).toHaveLength(11);
    expect(assessments.map((a:any)=>a.meta.weight).sort((a:number,b:number)=>a-b)).toEqual([10,20,25,45]);
  });
  it('distinguishes no marks, unknown criteria and a marked zero',()=>{
    const blank=calculateGrades(rows,{});expect(blank.ok).toBe(true);if(!blank.ok)return;
    expect(blank.earned).toBe(0);expect(blank.remaining).toBe(100);expect(blank.average).toBeNull();
    expect(blank.targets.map(t=>t.requiredAverage)).toEqual([50,60,70,80]);
    const zero=calculateGrades(rows,{[rows[0].id]:'0'});if(!zero.ok)throw Error('invalid');
    expect(zero.covered).toBe(rows[0].weight*rows[0].maximum/100);expect(zero.average).toBe(0);
  });
  it('weights raw criterion marks, not the mean of assessment percentages',()=>{
    const r=calculateGrades([{id:'a',assessment:'a',criterion:'part',weight:20,maximum:30}],{a:'24'});if(!r.ok)throw Error('invalid');
    expect(r.earned).toBeCloseTo(4.8);expect(r.covered).toBe(6);expect(r.average).toBeCloseTo(80);expect(r.remaining).toBe(94);
    expect(r.targets[3].needed).toBeCloseTo(75.2);expect(r.targets[3].requiredAverage).toBeCloseTo(80);
  });
  it('handles full completion and unreachable targets without dividing by zero',()=>{
    for(const fraction of [0,.5,.6,.7,.8,1]){
      const result=calculateGrades(rows,Object.fromEntries(rows.map(r=>[r.id,String(r.maximum*fraction)])));if(!result.ok)throw Error('invalid');
      expect(result.earned).toBeCloseTo(100*fraction);expect(result.covered).toBeCloseTo(100);expect(result.remaining).toBeCloseTo(0);
      expect(result.targets[3].reachable).toBe(fraction>=.8);
      if(fraction<.8)expect(result.targets[3].requiredAverage).toBeNull();
    }
  });
  it('does not round a score into the next band',()=>{
    expect([49.999,50,59.999,60,69.999,70,79.999,80,100].map(gradeBand)).toEqual(['N','P','P','CR','CR','D','D','HD','HD']);
    const result=calculateGrades([{id:'a',assessment:'a',criterion:'all',weight:100,maximum:100}],{a:'79.9999999995'});
    if(!result.ok)throw Error('invalid');
    expect(result.targets[3].reachable).toBe(false);
    expect(result.targets[3].requiredAverage).toBeNull();
  });
  it('invalidates totals when any input is invalid',()=>{
    for(const value of ['-1','Infinity','NaN','invalid',String(rows[0].maximum+1)]){
      const result=calculateGrades(rows,{[rows[0].id]:value});expect(result.ok).toBe(false);expect(result).not.toHaveProperty('earned');
    }
  });
  it('ships policy guidance, planner scope, eleven labelled cells and a discovery link',()=>{
    const html=readFileSync('dist/policies/index.html','utf8');
    expect((html.match(/data-grade=/g)??[]).length).toBe(11);
    for(const text of ['grace period','12 hours','Late submissions are not accepted','must be disclosed','Blank means unknown','not an official','Getting help','A request','does not itself grant an extension'])expect(html).toContain(text);
    expect(readFileSync('dist/assessments/index.html','utf8')).toContain('/policies/#grade-calculator');
  });
  it('states the grading thresholds inside the Slop University setting',()=>{
    const html=readFileSync('dist/policies/index.html','utf8').replace(/\s+/g,' ');
    expect(html).toContain('P (Pass) at 50, CR (Credit) at 60, D (Distinction) at 70 and HD (High distinction) at 80');
    expect(html).toContain('not an official Slop University result');
    expect(html).not.toContain('ANU');
    expect(html).not.toContain('anu.edu.au');
    expect(html).not.toContain('fictional Slop University course prototype');
  });
});
