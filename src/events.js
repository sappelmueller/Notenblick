/* Notenblick – events.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if(el.tagName==='A')e.preventDefault();
  Notenblick.action(el).catch(e => {
    if (Notenblick.$('#dialog').open) {
      Notenblick.$('#dialogError').textContent = e.message;
      Notenblick.$('#dialogError').hidden = false;
    } else Notenblick.error(e.message,e.storageError?'storage':'input');
  });
});
Notenblick.$('#dialogForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!Notenblick.submitDialog) return;
  await Notenblick.submitModal();
});
Notenblick.$('#dialog').addEventListener('cancel', e => {
  e.preventDefault();
  if(!Notenblick.dialogBusy||Notenblick.dialogCancellable)Notenblick.closeModal();
});
// Handle protected Escape before the native dialog dismissal, including
// repeated Escape while a confirmation is being shown/restored.
Notenblick.$('#dialog').addEventListener('keydown', e => {
  if(e.key!=='Escape'||e.defaultPrevented)return;
  // Prevent the native close watcher itself during a critical operation,
  // including repeated Escape, rather than relying only on cancel events.
  if(Notenblick.dialogBusy&&!Notenblick.dialogCancellable){e.preventDefault();e.stopPropagation();return;}
  if(!(Notenblick.dialogBeforeClose||Notenblick.dialogReturn))return;
  e.preventDefault();e.stopPropagation();
  if(!Notenblick.dialogBusy||Notenblick.dialogCancellable)Notenblick.closeModal();
});
document.addEventListener('submit', e => {
  if(e.target.id==='adminViewForm'){e.preventDefault();Notenblick.$('#adminViewDetails').open=false;Notenblick.$('#adminViewSummary').focus();Notenblick.remember();return;}
  if (e.target.id === 'viewForm') {
    e.preventDefault();
    Notenblick.W().columns = [...document.querySelectorAll('[name=column]:checked')].map(e => e.value);
    Notenblick.W().showExited = !!Notenblick.$('[name=showExited]:checked');
    Notenblick.refreshTable('overview');
    Notenblick.$('#viewDetails').open = false;
    Notenblick.$('#viewSummary').focus();
    Notenblick.remember();
  }
});
document.addEventListener('focusin',e=>{if(e.target.dataset.entry){const s=Notenblick.getStudent(e.target.dataset.student),el=Notenblick.$('#currentEntryPupil');if(el&&s){el.textContent='Aktueller Schüler: '+Notenblick.studentName(s);el.hidden=e.target.dataset.mode==='single';}}});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.entry) {
    Notenblick.pending.add(el.id);if(el.dataset.entry==='points')Notenblick.previewPoints(el);
    return;
  }
  if (el.dataset.filter === 'search') {
    Notenblick.W()[el.dataset.scope==='oral'?'oralClassSearch':'search'] = el.value;
    Notenblick.remember();
    Notenblick.refreshTable(el.dataset.kind);
  }
  if(el.dataset.entrySearch){if(!Notenblick.canLeave()){el.value=Notenblick.W().entrySearch;return;}const kind=el.dataset.entrySearch;Notenblick.W().entrySearch=el.value;const a=Notenblick.data.assessments.find(x=>x.id===Notenblick.W().selected[kind]);Notenblick.$('#entryBody-'+kind).innerHTML=Notenblick.entryRows(a,kind);Notenblick.remember();return;}
  if(el.id==='oral-search'){Notenblick.W().oralSearch=el.value;Notenblick.W().oralPage=0;Notenblick.refreshOralTable();Notenblick.remember();return;}
  if(el.id==='assessmentSearch'){Notenblick.W()[el.dataset.scope==='oral'?'oralListSearch':'assessmentSearch']=el.value;Notenblick.refreshAssessmentList();Notenblick.remember();return;}
  if (el.id === 'adminSearch') {
    Notenblick.ui.adminSearch = el.value;Notenblick.remember();
    Notenblick.$('#adminStudentsTable').innerHTML = Notenblick.studentsTable(Notenblick.adminClass());
  }

});
document.addEventListener('change', e => {
  const el = e.target;
  try {
    if(el.dataset.setting){const key=el.dataset.setting,value=key==='visibleKinds'?[...document.querySelectorAll('[data-setting=visibleKinds]:checked')].map(x=>x.value):el.value;if(!Notenblick.setPreference(key,value)){if(key==='visibleKinds')el.checked=Notenblick.prefs.visibleKinds.includes(el.value);else el.value=String(Notenblick.prefs[key]);}return;}
    if(el.dataset.entryPupil){if(!Notenblick.canLeave())return;const kind=el.dataset.entryPupil,a=Notenblick.data.assessments.find(x=>x.id===Notenblick.W().selected[kind]);Notenblick.W().studentIndex=Notenblick.pointEntryList(a).findIndex(s=>s.id===el.value);Notenblick.renderEntry(kind,'single');Notenblick.remember();Notenblick.$('#entryPupil-'+kind).focus();return;}
    if(el.id==='oralAreaView'){const w=Notenblick.W();if(!Notenblick.canLeave()){el.value=w.oralAreaView;return;}w.oralAreaView=el.value;w.assessmentWorkOpen=false;Notenblick.renderAssessments(Notenblick.kinds.includes(w.view)?w.view:'');Notenblick.$('#oralSettings').open=true;Notenblick.$('#oralAreaView').focus();Notenblick.remember();return;}
    if(el.id==='oralView'){if(Notenblick.canLeave()){Notenblick.showOral(el.value);Notenblick.$('#oralView').focus();}else el.value=Notenblick.W().oralView;return;}
    if(['oralStudentFilter','oralSort'].includes(el.id)){Notenblick.W()[el.id==='oralSort'?'oralSort':'oralStudent']=el.value;Notenblick.W().oralPage=0;Notenblick.refreshOralTable();Notenblick.remember();return;}
    if (el.dataset.entry) {
      Notenblick.entryChange(el);
      return;
    }
    if (['class','course'].includes(el.id)) {
      if (!Notenblick.canLeave()) {Notenblick.fillSelection(); return;}
      Notenblick.chooseContext({classId:Notenblick.val('class'),courseId:el.id==='course'?el.value:undefined});
      Notenblick.$('#'+el.id).focus(); return;
    }
    if (el.id === 'assessmentFilter') {if(!Notenblick.canLeave()){el.value=Notenblick.W().assessmentFilter;return;}Notenblick.W().assessmentFilter=el.value;Notenblick.W().assessmentWorkOpen=false; Notenblick.renderAssessments(); Notenblick.remember(); Notenblick.$('#assessmentFilter').focus(); return;}
    if (el.id === 'pupilSelect') {Notenblick.W().pupil=el.value; Notenblick.renderPupil(); Notenblick.remember(); Notenblick.$('#pupilSelect').focus(); return;}
    if (el.id === 'adminClass') {Notenblick.ui.adminClass=el.value; Notenblick.renderAdmin(); Notenblick.remember(); Notenblick.$('#adminClass')?.focus(); return;}
    if (el.dataset.filter) {
      Notenblick.W()[el.dataset.filter] = el.value;
      Notenblick.refreshTable(el.dataset.kind);
      Notenblick.remember();
      return;
    }
    if (el.id === 'adminYear') {
      Notenblick.ui.adminYear = el.value;
      Notenblick.ui.adminClass = '';
      Notenblick.renderAdmin();
      Notenblick.remember();
      Notenblick.$('#adminYear')?.focus();
    }
    if (el.id === 'showExitedAdmin') {
      Notenblick.ui.showExitedAdmin = el.checked;Notenblick.remember();
      Notenblick.$('#adminStudentsTable').innerHTML = Notenblick.studentsTable(Notenblick.adminClass());
    }
    if (el.id === 'showArchived' || el.id === 'showArchivedSubjects') {
      Notenblick.ui.showArchived = el.checked;
      const id = el.id;
      Notenblick.renderAdmin();
      Notenblick.$('#' + id)?.focus();
    }
  } catch (e) {
    Notenblick.error(e.message);
  }
});
document.addEventListener('keydown', e => {
  const el = e.target;
  if(e.defaultPrevented)return;
  if(e.key==='Escape'){const details=el.closest('details[open]');if(details&&(details.hasAttribute('data-view-options')||details.id==='oralSettings'||details.id==='pupilHistory'||details.classList.contains('result-note'))){details.open=false;details.querySelector('summary').focus();e.preventDefault();return;}}
  // A modal owns Escape and its own input keys. Background details must not
  // consume the native cancel event while a dialog is open.
  if(Notenblick.$('#dialog').open)return;
  if (e.key === 'Enter' && ['grade','points'].includes(el.dataset.entry)) {
    e.preventDefault();
    const result=Notenblick.entryChange(el,{announce:false});
    if (el.getAttribute('aria-invalid') === 'true') {el.focus();return;}
    const {kind,mode:type,entry}=el.dataset;
    if(type==='single'){
      const w=Notenblick.W(),list=Notenblick.pointEntryList(Notenblick.data.assessments.find(a=>a.id===el.dataset.assessment)),next=w.studentIndex+(e.shiftKey?-1:1);
      if(next>=0&&next<list.length){w.studentIndex=next;Notenblick.renderEntry(kind,type);Notenblick.remember();Notenblick.$('#entry-'+kind+'-single [data-entry='+entry+']')?.focus();}
    }else{
      const inputs=[...document.querySelectorAll('#entry-'+kind+'-table [data-entry='+entry+']')],at=inputs.indexOf(el);inputs[at+(e.shiftKey?-1:1)]?.focus();
    }
    if(entry==='points'&&result?.changed)Notenblick.announcePoints(result.assessment,result.result);
  }
  if(e.key==='Escape'){for(const[id,summary]of [['allSelection','allSelectionSummary'],['adminViewDetails','adminViewSummary']])if(Notenblick.$('#'+id)?.open&&!Notenblick.$('#'+summary)?.hidden){Notenblick.$('#'+id).open=false;Notenblick.$('#'+summary).focus();e.preventDefault();return;}}
  if (e.key === 'Escape' && Notenblick.$('#viewDetails')?.open) {
    Notenblick.$('#viewDetails').open = false;
    Notenblick.$('#viewSummary').focus();
  }

});
Notenblick.$('#importFile').addEventListener('change', async e => {
  try {
    if (Notenblick.canLeave()) await Notenblick.importFile(e.target.files[0]);
  } catch (e) {
    Notenblick.error(e.message);
  } finally {
    e.target.value = '';
  }
});
window.addEventListener('beforeunload', e => {
  if (Notenblick.mode !== 'demo' && (Notenblick.setupHasChanges?.() || Notenblick.pending.size || (Notenblick.$('#defaultWeightEditor')?.isConnected&&Notenblick.settingsWeights?.dirty()) || (Notenblick.store ? Notenblick.dirty || Notenblick.saving : Notenblick.sessionWrites > 0))) {
    e.preventDefault();
    e.returnValue = '';
  }
});
document.addEventListener('scroll', e => {
  if (e.target.classList?.contains('table-wrap')) Notenblick.scrolls[Notenblick.ui.course + ':' + (e.target.id || e.target.closest('[role=tabpanel]')?.id)] ={x:e.target.scrollLeft,y:e.target.scrollTop};
}, true);
new MutationObserver(()=>{Notenblick.syncScrollTables();Notenblick.restoreScroll();}).observe(document.body, {
  childList: true,
  subtree: true
});
Notenblick.initTabs();
Notenblick.activateGroup('main', 'notes');
Notenblick.boot().catch(e => {
  Notenblick.error('Notenblick konnte nicht vollständig geöffnet werden. ' + e.message);
  Notenblick.status('Bitte Meldung beachten', 'failed');
});
})(globalThis.Notenblick = globalThis.Notenblick || {});
