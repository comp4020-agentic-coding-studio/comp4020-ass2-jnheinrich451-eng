import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
describe('shared lab navigation',()=>{
  it.each(['workspace','math-lab','image-lab'])('ships essential separation independently of scoped CSS on %s',route=>{
    const html=readFileSync(`dist/${route}/index.html`,'utf8');
    const nav=html.match(/<nav\b[^>]*aria-label="Interactive labs"[^>]*>[\s\S]*?<\/nav>/)?.[0];
    expect(nav).toBeDefined();
    expect(nav).toContain('class="lab-navigation"');
    expect(nav).toContain('display:flex');expect(nav).toContain('flex-wrap:wrap');expect(nav).toContain('gap:0.75rem 1.5rem');
    expect(nav?.match(/<a\b/g)).toHaveLength(3);expect(nav?.match(/aria-current="page"/g)).toHaveLength(1);
    expect(nav).toMatch(new RegExp(`href="[^"]*/${route}/"[^>]*aria-current="page"`));
  });
  it('uses one component on all lab pages and loads shared styling through site config',()=>{
    for(const route of ['workspace','math-lab','image-lab'])expect(readFileSync(`src/pages/${route}/index.astro`,'utf8')).toContain(`<LabNavigation current="${route}"`);
    expect(readFileSync('src/site-config.ts','utf8')).toContain("import './styles/navigation.css'");
    expect(readFileSync('src/styles/navigation.css','utf8')).toContain('.lab-navigation > a');
  });
});
