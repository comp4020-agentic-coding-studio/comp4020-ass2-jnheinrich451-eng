// Requires local Astro on :4322. Checks live lecture data/state and theme regressions.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'slop-overview-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9263',`--user-data-dir=${profile}`],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));await pause(1800);
const pages=await(await fetch('http://localhost:9263/json')).json(),ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const jobs=new Map(),exceptions=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);if(m.id){jobs.get(m.id)?.(m);jobs.delete(m.id);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const until=async expression=>{for(let i=0;i<60;i++){if(await ev(expression))return;await pause(150);}throw new Error('Timed out: '+expression);};
const base='http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
const fits=async()=>{
 // ClientRouter swaps the DOM before its transition and font layout finish.
 await ev('document.fonts.ready.then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))');
 await pause(300);
 assert.equal(await ev('document.documentElement.scrollWidth>document.documentElement.clientWidth'),false,'No horizontal page overflow: '+await ev('location.pathname+" at "+innerWidth'));
};



const routes=['lectures','sessions','assessments','workspace'];
const expected={
 lectures:'The number stays.The questions change.',
 sessions:'Sessions',
 assessments:'The mark is in the account.',
 workspace:'The distributions stay fixed.Does the ranking?'
};
try {
 await call('Page.enable');await call('Runtime.enable');
 for(const [width,height] of [[1920,1080],[800,1000],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  for(const theme of ['light','dark']){
   let reference;
   for(const route of routes){
    await call('Page.navigate',{url:base+route+'/'});
    await until("!!document.querySelector('.overview-header')");
    await ev('document.fonts.ready');
    if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
    await fits();
    const metrics=await ev(`(()=>{
     const h=document.querySelector('.overview-title'),s=getComputedStyle(h),p=getComputedStyle(document.querySelector('.overview-description'));
     return {font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,color:s.color,tracking:s.letterSpacing,minHeight:s.minHeight,margin:s.marginBottom,descriptionSize:p.fontSize,descriptionLine:p.lineHeight};
    })()`);
    if(reference)assert.deepEqual(metrics,reference,route+' shares typography at '+width+' '+theme);else reference=metrics;
    assert.equal(await ev("document.querySelector('.overview-title').textContent"),expected[route]);
    if(route==='sessions'){
     assert.equal(await ev("document.querySelector('.overview-kicker').textContent"),'SLOP8412 / Teaching Session / Reading');
     assert.equal(await ev("document.querySelector('.overview-description').textContent"),'Dive in FID to study with concepts, math codes and applications.');
     assert.ok(await ev("document.querySelector('main > .lead').getBoundingClientRect().bottom<=document.querySelector('.overview-header').getBoundingClientRect().top"),'Schedule lead sits above the shared header');
    }
    assert.ok(await ev("(()=>{const t=document.querySelector('.overview-title'),d=document.querySelector('.overview-description');return t.getBoundingClientRect().bottom<=d.getBoundingClientRect().top;})()"),'Title never overlaps description');
    assert.ok(await ev("(()=>{const t=document.querySelector('.overview-title');return t.scrollWidth<=t.clientWidth+1;})()"),'Title fits width');
    await ev(route==='sessions'?"window.scrollTo({top:0,behavior:'instant'})":"document.querySelector('.overview-header').scrollIntoView({block:'start',behavior:'instant'})");await pause(200);
    const shot=await call('Page.captureScreenshot',{format:'png'});
    await writeFile('build/overview-'+route+'-'+theme+'-'+width+'.png',Buffer.from(shot.data,'base64'));
   }
  }
 }
 // Client-side return must preserve the same shared header style.
 await ev("document.querySelector('.at-nav-links a[href$=\"/lectures/\"]').click()");
 await until("!!document.querySelector('.lecture-programme')");
 await fits();
 assert.equal(await ev("getComputedStyle(document.querySelector('.overview-title')).fontWeight"),'700');
 assert.deepEqual(exceptions,[]);
 console.log('PASS: all four overview headers share typography, colour, minimum title height and spacing; wording unchanged; no clipping or overlap in light/dark at 1920/800/390; SPA return.');
} finally {await call('Browser.close');ws.close();browser.kill();}
