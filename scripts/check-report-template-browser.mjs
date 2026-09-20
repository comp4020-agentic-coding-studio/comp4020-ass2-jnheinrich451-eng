// Run against the built site. REPORT_TEMPLATE_BASE overrides the local preview.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.REPORT_TEMPLATE_BASE ?? 'http://localhost:4321/comp4020-ass2-jnheinrich451-eng/';
const profile=await mkdtemp(join(tmpdir(),'slop-report-template-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
  '--headless=new','--no-sandbox','--disable-gpu','--no-first-run',
  '--remote-debugging-port=9277',`--user-data-dir=${profile}`,'about:blank',
],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws;
try {
  await pause(1800);
  const pages=await(await fetch('http://localhost:9277/json')).json();
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  let id=0;const pending=new Map(),errors=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>reject(new Error('CDP timeout: '+method)),15000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(m.error):resolve(m.result);});ws.send(JSON.stringify({id:n,method,params}));});
  const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const until=async expression=>{for(let i=0;i<80;i++){if(await ev(expression))return;await pause(100);}throw new Error('Timed out: '+expression);};
  await call('Page.enable');await call('Runtime.enable');
  for(const width of [390,800,1440])for(const theme of ['light','dark']){
    await call('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:base+'assessments/final-report/'});
    await until("Boolean(document.querySelector('#report-template'))");
    await ev('document.fonts.ready');
    await ev(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
    await ev("document.querySelector('a[href=\"#report-template\"]').click()");
    await until("location.hash==='#report-template'");await pause(500);
    await ev("document.querySelector('#report-template').scrollIntoView({block:'start',behavior:'instant'})");
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,`Overflow at ${width} ${theme}`);
    assert.equal(await ev("getComputedStyle(document.querySelector('.template-pdf')).display!=='none'"),width>700);
    if(width<=700) await until("document.querySelector('.template-mobile-preview img').naturalWidth>0");
    const shot=await call('Page.captureScreenshot',{format:'png'});
    await writeFile(`build/report-template-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
    if(width===390){
      await ev("document.querySelector('.template-mobile-preview').scrollIntoView({block:'start',behavior:'instant'})");
      const mobileShot=await call('Page.captureScreenshot',{format:'png'});
      await writeFile(`build/report-template-preview-${theme}-${width}.png`,Buffer.from(mobileShot.data,'base64'));
    }
    await ev("document.querySelector('.template-instructions summary').click()");
    assert.equal(await ev("document.querySelector('.template-instructions').open"),true);
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);
    const links=await ev("[...document.querySelectorAll('.template-actions a')].map(a=>({url:a.href,download:a.hasAttribute('download')}))");
    assert.equal(links.filter(a=>a.download).length,2);
    for(const link of links){
      const response=await fetch(link.url);assert.equal(response.status,200);
      const bytes=Buffer.from(await response.arrayBuffer());
      assert.ok(bytes.length>1000);
      assert.equal(bytes.subarray(0,link.url.endsWith('.zip')?2:5).toString(),link.url.endsWith('.zip')?'PK':'%PDF-');
    }
    console.log(`Report template preview and downloads passed: ${width}px ${theme}`);
  }
  assert.deepEqual(errors,[],'No runtime exceptions');
} finally {ws?.close();browser.kill();}
