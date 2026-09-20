// Run against the local site; SEARCH_BASE may point to a built preview with Pagefind.
import {spawn} from 'node:child_process';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.SEARCH_BASE ?? 'http://localhost:4321/comp4020-ass2-jnheinrich451-eng/';
const profile=await mkdtemp(join(tmpdir(),'slop-search-dismissal-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
  '--headless=new','--no-sandbox','--disable-gpu','--no-first-run',
  '--remote-debugging-port=9275',`--user-data-dir=${profile}`,'about:blank',
],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws;
try {
  await pause(1800);
  const pages=await(await fetch('http://localhost:9275/json')).json();
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  let id=0;const pending=new Map(),errors=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(new Error('CDP timeout: '+method));},15000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(m.error):resolve(m.result);});ws.send(JSON.stringify({id:n,method,params}));});
  const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const until=async expression=>{for(let i=0;i<80;i++){if(await ev(expression))return;await pause(100);}throw new Error('Timed out: '+expression);};
  const open=async()=>{await ev("(()=>{const trigger=document.querySelector('[data-search-trigger]');trigger.focus();trigger.click();})()");await until("document.querySelector('[data-at-search-dialog]').open && document.activeElement.matches('[data-at-search-input]')");};
  const closed=async()=>{
    await until("!document.querySelector('[data-at-search-dialog]').open");
    // Native close events (including the theme's query reset) run asynchronously.
    await ev('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  };
  const mouse=(type,point)=>call('Input.dispatchMouseEvent',{type,...point,button:'left',clickCount:1});
  const click=async point=>{await mouse('mousePressed',point);await mouse('mouseReleased',point);};
  const key=async()=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});};
  const inputPoint=()=>ev("(()=>{const r=document.querySelector('[data-at-search-input]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
  await call('Page.enable');await call('Runtime.enable');
  for(const width of [390,1440]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:base});
    await until("Boolean(document.querySelector('[data-at-search-trigger-initialized]'))");
    for(const theme of ['light','dark']){
      await ev(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
      await open();
      await click(await inputPoint());
      assert.equal(await ev("document.querySelector('[data-at-search-dialog]').open"),true,'Input click stays open');
      const blank=await ev("(()=>{const r=document.querySelector('.at-search-panel').getBoundingClientRect();return {x:r.left+4,y:r.top+4};})()");
      await click(blank);
      assert.equal(await ev("document.querySelector('[data-at-search-dialog]').open"),true,'Panel padding stays open');
      // Releasing a text-selection drag outside must not count as a backdrop click.
      await mouse('mousePressed',await inputPoint());
      await mouse('mouseReleased',{x:3,y:850});
      assert.equal(await ev("document.querySelector('[data-at-search-dialog]').open"),true,'Drag from panel stays open');
      await click({x:3,y:850});await closed();
      await until("document.activeElement.matches('[data-search-trigger]')");
      await open();await key();await closed();
      await open();
      // A focusable result exercises native Escape outside the input as well.
      await ev("(()=>{const ul=document.querySelector('[data-at-search-results]');ul.hidden=false;const li=document.createElement('li'),a=document.createElement('a');a.href='#';a.textContent='Dismissal test result';li.append(a);ul.append(li);a.focus();})()");
      await key();await closed();
      await until("document.querySelector('[data-at-search-input]').value==='' && document.querySelector('[data-at-search-results]').children.length===0");
      console.log(`Dismissal passed: ${width}px ${theme}`);
    }
  }
  // Page-load reinitialisation covers Astro client navigation and repeated visits.
  for(const route of ['lectures/week-02/','policies/','']){
    await ev(`(()=>{const a=document.createElement('a');a.href=${JSON.stringify(base+route)};a.textContent='Test navigation';document.body.append(a);a.click();})()`);
    await until(`location.pathname===${JSON.stringify(new URL(base+route).pathname)} && Boolean(document.querySelector('[data-at-search-trigger-initialized]')) && Boolean(document.querySelector('[data-search-dismissal-ready]'))`);
    await ev('document.fonts.ready');await pause(400);
    console.log('Checking dismissal after navigation to',route||'home');
    await open();await click({x:3,y:850});await closed();
  }
  if(process.env.SEARCH_WITH_INDEX==='1'){
    await open();await ev("(()=>{const input=document.querySelector('[data-at-search-input]');input.value='covariance';input.dispatchEvent(new Event('input',{bubbles:true}));})()");
    try {await until("document.querySelectorAll('[data-at-search-results] a').length>0");}
    catch(error){console.error(await ev("({status:document.querySelector('[data-at-search-status]').textContent,base:document.querySelector('[data-at-search-dialog]').dataset.pagefindBase})"));console.error(errors);throw error;}
    const target=await ev("document.querySelector('[data-at-search-results] a').href");
    const point=await ev("(()=>{const a=document.querySelector('[data-at-search-results] a');a.scrollIntoView({block:'nearest'});const r=a.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
    await click(point);await until(`location.href===${JSON.stringify(target)}`);
    console.log('Real indexed search and result navigation passed');
  }
  assert.deepEqual(errors,[],'No runtime exceptions');
  console.log('Search dismissal checks passed, including navigation and reopening.');
} finally {ws?.close();browser.kill();}
