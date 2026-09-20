// These are regression gates for specific audited promises, not an automatic
// judgement of teaching quality. Read the prose and inspect the rendered page too.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const read=(path:string)=>readFileSync(path,'utf8');
const entry=(slug:string)=>JSON.parse(read(`dist/api/sessions/${slug}.json`));
const compact=(text:string)=>text.replace(/\s+/g,' ').trim();
const three=entry('03-the-instrument');
const four=entry('04-getting-it-right');
const five=entry('05-the-bias');
const six=entry('06-blind-spots');
const seven=entry('07-dropping-the-gaussian');
const eight=entry('08-video');
const twelve=entry('12-what-you-would-report-instead');
const log=JSON.parse(read('dist/api/assessments/measurement-log.json'));
const finalReport=JSON.parse(read('dist/api/assessments/final-report.json'));

describe('session promises match assigned evidence',()=>{
  it('week 12 follows the assessed eight-plus-four format without adding a submission',()=>{
    const body=compact(twelve.body);
    expect(compact(finalReport.body)).toContain('Twelve minutes, week 12. Eight to present and four to defend Part C.');
    expect(body).toContain('eight minutes to present and four minutes to defend Part C');
    expect(body).toContain('twelve minutes in total');
    expect(body).toContain('/assessments/final-report/#in-person');
    expect(body).toContain('no separate deliverable or deadline');
    expect(body).toContain('dated note to the final log entry');
    expect(body).not.toMatch(/(?:ten|10) minutes/i);
    expect(finalReport.meta.weight).toBe(45);
    expect(finalReport.meta.due).toBe('2026-10-30T12:00:00+10:00');
    expect(finalReport.meta.marking.criteria.map((c:{weight:number})=>c.weight)).toEqual([25,45,30]);
    expect(twelve.meta.date).toBe('2026-10-26');
    expect(twelve.meta.required_reading).toBe('jayasumana-2024');
    expect(read('dist/assessments/final-report/index.html')).toContain('id="in-person"');
  });
  it('week 12 consolidates evidence without mixing scales or replacing estimates with baselines',()=>{
    const body=compact(twelve.body);
    for(const statement of ['matched N ladder','At d = 2048','B ≈ 4.88','separately from empirical scores and fitted intercepts','Keep density and coverage separate','Do not compare numerical magnitudes across different metrics','**not computed**','Keep earlier entries intact'])expect(body).toContain(statement);
    expect(body).not.toContain('every entry was computed the same way');
    expect(body).toContain('/lectures/week-11/');
    expect(body).toContain('/assessments/measurement-log/');
    expect(twelve.meta.log).toContain('protocols, baselines and a dated defence note');
  });
  it('week 12 labels a synthetic CMMD adaptation and does not demand an image pipeline for vectors',()=>{
    const body=compact(twelve.body);
    expect(body).toContain('Gaussian RBF kernel');
    expect(body).toContain('report sample-efficiency improvements in their experiments');
    expect(body).toContain('not claim to have reproduced CLIP-based CMMD');
    expect(body).toContain('not a compulsory new implementation');
    expect(body).not.toContain('blind to nothing');
  });
  it('starts recorded FID∞ practice in week 5 without retiring the original measurements',()=>{
    const body=compact(five.body);
    for(const statement of ['Begin recording FID∞ in week 5','**Run the ladder** three times','N = 60, 100, 200, 400, 800','Reference and candidate samples are redrawn','Label this reduced-dimensional practice','Keep week 4\'s original measurements'])expect(body).toContain(statement);
    expect(body).not.toContain('week 6 onwards');
    expect(body).not.toContain('numbers are now retired');
    expect(five.meta.log).toContain('fitted FID∞ and population baseline');
    const lecture=read('dist/lectures/week-05/index.html');
    for(const label of ['Run the ladder','Sample estimate / N = 60','Extrapolated estimate','Population value','data-xp-run'])expect(lecture).toContain(label);
  });
  it('week 6 transfers the fit to the student candidate under a matched protocol',()=>{
    const body=compact(six.body);
    for(const statement of ['lecture panel only offers A and B','same reference collection within each comparison','same N ladder','whether reference size also grows with N or remains fixed','inspect residuals','unfinished work','Week 5 introduced the fit'])expect(body).toContain(statement);
    expect(body).toContain('/assessments/measurement-log/');
    expect(six.meta.log).toContain('A and your candidate D');
  });
  it('the log agrees on timing and keeps missing work distinct from a population value',()=>{
    const body=compact(log.body);
    for(const statement of ['1–4','FID∞ is not yet required','First recorded FID∞ practice','three times at fixed settings','6 onward','when the session calls for it','not another single-N measurement','N: not applicable (population calculation)','**not computed**','does not turn missing required work into completed work','rather than overwriting'])expect(body).toContain(statement);
    for(const link of ['/lectures/week-05/','/sessions/05-the-bias/','/sessions/06-blind-spots/'])expect(log.body).toContain(link);
    expect(log.meta.weight).toBe(10);
    expect(log.meta.due).toBe('2026-10-30T12:00:00+10:00');
    expect(log.meta.marking.criteria.map((c:{weight:number})=>c.weight)).toEqual([50,50]);
    const spine=compact(read('build/SPINE.md').split('### `assessments/measurement-log.md`')[1].split('\n### ')[0]);
    for(const promise of log.spec)expect(spine).toContain(promise);
    expect(spine).toContain('Predictions checked against measurements');
    for(const [slug,data] of [['05-the-bias',five],['06-blind-spots',six]] as const){
      const block=compact(read('build/SPINE.md').split(`### \`sessions/${slug}.md\``)[1].split('\n### ')[0]);
      expect(block).toContain(data.meta.log);
    }
  });
  it('week 3 distinguishes the toy representation experiment from standard image FID',()=>{
    const body=compact(three.body);
    expect(body).toContain('toy Gaussian distance, not standard image-based FID');
    expect(body).toContain('between the fitted Gaussians');
    expect(body).toContain('not generally the squared Wasserstein distance between the original feature distributions');
    expect(body).not.toContain('Both are.');
    expect(body).not.toContain('Every FID in the literature');
    expect(three.spec.join(' ')).toContain('rotation-only control');
    expect(three.meta.log).toContain('identity, rotation and rotation-plus-ReLU');
    for(const control of ['Do not redraw between maps','same Q to every set','Keep off-diagonal entries','three map rows and two candidate-score columns','numerical tolerance chosen before','A negligible ReLU effect is also a result'])expect(body).toContain(control);
  });
  it('week 7 distinguishes population quantities, finite estimates and what the panel computes',()=>{
    const body=compact(seven.body);
    expect(body).toContain('not precision and recall');
    expect(body).toContain('panel does not estimate FID∞ or empirical FID');
    expect(body).toContain('mark FID∞ **not computed**');
    expect(body).toContain('A fitted FID∞ intercept is not guaranteed to be exactly zero');
    expect(body).toContain('Independent finite draws need not have identical empirical moments');
    expect(body).toContain('finite KID estimates still fluctuate');
    expect(body).toContain('excludes self-pairs');
    expect(body).toContain('A finite estimate can be negative');
    expect(body).toContain('all joint moments through degree three');
    expect(body).not.toContain('both score it 0');
  });
  it('week 7 exposes the dimension/sample-size confound and does not promise a combined ranking',()=>{
    const body=compact(seven.body);
    for(const statement of ['d = 2048, N = 250','Both use N = 1000','changes both d and N','2 versus 16 for the equal-N','not a significance test','not impossibility theorems','do not define one combined ranking','same sets within the press'])expect(body).toContain(statement);
    expect(seven.meta.log).toContain('uncomputed FID∞');
    const html=read('dist/sessions/07-dropping-the-gaussian/index.html');
    for(const setting of ['2048, the bench (N = 250)','2 (N = 1000)','16 (N = 1000)','data-ts-run','data-ts-strip="kid"','data-ts-strip="density"','data-ts-strip="coverage"'])expect(html).toContain(setting);
  });
  it('week 4 assigns the resize comparison its checklist promises',()=>{
    expect(four.spec.join(' ')).toContain('reference features');
    const body=compact(four.body);
    expect(body).toContain('Cache the reference features.');
    expect(body).toContain('changing only the candidate resize filter');
    expect(body).toContain('Keep output resolution, pixel range, feature weights and downstream arithmetic fixed.');
    expect(body).toContain('not this resize experiment');
    expect(body).toContain('both settings and both scores');
    expect(body).not.toContain('None of these is a bug');
  });
  it('week 4 separates configurations, candidate scores and numerical controls',()=>{
    const body=compact(four.body);
    expect(four.meta.log).toContain('four numerical configurations with two candidate scores each');
    expect(body).toContain('Estimate moments once in float64');
    expect(body).toContain('eight scores in total');
    expect(body).toContain('Check identical input moments against themselves');
    expect(body).toContain('State your numerical tolerance before');
    expect(body).toContain('not evidence of a numerical bug');
    expect(body).not.toContain('four numbers for two candidates');
  });
  it('week 8 promises measured toy work and an actual-FVD proposal, not a proven I3D blind spot',()=>{
    const body=compact(eight.body);
    expect(eight.description).not.toContain('Temporal failures do not show');
    expect(eight.spec.join(' ')).toContain('design a separate test');
    expect(eight.meta.log).toContain('untested FVD claims');
    expect(body).toContain('measured here');
    expect(body).toContain('not tested here');
    expect(body).toContain('not a test of I3D');
    expect(body).toContain('not computed');
    expect(body).toContain('not a calibrated significance test');
  });
  it('week 8 retains conditions on extrapolation and identifies its observations',()=>{
    const body=compact(eight.body);
    expect(body).toContain('depends on smoothness and sampling assumptions');
    expect(body).toContain('fit residuals and sensitivity to the N range');
    expect(body).toContain('number of clips');
    expect(body).toContain('not the total number of frames');
    expect(body).toContain('displayed seed, N, frames per sequence and correlation');
    expect(body).toContain('failure to detect a difference from evidence of equivalence');
    expect(body).not.toContain('Everything from week 5, without a line of new work');
  });
  it('keeps revised descriptions and checklists aligned with the planning spine',()=>{
    const spine=read('build/SPINE.md');
    for(const [slug,data] of [['03-the-instrument',three],['04-getting-it-right',four],['07-dropping-the-gaussian',seven],['08-video',eight],['12-what-you-would-report-instead',twelve]] as const){
      const block=compact(spine.split(`### \`sessions/${slug}.md\``)[1].split('\n### ')[0]);
      expect(block).toContain(data.description);
      for(const promise of data.spec)expect(block).toContain(promise);
    }
  });
  it('keeps dates, readings, assessment links and usable lecture controls',()=>{
    expect(five.meta.date).toBe('2026-08-31');
    expect(six.meta.date).toBe('2026-09-07');
    expect(three.meta.date).toBe('2026-08-17');
    expect(seven.meta.date).toBe('2026-09-21');
    expect(three.meta.required_reading).toBe('kynkaanniemi-2023');
    expect(seven.meta.required_reading).toBe('binkowski-2018');
    expect(four.meta.date).toBe('2026-08-24');
    expect(eight.meta.date).toBe('2026-09-28');
    expect(four.meta.required_reading).toBe('parmar-2022');
    expect(eight.meta.required_reading).toBe('unterthiner-2019');
    expect(four.body).toContain('/assessments/a1-reproduce-the-number/');
    expect(eight.body).toContain('/lectures/week-08/');
    const lecture=read('dist/lectures/week-08/index.html');
    for(const label of ['Measure all three instruments','frames per sequence','sequences N','frame correlation'])expect(lecture).toContain(label);
    for(const slug of ['03-the-instrument','04-getting-it-right','05-the-bias','06-blind-spots','07-dropping-the-gaussian','08-video','12-what-you-would-report-instead']){
      const html=read(`dist/sessions/${slug}/index.html`);
      expect(html).toContain('id="log-entry"');
      expect(html).toContain('/assessments/measurement-log/');
    }
  });
});
