/** Full empirical Gaussian distance via sample factors, not diagonal covariance.
 * If Cx=XᵀX and Cy=YᵀY, the covariance cross term is ||XYᵀ||_*.
 * X and Y are centred features divided by sqrt(n-1). This avoids a 2048²
 * square root without changing the feature space or dropping correlations.
 */
export interface ImageDistance {mean:number;covariance:number;total:number}

/** Average squared feature-vector distance under an explicit pairing; NOT FID. */
export function pairedFeatureDistance(a:number[][],b:number[][],order:number[]):number {
  if(a.length!==b.length||order.length!==a.length||new Set(order).size!==a.length||
    order.some(i=>!Number.isInteger(i)||i<0||i>=b.length))throw new Error('Invalid candidate permutation.');
  if(!a.length||a.some((row,i)=>!row.length||row.length!==b[order[i]].length||row.some((v,j)=>!Number.isFinite(v+b[order[i]][j]))))throw new Error('Invalid paired features.');
  return a.reduce((sum,row,i)=>sum+row.reduce((s,v,j)=>s+(v-b[order[i]][j])**2,0),0)/a.length;
}

export function shuffledOrder(order:number[],random= Math.random):number[]{
  const next=order.slice();
  for(let i=next.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[next[i],next[j]]=[next[j],next[i]];}
  // Make the action visibly change order even if the random draw was unchanged.
  if(next.length>1&&next.every((v,i)=>v===order[i]))next.push(next.shift()!);
  return next;
}

function nuclearNorm(matrix:number[][]):number {
  const a=matrix.map(row=>row.slice()),rows=a.length,cols=a[0].length;
  // One-sided Jacobi SVD. Orthogonal rotations preserve singular values.
  for(let sweep=0;sweep<100;sweep++){
    let changed=false;
    for(let p=0;p<cols;p++)for(let q=p+1;q<cols;q++){
      let alpha=0,beta=0,gamma=0;
      for(let i=0;i<rows;i++){alpha+=a[i][p]**2;beta+=a[i][q]**2;gamma+=a[i][p]*a[i][q];}
      if(Math.abs(gamma)<=1e-13*Math.sqrt(alpha*beta)||alpha<1e-28||beta<1e-28)continue;
      changed=true;
      const tau=(beta-alpha)/(2*gamma);
      const t=(tau>=0?1:-1)/(Math.abs(tau)+Math.hypot(1,tau));
      const c=1/Math.hypot(1,t),s=c*t;
      for(let i=0;i<rows;i++){const x=a[i][p],y=a[i][q];a[i][p]=c*x-s*y;a[i][q]=s*x+c*y;}
    }
    if(!changed)return Array.from({length:cols},(_,j)=>Math.hypot(...a.map(row=>row[j]))).reduce((x,y)=>x+y,0);
  }
  throw new Error('Covariance calculation did not converge. No score reported.');
}

export function imageDistance(a:number[][],b:number[][]):ImageDistance {
  const dimensions=a[0]?.length;
  if(!dimensions||a.length<2||b.length<2||a.length>64||b.length>64||
    [...a,...b].some(row=>row.length!==dimensions||row.some(v=>!Number.isFinite(v))))
    throw new Error('Expected 2–64 finite, equally sized feature vectors per set.');
  const factor=(data:number[][])=>{
    const mean=Array.from({length:dimensions},(_,j)=>data.reduce((sum,row)=>sum+row[j],0)/data.length);
    const centred=data.map(row=>row.map((v,j)=>(v-mean[j])/Math.sqrt(data.length-1)));
    const trace=centred.reduce((sum,row)=>sum+row.reduce((t,v)=>t+v*v,0),0);
    return {mean,centred,trace};
  };
  const x=factor(a),y=factor(b);
  const mean=x.mean.reduce((sum,v,j)=>sum+(v-y.mean[j])**2,0);
  const cross=x.centred.map(row=>y.centred.map(other=>row.reduce((sum,v,j)=>sum+v*other[j],0)));
  let covariance=x.trace+y.trace-2*nuclearNorm(cross);
  const tolerance=1e-10*Math.max(1,x.trace+y.trace);
  if(covariance < -tolerance||!Number.isFinite(covariance+mean))throw new Error('Numerically invalid distance. No score reported.');
  if(Math.abs(covariance)<tolerance)covariance=0;
  return {mean,covariance,total:mean+covariance};
}
