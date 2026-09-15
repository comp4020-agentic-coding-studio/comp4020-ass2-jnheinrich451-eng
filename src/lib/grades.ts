/** Planning arithmetic only: published rubric weights remain the source of truth. */
export const GRADE_TARGETS = [
  {label:'P', name:'Pass', minimum:50},
  {label:'CR', name:'Credit', minimum:60},
  {label:'D', name:'Distinction', minimum:70},
  {label:'HD', name:'High distinction', minimum:80},
] as const;
export interface GradeRow {id:string; assessment:string; criterion:string; weight:number; maximum:number}
export function gradeBand(score:number):string {
  return [...GRADE_TARGETS].reverse().find(b=>score>=b.minimum)?.label ?? 'N';
}
export function calculateGrades(rows:GradeRow[], entries:Record<string,string>) {
  const errors:string[]=[];
  let earned=0, covered=0;
  const contributions:Record<string,number|null>={};
  const assessments:Record<string,{earned:number;covered:number;marks:number}>={};
  for(const row of rows){
    const value=(entries[row.id]??'').trim();
    const group=assessments[row.assessment]??={earned:0,covered:0,marks:0};
    assessments[row.assessment]=group;
    if(value===''){contributions[row.id]=null;continue;}
    const mark=Number(value);
    if(!Number.isFinite(mark)||mark<0||mark>row.maximum){errors.push(row.id);continue;}
    const points=mark*row.weight/100, weight=row.maximum*row.weight/100;
    contributions[row.id]=points;earned+=points;covered+=weight;
    group.earned+=points;group.covered+=weight;group.marks+=mark;
  }
  // Never return an apparently valid total beside invalid edits.
  if(errors.length)return {ok:false as const,errors};
  const remaining=Math.max(0,100-covered), ceiling=earned+remaining;
  const average=covered>0?100*earned/covered:null;
  const targets=GRADE_TARGETS.map(target=>{
    const needed=Math.max(0,target.minimum-earned);
    const reachable=ceiling>=target.minimum;
    return {...target,needed,reachable,requiredAverage:needed===0?0:remaining>0?100*needed/remaining:null};
  });
  return {ok:true as const,errors,earned,covered,remaining,ceiling,average,contributions,assessments,targets};
}
