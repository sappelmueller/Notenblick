/* A draft is private working state. Only validated assessments enter the grade book. */
(function(A){'use strict';
const DAY_PARTS=['day','month','year'];
const ROW_FIELDS={grade:'g',points:'p',status:'s',note:'n'};
const labelFor=record=>({exam:'Neue Klassenarbeit',test:'Neuer Test',oral:'Neue mündliche Bewertung'}[record.kind]||'Neue Leistung – '+A.kindLabel(record.kind,A.data.courses.find(c=>c.id===record.courseId)));
const validDate=date=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
A.performanceDraftLabel=labelFor;
const activeCourse=d=>d.record.courseId===A.ui.course;
let scheduled;
let refreshParticipantCount;
A.performanceDrafts=new Map();
A.assessmentById=id=>A.data.assessments.find(record=>record.id===id)||A.performanceDrafts.get(id)?.record;
A.currentPerformanceDraft=function(){
 const w=A.W(),d=A.performanceDrafts.get(w.assessmentId);
 const head=A.$('#newAssessmentFields');
 return A.ui.main==='notes'&&w.assessmentWorkOpen&&d&&activeCourse(d)&&head?.dataset.draftId===d.record.id&&!head.closest('[hidden]')?d:null;
};
A.resetPerformanceDrafts=function(){
 clearTimeout(scheduled);
 scheduled=null;
 A.performanceDrafts.clear();
};
A.serializePerformanceDrafts=()=>({dataId:A.data.id,items:[...A.performanceDrafts.values()].filter(d=>d.touched).map(d=>A.N.clone(d))});
A.restorePerformanceDrafts=function(saved){
 A.resetPerformanceDrafts();
 if(saved?.dataId!==A.data.id||!Array.isArray(saved.items))return;
 for(const d of saved.items){
  const r=d?.record,c=A.data.courses.find(x=>x.id===r?.courseId);
  if(!c||!A.N.areaIds(c).includes(r.kind)||!d.head||!d.rows||Object.values(d.rows).some(row=>!row||typeof row!=='object'))continue;
  const h=d.head;
  if(!['title','year','month','day','weight'].every(key=>typeof h[key]==='string'&&h[key].length<=150)||
   !['class','selected'].includes(h.scope)||!Array.isArray(h.participants)||typeof h.isGfs!=='boolean')continue;
  h.participants=h.participants.filter(id=>c.studentIds.includes(id));
  if(typeof r.id!=='string'||!/^[a-zA-Z0-9_-]{1,160}$/.test(r.id)||!validDate(r.date))continue;
  const old=A.data.assessments.find(x=>x.id===r.id);
  if(old&&(old.courseId!==r.courseId||old.kind!==r.kind))continue;
  try{
   const sample={...r,title:r.title||'Entwurf'};
   if(sample.participantIds?.length===0)delete sample.participantIds;
   A.N.validate({...A.data,assessments:[...A.data.assessments.filter(x=>x.id!==r.id),sample]});
  }catch{continue;}
  d.rows=Object.fromEntries(Object.entries(d.rows).filter(([sid])=>c.studentIds.includes(sid)).map(([sid,row])=>[sid,Object.fromEntries(Object.entries(row).filter(([field,value])=>Object.hasOwn(ROW_FIELDS,field)&&typeof value==='string'&&value.length<=2000))]));
  d.touched=true;
  A.performanceDrafts.set(r.id,d);
 }
};
A.flushAssessmentDrafts=async function(){
 if(scheduled||A.workspaceFailed&&A.performanceDrafts.size){
  clearTimeout(scheduled);
  scheduled=null;
  A.remember();
 }
 await A.workspacePromise;
 return !A.workspaceFailed;
};
A.assessmentDraftPending=()=>!!scheduled;
function persist(d){
 d.touched=true;
 clearTimeout(scheduled);
 scheduled=setTimeout(()=>{scheduled=null;A.remember();},150);
}
function updateState(d){
 const el=A.$('#newAssessmentStatus');
 const saved=A.data.assessments.some(a=>a.id===d.record.id);
 if(el){
  el.textContent=saved?'Leistung angelegt. Weitere Eingaben werden automatisch gespeichert.':'Entwurf. Du kannst später weiterarbeiten.';
  el.parentElement.hidden=!saved&&!d.touched;
 }
 const discard=A.$('[data-action=discard-assessment-draft]');
 if(discard)discard.hidden=saved||!d.touched;
}
function contextRecord(d){
 const r=A.assessmentById(d.record.id),c=A.getCourse();
 if(!c||r.courseId!==c.id||!A.N.areaIds(c).includes(r.kind))throw Error('Das Fach oder der Leistungsbereich hat sich geändert.');
 A.ensureEdit(c);
 return {r,c};
}
function fail(message,id,show){
 if(show){
  const el=A.$('#'+id);
  if(el){
   for(let details=el.closest('details');details;details=details.parentElement.closest('details'))details.open=true;
   el.setAttribute('aria-invalid','true');
   el.setAttribute('aria-describedby','error');
   A.focusTarget(el);
  }
 }
 throw Error(message);
}
function readHead(d,{show=false}={}){
 const {r,c}=contextRecord(d),h=d.head,title=h.title.trim();
 if(!title||title.length>150)fail('Bitte gib eine Bezeichnung ein.','draft-title',show);
 const {value:date,part,message}=A.parseDateParts(h);
 if(part)fail(message,'draft-date-'+part,show);
 let period;
 try{period=A.assessmentPeriod(c,date,A.data.assessments.find(x=>x.id===r.id));}
 catch(e){
  const range=A.N.courseRange(A.data,c),boundary=range&&(date<range.start?range.start:range.end);
  const part=boundary&&date.slice(0,4)!==boundary.slice(0,4)?'year':boundary&&date.slice(5,7)!==boundary.slice(5,7)?'month':'day';
  fail(e.message,'draft-date-'+part,show);
 }
 let weight;
 try{weight=A.performanceWeight(h.weight);}
 catch(e){fail(e.message,'draft-weight',show);}
 if(h.scope==='selected'&&!h.participants.length)fail('Wähle mindestens einen Schüler.','draft-participantSearch',show);
 const participantIds=h.scope==='selected'?h.participants:null;
 if(participantIds&&[...Object.keys(r.results),...Object.keys(d.rows).filter(id=>Object.values(d.rows[id]).some(Boolean))].some(id=>!participantIds.includes(id)))fail('Schüler mit Einträgen müssen beteiligt bleiben.','draft-participantSearch',show);
 return {title,date,period,weight,isGfs:h.isGfs,participantIds};
}
function mergedHead(r,head){
 const {participantIds,...rest}=head, next={...r,...rest};
 if(participantIds)next.participantIds=participantIds.slice();
 else delete next.participantIds;
 return next;
}
function applyDraft(d,{finish=false,show=false}={}){
 const r=A.assessmentById(d.record.id),current=A.data.assessments.find(a=>a.id===r.id);
 try{
  const next=mergedHead(r,readHead(d,{show}));
  // A pending point-key change must be applied before a new grade is committed.
  if(!current&&!finish&&(d.pointFields||!Object.values(next.results).some(A.N.hasEntry)))return false;
  if(!current||JSON.stringify(current)!==JSON.stringify(next)){
   A.mutate(data=>{
    const i=data.assessments.findIndex(a=>a.id===next.id);
    if(i<0)data.assessments.push(next);
    else data.assessments[i]=next;
   },{refresh:false});
   if(!current){
    A.refreshAssessmentList();
    if(A.$('#matrixTable'))A.refreshTable('matrix');
   }
  }
  d.record=A.N.clone(A.assessmentById(r.id));
  A.$('#assessmentWorkTitle').textContent='Noten eingeben – '+next.title;
  for(const el of document.querySelectorAll('#newAssessmentFields [aria-invalid],#newAssessmentMore [aria-invalid]')){
   el.removeAttribute('aria-invalid');
   el.removeAttribute('aria-describedby');
  }
  updateState(d);
  return true;
 }catch(e){if(show)throw e;return false;}
}
function resumeMarkup(d){
 const r=d.record,c=A.data.courses.find(x=>x.id===r.courseId),cl=A.data.classes.find(x=>x.id===c.classId);
 return '<li><div><strong>'+A.esc(c.name+' – '+cl.name)+'</strong><p class="pending-title">'+A.esc(d.head.title.trim()||labelFor(r))+'</p><p class="pending-progress">Entwurf</p></div>'+A.b('resume-assessment-draft','Entwurf fortsetzen','data-id="'+r.id+'"','text-button')+'</li>';
}
A.performanceDraftLinks=function({courseId,kind,except}={}){
 const drafts=[...A.performanceDrafts.values()].filter(d=>d.touched&&d.record.id!==except&&
  (!courseId||d.record.courseId===courseId)&&(!kind||kind===d.record.kind)&&
  A.data.courses.some(c=>c.id===d.record.courseId&&!A.readonly(c))&&
  (!A.data.assessments.some(a=>a.id===d.record.id)||Object.values(d.rows).some(row=>Object.keys(row).length)||d.pointFields||d.headPending));
 return drafts.length?'<ul class="work-list performance-drafts">'+drafts.map(resumeMarkup).join('')+'</ul>':'';
};
A.openPerformanceDraft=function(kind,{id,trigger}={}){
 const c=A.getCourse();
 A.ensureEdit(c);
 if(!A.N.areaIds(c).includes(kind))throw Error('Dieser Leistungsbereich ist nicht mehr vorhanden.');
 const w=A.W();
 let d=id?A.performanceDrafts.get(id):null;
 if(!d){
  const date=A.today(),[year,month,day]=date.split('-'), record={id:A.N.id(),courseId:c.id,kind,title:'',date,period:'1',weight:'1',isGfs:false,results:{}};
  if(kind===A.N.oralArea(c))record.oralEntry='class';
  // Reopen the current untouched work area on a repeated click. Existing
  // touched drafts keep their own IDs and remain available in the list.
  const open=A.currentPerformanceDraft();
  if(open&&!open.touched&&open.record.kind===kind)d=open;
  else {d={record,rows:{},head:{title:'',year,month,day,weight:'1',isGfs:false,scope:'class',participants:[]},touched:false};A.performanceDrafts.set(record.id,d);}
 }
 if(d.record.courseId!==c.id||d.record.kind!==kind)throw Error('Dieser Entwurf gehört zu einem anderen Fach.');
 const previous=A.currentPerformanceDraft();
 if(previous&&!previous.touched&&previous!==d)A.performanceDrafts.delete(previous.record.id);
 if(previous!==d)A.captureEntryOrigin(trigger,{preserveView:true});
 A.entrySession={id:d.record.id,editing:true,settings:!!d.pointFields};
 w.entryMode='table';
 w.studentIndex=0;
 w.entrySearch='';
 w.assessmentWorkOpen=true;
 w.assessmentId=d.record.id;
 w.selected[kind]=d.record.id;
 w.view=A.assessmentView(kind);
 w.assessmentFilter=kind===A.N.oralArea(c)?kind:'all';
 if(kind==='oral')w.oralView='classes';
 A.clearAssessmentWorkspace();
 A.activateGroup('notes',w.view);
 A.remember();
 A.focusTarget('assessmentWorkTitle');
 A.$('#assessmentWorkTitle')?.scrollIntoView?.({block:'start'});
};
A.resumePerformanceDraft=function(id,trigger){
 const d=A.performanceDrafts.get(id);
 if(!d)throw Error('Dieser Entwurf ist nicht mehr vorhanden.');
 if(d.record.courseId!==A.ui.course||A.ui.main!=='notes')A.courseNotes(d.record.courseId,{focus:false});
 A.openPerformanceDraft(d.record.kind,{id,trigger});
};
A.performanceDraftHead=function(d){
 const h=d.head,date=[h.year.padStart(4,'0'),h.month.padStart(2,'0'),h.day.padStart(2,'0')].join('-');
 return '<div id="newAssessmentFields" class="form-grid" data-draft-id="'+d.record.id+'">'+A.field('draft-title','Bezeichnung',h.title,'required maxlength="150"')+
  A.field('draft-date','Datum',date,'required','date')+'</div>';
};
A.performanceDraftParticipation=function(d,a){
 const h=d.head,protectedResults={...a.results};
 for(const [sid,row] of Object.entries(d.rows))if(Object.values(row).some(Boolean))protectedResults[sid]={};
 return A.participantMarkup({...a,results:protectedResults,participantIds:h.scope==='selected'?h.participants:undefined},A.getCourse(),{prefix:'draft',inline:true});
};
A.performanceDraftOptions=function(d){
 const h=d.head;
 return '<details id="newAssessmentMore" class="performance-draft-options"'+(d.more?' open':'')+'><summary>Weitere Angaben</summary><div class="form-grid">'+
 A.field('draft-weight','Gewichtung der Leistung',h.weight,'inputmode="decimal"','text','1 = einfach, 2 = doppelt. Bestimmt, wie stark diese Leistung zählt.')+
  '<label class="check full"><input type="checkbox" id="draft-gfs"'+(h.isGfs?' checked':'')+'>Als GFS kennzeichnen</label></div></details>';
};
function syncHead(d){
  d.head.title=A.$('#draft-title').value;
  for(const field of DAY_PARTS)d.head[field]=A.$('#draft-date-'+field).value;
  d.head.weight=A.$('#draft-weight').value;
  d.head.isGfs=A.$('#draft-gfs').checked;
  d.head.scope=A.$('#draft-scope').value;
  d.head.participants=[...A.$('#draft-participants').querySelectorAll('input:checked')].map(x=>x.value);
}
A.bindPerformanceDraft=function(d){
 const headChanged=({participants=false}={})=>{
  syncHead(d);
  persist(d);
  const r=A.assessmentById(d.record.id);
  if(participants&&!A.data.assessments.some(x=>x.id===r.id)){
   if(d.head.scope==='selected')r.participantIds=d.head.participants.slice();
   else delete r.participantIds;
  }
  d.headPending=!applyDraft(d);
  if(participants){A.renderEntry(r.kind,A.W().entryMode);A.updateEntrySummary(r.kind);}
  updateState(d);
 };
 for(const id of ['draft-title','draft-weight',...DAY_PARTS.map(p=>'draft-date-'+p)]){
  const el=A.$('#'+id);
  if(id.startsWith('draft-date-'))el.value=d.head[id.slice('draft-date-'.length)];
  el.addEventListener('input',()=>{
   if(el.getAttribute('aria-describedby')==='error')el.removeAttribute('aria-describedby');
   el.removeAttribute('aria-invalid');headChanged();
  });
 }
 A.$('#draft-gfs').addEventListener('change',()=>headChanged());
 A.$('#newAssessmentMore').addEventListener('toggle',e=>d.more=e.target.open);
 refreshParticipantCount=A.bindParticipants({prefix:'draft',onChange:()=>headChanged({participants:true})});
 updateState(d);
};
A.performanceInputValue=function(a,student,field,fallback){
 const raw=A.performanceDrafts.get(a.id)?.rows[student]?.[field];
 return raw===undefined?fallback:raw;
};
A.performanceRawAttrs=function(a,student,field){
 return A.performanceDrafts.get(a.id)?.rows[student]?.[field]===undefined?'':' aria-invalid="true" aria-describedby="error"';
};
A.captureDraftInput=function(el){
 const d=A.currentPerformanceDraft();
 if(!d||d.record.id!==el.dataset.assessment)return;
 const {student,entry}=el.dataset;
 d.rows[student] ||= {};
 d.rows[student][entry]=el.value;
 protectParticipant(d,student);
 persist(d);
 updateState(d);
};
function protectParticipant(d,student){
 const checkbox=A.$('#draft-participant-'+student);
 if(!checkbox)return;
 const hint=A.$('#draft-participantProtection');
 const blocked=Object.hasOwn(A.assessmentById(d.record.id).results,student)||Object.values(d.rows[student]||{}).some(Boolean);
 checkbox.disabled=blocked;
 if(blocked){checkbox.checked=true;checkbox.setAttribute('aria-describedby',hint.id);}
 else checkbox.removeAttribute('aria-describedby');
 hint.hidden=!A.$('#draft-participants').querySelector('[name=participant]:disabled');
 refreshParticipantCount?.();
}
A.saveAssessmentResult=function(a,student,result,changed,field){
 const d=A.performanceDrafts.get(a.id);
 const current=A.data.assessments.find(x=>x.id===a.id);
 if(changed){
  if(current)A.mutate(data=>{data.assessments.find(x=>x.id===a.id).results[student]=result;},{refresh:false});
  else if(d)d.record.results[student]=result;
  else throw Error('Diese Leistung ist nicht mehr vorhanden.');
 }
 if(!d)return;
 if(d.rows[student]){
  delete d.rows[student][field];
  if(['points','grade'].includes(field))delete d.rows[student].status;
  if(!Object.keys(d.rows[student]).length)delete d.rows[student];
 }
 protectParticipant(d,student);
 if(changed||d.touched){persist(d);d.headPending=!applyDraft(d);updateState(d);}
};
A.saveDraftPointFields=function(a,root){
 const d=A.performanceDrafts.get(a.id);if(!d)return;
 d.pointFields=Object.fromEntries([...root.querySelectorAll('input,select')].map(e=>[e.id,e.value]));
 persist(d);updateState(d);
};
A.clearDraftPointFields=function(){
 const d=A.currentPerformanceDraft();if(!d?.pointFields)return;
 delete d.pointFields;persist(d);
};
A.restoreDraftPointFields=function(a,root){
 const fields=A.performanceDrafts.get(a.id)?.pointFields;
 if(fields)for(const el of root.querySelectorAll('input,select'))if(typeof fields[el.id]==='string')el.value=fields[el.id];
 return !!fields;
};
A.applyDraftPointChange=function(a,next){
 const d=A.performanceDrafts.get(a.id);
 if(!d)return false;
 delete d.pointFields;
 if(!A.data.assessments.some(x=>x.id===a.id))d.record=next;
 persist(d);
 return !A.data.assessments.some(x=>x.id===a.id);
};
A.closeAssessmentDraft=function(){
 const d=A.currentPerformanceDraft();if(!d)return;
 if(!d.touched)A.performanceDrafts.delete(d.record.id);
 A.flushAssessmentDrafts();
 if(!A.data.assessments.some(a=>a.id===d.record.id)||d.headPending||d.pointFields||Object.keys(d.rows).length)return;
 const id=d.record.id;
 // Keep recovery state until the grading record can be re-opened from disk.
 const store=A.store,dataId=A.data.id;
 (async()=>{
  if(store)await A.save();
  else if(A.mode!=='demo')await window.NRSession.load();
  else await Promise.resolve();
  if(A.store!==store||A.data.id!==dataId||A.performanceDrafts.get(id)!==d||A.currentPerformanceDraft()===d||
   d.headPending||d.pointFields||Object.keys(d.rows).length||
   (store?A.dirty:A.sessionFailed)||!A.data.assessments.some(a=>a.id===id))return;
  A.performanceDrafts.delete(id);
  A.remember();
 })().catch(()=>{});
};
A.discardAssessmentDraft=function(){
 const d=A.currentPerformanceDraft();
 if(!d||A.data.assessments.some(x=>x.id===d.record.id))return;
 A.confirm('Entwurf verwerfen?','Die Eingaben in diesem Entwurf werden entfernt.',()=>{
  A.pending.clear();
  d.touched=false;
  A.returnToAssessmentList();
  A.remember();
 },'Verwerfen',{helpContext:'noten-entwurf-fortsetzen'});
};
A.finishPerformanceDraft=async function(){
 const d=A.currentPerformanceDraft();
 if(!d)return false;
 if(A.entryFinishing)return true;
 if(d.pointFields){A.error('Bitte übernimm die geänderten Notenschlüsseleinstellungen oder wähle Abbrechen.');A.$('#pointApply')?.focus();return true;}
 for(const [student,row] of Object.entries(d.rows)){
  const field=Object.keys(row)[0];
  if(!field)continue;
  const kind=d.record.kind,w=A.W();w.entrySearch='';
  const tab=A.$('#entry-tab-'+kind+'-table');
  A.groups['entry-'+kind].activate(tab,false,false);
  A.renderEntry(kind,'table');
  A.error('Bitte korrigiere zuerst die markierte Eingabe.');
  const input=A.$('#'+ROW_FIELDS[field]+'-'+kind+'-table-'+student);
  (input||A.$('#assessmentWorkTitle'))?.focus();
  return true;
 }
 syncHead(d);
 persist(d);
 if(!applyDraft(d,{finish:true,show:true}))return true;
 A.entryFinishing=true;
 const panel=A.$('#assessmentWorkspace')||A.$('#hiddenAssessmentWorkspace');
 if(panel)panel.inert=true;
 const button=A.$('[data-action=assessment-done]');
 if(button)button.disabled=true;
 let finished=false;
 try{
  await A.save();
  if(A.store&&A.dirty)throw Error('Die Leistung konnte noch nicht vollständig gespeichert werden. Bitte versuche es erneut.');
  if(!A.store&&A.mode!=='demo')await window.NRSession.load();
  if(A.sessionFailed&&A.mode!=='demo')throw Error('Die Leistung konnte noch nicht vollständig gespeichert werden. Bitte versuche es erneut.');
  A.performanceDrafts.delete(d.record.id);
  A.remember();
  await A.flushAssessmentDrafts();
  A.error();
  finished=true;
 }finally{
  A.entryFinishing=false;
  if(panel?.isConnected)panel.inert=false;
  if(button?.isConnected){button.disabled=false;if(!finished)button.focus();}
 }
 return false;
};
})(globalThis.Notenblick);
