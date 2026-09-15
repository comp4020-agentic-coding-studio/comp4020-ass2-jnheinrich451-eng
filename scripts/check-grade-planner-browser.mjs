// Requires local Astro on :4322. Checks live lecture data/state and theme regressions.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'slop-grades-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9265',`--user-data-dir=${profile}`],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));await pause(1800);
const pages=await(await fetch('http://localhost:9265/json')).json(),ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
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



const go=async()=>{await call('Page.navigate',{url:base+'policies/'});await until("!!document.querySelector('grade-calculator[data-ready]')");};
const value=selector=>ev('document.querySelector('+JSON.stringify(selector)+').textContent');
const fill=async(id,mark)=>ev(`(()=>{const i=document.querySelector('[data-grade="'+${JSON.stringify(id)}+'"]');i.value=${JSON.stringify(mark)};i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
const reset=()=>ev("document.querySelector('[data-clear]').click()");
const capture=async(name,selector)=>{
 await ev('document.querySelector('+JSON.stringify(selector)+').scrollIntoView({block:"center",behavior:"instant"})');await pause(200);
 const s=await call('Page.captureScreenshot',{format:'png'});
 await writeFile('build/grade-planner-'+name+'.png',Buffer.from(s.data,'base64'));
};
try{
 await call('Page.enable');await call('Runtime.enable');
 await call('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
 await go();await reset();
 const rows=await ev("JSON.parse(document.querySelector('grade-calculator').dataset.rows)");
 assert.equal(rows.length,11);
 assert.equal(await value('[data-result=remaining]'),'100.00');
 assert.equal(await value('[data-result=average]'),'—');
 const first='a1-reproduce-the-number:0';
 await fill(first,'24');
 assert.equal(await value('[data-result=earned]'),'4.80');
 assert.equal(await value('[data-assessment-marks="a1-reproduce-the-number"]'),'24.00 entered assessment marks · partial rubric');
 assert.equal(await value('[data-result=average]'),'80.00% · HD');
 assert.equal(await value('[data-target=HD] [data-required]'),'80.00% needed');
 await fill(first,'0');
 assert.equal(await value('[data-result=remaining]'),'94.00');
 assert.equal(await value('[data-result=average]'),'0.00% · N');
 await fill(first,'31');
 assert.equal(await value('[data-result=earned]'),'—');
 assert.equal(await ev("document.querySelector('[data-export]').disabled"),true);
 assert.equal(await ev("document.querySelectorAll('[aria-invalid=true]').length"),1);
 await fill(first,'24');
 await go();assert.equal(await value('[data-result=earned]'),'4.80','reload retains tab entries');
 await ev("document.querySelector('.at-nav-links a[href$=\"/sessions/\"]').click()");
 await until("!!document.querySelector('session-journey')");
 await ev("document.querySelector('.at-nav-links a[href$=\"/policies/\"]').click()");
 await until("!!document.querySelector('grade-calculator[data-ready]')");
 assert.equal(await value('[data-result=earned]'),'4.80','SPA return restores marks and recalculates');
 await reset();
 for(const r of rows)await fill(r.id,String(r.maximum*.8));
 assert.equal(await value('[data-result=earned]'),'80.00');
 assert.equal(await value('[data-assessment-marks="a1-reproduce-the-number"]'),'80.00 / 100 assessment marks · HD');
 assert.equal(await value('[data-target=HD] [data-required]'),'Target met by entries');
 for(const r of rows)await fill(r.id,'0');
 assert.equal(await value('[data-target=P] [data-required]'),'Not reachable');
 assert.equal(await value('[data-result=remaining]'),'0.00');
 // Capture CSV contents without opening a download window.
 await ev("window.gcOriginalURL=URL.createObjectURL;URL.createObjectURL=blob=>{window.gcBlob=blob;return window.gcOriginalURL(blob)}");
 await ev("document.querySelector('[data-export]').click()");
 const csv=await ev('window.gcBlob.text()');
 assert.equal(csv.split('\r\n').length,12);
 assert.ok(csv.includes('Criterion maximum'));
 await ev("URL.createObjectURL=window.gcOriginalURL");
 await reset();await go();assert.equal(await value('[data-result=remaining]'),'100.00');
 // Keyboard progression with a real Enter event.
 await ev("document.querySelector('[data-grade]').focus()");
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 assert.equal(await ev("document.activeElement.dataset.grade"),rows[1].id);
 for(const [width,height] of [[1920,1080],[800,1000],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  for(const theme of ['light','dark']){
   if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
   await reset();await fill(first,'24');
   await fits();
   assert.ok(await ev("(()=>{const e=document.querySelector('.gc-sheet');return e.scrollWidth<=e.clientWidth+1;})()"),'Sheet fits at '+width);
   const contrast=await ev(`(()=>{
    const c=document.createElement('canvas'),ctx=c.getContext('2d');
    const lum=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);const rgb=[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
    const s=getComputedStyle(document.querySelector('[data-grade]')),a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   })()`);
   assert.ok(contrast>=4.5,'Input contrast '+theme+': '+contrast);
   await capture('sheet-'+theme+'-'+width,'.gc-sheet');
   await capture('targets-'+theme+'-'+width,'.gc-targets');
  }
 }
 // A browser that refuses storage should still calculate.
 await ev("Storage.prototype.setItem=function(){throw new Error('storage disabled')}");
 await fill(first,'18');
 assert.equal(await value('[data-result=earned]'),'3.60');
 assert.ok((await value('[data-storage]')).includes('unavailable'));
 assert.deepEqual(exceptions,[]);
 console.log('PASS: rubric cells, partial/zero/complete marks, invalidation, grade targets, reload/SPA/tab storage, clear, CSV, Enter navigation, input contrast and responsive layout in both themes at 1920/800/390.');
}finally{await call('Browser.close');ws.close();browser.kill();}
