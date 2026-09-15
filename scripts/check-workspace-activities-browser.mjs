// Build first; run a production preview on :4323 (or set WORKSPACE_ACTIVITIES_BASE).
import {spawn} from 'node:child_process';
import {mkdtemp, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const base = process.env.WORKSPACE_ACTIVITIES_BASE ?? 'http://localhost:4323/comp4020-ass2-jnheinrich451-eng/';
const profile = await mkdtemp(join(tmpdir(), 'slop-workspace-links-'));
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9274', `--user-data-dir=${profile}`, 'about:blank',
], {stdio: 'ignore', windowsHide: true});
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws;
try {
  await pause(1800);
  let pages;
  for (let i=0; i<40; i++) {
    try {pages = await (await fetch('http://127.0.0.1:9274/json')).json(); if(pages.some(p=>p.type==='page')) break;} catch {}
    await pause(150);
  }
  assert.ok(pages?.some(p=>p.type==='page'), 'Edge debugging endpoint is available');
  ws = new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  let id=0;
  const pending=new Map(), errors=[];
  ws.onmessage=e=>{const msg=JSON.parse(e.data); if(msg.method==='Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails); if(msg.id){pending.get(msg.id)?.(msg);pending.delete(msg.id);}};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(new Error('CDP timeout: '+method));},15000);pending.set(n,m=>{clearTimeout(timer);m.error?reject(m.error):resolve(m.result);});ws.send(JSON.stringify({id:n,method,params}));});
  const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value;};
  const until=async expression=>{for(let i=0;i<80;i++){if(await ev(expression))return;await pause(100);}throw new Error('Timed out: '+expression);};
  await call('Page.enable');await call('Runtime.enable');
  const routes=['sessions/04-getting-it-right/','lectures/week-02/','assessments/measurement-log/'];
  for(const route of routes){
    for(const width of [390,800,1440]){
      await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
      await call('Page.navigate',{url:base+route});
      await until("document.querySelectorAll('#workspace-activity .activity-steps > li').length===5");
      await ev('document.fonts.ready');
      for(const theme of ['light','dark']){
        await ev(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
        await ev("document.querySelector('#workspace-activity').scrollIntoView({block:'start',behavior:'instant'})");
        await pause(200);
        const layout=await ev(`(()=>{const panel=document.querySelector('#workspace-activity'),r=panel.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,panelOverflow:panel.scrollWidth>panel.clientWidth,left:r.left,right:r.right,grid:getComputedStyle(panel.querySelector('li')).gridTemplateColumns};})()`);
        assert.equal(layout.overflow,false,`${route} ${width} ${theme}: page overflow`);
        assert.equal(layout.panelOverflow,false,`${route} ${width} ${theme}: panel overflow`);
        assert.ok(layout.left>=0 && layout.right<=width, 'Panel fits viewport');
        if(width===390) assert.equal(layout.grid.split(' ').length,1,'Stack labels on narrow screens');
        await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
        await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
        assert.equal(await ev("(()=>{const a=document.querySelector('.activity-link');a.focus();return a===document.activeElement && getComputedStyle(a).outlineStyle!=='none';})()"),true,'Visible keyboard focus');
        await ev("document.querySelector('#workspace-activity').scrollIntoView({block:'start',behavior:'instant'})");
        if(route===routes[0] && [390,1440].includes(width)){
          const shot=await call('Page.captureScreenshot',{format:'png'});
          await writeFile(`build/workspace-activity-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
        }
      }
    }
    // Follow the actual link through the client router, then use browser Back.
    const target=await ev("document.querySelector('.activity-link').href");
    await ev("document.querySelector('.activity-link').click()");
    await until(`location.href===${JSON.stringify(target)} && !document.querySelector('#workspace-activity')`);
    await until("Boolean(document.querySelector('math-lab, python-workspace, image-lab'))");
    await ev('history.back()');
    await until("Boolean(document.querySelector('#workspace-activity'))");
    await ev("document.querySelector('.activity-policy a').click()");
    await until("Boolean(document.querySelector('#browser-workspaces')) && location.hash==='#browser-workspaces'");
  }
  assert.deepEqual(errors,[],'No runtime exceptions');
  console.log('Workspace activities: 18 responsive/theme checks, focus, three lab links, Back and policy links passed.');
} finally {
  ws?.close();browser.kill();
}
