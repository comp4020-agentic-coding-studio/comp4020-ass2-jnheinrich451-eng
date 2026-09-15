// Requires local Astro on :4322. Checks live lecture data/state and theme regressions.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'slop-course-nav-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9261',`--user-data-dir=${profile}`],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));await pause(1800);
const pages=await(await fetch('http://localhost:9261/json')).json(),ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const jobs=new Map(),exceptions=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);if(m.id){jobs.get(m.id)?.(m);jobs.delete(m.id);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:n,method,params}));});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const until=async expression=>{for(let i=0;i<60;i++){if(await ev(expression))return;await pause(150);}throw new Error('Timed out: '+expression);};
const base='http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
const fits=async()=>{
 // ClientRouter swaps the DOM before its transition and font layout finish.
 await ev('document.fonts.ready.then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))');
 await pause(300);
 assert.equal(await ev('document.documentElement.scrollWidth>document.documentElement.clientWidth'),false,'No horizontal page overflow: '+await ev('location.pathname+" at "+innerWidth'));
};


const ready=async()=>{await until("document.querySelectorAll('[data-course-trigger]').length===5");await ev('document.fonts.ready');await pause(350);};
const aligned=async()=>{
 assert.ok(await ev(`(()=>{
  const items=[...document.querySelectorAll('.at-nav-links > li')];
  return items.every(item=>{
   const row=item.getBoundingClientRect(),link=item.querySelector('a').getBoundingClientRect();
   return Math.abs((row.top+row.bottom)/2-(link.top+link.bottom)/2)<1;
  });
 })()`),'Direct Policies link and dropdown labels share their row centre');
 if(await ev("getComputedStyle(document.querySelector('.at-nav-links')).flexDirection==='row'")){
  assert.ok(await ev(`(()=>{const ys=[...document.querySelectorAll('.at-nav-links > li > a')].map(a=>{const r=a.getBoundingClientRect();return (r.top+r.bottom)/2;});return Math.max(...ys)-Math.min(...ys)<1;})()`),'All six desktop labels share one level');
 }
};
const click=async selector=>{
 // Horizontal nav scrolling dispatches its dismissal event asynchronously.
 // Finish bringing the button into view before clicking it, as a user would.
 await ev(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'nearest',behavior:'instant'})`);
 await pause(150);
 const point=await ev(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
 await call('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
 await call('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
};
const key=async key=>{const code={Escape:27,Enter:13,ArrowDown:40,ArrowUp:38,Home:36,End:35}[key];await call('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:code});await call('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code});};
const show=async group=>{
 await ev("window.scrollTo({top:0,behavior:'instant'})");
 await pause(200);
 if(await ev("getComputedStyle(document.querySelector('.at-nav-toggle')).display!=='none' && document.querySelector('.at-nav-toggle').getAttribute('aria-expanded')==='false'")){await click('.at-nav-toggle');await pause(350);}
 await click('[data-course-trigger='+group+']');
 try{await until("document.querySelector('#course-jump-"+group+"').matches(':popover-open')");}catch(error){console.log('Open failed',group,await ev('({width:innerWidth,path:location.pathname,active:document.activeElement?.outerHTML})'));throw error;}
};
try{
 await call('Page.enable');await call('Runtime.enable');
 for(const [width,height] of [[1920,1080],[800,1000],[640,844],[390,844]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:base});await ready();
  for(const theme of ['light','dark']){
   if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
   await ev("window.scrollTo({top:0,behavior:'instant'})");await pause(200);await aligned();await fits();
   const top=await call('Page.captureScreenshot',{format:'png'});
   await writeFile(`build/home-navigation-top-${theme}-${width}.png`,Buffer.from(top.data,'base64'));
   assert.deepEqual(await ev("[...document.querySelectorAll('.home-destinations .at-card-title')].map(e=>e.textContent.trim())"),['Lectures','Sessions','Assessment','Workspace','People','Policies']);
   await ev("document.querySelector('.home-destinations').scrollIntoView({behavior:'instant',block:'start'})");await pause(200);await fits();
   const cards=await call('Page.captureScreenshot',{format:'png'});
   await writeFile(`build/home-navigation-cards-${theme}-${width}.png`,Buffer.from(cards.data,'base64'));
  }
  await ev("document.querySelector('.home-destinations a[href$=\"/policies/\"]').click()");
  await until("location.pathname.endsWith('/policies/')");await ready();await aligned();
  assert.ok(await ev("document.querySelector('.at-nav-links > li > a[href$=\"/policies/\"]').getAttribute('aria-current')==='page'"));
  await call('Page.navigate',{url:base+'lectures/week-01/'});await ready();
  for(const theme of ['light','dark']){
   if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
   await aligned();
   for(const [group,count] of [['lectures',5],['sessions',12],['assessments',4],['workspace',3],['people',2]]){
    await show(group);
    assert.equal(await ev("document.querySelectorAll('#course-jump-"+group+" li a').length"),count);
    assert.equal(await ev("document.querySelectorAll('.course-jump-panel:popover-open').length"),1);
    await fits();
    assert.ok(await ev("(()=>{const r=document.querySelector('#course-jump-"+group+"').getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})()"),'Popover fits viewport');
    if(group==='lectures')assert.equal(await ev("document.querySelector('#course-jump-lectures [aria-current=page]').pathname"),new URL(base+'lectures/week-01/').pathname);
    const shot=await call('Page.captureScreenshot',{format:'png'});
    await writeFile('build/navigation-'+group+'-'+theme+'-'+width+'.png',Buffer.from(shot.data,'base64'));
    await key('Escape');
    await until("!document.querySelector('#course-jump-"+group+"').matches(':popover-open')");
    assert.equal(await ev("document.querySelector('[data-course-trigger="+group+"]').getAttribute('aria-expanded')"),'false');
   }
  }
  // Jump directly between lectures, then to the last session and an assessment.
  for(const [group,suffix] of [['lectures','lectures/week-02/'],['lectures','lectures/week-05/'],['lectures','lectures/week-08/'],['lectures','lectures/week-11/'],['lectures','lectures/week-01/'],['sessions','sessions/12-what-you-would-report-instead/'],['assessments','assessments/measurement-log/'],['assessments','assessments/final-report/'],['workspace','workspace/'],['workspace','math-lab/'],['people','people/helen-sandoval/'],['people','people/tomasz-wierzba/']]){
   await show(group);
   const selector='#course-jump-'+group+' a[href$="/'+suffix+'"]';
   // Focus scrolls the final session into view inside the menu, not the page.
   await ev(`document.querySelector(${JSON.stringify(selector)}).focus()`);
   await key('Enter');
   await until("location.pathname.endsWith('/"+suffix+"')");
   await ready();assert.equal(await ev("document.querySelectorAll('.course-jump-panel').length"),5);
  }
  await show('sessions');
  await call('Input.dispatchMouseEvent',{type:'mousePressed',x:5,y:height-5,button:'left',clickCount:1});
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:5,y:height-5,button:'left',clickCount:1});
  await until("!document.querySelector('.course-jump-panel:popover-open')");
  await ev("document.querySelector('[data-course-trigger=lectures]').focus()");
  await key('ArrowDown');await until("document.querySelector('#course-jump-lectures').matches(':popover-open')");
  assert.ok(await ev("document.querySelector('#course-jump-lectures').contains(document.activeElement)"));
  await key('Escape');
 }
 assert.deepEqual(exceptions,[]);
 console.log('PASS: six ordered home cards, aligned top labels including active Policies; 5/12/4/3/2 dropdown destinations, current page, pointer and keyboard, Escape/outside dismissal, last-session reachability, no duplicate menus after SPA navigation; both themes at 1920/800/640/390.');
}finally{await call('Browser.close');ws.close();browser.kill();}
