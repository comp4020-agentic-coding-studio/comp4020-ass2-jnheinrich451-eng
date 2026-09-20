// Isolated Edge profile: never touches the user's browser storage.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const questions=JSON.parse(await readFile('src/data/self-checks.json','utf8'));
const base=process.env.COMIC_BASE ?? 'http://localhost:4321/comp4020-ass2-jnheinrich451-eng/';
const profile=await mkdtemp(join(tmpdir(),'slop-comics-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
  '--headless=new','--no-sandbox','--disable-gpu','--no-first-run',
  '--remote-debugging-port=9282',`--user-data-dir=${profile}`,'about:blank',
],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws;
try {
  await pause(1800);
  const pages=await(await fetch('http://localhost:9282/json')).json();
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
  let id=0;const pending=new Map(),errors=[],requests=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}};
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
  const isUnlocked=()=>ev("!document.querySelector('[data-sc-unlock]').hidden");
  const setAnswer=async(q,value)=>{
    if(q.kind==='choice')await ev(`document.querySelector('[name="answer"][value="${value}"]').click()`);
    else await ev(`(()=>{const input=document.querySelector('[name="answer"]');input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  };

  await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
  let navigation=0;
  const gallery=async(hash='')=>{
    await ev("document.documentElement.dataset.galleryLeaving='true'");
    await call('Page.navigate',{url:base+'memes/?browser-check='+ ++navigation +hash});
    await until("!document.documentElement.dataset.galleryLeaving && document.querySelector('[data-collection-ready=true]')");
    await ev('document.fonts.ready');
  };
  const count=()=>ev("document.querySelector('[data-collected-total]').textContent");
  const submitCode=async value=>{await ev(`document.querySelector('#comic-code').value=${JSON.stringify(value)};document.querySelector('[data-code-form]').requestSubmit()`);};
  const previewOn=async()=>{
    await ev("document.querySelector('[data-collection-spoilers]').open=true");
    await pause(50);
    for(let i=0;i<3;i++)await ev("document.querySelector('[data-reveal-preview]').click()");
    assert.equal(await ev("document.querySelector('[data-preview-banner]').hidden"),false);
  };
  const snapshot=()=>ev("JSON.stringify(Object.entries(localStorage).filter(([k])=>k.startsWith('slop8412:self-check:')).sort())");
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'}]});
  await gallery();assert.equal(await count(),'0 / 17');
  assert.equal(await ev('document.documentElement.dataset.theme'),'dark','First visit defaults dark even with light OS preference');
  assert.equal(await ev("localStorage.getItem('at-theme')"),null,'Default does not overwrite a preference');
  await until("document.querySelector('.at-footer-theme-toggle').getAttribute('aria-label')==='Switch to light theme'");
  await ev("document.querySelector('.at-footer-theme-toggle').click()");
  assert.equal(await ev('document.documentElement.dataset.theme'),'light');
  assert.equal(await ev("localStorage.getItem('at-theme')"),'light');
  await gallery();assert.equal(await ev('document.documentElement.dataset.theme'),'light','Explicit light survives reload');
  await ev("document.querySelector('.at-nav-links > li > a[href$=\"/lectures/\"]').click()");
  await until("location.pathname.endsWith('/lectures/') && !document.querySelector('[data-comic-collection]')");
  assert.equal(await ev('document.documentElement.dataset.theme'),'light','Explicit light survives client navigation');
  await nav(questions[0]);
  assert.equal(await ev('document.documentElement.dataset.theme'),'light','Content layout keeps light');
  await ev("document.querySelector('.at-footer-theme-toggle').click()");
  assert.equal(await ev('document.documentElement.dataset.theme'),'dark');
  await gallery();assert.equal(await ev('document.documentElement.dataset.theme'),'dark','Explicit dark survives reload');
  const lockedMenu=()=>ev("document.querySelectorAll('.at-nav [data-comic-nav][aria-disabled=true]:not([href])').length");
  assert.equal(await lockedMenu(),17,'All comic jumps start locked with no href');
  assert.equal(await ev("[...document.querySelectorAll('.at-nav [data-comic-lock-icon]')].every(e=>e.style.display!=='none')"),true);
  await ev("document.querySelector('.at-nav [data-comic-nav=L01]').click()");
  assert.equal(await ev('location.hash'),'','Locked jump cannot navigate');
  assert.equal(await ev("document.querySelectorAll('[data-preview-src][src]').length"),0,'Locked art is not fetched');
  for(const value of ['', 'B', 'SLOP-L03','<script>']){
    await submitCode(value);assert.equal(await count(),'0 / 17');
    assert.ok(await ev("document.querySelector('[data-collection-status]').textContent.length>0"));
  }
  await submitCode('  slop-l01 ');assert.equal(await count(),'1 / 17');
  assert.equal(await lockedMenu(),16,'Collecting enables its menu entry immediately');
  assert.ok(await ev("document.querySelector('.at-nav [data-comic-nav=L01]').href.endsWith('#comic-L01')"));
  await ev("window.scrollTo({top:0,behavior:'instant'})");await pause(250);
  await ev("document.querySelector('#course-jump-memes').showPopover();document.querySelector('.at-nav [data-comic-nav=L01]').focus({preventScroll:true})");
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});
  assert.equal(await ev("document.activeElement.matches('#course-jump-memes .course-jump-overview')"),true,'Keyboard skips locked comic rows');
  await ev("document.querySelector('.at-nav [data-comic-nav=L01]').click()");
  await until("!document.querySelector('#course-jump-memes').matches(':popover-open')");
  await until("document.querySelector('#comic-L01 [data-preview-src]')?.naturalWidth>0");
  assert.equal(requests.some(url=>url.includes('/comics/')&&url.includes('-full.webp')),false,'Full artwork is deferred until reader opens');
  assert.equal(await ev("document.querySelector('#comic-L01 [data-card-content]').hidden"),false);
  assert.equal(await ev("document.querySelector('#comic-L01').open"),true);
  await submitCode('SLOP-L01');assert.equal(await count(),'1 / 17');
  await gallery('#comic-L01');assert.equal(await count(),'1 / 17');
  assert.equal(await ev("document.querySelector('#comic-L01').open"),true);
  const before=await snapshot();
  await ev("document.querySelector('[data-collection-spoilers]').open=true");await pause(30);
  await ev("document.querySelector('[data-reveal-preview]').click();document.querySelector('[data-reveal-preview]').click()");
  assert.equal(await ev("document.querySelector('[data-preview-banner]').hidden"),true);
  await ev("document.querySelector('[data-collection-spoilers]').open=false");await pause(50);
  assert.ok((await ev("document.querySelector('[data-reveal-preview]').textContent")).includes('0 / 3'));
  await ev("document.querySelector('[data-collection-spoilers]').open=true");await pause(30);
  await ev("document.querySelector('[data-reveal-preview]').focus()");
  for(let i=0;i<3;i++){
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  }
  assert.equal(await ev("document.querySelector('[data-preview-banner]').hidden"),false);
  assert.equal(await ev("document.querySelectorAll('[data-card-content]:not([hidden])').length"),17);
  assert.equal(await lockedMenu(),16,'Spoilers never unlock menu links');
  await submitCode('SLOP-S01');assert.equal(await snapshot(),before,'Preview blocks collection writes');
  await ev("document.querySelector('[data-expand-comics]').click()");
  assert.equal(await ev("document.querySelectorAll('[data-comic-id][open]').length"),17);
  await ev("document.querySelector('[data-collapse-comics]').click()");
  assert.equal(await ev("document.querySelectorAll('[data-comic-group][open]').length"),0);
  await ev("document.querySelector('[data-exit-preview]').click()");
  assert.equal(await count(),'1 / 17');assert.equal(await snapshot(),before);
  assert.equal(await ev("document.querySelector('#comic-S01 [data-card-content]').hidden"),true);
  await previewOn();await gallery();assert.equal(await ev("document.querySelector('[data-preview-banner]').hidden"),true);
  assert.equal(await count(),'1 / 17');
  // Spoilers also end on a real client-router round trip; earned cards survive.
  await previewOn();
  await ev("document.querySelector('.at-nav-links > li > a[href$=\"/lectures/\"]').click()");
  await until("location.pathname.endsWith('/lectures/') && !document.querySelector('[data-comic-collection]')");
  await ev("document.querySelector('.at-nav-links > li > a[href$=\"/memes/\"]').click()");
  await until("document.querySelector('[data-collection-ready=true]')");
  assert.equal(await ev("document.querySelector('[data-preview-banner]').hidden"),true);
  assert.equal(await ev("document.querySelector('#comic-S01 [data-card-content]').hidden"),true);
  assert.equal(await lockedMenu(),16);
  // Pagehide covers the back/forward cache too, without touching stored unlocks.
  await previewOn();await ev("window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}))");
  assert.equal(await ev("document.querySelector('[data-preview-banner]').hidden"),true);
  assert.equal(await count(),'1 / 17');
  // Real SPA round trip from the matching quiz.
  await nav(questions.find(q=>q.id==='L02'));await setAnswer(questions.find(q=>q.id==='L02'),'5');await submit();
  assert.equal(await lockedMenu(),15,'A correct quiz answer enables its menu entry on that page');
  await ev("document.querySelector('.at-nav [data-comic-nav=L02]').click()");
  await until("document.querySelector('[data-collection-ready=true]')");
  assert.equal(await count(),'2 / 17');
  assert.equal(await ev("document.querySelector('#comic-L02 [data-card-content]').hidden"),false);
  assert.equal(await ev("document.querySelector('#comic-L02').open"),true);
  await ev("document.querySelector('#comic-L02 .comic-links a').click()");
  await until("document.querySelector('[data-self-check=L02] [data-sc-form]')?.hidden===false");
  assert.equal(await isUnlocked(),true);
  console.log('Codes, duplicates, persistence, folding, three-press keyboard preview and SPA round trip passed');
  // Check every code and source link, then inspect narrow/wide themes.
  await gallery();
  for(const q of questions)await submitCode(q.code);
  assert.equal(await count(),'17 / 17');
  for (const q of questions) {
    await ev(`document.querySelector('#comic-${q.id} [data-read-comic]').click()`);
    await until(`document.querySelector('[data-reader-image]').src.includes('/${q.id}-full.webp') && !document.querySelector('[data-reader-image]').hidden`);
    assert.ok((await ev("document.querySelector('[data-reader-note]').textContent")).length>40);
    await ev("document.querySelector('[data-reader-close]').click()");
    await until("document.body.style.overflow !== 'hidden'");
  }
  console.log('All 17 full comics loaded with their matching caveats');
  for(const width of [390,800,1920])for(const theme of ['light','dark']){
    await call('Emulation.setDeviceMetricsOverride',{width,height:width===390?844:1080,deviceScaleFactor:1,mobile:false});
    await gallery('#comic-L01');await ev(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
    await pause(250);
    await until("[...document.querySelectorAll('#comic-L01 img')].every(i=>i.complete&&i.naturalWidth>0)");
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,`${width} ${theme}`);
    assert.equal(await ev("(()=>{const r=document.querySelector('#comic-L01 [data-preview-src]').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})()"),true,'No left-side image bleed');
    assert.equal(await ev("(()=>{const r=document.querySelector('#comic-L01 .comic-artwork').getBoundingClientRect();const p=document.querySelector('#comic-L01 .comic-content').getBoundingClientRect();return Math.abs(r.width-Math.min(640,p.width))<2&&Math.abs((r.left+r.right)-(p.left+p.right))<2;})()"),true,'Large comic preview stays centred and fits the card');
    let shot=await call('Page.captureScreenshot',{format:'png'});
    await writeFile(`build/comic-L01-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
    await ev("document.querySelector('#comic-L01 [data-read-comic]').click()");
    await until("document.querySelector('[data-comic-reader]').open && !document.querySelector('[data-reader-image]').hidden");
    assert.equal(await ev("document.activeElement.hasAttribute('data-reader-close')"),true,'Close receives focus');
    assert.equal(await ev("document.body.style.overflow"),'hidden');
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,'Dialog fits viewport');
    shot=await call('Page.captureScreenshot',{format:'png'});
    await writeFile(`build/comic-reader-L01-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
    await ev("document.querySelector('[data-reader-larger]').click();document.querySelector('[data-reader-larger]').click()");
    assert.equal(await ev("document.querySelector('[data-reader-zoom]').textContent"),'200%');
    assert.equal(await ev("document.querySelector('[data-reader-viewport]').scrollWidth>document.querySelector('[data-reader-viewport]').clientWidth"),true,'Zoom pans within reader');
    await ev("document.querySelector('[data-reader-reset]').click()");
    // Native modal traps keyboard focus.
    for(let i=0;i<12;i++){
      await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
      await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
      assert.equal(await ev("document.querySelector('[data-comic-reader]').contains(document.activeElement)||document.activeElement===document.body"),true);
    }
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await until("!document.querySelector('[data-comic-reader]').open");
    await until("document.activeElement.matches('#comic-L01 [data-read-comic]')");
    assert.notEqual(await ev("document.body.style.overflow"),'hidden');
    await ev("document.querySelector('#comic-L01 [data-read-comic]').click()");
    await call('Input.dispatchMouseEvent',{type:'mousePressed',x:1,y:1,button:'left',clickCount:1});
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:1,y:1,button:'left',clickCount:1});
    await until("!document.querySelector('[data-comic-reader]').open");
    await ev("document.querySelector('#comic-L01 [data-read-comic]').click();document.querySelector('[data-reader-transcript]').click()");
    await until("document.querySelector('#comic-L01 [data-comic-transcript]').open");
    await ev("document.querySelector('#comic-L01 [data-comic-transcript]').open=false");
    await ev("document.querySelector('[data-expand-comics]').click()");
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,'All comics fit');
    await ev("document.querySelector('.collection-intro').scrollIntoView({block:'start',behavior:'instant'})");
    shot=await call('Page.captureScreenshot',{format:'png'});
    await writeFile(`build/comic-collection-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
    await ev("document.querySelector('[data-reset-collection]').click();document.querySelector('[data-reset-confirm]').scrollIntoView({block:'center',behavior:'instant'})");
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,'Reset confirmation fits');
    shot=await call('Page.captureScreenshot',{format:'png'});
    await writeFile(`build/comic-reset-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    assert.equal(await ev("document.querySelector('[data-reset-confirm]').hidden && document.activeElement.matches('[data-reset-collection]')"),true,'Escape cancels and restores focus');
  }
  // Resize with reader open, image failure fallback, and SPA cleanup.
  await ev("document.querySelector('#comic-L01 [data-read-comic]').click()");
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,'Resize keeps reader within page');
  await ev("document.querySelector('[data-reader-close]').click()");
  await until("document.body.style.overflow !== 'hidden'");
  await call('Network.setBlockedURLs',{urls:['*-full.webp*']});
  await ev("document.querySelector('#comic-S12 [data-read-comic]').dataset.fullSrc += '?failure-check';document.querySelector('#comic-S12 [data-read-comic]').click()");
  await until("document.querySelector('[data-reader-status]').textContent.includes('could not load')");
  await ev("document.querySelector('[data-reader-transcript]').click()");
  await until("document.querySelector('#comic-S12 [data-comic-transcript]').open");
  await call('Network.setBlockedURLs',{urls:[]});
  await ev("document.querySelector('#comic-L01 [data-read-comic]').click();document.querySelector('#comic-L01 .comic-links a').click()");
  await until("document.querySelector('[data-self-check=L01] [data-sc-form]')?.hidden===false");
  assert.notEqual(await ev("document.body.style.overflow"),'hidden','Navigation releases reader scroll lock');
  await ev("document.querySelector('[data-sc-unlock] a').click()");
  await until("document.querySelector('[data-collection-ready=true]')");
  await ev("document.querySelector('#comic-L01 [data-read-comic]').click()");
  assert.equal(await ev("document.querySelector('[data-comic-reader]').open"),true,'Reader reinitializes after SPA return');
  await ev("document.querySelector('[data-reader-close]').click()");
  await until("document.body.style.overflow !== 'hidden'");
  assert.deepEqual(errors,[],'No normal runtime exceptions');
  // Reset is opt-in, precise, persistent and immediately relocks the dropdown.
  const storedBeforeReset=await snapshot();
  await ev("document.querySelector('[data-reset-collection]').click()");
  assert.equal(await ev("document.activeElement.matches('[data-cancel-reset]')"),true);
  await ev("document.querySelector('[data-cancel-reset]').click()");
  assert.equal(await snapshot(),storedBeforeReset,'Cancel keeps every saved unlock');
  await ev("localStorage.setItem('slop8412:workspace:test','keep my code');localStorage.setItem('at-theme','light')");
  await previewOn();
  await ev("document.querySelector('[data-reset-collection]').click();document.querySelector('[data-confirm-reset]').click()");
  assert.equal(await count(),'0 / 17');
  assert.equal(await lockedMenu(),17);
  assert.equal(await ev("document.querySelector('[data-preview-banner]').hidden"),true,'Reset exits Spoilers');
  assert.equal(await snapshot(),'[]');
  assert.equal(await ev("localStorage.getItem('at-theme')"),'light');
  assert.equal(await ev("localStorage.getItem('slop8412:workspace:test')"),'keep my code');
  await gallery();assert.equal(await count(),'0 / 17','Reset survives reload');
  await nav(questions[0]);assert.equal(await isUnlocked(),false,'Matching quiz unlock was reset');
  await gallery();await submitCode('SLOP-L01');assert.equal(await count(),'1 / 17','Same code works after reset');
  assert.deepEqual(errors,[],'Reset and preference flow have no runtime exceptions');
  const blocked=await call('Page.addScriptToEvaluateOnNewDocument',{source:"Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}});"});
  await gallery();await submitCode('SLOP-L01');assert.equal(await count(),'1 / 17');
  assert.ok((await ev("document.querySelector('[data-collection-storage]').textContent")).includes('unavailable'));
  await previewOn();await ev("document.querySelector('[data-exit-preview]').click()");assert.equal(await count(),'1 / 17');
  await gallery();assert.equal(await count(),'0 / 17','Blocked storage does not pretend to persist');
  await submitCode('SLOP-L01');
  await ev("document.querySelector('[data-reset-collection]').click();document.querySelector('[data-confirm-reset]').click()");
  assert.equal(await count(),'0 / 17');
  assert.ok((await ev("document.querySelector('[data-collection-status]').textContent")).includes('for this visit only'));
  await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:blocked.identifier});
  assert.ok(errors.every(e=>e.exception?.description==='SecurityError: Blocked'),'Only known theme storage errors under denial');
  if(errors.length)console.log('Known upstream theme storage-denial errors: '+errors.length);
  console.log('All 17 codes, dark default / saved theme, confirmed scoped reset, responsive themes, image loading and storage-denial fallback passed');
}finally{ws?.close();browser.kill();}
