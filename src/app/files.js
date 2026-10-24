/* Notenblick – app/files.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.download = function download(name, text, type = 'text/plain;charset=utf-8') {
  if (window.NRDesktop.available) {
    return window.NRDesktop.call('download',{name,text}).then(saved=>{if(saved!==false)Notenblick.announce('Die Datei wurde gespeichert.');}).catch(e=>{if(e.name==='AbortError')return false;e.storageError=true;throw e;});
  }
  const url = URL.createObjectURL(new Blob([text], {
      type
    })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  Notenblick.announce('Die Datei wird gespeichert.');
};
Notenblick.backup = function backup() {
  return Notenblick.download('Notenblick-Sicherung-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json', JSON.stringify({...Notenblick.data,workspace:Notenblick.getWorkspace()},null,2), 'application/json');
};
Notenblick.importFile = async function importFile(file) {
  if (!file) return;
  if (file.size > 256 * 1024 * 1024) throw Error('Diese Sicherung ist zu groß.');
  let restored;
  try {
    restored = Notenblick.N.upgrade(JSON.parse((await file.text()).replace(/^\ufeff/, '')));
  } catch {
    throw Error('Diese Sicherung konnte nicht geöffnet werden. Bitte wähle eine vollständige Sicherung von Notenblick oder Notenraum.');
  }
  Notenblick.confirm('Sicherung wiederherstellen', `Sicherung vom ${new Date(restored.updatedAt).toLocaleString('de-DE')}: ${restored.years.length} Schuljahre, ${restored.classes.length} Klassen, ${restored.students.length} Schüler und ${restored.assessments.length} Leistungen${restored.legacyOther?.assessments.length?' und '+restored.legacyOther.assessments.length+' Leistungen im gesicherten Altbestand':''}. ${Notenblick.store ? 'Die bisherigen Noten werden vorher gesichert.' : 'Dein aktueller Stand wird vor dem Ersetzen zusätzlich aufbewahrt.'}`, () => Notenblick.restoreData(restored), 'Wiederherstellen');
};
Notenblick.restorePoint = async function restorePoint() {
  if (!Notenblick.store) return;
  let dir;
  try {
    dir=await Notenblick.store.root.getDirectoryHandle('Sicherungen');
  } catch {
    throw Error('Es gibt noch keine früheren Speicherstände.');
  }
  const versions = [];
  for await (const [name, h] of dir.entries()) if (h.kind === 'file' && /^(Stand_\d{8,}_[a-zA-Z0-9_-]+|Vor_Wiederherstellung_[a-zA-Z0-9_-]+|Vor_Einstellungen_1-4_[a-zA-Z0-9_-]+|Vor_Muendlich_Zuordnung_[a-zA-Z0-9_-]+)\.json$/.test(name)) {
    try {
      const d = Notenblick.N.validate(JSON.parse((await (await h.getFile()).text()).replace(/^\ufeff/, '')));
      versions.push({
        name,handle:h,
        at:d.updatedAt,revision:d.revision,years:d.years.length,students:d.students.length,assessments:d.assessments.length
      });
    } catch {}
  }
  versions.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||b.revision-a.revision);
  if (!versions.length) throw Error('Es gibt noch keine lesbaren früheren Speicherstände.');
  Notenblick.modal('Speicherstand wiederherstellen', `<div class="field"><label for="restorePoint">Gespeicherter Stand</label><select id="restorePoint">${versions.map((v,i)=>Notenblick.opt(i,new Date(v.at).toLocaleString('de-DE')+' – '+v.years+' Schuljahre, '+v.students+' Schüler, '+v.assessments+' Leistungen'+(v.name.startsWith('Vor_Muendlich_Zuordnung_')?' (vor mündlicher Zuordnung)':v.name.startsWith('Vor_Einstellungen')?' (vor Einstellungsübernahme)':v.name.startsWith('Vor_')?' (vor Wiederherstellung)':''),'0')).join('')}</select></div>`,async()=>{
    const entry=versions[Number(Notenblick.val('restorePoint'))],d=Notenblick.N.validate(JSON.parse((await(await entry.handle.getFile()).text()).replace(/^\ufeff/,'')));
    Notenblick.afterClose=()=>Notenblick.confirm('Aktuellen Stand ersetzen','Der Stand vom '+new Date(d.updatedAt).toLocaleString('de-DE')+' mit '+d.students.length+' Schülern und '+d.assessments.length+' Leistungen ersetzt deine aktuellen Daten. Dein aktueller Stand wird vorher zusätzlich gesichert.',()=>Notenblick.restoreData(d),'Wiederherstellen');
  },'Weiter');
};
Notenblick.output = function output(kind) {
  Notenblick.modal('Notenliste exportieren', `<p>Welche Ausgabe möchtest du erstellen?</p><div class="button-row">${Notenblick.b('print-list', 'Drucken', `data-kind="${kind}"`)}${Notenblick.b('export-text', 'Als Text speichern', `data-kind="${kind}"`)}${Notenblick.b('export-table', 'Für Tabellenprogramm speichern', `data-kind="${kind}"`)}</div>`, null);
};
Notenblick.printList=function(kind){
  const rows=Notenblick.exportRows(kind),c=Notenblick.getCourse();
  let el=Notenblick.$('#printOutput');if(el)el.remove();el=document.createElement('div');el.id='printOutput';el.className='print-output';
  el.innerHTML=`<h1>${Notenblick.esc(c.name+' – Klasse '+Notenblick.getClass().name)}</h1><p>${Notenblick.esc(Notenblick.schoolYear(Notenblick.getYear()))}</p><h2 id="printTitle">Notenübersicht</h2><table aria-labelledby="printTitle"><thead><tr>${rows[0].map(v=>`<th scope="col">${Notenblick.esc(v)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(row=>`<tr>${row.map((v,i)=>i?`<td>${Notenblick.esc(v)}</td>`:`<th scope="row">${Notenblick.esc(v)}</th>`).join('')}</tr>`).join('')}</tbody></table>`;
  document.body.append(el);document.body.classList.add('printing-list');window.print();document.body.classList.remove('printing-list');el.remove();
};
Notenblick.exportRows = function exportRows(kind) {
  const c = Notenblick.getCourse(),
    w = Notenblick.W(),
    list = Notenblick.studentList(),
    assess = Notenblick.N.assessments(Notenblick.data, c.id, 'all').filter(a => a.kind === kind),
    rows = [];
  if (kind === 'overview') {
    rows.push(['Schüler', ...w.columns.map(k => Notenblick.N.KINDS[k] || Notenblick.N.OVERALL[k]), 'Gesamtschnitt', 'Zeugnisnote']);
    for (const s of list) {
      const calc = Notenblick.calculation(c, s.id),
        f = Notenblick.data.finals.find(f => f.courseId === c.id && f.studentId === s.id && f.period === 'all');
      rows.push([Notenblick.studentName(s), ...w.columns.map(k => Notenblick.showAverage(calc.categories[k], c)), Notenblick.showAverage(calc.total, c), f?.grade?.replace('.', ',') || '']);
    }
  } else {
    rows.push(['Schüler', 'Durchschnitt', ...assess.map(a => a.title)]);
    for (const s of list) rows.push([Notenblick.studentName(s), Notenblick.showAverage(Notenblick.calculation(c, s.id).categories[kind], c), ...assess.map(a => a.results[s.id]?.status === 'graded' ? a.results[s.id].grade.replace('.', ',') : a.participantIds&&!a.participantIds.includes(s.id)?'Nicht beteiligt':Notenblick.N.STATUS[a.results[s.id]?.status || 'open'])]);
  }
  return rows;
};
Notenblick.tableExport = function(kind,text=false){
  const c=Notenblick.getCourse(),rows=Notenblick.exportRows(kind);
  const name = Notenblick.N.safePart(Notenblick.getClass().name + ' - ' + c.name + ' - ' + (Notenblick.N.KINDS[kind] || 'Notenübersicht'));
  if (text) {
    const lines = [c.name + ' – Klasse ' + Notenblick.getClass().name + ' – ' + Notenblick.schoolYear(Notenblick.getYear()), ''];
    for (const row of rows.slice(1)) {
      lines.push(row[0]);
      row.slice(1).forEach((value, i) => {
        if (value) lines.push(rows[0][i + 1] + ': ' + value);
      });
      lines.push('');
    }
    return Notenblick.download(name + '.txt', '\ufeff' + lines.join('\r\n'));
  } else {
    const cell = v => {
      let s = String(v ?? '');
      if (/^\s*[=+@-]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    return Notenblick.download(name + '.csv', '\ufeff' + rows.map(r => r.map(cell).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
  }
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
