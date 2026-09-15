import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/decks/week-02.deck.mdx', 'utf8');
const html = readFileSync('dist/decks/week-02/index.html', 'utf8');

describe('Week 2 approved paper layout', () => {
  it('frames all seventeen slides, with a title, content sequence and ending', () => {
    expect([...source.matchAll(/<PaperSlide\b/g)]).toHaveLength(17);
    expect([...source.matchAll(/index=\{(\d+)\}/g)].map(m => Number(m[1]))).toEqual(Array.from({length:17},(_,i)=>i+1));
    expect(source).toContain('variant="opening"');
    expect(source).toContain('variant="ending"');
    expect([...source.matchAll(/variant="teaching"/g)]).toHaveLength(15);
  });
  it('retains the equation sequence and progressive derivation while formulas await review', () => {
    expect([...source.matchAll(/<Eq name="([^"]+)"/g)].map(m=>m[1])).toEqual(["fid","fid-location","fid-shape","marginals","w2-def","coupling-object","gaussian-params","oneD-setup","oneD-coupling","oneD-diff","oneD-result","term-location","term-spread","dD-setup","row-setup","row-1","row-2","row-3","row-4","max-trace","w2-gaussian","sanity-1d","bench-a","bench-b"]);
    expect([...source.matchAll(/class="fragment(?: [^"]*)?"/g)]).toHaveLength(9);
    expect([...source.matchAll(/```notes/g)]).toHaveLength(17);
  });
  it('publishes unique navigation landmarks and real next-slide targets', () => {
    for(let i=1;i<=17;i++) expect(html).toContain(`aria-label="Slide ${i} navigation"`);
    for(let i=2;i<=17;i++) expect(html).toContain(`href="#/${i}"`);
    expect(html).not.toContain('Design preview');
    expect(html).toContain('data-deck-exit');
  });
});
