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
  for(const state of ['current','new','failed']){
   host.offer=state==='current'?null:{version:'1.25.0',notes:['Neue Versionen sind leichter zu finden.','Notenblick startet jetzt maximiert.','Die Tastaturbedienung ist verbessert.']};host.offline=state==='failed';
   await A.checkUpdates(false);
   assert.equal($('#updateResult').textContent,{current:'Dein Notenblick ist aktuell.',new:'Eine neue Version ist verfügbar.',failed:'Die Aktualisierung konnte nicht geprüft werden. Du kannst normal weiterarbeiten.'}[state]);
   assert.equal(w.document.activeElement,button);assert.equal(button.disabled,false);
   assert.equal(JSON.stringify(A.data),data);assert.equal(JSON.stringify(A.getWorkspace()),workspace);
   if(state==='current')assert.equal($('#updateActions').hidden,true);
  }
  assert.deepEqual(errors,[]);host.restore();
  console.log('Updater UI: current/new/failed feedback, stable focus and unchanged data/workspace passed.');
 }finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
