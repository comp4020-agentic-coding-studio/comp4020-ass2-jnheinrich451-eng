// Verify the built local preview, including profile links and responsive themes.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.PEOPLE_BASE ?? 'http://localhost:4321/comp4020-ass2-jnheinrich451-eng/';
const profile=await mkdtemp(join(tmpdir(),'slop-people-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
  '--headless=new','--no-sandbox','--disable-gpu','--no-first-run',
  '--remote-debugging-port=9278',`--user-data-dir=${profile}`,'about:blank',
],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws;
try {
  await pause(1800);
  const pages=await(await fetch('http://localhost:9278/json')).json();
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  let id=0;const pending=new Map(),errors=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>reject(new Error('CDP timeout: '+method)),15000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(m.error):resolve(m.result);});ws.send(JSON.stringify({id:n,method,params}));});
  const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const until=async expression=>{for(let i=0;i<80;i++){if(await ev(expression))return;await pause(100);}throw new Error('Timed out: '+expression);};
  await call('Page.enable');await call('Runtime.enable');
  for(const width of [390,1440])for(const theme of ['light','dark'])for(const slug of ['','helen-sandoval/','tomasz-wierzba/']){
    await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:base+'people/'+slug});
    await until(`location.href===${JSON.stringify(base+'people/'+slug)} && document.readyState==='complete'`);
    await until("document.body?.textContent.includes('Fictional teaching staff')");
    await ev('document.fonts.ready');
    await ev(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);await pause(300);
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,`Overflow ${slug} ${width} ${theme}`);
    if(slug){
      assert.equal(await ev("document.querySelectorAll('.profile-body h2').length"),3);
      const links=await ev("[...document.querySelectorAll('.profile-body a')].map(a=>a.href)");
      for(const url of links)assert.equal((await fetch(url)).status,200,url);
      await ev("document.querySelector('.profile-body').scrollIntoView({block:'start',behavior:'instant'})");
    }else{
      assert.ok(await ev("[...document.querySelectorAll('main a')].some(a=>a.pathname.endsWith('/people/helen-sandoval/'))"));
      assert.ok(await ev("[...document.querySelectorAll('main a')].some(a=>a.pathname.endsWith('/people/tomasz-wierzba/'))"));
    }
    const shot=await call('Page.captureScreenshot',{format:'png'});
    await writeFile(`build/people-${slug.replace('/','')||'index'}-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
    console.log(`People verified: ${slug||'index'} ${width}px ${theme}`);
  }
  assert.deepEqual(errors,[],'No runtime exceptions');
}finally{ws?.close();browser.kill();}
