import {readFileSync} from 'node:fs';
import {describe, it, expect} from 'vitest';
import {teachingComics} from '../src/data/teaching-comics';
import artwork from '../src/data/comic-artwork.json';
import sharp from 'sharp';
import {selfChecks, unlockKey} from '../src/lib/self-check';
import {questionForCode, readCollection, saveCard, resetCollection} from '../src/lib/comic-collection';
const read = (path:string) => readFileSync(path,'utf8');
describe('optional teaching-comic collection', () => {
  it('has one core teaching dialogue per question, in teaching order', () => {
    expect(teachingComics.map(c => c.id)).toEqual(selfChecks.map(q => q.id));
    expect(new Set(teachingComics.map(c => c.title)).size).toBe(17);
    for (const comic of teachingComics) {
      expect(comic.panels).toHaveLength(3);
      expect(new Set(comic.panels.map(p => p.speaker)).size).toBe(2);
      for (const panel of comic.panels) {
        expect(['GPT','Claude']).toContain(panel.speaker);
        expect(panel.line.length).toBeGreaterThan(15);
        expect(panel.prop.length).toBeGreaterThan(5);
      }
    }
    expect(teachingComics.some(c => c.panels[0].speaker==='GPT')).toBe(true);
    expect(teachingComics.some(c => c.panels[0].speaker==='Claude')).toBe(true);
  });
  it('normalizes known codes without accepting near matches', () => {
    for (const q of selfChecks) expect(questionForCode(` ${q.code.toLowerCase()}\n`)?.id).toBe(q.id);
    for (const code of ['', 'B', 'L01', 'SLOP-L03', 'SLOP-S13', 'SLOP-L01-extra', '<script>', 'SLOP L01']) expect(questionForCode(code)).toBeUndefined();
  });
  it('shares only unlock flags with quizzes and ignores malformed values', () => {
    const data = new Map<string,string>([['at-theme','dark'],[unlockKey('S12'),'broken']]);
    const storage = {getItem:(k:string)=>data.get(k) ?? null, setItem:(k:string,v:string)=>{data.set(k,v);}};
    expect(readCollection(storage).size).toBe(0);
    saveCard(storage,'L01');saveCard(storage,'L01');saveCard(storage,'S06');
    expect([...readCollection(storage)]).toEqual(['L01','S06']);
    expect(data.get('at-theme')).toBe('dark');
    expect(data.get(unlockKey('L01'))).toBe('unlocked');
    expect(()=>saveCard(storage,'unknown')).toThrow();
    const blocked = {getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('blocked');}};
    expect(()=>readCollection(blocked)).toThrow();
    expect(()=>saveCard(blocked,'L01')).toThrow();
  });
  it('publishes one approved opaque artwork and lightweight preview per question', async () => {
    expect(artwork.map(c => c.id)).toEqual(selfChecks.map(q => q.id));
    expect(artwork.find(c => c.id === 'S01')!.source).toBe('session-01-bold-number-v2.png');
    expect(new Set(artwork.map(c => c.source)).size).toBe(17);
    for (const art of artwork) {
      expect(art.scene.length).toBeGreaterThan(60);
      for (const [suffix, width, budget] of [['preview',640,200000],['full',1024,650000]] as const) {
        const file = `public/comics/${art.id}-${suffix}.webp`;
        const bytes = readFileSync(file);
        expect(bytes.length).toBeLessThan(budget);
        const metadata = await sharp(bytes).metadata();
        expect(metadata.width).toBe(width);
        expect(metadata.height).toBe(width * 1.5);
        expect((await sharp(bytes).stats()).isOpaque).toBe(true);
        expect(readFileSync(`dist/comics/${art.id}-${suffix}.webp`).equals(bytes)).toBe(true);
      }
    }
  });
  it('resets only known comic unlock flags, preserving theme and workspace data', () => {
    const data=new Map<string,string>([['at-theme','light'],['slop8412:workspace:test','saved code'],['another-course:unlock','unlocked']]);
    selfChecks.forEach(q=>data.set(unlockKey(q.id),'unlocked'));
    resetCollection({removeItem:key=>{data.delete(key);}});
    expect([...data.entries()]).toEqual([['at-theme','light'],['slop8412:workspace:test','saved code'],['another-course:unlock','unlocked']]);
    expect(()=>resetCollection({removeItem:()=>{throw new Error('blocked');}})).toThrow('blocked');
  });
  it('renders artwork readers, transcripts, caveats and honest preview text', () => {
    const html = read('dist/memes/index.html');
    expect(html.match(/data-comic-id="/g)).toHaveLength(17);
    expect(html.match(/data-preview-src=/g)).toHaveLength(17);
    expect(html.match(/data-read-comic\b/g)).toHaveLength(17);
    expect(html.match(/data-comic-transcript\b/g)).toHaveLength(17);
    expect(html.match(/<dialog\b[^>]*data-comic-reader/g)).toHaveLength(1);
    expect(html).toContain('Read transcript');
    expect(html).toContain('AI-generated illustrations');
    expect(html).not.toContain('First edition: reused portraits');
    expect(html).not.toContain('class="comic-panels"');
    for (const art of artwork) {
      expect(html).toContain(`/comics/${art.id}-preview.webp`);
      expect(html).toContain(`/comics/${art.id}-full.webp`);
    }
    expect(teachingComics.every(c => !!c.note)).toBe(true);
    expect(html).toContain('scripted teaching conversations');
    expect(html).toContain('Preview does not add cards');
    expect(html).toMatch(/<summary\b[^>]*>Spoilers<\/summary>/);
    expect(html).not.toContain('teaching-team preview');
    for (const q of selfChecks) {
      expect(html).toContain(`${q.route}#self-check-${q.id}`);
      expect(read(`dist${q.route}index.html`)).toContain(`/memes/#comic-${q.id}`);
      expect(read(`dist${q.route}index.html`)).not.toContain('collection is not published yet');
    }
    expect(read('dist/self-checks/index.html')).toContain('/memes/');
    expect(teachingComics.find(c=>c.id==='S06')!.note).toContain('arbitrary subset does not guarantee zero');
    expect(teachingComics.find(c=>c.id==='L08')!.note).toContain('not a claim about actual FVD');
    expect(teachingComics.find(c=>c.id==='S09')!.note).toContain('need not be exactly four');
  });
});
