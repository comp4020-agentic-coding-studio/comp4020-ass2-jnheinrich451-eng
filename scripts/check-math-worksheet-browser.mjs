// Manual browser regression. Requires the Astro server on :4322 and local Edge.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {WORKSHEETS} from '../src/lib/math-worksheet.ts';
const profile=await mkdtemp(join(tmpdir(),'slop-worksheet-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9248',`--user-data-dir=${profile}`],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));await pause(1800);
const pages=await(await fetch('http://localhost:9248/json')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const jobs=new Map(),exceptions=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);if(m.id){jobs.get(m.id)?.(m);jobs.delete(m.id);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const until=async expression=>{for(let i=0;i<50;i++){if(await ev(expression))return;await pause(200);}throw new Error('Timeout: '+expression);};
const source=async text=>ev(`(()=>{const e=document.querySelector('[data-source]');e.value=${JSON.stringify(text)};e.dispatchEvent(new Event('input'));document.querySelector('[data-run]').click();})()`);
const total=()=>ev("Number(document.querySelector('[data-worksheet-total]').textContent)");
const alignedColumns=async()=>{
 const errors=await ev(`(()=>{
  const table=document.querySelector('math-worksheet table');
  const headers=[...table.tHead.rows[0].cells];
  const edge=(cell,i)=>{const box=cell.getBoundingClientRect(),style=getComputedStyle(cell);return i===0?box.left+parseFloat(style.paddingLeft):box.right-parseFloat(style.paddingRight);};
  return [...table.tBodies[0].rows].flatMap((row,r)=>[...row.cells].flatMap((cell,i)=>{
   const expected=i===0?'left':'right';
   return Math.abs(edge(cell,i)-edge(headers[i],i))<1 && getComputedStyle(cell).textAlign===expected && getComputedStyle(headers[i]).textAlign===expected ? [] : ['row '+r+', column '+i+' has inconsistent alignment or padding'];
  }));
 })()`);
 assert.deepEqual(errors,[],'Contribution headers and live rows must share text edges');
};
const base='http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
try{
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
 await call('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:base+'math-lab/'});await until("document.querySelector('[data-source]') && !document.querySelector('[data-source]').disabled");
 assert.equal(await total(),2.5);
 await alignedColumns();
 assert.equal(await ev("document.querySelectorAll('[data-root]').length"),2);
 await ev("document.querySelector('[data-root]').click()");assert.ok(Math.abs(await total()-4)<1e-7);
 assert.ok((await ev("document.querySelector('[data-source]').value")).includes('m = -1.936'));
 await ev("document.querySelector('[data-undo]').click()");assert.equal(await total(),2.5);
 // The real example selector loads a different question and finds both sd branches.
 await ev("document.querySelector('[data-example]').value='1';document.querySelector('[data-load]').click()");
 assert.equal(await total(),0);
 assert.deepEqual(await ev("[...document.querySelectorAll('[data-root]')].map(e=>Number(e.dataset.root))"),[.5,1.5]);
 await ev("document.querySelector('[data-root]').click()");assert.equal(await total(),.25);
 await source(WORKSHEETS[2].source);assert.equal(await total(),2.25);
 assert.equal(await ev("document.querySelectorAll('[data-contributions] tr').length"),3);
 await alignedColumns();
 const before=await ev("document.querySelector('[data-ws-candidate]').getAttribute('d')");
 await ev("document.querySelector('[data-dimension]').value='1';document.querySelector('[data-dimension]').dispatchEvent(new Event('change'))");
 assert.notEqual(await ev("document.querySelector('[data-ws-candidate]').getAttribute('d')"),before);
 assert.equal(await total(),2.25);
 await source(WORKSHEETS[3].source);assert.ok((await ev("document.querySelector('[data-command-results]').textContent")).includes('Agreement at'));
 await source(WORKSHEETS[3].source.replace('s = 1','s = 2'));
 assert.ok((await ev("document.querySelector('[data-command-results]').textContent")).includes('Disagreement at'));
 // Invalid edits never replace the last good output or leave old roots actionable.
 await source(WORKSHEETS[0].source);await source(WORKSHEETS[0].source.replace('s = 1.5','s = 0'));
 assert.equal(await total(),2.5);
 assert.equal(await ev("document.querySelector('[data-stale]').hidden"),false);
 assert.equal(await ev("[...document.querySelectorAll('[data-root]')].every(e=>e.disabled)"),true);
 assert.ok((await ev("document.querySelector('[data-status]').textContent")).includes('Line 5'));
 await source(WORKSHEETS[0].source);
 // Auto evaluation works offline, without the Run button.
 await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await ev("(()=>{const e=document.querySelector('[data-source]');e.value=e.value.replace('m = 1.5','m = 2');e.dispatchEvent(new Event('input'));})()");
 await until("document.querySelector('[data-worksheet-total]').textContent==='4.25'");
 // Disable live mode: results become stale until keyboard evaluation.
 await ev("document.querySelector('[data-live]').click();const e=document.querySelector('[data-source]');e.value=e.value.replace('m = 2','m = 1');e.dispatchEvent(new Event('input'));e.focus()");
 await pause(650);assert.equal(await total(),4.25);
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',modifiers:2,windowsVirtualKeyCode:13});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',modifiers:2,windowsVirtualKeyCode:13});
 assert.equal(await total(),1.25);
 await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 await call('Page.reload');await pause(900);await until("document.querySelector('[data-worksheet-total]')?.textContent==='1.25'");
 assert.ok((await ev("document.querySelector('[data-question]').textContent")).includes('Restored'));
 await source(WORKSHEETS[0].source);
 for(const [width,height] of [[1920,1080],[800,1000],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  for(const theme of ['light','dark']){
   if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
   await ev("document.querySelector('math-worksheet').scrollIntoView({behavior:'instant',block:'start'})");await pause(250);
   assert.equal(await ev('document.documentElement.scrollWidth>document.documentElement.clientWidth'),false);
   assert.equal(await total(),2.5);
   await alignedColumns();
   await ev("document.querySelector('math-worksheet .table-wrap').scrollIntoView({behavior:'instant',block:'center'})");await pause(150);
   const tableShot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`build/worksheet-table-${theme}-${width}.png`,Buffer.from(tableShot.data,'base64'));
   await ev("document.querySelector('math-worksheet').scrollIntoView({behavior:'instant',block:'start'})");
   const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`build/worksheet-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
   if(width===390){await ev("document.querySelector('.result-panel').scrollIntoView({behavior:'instant',block:'start'})");await pause(150);const detail=await call('Page.captureScreenshot',{format:'png'});await writeFile(`build/worksheet-results-${theme}-390.png`,Buffer.from(detail.data,'base64'));}
  }
 }
 await ev("document.querySelector('a[href=\"/comp4020-ass2-jnheinrich451-eng/workspace/\"]').click()");await pause(900);
 await ev("document.querySelector('a[href=\"/comp4020-ass2-jnheinrich451-eng/math-lab/\"]').click()");await pause(900);
 await until("document.querySelector('[data-source]') && !document.querySelector('[data-source]').disabled");
 await ev("document.querySelector('[data-root]').click()");assert.ok(Math.abs(await total()-4)<1e-7);
 await alignedColumns();
 assert.deepEqual(exceptions,[]);
 console.log('PASS: algebra and root application, undo, example selection, both spread branches, diagonal marginals, counterexample, invalid/stale states, offline live evaluation, keyboard run, persistence/reload, light/dark at 1920/800/390, client navigation; no browser exceptions.');
}finally{await call('Browser.close');ws.close();browser.kill();}
