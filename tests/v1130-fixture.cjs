'use strict';
// Entirely synthetic; different results make search/rounding mistakes visible.
module.exports=function(N,count=8){
 const d=require('./v1120-fixture.cjs')(N,count),c=d.courses[0],ids=c.studentIds;
 d.students.forEach((s,i)=>{s.first='P'+String(i).padStart(3,'0');s.last='Testfamilie';});
 c.weights={overall:{written:'50',oral:'50',homework:'0',notebook:'0'},written:{exam:'80',test:'20'}};
 c.precision=2;c.rounding='round';
 if(count>=8){c.inactiveStudentIds=[ids[6]];d.students[7].archived=true;}
 d.assessments=[];d.finals=[];
 for(const [i,kind,weight]of [[0,'exam','2'],[1,'test','1'],[2,'oral','1'],[3,'exam','1'],[4,'homework','1'],[5,'notebook','1']]){
  const a={id:'average-entry-'+i,courseId:c.id,period:'1',kind,title:'K'+String(i+1).padStart(2,'0'),date:'2026-10-'+String(i+1).padStart(2,'0'),weight,results:{}};
  for(let j=0;j<count;j++)if(j!==3&&kind!=='notebook')a.results[ids[j]]={status:j===4?'absent':'graded',grade:j===4?null:String(1+(j+i*2)%5),note:''};
  if(kind==='oral'){a.participantIds=ids.filter((id,j)=>j!==5);delete a.results[ids[5]];}
  d.assessments.push(a);
 }
 if(ids[0])d.finals.push({id:'average-final',courseId:c.id,studentId:ids[0],period:'all',grade:'2',note:''});
 N.validate(d);return d;
};
