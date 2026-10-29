'use strict';
// Entirely synthetic. The private reference supplies counts only, never pupil data.
module.exports=function(N,count=23,many=false){
 const d=require('./v1120-fixture.cjs')(N,count),c=d.courses[0];c.name='Geschichte';c.rounding='truncate';d.finals=[];
 if(!many)d.assessments=d.assessments.filter((a,i)=>[0,1,2,5].includes(i));
 for(const [i,a]of d.assessments.entries()){
  a.title=(a.kind==='exam'?'Klassenarbeit':a.kind==='test'?'Test':a.kind==='oral'?'Klassenrunde':'Leistung')+' '+(i+1);
  for(const [sid,r]of Object.entries(a.results)){r.note='';if(a.kind==='oral'&&!many&&c.studentIds.indexOf(sid)>2){r.status='open';r.grade=null;}}
 }
 if(d.assessments[0])d.assessments[0].results[c.studentIds[0]].note='Individuelle Rückmeldung zur Quellenarbeit.';
 if(count>4){d.assessments[1].results[c.studentIds[4]]={status:'makeup',grade:null,note:''};N.setFinal(d,c,c.studentIds[0],'half','2.25','Entwicklung im Halbjahr');N.setFinal(d,c,c.studentIds[0],'annual','3','Jahresbemerkung');N.setFinal(d,c,c.studentIds[1],'half','1.75');N.setFinal(d,c,c.studentIds[1],'annual','2');}
 const oral=d.assessments.find(a=>a.kind==='oral');for(let i=0;i<(many?12:2);i++){const sid=c.studentIds[i%count];d.assessments.push({...N.clone(oral),id:'individual-202-'+i,title:'Mitarbeit '+(i+1),oralEntry:'individual',participantIds:[sid],weight:'1',isGfs:false,results:{[sid]:{status:'graded',grade:String(2+i%3),note:i===0?'Gezielte mündliche Rückmeldung.':''}}});}
 if(count>22){d.students.at(-2).archived=true;c.inactiveStudentIds=[c.studentIds.at(-1)];}
 N.validate(d);return d;
};
