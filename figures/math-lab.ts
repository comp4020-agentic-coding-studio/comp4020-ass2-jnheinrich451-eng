/** Single numerical source for the live curves and their build-time fallback.
 * Run `node figures/math-lab.ts` to print the scores and every plotted point. */
export interface Construction { mu: number; sigma: number; }
export interface LabState extends Construction { locked: boolean; side: 1 | -1; }
export const INITIAL: LabState = {mu:1.5,sigma:1.5,locked:false,side:1};
export const TARGET=4;
export const TOLERANCE=.01;
export const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
export function distance({mu,sigma}:Construction){
  if(!Number.isFinite(mu)||!Number.isFinite(sigma)||sigma<=0)throw new Error('Mean must be finite and standard deviation must be positive.');
  return {location:mu*mu,spread:(sigma-1)**2,total:mu*mu+(sigma-1)**2};
}
export function setParameter(state:LabState,key:'mu'|'sigma',value:number):LabState {
  if(!Number.isFinite(value))throw new Error('Enter a finite number.');
  const next={...state};
  if(!state.locked){next[key]=key==='mu'?clamp(value,-3,3):clamp(value,.25,3.5);}
  else if(key==='mu'){
    next.mu=clamp(value,-2,2);
    next.sigma=1+Math.sqrt(Math.max(0,TARGET-next.mu**2));
  }else{
    next.sigma=clamp(value,1,3);
    next.mu=next.side*Math.sqrt(Math.max(0,TARGET-(next.sigma-1)**2));
  }
  if(next.mu!==0)next.side=next.mu<0?-1:1;
  return next;
}
export function lockScore(state:LabState,locked:boolean):LabState {
  const next={...state,locked};
  return locked?setParameter(next,'mu',next.mu):next;
}
export function density(x:number,{mu,sigma}:Construction){return Math.exp(-.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));}
export function samples(c:Construction){return Array.from({length:641},(_,i)=>{const x=-8+i/40;return [x,density(x,c)] as [number,number];});}
export const pixelX=(x:number)=>55+(x+8)/16*700;
export function curves(candidate:Construction,pinned:Construction[]=[]){
  const all=[{mu:0,sigma:1},candidate,...pinned];
  const maxY=Math.max(...all.map(c=>density(c.mu,c)))*1.15;
  const pixelY=(y:number)=>320-y/maxY*260;
  return {maxY,pixelY,paths:all.map(c=>samples(c).map(([x,y],i)=>`${i?'L':'M'}${pixelX(x).toFixed(3)},${pixelY(y).toFixed(3)}`).join(' '))};
}
if(typeof process!=='undefined' && process.argv[1]?.replace(/\\/g,'/').endsWith('/math-lab.ts')){
  console.log(JSON.stringify({candidate:INITIAL,score:distance(INITIAL),reference:samples({mu:0,sigma:1}),candidatePoints:samples(INITIAL)}));
}
