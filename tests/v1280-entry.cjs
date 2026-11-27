'use strict';
const assert=require('node:assert/strict');
const {load}=require('./load.cjs');
const fixture=require('./v1260-fixture.cjs');
const plain=value=>JSON.parse(JSON.stringify(value));

(async()=>{
 const cache=new Map(),first=await load({cache});let next;
 try{
  const {q:A,w}=first,$=selector=>w.document.querySelector(selector);
  const data=fixture(w.NR,5),course=data.courses[0],students=course.studentIds;
  const original=plain(data.assessments),count=original.length;
  A.data=data;A.prefs.startupView='home';A.today=()=> '2026-11-25';
  A.mode='working';A.normalizeContext();A.courseNotes(course.id);
  await w.NRSession.save(A.data);
  const value=(selector,v,event='input')=>{const el=$(selector);el.value=v;el.dispatchEvent(new w.Event(event,{bubbles:true}));return el;};
  const grade=(kind,index,v)=>{const el=value('#g-'+kind+'-table-'+students[index],v);A.entryChange(el);return el;};
  for(const layout of ['compact','kinds']){
   A.setPreference('notesLayout',layout);
   A.W().search='vorherige Suche';A.W().entrySearch='kein Treffer';
   for(const kind of ['exam','test','oral','area126-3']){
    A.openPerformanceDraft(kind);
    assert.equal($('#dialog').open,false);
    assert.equal(w.document.activeElement.id,'assessmentWorkTitle');
    assert.equal($('#draft-title').value,'');
    assert.equal($('#draft-date').value,'2026-11-25');
    assert.equal($('#draft-scope').value,'class');
    assert.equal($('#draft-weight').value,'1');
    assert.equal($('#entryBody-'+kind).rows.length,students.length);
    assert.equal(A.data.assessments.length,count);
    A.returnToAssessmentList();
   }
  }
  assert.equal(A.serializePerformanceDrafts().items.length,0);
  A.W().search='';A.prefs.areaView='list';A.prefs.notesLayout='kinds';
  A.openPerformanceDraft('test');
  const d=A.currentPerformanceDraft(),id=d.record.id;
  grade('test',0,'2,5');grade('test',1,'9');
  assert.equal(A.data.assessments.length,count,'unvollständiger Kopf erscheint nicht im Notenbestand');
  assert.equal(d.record.results[students[0]].grade,'2.5');
  assert.equal($('#g-test-table-'+students[1]).getAttribute('aria-invalid'),'true');
  A.groups['entry-test'].activate($('#entry-tab-test-single'),true,true);
  assert.deepEqual(plain(A.entryList(d.record).map(s=>s.id)),plain(students));
  A.groups['entry-test'].activate($('#entry-tab-test-table'),true,true);
  assert.equal($('#g-test-table-'+students[1]).value,'9');
  A.returnToAssessmentList();
  assert.equal(await A.flushAssessmentDrafts(),true);
  assert.match(cache.get('notenblick-workspace-v11'),/assessmentDrafts/);
  next=await load({cache});
  const {q:B,w:x}=next,find=selector=>x.document.querySelector(selector);
  assert.equal(B.data.assessments.length,count);
  assert.ok(find('[data-action=resume-assessment-draft]'));
  await B.action(find('[data-action=resume-assessment-draft]'));
  assert.equal(B.W().assessmentId,id);
  assert.equal(find('#g-test-table-'+students[0]).value,'2,5');
  assert.equal(find('#g-test-table-'+students[1]).value,'9');
  const input=(selector,v,evt='input')=>{const el=find(selector);el.value=v;el.dispatchEvent(new x.Event(evt,{bubbles:true}));return el;};
  input('#draft-title','Wiederaufnahme');
  assert.equal(B.data.assessments.filter(a=>a.id===id).length,1);
  assert.equal(B.data.assessments.at(-1).results[students[0]].grade,'2.5');
  assert.equal(B.data.assessments.at(-1).results[students[1]],undefined);
  await B.action(find('[data-action=assessment-done]'));
  assert.equal(x.document.activeElement.id,'g-test-table-'+students[1]);
  B.entryChange(input('#g-test-table-'+students[1],'3,5'));
  const head=input('#draft-weight','0');
  await assert.rejects(()=>B.action(find('[data-action=assessment-done]')),/Gewichtung/);
  assert.equal(x.document.activeElement,head);
  assert.equal(B.data.assessments.at(-1).weight,'1');
  input('#draft-weight','2');
  input('#draft-scope','selected','change');
  assert.equal(find('#draft-participant-'+students[0]).disabled,true);
  assert.equal(find('#draft-participant-'+students[1]).disabled,true);
  find('#draft-participantNone').click();
  assert.deepEqual(plain(B.data.assessments.at(-1).participantIds),plain(students.slice(0,2)));
  const save=B.save,finish=find('[data-action=assessment-done]');
  B.save=async()=>{throw Error('Synthetischer Schreibfehler');};
  try{await assert.rejects(()=>B.action(finish),/Schreibfehler/);}
  finally{B.save=save;}
  assert.equal(B.currentPerformanceDraft().record.id,id);
  assert.equal(x.document.activeElement,finish);
  assert.equal(finish.disabled,false);
  const saveAndClose=find('[data-action=assessment-finish-close]');
  const {store,dirty,textPending,jsonSavedSeq}=B;
  B.save=async()=>{Object.assign(B,{store:{},dirty:true,textPending:true,jsonSavedSeq:B.seq});};
  try{await assert.rejects(()=>B.action(saveAndClose),/Noten sind gespeichert.*Notenlisten.*Speichern und schließen/);}
  finally{Object.assign(B,{save,store,dirty,textPending,jsonSavedSeq});}
  assert.equal(B.currentPerformanceDraft().record.id,id);
  assert.equal(x.document.activeElement,saveAndClose);
  await Promise.all([B.action(saveAndClose),B.action(saveAndClose)]);
  assert.equal(B.W().assessmentWorkOpen,false);
  assert.equal(B.data.assessments.filter(a=>a.id===id).length,1);
  assert.equal(B.data.assessments.at(-1).weight,'2');
  assert.equal(B.performanceDrafts.size,0);
  assert.deepEqual(plain(B.data.assessments.slice(0,count)),original);
  B.today=()=> '2026-11-25';
  B.openPerformanceDraft('exam');
  await B.action(find('[data-action=point-settings]'));
  input('#pointMode','points','change');input('#pointMaximum','40');
  find('#pointApply').click();
  const points=input('#p-exam-table-'+students[0],'30');
  B.entryChange(points);
  assert.equal(B.data.assessments.length,count+1);
  input('#draft-title','Test mit Punkten');
  assert.equal(B.data.assessments.at(-1).inputMode,'points');
  assert.equal(B.data.assessments.at(-1).results[students[0]].points,'30');
  B.returnToAssessmentList();
  B.openPerformanceDraft('oral');
  input('#draft-title','Gemeinsame Bewertung ohne Note');
  assert.equal(B.data.assessments.length,count+2);
  await B.action(find('[data-action=assessment-done]'));
  assert.equal(B.data.assessments.at(-1).oralEntry,'class');
  assert.deepEqual(plain(B.data.assessments.at(-1).results),{});
  assert.equal(B.data.assessments.length,count+3);
  assert.deepEqual(first.errors,[]);
  assert.deepEqual(next.errors,[]);
  console.log('1.28 Leistungserfassung: beide Layouts, 4 Leistungsbereiche, Wiederaufnahme, Teilnehmer, Punkte, Fehlerfokus und Abschluss geprüft.');
 }finally{first.w.close();next?.w.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
