/* Notenblick – dialogs/administration.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.subjectDialog=function(c=null){
 const A=Notenblick,cl=A.adminClass();A.ensureClassEdit(cl);
 A.modal(c?'Fach bearbeiten':'Fach anlegen',A.field('subjectName','Fachname',c?.name||'','required maxlength="80"')+A.field('subjectCode','Fachkürzel',c?A.subjectCode(c):'','maxlength="16"','text','Für den Schnellzugriff. Ohne Kürzel wird der vollständige Fachname angezeigt.')+(c?`<p>${A.b('toggle-subject',c.archived?'Fach wieder anzeigen':'Fach ausblenden',`data-id="${c.id}"`,'text-button')}</p>`:''),()=>{
  const name=A.required('subjectName','einen Fachnamen'),code=A.val('subjectCode')||(!c&&!A.$('#subjectCode').dataset.edited?A.suggestSubjectCode(name):'');
  if(A.data.courses.some(x=>x.classId===cl.id&&x.id!==c?.id&&x.name.toLocaleLowerCase('de')===name.toLocaleLowerCase('de')))throw Error('Dieses Fach gibt es in der Klasse bereits.');
  if(/[\r\n\u0000-\u001f]/.test(code))throw Error('Bitte ein Kürzel ohne Steuerzeichen eingeben.');
  let cid=c?.id;
  if(!c||name!==c.name)A.mutate(d=>{if(c)d.courses.find(x=>x.id===c.id).name=name;else{cid=A.N.id();d.courses.push({id:cid,classId:cl.id,name,studentIds:d.students.filter(s=>s.classId===cl.id&&!s.archived).map(s=>s.id),inactiveStudentIds:[],...A.newCourseConfig(),lockedPeriods:[],archived:false});}});
  A.prefs.courseCodes[cid]=code;A.remember();
 });
 A.$('#subjectCode').addEventListener('input',e=>e.target.dataset.edited='true');A.$('#subjectName').addEventListener('input',e=>{if(!c&&!A.$('#subjectCode').dataset.edited)A.$('#subjectCode').value=A.suggestSubjectCode(e.target.value);});
};
Notenblick.studentDialog = function studentDialog(s = null) {
  const cl = Notenblick.adminClass(); Notenblick.ensureClassEdit(cl);
  const
    courses = Notenblick.data.courses.filter(c => c.classId === cl.id && !c.archived);
  Notenblick.modal(s ? 'Schüler bearbeiten' : 'Schüler hinzufügen', `<div class="form-grid">${Notenblick.field('first', 'Vorname', s?.first || '', 'required maxlength="100"')}${Notenblick.field('last', 'Nachname', s?.last || '', 'required maxlength="100"')}<div class="full">${Notenblick.field('alias', 'Namenszusatz', s?.alias || '', 'maxlength="80"', 'text', 'Nur nötig, um gleiche Namen zu unterscheiden.')}</div></div><fieldset><legend>Teilnahme an Fächern</legend><div class="check-list">${courses.map(c => `<label class="check"><input name="member" type="checkbox" value="${c.id}"${!s || c.studentIds.includes(s.id) && !(c.inactiveStudentIds || []).includes(s.id) ? ' checked' : ''}>${Notenblick.esc(c.name)}</label>`).join('') || '<p>Noch keine Fächer angelegt.</p>'}</div></fieldset><label class="check" id="duplicateConfirm" hidden><input id="allowDuplicate" type="checkbox">Gleichnamigen Schüler zusätzlich anlegen</label>`, () => {
    const first = Notenblick.required('first', 'den Vornamen'),
      last = Notenblick.required('last', 'den Nachnamen'),
      alias = Notenblick.val('alias'),
      selected = [...document.querySelectorAll('[name=member]:checked')].map(e => e.value);
    const duplicate = Notenblick.data.students.some(x => x.classId === cl.id && x.id !== s?.id && x.first.toLocaleLowerCase('de') === first.toLocaleLowerCase('de') && x.last.toLocaleLowerCase('de') === last.toLocaleLowerCase('de') && (x.alias || '').toLocaleLowerCase('de') === alias.toLocaleLowerCase('de'));
    if (duplicate && !Notenblick.$('#allowDuplicate').checked) {
      Notenblick.$('#duplicateConfirm').hidden = false;
      throw Error('In der Klasse gibt es diesen Namen bereits. Ergänze einen Namenszusatz oder bestätige den zusätzlichen Schüler.');
    }
    Notenblick.mutate(d => {
      let target = s ? d.students.find(x => x.id === s.id) : {
        id: Notenblick.N.id(),
        classId: cl.id,
        archived: false
      };
      Object.assign(target, {
        first,
        last,
        alias
      });
      if (!s) d.students.push(target);
      for (const c of d.courses.filter(c => courses.some(x => x.id === c.id))) {
        if (!c.studentIds.includes(target.id)) c.studentIds.push(target.id);
        c.inactiveStudentIds = (c.inactiveStudentIds || []).filter(id => id !== target.id);
        if (!selected.includes(c.id)) c.inactiveStudentIds.push(target.id);
      }
    });
  });
};
Notenblick.membersDialog = function membersDialog(c) {
  Notenblick.ensureEdit(c);
  const students = Notenblick.sorted(Notenblick.data.students.filter(s => s.classId === c.classId && !s.archived));
  Notenblick.modal('Schüler für ' + c.name + ' auswählen', `<p class="dialog-intro">Bisherige Noten bleiben erhalten, wenn du die Teilnahme beendest.</p><div class="check-list">${students.map(s => `<label class="check"><input name="courseMember" type="checkbox" value="${s.id}"${c.studentIds.includes(s.id) && !(c.inactiveStudentIds || []).includes(s.id) ? ' checked' : ''}>${Notenblick.esc(Notenblick.studentName(s))}</label>`).join('') || 'Noch keine Schüler in der Klasse.'}</div>`, () => {
    const selected = [...document.querySelectorAll('[name=courseMember]:checked')].map(e => e.value);
    Notenblick.mutate(d => {
      const course = d.courses.find(x => x.id === c.id);
      for (const s of students) {
        if (!course.studentIds.includes(s.id)) course.studentIds.push(s.id);
        course.inactiveStudentIds = (course.inactiveStudentIds || []).filter(id => id !== s.id);
        if (!selected.includes(s.id)) course.inactiveStudentIds.push(s.id);
      }
    });
  });
};
Notenblick.setup = function setup() {
  Notenblick.modal('Notenverwaltung einrichten', `<div class="form-grid">${Notenblick.field('setup-year', 'Schuljahr', Notenblick.schoolYearLabel(), 'required maxlength="80"')}${Notenblick.field('setup-class', 'Klasse', '', 'required maxlength="80"')}<div class="full">${Notenblick.field('setup-subject', 'Erstes Fach', '', 'required maxlength="80"')}</div><div class="full">${Notenblick.namesInput('setup-names','Schülerliste (optional)')}</div><label class="check full" id="setupDuplicate" hidden><input type="checkbox" id="setupAllowDuplicate">Gleiche Namen zusätzlich anlegen</label></div>`, () => {
    const label = Notenblick.required('setup-year', 'das Schuljahr'),
      className = Notenblick.required('setup-class', 'die Klasse'),
      subjectName = Notenblick.required('setup-subject', 'das Fach'),
      names = Notenblick.readNames('setup-names',true);
    const seen = new Set();
    let duplicate = false;
    for (const s of names) {
      const key = (s.first + '|' + s.last).toLocaleLowerCase('de');
      if (seen.has(key)) duplicate = true;
      seen.add(key);
    }
    if (duplicate && !Notenblick.$('#setupAllowDuplicate').checked) {
      Notenblick.$('#setupDuplicate').hidden = false;
      throw Error('In der Schülerliste kommen gleiche Namen vor. Prüfe die Liste oder bestätige die zusätzlichen Schüler.');
    }
    Notenblick.mutate(d => {
      const y = {
          id: Notenblick.N.id(),
          label,
          archived: false
        },
        cl = {
          id: Notenblick.N.id(),
          yearId: y.id,
          name: className,
          archived: false
        };
      d.years.push(y);
      d.classes.push(cl);
      const students = names.map(row => ({
        id: Notenblick.N.id(),
        classId: cl.id,
        ...row,
        archived: false
      }));
      d.students.push(...students);
      const c = {
        id: Notenblick.N.id(),
        classId: cl.id,
        name: subjectName,
        studentIds: students.map(s => s.id),
        inactiveStudentIds: [],
        ...Notenblick.newCourseConfig(),
        lockedPeriods: [],
        archived: false
      };
      d.courses.push(c);
      Object.assign(Notenblick.ui, {
        year: y.id,
        class: cl.id,
        course: c.id,
        adminYear: y.id,
        adminClass: cl.id
      });
    });
    Notenblick.remember();
  });
};
Notenblick.parseNames=text=>Notenblick.N.parseNameLines(text,'last-first').map(({first,last,alias})=>({first,last,alias}));
Notenblick.schoolYearLabel = function schoolYearLabel() {
  const now = new Date(),
    year = now.getFullYear() - (now.getMonth() < 7 ? 1 : 0);
  return year + '/' + String(year + 1).slice(-2);
};
Notenblick.yearDialog = function yearDialog(edit = false) {
  const y = edit ? Notenblick.data.years.find(y => y.id === Notenblick.ui.adminYear) : null;
  Notenblick.modal(edit ? 'Schuljahr bearbeiten' : 'Schuljahr anlegen', Notenblick.field('yearLabel', 'Schuljahr', y?.label || Notenblick.schoolYearLabel(), 'required maxlength="80"') + (!edit ? `<div class="field" style="margin-top:18px"><label for="copyYear">Klassen, Schüler und Fächer übernehmen aus</label><select id="copyYear">${Notenblick.opt('', 'Keine Übernahme', '')}${Notenblick.data.years.map(y => Notenblick.opt(y.id, Notenblick.schoolYear(y), '')).join('')}</select><small>Es werden Namen und Gewichtungen übernommen. Die bisherigen Noten bleiben beim bisherigen Schuljahr.</small></div>` : `<p style="margin-top:20px">${Notenblick.b('toggle-year', y.archived ? 'Schuljahr wieder öffnen' : 'Schuljahr abschließen', `data-id="${y.id}"`, 'text-button')}</p>`), () => {
    const label = Notenblick.required('yearLabel', 'das Schuljahr');
    if (Notenblick.data.years.some(x => x.id !== y?.id && x.label.toLocaleLowerCase('de') === label.toLocaleLowerCase('de'))) throw Error('Dieses Schuljahr gibt es bereits.');
    const source = edit ? '' : Notenblick.val('copyYear');
    Notenblick.mutate(d => {
      if (y) d.years.find(x => x.id === y.id).label = label;else {
        const target = {
          id: Notenblick.N.id(),
          label,
          archived: false
        };
        d.years.push(target);
        const copy = d.classes.filter(c => c.yearId === source && !c.archived);
        for (const cl of copy){const next=Notenblick.N.copyClass(d,cl.id,target.id,cl.name);Notenblick.copyClassPresentation(cl.id,next.id,d);}
        Notenblick.ui.adminYear = target.id;
        Notenblick.ui.adminClass = '';
      }
    });
    Notenblick.remember();
  });
};
Notenblick.classDialog = function classDialog(cl = null) {
  if (!Notenblick.ui.adminYear) throw Error('Bitte lege zuerst ein Schuljahr an.');
  if(!cl && Notenblick.data.years.find(y=>y.id===Notenblick.ui.adminYear)?.archived)throw Error('Bitte öffne das Schuljahr zuerst wieder.');
  Notenblick.modal(cl ? 'Klasse bearbeiten' : 'Klasse anlegen', Notenblick.field('className', 'Klassenname', cl?.name || '', 'required maxlength="80"') + (cl ? `<p style="margin-top:20px">${Notenblick.b('toggle-class', cl.archived ? 'Klasse wieder anzeigen' : 'Klasse ausblenden', `data-id="${cl.id}"`, 'text-button')}</p>` : ''), () => {
    const name = Notenblick.required('className', 'einen Klassennamen');
    if (Notenblick.data.classes.some(x => x.yearId === Notenblick.ui.adminYear && x.id !== cl?.id && x.name.toLocaleLowerCase('de') === name.toLocaleLowerCase('de'))) throw Error('Diese Klasse gibt es im Schuljahr bereits.');
    Notenblick.mutate(d => {
      if (cl) d.classes.find(x => x.id === cl.id).name = name;else {
        const target = {
          id: Notenblick.N.id(),
          yearId: Notenblick.ui.adminYear,
          name,
          archived: false
        };
        d.classes.push(target);
        Notenblick.ui.adminClass = target.id;
        Notenblick.ui.adminView = 'students';
      }
    });
    Notenblick.remember();
  });
};
Notenblick.copyClassDialog = function copyClassDialog() {
  if(Notenblick.data.years.find(y=>y.id===Notenblick.ui.adminYear)?.archived)throw Error('Bitte öffne das Schuljahr zuerst wieder.');
  const sources = Notenblick.data.classes.filter(c => c.yearId !== Notenblick.ui.adminYear);
  if (!sources.length) throw Error('Es gibt noch keine Klasse aus einem anderen Schuljahr.');
  Notenblick.modal('Klasse übernehmen', `<div class="field"><label for="sourceClass">Bisherige Klasse</label><select id="sourceClass">${sources.map(c => Notenblick.opt(c.id, Notenblick.schoolYear(Notenblick.data.years.find(y => y.id === c.yearId)) + ' – ' + c.name, '')).join('')}</select></div><div style="margin-top:18px">${Notenblick.field('newClassName', 'Neuer Klassenname', '', 'required maxlength="80"')}</div><p class="hint" style="margin-top:18px">Schüler, Fächer und Gewichtungen werden übernommen. Bisherige Noten bleiben beim bisherigen Schuljahr.</p>`, () => {
    const name = Notenblick.required('newClassName', 'den neuen Klassennamen'),
      source = Notenblick.val('sourceClass');
    Notenblick.mutate(d => {
      const cl = Notenblick.N.copyClass(d, source, Notenblick.ui.adminYear, name);Notenblick.copyClassPresentation(source,cl.id,d);
      Notenblick.ui.adminClass = cl.id;
      Notenblick.ui.adminView = 'students';
    });
    Notenblick.remember();
  }, 'Klasse übernehmen');
};
Notenblick.bulkDialog = function bulkDialog() {
  const cl = Notenblick.adminClass(); Notenblick.ensureClassEdit(cl);
  const
    sources = Notenblick.data.classes.filter(c => c.id !== cl.id);
  Notenblick.modal('Schülerliste übernehmen', `<div class="field"><label for="bulkClass">Aus einer bisherigen Klasse</label><select id="bulkClass">${Notenblick.opt('', 'Keine Auswahl', '')}${sources.map(c => Notenblick.opt(c.id, Notenblick.schoolYear(Notenblick.data.years.find(y => y.id === c.yearId)) + ' – ' + c.name, '')).join('')}</select></div><p class="hint" style="margin-top:18px">Oder füge eine Namensliste ein.</p>${Notenblick.namesInput('bulkNames')}<label class="check" id="bulkDuplicate" hidden style="margin-top:18px"><input type="checkbox" id="bulkAllow">Gleiche Namen zusätzlich übernehmen</label>`, () => {
    const source = Notenblick.val('bulkClass'),
      text = Notenblick.val('bulkNames');
    if (source && text) throw Error('Bitte wähle eine bisherige Klasse oder füge eine Namensliste ein.');
    const rows=Notenblick.readNames('bulkNames');
    if (!rows.length) throw Error('Bitte wähle eine gefüllte Schülerliste oder füge Namen ein.');
    const seen = new Set(Notenblick.data.students.filter(s => s.classId === cl.id).map(s => (s.first + '|' + s.last + '|' + (s.alias || '')).toLocaleLowerCase('de')));
    let duplicates = false;
    for (const r of rows) {
      const key = (r.first + '|' + r.last + '|' + r.alias).toLocaleLowerCase('de');
      if (seen.has(key)) duplicates = true;
      seen.add(key);
    }
    if (duplicates && !Notenblick.$('#bulkAllow').checked) {
      Notenblick.$('#bulkDuplicate').hidden = false;
      throw Error('Einige Namen kommen bereits vor. Prüfe die Liste oder bestätige die zusätzlichen Schüler.');
    }
    Notenblick.mutate(d => {
      for (const row of rows) {
        const s = {
          id: Notenblick.N.id(),
          classId: cl.id,
          ...row,
          archived: false
        };
        d.students.push(s);
        for (const c of d.courses.filter(c => c.classId === cl.id && !c.archived)) c.studentIds.push(s.id);
      }
    });
  }, 'Liste übernehmen');
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
