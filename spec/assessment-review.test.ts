import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';

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
