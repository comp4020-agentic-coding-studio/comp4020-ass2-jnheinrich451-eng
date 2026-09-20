import {readFileSync, existsSync} from 'node:fs';
import {describe, it, expect} from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');
describe('fictional teaching profiles', () => {
  for (const slug of ['helen-sandoval', 'tomasz-wierzba']) {
    it(`${slug} has a substantive, clearly fictional profile and reachable course links`, () => {
      const source = read(`src/content/people/${slug}.md`);
      const body = source.split('---').slice(2).join('---');
      const html = read(`dist/people/${slug}/index.html`);
      expect(body.split(/\s+/).length).toBeGreaterThan(200);
      expect(body.match(/^## /gm)).toHaveLength(3);
      expect(body).toContain('Measurement Reliability Group');
      expect(html).toContain('Fictional teaching staff for the Slop University course prototype.');
      expect(html).toContain('contact details are illustrative');
      expect(source).toContain(`photo: ./${slug}.avif`);
      const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
      expect(canonical).toBeDefined();
      const prefix = new URL(canonical!).pathname.slice(0, -`people/${slug}/`.length);
      for (const match of body.matchAll(/\]\((\/[^)]+)\)/g)) {
        expect(existsSync(`dist${match[1]}index.html`)).toBe(true);
        expect(html).toContain(`href="${prefix}${match[1].slice(1)}"`);
      }
    });
  }
  it('distinguishes supervision interests from recruitment and retains the doctoral role', () => {
    expect(read('dist/people/helen-sandoval/index.html')).toContain('not an advertised PhD opening');
    expect(read('dist/people/tomasz-wierzba/index.html')).toContain('PhD candidate');
    expect(read('dist/people/index.html')).toContain('Fictional teaching staff');
  });
});
