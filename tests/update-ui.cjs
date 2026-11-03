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
  button.focus();const data=JSON.stringify(A.data),workspace=JSON.stringify(A.getWorkspace());
  assert.equal($('#updateErrorActions').hidden,true);
  for(const state of ['current','new','failed']){
   host.offer=state==='current'?null:{version:'1.25.0',notes:['Neue Versionen sind leichter zu finden.','Notenblick startet jetzt maximiert.','Die Tastaturbedienung ist verbessert.']};host.offline=state==='failed';
   await A.checkUpdates(false);
   assert.equal($('#updateResult').textContent,{current:'Dein Notenblick ist aktuell.',new:'Eine neue Version ist verfügbar.',failed:'Die Aktualisierung konnte nicht geprüft werden. Du kannst normal weiterarbeiten.'}[state]);
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
  assert.equal(JSON.stringify(A.data),data);assert.equal(JSON.stringify(A.getWorkspace()),workspace);
  assert.deepEqual(errors,[]);host.restore();
  // Exercise the real bridge's error path, including constructor failures.
  const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');let receive,sent;
  const bridge={chrome:{webview:{addEventListener:(name,fn)=>{receive=fn;},postMessage:msg=>{sent=msg;}}},setTimeout,clearTimeout,crypto:require('node:crypto').webcrypto};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/desktop.js'),'utf8'),bridge);
  const request=bridge.NRDesktop.call('update-check');receive({data:{id:sent.id,ok:false,error:'Controlled check failure',updateDiagnostic:'synthetic report'}});await assert.rejects(request,e=>e.updateDiagnostic==='synthetic report');
  const other=bridge.NRDesktop.call('update-state');receive({data:{id:sent.id,ok:false,error:'Controlled state failure',updateDiagnostic:'must not propagate'}});await assert.rejects(other,e=>!Object.hasOwn(e,'updateDiagnostic'));
  console.log('Updater UI/bridge: three states, error-only copy button, exact clipboard content/feedback, fallback selection/Escape/focus, cleared diagnostics and unchanged data passed.');
 }finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
