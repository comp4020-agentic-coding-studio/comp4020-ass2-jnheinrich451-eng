import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';

it('assesses prediction versus observation without requiring a surprising result', () => {
  const {nodes}=JSON.parse(readFileSync('dist/api/index.json','utf8'));
  const log=nodes.find((node:{id:string})=>node.id==='assessments/measurement-log');
  expect(log.spec).toContain('at least one entry compares a prediction recorded before measuring with the observed result and explains the agreement or discrepancy');
  expect(log.meta.marking.criteria[1].name).toBe('Predictions checked against measurements');
  expect(log.meta.marking.criteria.map((criterion:{weight:number})=>criterion.weight)).toEqual([50,50]);
  expect(log.meta.weight).toBe(10);
  const html=readFileSync('dist/assessments/measurement-log/index.html','utf8').replace(/\s+/g,' ');
  expect(html).toContain('Expected and unexpected results are equally eligible.');
  expect(html).toContain('what you predicted before measuring and why');
  expect(html).not.toContain('at least one entry records a result you did not expect');
  expect(html).not.toContain('If none did, say so');
});

it('places the ongoing measurement log before the deadline-ordered assignments', () => {
  const html = readFileSync('dist/assessments/index.html','utf8');
  const slugs = ['measurement-log','a1-reproduce-the-number','a2-break-the-number','final-report'];
  const positions = slugs.map(slug=>html.indexOf(`/assessments/${slug}/`));
  expect(positions.every(position=>position>=0)).toBe(true);
  expect(positions).toEqual([...positions].sort((a,b)=>a-b));
  expect(html).toContain('Starts week 1');
});

it('surfaces the submission format and original spec on every assessment', () => {
  for (const file of readdirSync('src/content/assessments').filter(f=>f.endsWith('.md'))) {
    const slug = file.replace(/\.md$/,'');
    const html = readFileSync(`dist/assessments/${slug}/index.html`,'utf8');
    expect(html,slug).toContain('What to submit');
    expect(html,slug).toContain('Submit one ');
    expect(html,slug).toContain('id="assessment-spec"');
    expect(html,slug).toContain('id="how-marked"');
    expect((html.match(/type="checkbox"/g)??[]).length,slug).toBe(3);
    expect(html,slug).toContain('not a grade or confirmation');
  }
});
