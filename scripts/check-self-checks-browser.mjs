// Isolated Edge profile: never touches the user's browser storage.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const questions=JSON.parse(await readFile('src/data/self-checks.json','utf8'));
const base=process.env.SELF_CHECK_BASE ?? 'http://localhost:4321/comp4020-ass2-jnheinrich451-eng/';
const profile=await mkdtemp(join(tmpdir(),'slop-self-checks-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
  '--headless=new','--no-sandbox','--disable-gpu','--no-first-run',
  '--remote-debugging-port=9281',`--user-data-dir=${profile}`,'about:blank',
],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws;
try {
  await pause(1800);
  const pages=await(await fetch('http://localhost:9281/json')).json();
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  let id=0;const pending=new Map(),errors=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>reject(new Error('CDP timeout: '+method)),15000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(m.error):resolve(m.result);});ws.send(JSON.stringify({id:n,method,params}));});
  const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const until=async expression=>{for(let i=0;i<100;i++){if(await ev(expression))return;await pause(100);}throw new Error('Timed out: '+expression);};
  const nav=async q=>{
    await ev("document.documentElement.dataset.scNavigation='leaving'");
    await call('Page.navigate',{url:base+q.route.slice(1)});
    await until(`!document.documentElement.hasAttribute('data-sc-navigation') && document.querySelector('[data-self-check="${q.id}"] [data-sc-form]')?.hidden===false`);
    await ev('document.fonts.ready');
  };
  const submit=()=>ev("document.querySelector('[data-sc-form]').requestSubmit()");
  const state=()=>ev("document.querySelector('[data-sc-feedback]').dataset.state");
  const isUnlocked=()=>ev("!document.querySelector('[data-sc-unlock]').hidden");
  const setAnswer=async(q,value)=>{
    if(q.kind==='choice')await ev(`document.querySelector('[name="answer"][value="${value}"]').click()`);
    else await ev(`(()=>{const input=document.querySelector('[name="answer"]');input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  };
  await call('Page.enable');await call('Runtime.enable');
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
  for(const q of questions){
    await nav(q);
    assert.equal(await isUnlocked(),false,q.id+' initially locked');
    assert.equal(await ev("document.querySelector('input[type=radio]:checked')===null"),true);
    await submit();assert.equal(await state(),'empty');assert.equal(await isUnlocked(),false);
    await setAnswer(q,q.kind==='choice'?q.options.find(o=>o.value!==q.answer).value:'0');
    await submit();assert.equal(await state(),'incorrect');assert.equal(await isUnlocked(),false);
    if(q.kind==='number'){
      for(const value of ['NaN','Infinity','5+0','0x5','5 apples','1e999']){
        await setAnswer(q,value);await submit();assert.equal(await state(),'invalid',value);assert.equal(await isUnlocked(),false);
      }
    }
    await setAnswer(q,String(q.answer));
    assert.equal(await ev("document.querySelector('[data-sc-feedback]').textContent"),'');
    await submit();assert.equal(await state(),'correct');assert.equal(await isUnlocked(),true);
    assert.equal(await ev(`localStorage.getItem('slop8412:self-check:v1:${q.id}')`),'unlocked');
    await setAnswer(q,q.kind==='choice'?q.options.find(o=>o.value!==q.answer).value:'0');
    assert.equal(await ev("document.querySelector('[data-sc-feedback]').textContent"),'');
    assert.equal(await isUnlocked(),true,'Editing does not revoke code');
    console.log('Attempt/retry/unlock: '+q.id);
  }
  const q=questions[0];await nav(q);assert.equal(await isUnlocked(),true,'Return restores unlock');
  await ev(`localStorage.removeItem('slop8412:self-check:v1:${q.id}')`);await nav(q);
  await ev("document.querySelector('.sc-explanation summary').focus()");
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await ev("document.querySelector('.sc-explanation').open"),true,'Keyboard answer disclosure');
  assert.equal(await isUnlocked(),false,'Opening an answer alone does not write progress');
  await ev("document.querySelector('[data-sc-review]').click()");assert.equal(await isUnlocked(),true);
  const saved=await ev('JSON.stringify(Object.entries(localStorage).sort())');
  await ev("document.querySelector('.self-check footer a').click()");
  await until("Boolean(document.querySelector('.check-review')) && document.querySelector('.review-actions')?.hidden===false");
  assert.equal(await ev("document.querySelectorAll('.sc-explanation').length"),17);
  await ev("document.querySelector('[data-expand-checks]').click()");
  assert.equal(await ev("document.querySelectorAll('.sc-explanation[open]').length"),17);
  await ev("document.querySelector('[data-collapse-checks]').click()");
  assert.equal(await ev("document.querySelectorAll('.sc-explanation[open]').length"),0);
  assert.equal(await ev('JSON.stringify(Object.entries(localStorage).sort())'),saved,'Preview does not change progress');
  await ev("document.querySelector('.self-check a').click()");
  await until("document.querySelector('[data-self-check=\"L01\"] [data-sc-form]')?.hidden===false");
  assert.equal(await isUnlocked(),true,'SPA return restores unlock and handlers');
  await setAnswer(q,q.answer);await submit();assert.equal(await state(),'correct');
  console.log('Review unlock, keyboard disclosure, preview isolation and SPA navigation passed');

  for(const width of [390,1440])for(const theme of ['light','dark'])for(const sample of [questions[0],questions[1]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:1050,deviceScaleFactor:1,mobile:false});
    await nav(sample);await ev(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
    await setAnswer(sample,sample.kind==='choice'?'A':'13');await submit();
    await ev("document.querySelector('.self-check').scrollIntoView({block:'start',behavior:'instant'})");await pause(200);
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,`${width} ${theme} ${sample.id}`);
    let shot=await call('Page.captureScreenshot',{format:'png'});
    await writeFile(`build/self-check-${sample.id}-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
    await ev("document.querySelector('.sc-explanation').open=true");
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);
  }
  assert.deepEqual(errors,[],'No runtime exceptions during normal interaction');
  const blocked=await call('Page.addScriptToEvaluateOnNewDocument',{source:"Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}});Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('Blocked'))}});"});
  await nav(q);await setAnswer(q,q.answer);await submit();assert.equal(await isUnlocked(),true);
  assert.ok((await ev("document.querySelector('[data-sc-storage]').textContent")).includes('storage is unavailable'));
  await ev("document.querySelector('[data-sc-copy]').click()");
  await until("document.querySelector('[data-sc-storage]').textContent.includes('copy the displayed code manually')");
  await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:blocked.identifier});
  await call('Emulation.setScriptExecutionDisabled',{value:true});
  await call('Page.navigate',{url:base+q.route.slice(1)});await pause(700);
  assert.equal(await ev("document.querySelector('[data-sc-form]').hidden"),true);
  assert.ok((await ev("document.querySelector('.sc-explanation').textContent")).includes('Correct: B.'));
  await call('Emulation.setScriptExecutionDisabled',{value:false});
  // The fixed upstream theme reads at-theme without a storage guard. Record
  // its existing failure under total storage denial; do not mistake it for a
  // failure of the quiz fallback or suppress unrelated exceptions.
  assert.ok(errors.every(e=>e.exception?.description==='SecurityError: Blocked'),'Only the injected storage denial may be unhandled by the existing theme');
  if(errors.length)console.log(`Known upstream limitation: ${errors.length} theme exceptions under total storage denial; self-check fallback passed.`);
  console.log('Responsive themes, blocked storage/clipboard and no-JS explanation passed');
}finally{ws?.close();browser.kill();}
