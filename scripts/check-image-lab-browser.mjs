// Real WASM inference and screenshot acceptance, against independent Python features.
// Run with the local Astro server; IMAGE_LAB_BASE can point at a production preview.
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(join(tmpdir(),'slop-image-lab-'));
const browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9268',`--user-data-dir=${profile}`],{stdio:'ignore',windowsHide:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));await pause(1800);
const pages=await(await fetch('http://localhost:9268/json')).json(),ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const jobs=new Map(),exceptions=[],requests=[],fileChoosers=[];
ws.onmessage=async e=>{const m=JSON.parse(e.data);if(m.method==='Page.fileChooserOpened')fileChoosers.push(m.params);if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);if(m.method==='Network.requestWillBeSent')requests.push(m.params.request);if(m.id){jobs.get(m.id)?.(m);jobs.delete(m.id);}if(m.method==='Target.attachedToTarget'){
  await call('Network.enable',{},m.params.sessionId);
  await call('Runtime.enable',{},m.params.sessionId);
  await call('Runtime.runIfWaitingForDebugger',{},m.params.sessionId);
}};
const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;jobs.set(n,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:n,method,params,sessionId}));});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const until=async(expression,ms=15000)=>{const start=Date.now();while(Date.now()-start<ms){if(await ev(expression))return;await pause(250);}throw new Error('Timed out: '+expression+' Status: '+await ev("document.querySelector('[data-status]')?.textContent"));};
const base=process.env.IMAGE_LAB_BASE||'http://localhost:4322/comp4020-ass2-jnheinrich451-eng/';
const fixture=JSON.parse(await readFile('public/image-lab/reference.json','utf8'));
const exportReport=async()=>{
  await ev("window.ilCreateURL=URL.createObjectURL;URL.createObjectURL=blob=>{window.ilBlob=blob;return window.ilCreateURL(blob)};document.querySelector('[data-export]').click();URL.createObjectURL=window.ilCreateURL");
  return JSON.parse(await ev('window.ilBlob.text()'));
};
const run=async()=>{
  await ev("document.querySelector('[data-run]').click()");
  await until("['complete','error'].includes(document.querySelector('image-lab').dataset.state)",190000);
  if(await ev("document.querySelector('image-lab').dataset.state==='error'"))console.log(JSON.stringify({exceptions,requests:requests.slice(-12)},null,2));
  assert.equal(await ev("document.querySelector('image-lab').dataset.state"),'complete',await ev("document.querySelector('[data-status]').textContent"));
  return exportReport();
};
const setMode=mode=>ev(`(()=>{const e=document.querySelector('[data-mode]');e.value=${JSON.stringify(mode)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
try{
  await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
  await call('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:true,flatten:true});
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:base+'image-lab/'});
  await until("!!document.querySelector('image-lab[data-ready]')");await pause(500);
  assert.equal(requests.some(r=>/\.onnx|\.wasm/.test(r.url)),false,'No large model/runtime download before consent');
  assert.equal(await ev("document.querySelectorAll('.lab-navigation a').length"),3);
  assert.equal(await ev("document.querySelectorAll('[data-candidate]').length"),8);
  // Track worker disposal as well as its actual network traffic.
  await ev(`window.ilWorkers=[];window.ilNativeWorker=Worker;window.Worker=class extends window.ilNativeWorker{constructor(...args){super(...args);window.ilWorkers.push(this);this.addEventListener('message',e=>{if(e.data.type==='progress')console.log(e.data.text)});}postMessage(message){window.ilLastPayload=message;super.postMessage(message);}terminate(){this.ilTerminated=true;super.terminate();}}`);
  const result=await run();
  let maxFeatureError=0;
  for(const [actual,expected] of [[result.features.reference,fixture.features.reference],[result.features.candidate,fixture.features.jpeg]])
    for(let i=0;i<8;i++)for(let j=0;j<2048;j++)maxFeatureError=Math.max(maxFeatureError,Math.abs(actual[i][j]-expected[i][j]));
  console.log(JSON.stringify({score:result.score,python:fixture.scores.jpeg,maxFeatureError,seconds:result.seconds}));
  assert.ok(maxFeatureError<0.001,'ONNX browser vs PyTorch features: '+maxFeatureError);
  assert.ok(Math.abs(result.score.total-fixture.scores.jpeg.total)<0.01,'Browser vs Python FID');
  assert.equal(result.features.reference[0].length,2048);
  assert.ok(requests.some(r=>r.url.endsWith('.onnx')),'Actual model fetched by worker');
  assert.ok(requests.some(r=>r.url.includes('.wasm')),'Actual WASM runtime fetched');
  assert.equal(requests.some(r=>r.url.endsWith('reference.json')),false,'No reference feature/score substitution');
  assert.equal(await ev('window.ilWorkers.every(w=>w.ilTerminated)'),true,'Worker released after result');
  await writeFile('build/image-lab-browser-result.json',JSON.stringify({score:result.score,python:fixture.scores.jpeg,maxFeatureError,seconds:result.seconds,modelSha256:result.modelSha256},null,2));
  for(const [width,height] of [[1440,1100],[800,1000],[390,844]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    for(const theme of ['light','dark']){
      if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
      await ev('document.fonts.ready');await pause(200);
      assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,'No horizontal overflow '+width+' '+theme);
      for(const [part,selector] of [['sets','.il-sets'],['result','.il-results']]){
        await ev(`document.querySelector('${selector}').scrollIntoView({block:'center',behavior:'instant'})`);await pause(150);
        const capture=await call('Page.captureScreenshot',{format:'png'});
        await writeFile(`build/image-lab-${part}-${theme}-${width}.png`,Buffer.from(capture.data,'base64'));
      }
    }
  }
  await setMode('reference');
  assert.equal(await ev("document.querySelector('[data-results]').hidden"),true,'Changing settings invalidates result');
  const identity=await run();assert.ok(identity.score.total<1e-8,'Identity control zero');
  console.log('Identity',identity.score,'seconds',identity.seconds);
  const workerCount=await ev('window.ilWorkers.length');
  await ev("document.querySelector('[data-shuffle]').click()");
  const shuffled=await exportReport();
  assert.equal(shuffled.score.total,identity.score.total);
  assert.ok(shuffled.pairedFeatureDistance>0);
  assert.notDeepEqual(shuffled.candidateOrder,[1,2,3,4,5,6,7,8]);
  assert.deepEqual(await ev("[...document.querySelectorAll('[data-candidate]')].map(i=>+i.dataset.sourceIndex)"),shuffled.candidateOrder);
  assert.equal(await ev('window.ilWorkers.length'),workerCount,'Shuffle reuses actual extracted features');
  await ev("document.querySelector('[data-restore]').click()");
  assert.equal((await exportReport()).pairedFeatureDistance,0);
  await ev("document.querySelector('[data-run]').click();document.querySelector('[data-stop]').click()");
  assert.equal(await ev("document.querySelector('[data-results]').hidden"),true);
  assert.equal(await ev('window.ilWorkers.every(w=>w.ilTerminated)'),true,'Stop releases worker');
  await ev("document.querySelector('[data-run]').click()");await setMode('jpeg');
  assert.equal(await ev('window.ilWorkers.every(w=>w.ilTerminated)'),true,'Settings change releases pending worker');
  await ev("document.querySelector('[data-run]').click();document.querySelector('.lab-navigation a[href$=\"/math-lab/\"]').click()");
  await until("location.pathname.endsWith('/math-lab/')");
  assert.equal(await ev('window.ilWorkers.every(w=>w.ilTerminated)'),true,'Navigation releases worker');
  await ev("document.querySelector('.lab-navigation a[href$=\"/image-lab/\"]').click()");
  await until("!!document.querySelector('image-lab[data-ready]')");
  assert.equal(await ev("document.querySelector('[data-results]').hidden"),true,'SPA return has no stale result');
  // ClientRouter finishes its focus restoration after connecting custom elements.
  await ev('document.fonts.ready');await pause(400);
  // Real file picker payloads, then actual inference on the processed local pixels.
  await call('DOM.enable');
  const doc=await call('DOM.getDocument');
  const input=await call('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'[data-files]'});
  assert.equal(await ev("getComputedStyle(document.querySelector('[data-files]')).display"),'none','Only one visible chooser');
  await call('Page.setInterceptFileChooserDialog',{enabled:true});
  await ev("document.querySelector('[data-upload]').focus()");
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  for(let i=0;i<20&&!fileChoosers.length;i++)await pause(100);
  assert.equal(fileChoosers.at(-1)?.mode,'selectMultiple','Keyboard activation opens multi-file picker');
  // Reproduce the reported 1800 KB single-file selection before a valid batch.
  await ev("(()=>{const d=new DataTransfer();d.items.add(new File([new Uint8Array(1800000)],'single.jpg',{type:'image/jpeg'}));const i=document.querySelector('[data-files]');i.files=d.files;i.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await until("document.querySelector('[data-upload-status]').dataset.state==='error'");
  assert.ok(await ev("document.querySelector('[data-upload-status]').textContent.includes('Only 1 image selected')"));
  assert.equal(await ev("document.querySelector('[data-files]').getAttribute('aria-invalid')"),'true');
  for(const width of [1440,800,390])for(const theme of ['light','dark']){
    await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
    if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
    await ev("document.querySelector('[data-upload-status]').scrollIntoView({block:'center',behavior:'instant'})");await pause(150);
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);
    assert.equal(await ev("getComputedStyle(document.querySelector('[data-files]')).display"),'none');
    assert.ok(await ev("(()=>{const b=document.querySelector('[data-upload]').getBoundingClientRect(),f=document.querySelector('[data-upload-status]').getBoundingClientRect();return b.top>=0&&f.bottom<=innerHeight&&f.top>=b.bottom&&f.top-b.bottom<160;})()"),'Feedback is beside the chooser and in view');
    const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`build/image-lab-upload-error-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
  }
  await call('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[join(process.cwd(),'public/image-lab/reference-1.png'),join(process.cwd(),'public/image-lab/reference-2.png')]});
  await until("document.querySelector('[data-status]').textContent.includes('Local images ready')");
  assert.equal(await ev("document.querySelector('[data-mode]').value"),'custom');
  assert.equal(await ev("document.querySelector('[data-upload-status]').dataset.state"),'ready');
  assert.equal(await ev("document.querySelector('[data-files]').getAttribute('aria-invalid')"),'false');
  assert.equal(await ev("document.querySelectorAll('.il-grid figure:not([hidden])').length"),4);
  const localIdentity=await run();assert.equal(localIdentity.score.total,0);assert.equal(localIdentity.pairedFeatureDistance,0);
  assert.equal(localIdentity.counts.reference,2);assert.equal(localIdentity.localImages.length,2);
  assert.ok(!JSON.stringify(localIdentity).includes('reference-1.png'),'Export omits local filenames');
  await ev("window.ilReferencePreview=document.querySelector('[data-reference]').src;const zoom=document.querySelector('[data-edit=zoom]');zoom.value='1.5';zoom.dispatchEvent(new Event('input',{bubbles:true}));const filter=document.querySelector('[data-edit=filter]');filter.value='grayscale';filter.dispatchEvent(new Event('input',{bubbles:true}));");
  assert.equal(await ev("document.querySelector('[data-results]').hidden"),true);
  assert.equal(await ev("document.querySelector('[data-run]').disabled"),true,'Unapplied edits cannot be measured');
  await ev("document.querySelector('[data-apply]').click()");
  assert.equal(await ev("document.querySelector('[data-reference]').src===window.ilReferencePreview"),true);
  const processed=await run();assert.ok(processed.score.total>0);assert.equal(processed.processing.zoom,1.5);assert.equal(processed.processing.filter,'grayscale');
  assert.equal(await ev(`(async()=>{
    for(const kind of ['reference','candidate']){
      const imgs=[...document.querySelectorAll('[data-'+kind+']')].filter(i=>!i.closest('figure').hidden);
      for(let i=0;i<imgs.length;i++){await imgs[i].decode();const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.drawImage(imgs[i],0,0);const pixels=ctx.getImageData(0,0,128,128).data;
        if(!pixels.every((v,j)=>v===window.ilLastPayload.pixels[kind][i][j]))return false;
      }
    }return true;
  })()`),true,'Every displayed pixel equals the inference payload');
  for(const width of [1440,800,390])for(const theme of ['light','dark']){
    await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    if(await ev('document.documentElement.dataset.theme')!==theme)await ev("document.querySelector('.at-footer-theme-toggle').click()");
    await ev("document.querySelector('[data-editor]').scrollIntoView({block:'center',behavior:'instant'})");await pause(150);
    assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,'Local editor fits '+width);
    const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`build/image-lab-editor-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
  }
  // Invalid selection preserves the images, but clears old measurements.
  for(const [make,message] of [["new File(['<svg/>'],'bad.svg',{type:'image/svg+xml'})",'Only JPEG'],["new File([new Uint8Array(5000001)],'large.png',{type:'image/png'})",'5 MB'],["new File(['bad png'],'broken.png',{type:'image/png'})",'valid JPEG']]){
    await ev(`(()=>{const d=new DataTransfer();d.items.add(${make});d.items.add(new File(['dummy'],'second.png',{type:'image/png'}));const input=document.querySelector('[data-files]');input.files=d.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await until(`document.querySelector('[data-upload-status]').textContent.includes(${JSON.stringify(message)})`);
    assert.equal(await ev("document.querySelector('[data-reference]').src===window.ilReferencePreview"),true);
    assert.equal(await ev("document.querySelector('[data-results]').hidden"),true);
  }
  await ev("document.querySelector('[data-reset-edits]').click()");
  assert.equal(await ev("document.querySelector('[data-candidate]').src===document.querySelector('[data-reference]').src"),true);
  await ev("document.querySelector('[data-demo]').click()");
  assert.equal(await ev("document.querySelector('[data-mode]').value"),'jpeg');
  assert.equal(await ev("document.querySelector('option[value=custom]').disabled"),true);
  assert.equal(await ev("document.querySelector('[data-upload-status]').dataset.state"),'idle');
  assert.equal(await ev("[...document.querySelectorAll('image-lab img')].some(i=>i.src.startsWith('data:'))"),false,'Clear removes local image previews');
  // Clear while an asynchronous decode is pending: late completion cannot restore files.
  await ev("window.ilDecode=createImageBitmap;window.createImageBitmap=(...args)=>window.ilDecode(...args).then(bitmap=>new Promise(resolve=>{window.ilPendingBitmap=bitmap;window.ilRelease=()=>resolve(bitmap)}))");
  await call('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[join(process.cwd(),'public/image-lab/reference-1.png'),join(process.cwd(),'public/image-lab/reference-2.png')]});
  await until("typeof window.ilRelease==='function'");
  assert.equal(await ev("document.querySelector('[data-upload-status]').dataset.state"),'loading');
  await ev("document.querySelector('[data-demo]').click();window.ilRelease();window.createImageBitmap=window.ilDecode");await pause(200);
  assert.equal(await ev("document.querySelector('[data-mode]').value"),'jpeg','Late decode cannot restore cleared images');
  assert.equal(await ev("document.querySelector('[data-upload-status]').dataset.state"),'idle','Late decode cannot restore stale feedback');
  assert.equal(await ev('window.ilPendingBitmap.width'),0,'Cancelled decoded bitmap released');
  assert.equal(await ev("document.querySelector('[data-run]').disabled"),false);
  await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  // Cache can satisfy offline model requests; invalidate the base to exercise failure deterministically.
  await ev("document.querySelector('image-lab').dataset.base='/missing-image-fixture/'");
  await ev("const lab=document.querySelector('image-lab');lab.disconnectedCallback();lab.connectedCallback();lab.querySelector('[data-run]').click()");
  await until("document.querySelector('image-lab').dataset.state==='error'",20000);
  assert.equal(await ev("document.querySelector('[data-results]').hidden"),true,'Failure never presents old score');
  await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  assert.equal(requests.some(r=>r.method!=='GET'),false,'No uploads or server computation requests');
  assert.equal(requests.filter(r=>/^https?:/.test(r.url)).some(r=>new URL(r.url).origin!==new URL(base).origin),false,'Only same-origin static assets requested');
  assert.deepEqual(exceptions,[]);
  console.log('PASS: live FID/Python agreement; shuffle invariance and paired sensitivity without inference; real local files, identity, crop/filter inference and exact preview pixels; input rejection, clear, export, same-origin GET-only network, cancellation, SPA lifecycle, light/dark 1440/800/390.');
}finally{await call('Browser.close');ws.close();browser.kill();}
