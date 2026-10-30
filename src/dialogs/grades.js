/* Notenblick – dialogs/grades.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.assessmentDialog = function assessmentDialog(a = null, kind = 'exam', fixed = false) {
  Notenblick.ensureEdit();
  const c = Notenblick.getCourse();
  Notenblick.modal(a ? 'Angaben bearbeiten' : kind === 'exam' ? 'Klassenarbeit anlegen' : kind === 'test' ? 'Test anlegen' : kind === 'oral' ? 'Noten für Klasse erfassen' : 'Leistung anlegen', `<div class="form-grid">${Notenblick.field('a-title', 'Bezeichnung', a?.title || '', 'required maxlength="150"')}${Notenblick.field('a-date', 'Datum', a?.date || Notenblick.today(), 'required', 'date')}${fixed&&!a?`<input type="hidden" id="a-kind" value="${kind}">`:`<div class="field"><label for="a-kind">Leistungsart</label><select id="a-kind">${Notenblick.kinds.map(k => Notenblick.opt(k, Notenblick.N.KINDS[k], a?.kind || kind)).join('')}</select></div>`}${Notenblick.field('a-weight', 'Faktor', a?.weight || '1', 'required inputmode="decimal"', 'text', '1 = einfach, 2 = doppelt')}<label class="check full"><input type="checkbox" id="a-gfs"${a?.isGfs ? ' checked' : ''}>Als GFS kennzeichnen</label></div><details class="participation-options"><summary>Teilnahme</summary><div class="field"><label for="a-scope">Leistung für</label><select id="a-scope">${Notenblick.opt('class','Ganze Klasse',a?.participantIds?'selected':'class')}${Notenblick.opt('selected','Ausgewählte Schüler',a?.participantIds?'selected':'class')}</select></div><div class="check-list" id="a-participants"${a?.participantIds?'':' hidden'}>${Notenblick.sorted(Notenblick.N.activeStudents(Notenblick.data,c,true)).map(s=>`<label class="check"><input type="checkbox" name="participant" value="${s.id}"${a?.participantIds?.includes(s.id)||Object.hasOwn(a?.results||{},s.id)?' checked':''}>${Notenblick.rowName(s)}</label>`).join('')}</div><p class="hint">Schüler mit bereits gespeicherten Einträgen bleiben beteiligt.</p></details>${a ? `<p style="margin-top:20px">${Notenblick.b('delete-assessment', 'Löschen', `data-id="${a.id}"`, 'text-button danger')}</p>` : ''}`, () => {
    const title = Notenblick.required('a-title', 'eine Bezeichnung'),
      date = Notenblick.required('a-date', 'ein Datum'),
      kind = Notenblick.val('a-kind'),
      weight = Notenblick.val('a-weight').replace(',', '.');
    const q = Notenblick.N.Q.from(weight);
    if (q.cmp(0) <= 0n || q.cmp(100) > 0n) throw Error('Die Gewichtung muss größer als 0 und höchstens 100 sein.');
    const participantIds=Notenblick.val('a-scope')==='selected'?[...document.querySelectorAll('[name=participant]:checked')].map(x=>x.value):null;
    if(participantIds&&(!participantIds.length||Object.keys(a?.results||{}).some(id=>!participantIds.includes(id))))throw Error('Wähle mindestens einen Schüler. Bereits gespeicherte Einträge müssen beteiligt bleiben.');
    const isGfs = Notenblick.$('#a-gfs').checked, period=Notenblick.assessmentPeriod(c,date,a);
    if(!a){Notenblick.captureEntryOrigin();Notenblick.W().entrySearch='';}
    let newId = a?.id;
    Notenblick.mutate(d => {
      if (a) Object.assign(d.assessments.find(x => x.id === a.id), {
        title,
        date,
        period,
        kind,
        weight,
        isGfs
      });else {
        newId = Notenblick.N.id();
        d.assessments.push({
          id: newId,
          courseId: c.id,
          period,
          title,
          date,
          kind,
          weight,
          isGfs,
          results: {}
        });
      }
      const saved=d.assessments.find(x=>x.id===newId);if(kind==='oral'){if(!a||a.kind!=='oral'||a.oralEntry==='individual'&&(!participantIds||participantIds.length!==1))saved.oralEntry='class';}else delete saved.oralEntry;if(participantIds)saved.participantIds=participantIds;else delete saved.participantIds;
      if(kind==='oral')Notenblick.W().oralView='classes';
      if(!a){Notenblick.entrySession={id:newId,editing:true};Notenblick.W().entryMode='table';}
      Notenblick.W().assessmentWorkOpen=true;
      Notenblick.W().selected[kind] = newId;
      Notenblick.W().view = Notenblick.assessmentView(kind);
      Notenblick.W().assessmentId = newId;
      Notenblick.W().assessmentFilter = kind==='oral'?'oral':'all';
    }, {
      refresh: false
    });
    Notenblick.rendered = {};
    Notenblick.renderNotes();
    Notenblick.remember();
    if(!a)Notenblick.afterClose=()=>{const mode=Notenblick.W().entryMode; (Notenblick.$('#entry-'+kind+'-'+mode+' [data-entry=grade]')||Notenblick.$('#entry-tab-'+kind+'-'+mode))?.focus();};
  });
  Notenblick.$('#a-scope').addEventListener('change',()=>{Notenblick.$('#a-participants').hidden=Notenblick.val('a-scope')!=='selected';});
};
Notenblick.quickOral=function(id,record=null,editing=false){
 const A=Notenblick;if(!record)A.ensureEdit();if(record&&(record.courseId!==A.ui.course||!A.data.assessments.some(a=>a.id===record.id)))throw Error('Diese Einzelnote ist nicht mehr vorhanden.');const readonly=!!record&&A.readonly();editing=!record||editing&&!readonly;if(record&&!A.N.isOralIndividual(record))throw Error('Bitte die vorhandene Leistung über die Klassenansicht bearbeiten.');const list=A.entryList();if(id&&!list.some(s=>s.id===id)){const s=A.getStudent(id);if(s)list.push(s);}if(!list.length)throw Error('Bitte füge zuerst Schüler hinzu.');
 if(A.$('#dialog').open)A.closeModal();const selected=record?.participantIds[0]||(list.some(s=>s.id===id)?id:list[0].id),c=A.getCourse(),old=record?.results[selected]||{grade:null,status:'open',note:''};
 const scoring=record||{kind:'oral',courseId:c.id,inputMode:'direct',results:{}};
 A.modal(record?record.title:'Mündliche Note eintragen',`${record?`<div id="oralResultView"><p>${A.date(record.date)} · ${A.esc(c.name)} · Klasse ${A.esc(A.getClass().name)}</p>${A.N.isPoints(record)?'<p class="point-summary">'+A.esc(A.N.pointKeySummary(record.pointKey))+'</p><button type="button" class="text-button" id="oralReadKey">Notenschlüssel anzeigen</button>':''}${A.assessmentResultsMarkup(record).replace('aria-labelledby="assessmentWorkTitle"','aria-labelledby="dialogTitle"')}</div>${readonly?'':'<button type="button" id="oralEditButton" class="button primary">Noten bearbeiten</button>'}`:''}<div id="oralEditFields"${editing?'':' hidden'}>${readonly?'<p class="notice">Nur anzeigen. Öffne das Schuljahr, die Klasse oder das Fach zuerst wieder, um die Note zu ändern.</p>':''}<div class="form-grid"><div class="field full"><label for="oralStudent">Schüler</label><select id="oralStudent"${record?' disabled':''}>${list.map(s=>A.opt(s.id,A.studentName(s),selected)).join('')}</select></div><div class="full"><button type="button" class="text-button" id="oralKeyEdit">${A.N.isPoints(scoring)?'Notenschlüssel ändern':'Eingabeart ändern'}</button><div id="oralKeyConfiguration" hidden>${A.pointSettingsMarkup(scoring,'oralKey',false)}<button type="button" class="button" id="oralKeyApply">Einstellungen übernehmen</button><button type="button" class="text-button" id="oralKeyCancel">Abbrechen</button></div></div><div id="q-directField">${A.field('q-grade','Note',old.grade?.replace('.',',')||'','inputmode="decimal"')}</div><div id="q-pointField" hidden><p id="q-keySummary" class="point-summary"></p><div class="button-row"><button type="button" class="text-button" id="q-keyShow">Notenschlüssel anzeigen</button><button type="button" class="text-button" id="q-keyPdf">Notenschlüssel als PDF speichern</button></div>${A.field('q-points','Erreichte Punkte',old.points?.replace('.',',')??'','inputmode="decimal"')}<p id="q-calculated"></p><p id="q-effective"></p><button type="button" class="text-button" id="q-change">Ändern</button><div id="q-manualField" hidden>${A.field('q-manual','Festgelegt',old.manualGrade?.replace('.',',')||'','inputmode="decimal"')}<button type="button" class="text-button" id="q-reset">Berechnete Note übernehmen</button></div></div>${record?'':`<div class="field" id="q-pointStatusField" hidden><label for="q-pointStatus">Status</label><select id="q-pointStatus">${Object.entries(A.N.STATUS).map(([k,l])=>A.opt(k,l,'graded')).join('')}</select></div>`}${A.field('q-date','Datum',record?.date||A.today(),'required','date')}<div class="full">${A.field('q-title','Bezeichnung',record?.title||'Mündliche Note','required maxlength="150"')}</div>${record?`<div class="field"><label for="q-status">Status</label><select id="q-status">${Object.entries(A.N.STATUS).map(([k,l])=>A.opt(k,l,old.status)).join('')}</select></div>${A.field('q-weight','Faktor',record.weight,'inputmode="decimal"','text','1 = einfach, 2 = doppelt')}<label class="check full"><input type="checkbox" id="q-gfs"${record.isGfs?' checked':''}>Als GFS kennzeichnen</label>`:''}<div class="full field"><label for="q-note">Bemerkung (optional)</label><textarea id="q-note" maxlength="2000">${A.esc(old.note)}</textarea></div></div></div>${record?A.b('oral-record-export','Leistung exportieren',`data-id="${record.id}"`,'button'):''}`,readonly?null:async next=>{
  const draft=A.oralDraft;let committedNow=false;if(!draft)throw Error('Bitte öffne die Noteneingabe erneut.');
  if(!draft.committed){const sid=record?selected:A.val('oralStudent'),raw=A.val('q-grade'),date=A.required('q-date','ein Datum'),title=A.required('q-title','eine Bezeichnung'),note=A.val('q-note'),settings=A.readPointSettings('oralKey'),points=settings.mode==='points',status=record?A.val('q-status'):points?A.val('q-pointStatus'):'graded',weight=record?A.val('q-weight').replace(',','.'):'1';
   const impact=A.N.pointKeyImpact(scoring,settings.mode,settings.key);
   if(impact.invalid.length){A.$('#oralKeyMaximum').focus();throw Error('Gespeicherte Punkte liegen über dem neuen Maximum. Bitte erhöhe das Maximum.');}
   let result=impact.assessment.results[sid]||{grade:null,status:'open',note:''};
   if(points){
    if(draft.manualEdited)result.manualGrade=A.val('q-manual')?A.N.grade(A.val('q-manual')):null;
    const entered=A.val('q-points');if(!record&&raw){result.directGrade=A.N.grade(raw);result.directStatus='graded';if(!entered&&result.manualGrade==null)result.manualGrade=result.directGrade;}
    const pointStatus=!entered&&status==='graded'&&result.manualGrade==null?'open':status;
    try{result=A.N.pointResult(impact.assessment,result,entered,{status:pointStatus});}catch(e){A.$('#q-points').setAttribute('aria-invalid','true');A.$('#q-points').focus();throw e;}
   }else{const grade=raw?A.N.grade(raw):null;result={...result,grade,status};}
   result.note=note;
   if(result.status==='graded'&&result.grade===null)throw Error(points?'Bitte Punkte eingeben oder einen anderen Status wählen.':'Bitte eine Note eingeben oder einen anderen Status wählen.');if(result.status!=='graded'&&result.grade!==null)throw Error('Bitte die Note entfernen oder den Status Bewertet wählen.');const q=A.N.Q.from(weight);if(q.cmp(0)<=0n||q.cmp(100)>0n)throw Error('Der Faktor muss größer als 0 und höchstens 100 sein.');
   const changedSettings=record&&(settings.mode!==(record.inputMode||'direct')||settings.key&&JSON.stringify(settings.key)!==JSON.stringify(record.pointKey));
   if(changedSettings&&impact.occupied&&!draft.keyConfirmed){A.confirmInDialog('Notenschlüssel ändern',A.pointImpactText(impact),async()=>{draft.keyConfirmed=true;await A.submitDialog(next);if(A.$('#dialog').open&&draft.committed&&(!next&&!record||next==='close'||next==='export'))A.closeModal({submitted:true});},'Übernehmen');return {keepOpen:true};}
   const period=A.assessmentPeriod(c,date,record);
   A.mutate(d=>{A.ensureEdit(d.courses.find(x=>x.id===c.id));if(record){const a=d.assessments.find(a=>a.id===record.id);if(!a||!A.N.isOralIndividual(a))throw Error('Diese Einzelnote ist nicht mehr vorhanden.');Object.assign(a,impact.assessment,{title,date,period,weight,isGfs:A.$('#q-gfs').checked});if(points)a.pointKeyUsedAt=new Date().toISOString();a.results[sid]=result;}else{const existing=d.assessments.find(a=>a.id===draft.id);if(existing&&!draft.editExisting)throw Error('Diese Note wurde bereits erfasst.');const saved={id:draft.id,courseId:c.id,period,kind:'oral',oralEntry:'individual',title,date,weight,isGfs:false,participantIds:[sid],inputMode:settings.mode,...(settings.key?{pointKey:settings.key,pointKeyUsedAt:new Date().toISOString()}:{}),results:{[sid]:result}};if(existing)Object.assign(existing,saved);else d.assessments.push(saved);}A.W().oralFocusId=draft.id;});committedNow=true;draft.committed=true;draft.student=sid;draft.result=result;draft.scoring=impact.assessment;
  }
  A.remember();await A.save();if(A.store&&A.dirty){for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.disabled=true;throw Error('Die Note ist erfasst, aber noch nicht vollständig gespeichert. Bitte behebe den Speicherfehler und wähle erneut Speichern.');}
  if(committedNow&&A.N.isPoints(draft.scoring))A.announcePoints(draft.scoring,draft.result);
  if(next==='stay')return {keepOpen:true};
  if(record&&(next==='close'||next==='export'))return;
  if(next&&record){const rows=A.oralRowsData(),at=rows.findIndex(x=>x.a.id===record.id),following=rows[at+(next==='previous'?-1:1)];if(following){A.closeModal({submitted:true});A.quickOral(following.s.id,A.data.assessments.find(a=>a.id===following.a.id),true);return {keepOpen:true};}return {keepOpen:true,focus:'q-points'};}
  if(record&&!next){const saved=A.data.assessments.find(a=>a.id===record.id),origin=A.opener;A.closeModal({submitted:true});A.quickOral(selected,saved);A.opener=origin;A.$('#oralEditButton')?.focus();return {keepOpen:true};}
  if(!next)return;const at=list.findIndex(s=>s.id===draft.student),following=list[at+(next==='previous'?-1:1)];if(!following){return {keepOpen:true,focus:A.N.isPoints(draft.scoring)?'q-points':'q-grade'};}
  A.oralDraft={id:A.N.id(),committed:false};A.$('#oralStudent').value=following.id;A.$('#q-grade').value='';A.$('#q-points').value='';A.$('#q-manual').value='';A.$('#q-manualField').hidden=true;A.$('#q-note').value='';for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.disabled=false;A.updateOralNext();A.updateOralPoints?.();A.$(A.val('oralKeyMode')==='points'?'#q-points':'#q-grade').focus();return {keepOpen:true};
 },'Speichern',{size:'small'});
 if(record){A.$('#dialogSave').hidden=!editing||readonly;A.$('#dialogSave').textContent='Fertig';A.$('#dialog .dialog-actions [data-action=close]').textContent='Schließen';A.$('#oralResultView').hidden=editing;const button=A.$('#oralEditButton');if(button){button.hidden=editing;button.addEventListener('click',()=>{A.$('#oralResultView').hidden=true;button.hidden=true;A.$('#oralEditFields').hidden=false;A.$('#dialogSave').hidden=false;A.$(A.N.isPoints(scoring)?'#q-points':'#q-grade').focus();});}A.$('#oralReadKey')?.addEventListener('click',()=>A.showPointKey(A.data.assessments.find(a=>a.id===record.id)));}
 A.bindPointSettings(scoring,'oralKey',false);A.bindOralPoints(scoring,old,!!record);
 if(readonly){for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.disabled=true;A.$('#dialogTitle').tabIndex=-1;A.$('#dialogTitle').focus();return;}
 A.oralDraft={id:record?.id||A.N.id(),committed:false};A.oralList=list;A.$('#dialogNext').hidden=!!record;A.updateOralNext();A.$('#oralStudent').addEventListener('change',A.updateOralNext);
 const snapshot=()=>JSON.stringify([...A.$('#oralEditFields').querySelectorAll('input,select,textarea')].map(el=>[el.id,el.type==='checkbox'?el.checked:el.value]));const initial=snapshot();
 A.dialogBeforeClose=()=>{if(A.$('#oralEditFields').hidden||snapshot()===initial||A.oralDraft?.committed||!record&&!['q-grade','q-points','q-note','q-manual'].some(id=>A.val(id))&&A.val('q-title')==='Mündliche Note'&&A.val('q-date')===A.today())return true;if(record){A.submitModal('close');return false;}A.confirmInDialog('Eingabe schließen','Die neue mündliche Note ist noch nicht vollständig übernommen. Möchtest du diese Eingabe verwerfen?',()=>A.closeModal({submitted:true}),'Verwerfen','Weiter bearbeiten');return false;};
 if(record&&!editing){A.$('#dialogTitle').tabIndex=-1;A.$('#dialogTitle').focus();return;}A.$(id||record?(A.N.isPoints(scoring)?'#q-points':'#q-grade'):'#oralStudent').focus();
};
Notenblick.updateOralNext=function(){if(!Notenblick.oralDraft)return;const at=Notenblick.oralList.findIndex(s=>s.id===Notenblick.val('oralStudent'));Notenblick.$('#dialogNext').disabled=at<0||at>=Notenblick.oralList.length-1;};
})(globalThis.Notenblick = globalThis.Notenblick || {});
