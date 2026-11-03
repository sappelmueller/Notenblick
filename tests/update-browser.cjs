'use strict';
// Only the added updater copy/fallback controls. No other browser suite.
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
 assert.deepEqual(errors,[]);console.log('Updater copy UI in Chromium: Enter/Tab, read-only text selection, Escape/focus and three widths/scales passed; controlled clipboard, no Windows/NVDA claim.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
