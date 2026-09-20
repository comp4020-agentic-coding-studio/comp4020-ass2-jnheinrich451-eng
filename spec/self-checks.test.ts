import {readFileSync, readdirSync} from 'node:fs';
import {describe, it, expect} from 'vitest';
import {selfChecks, selfCheckFor, checkAnswer, unlockKey} from '../src/lib/self-check';

const read = (path: string) => readFileSync(path, 'utf8');
describe('optional self-checks', () => {
  it('covers exactly the five lectures and twelve sessions, never assessments', () => {
    const routes = ['lectures', 'sessions'].flatMap(collection => readdirSync(`src/content/${collection}`).filter(f => f.endsWith('.md')).map(f => `/${collection}/${f.slice(0,-3)}/`));
    expect(selfChecks.map(q => q.route).sort()).toEqual(routes.sort());
    expect(selfChecks.filter(q => q.id.startsWith('L'))).toHaveLength(5);
    expect(selfChecks.filter(q => q.id.startsWith('S'))).toHaveLength(12);
    expect(new Set(selfChecks.map(q => q.id)).size).toBe(17);
    expect(new Set(selfChecks.map(q => q.code)).size).toBe(17);
    expect(new Set(selfChecks.map(q => unlockKey(q.id))).size).toBe(17);
    expect(selfChecks.filter(q => q.kind === 'number')).toHaveLength(2);
    for (const file of readdirSync('src/content/assessments').filter(f => f.endsWith('.md'))) {
      const route = `/assessments/${file.slice(0,-3)}/`;
      expect(selfCheckFor(route)).toBeUndefined();
      expect(read(`dist${route}index.html`)).not.toContain('data-self-check=');
    }
  });
  for (const q of selfChecks) {
    it(`${q.id} has complete feedback and is mounted with a reachable preview`, () => {
      expect(q.question.length).toBeGreaterThan(50);
      expect(q.explanation.length).toBeGreaterThanOrEqual(3);
      expect(q.explanation[0]).toContain(`Correct: ${q.answer}.`);
      expect(q.title).not.toMatch(/^—/);
      expect(checkAnswer(q, String(q.answer)).state).toBe('correct');
      expect(checkAnswer(q, '').state).toBe('empty');
      if (q.kind === 'choice') {
        expect(q.options.map(o => o.value)).toEqual(['A','B','C']);
        for (const option of q.options.filter(o => o.value !== q.answer)) {
          expect(q.feedback[option.value]!.length).toBeGreaterThan(20);
          expect(checkAnswer(q, option.value).state).toBe('incorrect');
        }
        expect(checkAnswer(q, 'D').state).toBe('invalid');
      }
      const html = read(`dist${q.route}index.html`);
      expect(html.match(new RegExp(`data-self-check="${q.id}"`, 'g'))).toHaveLength(1);
      expect(html).toContain('Optional self-check');
      expect(html).toContain('Not assessed');
      expect(html).toContain('type="application/json"');
      expect(html).not.toMatch(/type="radio"[^>]* checked/);
      const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
      const base = new URL(canonical!).pathname.slice(0, -q.route.slice(1).length);
      expect(html).toContain(`href="${base}self-checks/#self-check-${q.id}"`);
    });
  }
  it('parses whole finite numbers safely and respects inclusive numerical tolerance', () => {
    for (const q of selfChecks.filter(q => q.kind === 'number')) {
      for (const input of [String(q.answer), `${q.answer}.0`, `${q.answer}e0`, ` ${q.answer} `, String(q.answer + .001), String(q.answer - .001)]) {
        expect(checkAnswer(q,input).state).toBe('correct');
      }
      for (const input of ['NaN','Infinity','-Infinity','0x5','5 apples','5+0','1e999','1,000','alert(1)']) expect(checkAnswer(q,input).state).toBe('invalid');
      expect(checkAnswer(q,'   ').state).toBe('empty');
      expect(checkAnswer(q,'0').state).toBe('incorrect');
      expect(checkAnswer(q,String(q.answer+.0011)).state).toBe('incorrect');
    }
    const math = selfChecks.find(q => q.id === 'L02')!;
    expect(math.answer).toBe((0-2)**2+(1-2)**2);
    expect(checkAnswer(math, '13').message).toContain('standard deviations');
    expect(selfChecks.find(q => q.id === 'S09')!.answer).toBe((.5/.25)**2);
  });
  it('preview has all explanations without interactive unlock or storage controls', () => {
    const html = read('dist/self-checks/index.html');
    expect(html.match(/class="sc-explanation"/g)).toHaveLength(17);
    expect(html).not.toContain('data-self-check=');
    expect(html).not.toMatch(/<[^>]+\sdata-sc-unlock(?:\s|>)/);
    expect(html).not.toMatch(/<[^>]+\sdata-sc-review(?:\s|>)/);
    expect(html).toContain('Expand all answers');
    expect(html).toContain('Full quiz list');
    expect(html).not.toContain('Teaching-team preview');
    for(const q of selfChecks){
      const page=read(`dist${q.route}index.html`);
      expect(page).toContain('Full quiz list');
      expect(page).not.toContain('Teaching-team preview');
    }
    for (const q of selfChecks) expect(html).toContain(`id="self-check-${q.id}"`);
  });
});
