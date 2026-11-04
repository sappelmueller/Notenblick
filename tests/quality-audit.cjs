'use strict';
// Additional audit cases extend the existing DOM and Chromium test groups.
// Every record and every failing storage handle below is synthetic.
const assert=require('node:assert/strict'),path=require('node:path');

exports.dom=async function({q:A,w},checks){
 const original=A.store,before=JSON.stringify(A.data),updates={...A.updates};
 assert.equal(A.reportFlags({weight:'1.5',isGfs:true}),'GFS · 1,5-fach');assert.equal(A.reportFlags({weight:'1',isGfs:false}),'');
 try{
  Object.assign(A.updates,{offer:{version:'1.99.0',notes:['Synthetische Änderung eins.','Synthetische Änderung zwei.','Synthetische Änderung drei.']},result:'available',sessionHidden:'',hiddenVersion:''});A.syncUpdateViews();
  const updateControl=w.document.querySelector('#home [data-action=update-notes]');assert.ok(updateControl);updateControl.focus();assert.equal(A.helpContext(),43);
  A.updateDialog(true);assert.equal(w.document.querySelector('#dialog').open,true);assert.equal(A.helpContext(),43);A.openContextHelp();assert.equal(A.contextHelp.index,43);assert.equal(A.contextHelp.dialog,true);A.closeContextHelp();A.closeModal();
  A.store={root:{getDirectoryHandle:async()=>{throw Object.assign(Error('Synthetic denied'),{name:'NotAllowedError'});}}};
  await assert.rejects(()=>A.restorePoint(),/konnten nicht geöffnet werden/);
  A.store={root:{getDirectoryHandle:async()=>{throw Object.assign(Error('Synthetic missing'),{name:'NotFoundError'});}}};
  await assert.rejects(()=>A.restorePoint(),/noch keine früheren Speicherstände/);
  A.store={root:{getDirectoryHandle:async()=>({async *entries(){yield ['Stand_00000001_synthetic.json',{kind:'file',getFile:async()=>{throw Error('Synthetic native I/O failure');}}];}})}};
  await assert.rejects(()=>A.restorePoint(),/konnte nicht gelesen werden/);
  assert.equal(JSON.stringify(A.data),before);
  A.store={root:{getDirectoryHandle:async()=>({async *entries(){
   yield ['Stand_00000001_invalid.json',{kind:'file',getFile:async()=>({text:async()=>'{incomplete'})}];
   yield ['Stand_00000002_valid.json',{kind:'file',getFile:async()=>({text:async()=>before})}];
  }})}};
  await A.restorePoint();assert.equal(w.document.querySelectorAll('#restorePoint option').length,1);A.closeModal({submitted:true});
  assert.equal(JSON.stringify(A.data),before);
  const holder=w.document.createElement('div');holder.innerHTML=A.menu('synthetic','Klasse 7a <Probe>',[{action:'close',label:'Schließen'}]);
  assert.equal(holder.querySelector('button').getAttribute('aria-label'),'Aktionen – Klasse 7a <Probe>');
  assert.equal(holder.querySelector('button').textContent,'Aktionen');
  checks.push('1.25: fehlende, unlesbare und beschädigte Sicherungen unterschieden; nur gültige Auswahl, Daten unverändert; kontextbezogene und maskierte Menünamen');
 }finally{A.store=original;Object.assign(A.updates,updates);A.syncUpdateViews();}
};

exports.browser=async function(page,{scan,out,checks}){
 await page.evaluate(()=>{updateTestHost?.restore();if(document.querySelector('#dialog').open)Notenblick.closeModal({submitted:true});});
 const fixture=await page.evaluate(()=>JSON.parse(JSON.stringify(contextFixture)));
 await page.evaluate(()=>{
  const d=contextFixture,cl=d.classes[0],c=d.courses[0];
  cl.name='Klasse mit einer sehr langen Bezeichnung '.repeat(2).slice(0,80);
  c.name='Fach mit einer sehr langen Bezeichnung '.repeat(3).slice(0,80);
  d.students[0].first='SynthetischerVorname'.repeat(5).slice(0,100);d.students[0].last='SynthetischerNachname'.repeat(5).slice(0,100);
  d.assessments.find(a=>a.id==='direct').title='Synthetische ausführliche Leistungsbezeichnung '.repeat(4).slice(0,150);
  for(let i=6;i<42;i++){const s={...d.students[1],id:'synthetic-audit-'+i,first:'Testperson '+i,last:'Beispielname'};d.students.push(s);c.studentIds.push(s.id);}
  NR.validate(d);
 });
 const layout=async label=>{
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const actual=await page.evaluate(()=>{
   const d=document.querySelector('dialog[open]');
   return {pageOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),dialogOverflow:d?d.scrollWidth-d.clientWidth:0};
  });
  assert.ok(actual.pageOverflow<=1,label+' page overflow '+actual.pageOverflow);
  assert.ok(actual.dialogOverflow<=2,label+' dialog overflow '+actual.dialogOverflow);
 };
 let states=0;
 for(let index=0;index<49;index++){
  await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>document.documentElement.style.zoom='1');
  await page.evaluate(i=>prepareContext(i),index);await scan();
  for(const[width,zoom]of [[1280,1],[1280,2],[1280,4],[320,1]]){
   await page.setViewportSize({width,height:900});await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);
   await layout('context '+index+' '+width+'/'+zoom);states++;
   if([11,12,13,22,30,38,44].includes(index)&&(zoom===4||width===320))await page.screenshot({path:path.join(out,'audit-'+index+'-'+width+'-'+zoom+'.png'),fullPage:true});
  }
 }
 // Menus near the edge keep the table's own scroll area and fit the viewport.
 for(const[width,height,zoom]of [[1280,900,1],[1280,900,4],[320,600,1],[640,300,1]]){
  await page.setViewportSize({width,height});await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);
  await page.evaluate(()=>prepareContext(4));const button=page.locator('#classes [data-menu-toggle]').last();
  assert.match(await button.getAttribute('aria-label'),/^Aktionen – Klasse /);
  await button.focus();const tableHeight=await page.locator('#classes .table-wrap').evaluate(el=>el.clientHeight);
  await button.press('Space');await layout('open menu '+width+'/'+zoom);
  const box=await page.locator('[role=menu]:visible').boundingBox();assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1,JSON.stringify(box));
  assert.equal(await page.locator('#classes .table-wrap').evaluate(el=>el.clientHeight),tableHeight);
  await page.keyboard.press('End');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Ausblenden');
  await page.keyboard.press('Escape');assert.equal(await button.evaluate(el=>document.activeElement===el),true);
 }
 await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>document.documentElement.style.zoom='1');
 await page.evaluate(()=>prepareContext(12));await page.locator('#dialogSave').click();
 assert.equal(await page.evaluate(()=>document.activeElement.id),'a-title');assert.equal(await page.locator('#dialogError').isVisible(),true);
 await scan();await page.keyboard.press('Escape');
 // Forced-color mode uses the same controls, visible state and keyboard ring.
 await page.emulateMedia({forcedColors:'active'});
 for(const index of [11,12,13,15,22,30,44,47]){await page.evaluate(i=>prepareContext(i),index);await scan();await layout('forced colors '+index);}
 await page.screenshot({path:path.join(out,'audit-high-contrast.png'),fullPage:true});await page.emulateMedia({forcedColors:'none'});
 await page.evaluate(d=>{contextFixture=d;if(document.querySelector('#dialog').open)Notenblick.closeModal({submitted:true});Notenblick.data=NR.blank();Notenblick.mode='demo';Notenblick.rendered={};Notenblick.normalizeContext();},fixture);
 for(const key of ['home','notes','admin','backup','settings','help']){await page.evaluate(k=>Notenblick.activateGroup('main',k),key);await scan();await layout('empty '+key);}
 checks.push('1.25: 49 Arbeitskontexte mit langen Namen und 42 Schülern; '+states+' Layoutfälle bis 400 %, acht Hochkontrastansichten und sechs leere Hauptbereiche ohne axe-Verstöße oder Seitenüberbreite; Menükollision, Tastatur, Fokus und Formularfehler');
};
