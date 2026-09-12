import { validatePlot, renderPlot } from '../../lib/workspace-plot';
import { validateCells, importCells } from '../../lib/workspace-notebook';

class PythonWorkspace extends HTMLElement {
  private cleanup?:()=>void;
  connectedCallback() {
    this.cleanup?.();
    const query=<T extends Element=HTMLElement>(selector:string)=>this.querySelector<T>(selector)!;
    const list=query('[data-cells]');
    const template=query<HTMLTemplateElement>('template');
    const cells=()=>[...list.querySelectorAll<HTMLElement>('[data-cell]')];
    const editor=(cell:HTMLElement)=>cell.querySelector<HTMLTextAreaElement>('textarea')!;
    const sources=()=>cells().map(cell=>editor(cell).value);
    const starter=sources();
    const status=query('.runtime-status'), storage=query('#code-storage'), result=query('[data-result-state]');
    const file=query<HTMLInputElement>('input[type=file]');
    const button=(name:string)=>query<HTMLButtonElement>(`[data-action="${name}"]`);
    const key='slop8412:workspace:notebook:v2';
    let worker:Worker|undefined, busy=false, timer=0, execution=0, nextID=100, revision=0;
    let active:HTMLElement|undefined;
    let queue:{cell:HTMLElement;code:string}[]=[];
    let runAll=false, runRevision=0;
    const controls=()=>{
      this.querySelectorAll<HTMLButtonElement>('[data-cell-action],[data-action=run],[data-action=add],[data-action=restore]').forEach(b=>b.disabled=busy);
      button('stop').disabled=!busy;
      this.querySelectorAll<HTMLButtonElement>('[data-cell-action=delete]').forEach(b=>b.disabled=busy||cells().length===1);
      file.disabled=busy;
    };
    const renumber=()=>cells().forEach((cell,index)=>{
      const label=cell.querySelector<HTMLLabelElement>('label')!;
      label.textContent=`Code cell ${index+1}`;
      cell.querySelector('[data-output]')!.setAttribute('aria-label',`Output of code cell ${index+1}`);
    });
    const create=(code:string,after?:HTMLElement)=>{
      const fragment=template.content.cloneNode(true) as DocumentFragment;
      const cell=fragment.querySelector<HTMLElement>('[data-cell]')!;
      const id=`cell-code-${nextID++}`;editor(cell).id=id;editor(cell).value=code;
      cell.querySelector('label')!.htmlFor=id;
      editor(cell).style.height=`${Math.min(24,Math.max(7,code.split('\n').length*1.3))}rem`;
      if(after)after.after(fragment);else list.append(fragment);
      renumber();controls();return cell;
    };
    const replace=(code:string[])=>{list.replaceChildren();code.forEach(c=>create(c));};
    try {
      const saved=localStorage.getItem(key);
      const legacy=localStorage.getItem('slop8412:workspace:sample-size:v1');
      if(saved!==null)replace(validateCells(JSON.parse(saved)));
      else if(legacy!==null)replace(validateCells([legacy]));
    } catch {status.textContent='Saved notebook could not be restored. The starter is available.';}
    const save=()=>{
      try{localStorage.setItem(key,JSON.stringify(validateCells(sources())));storage.textContent='Cells saved in this browser. Export a backup; browser data can be cleared.';}
      catch{storage.textContent='Notebook could not be saved (storage or size limit). Export your work before leaving.';}
    };
    const changed=()=>{
      revision++;save();result.textContent='Notebook changed · Run all to refresh';
      for(const cell of cells())if(cell.dataset.executed)cell.querySelector('[data-cell-status]')!.textContent='Previous output · notebook changed; rerun to verify.';
    };
    const terminate=()=>{
      worker?.terminate();worker=undefined;clearTimeout(timer);busy=false;queue=[];execution=0;
      if(active){active.querySelector('[data-cell-status]')!.textContent='Stopped. Variables cleared; code kept.';active=undefined;}
      for(const cell of cells()){
        cell.querySelector('[data-execution]')!.textContent='[ ]';
        if(cell.dataset.executed)cell.querySelector('[data-cell-status]')!.textContent='Historical output · runtime cleared; rerun this cell.';
      }
      controls();
    };
    const reset=()=>{terminate();status.textContent='Runtime reset. All cells kept; Python variables cleared.';result.textContent='Runtime cleared · previous plot retained';};
    const fail=(message:string)=>{terminate();status.textContent=message;};
    const sendNext=(resetNamespace=false)=>{
      const job=queue.shift();
      if(!job){busy=false;active=undefined;controls();status.textContent='Run complete.';result.textContent=runRevision!==revision?'Notebook changed during execution · Run all again':runAll?'Run all complete · current notebook':'Cell complete · shared state; Run all to verify notebook';return;}
      active=job.cell;
      const output=active.querySelector<HTMLElement>('[data-output]')!;
      const cellStatus=active.querySelector<HTMLElement>('[data-cell-status]')!;
      cellStatus.textContent='Starting…';output.textContent='Waiting for execution…';
      active.querySelector('[data-execution]')!.textContent='[*]';
      const start=performance.now();
      try {
        if(!worker){worker=new Worker(this.dataset.worker!,{type:'module'});worker.onerror=()=>fail('Python could not start. Check your connection and Run again; cells are kept.');}
        worker.onmessage=({data})=>{
          if(data.type==='status')status.textContent=data.text;
          if(data.type==='load-error'){output.textContent=(data.output||'')+'\n'+data.error;fail('Python download failed. Check your connection and Run again; cells are kept.');return;}
          if(data.type==='running'){
            clearTimeout(timer);execution++;job.cell.querySelector('[data-execution]')!.textContent=`[${execution}]`;
            cellStatus.textContent='Running…';status.textContent='Running Python… Stop & reset is available.';
            timer=window.setTimeout(()=>fail('Stopped after 30 seconds. Reduce the workload and rerun; cells are kept.'),30000);
          }
          if(data.type!=='done'&&data.type!=='error')return;
          clearTimeout(timer);job.cell.dataset.executed='true';
          output.textContent=(data.output||'(No printed output.)')+(data.output?.length>=60000?'\n[Output truncated at 60,000 characters]':'');
          if(data.type==='error'){
            output.textContent+='\n'+data.error;cellStatus.textContent='Python error. Earlier statements may have changed shared variables.';
            busy=false;active=undefined;queue=[];controls();status.textContent='Cell failed; remaining cells were not run. Fix it or reset the runtime.';result.textContent='Cell failed · previous plot retained';return;
          }
          try {
            if(data.plotChanged){
              const plot=validatePlot(data.plot);
              if(plot){renderPlot(query('[data-plot]'),plot);query('[data-plot-title]').textContent=plot.title;}
              else{query('[data-plot]').replaceChildren();query('[data-plot-title]').textContent='Plot cleared by this cell.';}
              query('[data-run-note]').textContent=`Plot from execution [${execution}], ${new Date().toLocaleTimeString()}. Individual cells share Python state; Run all rebuilds it in order.`;
            }
            cellStatus.textContent=editor(job.cell).value!==job.code?'Code edited during execution · output is out of date':`Completed in ${((performance.now()-start)/1000).toFixed(1)}s.`;
            sendNext();
          }catch(error){busy=false;active=undefined;queue=[];controls();status.textContent=String(error);cellStatus.textContent='Invalid plot; remaining cells were not run.';result.textContent='Invalid plot · previous results retained';}
        };
        timer=window.setTimeout(()=>fail('Runtime loading timed out. Retry when connected; cells are kept.'),90000);
        worker.postMessage({type:'run',code:job.code,reset:resetNamespace});
      }catch(error){fail(`Unable to run Python: ${String(error)}`);}
    };
    const run=(cell?:HTMLElement)=>{
      if(busy)return;
      try{validateCells(sources());}catch(error){status.textContent=String(error);return;}
      save();runAll=!cell;runRevision=revision;busy=true;controls();
      queue=(cell?[cell]:cells()).map(c=>({cell:c,code:editor(c).value}));
      if(runAll){execution=0;cells().forEach(c=>{delete c.dataset.executed;c.querySelector('[data-execution]')!.textContent='[ ]';c.querySelector('[data-cell-status]')!.textContent='Queued · previous output retained until execution.';});}
      status.textContent='Starting Python…';result.textContent='Running · previous plot retained';sendNext(runAll);
    };
    const download=()=>{
      // Preserve each source cell; the # %% markers also work in desktop editors.
      const text=sources().map(c=>`# %%\n${c}`).join('\n\n');
      const url=URL.createObjectURL(new Blob([text],{type:'text/x-python;charset=utf-8'}));
      const a=document.createElement('a');a.href=url;a.download='fid-experiment.py';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
    const events=new AbortController();const signal=events.signal;
    this.addEventListener('click',e=>{
      const target=(e.target as Element).closest<HTMLButtonElement>('button');if(!target||target.disabled)return;
      const cell=target.closest<HTMLElement>('[data-cell]');
      if(cell){
        const action=target.dataset.cellAction;
        if(action==='run')run(cell);
        if(action==='add'){if(cells().length>=50){status.textContent='Cell limit: 50.';return;}const added=create('',cell);changed();editor(added).focus();}
        if(action==='delete' && cells().length>1 && (!editor(cell).value.trim()||confirm('Delete this code cell? Export first to keep a copy. Shared Python variables remain until reset.'))){const index=cells().indexOf(cell);cell.remove();renumber();controls();changed();editor(cells()[Math.min(index,cells().length-1)]).focus();}
        return;
      }
      switch(target.dataset.action){
        case 'run':run();break;
        case 'stop':case 'restart':reset();break;
        case 'export':download();break;
        case 'add':if(cells().length<50){const added=create('');changed();editor(added).focus();}else status.textContent='Cell limit: 50.';break;
        case 'restore':if(confirm('Replace all cells with the starter? Export first to keep a copy.')){reset();replace(starter);changed();}break;
      }
    },{signal});
    list.addEventListener('input',changed,{signal});
    list.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();const cell=(e.target as Element).closest<HTMLElement>('[data-cell]');if(cell)run(cell);}},{signal});
    file.addEventListener('change',async()=>{
      const selected=file.files?.[0];file.value='';if(!selected)return;
      if(selected.size>200000){status.textContent='Import limit is 200 KB.';return;}
      try{const imported=importCells(await selected.text());if(!this.isConnected)return;
        if(!confirm('Replace all cells with this Python file? Export first to keep a copy.'))return;
        reset();replace(imported);changed();status.textContent='Imported Python cells. Review the code before running.';
      }catch(error){status.textContent=`Import failed; existing cells kept. ${String(error)}`;}
    },{signal});
    this.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(b=>b.disabled=false);controls();save();
    status.textContent='Ready. Run a cell with Ctrl / ⌘ + Enter. Run all starts with fresh variables.';
    this.cleanup=()=>{events.abort();terminate();};
  }
  disconnectedCallback(){this.cleanup?.();}
}
if(!customElements.get('python-workspace'))customElements.define('python-workspace',PythonWorkspace);
