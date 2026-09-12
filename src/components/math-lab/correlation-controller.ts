import {CORRELATION_INITIAL,correlationFigure,parseCovariance,matrixText,withCorrelation,type Covariance} from '../../../figures/correlation-lab';
class CorrelationLab extends HTMLElement {
  private cleanup?:()=>void;
  connectedCallback(){
    this.cleanup?.();const events=new AbortController(),{signal}=events;
    const q=<T extends Element=HTMLElement>(selector:string)=>this.querySelector<T>(selector)!;
    let matrix:Covariance=CORRELATION_INITIAL;const history:Covariance[]=[];
    const editor=q<HTMLTextAreaElement>('[data-corr-matrix]'),status=q('[data-corr-status]');
    const fmt=(n:number)=>n.toFixed(6),short=(n:number)=>Number(n.toPrecision(6)).toString();
    const render=(message='Calculated locally. Change correlation to compare joint structure with marginal curves.')=>{
      const figure=correlationFigure(matrix),m=figure.metrics;
      editor.value=matrixText(matrix);editor.setCustomValidity('');
      q<HTMLInputElement>('[data-corr-rho]').value=String(Number(m.rho.toPrecision(12)));q<HTMLInputElement>('[data-corr-rho]').setCustomValidity('');q<HTMLInputElement>('[data-corr-slider]').value=String(m.rho);
      q('[data-corr-full]').textContent=fmt(m.full);q('[data-corr-marginal]').textContent=fmt(m.marginalTotal);
      q('[data-corr-verdict]').textContent=m.full<1e-12?'The joint distributions match. Full and marginal distances are zero.':m.marginalTotal<1e-12?'Both marginal distances are zero, yet the full distance is positive. The difference is in covariance.':Math.abs(m.rho)<1e-12?'No cross-coordinate covariance. Here the full distance equals the sum of the marginal distances.':'Both spread and cross-coordinate covariance changed. The marginal-only sum does not capture the full distance.';
      figure.jointPaths[1].forEach((path,i)=>q(`[data-corr-contour="${i}"]`).setAttribute('d',path));
      q('#corr-joint-desc').textContent=`Reference covariance is the identity. Candidate variances ${short(m.variances[0])} and ${short(m.variances[1])}, correlation ${short(m.rho)}. Contours at Mahalanobis radii 1 and 2; both axes fixed from −6 to 6.`;
      [0,1].forEach(i=>{
        q(`[data-corr-coordinate="${i}"]`).textContent=fmt(m.marginal[i]);
        q(`[data-corr-ref-marginal="${i}"]`).setAttribute('d',figure.marginalPaths[i][0]);q(`[data-corr-gen-marginal="${i}"]`).setAttribute('d',figure.marginalPaths[i][1]);
        const note=`Mean 0 for both. R variance 1; G variance ${short(m.variances[i])}. Density axis: 0 to ${short(figure.maxY[i])}.`;
        q(`[data-corr-marginal-note="${i}"]`).textContent=note;q(`#corr-marginal-${i}`).textContent=`Coordinate ${i+1}: ${note}`;
      });
      q('[data-corr-algebra]').textContent=`Eigenvalues of ΣG: ${m.eigenvalues.map(short).join(', ')}\nD = (√${short(m.eigenvalues[0])} − 1)² + (√${short(m.eigenvalues[1])} − 1)²\nFull squared distance = ${fmt(m.full)}\nMarginal-only sum = ${fmt(m.marginal[0])} + ${fmt(m.marginal[1])} = ${fmt(m.marginalTotal)}\nCorrelation ρ = ${short(m.rho)}; determinant = ${short(m.determinant)}`;
      q<HTMLButtonElement>('[data-corr-undo]').disabled=!history.length;status.textContent=message;
    };
    const update=(next:Covariance,message?:string)=>{history.push(matrix);if(history.length>100)history.shift();matrix=next;render(message);};
    editor.addEventListener('input',()=>{editor.setCustomValidity('');status.textContent='Matrix edited, not applied. Plots and scores still describe the previous valid matrix. Apply it, or use another control to replace this draft.';},{signal});
    const apply=()=>{try{update(parseCovariance(editor.value));}catch(error){editor.setCustomValidity((error as Error).message);status.textContent=`Not applied: ${(error as Error).message} Previous valid plots and scores are kept.`;}};
    q('[data-corr-apply]').addEventListener('click',apply,{signal});
    editor.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();apply();}},{signal});
    const setRho=(input:HTMLInputElement)=>{try{update(withCorrelation(matrix,input.valueAsNumber));}catch(error){input.setCustomValidity((error as Error).message);status.textContent=`Not applied: ${(error as Error).message} Previous valid plots and scores are kept.`;}};
    q<HTMLInputElement>('[data-corr-rho]').addEventListener('change',event=>setRho(event.target as HTMLInputElement),{signal});
    q<HTMLInputElement>('[data-corr-slider]').addEventListener('input',event=>setRho(event.target as HTMLInputElement),{signal});
    this.querySelectorAll<HTMLButtonElement>('[data-corr-preset]').forEach(button=>button.addEventListener('click',()=>update(withCorrelation([[1,0],[0,1]],Number(button.dataset.corrPreset)),'Preset applied: both variances are 1. Compare the full score with the unchanged marginal scores.'),{signal}));
    q('[data-corr-undo]').addEventListener('click',()=>{const previous=history.pop();if(previous){matrix=previous;render('Previous construction restored.');}},{signal});
    this.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLTextAreaElement>('button,input,textarea').forEach(control=>control.disabled=false);
    render();this.cleanup=()=>events.abort();
  }
  disconnectedCallback(){this.cleanup?.();}
}
if(!customElements.get('correlation-lab'))customElements.define('correlation-lab',CorrelationLab);
