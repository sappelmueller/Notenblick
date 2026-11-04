'use strict';
const assert=require('node:assert/strict');
(async()=>{
 const {dom,w,q:A,errors}=await require('./load.cjs').load({cache:new Map()});
 try{
  w.contextFixture=require('./v1210-fixture.cjs')(w.NR);
  w.eval('globalThis.prepareUpdateContext='+require('./v1230-contexts.cjs').toString());
  await w.prepareUpdateContext(11);
  w.eval('globalThis.installUpdateTestHost='+require('./update-fixture.cjs').toString());
  const host=w.installUpdateTestHost();A.updates.initialized=false;await A.initUpdates();
  A.activateGroup('main','settings');A.activateGroup('settings','general');
  const $=s=>w.document.querySelector(s),button=$('#updateCheck');
  assert.equal($('#updatesTitle').tagName,'H2');assert.equal($('#updatesTitle').textContent,'Aktualisierungen');
  assert.equal($('.update-settings p strong').textContent,require('../package.json').version);assert.equal($('#updateAuto').nextElementSibling.textContent,'Beim Start nach Aktualisierungen suchen');
  assert.equal($('.update-settings .hint').textContent,'Notenblick sucht nach neuen Versionen. Deine Noten bleiben auf deinem Computer.');
  assert.equal($('#updateResult').hasAttribute('role'),false);assert.equal($('#updateResult').hasAttribute('aria-live'),false);
  button.focus();const data=JSON.stringify(A.data),workspace=JSON.stringify(A.getWorkspace());
  assert.equal($('#updateErrorActions').hidden,true);
  for(const state of ['current','new','failed']){
   host.offer=state==='current'?null:{version:'1.25.0',notes:['Neue Versionen sind leichter zu finden.','Notenblick startet jetzt maximiert.','Die Tastaturbedienung ist verbessert.']};host.offline=state==='failed';
   await A.checkUpdates(false);
   assert.equal($('#updateResult').textContent,{current:'Dein Notenblick ist aktuell.',new:'Notenblick 1.25.0 ist verfügbar.',failed:'Die Aktualisierung konnte nicht geprüft werden. Du kannst normal weiterarbeiten.'}[state]);
   assert.equal($('#updateResult').dataset.state,{current:'current',new:'available',failed:'error'}[state]);
   assert.equal(w.document.activeElement,button);assert.equal(button.disabled,false);
   assert.equal(JSON.stringify(A.data),data);assert.equal(JSON.stringify(A.getWorkspace()),workspace);
   if(state==='current')assert.equal($('#updateActions').hidden,true);
   assert.equal($('#updateErrorActions').hidden,state!=='failed');
  }
  const copy=$('#updateCopyError');copy.focus();await A.action({dataset:{action:'update-copy-error'}});
  assert.equal(host.clipboard,host.diagnostic);assert.equal(w.document.activeElement,copy);
  await new Promise(r=>w.setTimeout(r,140));assert.equal($('#announcement').textContent,'Fehlerdetails kopiert.');
  host.copyFails=true;await A.copyUpdateError();assert.equal($('#dialog').open,true);assert.equal(w.document.activeElement.id,'dialogTitle');
  const text=$('#updateErrorText');assert.equal(text.readOnly,true);assert.equal(text.value,host.diagnostic);assert.equal($('label[for=updateErrorText]').textContent,'Fehlerdetails');text.focus();text.select();assert.equal(text.selectionEnd,text.value.length);
  // jsdom does not perform the browser's native Escape -> dialog cancel action.
  $('#dialog').dispatchEvent(new w.Event('cancel',{cancelable:true}));assert.equal($('#dialog').open,false);assert.equal(w.document.activeElement,copy);
  A.activateGroup('main','home');A.activateGroup('main','settings');assert.equal($('#updateErrorActions').hidden,false);
  host.offline=false;host.offer=null;await A.checkUpdates(false);assert.equal(A.updates.diagnostic,'');assert.equal($('#updateErrorActions').hidden,true);
  const priorCalls=host.calls.length;await A.copyUpdateError();assert.equal(host.calls.length,priorCalls);
  host.offline=true;host.diagnostic='';await A.checkUpdates(false);assert.match(A.updates.diagnostic,/Keine vollständige native Fehlerdiagnose empfangen/);assert.equal($('#updateErrorActions').hidden,false);await A.copyUpdateError();assert.equal($('#updateErrorText').value,A.updates.diagnostic);A.closeModal();
  host.diagnostic='Synthetische Diagnose';host.offline=false;host.offer={version:'1.25.0',notes:['Neue Versionen sind leichter zu finden.','Notenblick startet jetzt maximiert.','Die Tastaturbedienung ist verbessert.']};
  // An asynchronous result must preserve the control the user moved to meanwhile.
  const bridgeCall=w.NRDesktop.call;let finish;
  w.NRDesktop.call=(op,...args)=>op==='update-check'?new Promise((resolve,reject)=>{finish=()=>bridgeCall(op,...args).then(resolve,reject);}):bridgeCall(op,...args);
  const checksBeforePending=host.calls.filter(c=>c.op==='update-check').length,pending=A.checkUpdates(false),selection=$('#setting-startupView'),value=selection.value;assert.equal($('#updateCheck').getAttribute('aria-disabled'),'true');assert.equal($('#updateCheck').disabled,false);await A.checkUpdates(false);selection.focus();await finish();await pending;assert.equal(host.calls.filter(c=>c.op==='update-check').length,checksBeforePending+1);assert.equal(w.document.activeElement,selection);assert.equal(selection.value,value);w.NRDesktop.call=bridgeCall;
  A.activateGroup('main','home');const slot=$('#homeUpdateSlot'),continueNode=$('#homeContinue'),grid=$('.home-grid');
  assert.equal(slot.nextElementSibling,grid);assert.equal($('#homeUpdateTitle').tagName,'H2');assert.equal($('#homeUpdateVersion').textContent,'Notenblick 1.25.0 ist verfügbar.');
  assert.deepEqual(Array.from(slot.querySelectorAll('button'),el=>el.textContent),['Was ist neu?','Jetzt aktualisieren','Später aktualisieren']);assert.equal($('#updateHideLabel').textContent,'Hinweis zu Version 1.25.0 nicht mehr anzeigen');
  const later=slot.querySelector('[data-action=update-later]');later.focus();await A.action(later);assert.equal(slot.hidden,true);assert.equal(w.document.activeElement.id,'continueTitle');assert.equal(host.state.hiddenVersion,'');assert.equal(host.calls.some(c=>['update-prepare','update-install'].includes(c.op)),false);
  await A.checkUpdates(false);assert.equal(slot.hidden,true);assert.equal($('#homeContinue'),continueNode);assert.equal($('.home-grid'),grid);
  // Recreate only the UI session boundary; native version preference survives.
  A.updates.sessionHidden='';A.updates.result='';A.updates.initialized=false;const beforeInit=host.calls.length,focusBeforeInit=w.document.activeElement;await A.initUpdates();assert.equal(slot.hidden,false);assert.equal(w.document.activeElement,focusBeforeInit);assert.equal($('#dialog').open,false);assert.deepEqual(Array.from(host.calls.slice(beforeInit),c=>c.op),['update-state']);assert.equal($('#homeUpdateVersion').textContent,'Zuletzt gefunden: Notenblick 1.25.0.');
  host.offer.version='1.26.0';await A.checkUpdates(false);const hide=$('#updateHide');hide.focus();hide.checked=true;await hide.onchange({target:hide});assert.equal(slot.hidden,true);assert.equal(host.state.hiddenVersion,'1.26.0');assert.equal(w.document.activeElement.id,'continueTitle');assert.equal($('#announcement').textContent,'');
  A.updates.initialized=false;A.updates.result='';await A.initUpdates();assert.equal(slot.hidden,true);host.offer.version='1.27.0';await A.checkUpdates(false);assert.equal(slot.hidden,false);assert.equal($('#updateHideLabel').textContent,'Hinweis zu Version 1.27.0 nicht mehr anzeigen');
  const continueTitle=$('#continueTitle');continueTitle.hidden=true;later.focus();await A.action(later);assert.equal(w.document.activeElement.id,'homeSubjectsTitle');continueTitle.hidden=false;
  host.offer.version='1.28.0';await A.checkUpdates(false);host.offline=true;await A.checkUpdates(false);assert.equal($('#homeUpdateVersion').textContent,'Zuletzt gefunden: Notenblick 1.28.0.');assert.equal($('#homeUpdateStatus').textContent,'Die Verfügbarkeit konnte jetzt nicht geprüft werden.');assert.equal($('#homeUpdateStatus').hidden,false);
  const callsBeforeRender=host.calls.length;A.syncUpdateViews();assert.equal(host.calls.length,callsBeforeRender);
  A.activateGroup('main','settings');assert.equal($('#updateKnownVersion').textContent,'Zuletzt gefunden: Notenblick 1.28.0.');assert.equal($('#updateKnownVersion').hidden,false);assert.equal($('#updateResult').textContent,'Die Aktualisierung konnte nicht geprüft werden. Du kannst normal weiterarbeiten.');assert.equal($('#updateCheck').disabled,false);
  $('#updateActions [data-action=update-install]').focus();A.updateDialog(false);assert.match($('#dialogContent').textContent,/Zuletzt gefunden: Notenblick 1.28.0/);assert.doesNotMatch($('#dialogContent').textContent,/1.28.0 ist verfügbar/);
  host.prepareMode='fail';await A.submitModal();assert.equal(host.calls.filter(c=>c.op==='update-prepare').length,1);assert.equal(host.calls.filter(c=>c.op==='update-install').length,0);A.closeModal();
  host.offline=false;await A.checkUpdates(false);assert.equal($('#updateResult').textContent,'Notenblick 1.28.0 ist verfügbar.');assert.equal($('#updateKnownVersion').hidden,true);host.offer=null;await A.checkUpdates(false);assert.equal($('#updateKnownVersion').hidden,true);assert.equal($('#updateActions').hidden,true);A.activateGroup('main','home');assert.equal($('#homeUpdateSlot').hidden,true);A.activateGroup('main','settings');
  assert.equal(JSON.stringify(A.data),data);assert.equal(JSON.stringify(A.getWorkspace()),workspace);
  assert.deepEqual(errors,[]);host.restore();
  // Exercise the real bridge's error path, including constructor failures.
  const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');let receive,sent;
  const bridge={chrome:{webview:{addEventListener:(name,fn)=>{receive=fn;},postMessage:msg=>{sent=msg;}}},setTimeout,clearTimeout,crypto:require('node:crypto').webcrypto};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/desktop.js'),'utf8'),bridge);
  const request=bridge.NRDesktop.call('update-check');receive({data:{id:sent.id,ok:false,error:'Controlled check failure',updateDiagnostic:'synthetic report'}});await assert.rejects(request,e=>e.updateDiagnostic==='synthetic report');
  const other=bridge.NRDesktop.call('update-state');receive({data:{id:sent.id,ok:false,error:'Controlled state failure',updateDiagnostic:'must not propagate'}});await assert.rejects(other,e=>!Object.hasOwn(e,'updateDiagnostic'));
  console.log('Updater UI/bridge: dynamic labels/states, session/version hiding, focus/fallback, cached/failed/retried offers, no extra requests/install, preserved input and diagnostic copy passed.');
 }finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
