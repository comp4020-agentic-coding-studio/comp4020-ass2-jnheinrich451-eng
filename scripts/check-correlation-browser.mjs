// Manual UI regression: local Astro :4322, browser-only execution, temporary Edge profile.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'slop-correlation-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9250',`--user-data-dir=${profile}`],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));await pause(1800);
const pages=await(await fetch('http://localhost:9250/json')).json();const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const jobs=new Map(),exceptions=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);if(m.id){jobs.get(m.id)?.(m);jobs.delete(m.id);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const until=async expression=>{for(let i=0;i<50;i++){if(await ev(expression))return;await pause(200);}throw new Error('Timeout: '+expression);};
const preset=rho=>ev(`document.querySelector('[data-corr-preset="${rho}"]').click()`);
const full=()=>ev("Number(document.querySelector('[data-corr-full]').textContent)");
const marginals=()=>ev("[...document.querySelectorAll('[data-corr-gen-marginal]')].map(e=>e.getAttribute('d'))");
const apply=matrix=>ev(`(()=>{const e=document.querySelector('[data-corr-matrix]');e.value=${JSON.stringify(matrix)};e.dispatchEvent(new Event('input'));document.querySelector('[data-corr-apply]').click()})()`);
const base='http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
try{
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
 await call('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:base+'math-lab/#correlation'});await until("document.querySelector('[data-corr-apply]') && !document.querySelector('[data-corr-apply]').disabled");
 const original=await full(),paths=await marginals();assert.ok(Math.abs(original-.422291)<1e-6);
 assert.equal(await ev("document.querySelector('[data-corr-marginal]').textContent"),'0.000000');
 const tilted=await ev("document.querySelector('[data-corr-contour]').getAttribute('d')");
 await preset(-.8);assert.equal(await full(),original);assert.deepEqual(await marginals(),paths);
 assert.notEqual(await ev("document.querySelector('[data-corr-contour]').getAttribute('d')"),tilted);
 await preset(0);assert.equal(await full(),0);assert.deepEqual(await marginals(),paths);
 await ev("document.querySelector('[data-corr-undo]').click()");assert.equal(await full(),original);
 // Keyboard range input changes correlation without changing variance.
 await ev("document.querySelector('[data-corr-slider]').focus()");
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 assert.equal(await ev("Number(document.querySelector('[data-corr-rho]').value)"),-.79);assert.deepEqual(await marginals(),paths);
 await apply('[[4, 0], [0, 0.25]]');assert.equal(await full(),1.25);
 assert.equal(await ev("document.querySelector('[data-corr-marginal]').textContent"),'1.250000');assert.notDeepEqual(await marginals(),paths);
 for(const matrix of ['[[1,1],[1,1]]','[[1,0.3],[0.2,1]]','[[1,0.99],[0.99,1]]','invalid']){
  await apply(matrix);assert.equal(await full(),1.25);assert.ok((await ev("document.querySelector('[data-corr-status]').textContent")).includes('Not applied'));
 }
 await preset(.8);
 await ev("const e=document.querySelector('[data-corr-rho]');e.value='2';e.dispatchEvent(new Event('change'))");assert.equal(await full(),original);
 await preset(.8);
 await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await preset(-.8);assert.equal(await full(),original);await apply('[[1,0],[0,1]]');assert.equal(await full(),0);
 await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await preset(.8);
 for(const [width,height] of [[1920,1080],[800,1000],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  for(const theme of ['light','dark']){
   if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
   await ev("document.querySelector('correlation-lab').scrollIntoView({behavior:'instant',block:'start'})");await pause(150);
   assert.equal(await ev('document.documentElement.scrollWidth>document.documentElement.clientWidth'),false);assert.equal(await full(),original);
   const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`build/correlation-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
   await ev(`document.querySelector('${width===390?'.joint-panel':'.correlation-grid'}').scrollIntoView({behavior:'instant',block:'start'})`);await pause(250);
   const detail=await call('Page.captureScreenshot',{format:'png'});await writeFile(`build/correlation-plots-${theme}-${width}.png`,Buffer.from(detail.data,'base64'));
  }
 }
 await ev("document.querySelector('a[href=\"/comp4020-ass2-jnheinrich451-eng/workspace/\"]').click()");await pause(900);
 await ev("document.querySelector('a[href=\"/comp4020-ass2-jnheinrich451-eng/math-lab/\"]').click()");await pause(900);
 await until("document.querySelector('[data-corr-apply]') && !document.querySelector('[data-corr-apply]').disabled");await preset(0);assert.equal(await full(),0);
 await call('Page.reload');await pause(900);await until("document.querySelector('[data-corr-full]')?.textContent==='0.422291'");
 assert.deepEqual(exceptions,[]);
 console.log('PASS: correlation sign/tilt, unchanged marginal paths, reference match, matrix edits, invalid matrices/rho, undo, keyboard, offline calculation, light/dark 1920/800/390, navigation/reload, no browser exceptions.');
}finally{await call('Browser.close');ws.close();browser.kill();}
