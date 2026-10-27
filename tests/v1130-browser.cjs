'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),N=require('../src/core.js'),axe=require('axe-core').source;
const root=path.resolve(__dirname,'../dist/Programm'),out=path.join(__dirname,'exports/v1130'),checks=[],errors=[];let browser;
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.ttf')?'font/ttf':'text/html');res.end(fs.readFileSync(p));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.NOTENBLICK_CHROMIUM||undefined,headless:true,args:['--no-sandbox']});const page=await browser.newPage({locale:'de-DE',viewport:{width:1280,height:900}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/Notenblick.html');await page.waitForSelector('html[data-ready=true]');
 await page.evaluate(data=>{const A=Notenblick;A.data=NR.upgrade(data);A.normalizeContext();A.activateGroup('main','notes');A.refreshCurrent();A.activateGroup('main','notes');A.activateGroup('notes','pupil');A.W().pupil=A.getCourse().studentIds[0];A.renderPupil();},require('./v1130-fixture.cjs')(N));
 const raw=await page.evaluate(()=>JSON.stringify(Notenblick.data)),view=await page.evaluate(()=>JSON.stringify(Notenblick.getWorkspace()));
 const open=async()=>page.locator('#notes [data-action=output]').filter({visible:true}).click();await open();
 const client=await page.context().newCDPSession(page);await client.send('Accessibility.enable');
 async function description(expected){const tree=await client.send('Accessibility.getFullAXTree');const select=tree.nodes.find(n=>n.role?.value==='combobox'&&n.name?.value==='Ausgabe');assert.equal(select.description.value,expected);assert.equal(await page.locator('#exportBatchHint').getAttribute('aria-live'),null);}
 await description('Es wird ein Bericht für den ausgewählten Schüler erstellt.');
 await page.locator('#exportOutput').focus();await page.keyboard.press('End');assert.equal(await page.locator('#exportOutput').inputValue(),'batch');assert.equal(await page.evaluate(()=>document.activeElement.id),'exportOutput');await description('Es werden 6 Schülerberichte in einem ZIP-Archiv erstellt.');
 await page.locator('#exportExited').check();await description('Es werden 8 Schülerberichte in einem ZIP-Archiv erstellt.');
 await page.locator('#exportOutput').focus();await page.keyboard.press('Home');await description('Es wird ein Bericht für den ausgewählten Schüler erstellt.');assert.equal(await page.evaluate(()=>document.activeElement.id),'exportOutput');
 assert.equal(await page.locator('#exportExitedField').isVisible(),false);assert.equal(await page.locator('#exportScopeHint').isVisible(),true);assert.equal(await page.locator('#exportGroupingHint').isVisible(),true);
 await page.locator('#exportGrouping').focus();await page.keyboard.press('End');assert.equal(await page.evaluate(()=>document.activeElement.id),'exportGrouping');assert.equal(await page.locator('#exportGroupingHint').textContent(),'Alle Einzelnoten werden gemeinsam nach Datum sortiert, neueste zuerst.');
 await page.locator('#exportFormat').selectOption('print');assert.equal(await page.locator('#exportPrintHint').textContent(),'Empfohlen: A4 quer. Bitte in der Druckvorschau prüfen.');assert.equal(await page.locator('#exportFormat').getAttribute('aria-describedby'),'exportPageInfo');
 await page.addScriptTag({content:axe});for(const width of [1280,640,320])for(const zoom of [1,1.25,1.5,2]){
  await page.setViewportSize({width,height:900});await page.evaluate(z=>document.documentElement.style.zoom=z,zoom);
  assert.equal(await page.locator('#dialog').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
  const scan=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}}));assert.deepEqual(scan.violations.map(v=>v.id),[]);
 }
 await page.evaluate(()=>document.documentElement.style.zoom=1);await page.setViewportSize({width:1280,height:900});await page.screenshot({path:path.join(out,'dialog-single.png')});
 // Tab follows document order, including export/cancel, and stays within modal.
 await page.locator('#exportOutput').focus();const tab=[];for(let i=0;i<7;i++){tab.push(await page.evaluate(()=>(document.activeElement.id||document.activeElement.textContent.trim())));await page.keyboard.press('Tab');}
 assert.deepEqual(tab,['exportOutput','exportEntries','exportGrouping','exportRemarks','exportFormat','Abbrechen','dialogSave']);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'output');
 checks.push('Chromium-Accessibility-Baum: beide Ausgabe-Beschreibungen, echte Tastaturwahl, dynamisch 6/8 Schüler, stabile Fokusse und Tab-Reihenfolge; zwölf Fenster-/Zoomfälle mit axe ohne Verstöße');
 const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json')));
 await page.evaluate(()=>{window.print=()=>{window.printCalls=(window.printCalls||0)+1;};window.NRDesktop={available:true,call:async op=>{if(op!=='print-preview')throw Error('unexpected');window.previewCalls=(window.previewCalls||0)+1;return true;}};});
 for(const name of manifest.documents){const model=JSON.parse(fs.readFileSync(path.join(out,name+'.json')));await page.evaluate(r=>Notenblick.printReport(r),model);
  assert.equal(await page.locator('#printOutput').count(),1);assert.equal(await page.locator('#printOutput tfoot').count(),await page.evaluate(r=>Notenblick.reportTables(r).filter(s=>s.footer).length,model));
  assert.equal(await page.locator('#printOutput tfoot').first().evaluate(el=>getComputedStyle(el).display),'table-footer-group');
  // Do not emulate a print-media exit before taking the print snapshot: that
  // correctly triggers the application's cleanup and removes its @page rule.
  await page.emulateMedia({media:'print'});assert.equal(await page.locator('#printOutput tfoot').first().evaluate(el=>getComputedStyle(el).display),'table-row-group');
  assert.equal(await page.locator('#printOutput').count(),1);
  await page.pdf({path:path.join(out,name+'-print.pdf'),preferCSSPageSize:true,printBackground:false});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));assert.equal(await page.locator('#printOutput').count(),0);await page.emulateMedia({media:null});
 }
 assert.equal(await page.evaluate(()=>window.printCalls||0),0);assert.equal(await page.evaluate(()=>window.previewCalls),manifest.documents.length);
 checks.push(manifest.documents.length+' reale Chromium-A4-Druckrender: native Vorschauanforderung simuliert, CSS-Ausrichtung und vollständige Ergebniszeile; Tabellenfuß wird nur einmal ausgegeben');
 await page.evaluate(()=>{delete window.NRDesktop;});
 // The recommendation changes with actual report width in the existing dialog.
 await page.evaluate(()=>{const A=Notenblick;A.W().columns=['exam','test','written','oral'];A.activateGroup('notes','overview');});await open();await page.locator('#exportFormat').selectOption('print');assert.match(await page.locator('#exportPrintHint').textContent(),/A4 quer/);await page.keyboard.press('Escape');
 await page.evaluate(()=>{const A=Notenblick;A.W().columns=[];A.rendered={};A.renderOverview();});await open();await page.locator('#exportFormat').selectOption('print');assert.match(await page.locator('#exportPrintHint').textContent(),/A4 hoch/);await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>JSON.stringify(Notenblick.data)),raw);assert.deepEqual(errors,[]);checks.push('Quer-/Hochformatempfehlung folgt dem Layout; Notendaten unverändert. Windows/WebView2/NVDA-Liveprüfung bleibt offen.');
 fs.writeFileSync(path.join(__dirname,'v1130-browser-results.json'),JSON.stringify({checks,chromium:browser.version(),windows:false,webview2Live:false,word:false,nvda:false},null,2));await client.detach();await browser.close();server.close();console.log('1.13 Chromium:',checks.length,'Prüfgruppen');
})().catch(async e=>{console.error(e);await browser?.close();server.close();process.exitCode=1;});
