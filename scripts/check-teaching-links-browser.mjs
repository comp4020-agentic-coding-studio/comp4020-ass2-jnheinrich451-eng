// Read-to-experiment handoff regression. Requires local Astro on :4322.
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
const base='http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
try{
 await call('Page.enable');
 for(const [width,height] of [[1920,1080],[800,1000],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  for(const [path,target] of [['sessions/02-frechet-distance/','math-lab/#correlation'],['lectures/week-02/','math-lab/#correlation'],['sessions/05-the-bias/','workspace/']]){
   await call('Page.navigate',{url:base+path});await until(`location.pathname.endsWith('/${path}') && !!document.querySelector('main a[href$="/${target}"]')`);await pause(350);
   const selector=`main a[href$="/${target}"]`;
   await ev(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({behavior:'instant',block:'center'})`);await pause(200);
   const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`build/teaching-${path.replaceAll('/','-')}${width}.png`,Buffer.from(shot.data,'base64'));
   const overflow=await ev(`({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,100),right:e.getBoundingClientRect().right}))})`);
   assert.ok(overflow.scroll<=overflow.width,`${path} at ${width}px: ${JSON.stringify(overflow)}`);
   await ev(`document.querySelector(${JSON.stringify(selector)}).click()`);
   const ready=target.startsWith('math-lab')?"document.querySelector('[data-corr-apply]') && !document.querySelector('[data-corr-apply]').disabled":"document.querySelector('python-workspace') || document.querySelector('.workspace-page')";
   await until(`location.href===${JSON.stringify(base+target)} && (${ready})`);
   if(target.startsWith('math-lab')){
    await ev("document.querySelector('[data-corr-preset=\"0\"]').click()");assert.equal(await ev("document.querySelector('[data-corr-full]').textContent"),'0.000000');
   }
  }
 }
 console.log('PASS: Week 2 session/lecture and Week 5 session link to usable labs at desktop/mobile widths; reading views have no horizontal overflow.');
}finally{await call('Browser.close');ws.close();browser.kill();}
