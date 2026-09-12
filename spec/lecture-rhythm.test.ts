import {readFileSync,existsSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

interface Node {id:string;type:string;meta:Record<string,unknown>;body?:string}
const {nodes}=JSON.parse(readFileSync('dist/api/index.json','utf8')) as {nodes:Node[]};
const lectures=nodes.filter(n=>n.type==='lectures');
describe('4+1 lecture rhythm',()=>{
  it('separates the live introduction from four spaced formal lectures',()=>{
    expect(lectures).toHaveLength(5);
    expect(lectures.filter(n=>n.meta.lecture_format==='demo').map(n=>n.meta.week)).toEqual([1]);
    expect(lectures.filter(n=>n.meta.lecture_format==='formal').map(n=>Number(n.meta.week)).sort((a,b)=>a-b)).toEqual([2,5,8,11]);
  });
  it('keeps lectures on the existing session dates and retains twelve sessions',()=>{
    const sessions=nodes.filter(n=>n.type==='sessions');expect(sessions).toHaveLength(12);
    for(const lecture of lectures){
      const session=sessions.find(n=>n.meta.week===lecture.meta.week);
      expect(String(lecture.meta.date).slice(0,10)).toBe(String(session?.meta.date).slice(0,10));
    }
  });
  it('marks unfinished lectures honestly and links only existing decks',()=>{
    for(const lecture of lectures){
      expect(['ready','outline']).toContain(lecture.meta.lecture_stage);
      if(lecture.meta.lecture_stage==='outline')expect(lecture.meta.slides).toBeUndefined();
      if(lecture.meta.slides){
        const deck=String(lecture.meta.slides).split('/').filter(Boolean).at(-1);
        expect(existsSync(`src/decks/${deck}.deck.mdx`)).toBe(true);
      }
    }
    for(const week of [5,8,11]){
      const html=readFileSync(`dist/lectures/week-${String(week).padStart(2,'0')}/index.html`,'utf8');
      // Both directions, because every lecture is now ready and a one-sided
      // assertion would have nothing left to test.
      if(lectures.find(n=>n.meta.week===week)?.meta.lecture_stage==='outline'){
        expect(html,`week ${week} is an outline and does not say so`).toContain('Outline preview');
        expect(html).not.toContain('Open the slides');
      } else {
        expect(html,`week ${week} is ready and still calls itself a preview`).not.toContain('Outline preview');
      }
    }
  });
  it('gives every finished lecture something to hand the room',()=>{
    // 'ready' is a promise to a student who turns up. A lecture keeps it with
    // a deck that exists or with an instrument in the page; week 1 has never
    // had slides and has never needed them. A page marked ready with neither
    // is an outline wearing the wrong label.
    for(const lecture of lectures.filter(n=>n.meta.lecture_stage==='ready')){
      const instrument=[lecture.meta.workbench,lecture.meta.extrapolator,lecture.meta.instruments,lecture.meta.report].includes(true);
      expect(Boolean(lecture.meta.slides)||instrument,`week ${lecture.meta.week} is marked ready with no deck and no instrument`).toBe(true);
    }
  });
  it('removes the superseded one-formal-lecture premise',()=>{
    expect(readFileSync('src/content/lectures/week-02.md','utf8')).not.toContain('There is one formal lecture');
    const html=readFileSync('dist/lectures/index.html','utf8');
    expect(html).toContain('4 formal lectures');expect(html).toContain('1 live introduction');
  });
});
