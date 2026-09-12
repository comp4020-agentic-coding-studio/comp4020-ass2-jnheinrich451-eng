/** Density figure for the worksheet. Run with Node to print all plotted numbers. */
import {runWorksheet,WORKSHEETS,type WorksheetResult} from '../src/lib/math-worksheet.ts';
export function worksheetFigure(result:WorksheetResult,dimension=0){
  const distributions=[result.reference,result.candidate];
  if(!Number.isInteger(dimension)||dimension<0||dimension>=result.reference.mean.length)throw new Error('Invalid marginal.');
  const lo=Math.min(...distributions.map(d=>d.mean[dimension]-4*d.sd[dimension]));
  const hi=Math.max(...distributions.map(d=>d.mean[dimension]+4*d.sd[dimension]));
  const maxY=Math.max(...distributions.map(d=>1/(d.sd[dimension]*Math.sqrt(2*Math.PI))))*1.1;
  const points=distributions.map(d=>{
    // Include each curve's local grid so very narrow distributions are not missed.
    const xs=new Set(Array.from({length:401},(_,i)=>lo+(hi-lo)*i/400));
    for(let i=0;i<=400;i++)xs.add(d.mean[dimension]+d.sd[dimension]*(-4+8*i/400));
    return [...xs].sort((a,b)=>a-b).map(x=>[x,Math.exp(-.5*((x-d.mean[dimension])/d.sd[dimension])**2)/(d.sd[dimension]*Math.sqrt(2*Math.PI))]);
  });
  return {lo,hi,maxY,points,paths:points.map(curve=>curve.map(([x,y],i)=>`${i?'L':'M'}${(55+(x-lo)/(hi-lo)*690).toFixed(3)},${(285-y/maxY*240).toFixed(3)}`).join(' '))};
}
if(typeof process!=='undefined'&&process.argv[1]?.replace(/\\/g,'/').endsWith('/figures/math-worksheet.ts')){
  const result=runWorksheet(WORKSHEETS[0].source);
  console.log(JSON.stringify({total:result.total,location:result.location,spread:result.spread,...worksheetFigure(result)}));
}
