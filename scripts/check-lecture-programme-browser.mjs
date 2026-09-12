// Requires local Astro on :4322. Checks the 4+1 overview and client navigation.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'slop-lectures-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9254',`--user-data-dir=${profile}`],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));await pause(1800);
const pages=await(await fetch('http://localhost:9254/json')).json(),ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const jobs=new Map(),exceptions=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);if(m.id){jobs.get(m.id)?.(m);jobs.delete(m.id);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const until=async expression=>{for(let i=0;i<60;i++){if(await ev(expression))return;await pause(150);}throw new Error('Timed out: '+expression);};
const base='http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
const screenshot=async name=>{const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(`build/${name}.png`,Buffer.from(shot.data,'base64'));};
const overview=async()=>{await until("document.querySelectorAll('[data-lecture-week]').length===5");await pause(350);assert.deepEqual(await ev("[...document.querySelectorAll('[data-lecture-week]')].map(e=>Number(e.dataset.lectureWeek))"),[1,2,5,8,11]);assert.equal(await ev("getComputedStyle(document.querySelector('.programme-demo')).display"),'grid');};
const fits=async()=>assert.equal(await ev('document.documentElement.scrollWidth>document.documentElement.clientWidth'),false,'No horizontal page overflow');
try{
 await call('Page.enable');await call('Runtime.enable');
 for(const [width,height] of [[1920,1080],[800,1000],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:base+'lectures/'});await overview();
  for(const theme of ['light','dark']){
   if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
   await ev("window.scrollTo({top:0,behavior:'instant'})");await pause(200);await fits();
   await screenshot(`lecture-programme-${theme}-${width}`);
   await ev("document.querySelector('[data-lecture-week=\"11\"]').scrollIntoView({behavior:'instant',block:'center'})");await pause(150);await screenshot(`lecture-programme-end-${theme}-${width}`);
  }
  for(const week of ['01','02','05','08','11']){
   const selector=`[data-lecture-week="${Number(week)}"] .programme-link`;
   await ev(`document.querySelector(${JSON.stringify(selector)}).focus()`);
   assert.equal(await ev(`document.activeElement===document.querySelector(${JSON.stringify(selector)})`),true);
   await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
   await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
   await until(`location.pathname.endsWith('/lectures/week-${week}/') && !document.querySelector('.lecture-programme')`);await pause(350);await fits();
   if(['05','08','11'].includes(week)){
    assert.equal(await ev("!!document.querySelector('.lecture-preview')"),true);
    assert.equal(await ev("[...document.querySelectorAll('main a')].some(a=>a.textContent.includes('Open the slides'))"),false);
   }
   await ev("document.querySelector('.at-nav-links a[href$=\"/lectures/\"]').click()");await overview();await fits();
  }
 }
 assert.deepEqual(exceptions,[]);
 console.log('PASS: 4+1 order, responsive layout in both themes at 1920/800/390, keyboard entry to all five pages, honest preview status, client navigation, no overflow or browser exceptions.');
}finally{await call('Browser.close');ws.close();browser.kill();}
