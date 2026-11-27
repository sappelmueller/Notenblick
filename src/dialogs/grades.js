/* Notenblick – dialogs/grades.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
// One named checkbox in the browse tree; the visual name never becomes a second text row.
Notenblick.participantMarkup=function(a,c,{prefix='a',open=false,inline=false}={}){
 const A=Notenblick,protectedIds=new Set(Object.keys(a?.results||{})),ids=new Set([...A.N.activeStudents(A.data,c,true).map(s=>s.id),...(a?.participantIds||[]),...protectedIds]),list=A.N.sorted([...ids].map(id=>A.getStudent(id)).filter(Boolean),'last','asc');
 const id=name=>prefix==='a'&&name!=='participants'&&name.startsWith('participant')?name:prefix+'-'+name;
 const container=inline?'div':'details',selected=a?.participantIds?'selected':'class';
 return `<${container} id="${id('participation')}" class="participation-options"${!inline&&open?' open':''}>
  ${inline?'':'<summary>Teilnehmer auswählen</summary>'}
  <div class="field"><label for="${id('scope')}">${inline?'Teilnahme':'Wer nimmt teil?'}</label><select id="${id('scope')}">${A.opt('class','Ganze Klasse',selected)}${A.opt('selected','Nur ausgewählte Schüler',selected)}</select></div>
  <div id="${id('participants')}"${a?.participantIds?'':' hidden'}><p id="${id('participantHint')}">Wähle die Schüler aus, die an dieser Leistung teilnehmen.</p><div class="field"><label for="${id('participantSearch')}">Schüler suchen</label><input id="${id('participantSearch')}" type="search" autocomplete="off"></div><p id="${id('participantCount')}"></p><div class="button-row"><button type="button" class="button small" id="${id('participantAll')}">Alle auswählen</button><button type="button" class="button small" id="${id('participantNone')}">Auswahl aufheben</button></div><p class="hint" id="${id('participantProtection')}"${protectedIds.size?'':' hidden'}>Schüler mit Einträgen bleiben ausgewählt. Ihre Auswahl ist gesperrt.</p><div class="participant-list" role="group" aria-label="Teilnehmende Schüler" aria-describedby="${id('participantHint')}">${list.map(s=>`<label class="check" for="${id('participant-'+s.id)}" data-participant-row="${s.id}"><input id="${id('participant-'+s.id)}" type="checkbox" name="participant" aria-label="${A.esc(A.studentName(s))}" value="${s.id}"${a?.participantIds?.includes(s.id)||protectedIds.has(s.id)?' checked':''}${protectedIds.has(s.id)?' disabled aria-describedby="'+id('participantProtection')+'"':''}><span aria-hidden="true">${A.esc(A.studentName(s))}</span></label>`).join('')}</div><p class="hint" id="${id('participantNoMatches')}" hidden>Keine passenden Schüler.</p></div>
 </${container}>`;
};
Notenblick.bindParticipants=function({prefix='a',onChange=()=>{}}={}){
 const A=Notenblick,id=name=>prefix==='a'&&name!=='participants'&&name.startsWith('participant')?name:prefix+'-'+name;
 const by=name=>A.$('#'+id(name)),inputs=[...by('participants').querySelectorAll('[name=participant]')];
 const update=()=>{by('participantCount').textContent=inputs.filter(e=>e.checked).length+' von '+inputs.length+(inputs.length===1?' Schüler':' Schülern')+' ausgewählt';};
 const changed=()=>{update();onChange();};
 by('scope').addEventListener('change',()=>{by('participants').hidden=by('scope').value!=='selected';changed();});
 by('participantSearch').addEventListener('input',e=>{let visible=0;for(const input of inputs){const row=input.closest('[data-participant-row]');row.hidden=!A.matchesStudent(A.getStudent(input.value),e.target.value.toLocaleLowerCase('de'));if(!row.hidden)visible++;}by('participantNoMatches').hidden=visible>0;});
 for(const input of inputs)input.addEventListener('change',changed);
 for(const [name,checked]of [['participantAll',true],['participantNone',false]])by(name).addEventListener('click',()=>{for(const input of inputs)if(!input.disabled)input.checked=checked;changed();});
 update();
 return update;
};
Notenblick.performanceWeight=function(raw){
 const value=raw.trim().replace(',','.'),q=Notenblick.N.Q.from(value);
 if(q.cmp(0)<=0n||q.cmp(100)>0n)throw Error('Die Gewichtung muss größer als 0 und höchstens 100 sein.');
 return value;
};
Notenblick.readPerformanceWeight=function(id){
 const A=Notenblick,el=A.$('#'+id);
 try{const value=A.performanceWeight(el.value);el.removeAttribute('aria-invalid');return value;}
 catch(e){el.setAttribute('aria-invalid','true');A.focusTarget(el);throw e;}
};
const A=Notenblick;
const assessmentHelp='noten-eine-leistung-nachtraglich-andern-oder-loschen';
const editorValues=new WeakMap();
const formValues=root=>JSON.stringify([...root.querySelectorAll('input,select')].map(el=>el.type==='checkbox'?el.checked:el.value));
const cancelButton=()=>A.$('#dialog .dialog-actions [data-action=close]');

function editableAssessment(data,id){
 const item=data.assessments.find(a=>a.id===id),course=data.courses.find(c=>c.id===item?.courseId);
 if(!item||!course)throw Error('Diese Leistung ist nicht mehr vorhanden.');
 A.ensureEdit(course);
 return {item,course};
}

function checkAssessmentDraft(id){
 const draft=A.performanceDrafts.get(id);
 if(draft&&(A.currentPerformanceDraft()===draft||draft.headPending||draft.pointFields||Object.values(draft.rows).some(row=>Object.keys(row).length)))
  throw Error('Zu dieser Leistung gibt es noch einen Entwurf. Öffne ihn und wähle „Fertig“, bevor du die Leistung verschiebst oder löschst.');
}

function assessmentDialogOrigin(item,trigger){
 const editor=A.$('#assessmentProperties');
 const oral=A.$('#oralEditFields');
 if(!A.$('#dialog').open){A.focusTarget(trigger,{preventScroll:true});return null;}
 if(editor){
  if(editor.dataset.assessment!==item.id||editorValues.get(editor)!==formValues(editor))
   throw Error('Speichere zuerst deine Änderungen an der Leistung oder brich die Bearbeitung ab.');
  return ()=>A.assessmentDialog(item,undefined,{reuse:true,focus:trigger?.id});
 }
 if(oral&&A.oralDraft?.id===item.id){
  if(!oral.hidden)throw Error('Wähle zuerst „Fertig“, um deine Änderungen an der Einzelnote zu speichern.');
  return ()=>A.quickOral(item.participantIds[0],item,false,{reuse:true,focus:trigger?.id});
 }
 throw Error('Schließe zuerst den geöffneten Dialog.');
}

async function saveAssessmentChange(item,expected,change,wasApplied){
 checkAssessmentDraft(item.id);
 const draft=A.performanceDrafts.get(item.id);
 if(draft){
  A.performanceDrafts.delete(item.id);
  // Remove a finished draft from the saved workspace before deleting its record.
  // On restart a saved draft without a record would look like a new assessment.
  A.remember();
  await A.workspacePromise;
  if(A.workspaceFailed){
   A.performanceDrafts.set(item.id,draft);
   throw Error('Die letzte Ansicht konnte nicht gespeichert werden. Versuche es erneut.');
  }
 }
 const before=A.data;
 let prepared=false;
 try{
  await A.commitDraft(data=>{
   const current=editableAssessment(data,item.id);
   if(JSON.stringify(current.item)!==expected)throw Error('Die Leistung wurde inzwischen geändert. Öffne den Dialog erneut.');
   checkAssessmentDraft(item.id);
   change(data,current.item,current.course);
   prepared=true;
  });
  return false;
 }catch(error){
  if(prepared&&A.data!==before&&A.textPending&&A.jsonSavedSeq===A.seq&&wasApplied(A.data))return true;
  throw error;
 }
}

function assessmentChangeDialog({item,trigger,title,content,label,danger=false,select,change,wasApplied,after,done}){
 const origin=assessmentDialogOrigin(item,trigger);
 const expected=JSON.stringify(item);
 let committed=false;
 A.modal(title,content,async()=>{
  if(committed){if(A.textPending)await A.refreshTextLists(true);return;}
  const value=select?A.val(select):null;
  if(select&&!value)return {keepOpen:true,focus:select,disableSubmit:true};
  const txtPending=await saveAssessmentChange(item,expected,(data,saved,course)=>change(data,saved,course,value),data=>wasApplied(data,value));
  committed=true;
  A.afterClose=()=>{
   after(value);
   A.announce(done);
  };
  if(!txtPending)return;
  if(select)A.$('#'+select).disabled=true;
  A.$('#dialogTitle').textContent='Notenlisten aktualisieren';
  A.$('#dialogSave').textContent='Notenlisten aktualisieren';
  A.$('#dialogSave').classList.remove('danger');
  A.$('#dialogSave').classList.add('primary');
  cancelButton().textContent='Schließen';
  const message=done+' Die automatischen Notenlisten konnten noch nicht aktualisiert werden.';
  const error=A.$('#dialogError');error.textContent=message;error.hidden=false;
  A.error(message+' Du kannst die Notenlisten auch unter „Sicherung → Speicherstatus“ prüfen.','storage');
  return {keepOpen:true,focus:'dialogSave'};
 },label,{size:'small',helpContext:assessmentHelp,fitViewport:true,danger,focus:danger?cancelButton():'dialogTitle',describedBy:danger?'assessmentDeleteImpact':null,reuse:!!origin,
  beforeClose:()=>{if(committed||!origin)return true;origin();return false;}});
}

Notenblick.assessmentMoveOptions=function(item,course=A.data.courses.find(c=>c.id===item.courseId)){
 return course?A.N.areas(course).filter(area=>area.id!==item.kind):[];
};

Notenblick.openAssessmentMove=function(id,trigger){
 const {item,course}=editableAssessment(A.data,id);
 checkAssessmentDraft(id);
 const areas=A.assessmentMoveOptions(item,course);
 if(!areas.length)throw Error('In diesem Fach gibt es noch keinen anderen Leistungsbereich.');
 const current=A.N.areaLabel(course,item.kind), select='assessmentMoveTarget';
 const content=`<p class="dialog-intro"><strong>${A.esc(item.title)}</strong> · <time datetime="${A.esc(item.date)}">${A.date(item.date)}</time></p>
  <p>Aktueller Leistungsbereich <strong>${A.esc(current)}</strong></p>
  <div class="field"><label for="${select}">Neuer Leistungsbereich</label><select id="${select}" aria-describedby="assessmentMoveImpact" required>${A.opt('','Bitte auswählen','')}${areas.map(area=>A.opt(area.id,area.name,'')).join('')}</select></div>
  <p id="assessmentMovePreview" role="status" class="hint"></p><p id="assessmentMoveImpact" class="hint">Deine Einträge bleiben erhalten. Durch das Verschieben können sich Durchschnitte und Vorschläge für Abschlussnoten ändern.</p>`;
 assessmentChangeDialog({item,trigger,title:'Leistung verschieben',content,label:'Verschieben',select,done:'Die Leistung wurde verschoben.',
  change:(data,saved,liveCourse,value)=>{
   if(value===saved.kind||!A.N.areaIds(liveCourse).includes(value))throw Error('Wähle einen anderen Leistungsbereich in diesem Fach.');
   if(value===A.N.oralArea(liveCourse)&&!saved.oralEntry)saved.oralEntry='class';
   A.N.assignAssessmentArea(saved,liveCourse,value);
  },wasApplied:(data,value)=>data.assessments.some(a=>a.id===id&&a.kind===value),
  after:value=>A.openAssessmentInMovedArea?.(id,value)});
 const field=A.$('#'+select),update=()=>{
  const target=areas.find(area=>area.id===field.value);
  A.$('#dialogSave').disabled=!target;
  A.$('#assessmentMovePreview').textContent=target?'Von „'+current+'“ nach „'+target.name+'“.'+
   (A.N.areaWeight(course,target.id).cmp(0)===0n?' Dieser Bereich ist mit 0 % gewichtet. Die Leistung zählt dort nicht zur Gesamtnote.':''):'';
 };
 field.addEventListener('change',update);update();
};

Notenblick.openAssessmentDelete=function(id,trigger){
 const {item,course}=editableAssessment(A.data,id);
 checkAssessmentDraft(id);
 const opener=A.$('#dialog').open?A.opener?.element:trigger;
 const restoreFocus=A.assessmentMenuFallback?.(id,opener?.isConnected?opener:undefined);
 const individual=A.N.isOralIndividual(item),student=individual?A.getStudent(item.participantIds[0]):null;
 const content=`<p class="dialog-intro">${student?A.esc(A.studentName(student))+' · ':''}<time datetime="${A.esc(item.date)}">${A.date(item.date)}</time></p>
  <p id="assessmentDeleteImpact">Möchtest du <strong>„${A.esc(item.title)}“</strong> aus dem Bereich <strong>„${A.esc(A.N.areaLabel(course,item.kind))}“</strong> löschen? Die dazugehörigen Noten, Punkte und Bemerkungen werden ebenfalls gelöscht. Dadurch können sich Durchschnitte ändern.</p>
  <p class="hint">Solange Notenblick geöffnet bleibt, kannst du unter „Sicherung → Wiederherstellen“ die letzte Änderung rückgängig machen.</p>`;
 assessmentChangeDialog({item,trigger,title:individual?'Einzelnote löschen':'Leistung löschen',content,label:'Leistung löschen',danger:true,done:individual?'Die Einzelnote wurde gelöscht.':'Die Leistung wurde gelöscht.',
  change:data=>{data.assessments=data.assessments.filter(a=>a.id!==id);},wasApplied:data=>!data.assessments.some(a=>a.id===id),
  after:()=>{
   const w=A.ui.workspaces[course.id];
   if(w){
    if(w.selected?.[item.kind]===id)delete w.selected[item.kind];
    if(w.assessmentId===id){w.assessmentId='';w.assessmentWorkOpen=false;}
    if(w.oralFocusId===id)w.oralFocusId='';
   }
   if(A.entrySession?.id===id)A.entrySession=null;
   A.remember();
   restoreFocus?.();
  }});
};

Notenblick.assessmentDialog=function(a=null,kind='exam',options={}){
 const A=Notenblick;
 if(!a)return A.openPerformanceDraft(kind);
 const {course:c}=editableAssessment(A.data,a.id);
 const draft=A.performanceDrafts.get(a.id);
 if(draft&&(draft.headPending||draft.pointFields||Object.keys(draft.rows).length)){A.resumePerformanceDraft(a.id,document.activeElement);return;}
 const moveButton=A.assessmentMoveOptions(a,c).length?A.b('move-assessment','Leistungsbereich ändern',`id="a-change-area" data-id="${a.id}"`,'text-button'):'';
 A.modal('Leistung bearbeiten – '+a.title,`<div id="assessmentProperties" data-assessment="${a.id}"><div class="form-grid">${A.field('a-title','Bezeichnung',a.title,'required maxlength="150"')}${A.field('a-date','Datum',a.date,'required','date')}<div class="field"><p>Leistungsbereich <strong>${A.esc(A.N.areaLabel(c,a.kind))}</strong></p>${moveButton}</div>${A.field('a-weight','Gewichtung der Leistung',a.weight,'required inputmode="decimal"','text','1 = einfach, 2 = doppelt. Bestimmt, wie stark diese Leistung zählt.')}<label class="check full"><input type="checkbox" id="a-gfs"${a.isGfs?' checked':''}>Als GFS kennzeichnen</label></div>${A.participantMarkup(a,c)}<p>${A.b('delete-assessment','Löschen',`id="a-delete-assessment" data-id="${a.id}"`,'text-button danger')}</p></div>`,()=>{
  const title=A.required('a-title','eine Bezeichnung'),date=A.required('a-date','ein Datum'),kind=a.kind,weight=A.readPerformanceWeight('a-weight');
  const participantIds=A.val('a-scope')==='selected'?[...A.$('#a-participants').querySelectorAll('[name=participant]:checked')].map(x=>x.value):null;
  if(participantIds&&(!participantIds.length||Object.keys(a.results||{}).some(id=>!participantIds.includes(id)))){A.$('#a-participation').open=true;A.focusTarget('participantSearch');throw Error('Wähle mindestens einen Schüler. Gespeicherte Einträge bleiben beteiligt.');}
  const isGfs=A.$('#a-gfs').checked,period=A.assessmentPeriod(c,date,a);
  A.mutate(d=>{
   const saved=d.assessments.find(x=>x.id===a.id);
   Object.assign(saved,{title,date,period,weight,isGfs});
   if(participantIds)saved.participantIds=participantIds;else delete saved.participantIds;
   const w=A.W();
   if(kind==='oral')w.oralView='classes';
   w.assessmentWorkOpen=true;w.selected[kind]=a.id;w.view=A.assessmentView(kind);w.assessmentId=a.id;w.assessmentFilter=kind==='oral'?'oral':'all';
  },{refresh:false});
  A.rendered={};
  A.renderNotes();
  A.remember();
  A.afterClose=()=>A.focusTarget('assessmentWorkTitle');
 },'Speichern',options);
 A.bindParticipants();
 const editor=A.$('#assessmentProperties');editorValues.set(editor,formValues(editor));
};
Notenblick.quickOral=function(id,record=null,editing=false,options={}){
 const A=Notenblick;if(!record)A.ensureEdit();if(record&&(record.courseId!==A.ui.course||!A.data.assessments.some(a=>a.id===record.id)))throw Error('Diese Einzelnote ist nicht mehr vorhanden.');const readonly=!!record&&A.readonly();editing=!record||editing&&!readonly;if(record&&!A.N.isOralIndividual(record))throw Error('Bitte die vorhandene Leistung über die Klassenansicht bearbeiten.');const list=A.entryList();if(id&&!list.some(s=>s.id===id)){const s=A.getStudent(id);if(s)list.push(s);}if(!list.length)throw Error('Bitte füge zuerst Schüler hinzu.');
 if(A.$('#dialog').open&&!options.reuse)A.closeModal();const selected=record?.participantIds[0]||(list.some(s=>s.id===id)?id:list[0].id),c=A.getCourse(),old=record?.results[selected]||{grade:null,status:'open',note:''};
 const entryKind=record?.kind||options.kind||A.N.oralArea(c),entryLabel=A.kindLabel(entryKind,c);const scoring=record||{kind:entryKind,courseId:c.id,inputMode:'direct',results:{}};
 A.modal(record?record.title:(entryKind===A.N.oralArea(c)?'Mündliche Einzelnote':'Einzelnote – '+entryLabel),`${record?`<div id="oralResultView"><p>${A.date(record.date)} · ${A.esc(c.name)} · Klasse ${A.esc(A.getClass().name)}</p>${A.N.isPoints(record)?'<p class="point-summary">'+A.esc(A.N.pointKeySummary(record.pointKey))+'</p><button type="button" class="text-button" id="oralReadKey">Notenschlüssel anzeigen</button>':''}${A.assessmentResultsMarkup(record).replace('aria-labelledby="assessmentWorkTitle"','aria-labelledby="dialogTitle"')}</div>${readonly?'':'<button type="button" id="oralEditButton" class="button primary">Noten bearbeiten</button>'}`:''}<div id="oralEditFields"${editing?'':' hidden'}>${readonly?'<p class="notice">Nur anzeigen. Öffne das Schuljahr, die Klasse oder das Fach zuerst wieder, um die Note zu ändern.</p>':''}<div class="form-grid"><div class="field full"><label for="oralStudent">Schüler</label><select id="oralStudent"${record?' disabled':''}>${list.map(s=>A.opt(s.id,A.studentName(s),selected)).join('')}</select></div><div class="full"><button type="button" class="text-button" id="oralKeyEdit">${A.N.isPoints(scoring)?'Notenschlüssel ändern':'Eingabeart ändern'}</button><div id="oralKeyConfiguration" hidden>${A.pointSettingsMarkup(scoring,'oralKey',false)}<button type="button" class="button" id="oralKeyApply">Einstellungen übernehmen</button><button type="button" class="text-button" id="oralKeyCancel">Abbrechen</button></div></div><div id="q-directField"${A.N.isPoints(scoring)?' hidden':''}>${A.field('q-grade','Note',old.grade?.replace('.',',')||'','inputmode="decimal"')}</div><div id="q-pointField"${A.N.isPoints(scoring)?'':' hidden'}><p id="q-keySummary" class="point-summary"></p><div class="button-row"><button type="button" class="text-button" id="q-keyShow">Notenschlüssel anzeigen</button><button type="button" class="text-button" id="q-keyPdf">Notenschlüssel als PDF speichern</button></div>${A.field('q-points','Erreichte Punkte',old.points?.replace('.',',')??'','inputmode="decimal"')}<p id="q-calculated"></p><p id="q-effective"></p><button type="button" class="text-button" id="q-change">Note anpassen</button><div id="q-manualField" hidden>${A.field('q-manual','Festgelegt',old.manualGrade?.replace('.',',')||'','inputmode="decimal"')}<button type="button" class="text-button" id="q-reset">Berechnete Note übernehmen</button></div></div>${A.field('q-weight','Gewichtung der Leistung',record?.weight||'1','inputmode="decimal"','text','1 = einfach, 2 = doppelt. Bestimmt, wie stark diese Leistung zählt.')}${record?'':`<div class="field" id="q-pointStatusField"><label for="q-pointStatus">Status</label><select id="q-pointStatus">${Object.entries(A.N.STATUS).map(([k,l])=>A.opt(k,l,'graded')).join('')}</select></div>`}${A.field('q-date','Datum',record?.date||A.today(),'required','date')}<div class="full">${A.field('q-title','Bezeichnung',record?.title||(entryKind===A.N.oralArea(c)?'Mündliche Note':'Einzelnote'),'required maxlength="150"')}</div>${record?`<div class="field"><label for="q-status">Status</label><select id="q-status">${Object.entries(A.N.STATUS).map(([k,l])=>A.opt(k,l,old.status)).join('')}</select></div><label class="check full"><input type="checkbox" id="q-gfs"${record.isGfs?' checked':''}>Als GFS kennzeichnen</label>`:''}<div class="full field"><label for="q-note">Bemerkung (optional)</label><textarea id="q-note" maxlength="2000">${A.esc(old.note)}</textarea></div></div></div>${record?A.b('oral-record-export','Leistung exportieren',`data-id="${record.id}"`,'button'):''}`,readonly?null:async next=>{
  const draft=A.oralDraft;let committedNow=false;if(!draft)throw Error('Bitte öffne die Noteneingabe erneut.');
  if(!draft.committed){const sid=record?selected:A.val('oralStudent'),raw=A.val('q-grade'),date=A.required('q-date','ein Datum'),title=A.required('q-title','eine Bezeichnung'),note=A.val('q-note'),settings=A.readPointSettings('oralKey'),points=settings.mode==='points',status=record?A.val('q-status'):A.val('q-pointStatus'),weight=A.readPerformanceWeight('q-weight');
   const base=A.data.assessments.find(a=>a.id===draft.id)||scoring,impact=A.N.pointKeyImpact(base,settings.mode,settings.key);
   if(impact.invalid.length){A.$('#oralKeyMaximum').focus();throw Error('Gespeicherte Punkte liegen über dem neuen Maximum. Bitte erhöhe das Maximum.');}
   let result=impact.assessment.results[sid]||{grade:null,status:'open',note:''};
   if(points){
    if(draft.manualEdited)result.manualGrade=A.readGrade('q-manual');
    const entered=A.val('q-points');if(!record&&raw){result.directGrade=A.readGrade('q-grade');result.directStatus='graded';if(!entered&&result.manualGrade==null)result.manualGrade=result.directGrade;}
    const pointStatus=!entered&&status==='graded'&&result.manualGrade==null?'open':status;
    try{result=A.N.pointResult(impact.assessment,result,entered,{status:pointStatus});}catch(e){A.$('#q-points').setAttribute('aria-invalid','true');A.$('#q-points').focus();throw e;}
   }else{const grade=A.readGrade('q-grade');result={...result,grade,status};}
   result.note=note;
   if(result.status==='graded'&&result.grade===null){const field=A.$(points?'#q-points':'#q-grade');field.setAttribute('aria-invalid','true');field.focus();throw Error(points?'Bitte Punkte eingeben oder einen anderen Status wählen.':'Bitte eine Note eingeben oder einen anderen Status wählen.');}if(result.status!=='graded'&&result.grade!==null){const field=A.$(record?'#q-status':'#q-pointStatus');field.setAttribute('aria-invalid','true');field.focus();throw Error('Bitte die Note entfernen oder den Status „Bewertet“ wählen.');}
   const changedSettings=Object.keys(base.results).length&&(settings.mode!==(base.inputMode||'direct')||settings.key&&JSON.stringify(settings.key)!==JSON.stringify(base.pointKey));
   if(changedSettings&&impact.occupied&&!draft.keyConfirmed){A.confirmInDialog('Notenschlüssel ändern',A.pointImpactText(impact,base,settings.mode),async()=>{draft.keyConfirmed=true;await A.submitDialog(next);if(A.$('#dialog').open&&draft.committed&&(!next&&!record||next==='close'||next==='export'))A.closeModal({submitted:true});},'Änderungen übernehmen','Abbrechen',23);return {keepOpen:true};}
   const period=A.assessmentPeriod(c,date,record);
   A.mutate(d=>{A.ensureEdit(d.courses.find(x=>x.id===c.id));if(record){const a=d.assessments.find(a=>a.id===record.id);if(!a||!A.N.isOralIndividual(a))throw Error('Diese Einzelnote ist nicht mehr vorhanden.');Object.assign(a,impact.assessment,{title,date,period,weight,isGfs:A.$('#q-gfs').checked});if(points)a.pointKeyUsedAt=new Date().toISOString();a.results[sid]=result;}else{const existing=d.assessments.find(a=>a.id===draft.id);if(existing&&!draft.editExisting)throw Error('Diese Note wurde bereits erfasst.');const saved={id:draft.id,courseId:c.id,period,kind:entryKind,oralEntry:'individual',title,date,weight,isGfs:false,participantIds:[sid],inputMode:settings.mode,...(settings.key?{pointKey:settings.key,pointKeyUsedAt:new Date().toISOString()}:{}),results:{[sid]:result}};if(existing)Object.assign(existing,saved);else d.assessments.push(saved);}A.W().oralFocusId=draft.id;});committedNow=true;draft.committed=true;draft.student=sid;draft.result=result;draft.scoring=impact.assessment;
  }
  A.remember();await A.save();if(A.store&&A.dirty){for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.disabled=true;throw Error('Die Note ist erfasst, aber noch nicht vollständig gespeichert. Bitte behebe den Speicherfehler und wähle erneut Speichern.');}
  if(committedNow&&A.N.isPoints(draft.scoring))A.announcePoints(draft.scoring,draft.result);
  if(next==='stay')return {keepOpen:true};
  if(next==='close'||next==='export')return;
  if(next&&record){const rows=A.selectOralRows(A.data,c,A.W(),A.prefs,entryKind),at=rows.findIndex(x=>x.a.id===record.id),following=rows[at+(next==='previous'?-1:1)];if(following){A.closeModal({submitted:true});A.quickOral(following.s.id,A.data.assessments.find(a=>a.id===following.a.id),true,{focus:A.N.isPoints(draft.scoring)?'q-points':'q-grade'});return {keepOpen:true};}return {keepOpen:true,focus:'q-points'};}
  if(record&&!next){const saved=A.data.assessments.find(a=>a.id===record.id);A.quickOral(selected,saved,false,{reuse:true,focus:'oralEditButton'});return {keepOpen:true};}
  if(!next)return;const at=list.findIndex(s=>s.id===draft.student),following=list[at+(next==='previous'?-1:1)];if(!following){return {keepOpen:true,focus:A.N.isPoints(draft.scoring)?'q-points':'q-grade'};}
  A.oralDraft={id:A.N.id(),committed:false};A.$('#oralStudent').value=following.id;A.$('#q-grade').value='';A.$('#q-points').value='';A.$('#q-manual').value='';A.$('#q-manualField').hidden=true;A.$('#q-note').value='';for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.disabled=false;A.updateOralNext();A.updateOralPoints?.();A.$(A.val('oralKeyMode')==='points'?'#q-points':'#q-grade').focus();return {keepOpen:true};
 },'Speichern',{size:'small',reuse:options.reuse,focus:options.focus||'dialogTitle'});
 if(record){A.$('#dialogSave').hidden=!editing||readonly;A.$('#dialogSave').textContent='Fertig';A.$('#dialog .dialog-actions [data-action=close]').textContent='Schließen';A.$('#oralResultView').hidden=editing;const button=A.$('#oralEditButton');if(button){button.hidden=editing;button.addEventListener('click',()=>{A.$('#oralResultView').hidden=true;button.hidden=true;A.$('#oralEditFields').hidden=false;A.$('#dialogSave').hidden=false;A.$('#dialogTitle').textContent='Noten eingeben – '+record.title;A.focusTarget('dialogTitle');});}A.$('#oralReadKey')?.addEventListener('click',()=>A.showPointKey(A.data.assessments.find(a=>a.id===record.id)));}
 A.bindPointSettings(scoring,'oralKey',false);A.bindOralPoints(scoring,old,!!record);
 if(readonly){for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.disabled=true;A.$('#dialogTitle').tabIndex=-1;A.$('#dialogTitle').focus();return;}
 A.oralDraft={id:record?.id||A.N.id(),committed:false};A.oralList=list;A.$('#dialogNext').hidden=!!record;A.updateOralNext();A.$('#oralStudent').addEventListener('change',A.updateOralNext);
 const snapshot=()=>JSON.stringify([...A.$('#oralEditFields').querySelectorAll('input,select,textarea')].map(el=>[el.id,el.type==='checkbox'?el.checked:el.value]));const initial=snapshot();
 A.dialogBeforeClose=()=>{if(A.$('#oralEditFields').hidden||snapshot()===initial||A.oralDraft?.committed||!record&&!['q-grade','q-points','q-note','q-manual'].some(id=>A.val(id))&&A.val('q-title')===(entryKind===A.N.oralArea(c)?'Mündliche Note':'Einzelnote')&&A.val('q-date')===A.today())return true;if(record||A.data.assessments.some(a=>a.id===A.oralDraft?.id)){A.submitModal('close');return false;}A.confirmInDialog('Eingabe schließen','Die neue Einzelnote ist noch nicht vollständig übernommen. Möchtest du diese Eingabe verwerfen?',()=>A.closeModal({submitted:true}),'Verwerfen','Weiter bearbeiten');return false;};
 if(record&&!editing){if(!options.focus){A.$('#dialogTitle').tabIndex=-1;A.$('#dialogTitle').focus();}return;}A.focusTarget(options.focus||'dialogTitle');
};
Notenblick.updateOralNext=function(){if(!Notenblick.oralDraft)return;const at=Notenblick.oralList.findIndex(s=>s.id===Notenblick.val('oralStudent'));Notenblick.$('#dialogNext').disabled=at<0||at>=Notenblick.oralList.length-1;};
})(globalThis.Notenblick = globalThis.Notenblick || {});
