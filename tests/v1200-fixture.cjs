'use strict';
// Synthetic fixtures exercise closed years, collisions, empty subjects and history.
module.exports=N=>{
 const d=N.upgrade(N.demo()),c=d.courses[0],cl=d.classes[0];c.name='Deutsch / Überblick';
 d.students[1].first=d.students[0].first;d.students[1].last=d.students[0].last;d.students[2].archived=true;c.inactiveStudentIds=[d.students[3].id];
 d.assessments[0].results[c.studentIds[0]].note='Synthetische Bemerkung: ä, ß, <Text> und 2,25.';
 for(const kind of ['homework','notebook'])d.assessments.push({...N.clone(d.assessments[0]),id:'export-'+kind,kind,title:'CON / gleicher Name'});
 const individual={...N.clone(d.assessments[2]),id:'export-individual',title:'Mündliche Einzelnote',participantIds:[c.studentIds[0]],oralEntry:'individual',results:{[c.studentIds[0]]:N.clone(d.assessments[2].results[c.studentIds[0]])}};d.assessments.push(individual);
 d.assessments.push({...N.clone(d.assessments[0]),id:'export-collision'});
 N.setFinal(d,c,c.studentIds[0],'half','2.25','Halbjahr erhalten');N.setFinal(d,c,c.studentIds[0],'annual','3','Zeugnis erhalten');
 d.previousFinals=[{courseId:c.id,studentId:c.studentIds[0],period:'1',grade:'2',note:'Frühere Bemerkung erhalten'}];
 d.courses.push({...N.clone(c),id:'empty-collision',studentIds:[],inactiveStudentIds:[]});
 const oldYear={id:'old-year',label:'2025/26',archived:false},oldClass={...N.clone(cl),id:'old-class',yearId:oldYear.id,name:'9c',halfYearReport:'certificate'},oldCourse={...N.clone(c),id:'old-course',classId:oldClass.id,name:'Geschichte',studentIds:['old-student'],inactiveStudentIds:[]};
 d.years.push(oldYear);d.classes.push(oldClass,{...N.clone(cl),id:'empty-class',name:'CON'});d.courses.push(oldCourse,{...N.clone(c),id:'empty-course',classId:'empty-class',name:'NUL',studentIds:[],inactiveStudentIds:[]});
 d.students.push({id:'old-student',classId:oldClass.id,first:'Ehemaliges',last:'Testkind',archived:false});d.assessments.push({...N.clone(d.assessments[0]),id:'old-assessment',courseId:oldCourse.id,date:'2026-01-12',results:{'old-student':{status:'graded',grade:'2',note:'Altes Schuljahr erhalten'}}});N.setFinal(d,oldCourse,'old-student','half','2');N.setFinal(d,oldCourse,'old-student','annual','3');oldYear.archived=true;d.students.find(s=>s.id==='old-student').archived=true;
 d.legacyOther={version:1,courses:[{courseId:c.id,status:'resolved',overall:{written:'40',oral:'50',homework:'0',notebook:'0',other:'10'}}],assessments:[{...N.clone(d.assessments[0]),id:'legacy-assessment',kind:'other',title:'Historische Leistung erhalten'},{...N.clone(d.assessments[0]),id:'legacy-empty',kind:'other',title:'Leere historische Leistung',results:{}}]};
 N.validate(d);return d;
};
