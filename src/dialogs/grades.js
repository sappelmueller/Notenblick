/* Notenblick – dialogs/grades.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.participantMarkup=function(a,c){
 const A=Notenblick,protectedIds=new Set(Object.keys(a?.results||{})),ids=new Set([...A.N.activeStudents(A.data,c,true).map(s=>s.id),...(a?.participantIds||[]),...protectedIds]),list=A.N.sorted([...ids].map(id=>A.getStudent(id)).filter(Boolean),'last','asc');
 return `<details class="participation-options"><summary>Teilnehmer auswählen</summary><div class="field"><label for="a-scope">Wer nimmt teil?</label><select id="a-scope">${A.opt('class','Ganze Klasse',a?.participantIds?'selected':'class')}${A.opt('selected','Nur ausgewählte Schüler',a?.participantIds?'selected':'class')}</select></div><div id="a-participants"${a?.participantIds?'':' hidden'}><p id="participantHint">Wähle die Schüler aus, die an dieser Leistung teilnehmen.</p><div class="field"><label for="participantSearch">Schüler suchen</label><input id="participantSearch" type="search" autocomplete="off"></div><p id="participantCount"></p><div class="button-row"><button type="button" class="button small" id="participantAll">Alle auswählen</button><button type="button" class="button small" id="participantNone">Auswahl aufheben</button></div>${protectedIds.size?'<p class="hint" id="participantProtection">Schüler mit gespeicherten Einträgen bleiben ausgewählt. Ihre Auswahl ist gesperrt.</p>':''}<div class="participant-list" role="group" aria-label="Teilnehmende Schüler" aria-describedby="participantHint${protectedIds.size?' participantProtection':''}">${list.map(s=>`<label class="check" data-participant-row="${s.id}"><input type="checkbox" name="participant" value="${s.id}"${a?.participantIds?.includes(s.id)||protectedIds.has(s.id)?' checked':''}${protectedIds.has(s.id)?' disabled':''}><span>${A.rowName(s)}${protectedIds.has(s.id)?'<small>Eintrag vorhanden</small>':''}</span></label>`).join('')}</div><p class="hint" id="participantNoMatches" hidden>Keine passenden Schüler.</p></div></details>`;
};
Notenblick.bindParticipants=function(){
 const A=Notenblick,inputs=[...A.$('#a-participants').querySelectorAll('[name=participant]')],update=()=>{A.$('#participantCount').textContent=inputs.filter(e=>e.checked).length+' von '+inputs.length+(inputs.length===1?' Schüler':' Schülern')+' ausgewählt';};
 A.$('#a-scope').addEventListener('change',()=>{A.$('#a-participants').hidden=A.val('a-scope')!=='selected';});
 A.$('#participantSearch').addEventListener('input',e=>{let visible=0;for(const input of inputs){const row=input.closest('[data-participant-row]');row.hidden=!A.matchesStudent(A.getStudent(input.value),e.target.value.toLocaleLowerCase('de'));if(!row.hidden)visible++;}A.$('#participantNoMatches').hidden=visible>0;});
 for(const input of inputs)input.addEventListener('change',update);
 for(const [id,checked]of [['participantAll',true],['participantNone',false]])A.$('#'+id).addEventListener('click',()=>{for(const input of inputs)if(!input.disabled)input.checked=checked;update();});update();
};
Notenblick.readPerformanceWeight=function(id){const A=Notenblick,el=A.$('#'+id);try{const value=el.value.trim().replace(',','.'),q=A.N.Q.from(value);if(q.cmp(0)<=0n||q.cmp(100)>0n)throw Error('Die Gewichtung muss größer als 0 und höchstens 100 sein.');el.removeAttribute('aria-invalid');return value;}catch(e){el.setAttribute('aria-invalid','true');A.focusTarget(el);throw e;}};
Notenblick.assessmentDialog = function assessmentDialog(a = null, kind = 'exam', fixed = false) {
  Notenblick.ensureEdit();
  const c = Notenblick.getCourse();
  Notenblick.modal(a ? 'Angaben bearbeiten' : kind === 'exam' ? 'Klassenarbeit anlegen' : kind === 'test' ? 'Test anlegen' : kind === 'oral' ? 'Noten für Klasse erfassen' : 'Leistung anlegen', `<div class="form-grid">${Notenblick.field('a-title', 'Bezeichnung', a?.title || '', 'required maxlength="150"')}${Notenblick.field('a-date', 'Datum', a?.date || Notenblick.today(), 'required', 'date')}${fixed&&!a?`<input type="hidden" id="a-kind" value="${kind}">`:`<div class="field"><label for="a-kind">Leistungsart</label><select id="a-kind">${Notenblick.kinds.map(k => Notenblick.opt(k, Notenblick.N.KINDS[k], a?.kind || kind)).join('')}</select></div>`}${Notenblick.field('a-weight', 'Gewichtung der Leistung', a?.weight || '1', 'required inputmode="decimal"', 'text', '1 = einfach, 2 = doppelt. Bestimmt, wie stark diese Leistung zählt.')}<label class="check full"><input type="checkbox" id="a-gfs"${a?.isGfs ? ' checked' : ''}>Als GFS kennzeichnen</label></div>${Notenblick.participantMarkup(a,c)}${a ? `<p style="margin-top:20px">${Notenblick.b('delete-assessment', 'Löschen', `data-id="${a.id}"`, 'text-button danger')}</p>` : ''}`, () => {
    const title = Notenblick.required('a-title', 'eine Bezeichnung'),
      date = Notenblick.required('a-date', 'ein Datum'),
      kind = Notenblick.val('a-kind'),
      weight = Notenblick.readPerformanceWeight('a-weight');
    const participantIds=Notenblick.val('a-scope')==='selected'?[...document.querySelectorAll('[name=participant]:checked')].map(x=>x.value):null;
    if(participantIds&&(!participantIds.length||Object.keys(a?.results||{}).some(id=>!participantIds.includes(id)))){Notenblick.$('.participation-options').open=true;Notenblick.focusTarget('participantSearch');throw Error('Wähle mindestens einen Schüler. Gespeicherte Einträge bleiben beteiligt.');}
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
    Notenblick.afterClose=()=>Notenblick.focusTarget('assessmentWorkTitle');
  });
  Notenblick.bindParticipants();
};
Notenblick.quickOral=function(id,record=null,editing=false,options={}){
 const A=Notenblick;if(!record)A.ensureEdit();if(record&&(record.courseId!==A.ui.course||!A.data.assessments.some(a=>a.id===record.id)))throw Error('Diese Einzelnote ist nicht mehr vorhanden.');const readonly=!!record&&A.readonly();editing=!record||editing&&!readonly;if(record&&!A.N.isOralIndividual(record))throw Error('Bitte die vorhandene Leistung über die Klassenansicht bearbeiten.');const list=A.entryList();if(id&&!list.some(s=>s.id===id)){const s=A.getStudent(id);if(s)list.push(s);}if(!list.length)throw Error('Bitte füge zuerst Schüler hinzu.');
 if(A.$('#dialog').open&&!options.reuse)A.closeModal();const selected=record?.participantIds[0]||(list.some(s=>s.id===id)?id:list[0].id),c=A.getCourse(),old=record?.results[selected]||{grade:null,status:'open',note:''};
 const scoring=record||{kind:'oral',courseId:c.id,inputMode:'direct',results:{}};
 A.modal(record?record.title:'Mündliche Note eintragen',`${record?`<div id="oralResultView"><p>${A.date(record.date)} · ${A.esc(c.name)} · Klasse ${A.esc(A.getClass().name)}</p>${A.N.isPoints(record)?'<p class="point-summary">'+A.esc(A.N.pointKeySummary(record.pointKey))+'</p><button type="button" class="text-button" id="oralReadKey">Notenschlüssel anzeigen</button>':''}${A.assessmentResultsMarkup(record).replace('aria-labelledby="assessmentWorkTitle"','aria-labelledby="dialogTitle"')}</div>${readonly?'':'<button type="button" id="oralEditButton" class="button primary">Noten bearbeiten</button>'}`:''}<div id="oralEditFields"${editing?'':' hidden'}>${readonly?'<p class="notice">Nur anzeigen. Öffne das Schuljahr, die Klasse oder das Fach zuerst wieder, um die Note zu ändern.</p>':''}<div class="form-grid"><div class="field full"><label for="oralStudent">Schüler</label><select id="oralStudent"${record?' disabled':''}>${list.map(s=>A.opt(s.id,A.studentName(s),selected)).join('')}</select></div><div class="full"><button type="button" class="text-button" id="oralKeyEdit">${A.N.isPoints(scoring)?'Notenschlüssel ändern':'Eingabeart ändern'}</button><div id="oralKeyConfiguration" hidden>${A.pointSettingsMarkup(scoring,'oralKey',false)}<button type="button" class="button" id="oralKeyApply">Einstellungen übernehmen</button><button type="button" class="text-button" id="oralKeyCancel">Abbrechen</button></div></div><div id="q-directField"${A.N.isPoints(scoring)?' hidden':''}>${A.field('q-grade','Note',old.grade?.replace('.',',')||'','inputmode="decimal"')}</div><div id="q-pointField"${A.N.isPoints(scoring)?'':' hidden'}><p id="q-keySummary" class="point-summary"></p><div class="button-row"><button type="button" class="text-button" id="q-keyShow">Notenschlüssel anzeigen</button><button type="button" class="text-button" id="q-keyPdf">Notenschlüssel als PDF speichern</button></div>${A.field('q-points','Erreichte Punkte',old.points?.replace('.',',')??'','inputmode="decimal"')}<p id="q-calculated"></p><p id="q-effective"></p><button type="button" class="text-button" id="q-change">Note anpassen</button><div id="q-manualField" hidden>${A.field('q-manual','Festgelegt',old.manualGrade?.replace('.',',')||'','inputmode="decimal"')}<button type="button" class="text-button" id="q-reset">Berechnete Note übernehmen</button></div></div>${A.field('q-weight','Gewichtung der Leistung',record?.weight||'1','inputmode="decimal"','text','1 = einfach, 2 = doppelt. Bestimmt, wie stark diese Leistung zählt.')}${record?'':`<div class="field" id="q-pointStatusField" hidden><label for="q-pointStatus">Status</label><select id="q-pointStatus">${Object.entries(A.N.STATUS).map(([k,l])=>A.opt(k,l,'graded')).join('')}</select></div>`}${A.field('q-date','Datum',record?.date||A.today(),'required','date')}<div class="full">${A.field('q-title','Bezeichnung',record?.title||'Mündliche Note','required maxlength="150"')}</div>${record?`<div class="field"><label for="q-status">Status</label><select id="q-status">${Object.entries(A.N.STATUS).map(([k,l])=>A.opt(k,l,old.status)).join('')}</select></div>${A.field('q-weight','Faktor',record.weight,'inputmode="decimal"','text','1 = einfach, 2 = doppelt. Bestimmt, wie stark diese Leistung zählt.')}<label class="check full"><input type="checkbox" id="q-gfs"${record.isGfs?' checked':''}>Als GFS kennzeichnen</label>`:''}<div class="full field"><label for="q-note">Bemerkung (optional)</label><textarea id="q-note" maxlength="2000">${A.esc(old.note)}</textarea></div></div></div>${record?A.b('oral-record-export','Leistung exportieren',`data-id="${record.id}"`,'button'):''}`,readonly?null:async next=>{
  const draft=A.oralDraft;let committedNow=false;if(!draft)throw Error('Bitte öffne die Noteneingabe erneut.');
  if(!draft.committed){const sid=record?selected:A.val('oralStudent'),raw=A.val('q-grade'),date=A.required('q-date','ein Datum'),title=A.required('q-title','eine Bezeichnung'),note=A.val('q-note'),settings=A.readPointSettings('oralKey'),points=settings.mode==='points',status=record?A.val('q-status'):points?A.val('q-pointStatus'):'graded',weight=A.readPerformanceWeight('q-weight');
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
   if(result.status==='graded'&&result.grade===null)throw Error(points?'Bitte Punkte eingeben oder einen anderen Status wählen.':'Bitte eine Note eingeben oder einen anderen Status wählen.');if(result.status!=='graded'&&result.grade!==null)throw Error('Bitte die Note entfernen oder den Status Bewertet wählen.');
   const changedSettings=Object.keys(base.results).length&&(settings.mode!==(base.inputMode||'direct')||settings.key&&JSON.stringify(settings.key)!==JSON.stringify(base.pointKey));
   if(changedSettings&&impact.occupied&&!draft.keyConfirmed){A.confirmInDialog('Notenschlüssel ändern',A.pointImpactText(impact,base,settings.mode),async()=>{draft.keyConfirmed=true;await A.submitDialog(next);if(A.$('#dialog').open&&draft.committed&&(!next&&!record||next==='close'||next==='export'))A.closeModal({submitted:true});},'Änderungen übernehmen');return {keepOpen:true};}
   const period=A.assessmentPeriod(c,date,record);
   A.mutate(d=>{A.ensureEdit(d.courses.find(x=>x.id===c.id));if(record){const a=d.assessments.find(a=>a.id===record.id);if(!a||!A.N.isOralIndividual(a))throw Error('Diese Einzelnote ist nicht mehr vorhanden.');Object.assign(a,impact.assessment,{title,date,period,weight,isGfs:A.$('#q-gfs').checked});if(points)a.pointKeyUsedAt=new Date().toISOString();a.results[sid]=result;}else{const existing=d.assessments.find(a=>a.id===draft.id);if(existing&&!draft.editExisting)throw Error('Diese Note wurde bereits erfasst.');const saved={id:draft.id,courseId:c.id,period,kind:'oral',oralEntry:'individual',title,date,weight,isGfs:false,participantIds:[sid],inputMode:settings.mode,...(settings.key?{pointKey:settings.key,pointKeyUsedAt:new Date().toISOString()}:{}),results:{[sid]:result}};if(existing)Object.assign(existing,saved);else d.assessments.push(saved);}A.W().oralFocusId=draft.id;});committedNow=true;draft.committed=true;draft.student=sid;draft.result=result;draft.scoring=impact.assessment;
  }
  A.remember();await A.save();if(A.store&&A.dirty){for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.disabled=true;throw Error('Die Note ist erfasst, aber noch nicht vollständig gespeichert. Bitte behebe den Speicherfehler und wähle erneut Speichern.');}
  if(committedNow&&A.N.isPoints(draft.scoring))A.announcePoints(draft.scoring,draft.result);
  if(next==='stay')return {keepOpen:true};
  if(next==='close'||next==='export')return;
  if(next&&record){const rows=A.oralRowsData(),at=rows.findIndex(x=>x.a.id===record.id),following=rows[at+(next==='previous'?-1:1)];if(following){A.closeModal({submitted:true});A.quickOral(following.s.id,A.data.assessments.find(a=>a.id===following.a.id),true,{focus:A.N.isPoints(draft.scoring)?'q-points':'q-grade'});return {keepOpen:true};}return {keepOpen:true,focus:'q-points'};}
  if(record&&!next){const saved=A.data.assessments.find(a=>a.id===record.id);A.quickOral(selected,saved,false,{reuse:true,focus:'oralEditButton'});return {keepOpen:true};}
  if(!next)return;const at=list.findIndex(s=>s.id===draft.student),following=list[at+(next==='previous'?-1:1)];if(!following){return {keepOpen:true,focus:A.N.isPoints(draft.scoring)?'q-points':'q-grade'};}
  A.oralDraft={id:A.N.id(),committed:false};A.$('#oralStudent').value=following.id;A.$('#q-grade').value='';A.$('#q-points').value='';A.$('#q-manual').value='';A.$('#q-manualField').hidden=true;A.$('#q-note').value='';for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.disabled=false;A.updateOralNext();A.updateOralPoints?.();A.$(A.val('oralKeyMode')==='points'?'#q-points':'#q-grade').focus();return {keepOpen:true};
 },'Speichern',{size:'small',reuse:options.reuse,focus:options.focus||'dialogTitle'});
 if(record){A.$('#dialogSave').hidden=!editing||readonly;A.$('#dialogSave').textContent='Fertig';A.$('#dialog .dialog-actions [data-action=close]').textContent='Schließen';A.$('#oralResultView').hidden=editing;const button=A.$('#oralEditButton');if(button){button.hidden=editing;button.addEventListener('click',()=>{A.$('#oralResultView').hidden=true;button.hidden=true;A.$('#oralEditFields').hidden=false;A.$('#dialogSave').hidden=false;A.$('#dialogTitle').textContent='Noten eingeben – '+record.title;A.focusTarget('dialogTitle');});}A.$('#oralReadKey')?.addEventListener('click',()=>A.showPointKey(A.data.assessments.find(a=>a.id===record.id)));}
 A.bindPointSettings(scoring,'oralKey',false);A.bindOralPoints(scoring,old,!!record);
 if(readonly){for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.disabled=true;A.$('#dialogTitle').tabIndex=-1;A.$('#dialogTitle').focus();return;}
 A.oralDraft={id:record?.id||A.N.id(),committed:false};A.oralList=list;A.$('#dialogNext').hidden=!!record;A.updateOralNext();A.$('#oralStudent').addEventListener('change',A.updateOralNext);
 const snapshot=()=>JSON.stringify([...A.$('#oralEditFields').querySelectorAll('input,select,textarea')].map(el=>[el.id,el.type==='checkbox'?el.checked:el.value]));const initial=snapshot();
 A.dialogBeforeClose=()=>{if(A.$('#oralEditFields').hidden||snapshot()===initial||A.oralDraft?.committed||!record&&!['q-grade','q-points','q-note','q-manual'].some(id=>A.val(id))&&A.val('q-title')==='Mündliche Note'&&A.val('q-date')===A.today())return true;if(record||A.data.assessments.some(a=>a.id===A.oralDraft?.id)){A.submitModal('close');return false;}A.confirmInDialog('Eingabe schließen','Die neue mündliche Note ist noch nicht vollständig übernommen. Möchtest du diese Eingabe verwerfen?',()=>A.closeModal({submitted:true}),'Verwerfen','Weiter bearbeiten');return false;};
 if(record&&!editing){if(!options.focus){A.$('#dialogTitle').tabIndex=-1;A.$('#dialogTitle').focus();}return;}A.focusTarget(options.focus||'dialogTitle');
};
Notenblick.updateOralNext=function(){if(!Notenblick.oralDraft)return;const at=Notenblick.oralList.findIndex(s=>s.id===Notenblick.val('oralStudent'));Notenblick.$('#dialogNext').disabled=at<0||at>=Notenblick.oralList.length-1;};
})(globalThis.Notenblick = globalThis.Notenblick || {});
