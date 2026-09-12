export interface Plot {
  title: string;
  xLabel: string;
  yLabel: string;
  series: { name: string; points: [number, number][] }[];
}

export function validatePlot(value: unknown): Plot | null {
  if (value == null) return null;
  const p = value as Plot;
  if (!p || typeof p !== 'object' || ![p.title,p.xLabel,p.yLabel].every(s=>typeof s==='string' && s.length<=150) ||
    !Array.isArray(p.series) || p.series.length<1 || p.series.length>8 ||
    !p.series.every(s=>s && typeof s.name==='string' && s.name.length<=100 && Array.isArray(s.points) &&
      s.points.length>0 && s.points.length<=2000 && s.points.every(point=>Array.isArray(point) && point.length===2 && point.every(n=>typeof n==='number' && Number.isFinite(n))))) {
    throw new Error('Invalid plot: provide title, xLabel, yLabel and 1–8 named series with 1–2,000 finite [x, y] points each.');
  }
  return p;
}

export function plotBounds(plot: Plot) {
  const points = plot.series.flatMap(s=>s.points);
  const axis = (index: number) => {
    const values = points.map(p=>p[index]);
    let min=Math.min(...values), max=Math.max(...values);
    if(min===max){const gap=Math.abs(min)*.1 || 1;min-=gap;max+=gap;}
    if(!Number.isFinite(max-min))throw new Error('Plot coordinates exceed the supported numeric range.');
    return [min,max];
  };
  return {x:axis(0),y:axis(1)};
}

export function renderPlot(container: HTMLElement, plot: Plot) {
  const bounds=plotBounds(plot);
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 640 380');svg.setAttribute('role','img');
  svg.setAttribute('aria-label',`${plot.title}. ${plot.xLabel}; ${plot.yLabel}. Exact values follow in the data table.`);
  const add=(tag:string,attributes:Record<string,string>,text?:string)=>{
    const el=document.createElementNS(ns,tag);
    Object.entries(attributes).forEach(([k,v])=>el.setAttribute(k,v));
    if(text)el.textContent=text;svg.append(el);return el;
  };
  const x=(v:number)=>70+(v-bounds.x[0])/(bounds.x[1]-bounds.x[0])*540;
  const y=(v:number)=>315-(v-bounds.y[0])/(bounds.y[1]-bounds.y[0])*270;
  for(let i=0;i<=4;i++){
    const vx=bounds.x[0]+(bounds.x[1]-bounds.x[0])*i/4;
    const vy=bounds.y[0]+(bounds.y[1]-bounds.y[0])*i/4;
    add('line',{x1:'70',x2:'610',y1:String(y(vy)),y2:String(y(vy)),stroke:'currentColor',opacity:'.15'});
    add('text',{x:String(x(vx)),y:'338','text-anchor':'middle',fill:'currentColor','font-size':'13'},Number(vx.toPrecision(4)).toString());
    add('text',{x:'60',y:String(y(vy)+4),'text-anchor':'end',fill:'currentColor','font-size':'13'},Number(vy.toPrecision(3)).toString());
  }
  add('text',{x:'340',y:'369','text-anchor':'middle',fill:'currentColor','font-size':'14'},plot.xLabel);
  add('text',{x:'70',y:'22',fill:'currentColor','font-size':'14'},plot.yLabel);
  // CSS variables recolour existing plots immediately, without rerunning Python.
  const colours=['var(--ws-series-a)','var(--ws-series-b)','var(--ws-series-a)','var(--ws-series-b)','var(--ws-series-c)','var(--ws-series-d)','var(--ws-series-e)','var(--ws-series-f)'];
  plot.series.forEach((series,index)=>{
    add('polyline',{points:series.points.map(([a,b])=>`${x(a)},${y(b)}`).join(' '),fill:'none',stroke:colours[index],'stroke-width':'2.5','stroke-dasharray':index>=2?'6 5':'none'});
    series.points.forEach(([a,b])=>add('circle',{cx:String(x(a)),cy:String(y(b)),r:index%2?'3':'4',fill:colours[index]}));
  });
  container.replaceChildren(svg);
  const legend=document.createElement('ul');legend.className='plot-legend';
  plot.series.forEach((s,i)=>{const li=document.createElement('li');li.textContent=`${i>=2?'┄':'━'} ${s.name}`;li.style.color=colours[i];legend.append(li);});
  container.append(legend);
  const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Exact plot data';details.append(summary);
  const wrap=document.createElement('div');wrap.className='plot-table';
  const table=document.createElement('table');const caption=document.createElement('caption');caption.textContent=plot.title;table.append(caption);
  const head=document.createElement('thead');const tr=document.createElement('tr');
  for(const text of ['Series',plot.xLabel,plot.yLabel]){const th=document.createElement('th');th.scope='col';th.textContent=text;tr.append(th);}head.append(tr);table.append(head);
  const body=document.createElement('tbody');
  for(const s of plot.series)for(const [a,b] of s.points){const row=document.createElement('tr');for(const text of [s.name,String(a),String(b)]){const td=document.createElement('td');td.textContent=text;row.append(td);}body.append(row);}
  table.append(body);wrap.append(table);details.append(wrap);container.append(details);
}
