'use strict';
module.exports=(N,count=8)=>{
 const d=N.blank();d.appVersion='1.26.0';d.years=[{id:'year126',label:'2026/27',startYear:2026,archived:false}];d.classes=[{id:'class126',yearId:'year126',name:'7a',halfYearReport:'information',archived:false}];
 for(let i=0;i<6;i++)d.students.push({id:'p126-'+i,classId:'class126',first:i===0?'Anna':'Vorname '+i,last:i===0?'Beispiel':'Nachname '+i,archived:false});
 const c={id:'course126',classId:'class126',name:'Mathematik',studentIds:d.students.map(s=>s.id),inactiveStudentIds:[],areas:N.newAreas(),writtenIds:['exam','test'],writtenName:'Schriftlich',calculationMode:'direct',weights:{overall:{exam:'50',test:'10',oral:'40'},written:{exam:'80',test:'20'}},precision:2,rounding:'truncate',lockedPeriods:[],archived:false};d.courses=[c];
 for(let i=3;i<count;i++){const id='area126-'+i;c.areas.push({id,name:i===3?'Kopfrechnen':i===4?'Referate & Präsentationen':i===5?'Projektarbeit mit einer längeren verständlichen Bezeichnung':'Bereich '+(i+1)});c.weights.overall[id]='0';}
 for(let i=0;i<count;i++){const kind=c.areas[i].id;d.assessments.push({id:'assessment126-'+i,courseId:c.id,kind,period:i%2?'2':'1',date:i%2?'2027-03-15':'2026-11-05',title:'Bewertung '+(i+1),weight:i===3?'2':'1',isGfs:false,...(kind==='oral'?{oralEntry:'class'}:{}),results:Object.fromEntries(c.studentIds.slice(0,i===2?4:6).map((sid,j)=>[sid,{grade:String(1+(i+j)%5),status:'graded',note:j===0?'Synthetische Bemerkung zu '+(i+1):''}]))});}
 return N.validate(d);
};
