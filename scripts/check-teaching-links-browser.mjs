// Read-to-experiment handoff regression. Set TEACHING_BASE to select the server.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'slop-teaching-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9252',`--user-data-dir=${profile}`],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));await pause(1800);
const pages=await(await fetch('http://localhost:9252/json')).json(),ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const jobs=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){jobs.get(m.id)?.(m);jobs.delete(m.id);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const until=async expression=>{for(let i=0;i<60;i++){if(await ev(expression))return;await pause(150);}throw new Error('Timed out: '+expression);};
const base=process.env.TEACHING_BASE??'http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
try{
 await call('Page.enable');
 for(const [width,height] of [[1920,1080],[800,1000],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  for(const [path,target] of [['sessions/02-frechet-distance/','math-lab/#correlation'],['lectures/week-02/','math-lab/#correlation'],['sessions/03-the-instrument/','image-lab/'],['sessions/05-the-bias/','workspace/'],['sessions/05-the-bias/','lectures/week-05/'],['sessions/06-blind-spots/','assessments/measurement-log/'],['assessments/measurement-log/','lectures/week-05/'],['sessions/04-getting-it-right/','image-lab/'],['sessions/08-video/','lectures/week-08/'],['sessions/12-what-you-would-report-instead/','assessments/final-report/#in-person']]){
   await call('Page.navigate',{url:base+path});await until(`location.pathname.endsWith('/${path}') && !!document.querySelector('main a[href$="/${target}"]')`);await pause(350);
   const selector=`main a[href$="/${target}"]`;
   await ev(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({behavior:'instant',block:'center'})`);await pause(200);
   for(const theme of ['light','dark']){
    await ev(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
    await pause(100);
    const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`build/teaching-${path.replaceAll('/','-')}${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
   }
   const overflow=await ev(`({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,100),right:e.getBoundingClientRect().right}))})`);
   assert.ok(overflow.scroll<=overflow.width,`${path} at ${width}px: ${JSON.stringify(overflow)}`);
   await ev(`document.querySelector(${JSON.stringify(selector)}).click()`);
   const ready=target.startsWith('math-lab')?"document.querySelector('[data-corr-apply]') && !document.querySelector('[data-corr-apply]').disabled":target==='lectures/week-05/'?"document.querySelector('[data-xp-ready=\"true\"]')":target.startsWith('lectures/')?"document.querySelector('[data-xi-run]')":target==='assessments/measurement-log/'?"document.querySelector('#when-fid-enters-the-log')":target==='assessments/final-report/#in-person'?"document.querySelector('#in-person')":target==='image-lab/'?"document.querySelector('.image-lab-page')":"document.querySelector('python-workspace') || document.querySelector('.workspace-page')";
   await until(`location.href===${JSON.stringify(base+target)} && (${ready})`);
   if(target.startsWith('math-lab')){
    await ev("document.querySelector('[data-corr-preset=\"0\"]').click()");assert.equal(await ev("document.querySelector('[data-corr-full]').textContent"),'0.000000');
   }
  }
  await call('Page.navigate',{url:base+'sessions/07-dropping-the-gaussian/'});
  await until(`document.querySelector('[data-ts-ready="true"]')`);
  assert.equal(await ev(`document.querySelector('details.expected-results').open`),false);
  for(const theme of ['light','dark']){
   await ev(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.querySelector('details.expected-results').scrollIntoView({behavior:'instant',block:'center'})`);
   await pause(150);
   const shot=await call('Page.captureScreenshot',{format:'png'});
   await writeFile(`build/teaching-week7-reading-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
  }
  for(const [d,n] of [[2048,250],[2,1000],[16,1000]]){
   await ev(`document.querySelector('#ts-dim').value='${d}';document.querySelector('#ts-dim').dispatchEvent(new Event('change',{bubbles:true}))`);
   const baseline=await ev(`document.querySelector('[data-ts-fid]').textContent`);
   assert.ok(baseline.includes('Population Gaussian distance (toy bench)'));
   assert.ok(baseline.includes('not empirical FID or fitted FID∞ estimates'));
   if(d===16)assert.ok(baseline.includes('A 0.0400, B 0.0381'),baseline);
   assert.equal(await ev(`document.querySelectorAll('[data-ts-strip] circle').length`),0);
   // Repeat enough times on desktop to exercise the descriptive verdict; a
   // single press at smaller widths checks responsive rendering and controls.
   const repeats=width===1920?5:1;
   for(let press=1;press<=repeats;press++){
    await ev(`document.querySelector('[data-ts-run]').click()`);
    await until(`!document.querySelector('[data-ts-run]').disabled && document.querySelector('[data-ts-status]').textContent==='Press ${press} at d = ${d}, N = ${n}.'`);
    assert.deepEqual(await ev(`[...document.querySelectorAll('[data-ts-strip]')].map(s=>s.querySelectorAll('circle').length)`),[4*press,4*press,4*press]);
   }
   assert.equal(await ev(`document.querySelector('details.expected-results').open`),false);
  }
  await ev(`document.querySelector('details.expected-results summary').click()`);
  assert.equal(await ev(`document.querySelector('details.expected-results').open`),true);
  await ev(`document.querySelector('details.expected-results summary').click();document.querySelector('[data-ts]').scrollIntoView({behavior:'instant',block:'start'})`);
  for(const theme of ['light','dark']){
   await ev(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);await pause(150);
   const shot=await call('Page.captureScreenshot',{format:'png'});
   await writeFile(`build/teaching-week7-panel-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
   assert.ok(await ev(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`),`week 7 overflow at ${width}px`);
  }
 }
 console.log('PASS: Week 2–8 teaching links, Week 5/6 measurement-log handoff and Week 12 assessment anchor; Week 7 closed result fold, all d/N settings, repeated scoring and reset; desktop/mobile light/dark screenshots with no horizontal overflow. No image inference or Python runtime was executed.');
}finally{await call('Browser.close');ws.close();browser.kill();}
