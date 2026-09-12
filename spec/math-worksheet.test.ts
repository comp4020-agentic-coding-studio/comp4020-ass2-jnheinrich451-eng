import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {runWorksheet,WORKSHEETS,applySolution,type WorksheetResult} from '../src/lib/math-worksheet';
import {worksheetFigure} from '../figures/math-worksheet';
const base=WORKSHEETS[0].source;
function solution(result:WorksheetResult){const command=result.commands.find(c=>c.kind==='solve');if(!command||command.kind!=='solve')throw new Error('Missing solve');return command.solution;}
const add=(line:string)=>`${base.split('solve')[0]}\n${line}`;
describe('equation-driven worksheet',()=>{
  it('derives the scalar score and both mean roots without changing the construction',()=>{
    const result=runWorksheet(base);expect(result.total).toBe(2.5);expect(result.candidate.mean).toEqual([1.5]);
    expect(solution(result).roots[0]).toBeCloseTo(-Math.sqrt(3.75),12);expect(solution(result).roots[1]).toBeCloseTo(Math.sqrt(3.75),12);
    for(const root of solution(result).roots)expect(runWorksheet(applySolution(base,'m',root)).total).toBeCloseTo(4,12);
  });
  it('retains both positive spread branches rather than silently selecting sigma >= 1',()=>{
    const result=runWorksheet(WORKSHEETS[1].source);expect(solution(result).roots).toEqual([.5,1.5]);
  });
  it('excludes nonpositive spread roots and gives a domain explanation',()=>{
    const result=runWorksheet(WORKSHEETS[1].source.replace('= 0.25 for s','= 4 for s'));
    expect(solution(result).roots).toEqual([3]);expect(solution(result).excluded).toEqual([-1]);
  });
  it('decomposes diagonal distances and updates dependent vectors when applying a root',()=>{
    const source=WORKSHEETS[2].source,result=runWorksheet(source);expect(result.location).toEqual([1,0,0]);expect(result.spread).toEqual([0,1,.25]);expect(result.total).toBe(2.25);
    expect(runWorksheet(applySolution(source,'m',solution(result).roots[0])).total).toBeCloseTo(4,12);
  });
  it('allows an editable reference with non-unit standard deviation',()=>{
    const result=runWorksheet(base.replace('mean=0, sd=1','mean=-1, sd=2'));expect(result.total).toBe(6.5);
    for(const root of solution(result).roots)expect(runWorksheet(applySolution(base.replace('mean=0, sd=1','mean=-1, sd=2'),'m',root)).total).toBeCloseTo(4,12);
  });
  it('does not confuse a pointwise numerical check with a formula identity',()=>{
    const source=WORKSHEETS[3].source;
    expect(runWorksheet(source).commands[0]).toMatchObject({kind:'check',passes:true});
    expect(runWorksheet(source.replace('s = 1','s = 2')).commands[0]).toMatchObject({kind:'check',passes:false,left:5,right:13});
  });
  it('handles no-real-root, repeated-root, linear, inconsistent and identity cases',()=>{
    expect(solution(runWorksheet(add('solve D = -1 for m'))).roots).toEqual([]);
    expect(solution(runWorksheet(add('solve m^2 = 0 for m'))).roots).toEqual([-0]);
    expect(solution(runWorksheet(add('solve 2*m = 3 for m'))).roots).toEqual([1.5]);
    expect(solution(runWorksheet(add('solve m - m = 1 for m'))).identity).toBe(false);
    expect(solution(runWorksheet(add('solve m - m = 0 for m'))).identity).toBe(true);
  });
  it('obeys exponent precedence and supports explicit arithmetic and constants',()=>{
    const result=runWorksheet(add('x = -2^2 + 2^-2 + sqrt(9) + abs(-2)\ny = 2^3^2\nz = pi'));
    expect(result.values.find(v=>v.name==='x')?.value).toBe(1.25);
    expect(result.values.find(v=>v.name==='y')?.value).toBe(512);
    expect(result.values.find(v=>v.name==='z')?.value).toBe(Math.PI);
  });
  it('is declarative with cached dependencies and detects cycles and duplicate definitions',()=>{
    expect(runWorksheet('R = Normal(mean=0, sd=1)\nG = Normal(mean=m, sd=1)\nm = 2').total).toBe(4);
    expect(()=>runWorksheet(`${base}\nm = 3`)).toThrow('already defined');
    expect(()=>runWorksheet(add('a = b\nb = a'))).toThrow('Circular');
    expect(()=>runWorksheet(base.replace('m = 1.5','m = unknown'))).toThrow('Line 2');
  });
  it.each(['s = 0','s = -1','s = 0.001','s = 1001','s = 1/0','s = sqrt(-1)','s = 1e200','s = 2^10000'])(
    'rejects invalid definitions atomically: %s',line=>expect(()=>runWorksheet(base.replace('s = 1.5',line))).toThrow());
  it('does not let a user-defined D relabel the actual plotted distance',()=>{
    const result=runWorksheet(base.split('solve')[0].replace('D = distance(R, G)','D = 99'));
    expect(result.total).toBe(2.5);expect(result.values.find(v=>v.name==='D')?.value).toBe(99);
  });
  it.each(['solve m^3 = 1 for m','solve 1/m = 1 for m','solve sqrt(m) = 1 for m','solve D = 4 for missing','solve D = 4 for D'])(
    'explicitly rejects unsupported solving: %s',line=>expect(()=>runWorksheet(add(line))).toThrow());
  it.each(['m = window.alert(1)','m = fetch(1)','m = 2; alert(1)','m = __proto__','m = constructor(1)','m = import(1)','m = 1 constructor 2','m = 1 toString 2'])(
    'cannot execute JavaScript: %s',line=>expect(()=>runWorksheet(base.replace('m = 1.5',line))).toThrow());
  it('rejects mismatched dimensions and does not broadcast scalar means',()=>{
    expect(()=>runWorksheet(base.replace('mean=m, sd=s','mean=[m,0], sd=s'))).toThrow('equal dimensions');
    expect(()=>runWorksheet(base.replace('mean=m, sd=s','mean=[m,0], sd=[s,1]'))).toThrow('dimensions must match');
  });
  it('validates inline distributions and excludes invalid inline spread roots',()=>{
    expect(()=>runWorksheet(add('x = distance(R, Normal(mean=0, sd=-1))'))).toThrow('Lab domain');
    const result=runWorksheet(add('solve distance(R, Normal(mean=0, sd=s)) = 4 for s'));
    expect(solution(result).roots).toEqual([3]);expect(solution(result).excluded).toEqual([-1]);
    expect(runWorksheet(add('check distance(R, Normal(mean=2, sd=1)) = 4')).commands[0]).toMatchObject({kind:'check',passes:true});
  });
  it('enforces expression and document limits',()=>{
    expect(()=>runWorksheet('x'.repeat(12001))).toThrow('12,000');
    expect(()=>runWorksheet('\n'.repeat(101))).toThrow('100 lines');
    expect(()=>runWorksheet(add(`x = ${'('.repeat(45)}1${')'.repeat(45)}`))).toThrow('nesting');
    expect(()=>runWorksheet(add(`x = ${Array(200).fill('1').join('+')}`))).toThrow('300 tokens');
  });
  it('produces finite actual marginal densities and includes narrow peaks',()=>{
    const result=runWorksheet('R = Normal(mean=0, sd=0.01)\nG = Normal(mean=10, sd=1000)'),figure=worksheetFigure(result);
    expect(figure.paths.every(p=>!p.includes('NaN')&&!p.includes('Infinity'))).toBe(true);
    expect(Math.max(...figure.points[0].map(p=>p[1]))).toBeCloseTo(1/(.01*Math.sqrt(2*Math.PI)),10);
    expect(()=>worksheetFigure(result,1)).toThrow();
  });
  it('renders accessible input, explicit limitations and the preserved guided lab',()=>{
    const html=readFileSync('dist/math-lab/index.html','utf8');
    for(const text of ['Mathematical worksheet','not proof','diagonal covariance','data-worksheet-total','data-handle="mu"'])expect(html).toContain(text);
  });
});
