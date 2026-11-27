'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const axe = require('./dependencies.cjs').get('axe-core').source;
const N = require('../src/core.js');
const root = path.resolve(__dirname, '../dist/Programm');
const screenshots = path.join(__dirname, 'visual/v1280-protection');
const out = path.join(__dirname, 'v1280-protection-browser-results.json');
const fixture = require('./v1260-fixture.cjs')(N, 4);
const pass = 'Äbc1!😊de';
const key = 'AAAA-BBBB-CCCC-DDDD';
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    res.setHeader('Content-Type', {'.js':'text/javascript','.css':'text/css','.html':'text/html'}[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404).end(); }
});

function desktopMock({fixture,pass,key,initialLocked}) {
  const files = new Map([['notenverwaltung.json', JSON.stringify(fixture)]]), dirs = new Set(['']);
  const listeners = new Set(), calls = [];
  let enabled = initialLocked, locked = initialLocked, saved = false, verified = false, closed = false;
  const notify = msg => listeners.forEach(cb => cb({data:msg}));
  const fail = (message, name='Error') => { const e = Error(message); e.name = name; throw e; };
  const get = request => {
    const {op,path:p} = request;
    calls.push(op);
    if (op==='vault-status') return {enabled,locked,pending:false,unprotected:[]};
    if (op==='vault-ready') return true;
    if (op==='vault-key') {saved=verified=false;return key;}
    if (op==='vault-key-clear') return true;
    if (op==='vault-key-save') {saved=true;return true;}
    if (op==='vault-key-read') {if(initialLocked)return key;if(!saved)return false;verified=true;return key;}
    if (op==='vault-enable') {
      if(!verified||request.password!==pass||request.recovery!==key||request.verification!==key)fail('Schlüsseldatei prüfen.');
      enabled=true;return true;
    }
    if (op==='vault-lock') {locked=true;return true;}
    if (op==='vault-unlock') {
      if(request.password!==pass&&request.recovery!==key)fail('Passwort oder Notfallschlüssel stimmen nicht.','VaultAccessException');
      locked=false;return true;
    }
    if (op==='vault-request-close') {if(request.preserve)fail('Entsperre deine Noten zuerst.');closed=true;return true;}
    if (op==='vault-download-backup') {
      if(locked||!enabled)fail('Entsperre Notenblick zuerst.');
      window.backupReceived={name:request.name,contents:JSON.parse(request.text)};return true;
    }
    if (op==='vault-check-password' || op==='vault-change') {
      if((request.currentPassword||request.password)!==pass&&request.recovery!==key)fail('Zugang prüfen.','VaultAccessException');
      return true;
    }
    if (op==='vault-verify') {if(request.recovery!==key)fail('Zugang prüfen.','VaultAccessException');return true;}
    if (op==='vault-disable') {if(request.password!==pass&&request.recovery!==key)fail('Zugang prüfen.','VaultAccessException');enabled=false;return true;}
    if (op==='migration-sources') return [];
    if (op==='storage-info') return 'Daten';
    if (op==='update-state') return {enabled:false};
    if (locked) fail('Entsperre Notenblick zuerst.');
    if (op==='read') {if(!files.has(p))fail('Datei fehlt','NotFoundError');return files.get(p);}
    if (op==='write') {files.set(p,request.text);return true;}
    if (op==='directory') {if(request.create)dirs.add(p);if(!dirs.has(p))fail('Ordner fehlt','NotFoundError');return true;}
    if (op==='file') {if(!files.has(p))fail('Datei fehlt','NotFoundError');return true;}
    if (op==='remove') return files.delete(p)||dirs.delete(p);
    if (op==='entries') {
      const prefix=p?p+'/':'', results=[];
      for(const name of dirs)if(name!==p&&name.startsWith(prefix)&&!name.slice(prefix.length).includes('/'))results.push({name:name.slice(prefix.length),kind:'directory'});
      for(const name of files.keys())if(name.startsWith(prefix)&&!name.slice(prefix.length).includes('/'))results.push({name:name.slice(prefix.length),kind:'file',size:files.get(name).length,lastModified:1});
      return results;
    }
    return fail('Unbekannte Testfunktion '+op);
  };
  window.chrome=window.chrome||{};
  window.chrome.webview={
    addEventListener(type,cb){if(type==='message')listeners.add(cb);},
    postMessage(request){
      queueMicrotask(()=>{
        try{notify({id:request.id,ok:true,result:get(request)});}
        catch(e){notify({id:request.id,ok:false,error:e.message,name:e.name});}
      });
    }
  };
  window.vaultCheck={calls,triggerLock(){locked=true;notify({event:'windows-locked'});},closed:()=>closed};
}

(async()=>{
  fs.mkdirSync(screenshots,{recursive:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,executablePath:process.env.NOTENBLICK_CHROMIUM||undefined,args:['--no-sandbox']});
  const results=[],errors=[];
  try{
    const url='http://127.0.0.1:'+server.address().port+'/Notenblick.html';
    const open=async initialLocked=>{
      const context=await browser.newContext({locale:'de-DE',viewport:{width:1280,height:850}});
      await context.addInitScript(desktopMock,{fixture,pass,key,initialLocked});
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      await page.goto(url);
      await page.addScriptTag({content:axe});
      return {context,page};
    };
    const scan=async(page,label,selector)=>{
      const metric=await page.evaluate(selector=>{
        const el=document.querySelector(selector);
        return {page:document.documentElement.scrollWidth-innerWidth,content:el.scrollWidth-el.clientWidth};
      },selector);
      assert.ok(metric.page<=2&&metric.content<=2,label+': '+JSON.stringify(metric));
      const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}})).violations.map(v=>[v.id,v.nodes.map(n=>n.html)]));
      assert.deepEqual(violations,[],label);
      await page.screenshot({path:path.join(screenshots,label+'.png'),fullPage:true});
      results.push(label);
    };
    const activate=async page=> page.locator('#tab-settings').click();
    const {context,page}=await open(false);
    await page.waitForSelector('html[data-ready=true]');
    assert.equal(await page.locator('#vaultLock').count(),0);
    await activate(page);
    await scan(page,'ausgeschaltet','#passwordProtection');
    await page.locator('#vaultEnable').click();
    assert.equal(await page.locator('#dialogTitle').getAttribute('aria-describedby'),'vaultSetupStep');
    assert.equal(await page.locator('#vaultSetupStep').textContent(),'Schritt 1 von 3');
    assert.equal(await page.locator('#vaultSetupPassword').getAttribute('aria-describedby'),'vaultSetupPassword-hint');
    await page.locator('#dialogSave').click();
    await page.waitForFunction(()=>document.activeElement.id==='vaultSetupPassword');
    await page.locator('#vaultSetupPassword').fill('Äbc1!😊d');
    await page.locator('#dialogSave').click();
    assert.match(await page.locator('#dialogError').textContent(),/mindestens acht Zeichen/);
    await page.locator('#vaultSetupPassword').fill(pass);
    await page.locator('#vaultSetupRepeat').fill('absichtlicher Unterschied');
    await page.locator('#dialogSave').click();
    await page.waitForFunction(()=>document.activeElement.id==='vaultSetupRepeat');
    assert.equal(await page.locator('#vaultSetupRepeat').getAttribute('aria-invalid'),'true');
    await page.locator('#vaultSetupRepeat').fill(pass);
    await scan(page,'passwort-festlegen','#dialog');
    await page.locator('#dialogSave').click();
    await page.waitForSelector('#vaultKeySave');
    await page.locator('#dialogSave').click();
    assert.match(await page.locator('#dialogError').textContent(),/erneut/);
    await page.locator('#vaultKeySave').click();
    await page.locator('#vaultKeyRead').click();
    await page.waitForFunction(()=>document.querySelector('#vaultKeyStatus').textContent.includes('passt'));
    await page.locator('#vaultSetupBack').click();
    assert.equal(await page.locator('#vaultSetupPassword').inputValue(),pass);
    await page.locator('#vaultSetupPassword').focus();
    await page.keyboard.press('F1');
    await page.waitForSelector('#contextHelp');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'vaultSetupPassword');
    assert.equal(await page.locator('#vaultSetupPassword').inputValue(),pass);
    await page.locator('#dialogSave').click();
    await page.waitForSelector('#vaultKeyRead');
    assert.match(await page.locator('#vaultKeyStatus').textContent(),/passt/);
    for(const width of [1280,640,320]){
      await page.setViewportSize({width,height:700});
      await scan(page,'notfallschluessel-'+width,'#dialog');
    }
    await page.locator('#dialogSave').click();
    await page.waitForFunction(()=>document.querySelector('#dialogSave').textContent==='Passwortschutz einschalten');
    await scan(page,'daten-verschluesseln-320','#dialog');
    await page.locator('#dialogSave').click();
    await page.waitForSelector('#dialog',{state:'hidden'});
    assert.match(await page.locator('#passwordProtectionState').textContent(),/eingeschaltet/i);
    await scan(page,'eingeschaltet','#passwordProtection');
    assert.equal(await page.locator('#passwordProtection #vaultLock').count(),0);
    const cancel=page.locator('#dialog .dialog-actions [data-action=close]');
    await page.locator('#vaultChange').click();
    await scan(page,'passwort-aendern-320','#dialog');
    await page.locator('#vaultCurrent').fill('falsches Testpasswort');
    await page.locator('#vaultNew').fill(pass+'1');
    await page.locator('#vaultRepeat').fill(pass+'1');
    await page.locator('#dialogSave').click();
    await page.waitForFunction(()=>document.activeElement.id==='vaultCurrent');
    assert.match(await page.locator('#dialogError').textContent(),/Das Passwort stimmt nicht/);
    await page.locator('#vaultCurrent').fill(pass);
    assert.equal(await page.locator('#dialogError').isVisible(),false);
    await cancel.click();
    await page.locator('#vaultVerify').click();
    await scan(page,'notfallschluessel-pruefen-320','#dialog');
    await page.locator('#vaultVerifyKey').fill('falscher Schlüssel');
    await page.locator('#dialogSave').click();
    await page.waitForFunction(()=>document.activeElement.id==='vaultVerifyKey');
    assert.match(await page.locator('#dialogError').textContent(),/Der Notfallschlüssel passt nicht/);
    await page.locator('#vaultVerifyKey').fill(key);
    await page.locator('#dialogSave').click();
    await page.waitForSelector('#dialog',{state:'hidden'});
    await page.locator('#vaultReplace').click();
    assert.equal(await page.locator('#dialogTitle').textContent(),'Passwort bestätigen');
    await scan(page,'notfallschluessel-ersetzen-320','#dialog');
    await page.locator('#vaultSetupPassword').fill(pass);
    await page.locator('#dialogSave').click();
    await page.waitForSelector('#vaultKeySave');
    await cancel.click();
    await page.locator('#tab-home').click();
    await page.locator('#vaultLock').focus();
    await page.keyboard.press('F1');
    assert.equal(await page.evaluate(()=>Notenblick.contextHelp?.index),'sicherung-passwortschutz-verwenden');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'vaultLock');
    await scan(page,'start-bei-aktivem-schutz-320','#home');
    await page.locator('#vaultLock').click();
    await page.waitForFunction(()=>Notenblick.vault.locked&&!Notenblick.vaultLocking);
    await scan(page,'sperre-320','#vaultGate');
    await page.emulateMedia({forcedColors:'active'});
    await scan(page,'sperre-hochkontrast-320','#vaultGate');
    await page.emulateMedia({forcedColors:'none'});
    const cdp=await context.newCDPSession(page);
    const ax=await cdp.send('Accessibility.getFullAXTree');
    assert.equal(ax.nodes.some(node=>!node.ignored&&node.name?.value==='Hauptnavigation'),false);
    await page.keyboard.press('Alt+n');
    assert.equal(await page.evaluate(()=>Notenblick.ui.main),'home');
    assert.equal(await page.locator('#vaultGateOpen').textContent(),'Entsperren');
    await page.locator('#vaultGateShow').check();
    await page.locator('#vaultGatePassword').fill('falsches Testpasswort');
    await page.locator('#vaultGateOpen').click();
    await page.waitForSelector('#vaultGateError');
    assert.match(await page.locator('#vaultGateError').textContent(),/Das Passwort stimmt nicht/);
    assert.equal(await page.locator('#vaultGatePassword').inputValue(),'');
    assert.equal(await page.locator('#vaultGatePassword').getAttribute('type'),'password');
    assert.equal(await page.locator('#vaultGatePassword').getAttribute('aria-errormessage'),'vaultGateError');
    await page.locator('#vaultGatePassword').fill(pass);
    assert.equal(await page.locator('#vaultGateError').isVisible(),false);
    await page.keyboard.press('F1');
    await page.waitForSelector('#vaultGateHelp');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'vaultGatePassword');
    assert.equal(await page.locator('#vaultGatePassword').inputValue(),pass);
    await page.keyboard.press('Enter');
    await page.waitForSelector('#vaultGate',{state:'hidden'});
    assert.equal(await page.evaluate(()=>document.activeElement.id),'vaultLock');
    await page.evaluate(()=>vaultCheck.triggerLock());
    await page.waitForFunction(()=>Notenblick.vault.locked&&!Notenblick.vaultLocking);
    await page.locator('#vaultGateChoice').click();
    await page.locator('#vaultGateRecovery').fill(key);
    await scan(page,'notfallschluessel-oeffnen-320','#vaultGate');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#vaultGate',{state:'hidden'});
    await page.evaluate(()=>Notenblick.backup());
    const payload=await page.evaluate(()=>backupReceived);
    assert.match(payload.name,/\.nbx$/);
    assert.equal(payload.contents.data.id,fixture.id);
    assert.ok(payload.contents.lists.every(file=>file.path.startsWith('Notenlisten/')&&file.text.includes('\r\n')));
    assert.ok(payload.contents.lists.length);
    await activate(page);
    await page.locator('#vaultDisable').click();
    await scan(page,'passwortschutz-ausschalten-320','#dialog');
    assert.equal(await page.locator('#vaultCurrentKey').isVisible(),false);
    await page.locator('#vaultAuthChoice').click();
    assert.equal(await page.locator('#vaultCurrent').isVisible(),false);
    await page.locator('#vaultCurrentKey').fill('falscher Schlüssel');
    await page.locator('#dialogSave').click();
    await page.waitForFunction(()=>document.activeElement.id==='vaultCurrentKey');
    assert.match(await page.locator('#dialogError').textContent(),/Der Notfallschlüssel passt nicht/);
    await page.locator('#vaultCurrentKey').fill(key);
    await page.locator('#dialogSave').click();
    await page.waitForSelector('#vaultEnable');
    assert.match(await page.locator('#passwordProtectionState').textContent(),/ausgeschaltet/i);
    assert.equal(await page.locator('#vaultLock').count(),0);
    await context.close();
    const locked=await open(true);
    await locked.page.waitForSelector('#vaultGate');
    assert.equal(await locked.page.locator('#vaultGateOpen').textContent(),'Öffnen');
    assert.equal(await locked.page.evaluate(()=>vaultCheck.calls.includes('read')),false);
    await locked.page.locator('#vaultGateChoice').click();
    await locked.page.locator('#vaultGateRead').click();
    assert.equal(await locked.page.locator('#vaultGateRecovery').inputValue(),key);
    await locked.page.locator('#vaultGateOpen').click();
    await locked.page.waitForSelector('html[data-ready=true]');
    assert.equal(await locked.page.evaluate(()=>Notenblick.data.id),fixture.id);
    await locked.context.close();
    assert.deepEqual(errors,[]);
    fs.writeFileSync(out,JSON.stringify({checks:results,nativeBridgeSimulated:true,nvda:false,braille:false,windows:false},null,2));
    console.log('Passwortschutz in Chromium:',results.length,'gerenderte Ansichten mit axe, Entsperren, Sperren, Sicherung und Abschalten.');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
