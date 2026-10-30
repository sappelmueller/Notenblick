'use strict';
module.exports=N=>{
 const d=N.demo();d.appVersion='1.20.3';d.assessments=[];d.finals=[];delete d.previousFinals;delete d.legacyOther;
 const c=d.courses[0];c.weights=N.defaultWeights();c.precision=2;c.rounding='round';c.inactiveStudentIds=[];
 for(const [i,kind]of ['exam','test','oral','oral'].entries()){
  const a={id:'points-'+i,courseId:c.id,title:['Klassenarbeit Punkte','Test Punkte','Mündliche Klassenrunde','Präsentation'][i],kind,date:'2026-10-23',period:'1',weight:i===3?'2':'1',isGfs:i===3,inputMode:'points',pointKey:{...N.defaultPointKey(),maximum:'40',type:'kink'},results:{},...(kind==='oral'?{oralEntry:i===3?'individual':'class'}:{}),...(i===3?{participantIds:[c.studentIds[0]]}:{})};
  for(const [j,id]of c.studentIds.slice(0,i===3?1:4).entries())a.results[id]=N.pointResult(a,{grade:null,status:'open',note:j===1?'Synthetische Rückmeldung':''},['30','24','0',''][j]);
  if(i===0){a.results[c.studentIds[1]].manualGrade='2';a.results[c.studentIds[1]]=N.pointResult(a,a.results[c.studentIds[1]],'24');a.results[c.studentIds[2]]=N.pointResult(a,a.results[c.studentIds[2]],'0',{status:'excluded'});a.results[c.studentIds[3]]={grade:null,status:'absent',note:'Entschuldigt'};}
  d.assessments.push(a);
 }
 d.assessments.push({id:'direct',courseId:c.id,title:'Direkte Klassenarbeit',kind:'exam',date:'2026-10-20',period:'1',weight:'1',isGfs:false,results:{[c.studentIds[0]]:{grade:'2.3',status:'graded',note:''}}});
 N.validate(d);return d;
};
