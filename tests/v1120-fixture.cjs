'use strict';
module.exports=function(N,count=28){
 const d=N.upgrade(N.demo()),c=d.courses[0],cl=d.classes[0];d.students=[];c.studentIds=[];d.assessments=[];d.finals=[];
 for(let i=0;i<count;i++){const id='synthetic-pupil-'+i;d.students.push({id,classId:cl.id,first:i<2?'Gleichnamig':'Vorname'+i,last:i<2?'Testfamilie':i===2?'SehrlangerTestfamilienname'.repeat(3):'Testfamilie'+i,archived:false});c.studentIds.push(id);}
 for(let i=0;i<36;i++){const kind=['exam','test','oral','homework','notebook'][i%5],a={id:'synthetic-entry-'+i,courseId:c.id,period:'1',kind,title:'Leistung '+String(i).padStart(3,'0')+', ausführliche synthetische Bezeichnung',date:'2026-'+(i<24?'10':'09')+'-'+String(1+i%24).padStart(2,'0'),weight:i===0?'2':'1',isGfs:i===0,results:{}};for(let j=0;j<count-1;j++)a.results[c.studentIds[j]]={grade:j%4===0?null:String(1+j%5),status:j%4===0?'absent':'graded',note:'Synthetische Bemerkung '+i};d.assessments.push(a);}
 if(count>1)d.finals.push({id:'synthetic-final',courseId:c.id,studentId:c.studentIds[1],period:'all',grade:'2',note:'Synthetisch festgelegt'});
 N.validate(d);return d;
};
