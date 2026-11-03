'use strict';
// Only updater settings, notification, focus and diagnostic controls.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../dist/Programm');let browser;
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.NOTENBLICK_CHROMIUM||undefined,headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/Notenblick.html');await page.waitForSelector('html[data-ready=true]');
 await page.evaluate(d=>globalThis.contextFixture=d,require('./v1210-fixture.cjs')(require('../src/core.js')));
 await page.addScriptTag({content:'globalThis.prepareContext='+require('./v1230-contexts.cjs').toString()});
 await page.addScriptTag({content:'globalThis.installUpdateTestHost='+require('./update-fixture.cjs').toString()});
 await page.evaluate(async()=>{await prepareContext(11);installUpdateTestHost();Notenblick.activateGroup('main','settings');Notenblick.activateGroup('settings','general');updateTestHost.offline=true;updateTestHost.copyFails=true;});
 const focus=()=>page.evaluate(()=>document.activeElement.id);
 if(process.argv.includes('--final-layout')){
  await page.evaluate(async()=>{updateTestHost.offline=false;await Notenblick.checkUpdates(false);});
  for(const [width,zoom] of [[1280,1],[640,2],[320,2]]){
   await page.setViewportSize({width,height:900});await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);
   await page.evaluate(()=>Notenblick.activateGroup('main','settings'));assert.equal(await page.locator('.update-settings>p').first().textContent(),'Deine Version: 1.24.0');
   for(const id of ['updateAuto','updateHide']){
    if(id==='updateHide')await page.evaluate(()=>{Notenblick.updates.sessionHidden='';Notenblick.updates.hiddenVersion='';updateTestHost.state.hiddenVersion='';Notenblick.activateGroup('main','home');Notenblick.syncUpdateViews();});
    const layout=await page.locator('#'+id).evaluate(input=>{const span=input.nextElementSibling,a=input.getBoundingClientRect(),b=span.getBoundingClientRect(),label=input.closest('label'),range=document.createRange();range.setStart(span.firstChild,0);range.setEnd(span.firstChild,Math.min(5,span.firstChild.length));const first=range.getBoundingClientRect();return {right:b.left>=a.right+4,sameLine:a.top<first.bottom&&a.bottom>first.top,fits:label.scrollWidth<=label.clientWidth+1,label:label.textContent};});
    assert.equal(layout.right,true,id+' checkbox left of text');assert.equal(layout.sameLine,true,id+' first text line next to checkbox');assert.equal(layout.fits,true,id+' wraps only text');
    await page.locator('#'+id).focus();await page.keyboard.press('Space');
    if(id==='updateAuto')assert.equal(await focus(),id);else{await page.waitForFunction(()=>document.querySelector('#homeUpdateSlot').hidden);assert.equal(await focus(),'continueTitle');}
   }
  }
  assert.deepEqual(errors,[]);console.log('Release UI: Deine Version, both checkbox labels on the same row, text wrapping and keyboard/focus at three widths/scales passed.');return;
 }
 for(const [width,zoom] of [[1280,1],[640,2],[320,1]]){
  await page.setViewportSize({width,height:900});await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);
  await page.locator('#updateCheck').focus();await page.keyboard.press('Enter');await page.waitForSelector('#updateCopyError:visible');assert.equal(await focus(),'updateCheck');
  await page.keyboard.press('Tab');assert.equal(await focus(),'updateAuto');await page.keyboard.press('Tab');assert.equal(await focus(),'updateCopyError');
  await page.keyboard.press('Enter');await page.waitForSelector('#updateErrorText');assert.equal(await focus(),'dialogTitle');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.matches('.dialog-header [data-action=close]')),true);
  await page.keyboard.press('Tab');assert.equal(await focus(),'updateErrorText');await page.keyboard.press('Control+a');
  assert.equal(await page.locator('#updateErrorText').evaluate(el=>el.selectionEnd-el.selectionStart===el.value.length),true);
  assert.equal(await page.locator('#dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#dialog').open);assert.equal(await focus(),'updateCopyError');
 }
 await page.evaluate(()=>{const call=NRDesktop.call;globalThis.restoreUpdateCall=()=>{NRDesktop.call=call;};NRDesktop.call=(op,...args)=>op==='update-check'?new Promise((resolve,reject)=>{globalThis.finishUpdateCheck=()=>call(op,...args).then(resolve,reject);}):call(op,...args);updateTestHost.offline=false;updateTestHost.offer=null;});
 await page.locator('#updateCheck').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>Notenblick.updates.checking);assert.equal(await focus(),'updateCheck','focus during a genuinely pending check');
 await page.locator('#setting-startupView').focus();const settingValue=await page.locator('#setting-startupView').inputValue();await page.evaluate(()=>finishUpdateCheck());await page.waitForFunction(()=>!Notenblick.updates.checking);assert.equal(await focus(),'setting-startupView');assert.equal(await page.locator('#setting-startupView').inputValue(),settingValue);await page.evaluate(()=>restoreUpdateCall());
 for(const [width,zoom] of [[1280,1],[800,1.5],[640,2],[320,1],[320,2]]){
  await page.setViewportSize({width,height:900});await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);
  await page.evaluate(()=>{const u=Notenblick.updates;u.hiddenVersion='';u.sessionHidden='';updateTestHost.state.hiddenVersion='';updateTestHost.offline=false;Notenblick.activateGroup('main','settings');});
  for(const state of ['current','available','error']){
   await page.evaluate(state=>{updateTestHost.offline=state==='error';updateTestHost.offer=state==='current'?null:{version:'1.25.0',notes:['Neue Versionen sind leichter zu finden.','Notenblick startet jetzt maximiert.','Die Tastaturbedienung ist verbessert.']};},state);
   await page.locator('#updateCheck').focus();await page.keyboard.press('Enter');await page.waitForFunction(state=>document.querySelector('#updateResult').dataset.state===state&&!Notenblick.updates.checking,state);assert.equal(await focus(),'updateCheck');
   assert.equal(await page.locator('.update-settings').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'settings width '+width+'/'+zoom+'/'+state);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'page width '+width+'/'+zoom+'/'+state);
  }
  await page.evaluate(()=>Notenblick.activateGroup('main','home'));assert.equal(await page.locator('#homeUpdateVersion').textContent(),'Zuletzt gefunden: Notenblick 1.25.0.');assert.equal(await page.locator('#homeUpdateStatus').textContent(),'Die Verfügbarkeit konnte jetzt nicht geprüft werden.');
  await page.evaluate(async()=>{updateTestHost.offline=false;await Notenblick.checkUpdates(false);});assert.equal(await page.locator('#homeUpdateVersion').textContent(),'Notenblick 1.25.0 ist verfügbar.');
  assert.equal(await page.locator('.update-card').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'card width '+width+'/'+zoom);
  await page.locator('#homeUpdateSlot [data-action=update-later]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#homeUpdateSlot').hidden);assert.equal(await focus(),'continueTitle');await page.keyboard.press('Tab');assert.equal(await focus(),'homeContinue');
  await page.evaluate(async()=>{updateTestHost.offer.version='1.26.0';await Notenblick.checkUpdates(false);});assert.equal(await page.locator('#updateHideLabel').textContent(),'Hinweis zu Version 1.26.0 nicht mehr anzeigen');
  await page.locator('#updateHide').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>document.querySelector('#homeUpdateSlot').hidden);assert.equal(await focus(),'continueTitle');assert.equal(await page.evaluate(()=>updateTestHost.state.hiddenVersion),'1.26.0');
 }
 assert.equal(await page.evaluate(()=>updateTestHost.calls.some(c=>c.op==='update-install')),false);
 assert.deepEqual(errors,[]);console.log('Updater UI in Chromium: three results, stale offers, session/version hiding, keyboard/focus, copy fallback and five widths/scales through 320 px/200% passed; no Windows/NVDA claim.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
