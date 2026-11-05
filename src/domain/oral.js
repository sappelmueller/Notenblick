/* Explicit capture metadata. Old oral records are never inferred from participant count. */
(function(N){'use strict';
N.oralType=a=>a.oralEntry||(a.kind==='oral'?'unclassified':null);
N.isOralIndividual=a=>N.oralType(a)==='individual';
N.oralCandidate=function(a){const ids=a.participantIds||Object.keys(a.results);return ids.length===1&&Object.keys(a.results).every(id=>id===ids[0])?ids[0]:null;};
N.classifyOral=function(d,choices){
 for(const[id,type]of Object.entries(choices)){const a=d.assessments.find(a=>a.id===id);if(!a||(a.kind!=='oral'&&a.oralEntry!=='unclassified')||!['individual','class'].includes(type))throw Error('Bitte eine gültige Zuordnung wählen.');if(type==='individual'){const sid=N.oralCandidate(a);if(!sid)throw Error('Diese Leistung lässt sich keinem einzelnen Schüler eindeutig zuordnen.');a.participantIds=[sid];}a.oralEntry=type;}
 return N.validate(d);
};
N.assessmentProgress=function(d,c,a,{withAverage=true}={}){const list=N.assessmentStudents(d,c,a),values=[];let status=0;for(const s of list){const r=a.results[s.id];if(!N.hasEntry(r))continue;if(r.status==='graded')values.push({value:r.grade});else status++;}return {total:list.length,graded:values.length,status,captured:values.length+status,open:list.length-values.length-status,average:withAverage?N.average(values):null};};
})(globalThis.NR=globalThis.NR||{});
