'use strict';

module.exports = N => {
  const data = require('./v1260-fixture.cjs')(N, 4);
  const course = data.courses[0];
  data.students = data.students.slice(0, 2);
  course.studentIds = data.students.map(student => student.id);

  data.assessments = data.assessments.slice(0, 3);
  for (const item of data.assessments) {
    item.results = Object.fromEntries(course.studentIds.map(id => [id, item.results[id]]));
  }

  const [studentId] = course.studentIds;
  const points = data.assessments[1];
  points.title = 'Vokabeltest mit einer längeren Bezeichnung – Lernwörter sicher anwenden';
  points.weight = '2';
  points.isGfs = true;
  points.inputMode = 'points';
  points.pointKey = { ...N.defaultPointKey(), maximum: '40' };
  points.participantIds = [studentId];
  points.results = {
    [studentId]: N.pointResult(points, {
      grade: null,
      manualGrade: '2.5',
      status: 'open',
      note: 'Synthetische Rückmeldung',
    }, '32'),
  };
  data.assessments.push({
    id: 'v1290-peer',
    courseId: course.id,
    kind: 'test',
    period: '2',
    date: '2027-03-16',
    title: 'Weitere Leistung',
    weight: '1',
    results: {},
  });
  data.finals.push({
    id: 'v1290-final',
    courseId: course.id,
    studentId,
    period: 'all',
    grade: '2',
    note: 'Synthetisch festgelegte Abschlussnote',
  });
  return N.validate(data);
};
