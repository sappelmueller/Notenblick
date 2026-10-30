/* Notenblick – views/grades.js. Shared application API: Notenblick. */
(function (Notenblick) {
  'use strict';

  Notenblick.renderNotes = function renderNotes() {
    Notenblick.$('#notesStart').hidden = true;
    Notenblick.$('#notesWork').hidden = false;
    Notenblick.fillSelection();
    const c = Notenblick.getCourse(),
      cl = Notenblick.getClass();
    if(c)Notenblick.ui.lastNotesCourse=c.id;
    Notenblick.$('#subjectTitle').textContent = c ? c.name + ' – Klasse ' + cl.name : 'Noten';
    const year=Notenblick.getYear();Notenblick.$('#subjectYear').textContent=year?(Notenblick.schoolYear(year)+(year.archived?' · Abgeschlossen':'')):'';
    Notenblick.$('#historicalAction').innerHTML=Notenblick.ui.historicalYear?Notenblick.b('current-year','Zum Arbeitsjahr','','text-button'):'';
    const pending=c&&Notenblick.N.legacyPending(Notenblick.data,c.id);Notenblick.$('#legacyNotice').innerHTML=pending?`<div class="notice"><p>Gesicherte Leistungen aus einer früheren Version müssen noch geprüft werden. Der Gesamtdurchschnitt wird bis zur Bestätigung nicht neu berechnet.</p>${Notenblick.b(Notenblick.readonly(c)?'legacy-archive':'legacy-review',Notenblick.readonly(c)?'Altbestand ansehen':'Altbestand prüfen',`data-id="${c.id}"`)}</div>`:'';
    Notenblick.$('#notesWork [data-action="weights"]').disabled = !c;
    Notenblick.activateGroup('notes', Notenblick.W().view);
  };
  Notenblick.showNotesPane = function showNotesPane(key) {
    if(key!=='overview')Notenblick.$('#hiddenAssessmentWorkspace')?.remove();
    if (!Notenblick.getCourse()) {
      Notenblick.setContent(Notenblick.notePanel(key), `<div class="blank"><h2>${!Notenblick.data.years.length ? 'Notenverwaltung einrichten' : !Notenblick.getClass() ? 'Klasse anlegen' : 'Fach anlegen'}</h2><p>${!Notenblick.data.years.length ? 'Beginne mit deinem ersten Schuljahr.' : 'Ergänze die Klasse und ihre Fächer in der Verwaltung.'}</p>${!Notenblick.data.years.length ? (Notenblick.firstRun?Notenblick.b('setup','Jetzt einrichten','','button primary'):Notenblick.b('new-year','Schuljahr anlegen','','button primary')) : Notenblick.b('open-admin','Zur Verwaltung','','button primary')}</div>`,'Notenübersicht');return;
    }
    if (key === 'overview') Notenblick.renderOverview();
    else if (key === 'assessments'||Notenblick.kinds.includes(key)) Notenblick.renderAssessments(key==='assessments'?'':key);
    else Notenblick.renderPupil();
  };

  Notenblick.studentList = function studentList(kind='') {
    const w = Notenblick.W(),
      term = (kind==='oral'?w.oralClassSearch:w.search).toLocaleLowerCase('de');
    return Notenblick.sorted(Notenblick.N.activeStudents(Notenblick.data, Notenblick.getCourse(), w.showExited), w.sortBy, w.sortDir).filter(s => Notenblick.matchesStudent(s,term));
  };
  Notenblick.sortTools=function(prefix,viewOptions=false){const A=Notenblick,w=A.W();return `<div class="toolbar"><div class="field search-field"><label for="${prefix}-search">Schüler suchen</label><input id="${prefix}-search" type="search" data-filter="search" data-kind="${prefix}" value="${A.esc(w.search)}" placeholder="Vor- oder Nachname"></div><div class="right button-row">${viewOptions?`<details class="view-options" data-view-options id="viewDetails"><summary id="viewSummary">Ansicht anpassen</summary><form role="none" id="viewForm" class="pop">${A.sortFields(prefix)}<fieldset><legend>Spalten</legend><div class="check-list">${['written',...A.kinds].map(k=>`<label class="check"><input name="column" type="checkbox" value="${k}"${w.columns.includes(k)?' checked':''}>${A.N.KINDS[k]||A.N.OVERALL[k]}</label>`).join('')}</div></fieldset><label class="check"><input name="showExited" type="checkbox"${w.showExited?' checked':''}>Ehemalige anzeigen</label><button class="button primary small" type="submit">Ansicht speichern</button></form></details>`:''}</div></div>`;};
  Notenblick.addPerformanceMenu=()=>Notenblick.menu('add-performance','',[
    {action:'new-assessment',label:'Klassenarbeit',attrs:'data-kind="exam" data-fixed="true"'},
    {action:'new-assessment',label:'Test',attrs:'data-kind="test" data-fixed="true"'},
    {action:'oral-picker',label:'Mündliche Note'},
    {action:'new-assessment',label:'Hausaufgabe',attrs:'data-kind="homework" data-fixed="true"'},
    {action:'new-assessment',label:'Heftbewertung',attrs:'data-kind="notebook" data-fixed="true"'}
  ],'Leistung hinzufügen','button primary').replace('data-menu-toggle', 'data-menu-toggle'+(Notenblick.readonly()?' disabled':''));
  Notenblick.renderOverview = function renderOverview() {
    const A=Notenblick,c=A.getCourse(),w=A.W(),hidden=A.prefs.notesLayout==='kinds'?A.selectAssessments(A.data,c.id).filter(a=>!A.prefs.visibleKinds.includes(a.kind)):[],selected=w.assessmentWorkOpen&&hidden.find(a=>a.id===w.assessmentId&&!A.N.isOralIndividual(a)),key=A.seq+':'+c.id+':'+A.prefs.notesLayout+':'+A.prefs.visibleKinds.join(',')+':'+(selected?.id||'');
    if(A.rendered.overview!==key){
      A.setContent('overview', A.viewHeader('Notenübersicht','overviewTitle',A.addPerformanceMenu()+A.finalMenu(),'overview')+A.sortTools('overview',true)+`<div class="table-panel"><div class="table-header"><p class="subtle">${A.N.activeStudents(A.data,c).length} Schüler</p></div><div class="table-wrap" id="overviewTable">${A.overviewTable()}</div></div>`+(hidden.length?`<details id="hiddenPerformances"${selected?' open':''}><summary>Ausgeblendete Leistungsarten</summary><p class="hint">Hier kannst du vorhandene Leistungen öffnen. Die Registerkarten bleiben ausgeblendet.</p><div class="table-wrap"><table aria-label="Ausgeblendete Leistungsarten"><thead><tr><th scope="col">Bezeichnung</th><th scope="col">Datum</th><th scope="col">Leistungsart</th><th scope="col">Erfasst</th><th scope="col">Aktion</th></tr></thead><tbody>${A.assessmentRows(hidden,selected)}</tbody></table></div></details>`:''));
      A.rendered.overview=key;
    }
    if(selected&&!A.$('#hiddenAssessmentWorkspace')){
      A.$('#overview').insertAdjacentHTML('beforeend',`<div class="entry-workspace" id="hiddenAssessmentWorkspace"><div id="${selected.kind}"></div></div>`);delete A.rendered[selected.kind];w.selected[selected.kind]=selected.id;A.renderKind(selected.kind);
    }
  };
  Notenblick.overviewTable = function overviewTable() {
    const c = Notenblick.getCourse(),
      w = Notenblick.W(),
      list = Notenblick.studentList(),
      averages = Notenblick.classAverages(c);
    return `<table aria-labelledby="overviewTitle"><thead><tr><th scope="col">Schüler</th>${w.columns.map(k => `<th scope="col">${Notenblick.N.KINDS[k] || Notenblick.N.OVERALL[k]}</th>`).join('')}<th scope="col">Gesamtschnitt</th><th scope="col">${Notenblick.N.finalLabel(Notenblick.data,c,'half')}</th><th scope="col">Zeugnisnote</th></tr></thead><tbody>${list.map(s => {
      const r = Notenblick.calculation(c, s.id);
      return `<tr><th scope="row">${Notenblick.b('student', Notenblick.rowName(s), `data-id="${s.id}"`, 'person')}${s.archived || (c.inactiveStudentIds || []).includes(s.id) ? '<span class="secondary"><span class="sr-only">, </span>'+Notenblick.N.participationLabel(s,c)+'</span>' : ''}</th>${w.columns.map(k => `<td>${Notenblick.display(r.categories[k], c)}</td>`).join('')}<td>${Notenblick.display(r.total, c, true)}</td><td>${Notenblick.finalCell(s,'half')}</td><td>${Notenblick.finalCell(s,'annual')}</td></tr>`;
    }).join('') || `<tr><td class="empty-cell" colspan="${w.columns.length + 4}">Keine passenden Schüler.</td></tr>`}</tbody><tfoot><tr><th scope="row">Klassendurchschnitt</th>${w.columns.map(k => `<td>${Notenblick.display(averages.categories[k], c)}</td>`).join('')}<td>${Notenblick.display(averages.total, c, true)}</td><td>${Notenblick.display(averages.finals.half, c)}</td><td>${Notenblick.display(averages.finals.annual, c)}</td></tr></tfoot></table>`;
  };
  Notenblick.renderKind = function renderKind(kind) {
    if (!Notenblick.getCourse()) return;
    const key = kind + ':' + Notenblick.ui.course + ':' + Notenblick.seq;
    if (Notenblick.rendered[kind] === key) return;
    const c = Notenblick.getCourse(), w = Notenblick.W(), selected = Notenblick.data.assessments.find(a=>a.id===w.selected[kind] && a.courseId===c.id);
    if (!selected) return;
    Notenblick.$('#' + kind).innerHTML = `<div class="entry-heading"><div><h3 id="assessmentWorkTitle" tabindex="-1">Noteneingabe</h3><p class="assessment-name">${Notenblick.performanceLabel(selected)}: ${Notenblick.esc(selected.title)}</p><p class="assessment-meta"><span class="sr-only">, </span>${Notenblick.date(selected.date)} · <span id="entry-summary-${kind}">${Notenblick.progressText(selected)}</span>${Notenblick.performanceFlags(selected)?' · '+Notenblick.performanceFlags(selected):''}</p></div><div class="button-row">${['exam','test','oral'].includes(kind)?Notenblick.b('assessment-export','Diese Leistung exportieren',`data-id="${selected.id}"`,'button'):''}${Notenblick.b('assessment-list','Eingabe schließen','','text-button')}</div></div>${Notenblick.pointSettingsMarkup(selected)}<ul class="tabs small-tabs entry-tabs" id="entryTabs-${kind}"><li><a href="#entry-${kind}-table" id="entry-tab-${kind}-table" data-key="table">Alle Schüler</a></li><li><a href="#entry-${kind}-single" id="entry-tab-${kind}-single" data-key="single">Einzeln</a></li></ul><p id="currentEntryPupil" class="hint" hidden></p><div id="entry-${kind}-table"></div><div id="entry-${kind}-single" hidden></div>`;
    if (selected) {
      Notenblick.groups['entry-' + kind] = Notenblick.bind('entryTabs-' + kind, ['table', 'single'], (type, update) => {
        Notenblick.W().entryMode = type;
        Notenblick.renderEntry(kind, type);
        if (update) Notenblick.remember();
      });
      Notenblick.groups['entry-' + kind].activate(Notenblick.$('#entry-tab-' + kind + '-' + w.entryMode), false, false);
      Notenblick.updateEntrySummary(kind);
      Notenblick.bindPointSettings(selected);
    }
    Notenblick.rendered[kind] = key;
  };
  Notenblick.entryList = function entryList(a=null) {
    const w = Notenblick.W();
    return Notenblick.sorted((a?Notenblick.N.assessmentStudents(Notenblick.data,Notenblick.getCourse(),a):Notenblick.N.activeStudents(Notenblick.data, Notenblick.getCourse())), w.sortBy, w.sortDir);
  };
  Notenblick.readonly = function readonly(c=Notenblick.getCourse()) {
    const cl=Notenblick.data.classes.find(x=>x.id===c?.classId),y=Notenblick.data.years.find(x=>x.id===cl?.yearId);return !!(y?.archived||cl?.archived||c?.archived);
  };
  Notenblick.renderEntry = function renderEntry(kind, type) {
    const a = Notenblick.data.assessments.find(a => a.id === Notenblick.W().selected[kind]),
      list = Notenblick.pointEntryList(a),
      w = Notenblick.W();
    if (!a) return;
    const current=Notenblick.$('#currentEntryPupil');if(current)current.hidden=type==='single'||!current.textContent;
    const target = Notenblick.$('#entry-' + kind + '-' + type);
    w.studentIndex = Math.max(0, Math.min(w.studentIndex, list.length - 1));
    target.innerHTML = type === 'table' ? `<div class="field search-field"><label for="entrySearch-${kind}">Schüler suchen</label><input type="search" id="entrySearch-${kind}" data-entry-search="${kind}" value="${Notenblick.esc(w.entrySearch)}"></div><div class="table-panel"><div class="table-header"><h4 id="entryInputTitle-${kind}">Alle Schüler</h4></div><div class="table-wrap"><table class="entry-table" aria-labelledby="entryInputTitle-${kind}"><thead><tr><th scope="col">Schüler</th>${Notenblick.N.isPoints(a)?'<th scope="col">Punkte</th>':''}<th scope="col">Note</th><th scope="col">Status</th><th scope="col">Bemerkung</th></tr></thead><tbody id="entryBody-${kind}">${Notenblick.entryRows(a,kind)}</tbody></table></div></div>` : list.length ? `<div class="single"><div class="field"><label for="entryPupil-${kind}">Schüler</label><select id="entryPupil-${kind}" data-entry-pupil="${kind}">${list.map(s=>Notenblick.opt(s.id,Notenblick.studentName(s),list[w.studentIndex].id)).join('')}</select></div><p class="single-count">Schüler ${w.studentIndex + 1} von ${list.length}</p><h4 id="singleName-${kind}" tabindex="-1">${Notenblick.esc(Notenblick.studentName(list[w.studentIndex]))}</h4>${Notenblick.entryFields(a, list[w.studentIndex], kind, type, false)}<div class="button-row">${Notenblick.b('prev', 'Vorheriger Schüler', `data-kind="${kind}"${w.studentIndex === 0 ? ' disabled' : ''}`)}${Notenblick.b('next', 'Nächster Schüler', `data-kind="${kind}"${w.studentIndex === list.length - 1 ? ' disabled' : ''}`)}${Notenblick.b('next-empty','Nächster ohne Eintrag',`data-kind="${kind}"${list.some(s=>!Notenblick.N.hasEntry(a.results[s.id]))?'':' disabled'}`)}</div></div>` : '<p>Keine teilnehmenden Schüler.</p>';
  };
  Notenblick.entryRows=function(a,kind){const term=Notenblick.W().entrySearch.toLocaleLowerCase('de');return Notenblick.entryList(a).filter(s=>Notenblick.matchesStudent(s,term)).map(s=>`<tr><th scope="row">${Notenblick.rowName(s)}</th>${Notenblick.entryFields(a,s,kind,'table',true)}</tr>`).join('')||`<tr><td colspan="${Notenblick.N.isPoints(a)?5:4}" class="empty-cell">Keine passenden Schüler.</td></tr>`;};
  Notenblick.entryFields = function entryFields(a, s, kind, type, table) {
    const r = a.results[s.id] || {
        grade: null,
        status: 'open',
        note: ''
      },
      prefix = kind + '-' + type + '-' + s.id,
      attrs = `data-student="${s.id}" data-assessment="${a.id}" data-kind="${kind}" data-mode="${type}"`,
      disabled = (Notenblick.readonly() ? ' disabled' : '')+(table?'':' aria-describedby="singleName-'+kind+'"'),
      label = table ? 'class="sr-only"' : '';
    const points=Notenblick.N.isPoints(a);
    const pointField=`<label ${label} for="p-${prefix}">Punkte</label><input class="grade-field" id="p-${prefix}" data-entry="points" ${attrs} inputmode="decimal" value="${Notenblick.esc(r.points?.replace('.',',')??'')}" autocomplete="off"${disabled}>`;
    return [...(points?[pointField,`<span ${table?'class="sr-only"':''}>Note</span><div id="pointNote-${prefix}">${Notenblick.pointNoteMarkup(a,r,s.id)}</div>`]:[`<label ${label} for="g-${prefix}">Note</label><input class="grade-field" id="g-${prefix}" data-entry="grade" ${attrs} inputmode="decimal" value="${Notenblick.esc(r.grade?.replace('.', ',') || '')}" autocomplete="off"${disabled}>`]), `<label ${label} for="s-${prefix}">Status</label><select class="status-field" id="s-${prefix}" data-entry="status" ${attrs}${disabled}>${Object.entries(Notenblick.N.STATUS).map(([k, l]) => Notenblick.opt(k, l, r.status)).join('')}</select>`, `<label ${label} for="n-${prefix}">Bemerkung</label><textarea class="note-field" id="n-${prefix}" data-entry="note" ${attrs} maxlength="2000" rows="${table?1:3}"${disabled}>${Notenblick.esc(r.note)}</textarea>`].map(x => table ? '<td>' + x + '</td>' : '<div class="field">' + x + '</div>').join('');
  };
  Notenblick.updateEntrySummary = function updateEntrySummary(kind) {
    const a = Notenblick.data.assessments.find(a => a.id === Notenblick.W().selected[kind]),
      el = Notenblick.$('#entry-summary-' + kind);
    if (!a || !el) return;
    el.textContent=Notenblick.progressText(a);
    if(Notenblick.$('#matrixTable'))Notenblick.refreshTable('matrix');
    const cell=Notenblick.$('[data-progress="'+a.id+'"]');if(cell)cell.innerHTML=Notenblick.progressCell(a);
    const next=Notenblick.$('[data-action="next-empty"]');if(next)next.disabled=!Notenblick.pointEntryList(a).some(s=>!Notenblick.N.hasEntry(a.results[s.id]));
  };
  Notenblick.refreshTable = function refreshTable(kind) {
    const c = Notenblick.getCourse();
    if (!c) return;
    if(kind==='matrix'){const el=Notenblick.$('#matrixTable');if(el)el.innerHTML=Notenblick.matrixTable(el.dataset.kind);return;}
    if(kind==='overview')Notenblick.$('#overviewTable').innerHTML=Notenblick.overviewTable();
  };
})(globalThis.Notenblick = globalThis.Notenblick || {});
