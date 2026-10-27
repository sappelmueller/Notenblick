/* Notenblick – domain/text-lists.js. Shared application API: NR. */
(function (NR) {
'use strict';
NR.safePart = s => String(s).normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0, 90) || 'Ohne_Name';
NR.plain = s => String(s ?? '').replace(/[\r\n\t]/g, ' ');
NR.exportsTXT = function exportsTXT(d) {
  const files = {};
  const clean = s => {
    let n = NR.safePart(String(s).replaceAll('/', '-')).trim();
    if (n.toLocaleLowerCase('de') === 'daten' || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i.test(n)) n = '_' + n;
    return n || 'Ohne Namen';
  };
  const names = (items, fn) => {
    const used = new Set(),
      out = new Map();
    for (const x of items) {
      const base = clean(fn(x));
      let n = base,
        i = 2;
      while (used.has(n.toLocaleLowerCase('de'))) n = base + ' (' + i++ + ')';
      used.add(n.toLocaleLowerCase('de'));
      out.set(x.id, n);
    }
    return out;
  };
  const yn = names(d.years, x => x.label),
    date = s => s.split('-').reverse().join('.');
  const put = (path, lines) => files[path] = '\ufeff' + lines.join('\r\n') + '\r\n';
  for (const y of d.years) {
    const classes = d.classes.filter(c => c.yearId === y.id),
      cn = names(classes, c => c.name);
    for (const cl of classes) {
      const base = yn.get(y.id) + '/' + cn.get(cl.id),
        students = NR.sorted(d.students.filter(s => s.classId === cl.id));
      if (students.length) put(base + '/Schülerliste.txt', [`${cl.name} – ${y.label}`, '', ...students.map(s => NR.name(s) + (s.archived ? ' (ausgeschieden)' : ''))]);
      const courses = d.courses.filter(c => c.classId === cl.id),
        fn = names(courses, c => c.name);
      for (const c of courses) {
        const folder = base + '/' + fn.get(c.id),
          list = NR.assessments(d, c.id, 'all'),
          hasFinal = d.finals.some(f => f.courseId === c.id) || (d.previousFinals || []).some(f => f.courseId === c.id);
        if (!list.length && !hasFinal) continue;
        const head = `${c.name} – Klasse ${cl.name} – ${y.label}`;
        const calculated=new Map(NR.activeStudents(d,c,true).map(s=>[s.id,NR.calculate(d,c,s.id)]));
        const lines = [head, 'Gewichtung: ' + Object.keys(NR.overallLabels(c)).filter(k => NR.Q.from(c.weights.overall[k]).n).map(k => `${NR.overallLabels(c)[k]} ${c.weights.overall[k]} %`).join(', '), NR.courseMode(c)==='direct'?'Berechnung: Leistungsarten einzeln gewichten':'Schriftlich: Klassenarbeiten ' + c.weights.written.exam + ' %, Tests ' + c.weights.written.test + ' %', ''];
        for (const s of NR.sorted(NR.activeStudents(d, c, true))) {
          const result = calculated.get(s.id),
            f = NR.finalFor(d,c.id,s.id,'annual'), h=NR.finalFor(d,c.id,s.id,'half');
          lines.push(NR.name(s) + (s.archived || (c.inactiveStudentIds || []).includes(s.id) ? ' (ausgeschieden)' : ''));
          for (const k of Object.keys(NR.KINDS)) if (result.categories[k] !== null) lines.push(NR.KINDS[k] + ': ' + NR.show(result.categories[k], c));
          if(result.blocked)lines.push('Gesamtschnitt: Altbestand noch prüfen');
          else lines.push('Gesamtschnitt' + (result.total && result.missing.length ? ' (vorläufig)' : '') + ': ' + NR.show(result.total, c));
          lines.push(NR.finalLabel(d,c,'half')+' (manuell festgelegt): '+NR.finalText(h?.grade,h?.reportType||NR.halfType(d,c))+(NR.finalConflict(h,NR.halfType(d,c))?' (bisher: '+NR.FINAL_TYPES[h.reportType]+')':''));
          if(h?.note)lines.push('Bemerkung zum Halbjahr: '+NR.plain(h.note));
          if (f) lines.push('Zeugnisnote: ' + f.grade.replace('.', ','));
          if (f?.note) lines.push('Bemerkung: ' + NR.plain(f.note));
          for (const old of [...(d.previousFinals || []),...d.finals.filter(f=>f.period!=='all'&&!NR.isHalfFinal(f))].filter(x => x.courseId === c.id && x.studentId === s.id)) lines.push('Bisherige Zeugnisnote, Abschnitt ' + old.period + ': ' + old.grade.replace('.', ',') + (old.note ? ' – ' + NR.plain(old.note) : ''));
          lines.push('');
        }
        const avg = NR.average(NR.activeStudents(d, c).map(s => ({
          value: calculated.get(s.id).total
        })));
        if (avg) lines.push('Klassendurchschnitt: ' + NR.show(avg, c));
        put(folder + '/Notenübersicht.txt', lines);
        for (const kind of Object.keys(NR.KINDS)) {
          const entries = list.filter(a => a.kind === kind).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'de') || a.id.localeCompare(b.id));
          const fileNames = names(entries, a => a.date + ' - ' + a.title);
          const kindName = kind === 'oral' ? 'Mündliche Noten' : NR.KINDS[kind];
          for (const a of entries) {
            const lines = [head, a.title, 'Datum: ' + date(a.date)];
            if (NR.Q.from(a.weight).cmp(1) !== 0n) lines.push('Gewichtung: ' + a.weight + '-fach');
            if (a.isGfs) lines.push('GFS');
            lines.push('');
            for (const s of NR.sorted(NR.assessmentStudents(d, c, a, true))) {
              const r = a.results[s.id] || {
                grade: null,
                status: 'open',
                note: ''
              };
              lines.push(NR.name(s) + (s.archived || (c.inactiveStudentIds || []).includes(s.id) ? ' (ausgeschieden)' : '') + ': ' + (r.status === 'graded' ? r.grade.replace('.', ',') : NR.STATUS[r.status]));
              if (r.note) lines.push('  ' + NR.plain(r.note));
            }
            const avg = NR.average(NR.activeStudents(d, c).map(s => a.results[s.id]).filter(r => r?.status === 'graded').map(r => ({
              value: r.grade
            })));
            if (avg) lines.push('', 'Durchschnitt der teilnehmenden Schüler: ' + NR.show(avg, c));
            put(folder + '/' + kindName + '/' + fileNames.get(a.id) + '.txt', lines);
          }
        }
      }
    }
  }
  return files;
};
})(globalThis.NR = globalThis.NR || {});
