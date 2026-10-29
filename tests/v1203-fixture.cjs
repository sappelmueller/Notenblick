'use strict';
// Counts model the reported problem. Every person, mark and title is synthetic.
module.exports=N=>{
 const d=N.blank();d.years=[{id:'year-new',label:'2026/27',archived:false},{id:'year-old',label:'2025/26',archived:true}];
 let courseNumber=0;
 for(let clIndex=0;clIndex<5;clIndex++){
  const cl={id:'class-'+clIndex,yearId:clIndex===4?'year-old':'year-new',name:'Testklasse '+(clIndex+1),halfYearReport:'information',archived:false};d.classes.push(cl);
  const pupils=Array.from({length:clIndex===4?1:23},(_,i)=>({id:'pupil-'+clIndex+'-'+i,classId:cl.id,first:'Testkind '+(i+1),last:'Beispiel '+String(i+1).padStart(2,'0'),archived:false}));d.students.push(...pupils);
  for(let j=0;j<(clIndex<2?2:1);j++){const c={id:'course-'+courseNumber++,classId:cl.id,name:'Testfach '+(j+1),studentIds:pupils.map(s=>s.id),weights:N.defaultWeights(),precision:2,rounding:'truncate',lockedPeriods:[],archived:false};d.courses.push(c);}
 }
 const c=d.courses[0];
 for(let i=0;i<16;i++){
  const kind=i<3?'exam':i<7?'test':'oral',individual=i>=7&&i<10,sparse=i>=10&&i<13,results={};
  for(const [n,sid]of c.studentIds.entries())if(!individual||n===i-7)results[sid]={status:sparse&&n!==i-10?'open':'graded',grade:sparse&&n!==i-10?null:String(1+(n+i)%5),note:''};
  d.assessments.push({id:'assessment-'+i,courseId:c.id,period:'1',kind,title:kind==='oral'?'Gleiche mündliche Bewertung':'Synthetische Leistung '+(i+1),date:kind==='oral'?'2026-10-23':'2026-10-'+String(1+i).padStart(2,'0'),weight:'1',isGfs:false,...(individual?{oralEntry:'individual',participantIds:[c.studentIds[i-7]]}:kind==='oral'?{oralEntry:'class'}:{}),results});
 }
 N.validate(d);return d;
};
