import {WORKSHEETS,runWorksheet,applySolution,formatNumber,type WorksheetResult} from '../../lib/math-worksheet';
import {worksheetFigure} from '../../../figures/math-worksheet';
const STORAGE='slop8412:math-worksheet:v1';
class MathWorksheet extends HTMLElement {
  private cleanup?:()=>void;
  connectedCallback(){
    this.cleanup?.();
    const q=<T extends Element=HTMLElement>(s:string)=>this.querySelector<T>(s)!;
    const source=q<HTMLTextAreaElement>('[data-source]'),status=q('[data-status]'),live=q<HTMLInputElement>('[data-live]');
    const dimension=q<HTMLSelectElement>('[data-dimension]');
    const events=new AbortController(),{signal}=events;let timer:ReturnType<typeof setTimeout>|undefined;
    let result:WorksheetResult|undefined,lastSource='',lastEdit=source.value,storageAvailable=true;
    const history:string[]=[];
    const remember=()=>{if(history.at(-1)!==lastEdit){history.push(lastEdit);if(history.length>60)history.shift();}lastEdit=source.value;q<HTMLButtonElement>('[data-undo]').disabled=history.length===0;};
    const el=<K extends keyof HTMLElementTagNameMap>(tag:K,text:string)=>{const node=document.createElement(tag);node.textContent=text;return node;};
    const markStale=()=>{
      q('[data-stale]').hidden=false;
      this.querySelectorAll<HTMLButtonElement>('[data-root]').forEach(button=>button.disabled=true);
      status.textContent=live.checked?'Edited. Waiting to recalculate…':'Edited. Evaluate to update the previous result.';
    };
    const draw=()=>{
      if(!result)return;const d=Number(dimension.value)||0,figure=worksheetFigure(result,d),f=formatNumber;
      q('[data-ws-reference]').setAttribute('d',figure.paths[0]);q('[data-ws-candidate]').setAttribute('d',figure.paths[1]);
      this.querySelectorAll('[data-x-tick]').forEach((tick,i)=>tick.textContent=f(figure.lo+(figure.hi-figure.lo)*i/4));
      const r=result.reference,g=result.candidate;
      q('#worksheet-plot-desc').textContent=`Coordinate ${d+1}. R: mean ${f(r.mean[d])}, sd ${f(r.sd[d])}. G: mean ${f(g.mean[d])}, sd ${f(g.sd[d])}.`;
      q('[data-axis-note]').textContent=`Coordinate ${d+1}: R (mean ${f(r.mean[d])}, sd ${f(r.sd[d])}); G (mean ${f(g.mean[d])}, sd ${f(g.sd[d])}). Density axis: 0 to ${f(figure.maxY)}. Both axes adapt; tails continue beyond view. This marginal is not the full multivariate density.`;
    };
    const render=()=>{
      if(!result)return;const f=formatNumber;
      q('[data-worksheet-total]').textContent=f(result.total);q('[data-dimensions]').textContent=`${result.location.length} dimension${result.location.length===1?'':'s'}`;
      const old=dimension.value;dimension.replaceChildren(...result.location.map((_,i)=>{const option=el('option',`Coordinate ${i+1}`);option.value=String(i);return option;}));dimension.value=Number(old)<result.location.length?old:'0';draw();
      q('[data-contributions]').replaceChildren(...result.location.map((location,i)=>{
        const row=document.createElement('tr'),heading=el('th',String(i+1));heading.scope='row';
        row.append(heading,el('td',f(location)),el('td',f(result!.spread[i])),el('td',f(location+result!.spread[i])));return row;
      }));
      q('[data-values]').textContent=result.values.map(({name,value})=>`${name} = ${f(value)}`).join('\n');
      const commands=q('[data-command-results]');commands.replaceChildren();
      for(const command of result.commands){
        const card=document.createElement('article');card.append(el('h4',command.source));
        if(command.kind==='check'){
          card.append(el('p',`${command.passes?'Agreement':'Disagreement'} at this construction: ${f(command.left)} versus ${f(command.right)}.`),el('p','Numerical check only, not proof of an identity. Change the parameters and try to break the agreement. Relative tolerance: 10⁻⁹.'));
        }else{
          const s=command.solution;
          card.append(el('p',s.identity?'Identity on the valid domain; no unique root to apply.':s.roots.length?`${s.roots.length} admissible real solution${s.roots.length===1?'':'s'}. Applying one changes your definition above.`:'No admissible real solutions.'));
          for(const root of s.roots){const button=el('button',`Apply ${s.variable} = ${f(root)}`);button.dataset.root=String(root);button.dataset.variable=s.variable;card.append(button);}
          if(s.excluded.length)card.append(el('p',`Excluded after domain/residual checks: ${s.excluded.map(f).join(', ')}. All standard deviations must remain between 0.01 and 1000; |mean| ≤ 1000.`));
          const details=document.createElement('details'),steps=document.createElement('ol');steps.append(...s.steps.map(step=>el('li',step)));details.append(el('summary','Show the algebra'),steps);card.append(details);
        }
        commands.append(card);
      }
      if(!result.commands.length)commands.append(el('p','Add “solve D = 4 for m” or “check D = your_expression” to interrogate this construction.'));
    };
    const evaluate=()=>{
      clearTimeout(timer);
      try{
        const next=runWorksheet(source.value);result=next;lastSource=source.value;render();q('[data-stale]').hidden=true;
        try{localStorage.setItem(STORAGE,source.value);}catch{storageAvailable=false;}
        status.textContent=`Evaluated locally. ${next.commands.length} command${next.commands.length===1?'':'s'} checked. ${storageAvailable?'Last valid worksheet saved in this browser.':'Browser storage unavailable; copy your work before leaving.'}`;
      }catch(error){markStale();status.textContent=`Not applied. ${(error as Error).message} Previous successful output is kept.`;}
    };
    const replace=(text:string)=>{source.value=text;remember();evaluate();};
    const schedule=()=>{clearTimeout(timer);markStale();if(live.checked)timer=setTimeout(evaluate,500);};
    source.addEventListener('input',()=>{remember();schedule();},{signal});
    source.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();evaluate();}},{signal});
    q('[data-run]').addEventListener('click',evaluate,{signal});
    live.addEventListener('change',()=>{clearTimeout(timer);if(live.checked)evaluate();},{signal});
    dimension.addEventListener('change',draw,{signal});
    q('[data-load]').addEventListener('click',()=>{
      if(source.value!==WORKSHEETS[0].source&&!confirm('Replace the editor with this example? You can undo this change.'))return;
      const example=WORKSHEETS[Number(q<HTMLSelectElement>('[data-example]').value)];q('[data-question]').textContent=example.question;replace(example.source);
    },{signal});
    q('[data-undo]').addEventListener('click',()=>{const previous=history.pop();if(previous===undefined)return;source.value=previous;lastEdit=previous;q<HTMLButtonElement>('[data-undo]').disabled=history.length===0;evaluate();},{signal});
    q('[data-clear]').addEventListener('click',()=>{
      if(!confirm('Reset this worksheet and its saved copy to the starter?'))return;
      try{localStorage.removeItem(STORAGE);}catch{storageAvailable=false;}
      q('[data-question]').textContent=WORKSHEETS[0].question;q<HTMLSelectElement>('[data-example]').value='0';replace(WORKSHEETS[0].source);
    },{signal});
    q('[data-command-results]').addEventListener('click',event=>{
      const button=(event.target as Element).closest<HTMLButtonElement>('[data-root]');if(!button||button.disabled||source.value!==lastSource)return;
      replace(applySolution(source.value,button.dataset.variable!,Number(button.dataset.root)));source.focus();
    },{signal});
    this.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLSelectElement|HTMLTextAreaElement>('input,button,select,textarea').forEach(control=>control.disabled=false);
    q<HTMLButtonElement>('[data-undo]').disabled=true;
    try{const saved=localStorage.getItem(STORAGE);if(saved){runWorksheet(saved);source.value=saved;lastEdit=saved;q('[data-question]').textContent='Restored your last valid worksheet. Edit its definitions or load a starting question.';}}catch{storageAvailable=false;}
    evaluate();this.cleanup=()=>{clearTimeout(timer);events.abort();};
  }
  disconnectedCallback(){this.cleanup?.();}
}
if(!customElements.get('math-worksheet'))customElements.define('math-worksheet',MathWorksheet);
