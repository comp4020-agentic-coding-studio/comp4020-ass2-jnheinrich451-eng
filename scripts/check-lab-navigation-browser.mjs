// Manual regression: verify actual lab-link separation after client navigation.
// Requires Astro on :4322. No Python runtime downloads or backend are involved.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'slop-lab-nav-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9251',`--user-data-dir=${profile}`],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));await pause(1800);
const pages=await(await fetch('http://localhost:9251/json')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const jobs=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){jobs.get(m.id)?.(m);jobs.delete(m.id);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const until=async expression=>{for(let i=0;i<60;i++){if(await ev(expression))return;await pause(150);}throw new Error('Timed out: '+expression);};
const base='http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
const ready=async route=>{await until(`location.pathname.endsWith('/${route}/') && !!document.querySelector('.${route==='workspace'?'workspace':'math-lab'}-page nav[aria-label="Interactive labs"]')`);await pause(350);};
const inspect=()=>ev(`(()=>{const nav=document.querySelector('nav[aria-label="Interactive labs"]');const links=[...nav.querySelectorAll('a')];const rects=links.map(a=>{const r=a.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}});return {html:nav.outerHTML,display:getComputedStyle(nav).display,gap:getComputedStyle(nav).columnGap,font:getComputedStyle(nav).fontFamily,rects,active:links.filter(a=>a.getAttribute('aria-current')==='page').map(a=>a.pathname),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}})()`);
const verify=async label=>{
 const state=await inspect();assert.equal(state.display,'flex',label+' '+JSON.stringify(state));assert.ok(parseFloat(state.gap)>=16,label+' '+JSON.stringify(state));
 assert.equal(state.rects.length,2);const [a,b]=state.rects;
 const separated=b.left-a.right>=15||b.top-a.bottom>=7;
 assert.ok(separated,label+' links overlap or touch: '+JSON.stringify(state));assert.equal(state.overflow,false,label);
 assert.equal(state.active.length,1,label);assert.equal(state.active[0],await ev('location.pathname'),label);
 return state;
};
const switchTo=async route=>{await ev(`document.querySelector('nav[aria-label="Interactive labs"] a[href$="/${route}/"]').click()`);await ready(route);};
try{
 await call('Page.enable');
 for(const [width,height] of [[1428,900],[1920,1080],[800,1000],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:base+'workspace/'});await ready('workspace');await verify(`${width} direct workspace`);
  // Fault injection: remove route scope attributes so page-scoped selectors
  // cannot supply navigation layout. Essential separation must survive this.
  await ev(`(()=>{const nav=document.querySelector('nav[aria-label="Interactive labs"]');for(const name of nav.getAttributeNames())if(name.startsWith('data-astro-cid-'))nav.removeAttribute(name);})()`);
  await verify(`${width} without route-scoped styling`);
  for(let i=0;i<3;i++){
   await switchTo('math-lab');await verify(`${width} math ${i}`);
   await switchTo('workspace');await verify(`${width} workspace ${i}`);
  }
  await ev('history.back()');await ready('math-lab');await verify(`${width} back`);
  await ev('history.forward()');await ready('workspace');await verify(`${width} forward`);
  for(const theme of ['light','dark']){
   if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
   await pause(150);await verify(`${width} ${theme}`);
  }
  await ev("document.querySelector('nav[aria-label=\"Interactive labs\"] a').focus()");
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  assert.equal(await ev('document.activeElement.textContent.trim()'),'Maths lab');
  await ev('window.scrollTo({top:0,behavior:"instant"})');await pause(200);
  const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`build/lab-navigation-${width}.png`,Buffer.from(shot.data,'base64'));
  await call('Page.reload');await pause(700);await ready('workspace');await verify(`${width} reload`);
 }
 console.log('PASS: separated lab links at 1428/1920/800/390, repeated client navigation, history back/forward, both themes, keyboard focus, reload, active states and no overflow.');
}finally{await call('Browser.close');ws.close();browser.kill();}
