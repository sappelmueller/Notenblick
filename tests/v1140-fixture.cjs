'use strict';
// Synthetic only. Dates deliberately contradict old period flags.
module.exports=function(N,count=60){
 const d=N.upgrade(N.demo()),c=d.courses[0];d.students=[];d.assessments=[];d.finals=[];c.studentIds=[];
 for(let i=0;i<count;i++){const s={id:'final-student-'+i,classId:c.classId,first:'Kind',last:'P'+String(i).padStart(3,'0'),archived:false};d.students.push(s);c.studentIds.push(s.id);}
 c.weights={overall:{written:'60',oral:'40',homework:'0',notebook:'0'},written:{exam:'75',test:'25'}};
 for(let i=0;i<6;i++){const a={id:'final-assessment-'+i,courseId:c.id,kind:['exam','test','oral'][i%3],period:i<3?'2':'1',date:i<3?'2027-01-20':'2027-03-15',title:'Leistung '+(i+1),weight:i%3===0?'2':'1',results:{}};for(let j=0;j<count;j++)a.results[c.studentIds[j]]={status:j===3?'excluded':'graded',grade:j===3?null:String(1+(j+i)%21/4),note:''};d.assessments.push(a);}
 if(count)N.setFinal(d,c,c.studentIds[0],'half','2.25','Halbjahresbemerkung');N.validate(d);return d;
};
