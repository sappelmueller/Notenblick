/* Compatibility archive only. The retired kind never enters the active choice lists. */
(function(N){'use strict';
N.legacyPending=(d,cid)=>d.legacyOther?.courses?.find(x=>x.courseId===cid&&x.status==='pending');
N.migrate130=function(d){
 if(N.isCurrentData(d))return N.validate(d);
 const retired=d.assessments.filter(a=>a.kind==='other');
 const courses=d.courses.filter(c=>retired.some(a=>a.courseId===c.id)||N.Q.from(c.weights.overall.other||'0').cmp(0)>0n);
 if(courses.length){
  if(d.legacyOther)throw Error('Der vorhandene Altbestand muss vor einer weiteren Übernahme geprüft werden.');
  d.legacyOther={version:1,createdAt:new Date().toISOString(),assessments:N.clone(retired),courses:courses.map(c=>({courseId:c.id,overall:{...N.clone(c.weights.overall),other:c.weights.overall.other||'0'},status:'pending'}))};
 }
 d.assessments=d.assessments.filter(a=>a.kind!=='other');
 for(const c of d.courses)delete c.weights.overall.other;
 if(d.preferences?.columns)d.preferences.columns=d.preferences.columns.filter(k=>k!=='other');
 d.appVersion='1.3.0';return N.validate(d);
};
N.legacyProjection=function(d,cid){
 const archive=d.legacyOther,source=archive?.courses.find(x=>x.courseId===cid);if(!source)throw Error('Für dieses Fach gibt es keinen Altbestand.');
 const c=d.courses.find(c=>c.id===cid),items=archive.assessments.filter(a=>a.courseId===cid);
 return{course:{...c,weights:{...c.weights,overall:source.overall}},items:[...N.assessments(d,cid),...items]};
};
N.legacyCalculation=function(d,cid,sid){const {course,items}=N.legacyProjection(d,cid);return N.calculateCore(d,course,sid,'all',{...N.KINDS,other:'Sonstige Leistungen'},{...N.OVERALL,other:'Sonstige Leistungen'},items);};
N.resolveLegacy=function(d,cid,choices,overall){
 const source=N.legacyPending(d,cid);if(!source)throw Error('Dieser Altbestand wurde bereits geprüft.');
 N.weightsValid({overall,written:d.courses.find(c=>c.id===cid).weights.written});
 for(const a of d.legacyOther.assessments.filter(a=>a.courseId===cid)){
  const kind=choices[a.id]||'';if(kind&&!Object.hasOwn(N.KINDS,kind))throw Error('Bitte eine gültige Leistungsart auswählen.');
  if(kind){if(d.assessments.some(x=>x.id===a.id))throw Error('Diese Leistung wurde bereits übernommen.');d.assessments.push({...N.clone(a),kind});}
 }
 const c=d.courses.find(c=>c.id===cid);c.weights.overall=N.clone(overall);
 source.status='resolved';source.resolvedAt=new Date().toISOString();source.choices=N.clone(choices);source.newOverall=N.clone(overall);
 return N.validate(d);
};
})(globalThis.NR=globalThis.NR||{});
