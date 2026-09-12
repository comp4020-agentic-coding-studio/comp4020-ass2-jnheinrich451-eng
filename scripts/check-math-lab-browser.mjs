// Manual integration regression: node scripts/check-workspace-browser.mjs
// Requires the local Astro server at :4322 and Edge; uses a temporary profile.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'slop-math-lab-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9247',`--user-data-dir=${profile}`],{stdio:'ignore',windowsHide:true});
await new Promise(r=>setTimeout(r,1800));
const pages=await(await fetch('http://localhost:9247/json')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const jobs=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){jobs.get(m.id)?.(m);jobs.delete(m.id);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(expression,limit=95000)=>{const start=Date.now();while(Date.now()-start<limit){if(await ev(expression))return;await pause(300);}throw new Error('Timed out: '+expression+'\n'+await ev("document.querySelector('.lab-feedback')?.textContent"));};
const base='http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
const param=async(key,value)=>ev("(()=>{const e=document.querySelector('[data-number="+key+"]');e.value="+JSON.stringify(String(value))+";e.dispatchEvent(new Event('change'));})()");
const click=action=>ev("document.querySelector('[data-action="+action+"]').click()");
const total=()=>ev("Number(document.querySelector('[data-total]').textContent)");
try{
 await call('Page.enable');await call('Network.enable');
 await call('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:base+'math-lab/'});await pause(1300);
 await until("document.querySelector('[data-action=reset]') && !document.querySelector('[data-action=reset]').disabled",15000);
 assert.equal(await total(),2.5);
 assert.equal(await ev("getComputedStyle(document.querySelector('[data-side-label]')).display"),'none');
 await param('mu',2);await param('sigma',1);assert.equal(await total(),4);await click('pin');
 await param('mu',0);await param('sigma',3);assert.equal(await total(),4);await click('pin');
 assert.equal(await ev("document.querySelectorAll('[data-pins] article').length"),2);
 assert.equal(await ev("document.querySelector('[data-action=pin]').disabled"),true);
 await ev("document.querySelector('[data-lock]').click()");
 assert.notEqual(await ev("getComputedStyle(document.querySelector('[data-side-label]')).display"),'none');
 for(const mu of [-2,-1,0,1,2]){await param('mu',mu);assert.equal(await total(),4);}
 for(const sigma of [1,1.25,2,3]){await param('sigma',sigma);assert.equal(await total(),4);}
 await ev("(()=>{const e=document.querySelector('[data-side]');e.value='-1';e.dispatchEvent(new Event('change'));})()");
 await param('sigma',2);assert.ok(await ev("Number(document.querySelector('[data-current-mu]').textContent)")<0);
 await param('sigma',-1);assert.equal(await ev("document.querySelector('[data-number=sigma]').validity.valid"),false);assert.equal(await total(),4);
 await param('sigma',2);await click('reset');assert.equal(await total(),2.5);
 await ev("document.querySelector('[data-handle=mu]').focus()");
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 assert.equal(await ev("document.querySelector('[data-current-mu]').textContent"),'1.5100');
 await click('undo');assert.equal(await total(),2.5);
 // Real mouse drag at SVG coordinates, not a synthetic change event.
 // Smooth scrolling can still be in flight now that the guided lab is farther
 // down the page. Fix the viewport before measuring real pointer coordinates.
 await ev("document.querySelector('[data-density]').scrollIntoView({behavior:'instant',block:'center'})");await pause(300);
 const drag=await ev("(()=>{const svg=document.querySelector('[data-density]');const p=svg.createSVGPoint();p.x=55+(1.5+8)/16*700;p.y=309;const from=p.matrixTransform(svg.getScreenCTM());p.x=55+(2+8)/16*700;const to=p.matrixTransform(svg.getScreenCTM());return {from:{x:from.x,y:from.y},to:{x:to.x,y:to.y}};})()");
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',...drag.from});
 await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...drag.from});
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,...drag.to});
 await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...drag.to});
 assert.ok(Math.abs(await ev("Number(document.querySelector('[data-current-mu]').textContent)")-2)<.03);
 await click('undo');assert.equal(await total(),2.5);
 for(const [width,height] of [[1920,1080],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await ev("document.querySelector('math-lab').scrollIntoView()");await pause(200);
  assert.equal(await ev('document.documentElement.scrollWidth>document.documentElement.clientWidth'),false);
  for(const theme of ['light','dark']){
   if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
   assert.equal(await total(),2.5);
   const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile('build/math-lab-'+theme+'-'+width+'.png',Buffer.from(shot.data,'base64'));
  }
 }
 // No backend or runtime downloads are required for interaction.
 await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await param('mu',2);await param('sigma',1);assert.equal(await total(),4);
 await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 await ev("document.querySelector('.at-nav-brand').click()");await pause(700);
 await ev("document.querySelector('a[href=\"/comp4020-ass2-jnheinrich451-eng/workspace/\"]').click()");await pause(800);
 await ev("document.querySelector('a[href=\"/comp4020-ass2-jnheinrich451-eng/math-lab/\"]').click()");await pause(800);
 await param('mu',2);await param('sigma',1);assert.equal(await total(),4);
 console.log('PASS: worked pair, pinned comparisons, locked invariant, negative branch, invalid input, keyboard, real drag, undo/reset, two themes, desktop/mobile, offline interaction, client navigation');
}finally{await call('Browser.close');ws.close();browser.kill();}
