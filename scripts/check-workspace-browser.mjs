// Manual integration regression: node scripts/check-workspace-browser.mjs
// Requires the local Astro server at :4322 and Edge; uses a temporary profile.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'slop-workspace-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9246',`--user-data-dir=${profile}`],{stdio:'ignore',windowsHide:true});
await new Promise(r=>setTimeout(r,1800));
const pages=await(await fetch('http://localhost:9246/json')).json();
const ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const jobs=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){jobs.get(m.id)?.(m);jobs.delete(m.id);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(expression,limit=95000)=>{const start=Date.now();while(Date.now()-start<limit){if(await ev(expression))return;await pause(300);}throw new Error('Timed out: '+expression+'\n'+await ev("document.querySelector('.runtime-status')?.textContent"));};
const base='http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
const setCode=(index,code)=>ev("(()=>{const e=document.querySelectorAll('[data-cells] textarea')["+index+"];e.value="+JSON.stringify(code)+";e.dispatchEvent(new Event('input',{bubbles:true}));})()");
const click=action=>ev("document.querySelector('[data-action="+action+"]').click()");
const cellRun=async(index)=>{await ev("document.querySelectorAll('[data-cell-action=run]')["+index+"].click()");await until("!document.querySelector('[data-action=run]').disabled");};
const run=async()=>{await click('run');await until("!document.querySelector('[data-action=run]').disabled");};
const outputs=()=>ev("[...document.querySelectorAll('[data-cells] [data-output]')].map(e=>e.textContent)");
try{
  await call('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
  await call('Page.enable');
  ws.addEventListener('message',e=>{if(JSON.parse(e.data).method==='Page.javascriptDialogOpening')void call('Page.handleJavaScriptDialog',{accept:true});});
  await call('Page.navigate',{url:base+'workspace/'});await pause(1500);
  await until("document.querySelector('[data-action=run]') && !document.querySelector('[data-action=run]').disabled",15000);
  assert.equal(await ev("document.querySelectorAll('[data-cells] textarea').length"),3);
  await run();
  if((await ev("document.querySelector('.runtime-status').textContent")).includes('download failed'))await run();
  console.log(await ev("document.querySelector('.runtime-status').textContent"));
  assert.equal(await ev("document.querySelectorAll('[data-plot] svg polyline').length"),4);
  const original=await outputs();await run();assert.deepEqual(await outputs(),original);
  assert.deepEqual(await ev("[...document.querySelectorAll('[data-cells] [data-execution]')].map(e=>e.textContent)"),['[1]','[2]','[3]']);
  for(const [width,height] of [[1920,1080],[390,844]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await ev("document.querySelector('python-workspace').scrollIntoView()");await pause(200);
    assert.equal(await ev('document.documentElement.scrollWidth>document.documentElement.clientWidth'),false);
    assert.match(await ev("getComputedStyle(document.querySelector('textarea')).scrollbarColor"),/rgba\(0, 0, 0, 0\)/);
    for(const theme of ['light','dark']){
      if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
      await pause(100);
      assert.equal(await ev('document.documentElement.dataset.theme'),theme);
      assert.equal(await ev("getComputedStyle(document.querySelector('python-workspace')).backgroundColor"),theme==='light'?'rgb(255, 255, 255)':'rgb(3, 3, 5)');
      assert.equal(await ev("getComputedStyle(document.querySelector('textarea')).backgroundColor"),theme==='light'?'rgb(255, 255, 255)':'rgb(12, 12, 16)');
      assert.equal(await ev("getComputedStyle(document.querySelector('[data-plot] polyline')).stroke"),theme==='light'?'rgb(134, 86, 0)':'rgb(234, 184, 91)');
      assert.deepEqual(await outputs(),original);
      const shot=await call('Page.captureScreenshot',{format:'png'});
      await writeFile('build/notebook-'+theme+'-'+width+'.png',Buffer.from(shot.data,'base64'));
    }
  }
  await click('add');await setCode(3,'x = 6');await cellRun(3);
  await click('add');await setCode(4,'print(x * 7)');await cellRun(4);
  assert.equal((await outputs())[4].trim(),'42');
  await click('restart');await cellRun(4);assert.match((await outputs())[4],/NameError/);
  await run();assert.equal((await outputs())[4].trim(),'42');
  await ev("document.querySelectorAll('[data-cell-action=delete]')[3].click()");
  assert.equal(await ev("document.querySelectorAll('[data-cells] textarea').length"),4);
  await run();assert.match((await outputs())[3],/NameError/);
  await setCode(3,'while True:\n    pass');await ev("document.querySelectorAll('[data-cell-action=run]')[3].click()");
  await until("document.querySelector('.runtime-status').textContent.startsWith('Running Python')",10000);await click('stop');
  await setCode(3,'6 * 7');await cellRun(3);assert.equal((await outputs())[3].trim(),'42');
  await ev("document.querySelectorAll('[data-cell-action=add]')[0].click()");
  await setCode(1,'small_test = 123');await cellRun(1);
  const sources=await ev("[...document.querySelectorAll('[data-cells] textarea')].map(e=>e.value)");
  await call('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:profile});await click('export');await pause(500);
  const exported=await readFile(join(profile,'fid-experiment.py'),'utf8');assert.match(exported,/# %%/);
  await click('restore');assert.equal(await ev("document.querySelectorAll('[data-cells] textarea').length"),3);
  const root=await call('DOM.getDocument');const input=await call('DOM.querySelector',{nodeId:root.root.nodeId,selector:'input[type=file]'});
  await call('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[join(profile,'fid-experiment.py')]});await pause(500);
  assert.deepEqual(await ev("[...document.querySelectorAll('[data-cells] textarea')].map(e=>e.value)"),sources);
  await ev("document.querySelector('.at-nav-brand').click()");await pause(800);
  await ev("document.querySelector('a[href=\"/comp4020-ass2-jnheinrich451-eng/workspace/\"]').click()");await pause(1000);
  assert.deepEqual(await ev("[...document.querySelectorAll('[data-cells] textarea')].map(e=>e.value)"),sources);
  await call('Page.reload');await pause(1200);
  assert.deepEqual(await ev("[...document.querySelectorAll('[data-cells] textarea')].map(e=>e.value)"),sources);
  await setCode(0,'raise ValueError("stop run all")');await run();assert.match((await outputs())[0],/stop run all/);
  assert.equal(await ev("document.querySelectorAll('[data-cells] [data-execution]')[1].textContent"),'[ ]');
  console.log('PASS: 3-cell starter, shared variables, fresh Run all, reset, delete, insert, error stop, infinite loop recovery, save/navigation/reload, export/import, transparent scrollbars, desktop/mobile');
}finally{await call('Browser.close');ws.close();browser.kill();}
