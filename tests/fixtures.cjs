// Test data only; excluded from the program ZIP.
module.exports=NR => (function demo() {
  const d = NR.blank(),
    y = {
      id: NR.id(),
      label: '2026/27',
      archived: false
    };
  d.years.push(y);
  const cl = {
    id: NR.id(),
    yearId: y.id,
    name: '6a',
    halfYearReport: 'information',
    archived: false
  };
  d.classes.push(cl);
  const names = [['Anna', 'Beispiel'], ['Ben', 'Fischer'], ['Clara', 'König'], ['David', 'Müller'], ['Elif', 'Öztürk'], ['Felix', 'Schneider']];
  for (const [first, last] of names) d.students.push({
    id: NR.id(),
    classId: cl.id,
    first,
    last,
    archived: false
  });
  const c = {
    id: NR.id(),
    classId: cl.id,
    name: 'Deutsch',
    studentIds: d.students.map(s => s.id),
    weights: NR.defaultWeights(),
    precision: 2,
    rounding: 'round',
    lockedPeriods: [],
    archived: false
  };
  d.courses.push(c);
  for (const [kind, title, date, grades] of [['exam', 'Unfallbericht', '2026-10-08', ['2', '3', '1.5', '4', '2.5', '3']], ['test', 'Wörter verlängern', '2026-10-15', ['1', '2', '2', '3', '2', null]], ['oral', 'Mitarbeit im Oktober', '2026-10-21', ['2', '2.5', '1', '3', '2', '2.5']]]) {
    const a = {
      id: NR.id(),
      courseId: c.id,
      period: '1',
      kind,
      title,
      date,
      weight: '1',
      isGfs: false,
      results: {}
    };
    d.students.forEach((s, i) => a.results[s.id] = {
      grade: grades[i],
      status: grades[i] ? 'graded' : 'makeup',
      note: ''
    });
    d.assessments.push(a);
  }
  return d;
});
