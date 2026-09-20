// Build first. RATING_BASE can override the current local preview address.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.RATING_BASE ?? 'http://localhost:4321/comp4020-ass2-jnheinrich451-eng/';
const profile=await mkdtemp(join(tmpdir(),'slop-rating-cost-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
  '--headless=new','--no-sandbox','--disable-gpu','--no-first-run',
  '--remote-debugging-port=9276',`--user-data-dir=${profile}`,'about:blank',
],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws;
try {
  await pause(1800);
  const pages=await(await fetch('http://localhost:9276/json')).json();
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  let id=0;const pending=new Map(),errors=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>reject(new Error('CDP timeout: '+method)),15000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(m.error):resolve(m.result);});ws.send(JSON.stringify({id:n,method,params}));});
  const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const until=async expression=>{for(let i=0;i<80;i++){if(await ev(expression))return;await pause(100);}throw new Error('Timed out: '+expression);};
  await call('Page.enable');await call('Runtime.enable');
  for(const width of [390,800,1440])for(const theme of ['light','dark']){
    await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:base+'sessions/09-human-evaluation/'});
    await until("Boolean(document.querySelector('#rc-title')) && document.querySelector('[data-rc]').dataset.rcReady==='true'");
    await ev('document.fonts.ready');
    await ev(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
    await ev("document.querySelector('#rating-cost').scrollIntoView({block:'start',behavior:'instant'})");
    await pause(200);
    assert.equal(await ev("document.querySelector('#rc-title').textContent"),'What would human evaluation cost?');
    assert.equal(await ev("document.querySelector('[data-rc-dollars]').textContent"),'$7,360');
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,`Overflow at ${width} ${theme}`);
    if(width!==800){const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`build/rating-cost-intro-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));}
    await ev("document.querySelector('[data-rc-halve]').click()");
    assert.equal(await ev("document.querySelector('#rc-difference').value"),'0.25');
    assert.match(await ev("document.querySelector('[data-rc-status]').textContent"),/Half the difference/);
    await ev("document.querySelector('[data-rc-double]').click();document.querySelector('.rc-assumptions summary').click()");
    assert.equal(await ev("document.querySelector('[data-rc-dollars]').textContent"),'$7,360');
    assert.equal(await ev("document.querySelector('.rc-assumptions').open"),true);
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);
    console.log(`Rating-cost introduction and controls passed: ${width}px ${theme}`);
  }
  assert.deepEqual(errors,[],'No runtime exceptions');
} finally {ws?.close();browser.kill();}
