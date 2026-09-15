// Local-only template acceptance samples. Run Astro dev on :4322 first.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const base = 'http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
const profile = await mkdtemp(join(tmpdir(), 'slop-paper-deck-'));
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--enable-automation',
  '--remote-debugging-port=9262', `--user-data-dir=${profile}`,
], { stdio: 'ignore', windowsHide: true });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
await pause(1800);
const pages = await (await fetch('http://localhost:9262/json')).json();
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
  await writeFile(`build/week-two-template-${name}.png`, Buffer.from(result.data, 'base64'));
};
const navigate = async path => {
  await call('Page.navigate', { url: base + path });
  await until("document.querySelector('.reveal.ready') !== null");
  await ev('document.fonts.ready');
  if (path.includes('week-02-template')) {
    await until("[...document.querySelectorAll('.paper-slide img')].every(i => i.complete && i.naturalWidth > 0)");
  }
  await pause(350);
};
try {
  await call('Page.enable');
  await call('Runtime.enable');
  for (const [width, height] of [[1920, 1080], [800, 1000], [390, 844]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await navigate('decks/week-02-template/');
    assert.equal(await ev("document.querySelectorAll('section.paper-slide').length"), 3);
    assert.equal(await ev('document.documentElement.scrollWidth > innerWidth'), false);
    assert.equal(await ev("getComputedStyle(document.body).backgroundColor"), 'rgb(246, 242, 230)');
    assert.equal(await ev("getComputedStyle(document.querySelector('.paper-heading h2')).borderBottomWidth"), '0px');
    for (let index = 0; index < 3; index++) {
      if (width <= 600) {
        await ev(`document.querySelectorAll('section.paper-slide')[${index}].scrollIntoView()`);
      } else {
        await ev(`location.hash = '#/${index + 1}'`);
        await until(`document.querySelectorAll('section.paper-slide')[${index}].classList.contains('present')`);
      }
      await pause(200);
      if (index === 0 && width > 600) {
        assert.ok(await ev(`(() => {
          const slide = document.querySelector('.paper-opening'), title = slide.querySelector('h1');
          const scale = slide.getBoundingClientRect().width / slide.offsetWidth;
          return Math.abs(title.getBoundingClientRect().left - slide.getBoundingClientRect().left - 72 * scale) < 2;
        })()`), 'Opening title is left-aligned with the template gutter');
      }
      const overflow = await ev(`(() => {
        const slide = document.querySelectorAll('section.paper-slide')[${index}], bounds = slide.getBoundingClientRect();
        return [...slide.querySelectorAll('h1,h2,h3,p,img,footer')].filter(element => {
          const box = element.getBoundingClientRect();
          return box.width && (box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.bottom > bounds.bottom + 1);
        }).map(element => element.textContent || element.getAttribute('alt'));
      })()`);
      assert.deepEqual(overflow, [], `Slide ${index + 1} stays inside its canvas at ${width}`);
      await shot(`${width}-${index + 1}`);
    }
  }
  // Keyboard navigation and the plain exit control remain functional.
  await call('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await navigate('decks/week-02-template/');
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await until("document.querySelector('.paper-content').classList.contains('present')");
  await ev("document.querySelector('.paper-content .paper-foot a[href=\"#/3\"]').click()");
  await until("document.querySelector('.paper-ending').classList.contains('present')");
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await until("location.pathname.endsWith('/lectures/week-02/') && !document.querySelector('.reveal')");
  await navigate('decks/week-02/');
  assert.equal(await ev("document.querySelectorAll('section.paper-lecture').length"), 17);
  assert.equal(await ev("getComputedStyle(document.body).backgroundColor"), 'rgb(246, 242, 230)');
  assert.deepEqual(exceptions, []);
  console.log('PASS: three samples at 1920/800/390; images loaded; no overflow; keyboard, links and Escape; approved full deck uses the paper layout.');
} finally {
  await call('Browser.close'); ws.close(); browser.kill();
}
