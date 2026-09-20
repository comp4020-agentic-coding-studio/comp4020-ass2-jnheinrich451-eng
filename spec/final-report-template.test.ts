import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';

const read=(path:string)=>readFileSync(path,'utf8').replace(/^\uFEFF/,'');
const manifest=JSON.parse(read('public/templates/final-report/manifest.json')) as {
  pages:number;reportPages:number;hashes:Record<string,string>;
};
describe('optional final-report template',()=>{
  it('ships generated files that match their source fingerprint',()=>{
    for(const [path,hash] of Object.entries(manifest.hashes)){
      expect(createHash('sha256').update(readFileSync(path)).digest('hex'),`Regenerate template: ${path}`).toBe(hash);
    }
    expect(readFileSync('public/templates/final-report/final-report.pdf').subarray(0,5).toString()).toBe('%PDF-');
    expect(readFileSync('public/templates/final-report/final-report-latex.zip').subarray(0,2).toString()).toBe('PK');
    expect(manifest.reportPages).toBeLessThanOrEqual(6);
    expect(manifest.pages).toBe(manifest.reportPages+1);
  });
  it('retains the assessment parts, marks and separate archive requirement',()=>{
    const tex=read('templates/final-report/main.tex');
    const brief=read('src/content/assessments/final-report.md');
    for(const [part,title,points] of [['A','The proposal',25],['B','The evaluation',45],['C','Where it fails',30]]){
      expect(tex).toContain(`Part ${part}. ${title} [${points} points]`);
      expect(brief.toLowerCase()).toContain(`## part ${part}, ${title} [${points}]`.toLowerCase());
    }
    expect(tex).toContain('six pages');
    expect(tex).toContain('separate archive');
    for(const term of ['Estimator bias','Blind spots','Correlation with human judgement','Cost of adoption','FID$_\\infty$'])expect(tex).toContain(term);
    expect(tex).toContain('placeholders, not');
    expect(tex).toContain('Optional starter, not a completed submission');
    expect(tex).not.toContain('\\write18');
  });
  it('shows the template only on the final-report page and keeps downloads base-aware',()=>{
    const html=read('dist/assessments/final-report/index.html');
    expect(html).toContain('id="report-template"');
    expect(html).toContain('href="#report-template"');
    expect(html).toContain('title="Slop University Final Report template PDF preview"');
    expect(html).toContain('Optional LaTeX starter.');
    expect(html).toContain('The LaTeX ZIP does not replace that archive');
    const canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
    const prefix=new URL(canonical!).pathname.replace(/assessments\/final-report\/$/,'');
    for(const file of ['final-report.pdf','final-report-latex.zip','preview.png'])expect(html).toContain(`${prefix}templates/final-report/${file}`);
    for(const slug of ['measurement-log','a1-reproduce-the-number','a2-break-the-number'])expect(read(`dist/assessments/${slug}/index.html`)).not.toContain('id="report-template"');
  });
  it('packages the template, original shield, generated bitmap and licence',()=>{
    const zip=readFileSync('public/templates/final-report/final-report-latex.zip').toString('latin1');
    for(const file of ['main.tex','README.md','slop-crest.svg','slop-crest.png','SLOP-BRAND-LICENSE.txt'])expect(zip).toContain(file);
  });
});
