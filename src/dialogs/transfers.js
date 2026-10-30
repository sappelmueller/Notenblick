(function(A){'use strict';
A.transferDialog=function(id){
 const s=A.getStudent(id),source=A.data.classes.find(c=>c.id===s.classId);
 const list=A.classesByYear(A.data.classes.filter(c=>c.id!==s.classId&&!c.archived&&!A.data.years.find(y=>y.id===c.yearId).archived));
 if(!list.length)throw Error('Lege zuerst eine weitere aktive Klasse an.');
 A.modal('Schüler versetzen',`<p>${A.esc(A.studentName(s))} · Klasse ${A.esc(source.name)}</p><div class="field"><label for="targetClass">Zielklasse</label><select id="targetClass">${list.map(c=>A.opt(c.id,A.schoolYear(A.data.years.find(y=>y.id===c.yearId))+' – '+c.name,'')).join('')}</select></div><p class="hint">Die bisherigen Noten bleiben in der bisherigen Klasse erhalten. In der Zielklasse beginnt eine neue Fachteilnahme; die bisherigen Noten bleiben in der Schüleransicht einsehbar.</p>`,()=>{
  let targetStudent='';A.mutate(d=>{const next=A.N.transferStudent(d,id,A.val('targetClass'));targetStudent=next.id;A.ui.adminClass=next.classId;A.ui.adminYear=d.classes.find(c=>c.id===next.classId).yearId;});A.remember();A.afterClose=()=>[...document.querySelectorAll('[data-menu-key]')].find(e=>e.dataset.menuKey==='student-'+targetStudent)?.focus();
 },'Versetzen');
};
A.copyCourseDialog=function(){
 const cl=A.adminClass(),list=A.data.courses;
 if(!list.length)throw Error('Es ist noch kein Fach zum Übernehmen vorhanden.');
 A.modal('Fach übernehmen – Klasse '+cl.name,`<div class="field"><label for="sourceCourse">Vorhandenes Fach</label><select id="sourceCourse">${list.map(c=>{const x=A.data.classes.find(x=>x.id===c.classId),y=A.data.years.find(y=>y.id===x.yearId);return A.opt(c.id,A.schoolYear(y)+' – '+x.name+' – '+c.name,'');}).join('')}</select></div>${A.field('copyCourseName','Fachname','','required maxlength="80"')}<p class="hint">Gewichtung, Rundung und Nachkommastellen werden übernommen. Alte Noten bleiben im bisherigen Fach.</p>`,()=>{A.mutate(d=>{const source=A.val('sourceCourse'),target=A.N.copyCourse(d,source,cl.id,A.required('copyCourseName','einen Fachnamen'));A.copyCoursePresentation(source,target.id);});A.remember();},'Übernehmen');
 A.$('#copyCourseName').value=list[0].name;
 A.$('#sourceCourse').addEventListener('change',e=>A.$('#copyCourseName').value=list.find(c=>c.id===e.target.value).name);
};
A.classNotes=function(id){const cl=A.data.classes.find(x=>x.id===id),list=A.data.courses.filter(c=>c.classId===id);if(!list.length)throw Error('Lege zuerst ein Fach in dieser Klasse an.');
 if(list.length===1){A.courseNotes(list[0].id);return;}
 A.modal('Zur Notenübersicht – Klasse '+cl.name,`<div class="field"><label for="notesCourse">Fach</label><select id="notesCourse">${list.map(c=>A.opt(c.id,c.name,'')).join('')}</select></div>`,()=>{const cid=A.val('notesCourse');A.afterClose=()=>A.courseNotes(cid);},'Öffnen');
};
A.courseNotes=function(id){if(!A.chooseContext({courseId:id,historical:true,openNotes:true}))return false;A.W().assessmentWorkOpen=false;A.activateGroup('notes','overview');A.remember();A.$('#tab-notes').focus();return true;};
})(globalThis.Notenblick);
