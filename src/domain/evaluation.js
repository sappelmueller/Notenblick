/* Notenblick – domain/evaluation.js. Shared application API: NR. */
(function (NR) {
'use strict';
const indexes=new WeakMap();
NR.index=function(d){let x=indexes.get(d);if(!x||x.ar!==d.assessments||x.sr!==d.students||x.cr!==d.courses||x.al!==d.assessments.length||x.sl!==d.students.length||x.cl!==d.courses.length){x={ar:d.assessments,sr:d.students,cr:d.courses,al:d.assessments.length,sl:d.students.length,cl:d.courses.length,assessments:new Map(),students:new Map(d.students.map(s=>[s.id,s])),courses:new Map(d.courses.map(c=>[c.id,c]))};for(const a of d.assessments){if(!x.assessments.has(a.courseId))x.assessments.set(a.courseId,[]);x.assessments.get(a.courseId).push(a);}indexes.set(d,x);}return x;};
NR.assessments = function(d,cid,period='all'){const list=NR.index(d).assessments.get(cid)||[];return period==='all'?list.slice():list.filter(a=>a.period===period);};
NR.calculateCore = function(d,c,studentId,period,kinds,overall,list=NR.assessments(d,c.id,period),writtenWeights=c.weights.written) {
  const categories = {},
    counts = {};
  for (const kind of Object.keys(kinds)) {
    const values = list.filter(a => a.kind === kind && a.results[studentId]?.status === 'graded').map(a => ({
      value: a.results[studentId].grade,
      weight: a.weight
    }));
    categories[kind] = NR.average(values);
    counts[kind] = values.length;
  }
  categories.written = NR.average(['exam', 'test'].map(k => ({
    value: categories[k],
    weight: writtenWeights[k]
  })));
  const total = NR.average(Object.keys(overall).map(k => ({
    value: categories[k],
    weight: c.weights.overall[k]
  })));
  const missing = Object.keys(overall).filter(k => NR.Q.from(c.weights.overall[k]).n > 0n && categories[k] === null).map(k => overall[k]);
  if (Object.hasOwn(overall,'written') && NR.Q.from(c.weights.overall.written).n > 0n) for (const k of ['exam', 'test']) if (NR.Q.from(c.weights.written[k]).n > 0n && categories[k] === null) missing.push(kinds[k]);
  return {
    total,
    categories,
    counts,
    missing: [...new Set(missing)]
  };
};
NR.courseMode=c=>c.calculationMode==='direct'?'direct':'grouped';
NR.overallLabels=c=>NR.courseMode(c)==='direct'?NR.KINDS:NR.OVERALL;
NR.writtenWeights=c=>NR.courseMode(c)==='direct'?{exam:c.weights.overall.exam,test:c.weights.overall.test}:c.weights.written;
NR.areaWeight=function(c,k){const o=c.weights.overall;if(NR.courseMode(c)==='direct')return k==='written'?NR.Q.from(o.exam).add(NR.Q.from(o.test)):NR.Q.from(o[k]);return ['exam','test'].includes(k)?NR.Q.from(o.written).mul(NR.Q.from(c.weights.written[k])).div(NR.Q.from(100)):NR.Q.from(o[k]);};
NR.assessmentStudents=(d,c,a,includeArchived=false)=>NR.activeStudents(d,c,includeArchived).filter(s=>!a.participantIds||a.participantIds.includes(s.id));
NR.calculate=function(d,c,sid,period='all'){
 const result=NR.calculateCore(d,c,sid,period,NR.KINDS,NR.overallLabels(c),NR.assessments(d,c.id,period),NR.writtenWeights(c));
 if(NR.legacyPending?.(d,c.id)){result.total=null;result.blocked=true;}
 return result;
};
NR.activeStudents = function activeStudents(d, c, includeArchived = false) {
  const idx=NR.index(d),inactive=new Set(c.inactiveStudentIds||[]);return c.studentIds.map(id=>idx.students.get(id)).filter(s=>s&&(includeArchived||!s.archived&&!inactive.has(s.id)));
};
NR.sorted = function sorted(students, by = 'last', dir = 'asc') {
  const collator = new Intl.Collator('de', {
    numeric: true,
    sensitivity: 'base'
  });
  return [...students].sort((a, b) => (collator.compare(a[by], b[by]) || collator.compare(a[by === 'last' ? 'first' : 'last'], b[by === 'last' ? 'first' : 'last']) || a.id.localeCompare(b.id)) * (dir === 'desc' ? -1 : 1));
};
NR.hasEntry = r => !!r && (r.status === 'graded' ? r.grade !== null && r.grade !== undefined : Object.hasOwn(NR.STATUS,r.status) && r.status !== 'open');
NR.name = (s,format='first-last') => (format==='last-first'?s.last+', '+s.first:s.first+' '+s.last)+(s.alias?' ('+s.alias+')':'');
})(globalThis.NR = globalThis.NR || {});
