// Full Week 2 paper-layout checks. Run Astro dev on :4322 first.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const base = 'http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
const profile = await mkdtemp(join(tmpdir(), 'slop-paper-full-'));
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--enable-automation',
  '--remote-debugging-port=9263', `--user-data-dir=${profile}`,
], { stdio: 'ignore', windowsHide: true });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
await pause(1800);
const pages = await (await fetch('http://localhost:9263/json')).json();
const ws = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const jobs = new Map(), exceptions = [];
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  if (message.id) { jobs.get(message.id)?.(message); jobs.delete(message.id); }
};
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const n = ++id;
  jobs.set(n, message => message.error ? reject(message.error) : resolve(message.result));
  ws.send(JSON.stringify({ id: n, method, params }));
});
const ev = async expression => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const until = async expression => {
  for (let i = 0; i < 80; i++) { if (await ev(expression)) return; await pause(150); }
  throw new Error('Timed out: ' + expression);
};
const shot = async name => {
  const result = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`build/week-two-paper-${name}.png`, Buffer.from(result.data, 'base64'));
};
const navigate = async path => {
  await call('Page.navigate', { url: base + path });
  await until("document.querySelector('.reveal.ready') !== null");
  await ev('document.fonts.ready');
  await pause(350);
};
const defects = [];
try {
  await call('Page.enable'); await call('Runtime.enable');
  for (const [width, height] of [[1920,1080],[800,1000],[390,844]]) {
    await call('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:false});
    await navigate('decks/week-02/');
    assert.equal(await ev("document.querySelectorAll('section.paper-lecture').length"),17);
    assert.equal(await ev("getComputedStyle(document.body).backgroundColor"),'rgb(246, 242, 230)');
    for (let index=0; index<17; index++) {
      if(width<=600) await ev(`document.querySelectorAll('section.paper-lecture')[${index}].scrollIntoView()`);
      else {
        await ev(`location.hash='#/${index+1}'`);
        await until(`document.querySelectorAll('section.paper-lecture')[${index}].classList.contains('present')`);
      }
      // Inspect the most crowded state, after every derivation line is revealed.
      await ev(`document.querySelectorAll('section.paper-lecture')[${index}].querySelectorAll('img').forEach(e=>{e.loading='eager'; if(e.dataset.src && !e.getAttribute('src')) e.src=e.dataset.src;})`);
      await until(`[...document.querySelectorAll('section.paper-lecture')[${index}].querySelectorAll('img')].every(i=>i.complete && i.naturalWidth>0)`);
      await ev(`document.querySelectorAll('section.paper-lecture')[${index}].querySelectorAll('.fragment').forEach(e=>e.classList.add('visible'))`);
      await pause(80);
      if(width<=600) await ev(`document.querySelectorAll('section.paper-lecture')[${index}].scrollIntoView()`);
      const bad=await ev(`(()=>{
        const s=document.querySelectorAll('section.paper-lecture')[${index}], b=s.getBoundingClientRect(), f=s.querySelector('footer').getBoundingClientRect();
        return [...s.querySelectorAll('.paper-body h1,.paper-body h2,.paper-body p,.paper-body img,.paper-body li,.paper-body .matrix')].filter(e=>{
          const r=e.getBoundingClientRect();
          return r.width && (r.left<b.left-1 || r.right>b.right+1 || r.bottom>f.top+1);
        }).map(e=>e.textContent||e.getAttribute('alt'));
      })()`);
      if(bad.length)defects.push({width,slide:index+1,bad});
      await shot(`${width}-${String(index+1).padStart(2,'0')}`);
    }
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);
    if(width<=600) assert.ok(await ev(`(()=>{
      const pipeline=document.querySelector('section.paper-slide--13 .pipeline');
      const output=pipeline.querySelector('.join').getBoundingClientRect();
      return [...pipeline.querySelectorAll('.rail')].every(e=>e.getBoundingClientRect().bottom<=output.top);
    })()`),'Portrait pipeline places the shared distance after both input rails');
  }
  await call('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
  await navigate('decks/week-02/');
  await ev("location.hash='#/7'");
  await until("document.querySelector('.paper-slide--7').classList.contains('present')");
  assert.equal(await ev("document.querySelectorAll('.paper-slide--7 .fragment.visible').length"),0);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  await until("document.querySelectorAll('.paper-slide--7 .fragment.visible').length===1");
  await ev("document.querySelector('.paper-slide--7 a[aria-label=\"Next slide\"]').click()");
  await until("document.querySelector('.paper-slide--8').classList.contains('present')");
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await until("location.pathname.endsWith('/lectures/week-02/') && !document.querySelector('.reveal')");
  assert.deepEqual(exceptions,[]);
  console.log(JSON.stringify({defects},null,2));
  assert.deepEqual(defects,[]);
  console.log('PASS: all 17 slides at 1920/800/390, full-reveal bounds, no footer collisions, no page overflow, loaded images, stepwise keyboard reveal, next link and Escape.');
} finally {
  await call('Browser.close'); ws.close(); browser.kill();
}
