// Requires local Astro on :4322. Checks live lecture data/state and theme regressions.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'slop-gadgets-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9258',`--user-data-dir=${profile}`],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));await pause(1800);
const pages=await(await fetch('http://localhost:9258/json')).json(),ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
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

import {instrumentMeasurement} from '../src/lib/bench.ts';
const go=async(week,prefix)=>{
 await call('Page.navigate',{url:base+'lectures/week-'+week+'/'});
 await until("!!document.querySelector('[data-"+prefix+"-ready]')");
 await pause(250);
};
const change=async(id,value)=>ev(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event(e.tagName==='INPUT'?'input':'change'));})()`);
const run=async(prefix)=>{
 await ev("document.querySelector('[data-"+prefix+"-run]').click()");
 await until("!document.querySelector('[data-"+prefix+"-run]').disabled");
};
const capture=async(name,selector)=>{
 await ev(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({behavior:'instant',block:'center'})`);await pause(120);
 const s=await call('Page.captureScreenshot',{format:'png'});
 await writeFile('build/gadgets-'+name+'.png',Buffer.from(s.data,'base64'));
};
const contrast=async(prefix)=>ev(`(()=>{
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 const luminance=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);const rgb=[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
 return [...document.querySelectorAll('[data-${prefix}-controls] select,[data-${prefix}-controls] input')].map(e=>{const s=getComputedStyle(e),a=luminance(s.color),b=luminance(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
})()`);
try {
 await call('Page.enable');await call('Runtime.enable');
 await call('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
 await go('05','xp');
 // A cancelled task must not paint an old curve or add an old strip entry.
 await ev("document.querySelector('[data-xp-run]').click();setTimeout(()=>{const e=document.querySelector('#xp-d');e.value='32';e.dispatchEvent(new Event('change'));},20)");
 await pause(600);
 assert.equal(await ev("document.querySelector('[data-xp-intercept]').textContent.trim()"),'');
 assert.equal(await ev("document.querySelector('[data-xp-truth]').textContent"),'0.080');
 assert.equal(await ev("document.querySelector('[data-xp-strip]').querySelectorAll('circle').length"),0);
 // Restart immediately while the cancelled async task is still unwinding.
 await ev("document.querySelector('[data-xp-run]').click();document.querySelector('[data-xp-candidate=B]').click();document.querySelector('[data-xp-run]').click()");
 await until("!document.querySelector('[data-xp-run]').disabled");
 assert.equal(await ev("document.querySelector('[data-xp-strip]').querySelectorAll('circle').length"),1);
 assert.equal(await ev("document.querySelector('[data-xp-truth]').textContent"),'0.076');
 assert.ok(await ev("[...document.querySelectorAll('[data-xp-plot] text')].some(e=>e.textContent==='true 0.076')"));
 await ev("document.querySelector('[data-xp-run]').click();document.querySelector('[data-xp-clear]').click()");
 await pause(400);
 assert.equal(await ev("document.querySelector('[data-xp-intercept]').textContent.trim()"),'');

 await go('08','xi');await run('xi');
 const seed=(Math.imul(20260928,1664525)+1013904223)>>>0;
 const measured=instrumentMeasurement({n:800,d:24,rho:.9,shift:1,seed});
 const ref=measured.reference.slice(0,5),cand=measured.candidates.shuffle.slice(0,5),all=[...ref,...cand].flat();
 const lo=Math.min(...all),hi=Math.max(...all);
 const points=cand[0].map((v,t)=>`${300+(534-300)*t/23},${(210-170*(v-lo)/(hi-lo)).toFixed(1)}`).join(' ');
 const actual=await ev("document.querySelectorAll('[data-xi-sequences] polyline')[5].getAttribute('points')");
 // Allow subpixel arithmetic-order differences in x.
 const nums=s=>s.split(/[ ,]/).map(Number);
 nums(actual).forEach((v,i)=>assert.ok(Math.abs(v-nums(points)[i])<1e-9));
 assert.equal(await ev("document.querySelector('[data-xi-cell=\"shuffle/joint\"]').childNodes[0].textContent"),measured.table.shuffle.joint.toFixed(3));
 await run('xi');
 assert.notEqual(await ev("document.querySelectorAll('[data-xi-sequences] polyline')[5].getAttribute('points')"),actual);
 await ev("document.querySelector('[data-xi-candidate=shift]').click()");
 assert.ok((await ev("document.querySelector('[data-xi-plot-caption]').textContent")).includes('not paired'));
 await change('xi-rho','0');
 assert.equal(await ev("document.querySelectorAll('[data-xi-sequences] polyline').length"),0);
 await run('xi');
 assert.ok((await ev("document.querySelector('[data-xi-rule]').textContent")).includes('not a calibrated statistical test'));
 assert.equal(await ev("document.querySelectorAll('[data-xi-lens]').length"),3);

 await go('11','rp');await run('rp');
 assert.equal(await ev("document.querySelector('[data-rp-replay]').open"),false);
 assert.equal(await ev("document.querySelectorAll('[data-rp-counter] tr').length"),3);
 assert.deepEqual(await ev("[...document.querySelectorAll('[data-rp-counter] tr')].map(row=>[...row.querySelectorAll('td')].map(td=>Number(td.textContent)))"),[[12,0,0],[0,12,0],[12,0,0]]);
 assert.equal(await ev("document.querySelector('[data-rp-support]').textContent"),'12');
 const original=await ev("document.querySelector('[data-rp-publish]').textContent");
 await run('rp');assert.equal(await ev("document.querySelector('[data-rp-publish]').textContent"),original);
 assert.ok(original.includes('base seed = 20261019'));assert.ok(original.includes('12 repeats'));
 assert.ok(original.includes('rho = 0.9'));assert.ok(original.includes('d = 24'));
 await change('rp-worse','shuffle');await run('rp');
 assert.ok((await ev("document.querySelector('[data-rp-publish]').textContent")).includes('More repeats contradicted'));
 await change('rp-rho','0');await change('rp-lens','temporal');await run('rp');
 assert.ok((await ev("document.querySelector('[data-rp-publish]').textContent")).includes('no ordering in any repeat'));
 assert.ok((await ev("document.querySelector('[data-rp-publish]').textContent")).includes('12 repeats'));
 await ev("document.querySelector('[data-rp-new-seed]').click()");
 assert.notEqual(await ev("document.querySelector('#rp-seed').value"),'20261019');
 await run('rp');
 assert.ok((await ev("document.querySelector('[data-rp-publish]').textContent")).includes('base seed = '+await ev("document.querySelector('#rp-seed').value")));
 await ev("document.querySelector('[data-rp-run]').click();document.querySelector('#rp-n').value='100';document.querySelector('#rp-n').dispatchEvent(new Event('change'))");
 await pause(300);
 assert.equal(await ev("document.querySelectorAll('.rp-mark').length"),0);
 assert.equal(await ev("document.querySelector('[data-rp-support]').textContent"),'—');
 assert.equal(await ev("document.querySelector('[data-rp-protocol]').textContent"),'');
 await change('rp-seed','-1');
 await ev("document.querySelector('[data-rp-run]').click()");
 assert.equal(await ev("document.querySelector('[data-rp-replay]').open"),true,'Invalid seed reveals its control');
 assert.equal(await ev("document.querySelectorAll('.rp-mark').length"),0);

 for(const [width,height] of [[1920,1080],[800,1000],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  for(const [week,prefix] of [['05','xp'],['08','xi'],['11','rp']]){
   await go(week,prefix);await run(prefix);
   for(const theme of ['light','dark']){
    if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
    await fits();
    const ratios=await contrast(prefix);assert.ok(ratios.length>0 && ratios.every(r=>r>=4.5),prefix+' '+theme+' text contrast '+ratios);
    assert.ok(await ev(`(()=>{const root=document.querySelector('[data-${prefix}]'),label=root.querySelector('.${prefix}-label'),status=root.querySelector('[data-${prefix}-status]'),input=root.querySelector('select');return [label,status,input].every(e=>getComputedStyle(e).color===getComputedStyle(root).color);})()`),'Shared gold labels, status and controls');
    await capture(prefix+'-'+theme+'-'+width,'[data-'+prefix+'-controls]');
    if(prefix==='xp')await capture('xp-results-'+theme+'-'+width,'.xp-nums');
    if(prefix==='xi'){
     assert.ok(await ev("[...document.querySelectorAll('.xi-table th')].every(e=>getComputedStyle(e).whiteSpace==='normal' && getComputedStyle(e).textTransform==='none')"),'Table headings wrap without uppercase crowding');
     assert.ok(await ev("(()=>{const e=document.querySelector('.xi-scroll');return e.scrollWidth<=e.clientWidth+1;})()"),'Comparison table fits without horizontal overflow');
     await capture('xi-results-'+theme+'-'+width,'.xi-table');
    }
    if(prefix==='rp'){
     await capture('rp-summary-'+theme+'-'+width,'[data-rp-outcome]');
     await capture('rp-comparison-'+theme+'-'+width,'[data-rp-counter]');
     await ev("document.querySelector('[data-rp-protocol]').closest('details').open=true");
     await capture('rp-method-'+theme+'-'+width,'.report-method .formula');
     await fits();
     assert.equal(await ev("document.querySelectorAll('.report-method math').length"),4);
     assert.ok(await ev("[...document.querySelectorAll('.report-method math')].every(e=>e.getBoundingClientRect().width<=document.querySelector('.report-method').getBoundingClientRect().width)"),'Math fits its panel');
     await ev("document.querySelector('[data-rp-protocol]').closest('details').open=false");
    }
   }
   await ev("document.querySelector('.at-nav-links a[href$=\"/lectures/\"]').click()");
   await until("!!document.querySelector('.lecture-programme')");
   await ev("document.querySelector('[data-lecture-week=\""+Number(week)+"\"] .programme-link').click()");
   await until("!!document.querySelector('[data-"+prefix+"-ready]')");
   await run(prefix);
  }
 }
 for(const [width,height] of [[1920,1080],[800,1000],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  for(const week of [1,2,5,8,11,12]){
   await call('Page.navigate',{url:base+'sessions/'});
   await until("!!document.querySelector('session-journey')");
   assert.equal(await ev("document.querySelectorAll('session-journey .lecture-branch').length"),6);
   const article=`#session-week-${week}`;
   const expected=base+'lectures/week-'+String(week).padStart(2,'0')+'/';
   assert.equal(await ev(`document.querySelector('${article} .lecture-branch').href`),expected);
   await ev(`document.querySelector('${article} .lecture-branch').click()`);
   await until(`location.href===${JSON.stringify(expected)} && !document.querySelector('session-journey')`);
   await fits();
   await call('Page.navigate',{url:base+'sessions/'});
   await until("!!document.querySelector('session-journey')");
   await ev(`document.querySelector('${article} .open-session').click()`);
   await until("!!document.querySelector('.session-scale')");
   await fits();
   assert.equal(await ev("document.querySelector('.session-scale .lecture-branch').href"),expected);
   if(week===11){
    await ev("document.querySelector('.session-scale').scrollIntoView({behavior:'instant',block:'center'})");
    await pause(120);
    const screenshot=await call('Page.captureScreenshot',{format:'png'});
    await writeFile(`build/session-lecture-branch-${width}.png`,Buffer.from(screenshot.data,'base64'));
   }
   await ev("document.querySelector('.session-scale .lecture-branch').click()");
   await until(`location.href===${JSON.stringify(expected)} && !document.querySelector('.session-scale')`);
   await fits();
  }
 }
 assert.deepEqual(exceptions,[]);
 console.log('PASS: cancellation/restart/clear, exact plotted samples, fresh plots, two-baseline labels, seed replay and outcome protocols, readable controls in both themes at 1920/800/390, SPA return; no browser exceptions.');
 console.log('PASS: gold gadget text and all five catalogue/Course sequence lecture branches at 1920/800/390.');
} finally {await call('Browser.close');ws.close();browser.kill();}
