const assert=require('node:assert/strict');
// Additional real dialogs/states supplement the 49 shared F1 work contexts.
module.exports=async function(page,{install,snapshot,scan,checks}){
 const names=['class-new','class-edit','year-edit','copy-class','copy-course','members','shortcuts','single-final','annual-finals','result-edit','whole-export','weight-preview','weight-copy','oral-review','legacy-review','legacy-archive','restore-confirmation','cleanup-confirmation','operation-progress'];
 for(let i=0;i<names.length;i++){
  await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>document.documentElement.style.zoom='1');await install();
  await page.evaluate(async i=>{
   const A=Notenblick,c=A.getCourse(),d=A.data;A.ui.adminYear=d.years[0].id;A.ui.adminClass=d.classes[0].id;
   if(i===0)A.classDialog();if(i===1)A.classDialog(d.classes[0]);if(i===2)A.yearDialog(true);
   if(i===3){d.years.push({id:'synthetic-nextyear',label:'2027/28'});A.ui.adminYear='synthetic-nextyear';A.copyClassDialog();}
   if(i===4)A.copyCourseDialog();if(i===5)A.membersDialog(c);if(i===6)A.shortcutDialog();
   if(i===7)A.finalDialog(c.studentIds[0],'half');if(i===8)A.finalDialog(null,'annual');if(i===9)A.resultDialog(d.assessments[0].id,c.studentIds[0]);if(i===10)A.openAllNotesExport('pdf');
   if(i===11){A.weightsDialog(c);const input=A.$('#d-exam');input.value='40';input.dispatchEvent(new Event('input',{bubbles:true}));A.$('#d-oral').value='50';A.$('#d-oral').dispatchEvent(new Event('input',{bubbles:true}));await A.submitModal();A.$('#weightDifferences').open=true;}
   if(i===12){d.courses.push({...NR.clone(c),id:'synthetic-copy',name:'Anderes Fach'});A.weightsDialog(c);A.openWeightCopy();}
   if(i===13){d.assessments.find(a=>a.kind==='oral').oralEntry='unclassified';A.reviewOral(c.id);}
   if(i===14||i===15){for(const course of d.courses){delete course.areas;delete course.writtenIds;delete course.writtenName;course.calculationMode='grouped';course.weights={overall:{written:'40',oral:'40',homework:'0',notebook:'0',other:'20'},written:{exam:'80',test:'20'}};}d.assessments=d.assessments.filter(a=>['exam','test','oral'].includes(a.kind));d.assessments.push({...NR.clone(d.assessments[0]),id:'synthetic-old-other',kind:'other'});d.appVersion='1.2.0';A.data=NR.upgrade(d);A.rendered={};if(i===14)A.legacyDialog(c.id);else A.legacyArchive(c.id);}
   if(i===16)A.confirmRestore(NR.clone(d));
   if(i===17){A.store={backupInventory:async()=>({regular:[{},{}],protected:[],remove:[{name:'synthetic-old',size:1024}],bytes:2048,protectedBytes:0})};await A.openCleanup();A.store=null;}
   if(i===18){A.modal('Synthetischer Vorgang','',()=>{},'Weiter');A.auditOperation=A.runOperation('Datei wird erstellt',async progress=>{progress('Synthetische Dokumente werden erstellt.',2,6);await new Promise(r=>A.finishAuditOperation=r);});}
  },i);
  for(const[width,zoom]of [[1280,1],[320,1],[640,2]]){await page.setViewportSize({width,height:900});await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);if(i===0||i===1)assert.equal(await page.locator('#halfYearReport').evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap','Halbjahresauswahl ohne abgeschnittene zweite Textzeile');await snapshot('dialog-'+names[i]+'-'+width+'-'+zoom);await scan();}
  if(i===18)await page.evaluate(async()=>{Notenblick.finishAuditOperation();await Notenblick.auditOperation;});
 }
 checks.push('19 weitere Dialog-/Sonderzustände mit Archiv, Wiederherstellung, Bereinigung, Fortschritt, Vergleich und Übernahme in drei Größen-/Zoomfällen gerendert und mit axe geprüft');
 await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>{document.documentElement.style.zoom='1';if(Notenblick.$('#dialog').open)Notenblick.closeModal({submitted:true});Notenblick.data=NR.blank();Notenblick.ui.workspaces={};Notenblick.firstRun=true;Notenblick.setupDraft=null;Notenblick.setup();});
 for(let step=1;step<=5;step++){
  for(const[width,zoom]of [[1280,1],[320,1],[640,2]]){await page.setViewportSize({width,height:900});await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);await snapshot('setup-'+step+'-'+width+'-'+zoom);await scan();}
  if(step===1)await page.locator('[id^=setup-class-]').first().fill('7a');
  if(step===2)await page.locator('[id^=setup-subject-]').first().fill('Mathematik');
  if(step<5){await page.locator('#dialogSave').click();await page.waitForFunction(step=>Notenblick.setupDraft.step===step,step+1);}
 }
 await page.evaluate(()=>Notenblick.closeModal({submitted:true}));checks.push('Alle fünf Einrichtungsschritte in drei Größen-/Zoomfällen tatsächlich gerendert und per Weiter-Schalter erreicht');
};
