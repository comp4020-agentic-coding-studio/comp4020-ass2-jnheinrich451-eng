/** Exact zero-mean 2D Gaussian experiment against R = N(0, I).
 * Run `node figures/correlation-lab.ts` to print every plotted point and score. */
export type Covariance = [[number,number],[number,number]];
export const CORRELATION_INITIAL:Covariance=[[1,.8],[.8,1]];
export function validateCovariance(matrix:unknown):Covariance {
  if(!Array.isArray(matrix)||matrix.length!==2||matrix.some(row=>!Array.isArray(row)||row.length!==2||row.some(n=>typeof n!=='number'||!Number.isFinite(n))))throw new Error('Enter a 2 × 2 matrix of finite numbers, for example [[1, 0.8], [0.8, 1]].');
  const [[a,b],[c,d]]=matrix as Covariance;
  if(b!==c)throw new Error('A covariance matrix must be symmetric: the two off-diagonal entries must match.');
  if(a<.05||d<.05||a>4||d>4)throw new Error('This experiment supports diagonal variances from 0.05 to 4. These entries are variances, not standard deviations.');
  if(a*d-b*b<=0)throw new Error('The matrix must be positive definite: covariance² must be smaller than variance 1 × variance 2.');
  if(Math.abs(b/Math.sqrt(a*d))>.980000000001)throw new Error('Keep correlation between −0.98 and +0.98 in this experiment; singular limits are excluded.');
  return [[a,b],[c,d]];
}
export function parseCovariance(source:string):Covariance {
  if(source.length>500)throw new Error('Keep the matrix within 500 characters.');
  let value:unknown;try{value=JSON.parse(source);}catch{throw new Error('Use a numeric matrix such as [[1, 0.8], [0.8, 1]]. Expressions and trailing commas are not supported here.');}
  return validateCovariance(value);
}
export const matrixText=(m:Covariance)=>`[[${m[0][0]}, ${m[0][1]}],\n [${m[1][0]}, ${m[1][1]}]]`;
export function withCorrelation(matrix:Covariance,rho:number):Covariance {
  validateCovariance(matrix);
  if(!Number.isFinite(rho)||Math.abs(rho)>.98)throw new Error('Enter correlation between −0.98 and +0.98.');
  const a=matrix[0][0],d=matrix[1][1],b=rho*Math.sqrt(a*d);
  return validateCovariance([[a,b],[b,d]]);
}
export function correlationMetrics(matrix:Covariance){
  const [[a,b],[,d]]=validateCovariance(matrix);
  const determinant=a*d-b*b;
  const high=(a+d+Math.hypot(a-d,2*b))/2,low=determinant/high;
  const eigenvalues=[low,high];
  const full=eigenvalues.reduce((sum,lambda)=>sum+(Math.sqrt(lambda)-1)**2,0);
  const marginal=[(Math.sqrt(a)-1)**2,(Math.sqrt(d)-1)**2];
  return {full,marginal,marginalTotal:marginal[0]+marginal[1],rho:b/Math.sqrt(a*d),determinant,eigenvalues,variances:[a,d]};
}
export function contourPoints(matrix:Covariance,radius:number){
  const [[a,b],[,d]]=validateCovariance(matrix),l00=Math.sqrt(a),l10=b/l00,l11=Math.sqrt(d-l10*l10);
  return Array.from({length:181},(_,i)=>{
    const angle=2*Math.PI*i/180,x=radius*Math.cos(angle),y=radius*Math.sin(angle);
    return [l00*x,l10*x+l11*y] as [number,number];
  });
}
export function correlationFigure(matrix:Covariance){
  const metrics=correlationMetrics(matrix),reference:Covariance=[[1,0],[0,1]];
  const joint=[reference,matrix].map(cov=>[1,2].map(radius=>contourPoints(cov,radius)));
  const jointPaths=joint.map(contours=>contours.map(points=>points.map(([x,y],i)=>`${i?'L':'M'}${(260+x*35).toFixed(3)},${(240-y*35).toFixed(3)}`).join(' ')+' Z'));
  const marginalPoints=metrics.variances.map(variance=>[1,variance].map(v=>Array.from({length:241},(_,i)=>{
    const x=-6+i*.05;return [x,Math.exp(-x*x/(2*v))/Math.sqrt(2*Math.PI*v)] as [number,number];
  })));
  const maxY=metrics.variances.map(v=>Math.max(1,1/Math.sqrt(v))/Math.sqrt(2*Math.PI)*1.15);
  const marginalPaths=marginalPoints.map((pair,d)=>pair.map(points=>points.map(([x,y],i)=>`${i?'L':'M'}${(35+(x+6)*27.5).toFixed(3)},${(125-y/maxY[d]*100).toFixed(3)}`).join(' ')));
  return {metrics,joint,jointPaths,marginalPoints,marginalPaths,maxY};
}
if(typeof process!=='undefined'&&process.argv[1]?.replace(/\\/g,'/').endsWith('/correlation-lab.ts'))console.log(JSON.stringify(correlationFigure(CORRELATION_INITIAL)));
