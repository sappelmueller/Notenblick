'use strict';
module.exports=function(N,amount=250){
 const data=N.upgrade(N.demo()),c=data.courses[0],cl=data.classes[0];data.appVersion='1.8.0';
 for(let i=0;i<54;i++){const id='synthetic-student-'+i;data.students.push({id,classId:cl.id,first:'Vorname'+i,last:'Testfamilie'+i,archived:false});c.studentIds.push(id);}
 const ids=c.studentIds;
 for(let i=0;i<amount;i++){const sid=ids[i%ids.length];data.assessments.push({id:'synthetic-oral-'+i,courseId:c.id,period:'1',kind:'oral',oralEntry:'individual',participantIds:[sid],title:i%2?'Mitarbeit':'Unterrichtsgespräch mit ausführlicher individueller Bezeichnung '+('Langtext '.repeat(8)).trim(),date:'2026-10-'+String(1+i%24).padStart(2,'0'),weight:i===0?'2':'1',isGfs:i===0,results:{[sid]:{grade:i===1?null:String(1+i%5),status:i===1?'absent':'graded',note:'Ausführliche synthetische Bemerkung. '.repeat(40)+'\nWeitere Zeile.'}}});}
 data.assessments.push({id:'synthetic-group',courseId:c.id,period:'1',kind:'oral',oralEntry:'class',participantIds:ids.slice(0,3),title:'Bewertungsrunde für drei Schüler',date:'2026-10-24',weight:'1',results:{[ids[0]]:{grade:'2',status:'graded',note:''},[ids[1]]:{grade:null,status:'absent',note:''}}});
 data.years.push({id:'historical-year',label:'2024/25',archived:true});data.classes.push({id:'historical-class',yearId:'historical-year',name:'6a aus früherem Schuljahr',archived:false});data.students.push({id:'historical-student',classId:'historical-class',first:'Historischer',last:'Testschüler',archived:false});data.courses.push({...N.clone(c),id:'historical-course',classId:'historical-class',name:'Deutsch im historischen Schuljahr',studentIds:['historical-student']});
 data.assessments.push({id:'historical-oral',courseId:'historical-course',period:'1',kind:'oral',oralEntry:'individual',participantIds:['historical-student'],title:'Historische Bezeichnung unverändert',date:'2025-05-05',weight:'3',isGfs:true,results:{'historical-student':{grade:'1.75',status:'graded',note:'Historische Bemerkung'}}});
 N.validate(data);return data;
};
