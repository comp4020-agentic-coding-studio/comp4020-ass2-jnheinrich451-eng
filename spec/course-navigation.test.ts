import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const {nodes}=JSON.parse(readFileSync('dist/api/index.json','utf8'));
describe('direct course navigation',()=>{
  it('places Memes between Workspace and People in the shared top navigation',()=>{
    for(const route of ['', 'memes', 'lectures', 'sessions', 'assessments', 'workspace', 'people', 'policies']){
      const html=readFileSync(`dist/${route?route+'/':''}index.html`,'utf8');
      const nav=html.match(/<ul[^>]*class="[^"]*at-nav-links[^"]*"[\s\S]*?<\/ul>/)?.[0];
      expect(nav,route).toBeDefined();
      expect([...nav!.matchAll(/<a[^>]*href="([^"]+)"/g)].map(m=>m[1].split('/').filter(Boolean).at(-1)))
        .toEqual(['lectures','sessions','assessments','workspace','memes','people','policies']);
    }
  });
  it('offers all seven home destinations in navigation order',()=>{
    const html=readFileSync('dist/index.html','utf8');
    const cards=html.match(/<section[^>]*class="home-destinations"[\s\S]*?<\/section>/)?.[0];
    expect(cards).toBeDefined();
    expect([...cards!.matchAll(/<a[^>]*href="([^"]+)"/g)].map(m=>m[1].split('/').filter(Boolean).at(-1)))
      .toEqual(['lectures','sessions','assessments','workspace','memes','people','policies']);
    expect([...cards!.matchAll(/<h3\b[^>]*>([^<]+)<\/h3>/g)].map(m=>m[1]))
      .toEqual(['Lectures','Sessions','Assessment','Workspace','Memes','People','Policies']);
  });
  it('ships published destinations in all course layouts without changing the overview links',()=>{
    const routes=['','lectures','sessions','assessments','people','policies','workspace','math-lab','image-lab',...nodes.filter((n:{type:string})=>['lectures','sessions','assessments','people'].includes(n.type)).map((n:{id:string})=>n.id)];
    for(const route of routes){
      const html=readFileSync(`dist/${route?route+'/':''}index.html`,'utf8');
      for(const [collection,count] of [['lectures',5],['sessions',12],['assessments',4],['workspace',3],['memes',17],['people',2]] as const){
        const template=html.match(new RegExp(`<template[^>]*data-course-menu="${collection}"[\\s\\S]*?</template>`))?.[0];
        expect(template,route+' '+collection).toBeDefined();
        expect((template!.match(/<li\b/g)??[]).length).toBe(count);
        for(const node of nodes.filter((n:{type:string})=>n.type===collection))expect(template).toContain(`/${node.id}/`);
        if(collection==='workspace'){
          expect(template).toContain('/workspace/');
          expect(template).toContain('/math-lab/');
          expect(template).toContain('/image-lab/');
          expect(template).not.toContain('course-jump-overview');
        }
        if(collection==='memes'){
          const links=[...template!.matchAll(/<a\b[^>]*data-comic-nav="[^"]+"[^>]*>/g)].map(m=>m[0]);
          expect(links).toHaveLength(17);
          for(const link of links){expect(link).toContain('aria-disabled="true"');expect(link).not.toMatch(/\shref=/);}
          expect(template!.match(/data-comic-lock-icon/g)).toHaveLength(17);
        }
        expect(html).toMatch(new RegExp(`<a[^>]*href="[^"]*/${collection}/"`));
      }
    }
  });
  it('keeps the ongoing measurement log first',()=>{
    const html=readFileSync('dist/lectures/week-01/index.html','utf8');
    const menu=html.match(/<template[^>]*data-course-menu="assessments"[\s\S]*?<\/template>/)![0];
    expect(menu.indexOf('/assessments/measurement-log/')).toBeLessThan(menu.indexOf('/assessments/a1-reproduce-the-number/'));
  });
  it('places the schedule lead before the Sessions header and preserves the requested introduction',()=>{
    const html=readFileSync('dist/sessions/index.html','utf8');
    const main=html.slice(html.indexOf('<main'));
    expect(main.indexOf('The twelve-week teaching schedule:')).toBeLessThan(main.indexOf('SLOP8412 / Teaching Session / Reading'));
    expect(main).toContain('Dive in FID to study with concepts, math codes and applications.');
  });
});
