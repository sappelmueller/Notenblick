/* Transfers preserve previous records in their original class and year. */
(function(N){'use strict';
N.transferStudent=function(d,sid,targetId){
 const s=d.students.find(x=>x.id===sid),target=d.classes.find(x=>x.id===targetId);
 if(!s||!target||s.classId===targetId)throw Error('Bitte eine andere Zielklasse wählen.');
 if(s.archived)throw Error('Bitte nimm den Schüler vor dem Versetzen wieder auf.');
 const source=d.classes.find(x=>x.id===s.classId);
 if(target.archived||source.archived||d.years.find(y=>y.id===target.yearId).archived||d.years.find(y=>y.id===source.yearId).archived)throw Error('Bitte öffne die beteiligten Schuljahre und Klassen zuerst wieder.');
 if(d.students.some(x=>x.classId===targetId&&!x.archived&&x.first===s.first&&x.last===s.last&&(x.alias||'')===(s.alias||'')))throw Error('Dieser Name ist in der Zielklasse bereits vorhanden. Bitte prüfe den Namenszusatz.');
 const next={...N.clone(s),id:N.id(),classId:targetId,archived:false,originStudentId:s.id};
 s.archived=true;d.students.push(next);
 for(const c of d.courses.filter(c=>c.classId===targetId&&!c.archived))c.studentIds.push(next.id);
 return next;
};
N.copyCourse=function(d,sourceId,targetId,name){
 const source=d.courses.find(c=>c.id===sourceId),target=d.classes.find(c=>c.id===targetId);
 if(!source||!target)throw Error('Bitte ein Fach und eine Zielklasse wählen.');
 if(target.archived||d.years.find(y=>y.id===target.yearId).archived)throw Error('Bitte öffne die Zielklasse und ihr Schuljahr zuerst wieder.');
 if(d.courses.some(c=>c.classId===targetId&&c.name.toLocaleLowerCase('de')===name.toLocaleLowerCase('de')))throw Error('Dieses Fach gibt es in der Klasse bereits.');
 if(N.legacyPending(d,sourceId))throw Error('Bitte prüfe zuerst den Altbestand des bisherigen Fachs.');
 const next={...N.clone(source),id:N.id(),classId:targetId,name,studentIds:d.students.filter(s=>s.classId===targetId&&!s.archived).map(s=>s.id),inactiveStudentIds:[],archived:false,lockedPeriods:[]};
 d.courses.push(next);return next;
};
})(globalThis.NR=globalThis.NR||{});
