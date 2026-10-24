/* Notenblick – dialogs/grades.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.assessmentDialog = function assessmentDialog(a = null, kind = 'exam', fixed = false) {
  Notenblick.ensureEdit();
  const c = Notenblick.getCourse();
  Notenblick.modal(a ? 'Angaben bearbeiten' : kind === 'exam' ? 'Klassenarbeit anlegen' : kind === 'test' ? 'Test anlegen' : kind === 'oral' ? 'Mündliche Leistung anlegen' : 'Leistung anlegen', `<div class="form-grid">${Notenblick.field('a-title', 'Bezeichnung', a?.title || '', 'required maxlength="150"')}${Notenblick.field('a-date', 'Datum', a?.date || Notenblick.today(), 'required', 'date')}${fixed&&!a?`<input type="hidden" id="a-kind" value="${kind}">`:`<div class="field"><label for="a-kind">Leistungsart</label><select id="a-kind">${Notenblick.kinds.map(k => Notenblick.opt(k, Notenblick.N.KINDS[k], a?.kind || kind)).join('')}</select></div>`}${Notenblick.field('a-weight', 'Faktor', a?.weight || '1', 'required inputmode="decimal"', 'text', '1 = einfach, 2 = doppelt')}<label class="check full"><input type="checkbox" id="a-gfs"${a?.isGfs ? ' checked' : ''}>Als GFS kennzeichnen</label></div><details class="participation-options"><summary>Teilnahme</summary><div class="field"><label for="a-scope">Leistung für</label><select id="a-scope">${Notenblick.opt('class','Ganze Klasse',a?.participantIds?'selected':'class')}${Notenblick.opt('selected','Ausgewählte Schüler',a?.participantIds?'selected':'class')}</select></div><div class="check-list" id="a-participants"${a?.participantIds?'':' hidden'}>${Notenblick.sorted(Notenblick.N.activeStudents(Notenblick.data,c,true)).map(s=>`<label class="check"><input type="checkbox" name="participant" value="${s.id}"${a?.participantIds?.includes(s.id)||Object.hasOwn(a?.results||{},s.id)?' checked':''}>${Notenblick.rowName(s)}</label>`).join('')}</div><p class="hint">Schüler mit bereits gespeicherten Einträgen müssen beteiligt bleiben. Bisherige Leistungen werden nicht automatisch umgedeutet. Erweiterst du eine Einzelnote ausdrücklich auf die Klasse, wird sie als Klassenleistung geführt.</p></details>${a ? `<p style="margin-top:20px">${Notenblick.b('delete-assessment', 'Löschen', `data-id="${a.id}"`, 'text-button danger')}</p>` : ''}`, () => {
    const title = Notenblick.required('a-title', 'eine Bezeichnung'),
      date = Notenblick.required('a-date', 'ein Datum'),
      kind = Notenblick.val('a-kind'),
      weight = Notenblick.val('a-weight').replace(',', '.');
    const q = Notenblick.N.Q.from(weight);
    if (q.cmp(0) <= 0n || q.cmp(100) > 0n) throw Error('Die Gewichtung muss größer als 0 und höchstens 100 sein.');
    const participantIds=Notenblick.val('a-scope')==='selected'?[...document.querySelectorAll('[name=participant]:checked')].map(x=>x.value):null;
    if(participantIds&&(!participantIds.length||Object.keys(a?.results||{}).some(id=>!participantIds.includes(id))))throw Error('Wähle mindestens einen Schüler. Bereits gespeicherte Einträge müssen beteiligt bleiben.');
    const isGfs = Notenblick.$('#a-gfs').checked;
    let newId = a?.id;
    Notenblick.mutate(d => {
      if (a) Object.assign(d.assessments.find(x => x.id === a.id), {
        title,
        date,
        kind,
        weight,
        isGfs
      });else {
        newId = Notenblick.N.id();
        d.assessments.push({
          id: newId,
          courseId: c.id,
          period: '1',
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
      Notenblick.W().assessmentWorkOpen=true;
      Notenblick.W().selected[kind] = newId;
      Notenblick.W().view = Notenblick.assessmentView(kind);
      Notenblick.W().assessmentId = newId;
      Notenblick.W().assessmentFilter = 'all';
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
Notenblick.finalDialog = function finalDialog(id) {
  const s = Notenblick.getStudent(id),
    c = Notenblick.getCourse();
  if (!s || !c) return;
  const calc = Notenblick.calculation(c, id),
    final = Notenblick.data.finals.find(f => f.courseId === c.id && f.studentId === id && f.period === 'all'),
    previous = (Array.isArray(Notenblick.data.previousFinals) ? Notenblick.data.previousFinals : []).filter(f => f.courseId === c.id && f.studentId === id);
  Notenblick.modal(Notenblick.studentName(s), `<p class="dialog-intro">${Notenblick.esc(c.name + ' – Klasse ' + Notenblick.getClass().name + ' – ' + Notenblick.schoolYear(Notenblick.getYear()))}</p><div class="student-summary"><span>Gesamtschnitt</span><strong>${Notenblick.showAverage(calc.total, c)}</strong></div><fieldset><legend>Zeugnisnote festlegen</legend>${Notenblick.field('final-grade', 'Zeugnisnote', final?.grade?.replace('.', ',') || '', 'inputmode="decimal"' + (Notenblick.readonly() ? ' disabled' : ''), 'text', 'Leer lassen, um eine festgelegte Zeugnisnote zu entfernen.')}<div class="field" style="margin-top:16px"><label for="final-note">Bemerkung</label><textarea id="final-note" maxlength="2000"${Notenblick.readonly() ? ' disabled' : ''}>${Notenblick.esc(final?.note || '')}</textarea></div>${previous.length && !final ? '<p class="hint">Bisher festgelegte Noten: ' + previous.map(f => Notenblick.esc(String(f.grade).replace('.', ','))).join(', ') + '. Bitte lege die Zeugnisnote für das ganze Schuljahr fest.</p>' : ''}</fieldset>`, () => {
    if (Notenblick.readonly()) return;
    const input = Notenblick.val('final-grade'),
      grade = input ? Notenblick.N.grade(input) : null,
      note = Notenblick.val('final-note');
    Notenblick.mutate(d => {
      d.finals = d.finals.filter(f => !(f.courseId === c.id && f.studentId === id && f.period === 'all'));
      if (grade) d.finals.push({
        id: Notenblick.N.id(),
        courseId: c.id,
        studentId: id,
        period: 'all',
        grade,
        note
      });
    });
  }, Notenblick.readonly() ? 'Schließen' : 'Zeugnisnote speichern');
  if(Notenblick.readonly()){Notenblick.submitDialog=null;Notenblick.$('#dialogSave').hidden=true;Notenblick.$('#dialog .dialog-actions [data-action=close]').textContent='Schließen';}
};
Notenblick.quickOral=function(id,record=null){
 const A=Notenblick;if(!record)A.ensureEdit();if(record&&(record.courseId!==A.ui.course||!A.data.assessments.some(a=>a.id===record.id)))throw Error('Diese Einzelnote ist nicht mehr vorhanden.');const readonly=!!record&&A.readonly();if(record&&!A.N.isOralIndividual(record))throw Error('Bitte die vorhandene Leistung über die Klassenansicht bearbeiten.');const list=A.entryList();if(id&&!list.some(s=>s.id===id)){const s=A.getStudent(id);if(s)list.push(s);}if(!list.length)throw Error('Bitte füge zuerst Schüler hinzu.');
 if(A.$('#dialog').open)A.closeModal();const selected=record?.participantIds[0]||(list.some(s=>s.id===id)?id:list[0].id),c=A.getCourse(),old=record?.results[selected]||{grade:null,status:'open',note:''};
 A.modal(readonly?'Mündliche Note':record?'Mündliche Note bearbeiten':'Mündliche Note eintragen',`${readonly?'<p class="notice">Nur anzeigen. Öffne das Schuljahr, die Klasse oder das Fach zuerst wieder, um die Note zu ändern.</p>':''}<div class="form-grid"><div class="field full"><label for="oralStudent">Schüler</label><select id="oralStudent"${record?' disabled':''}>${list.map(s=>A.opt(s.id,A.studentName(s),selected)).join('')}</select></div>${A.field('q-grade','Note',old.grade?.replace('.',',')||'','inputmode="decimal"'+(record?'':' required'))}${A.field('q-date','Datum',record?.date||A.today(),'required','date')}<div class="full">${A.field('q-title','Bezeichnung',record?.title||'Mündliche Leistung','required maxlength="150"')}</div>${record?`<div class="field"><label for="q-status">Status</label><select id="q-status">${Object.entries(A.N.STATUS).map(([k,l])=>A.opt(k,l,old.status)).join('')}</select></div>${A.field('q-weight','Faktor',record.weight,'inputmode="decimal"','text','1 = einfach, 2 = doppelt')}<label class="check full"><input type="checkbox" id="q-gfs"${record.isGfs?' checked':''}>Als GFS kennzeichnen</label>`:''}<div class="full field"><label for="q-note">Bemerkung (optional)</label><textarea id="q-note" maxlength="2000">${A.esc(old.note)}</textarea></div></div>`,readonly?null:async next=>{
  const draft=A.oralDraft;if(!draft)throw Error('Bitte öffne die Noteneingabe erneut.');
  if(!draft.committed){const sid=record?selected:A.val('oralStudent'),raw=A.val('q-grade'),grade=raw?A.N.grade(raw):null,date=A.required('q-date','ein Datum'),title=A.required('q-title','eine Bezeichnung'),note=A.val('q-note'),status=record?A.val('q-status'):'graded',weight=record?A.val('q-weight').replace(',','.'):'1';
   if(status==='graded'&&!grade)throw Error('Bitte eine Note eingeben oder einen anderen Status wählen.');if(status!=='graded'&&grade)throw Error('Bitte die Note entfernen oder den Status Bewertet wählen.');const q=A.N.Q.from(weight);if(q.cmp(0)<=0n||q.cmp(100)>0n)throw Error('Der Faktor muss größer als 0 und höchstens 100 sein.');
   A.mutate(d=>{A.ensureEdit(d.courses.find(x=>x.id===c.id));if(record){const a=d.assessments.find(a=>a.id===record.id);if(!a||!A.N.isOralIndividual(a))throw Error('Diese Einzelnote ist nicht mehr vorhanden.');Object.assign(a,{title,date,weight,isGfs:A.$('#q-gfs').checked});a.results[sid]={grade,status,note};}else{if(d.assessments.some(a=>a.id===draft.id))throw Error('Diese Note wurde bereits erfasst.');d.assessments.push({id:draft.id,courseId:c.id,period:'1',kind:'oral',oralEntry:'individual',title,date,weight,isGfs:false,participantIds:[sid],results:{[sid]:{grade,status,note}}});}A.W().oralFocusId=draft.id;});draft.committed=true;draft.student=sid;
  }
  await A.save();if(A.store&&A.dirty){for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.disabled=true;throw Error('Die Note ist erfasst, aber noch nicht vollständig gespeichert. Bitte behebe den Speicherfehler und wähle erneut Speichern.');}
  if(!next||record)return;const at=list.findIndex(s=>s.id===draft.student),following=list[at+1];if(!following)return;
  A.oralDraft={id:A.N.id(),committed:false};A.$('#oralStudent').value=following.id;A.$('#q-grade').value='';A.$('#q-note').value='';for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.disabled=false;A.updateOralNext();A.$('#q-grade').focus();return {keepOpen:true};
 },'Speichern',{size:'small'});
 if(readonly){for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.disabled=true;A.$('#dialog .close').focus();return;}
 A.oralDraft={id:record?.id||A.N.id(),committed:false};A.oralList=list;A.$('#dialogNext').hidden=!!record;A.updateOralNext();A.$('#oralStudent').addEventListener('change',A.updateOralNext);A.$(id||record?'#q-grade':'#oralStudent').focus();
};
Notenblick.updateOralNext=function(){if(!Notenblick.oralDraft)return;const at=Notenblick.oralList.findIndex(s=>s.id===Notenblick.val('oralStudent'));Notenblick.$('#dialogNext').disabled=at<0||at>=Notenblick.oralList.length-1;};
})(globalThis.Notenblick = globalThis.Notenblick || {});
