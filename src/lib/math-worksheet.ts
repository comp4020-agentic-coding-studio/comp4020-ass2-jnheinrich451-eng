/** A bounded, declarative maths language. No eval, Function, imports or network. */
type Expr = {kind:'number'; value:number} | {kind:'name'; name:string}
  | {kind:'binary'; op:string; left:Expr; right:Expr}
  | {kind:'call'; name:string; args:Expr[]}
  | {kind:'vector'; items:Expr[]};
type Poly = number[]; // ascending powers of the one solve variable
type Value = {kind:'scalar'; p:Poly} | {kind:'vector'; items:Poly[]}
  | {kind:'normal'; mean:Poly[]; sd:Poly[]};
export interface Gaussian {mean:number[]; sd:number[]}
export interface Solution {variable:string; roots:number[]; excluded:number[]; steps:string[]; identity:boolean}
export interface WorksheetResult {
  reference:Gaussian; candidate:Gaussian;
  location:number[]; spread:number[]; total:number;
  values:{name:string; value:number}[];
  commands:({kind:'solve'; source:string; solution:Solution} | {kind:'check'; source:string; left:number; right:number; passes:boolean})[];
}
export const WORKSHEETS = [
  {name:'One score, two means', question:'Keep the spread fixed. Which two means give a squared distance of 4?', source:`# sd means standard deviation, not variance.
m = 1.5
s = 1.5
R = Normal(mean=0, sd=1)
G = Normal(mean=m, sd=s)
D = distance(R, G)
solve D = 4 for m
check D = m^2 + (s - 1)^2`},
  {name:'Find both spread branches', question:'Can a narrower and a wider Gaussian share a score? Keep every positive standard deviation.', source:`m = 0
s = 1
R = Normal(mean=0, sd=1)
G = Normal(mean=m, sd=s)
D = distance(R, G)
solve D = 0.25 for s
check D = (s - 1)^2`},
  {name:'Across dimensions', question:'A total hides where the change occurred. Inspect each marginal and its contribution.', source:`# Independent coordinates: diagonal covariance only.
m = 1
s = 2
R = Normal(mean=[0, 0, 0], sd=[1, 1, 1])
G = Normal(mean=[m, 0, 0], sd=[1, s, 0.5])
D = distance(R, G)
solve D = 4 for m
check D = m^2 + (s - 1)^2 + 0.25`},
  {name:'Challenge a formula', question:'This formula agrees at one construction. Change s to 2 and see whether the agreement survives.', source:`m = 2
s = 1
R = Normal(mean=0, sd=1)
G = Normal(mean=m, sd=s)
D = distance(R, G)
guess = m^2 + (s^2 - 1)^2
check D = guess`},
] as const;
export const formatNumber=(n:number)=>n===0?'0':Number(n.toPrecision(8)).toString();
const fail=(message:string):never=>{throw new Error(message);};
function finite(n:number){if(!Number.isFinite(n)||Math.abs(n)>1e100)fail('Calculation exceeded the finite numerical range.');return n;}
function trim(p:Poly):Poly {while(p.length>1&&p.at(-1)===0)p.pop();p.forEach(finite);return p;}
const scalar=(p:Poly):Value=>({kind:'scalar',p:trim(p)});
const asPoly=(v:Value):Poly=>v.kind==='scalar'?v.p:fail('Expected a scalar expression, not a vector or distribution.');
const asNumber=(v:Value):number=>{const p=asPoly(v);return p.length===1?p[0]:fail('This expression still contains the solve variable.');};
function add(a:Poly,b:Poly,sign=1){return trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]??0)+sign*(b[i]??0)));}
function multiply(a:Poly,b:Poly){
  if(a.length+b.length>4)fail('Solver supports expressions polynomial up to degree 2; simplify higher powers first.');
  const p=Array(a.length+b.length-1).fill(0) as number[];
  a.forEach((x,i)=>b.forEach((y,j)=>p[i+j]+=x*y));return trim(p);
}

class Parser {
  private tokens:string[]=[]; private i=0; private depth=0;
  constructor(source:string){
    let rest=source.trim();
    while(rest){const match=rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|^[A-Za-z_][A-Za-z_0-9]*|^[+\-*/^(),\[\]=]/);
      if(!match)fail(`Unexpected character near “${rest.slice(0,18)}”. Use explicit * for multiplication.`);
      this.tokens.push(match![0]);rest=rest.slice(match![0].length).trimStart();
      if(this.tokens.length>300)fail('Keep each expression within 300 tokens.');
    }
  }
  private take(){return this.tokens[this.i++];}
  private expect(token:string){if(this.take()!==token)fail(`Expected “${token}”.`);}
  parse():Expr {const result=this.expression();if(this.i!==this.tokens.length)fail(`Unexpected token “${this.tokens[this.i]}”.`);return result;}
  private expression(min=0):Expr {
    if(++this.depth>40)fail('Expression nesting exceeds 40 levels.');
    const token=this.take();let left:Expr;
    if(token==='+'||token==='-'){
      const right=this.expression(3);left=token==='+'?right:{kind:'binary',op:'*',left:{kind:'number',value:-1},right};
    }else if(token==='('){left=this.expression();this.expect(')');}
    else if(token==='['){
      const items:Expr[]=[];
      do{items.push(this.expression());if(items.length>16)fail('Use at most 16 diagonal dimensions.');}while(this.tokens[this.i]===','&&this.take());
      this.expect(']');left={kind:'vector',items};
    }else if(token&&/^[\d.]/.test(token)){left={kind:'number',value:finite(Number(token))};}
    else if(token&&/^[A-Za-z_]/.test(token)){
      if(this.tokens[this.i]!=='(')left={kind:'name',name:token};
      else{
        this.take();const args:Expr[]=[];
        if(token==='Normal'){
          this.expect('mean');this.expect('=');args.push(this.expression());this.expect(',');this.expect('sd');this.expect('=');args.push(this.expression());
        }else if(this.tokens[this.i]!==')'){
          do{args.push(this.expression());}while(this.tokens[this.i]===','&&this.take());
        }
        this.expect(')');left={kind:'call',name:token,args};
      }
    }else return fail('Expected a number, name, vector or parenthesised expression.');
    const precedence:Record<string,number>={'+':1,'-':1,'*':2,'/':2,'^':4};
    while(this.i<this.tokens.length){const op=this.tokens[this.i];if(!Object.hasOwn(precedence,op))break;const p=precedence[op];if(p<min)break;
      this.take();left={kind:'binary',op,left,right:this.expression(op==='^'?p:p+1)};
    }
    this.depth--;return left;
  }
}
interface Definition {expr:Expr; line:number}
type Definitions=Map<string,Definition>;
function evaluator(defs:Definitions,variable?:string,override?:number){
  const cache=new Map<string,Value>(),visiting=new Set<string>();
  const resolve=(name:string):Value=>{
    if(name===variable)return scalar(override===undefined?[0,1]:[override]);
    if(name==='pi')return scalar([Math.PI]);
    if(cache.has(name))return cache.get(name)!;
    const def=defs.get(name);if(!def)fail(`Unknown name “${name}”. Define parameters before solving.`);
    if(visiting.has(name))fail(`Circular definition involving “${name}”.`);
    visiting.add(name);const value=run(def!.expr);visiting.delete(name);cache.set(name,value);return value;
  };
  const run=(expr:Expr):Value=>{
    if(expr.kind==='number')return scalar([expr.value]);
    if(expr.kind==='name')return resolve(expr.name);
    if(expr.kind==='vector')return {kind:'vector',items:expr.items.map(x=>asPoly(run(x)))};
    if(expr.kind==='binary'){
      const a=asPoly(run(expr.left)),b=asPoly(run(expr.right));
      if(expr.op==='+')return scalar(add(a,b));if(expr.op==='-')return scalar(add(a,b,-1));
      if(expr.op==='*')return scalar(multiply(a,b));
      if(expr.op==='/'){
        if(b.length!==1)fail('Solver cannot divide by an expression containing its variable.');
        if(b[0]===0)fail('Division by zero.');return scalar(a.map(x=>x/b[0]));
      }
      if(b.length!==1)fail('Solver cannot use a variable exponent.');
      if(a.length===1)return scalar([finite(a[0]**b[0])]);
      if(b[0]===0)return scalar([1]);if(b[0]===1)return scalar(a);if(b[0]===2)return scalar(multiply(a,a));
      return fail('Solver supports powers 0, 1 and 2 of expressions containing its variable.');
    }
    const args=expr.args.map(run);
    if(expr.name==='Normal'){
      const vector=(v:Value)=>v.kind==='vector'?v.items:[asPoly(v)];
      const mean=vector(args[0]),sd=vector(args[1]);
      if(mean.length!==sd.length)fail('Normal mean and sd must have equal dimensions. Scalars are not broadcast.');
      const value:Value={kind:'normal',mean,sd};
      // Validate inline distributions too, not only named R/G definitions.
      // Symbolic distributions are checked again after each root substitution.
      if([...mean,...sd].every(p=>p.length===1))normal(value);
      return value;
    }
    if(expr.name==='distance'){
      if(args.length!==2||args.some(v=>v.kind!=='normal'))fail('distance takes two Normal distributions.');
      const [r,g]=args as Extract<Value,{kind:'normal'}>[];
      if(r.mean.length!==g.mean.length)fail('Reference and candidate dimensions must match.');
      let total:Poly=[0];
      r.mean.forEach((_,i)=>{const mean=add(r.mean[i],g.mean[i],-1),sd=add(r.sd[i],g.sd[i],-1);total=add(total,add(multiply(mean,mean),multiply(sd,sd)));});
      return scalar(total);
    }
    if(!['sqrt','abs'].includes(expr.name)||args.length!==1)fail('Supported functions: Normal, distance, sqrt and abs.');
    const n=asNumber(args[0]);return scalar([finite(expr.name==='sqrt'?Math.sqrt(n):Math.abs(n))]);
  };
  return {resolve,run};
}
function normal(value:Value):Gaussian {
  if(value.kind!=='normal')return fail('R and G must be Normal distributions.');
  const mean=value.mean.map(p=>asNumber(scalar(p))),sd=value.sd.map(p=>asNumber(scalar(p)));
  if(mean.some(n=>Math.abs(n)>1000)||sd.some(n=>n<.01||n>1000))fail('Lab domain: |mean| ≤ 1000; 0.01 ≤ sd ≤ 1000 in every coordinate.');
  return {mean,sd};
}
function validateNormals(defs:Definitions,ev:ReturnType<typeof evaluator>){
  for(const name of defs.keys()){const v=ev.resolve(name);if(v.kind==='normal')normal(v);}
}
function solve(defs:Definitions,left:Expr,right:Expr,variable:string):Solution {
  if(!defs.has(variable)||evScalar(defs,variable)===false)fail('Solve for a defined scalar parameter, such as m or s.');
  if(variable==='D')fail('Solve for a distribution parameter, not the reported distance D.');
  const ev=evaluator(defs,variable),poly=add(asPoly(ev.run(left)),asPoly(ev.run(right)),-1);
  const c=poly[0],b=poly[1]??0,a=poly[2]??0,f=formatNumber;
  const steps=[`${f(a)} · ${variable}² + ${f(b)} · ${variable} + ${f(c)} = 0`];
  let roots:number[]=[],identity=false;
  if(a===0&&b===0){identity=c===0;steps.push(identity?'The equation is an identity wherever all expressions and distributions are valid.':'The equation is inconsistent: no solutions.');}
  else if(a===0){roots=[-c/b];steps.push(`${variable} = −c / b = ${f(roots[0])}`);}
  else{
    // Scale coefficients first to avoid overflow in the discriminant.
    const scale=Math.max(Math.abs(a),Math.abs(b),Math.abs(c)),aa=a/scale,bb=b/scale,cc=c/scale;
    const discriminant=bb*bb-4*aa*cc;
    steps.push(`After coefficient normalisation: discriminant = ${f(discriminant)}.`);
    if(discriminant<0)steps.push('Negative discriminant: no real solutions.');
    else{
      const root=Math.sqrt(discriminant);
      if(root===0)roots=[-bb/(2*aa)];
      else {const q=-.5*(bb+(bb>=0?root:-root));roots=[q/aa,cc/q].sort((x,y)=>x-y);}
      steps.push(`${variable} = (−b ± √(b² − 4ac)) / (2a).`);
    }
  }
  const excluded:number[]=[];
  roots=roots.filter(root=>{
    if(!Number.isFinite(root))return false;
    try {const check=evaluator(defs,variable,root);validateNormals(defs,check);
      const l=asNumber(check.run(left)),r=asNumber(check.run(right));
      if(Math.abs(l-r)>1e-8*Math.max(1,Math.abs(l),Math.abs(r)))throw new Error('Residual');
      return true;
    }catch{excluded.push(root);return false;}
  });
  steps.push('Retain only roots whose substituted distributions satisfy the lab domain; verify the equation numerically (relative tolerance 1e−8).');
  return {variable,roots,excluded,steps,identity};
}
function evScalar(defs:Definitions,name:string){return evaluator(defs).resolve(name).kind==='scalar';}
export function runWorksheet(source:string):WorksheetResult {
  if(source.length>12000)fail('Worksheet limit: 12,000 characters.');
  const lines=source.split(/\r?\n/);if(lines.length>100)fail('Worksheet limit: 100 lines.');
  const defs:Definitions=new Map();
  const commands:{kind:'solve'|'check'; left:Expr; right:Expr; variable:string; source:string; line:number}[]=[];
  const parse=(text:string)=>new Parser(text).parse();
  lines.forEach((raw,i)=>{
    const line=raw.split('#')[0].trim();if(!line)return;
    try{
      const command=line.match(/^(solve|check)\s+(.+)$/);
      if(command){
        const suffix=command[2].match(/\s+for\s+([A-Za-z_]\w*)$/);
        if(command[1]==='solve'&&!suffix)fail('Use: solve expression = expression for parameter');
        if(command[1]==='check'&&suffix)fail('A numerical check does not take a solve variable.');
        const equation=suffix?command[2].slice(0,suffix.index):command[2];
        let depth=0,equals=-1;
        for(let j=0;j<equation.length;j++){
          if('(['.includes(equation[j]))depth++;
          if(')]'.includes(equation[j]))depth--;
          if(equation[j]==='='&&depth===0){if(equals!==-1)fail('Use one top-level equality per command.');equals=j;}
        }
        if(equals<0)fail('A solve or check command requires a top-level equality.');
        commands.push({kind:command[1] as 'solve'|'check',left:parse(equation.slice(0,equals)),right:parse(equation.slice(equals+1)),variable:suffix?.[1]??'',source:line,line:i+1});return;
      }
      const assignment=line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
      if(!assignment)fail('Use name = expression, solve … = … for name, or check … = ….');
      const [,name,rhs]=assignment!;
      if(['pi','Normal','distance','sqrt','abs','solve','check'].includes(name))fail(`“${name}” is reserved.`);
      if(defs.has(name))fail(`“${name}” is already defined. Edit its original definition.`);
      defs.set(name,{expr:parse(rhs),line:i+1});
    }catch(error){throw new Error(`Line ${i+1}: ${(error as Error).message}`);}
  });
  const ev=evaluator(defs);const values:WorksheetResult['values']=[];
  for(const [name,def] of defs){try{const v=ev.resolve(name);if(v.kind==='normal')normal(v);if(v.kind==='scalar')values.push({name,value:asNumber(v)});}catch(error){throw new Error(`Line ${def.line}: ${(error as Error).message}`);}}
  const reference=normal(ev.resolve('R')),candidate=normal(ev.resolve('G'));
  if(reference.mean.length!==candidate.mean.length)fail('Reference and candidate dimensions must match.');
  const location=reference.mean.map((m,i)=>(m-candidate.mean[i])**2),spread=reference.sd.map((s,i)=>(s-candidate.sd[i])**2);
  const result:WorksheetResult={reference,candidate,location,spread,total:location.reduce((sum,n,i)=>sum+n+spread[i],0),values,commands:[]};
  for(const command of commands){try{
    if(command.kind==='solve')result.commands.push({kind:'solve',source:command.source,solution:solve(defs,command.left,command.right,command.variable)});
    else {const left=asNumber(ev.run(command.left)),right=asNumber(ev.run(command.right));result.commands.push({kind:'check',source:command.source,left,right,passes:Math.abs(left-right)<=1e-9*Math.max(1,Math.abs(left),Math.abs(right))});}
  }catch(error){throw new Error(`Line ${command.line}: ${(error as Error).message}`);}}
  return result;
}

/** A root changes the defining parameter, not a hidden plot state. */
export function applySolution(source:string,variable:string,value:number){
  if(!/^[A-Za-z_]\w*$/.test(variable)||!Number.isFinite(value))fail('Invalid solution.');
  const pattern=new RegExp(`^(\\s*)${variable}\\s*=`);let found=false;
  const updated=source.split('\n').map(line=>{
    if(!pattern.test(line))return line;found=true;
    const comment=line.includes('#')?` ${line.slice(line.indexOf('#'))}`:'';
    return `${variable} = ${value}${comment}`;
  }).join('\n');
  if(!found)fail('Parameter definition is no longer present. Run the worksheet again.');return updated;
}
