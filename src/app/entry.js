/* Notenblick – app/entry.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.entryDescription=function(el,invalid=false){const ids=[el.dataset.mode==='single'?'singleName-'+el.dataset.kind:'',invalid?'error':''].filter(Boolean);if(ids.length)el.setAttribute('aria-describedby',ids.join(' '));else el.removeAttribute('aria-describedby');};
Notenblick.entryChange = function entryChange(el,{announce=true}={}) {
  const {
    entry,
    student,
    assessment,
    kind,
    mode: entryMode
  } = el.dataset;
  if (!entry) return;
  try {
    Notenblick.ensureEdit();
    const a = Notenblick.data.assessments.find(a => a.id === assessment);
    if (!a) throw Error('Diese Leistung ist nicht mehr vorhanden.');
    const old = a.results[student] || {
        grade: null,
        status: 'open',
        note: ''
      },
      r = Notenblick.N.clone(old),
      prefix = kind + '-' + entryMode + '-' + student;
    if(entry==='points'){
      Object.assign(r,Notenblick.N.pointResult(a,r,el.value));
      el.value=r.points?.replace('.',',')??'';
      const statusField=Notenblick.$('#s-'+prefix);statusField.value=r.status;Notenblick.pending.delete(statusField.id);statusField.removeAttribute('aria-invalid');Notenblick.entryDescription(statusField);
    }
    if (entry === 'grade') {
      const v = el.value.trim();
      r.grade = v ? Notenblick.N.grade(v) : null;
      r.status = v ? 'graded' : r.status === 'graded' ? 'open' : r.status;
      el.value = r.grade?.replace('.', ',') || '';
      Notenblick.$('#s-' + prefix).value = r.status;
      Notenblick.pending.delete('s-' + prefix);
      Notenblick.$('#s-' + prefix).removeAttribute('aria-invalid');
      Notenblick.entryDescription(Notenblick.$('#s-' + prefix));
    }
    if (entry === 'status') {
      r.status = el.value;
      if(Notenblick.N.isPoints(a))Object.assign(r,Notenblick.N.pointResult(a,r,Notenblick.$('#p-'+prefix).value,{status:r.status}));
      else if (r.status === 'graded') {
        const input = Notenblick.$('#g-' + prefix);
        r.grade = Notenblick.N.grade(input.value);
      } else {
        r.grade = null;
        Notenblick.$('#g-' + prefix).value = '';
        Notenblick.pending.delete('g-' + prefix);
        Notenblick.$('#g-' + prefix).removeAttribute('aria-invalid');
        Notenblick.entryDescription(Notenblick.$('#g-' + prefix));
      }
    }
    if (entry === 'note') r.note = el.value;
    const changed=JSON.stringify(old)!==JSON.stringify(r);
    if (changed) Notenblick.mutate(d => {
      d.assessments.find(a => a.id === assessment).results[student] = r;
    }, {
      refresh: false
    });
    Notenblick.pending.delete(el.id);
    el.removeAttribute('aria-invalid');
    Notenblick.entryDescription(el);
    if (!document.querySelector('[data-entry][aria-invalid=true]')) Notenblick.error();
    Notenblick.updateEntrySummary(kind);
    if(Notenblick.N.isPoints(a)){
      const cell=Notenblick.$('#pointNote-'+prefix);if(cell)cell.innerHTML=Notenblick.pointNoteMarkup(a,r,student,entryMode);
      if(entry==='points'&&changed&&announce)Notenblick.announcePoints(a,r);
    }
    return {changed,assessment:a,result:r};
  } catch (e) {
    el.setAttribute('aria-invalid', 'true');
    Notenblick.entryDescription(el,true);
    Notenblick.pending.add(el.id);
    Notenblick.error(e.message);
    if(entry==='points')el.focus();
  }
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
