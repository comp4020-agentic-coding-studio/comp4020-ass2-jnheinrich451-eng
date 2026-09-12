import {INITIAL,TARGET,TOLERANCE,distance,setParameter,lockScore,curves,pixelX,clamp,type LabState,type Construction} from '../../../figures/math-lab';

class MathLab extends HTMLElement {
  private cleanup?:()=>void;
  connectedCallback(){
    this.cleanup?.();
    const q=<T extends Element=HTMLElement>(s:string)=>this.querySelector<T>(s)!;
    let state={...INITIAL};
    const history:LabState[]=[];
    const pins:Construction[]=[];
    const feedback=q('.lab-feedback');
    const svg=q<SVGSVGElement>('[data-density]');
    const fmt=(n:number)=>Math.abs(n)<.00005?'0.0000':n.toFixed(4);
    const bounds=(key:'mu'|'sigma')=>key==='mu'?(state.locked?[-2,2]:[-3,3]):(state.locked?[1,3]:[.25,3.5]);
    const record=(previous:LabState)=>{history.push({...previous});if(history.length>100)history.shift();};
    const render=(message?:string)=>{
      const score=distance(state),graph=curves(state,pins);
      q('[data-total]').textContent=fmt(score.total);q('[data-location]').textContent=fmt(score.location);q('[data-spread]').textContent=fmt(score.spread);
      q('[data-residual]').textContent=fmt(score.total-TARGET);q('[data-current-mu]').textContent=fmt(state.mu);q('[data-current-sigma]').textContent=fmt(state.sigma);q('[data-variance]').textContent=fmt(state.sigma**2);
      q('[data-substitution]').textContent=`= (${fmt(state.mu)})² + (${fmt(state.sigma)} − 1)² = ${fmt(score.total)}`;
      q('[data-reference]').setAttribute('d',graph.paths[0]);q('[data-candidate]').setAttribute('d',graph.paths[1]);
      this.querySelectorAll('[data-y-label]').forEach((el,i)=>el.textContent=(graph.maxY*i/4).toFixed(2));
      const pinnedCurves=q('[data-pinned-curves]');pinnedCurves.replaceChildren();
      pins.forEach((_,i)=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',graph.paths[i+2]);p.setAttribute('fill','none');p.setAttribute('stroke',`var(--lab-pin${i+1})`);p.setAttribute('stroke-width','2');p.setAttribute('stroke-dasharray',i?'3 5':'8 5');pinnedCurves.append(p);});
      q('[data-handle=mu]').setAttribute('cx',String(pixelX(state.mu)));q('[data-handle=sigma]').setAttribute('x',String(pixelX(state.mu+state.sigma)-9));
      q('[data-spread-line]').setAttribute('x1',String(pixelX(state.mu)));q('[data-spread-line]').setAttribute('x2',String(pixelX(state.mu+state.sigma)));
      for(const key of ['mu','sigma'] as const){
        const [min,max]=bounds(key);
        for(const type of ['number','range']){const input=q<HTMLInputElement>(`[data-${type}=${key}]`);input.min=String(min);input.max=String(max);input.value=String(state[key]);input.setCustomValidity('');}
        const handle=q<SVGElement>(`[data-handle=${key}]`);handle.setAttribute('aria-valuenow',String(state[key]));handle.setAttribute('aria-valuemin',String(min));handle.setAttribute('aria-valuemax',String(max));handle.setAttribute('aria-valuetext',fmt(state[key]));
      }
      q<HTMLInputElement>('[data-lock]').checked=state.locked;q('[data-side-label]').hidden=!state.locked;q<HTMLSelectElement>('[data-side]').value=String(state.side);
      q('[data-constraint]').textContent=state.locked?'Locked to D = 4 on the σ ≥ 1 branch. Editing μ adjusts σ; editing σ adjusts μ on your selected mean branch. This is only part of the full solution set.':'Free mode: −3 ≤ μ ≤ 3; 0.25 ≤ σ ≤ 3.5. σ is standard deviation, not variance.';
      q<HTMLButtonElement>('[data-action=undo]').disabled=history.length===0;q<HTMLButtonElement>('[data-action=pin]').disabled=pins.length>=2;
      feedback.textContent=message??(state.locked?'Score fixed at 4. Change the distribution and inspect how its contributions trade off.':Math.abs(score.total-TARGET)<=TOLERANCE?'Target reached within 0.01. Pin this construction, then find a different one.':'Try to reach 4. Change the mean, the spread, or both.');
    };
    const update=(key:'mu'|'sigma',value:number,remember=true)=>{if(remember)record(state);state=setParameter(state,key,value);render();};
    const renderPins=()=>{
      const list=q('[data-pins]');list.replaceChildren();q('[data-empty-pins]').hidden=pins.length>0;
      const legend=q('[data-pin-legend]');legend.replaceChildren();
      pins.forEach((p,i)=>{
        const item=document.createElement('span');item.textContent=`┄ Pin ${i+1}`;item.style.color=`var(--lab-pin${i+1})`;legend.append(item);
        const score=distance(p),article=document.createElement('article'),heading=document.createElement('strong'),text=document.createElement('p'),remove=document.createElement('button');
        heading.textContent=`Pinned ${i+1}`;text.textContent=`μ = ${fmt(p.mu)} · σ = ${fmt(p.sigma)} · D = ${fmt(score.total)} = ${fmt(score.location)} mean + ${fmt(score.spread)} spread`;
        remove.textContent=`Remove pin ${i+1}`;remove.dataset.removePin=String(i);article.append(heading,text,remove);list.append(article);
      });
    };
    const events=new AbortController();const signal=events.signal;
    for(const key of ['mu','sigma'] as const){
      q<HTMLInputElement>(`[data-range=${key}]`).addEventListener('input',e=>update(key,(e.target as HTMLInputElement).valueAsNumber),{signal});
      q<HTMLInputElement>(`[data-number=${key}]`).addEventListener('change',e=>{
        const input=e.target as HTMLInputElement,value=input.valueAsNumber,[min,max]=bounds(key);
        if(!Number.isFinite(value)||value<min||value>max){input.setCustomValidity(`Enter a value between ${min} and ${max}.`);input.reportValidity();feedback.textContent=`No change applied. Enter ${key==='mu'?'mean':'standard deviation'} between ${min} and ${max}.`;return;}
        update(key,value);
      },{signal});
    }
    q<HTMLInputElement>('[data-lock]').addEventListener('change',e=>{record(state);state=lockScore(state,(e.target as HTMLInputElement).checked);render();},{signal});
    q<HTMLSelectElement>('[data-side]').addEventListener('change',e=>{record(state);state.side=(e.target as HTMLSelectElement).value==='-1'?-1:1;state.mu=Math.abs(state.mu)*state.side;render();},{signal});
    this.addEventListener('click',e=>{
      const button=(e.target as Element).closest<HTMLButtonElement>('button');if(!button||button.disabled)return;
      if(button.dataset.removePin!==undefined){pins.splice(Number(button.dataset.removePin),1);renderPins();render();q<HTMLButtonElement>('[data-action=pin]').focus();return;}
      if(button.dataset.action==='undo'){const old=history.pop();if(old)state=old;render();}
      if(button.dataset.action==='reset'){record(state);state={...INITIAL};render('Construction reset. Pinned comparisons are kept.');}
      if(button.dataset.action==='pin'&&pins.length<2){pins.push({mu:state.mu,sigma:state.sigma});renderPins();render('Construction pinned. Its parameters and score will stay fixed.');}
    },{signal});
    let drag:{key:'mu'|'sigma';id:number;before:LabState;target:SVGElement}|undefined;
    const valueAt=(e:PointerEvent)=>{
      const point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;const matrix=svg.getScreenCTM();
      return matrix?(point.matrixTransform(matrix.inverse()).x-55)/700*16-8:state.mu;
    };
    const endDrag=(cancel=false)=>{if(!drag)return;const previous=drag.before;
      if(cancel)state=previous;else if(state.mu!==previous.mu||state.sigma!==previous.sigma)record(previous);
      if(drag.target.hasPointerCapture(drag.id))drag.target.releasePointerCapture(drag.id);drag=undefined;render();
    };
    this.querySelectorAll<SVGElement>('[data-handle]').forEach(handle=>{
      const key=handle.dataset.handle as 'mu'|'sigma';
      handle.tabIndex=0;handle.removeAttribute('aria-disabled');
      handle.addEventListener('pointerdown',e=>{if(drag||e.button!==0)return;e.preventDefault();handle.focus();drag={key,id:e.pointerId,before:{...state},target:handle};handle.setPointerCapture(e.pointerId);},{signal});
      handle.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const v=valueAt(e);update(key,key==='mu'?v:v-drag.before.mu,false);},{signal});
      handle.addEventListener('pointerup',()=>endDrag(),{signal});handle.addEventListener('pointercancel',()=>endDrag(true),{signal});
      handle.addEventListener('keydown',e=>{
        const [min,max]=bounds(key);let value=state[key];
        if(e.key==='Home')value=min;else if(e.key==='End')value=max;
        else if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp'].includes(e.key))value+=(['ArrowLeft','ArrowDown'].includes(e.key)?-1:1)*(e.shiftKey?.1:.01);else return;
        e.preventDefault();update(key,clamp(value,min,max));
      },{signal});
    });
    this.querySelectorAll<HTMLInputElement|HTMLButtonElement>('input,button').forEach(el=>el.disabled=false);
    render();this.cleanup=()=>events.abort();
  }
  disconnectedCallback(){this.cleanup?.();}
}
if(!customElements.get('math-lab'))customElements.define('math-lab',MathLab);
