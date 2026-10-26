'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'exports/v1120');fs.mkdirSync(out,{recursive:true});let w,A;const checks=[],manifest={batches:[],documents:[]};
(async()=>{
 const ctx=await require('./load.cjs').load({beforeParse:w=>w.Blob=Blob});({w,q:A}=ctx);const N=w.NR;
 const fonts=['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(n=>new w.Uint8Array(fs.readFileSync(path.join(__dirname,'../src/fonts',n)))),pdf=A.reportPdf;A.reportPdf=r=>pdf(r,{fonts});
 const install=n=>{A.data=require('./v1120-fixture.cjs')(N,n);A.normalizeContext();A.refreshCurrent();const c=A.exportContext('pupil');c.studentId=A.getCourse().studentIds[0];return c;};
 let captured;A.download=async(name,value,mime)=>{captured={name,value,mime};return true;};
 for(const n of [1,10,28,40,100])for(const format of ['pdf','docx','xlsx','txt','csv']){
  const c=install(n),raw=JSON.stringify(A.data),view=JSON.stringify(A.getWorkspace()),progress=[];captured=null;
  assert.equal(await A.exportPupilBatch(c,{entries:'all',grouping:'kind',remarks:true},format,()=>true,(done,total)=>progress.push([done,total])),true);
  assert.equal(captured.name,'Notenblick_2026-27_6a_Deutsch_Schuelerberichte.zip');assert.equal(captured.mime,'application/zip');assert.equal(progress.length,n);assert.deepEqual(progress.at(-1),[n,n]);
  const name='batch-'+n+'-'+format;fs.writeFileSync(path.join(out,name+'.zip'),Buffer.from(await captured.value.arrayBuffer()));manifest.batches.push({name,count:n,format});if(format==='pdf'){const used=new Set(),models=A.batchStudents(c).map(student=>({base:A.batchEntryName(student,'pdf',used).replace(/\.pdf$/,''),report:A.buildReport({...c,studentId:student.id},{entries:'all',grouping:'kind',remarks:true})}));fs.writeFileSync(path.join(out,'batch-'+n+'-models.json'),JSON.stringify(models));}
  assert.equal(JSON.stringify(A.data),raw);assert.equal(JSON.stringify(A.getWorkspace()),view);
 }checks.push('1/10/28/40/100 Schüler × fünf echte Dateiformate, je ein Bericht pro Schüler, ohne Veränderung von Noten oder Ansicht');
 let c=install(10),course=A.getCourse();A.data.students[0].archived=true;course.inactiveStudentIds=[course.studentIds[1]];assert.equal(A.batchStudents(c).length,8);assert.equal(A.batchStudents(c,true).length,10);
 await A.exportPupilBatch(c,{includeExited:true,entries:'entered',grouping:'date',remarks:false},'txt');fs.writeFileSync(path.join(out,'batch-exited.zip'),Buffer.from(await captured.value.arrayBuffer()));manifest.batches.push({name:'batch-exited',count:10,format:'txt'});checks.push('Ausgeschiedene/archivierte Schüler nur ausdrücklich zusätzlich; leere Berichte und gleiche Namen erhalten');
 c=install(1);const used=new Set();for(const first of ['CON','NUL','COM1','../Pfad','Anna','Anna','anna','Anna_2','Anna.','A'.repeat(250)]){const n=A.batchEntryName({first,last:''},'txt',used);assert.ok(!/[<>:"/\\|?*]/.test(n));assert.ok(n.length<=120);assert.ok(!/^(CON|NUL|COM1)\./i.test(n));}assert.equal(used.size,10);
 for(const name of ['../bad','/bad','bad\\name','a/../b'])assert.throws(()=>A.zipWriter().add(name,new w.Uint8Array([1])));const zip=A.zipWriter();zip.add('A.txt','test');assert.throws(()=>zip.add('a.txt','test'));zip.discard();checks.push('Sichere eindeutige Windows-Namen; reservierte Namen, Pfade und doppelte Einträge abgefangen');
 let saved=0;A.download=async()=>{saved++;return true;};let running=true;
 assert.equal(await A.exportPupilBatch(c,{},'txt',()=>running,()=>running=false),false);assert.equal(saved,0);
 await assert.rejects(A.exportPupilBatch(c,{},'txt',()=>true,()=>{},50),/zu groß/);assert.equal(saved,0);
 const renderer=A.renderReportFile;A.renderReportFile=async()=>{throw Error('synthetic internal');};await assert.rejects(A.exportPupilBatch(c,{},'docx'),/kein ZIP/);assert.equal(saved,0);A.renderReportFile=renderer;
 A.download=async()=>{const e=Error('internal');e.code='export-location-unavailable';throw e;};await assert.rejects(A.exportPupilBatch(c,{},'txt'),/Speicherort/);A.download=async()=>false;assert.equal(await A.exportPupilBatch(c,{},'txt'),false);await assert.rejects(A.exportPupilBatch(c,{},'print'),/Dateiformat/);checks.push('Abbruch, Größenlimit, Erstellungs-/Speicherfehler: kein unvollständiges Archiv, verständliche Meldung');
 c=install(1);const hist=N.clone(A.data);hist.years[0].label='2024/25';hist.years[0].archived=true;A.data=hist;const old=A.buildReport(c,{});assert.equal(old.year,'Schuljahr 2024/25');assert.equal(A.batchStudents(c).length,1);checks.push('Historisches Schuljahr bleibt auf das ausgewählte Fach und dessen Teilnehmer beschränkt');
 const base=A.buildReport(c,{});
 async function write(name,r){r.landscape=A.reportLayout(r).landscape;fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(r));fs.writeFileSync(path.join(out,name+'.docx'),Buffer.from(A.reportDocx(r)));fs.writeFileSync(path.join(out,name+'.pdf'),Buffer.from(await A.reportPdf(r)));manifest.documents.push(name);}
 for(const count of [10,20,28,40,60])for(const columns of [7,8,10,15,24]){
  const r={...base,type:'matrix',title:'Synthetische Klassenarbeiten',student:undefined,sections:[{title:'',matrix:true,fixed:2,columns:[{label:'Schüler'},{label:'Durchschnitt',type:'average'},...Array.from({length:columns-2},(_,i)=>({label:'K'+String(i+1).padStart(2,'0')+', 12.10.2026',type:'grade'}))],rows:Array.from({length:count},(_,i)=>[A.reportCell('P'+String(i).padStart(3,'0')+' Testfamilienname'),A.reportGrade('2.15'),...Array.from({length:columns-2},()=>A.reportGrade('2.25'))])}]};await write('matrix-'+count+'-'+columns,r);
 }
 for(const count of [10,20,28,40,60]){const r={...base,type:'matrix',student:undefined,title:'Schmale Testtabelle',sections:[{title:'',matrix:true,fixed:1,columns:[{label:'Schüler'},{label:'K01',type:'grade'},{label:'K02',type:'grade'}],rows:Array.from({length:count},(_,i)=>[A.reportCell('P'+String(i).padStart(3,'0')+' Testfamilie'),A.reportGrade('2'),A.reportGrade('3')])}]};await write('portrait-'+count,r);}
 c=install(2);const d=A.data,sid=c.studentId;for(let i=36;i<120;i++){const a=N.clone(d.assessments[i%36]);a.id='synthetic-large-'+i;d.assessments.push(a);}for(const a of d.assessments)a.results[sid].note='Ausführliche Bemerkung zur synthetischen Leistung. '.repeat(5);
 delete d.assessments[0].results[sid];assert.equal(A.buildReport(c,{entries:'all'}).recordIds.length,120);assert.equal(A.buildReport(c,{entries:'entered'}).recordIds.length,119);
 for(const grouping of ['kind','date'])for(const entries of ['all','entered'])for(const remarks of [false,true])await write('pupil-'+grouping+'-'+entries+'-'+remarks,A.buildReport(c,{grouping,entries,remarks}));
 checks.push('38 echte Word/PDF-Berichte: 10/20/28/40/60 Schüler, 3/7/8/10/15/24 Spalten sowie umfangreiche Schülerberichte mit acht Optionskombinationen');
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));fs.writeFileSync(path.join(__dirname,'v1120-results.json'),JSON.stringify({checks,syntheticOnly:true,windows:false,office:false,nvda:false},null,2));await A.workspacePromise;w.close();console.log('1.12:',checks.length,'Prüfgruppen;',manifest.batches.length,'ZIPs;',manifest.documents.length,'Dokumentfälle');
})().catch(async e=>{console.error(e);await A?.workspacePromise;w?.close();process.exitCode=1;});
