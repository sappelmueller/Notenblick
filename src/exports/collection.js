/* Extend the one report model; emergency lists supply the shared ZIP plan. */
(function(A){'use strict';
A.independentExportContext=function(courseId,kind='overview',data=A.N.clone(A.data)){
 const c=data.courses.find(c=>c.id===courseId);if(!c)throw Error('Bitte wähle ein Fach.');
 const w=A.N.clone(A.ui.workspaces[c.id]||A.defaults());w.columns=['written',...A.kinds];w.search=w.oralClassSearch=w.assessmentSearch=w.oralListSearch=w.oralSearch='';w.showExited=true;
 const studentId=c.studentIds.includes(w.pupil)?w.pupil:A.N.sorted(A.N.activeStudents(data,c,true))[0]?.id;if(kind==='pupil'&&!studentId)throw Error('Diesem Fach sind noch keine Schüler zugeordnet. Wähle einen anderen Inhalt oder ein anderes Fach.');
 return {data,w,prefs:A.N.clone(A.prefs),courseId,studentId,kind:kind==='all'?'all':kind,type:kind==='complete'?'complete':kind==='overview'?'overview':kind==='all'?'assessments':kind==='pupil'?'pupil':'kind-complete',independent:true,history:true,batch:kind==='pupil'};
};
const section=(title,labels,rows,extra={})=>({title,columns:labels.map(label=>typeof label==='string'?{label}:label),rows,...extra});
const cell=value=>A.reportCell(value),weight=a=>[A.N.Q.from(a.weight).cmp(1)===0n?'Einfach gewichtet':'Faktor '+a.weight.replace('.',','),a.isGfs?'GFS':''].filter(Boolean).join(' · ');
A.reportWeightRows=function(c){return Object.entries(A.N.overallLabels(c)).map(([k,label])=>[cell(label),cell(c.weights.overall[k].replace('.',',')+' %')]).concat(A.N.courseMode(c)==='direct'?[]:[['Klassenarbeiten innerhalb schriftlich',c.weights.written.exam],['Tests innerhalb schriftlich',c.weights.written.test]].map(([label,value])=>[cell(label),cell(value.replace('.',',')+' %')]));};
A.appendReportHistory=function(report,ctx,options){
 const d=ctx.data||A.data,c=d.courses.find(c=>c.id===ctx.courseId);if(!c)return;
 if(options.weights!==false)report.sections.unshift(section('Gewichtung',['Bereich','Gewichtung'],A.reportWeightRows(c)));
 const students=report.studentIds.map(id=>d.students.find(s=>s.id===id)).filter(Boolean),rows=[];
 for(const s of students){
  for(const a of A.N.assessments(d,c.id))if(a.period&&A.N.datePeriod(d,c,a.date)!==a.period&&(!a.participantIds||a.participantIds.includes(s.id)))rows.push([cell(A.N.name(s,ctx.prefs.nameFormat)),cell(a.title+' ('+A.date(a.date)+') – bisherige Zuordnung'),cell(a.period+'. Halbjahr'),cell('')]);
  for(const f of [...(d.previousFinals||[]),...d.finals.filter(f=>f.period!=='all'&&!A.N.isHalfFinal(f))].filter(f=>f.courseId===c.id&&f.studentId===s.id))rows.push([cell(A.N.name(s,ctx.prefs.nameFormat)),cell('Frühere Zeugnisnote – '+(['1','2'].includes(f.period)?f.period+'. Halbjahr':'Zuordnung nicht eindeutig')),A.reportGrade(f.grade),cell(f.note||'')]);
  if(s.originStudentId){const prior=d.students.find(x=>x.id===s.originStudentId),cl=d.classes.find(x=>x.id===prior?.classId),y=d.years.find(x=>x.id===cl?.yearId);if(cl)rows.push([cell(A.N.name(s,ctx.prefs.nameFormat)),cell('Frühere Klasse'),cell(cl.name+(y?' – '+y.label:'')),cell('')]);}
  const r=A.calculation(c,s.id,d);if(r.blocked||r.total&&r.missing.length)rows.push([cell(A.N.name(s,ctx.prefs.nameFormat)),cell('Berechnungsstatus'),cell(r.blocked?'Altbestand noch prüfen':'Vorläufig; ohne bewertete Leistungen: '+r.missing.join(', ')),cell('')]);
 }
 if(ctx.type==='overview'){const notes=[];for(const s of students)for(const a of A.N.assessments(d,c.id))if(a.results[s.id]?.note)notes.push([cell(A.N.name(s,ctx.prefs.nameFormat)),cell(a.title+' ('+A.date(a.date)+')'),cell(a.results[s.id].note)]);if(notes.length)report.sections.push(section('Bemerkungen zu Leistungen',['Schüler','Leistung','Bemerkung'],notes));}
 if(rows.length)report.sections.push(section('Historische Angaben und Hinweise',['Schüler','Angabe','Wert','Bemerkung'],rows));
 if(ctx.type==='pupil'){
  const old=d.legacyOther?.assessments?.filter(a=>a.courseId===c.id&&a.results[ctx.studentId])||[];
  if(old.length){const original=d.legacyOther.courses.find(x=>x.courseId===c.id)?.overall||{};report.sections.push(section('Gesicherter Altbestand',[{label:'Datum',type:'date'},'Bezeichnung','Note / Status','Gewichtung','Bemerkung'],old.map(a=>{const r=a.results[ctx.studentId];return[A.reportDate(a.date),cell(a.title),r.status==='graded'?A.reportGrade(r.grade):cell(A.N.STATUS[r.status]||'Noch offen'),cell(weight(a)),cell(r.note||'')];}),{description:'Ursprüngliche Gewichtung: '+Object.entries(original).map(([k,v])=>(A.N.OVERALL[k]||'Sonstige Leistungen')+' '+v.replace('.',',')+' %').join(', ')}));report.recordIds.push(...old.map(a=>a.id));}
 }
};
A.buildExtendedReport=function(ctx,options){
 const d=ctx.data||A.data,prefs=ctx.prefs||A.prefs,c=d.courses.find(c=>c.id===ctx.courseId),cl=d.classes.find(x=>x.id===(c?.classId||ctx.classId));if(!cl)throw Error('Die gewählte Klasse ist nicht mehr vorhanden.');const y=d.years.find(x=>x.id===cl.yearId);
 const base={type:ctx.type,kind:ctx.kind,title:'',year:A.schoolYear(y),className:cl.name,subject:c?.name||'Schülerliste',created:A.today(),scope:'Alle Einträge',sections:[],recordIds:[],studentIds:[],remarks:true,precision:c?.precision||2};
 if(ctx.type==='roster'){
  const students=A.N.sorted(d.students.filter(s=>s.classId===cl.id),prefs.sortBy,prefs.sortDir);base.title='Schülerliste';base.studentIds=students.map(s=>s.id);base.sections.push(section('',['Schüler','Status'],students.map(s=>[cell(A.N.name(s,prefs.nameFormat)),cell(s.archived?'Ehemaliger Schüler':'Aktiv')])));
 }else if(ctx.type==='assessment'||ctx.type==='legacy-assessment'){
  const legacy=ctx.type==='legacy-assessment',a=(legacy?d.legacyOther?.assessments||[]:d.assessments).find(a=>a.id===ctx.assessmentId&&a.courseId===c?.id);if(!a)throw Error('Die gewählte Leistung ist nicht mehr vorhanden.');base.title=a.title;base.recordIds=[a.id];
  const students=A.N.sorted(A.N.assessmentStudents(d,c,a,true),prefs.sortBy,prefs.sortDir);base.studentIds=students.map(s=>s.id);
  base.sections.push(section('Leistung',['Angabe','Wert'],[[cell('Datum'),A.reportDate(a.date)],[cell('Leistungsart'),cell(legacy?'Gesicherter Altbestand':a.kind==='oral'?'Mündliche Noten':A.N.KINDS[a.kind])],[cell('Gewichtung'),cell(weight(a))]]),section(legacy?'Ursprüngliche Gewichtung':'Gewichtung des Fachs',['Bereich','Gewichtung'],legacy?Object.entries(d.legacyOther.courses.find(x=>x.courseId===c.id)?.overall||{}).map(([k,v])=>[cell(A.N.OVERALL[k]||'Sonstige Leistungen'),cell(v.replace('.',',')+' %')]):A.reportWeightRows(c)),section('Noten',['Schüler',{label:'Note / Status',type:'grade'},'Bemerkung'],students.map(s=>{const r=a.results[s.id];return[cell(A.N.name(s,prefs.nameFormat)+(A.N.participationLabel(s,c)?' ('+A.N.participationLabel(s,c)+')':'')),r?.status==='graded'?A.reportGrade(r.grade):cell(A.N.STATUS[r?.status||'open']),cell(r?.note||'')];})));
 }else if(ctx.type==='kind-complete'){
  base.title=ctx.kind==='oral'?'Mündliche Noten':A.N.KINDS[ctx.kind];
  const records=A.selectAssessments(d,c.id,ctx.kind);base.sections.push(section('Gewichtung',['Bereich','Gewichtung'],A.reportWeightRows(c)));
  for(const a of records){const r=A.buildReport({...ctx,type:'assessment',assessmentId:a.id},options);base.sections.push(...r.sections.filter(s=>s.title!=='Gewichtung des Fachs').map(s=>({...s,title:a.title+' – '+s.title})));base.recordIds.push(a.id);base.studentIds.push(...r.studentIds);}
  base.studentIds=[...new Set(base.studentIds)];
 }else{
  const overview=A.buildReport({...ctx,type:'overview',w:{...ctx.w,columns:['written',...A.kinds]}},{...options,scope:'all',history:true});Object.assign(base,overview,{type:'complete',title:'Alle Noten des Fachs'});
  const performances=A.buildReport({...ctx,type:'assessments',kind:'all'},{...options,scope:'all',remarks:false,history:false});base.sections.push(...performances.sections.map(s=>({...s,title:s.title||'Alle Leistungen'})));base.recordIds.push(...performances.recordIds);
  for(const s of A.N.sorted(A.N.activeStudents(d,c,true),prefs.sortBy,prefs.sortDir)){const pupil=A.buildReport({...ctx,type:'pupil',studentId:s.id},{...options,scope:'all',entries:'all',remarks:true,history:true,weights:false});base.sections.push(...pupil.sections.map(part=>({...part,title:A.N.name(s,prefs.nameFormat)+' – '+part.title})));base.recordIds.push(...pupil.recordIds);}
  for(const a of d.legacyOther?.assessments?.filter(a=>a.courseId===c.id&&!Object.keys(a.results).length)||[]){const old=A.buildReport({...ctx,type:'legacy-assessment',assessmentId:a.id},options);base.sections.push(...old.sections.map(s=>({...s,title:a.title+' – '+s.title})));base.recordIds.push(a.id);}
  base.recordIds=[...new Set(base.recordIds)];
 }
 if(!base.sections.length)base.sections.push(section('Einträge',['Hinweis'],[[cell('Noch keine Leistungen erfasst.')]]));base.landscape=A.reportLayout(base).landscape;return base;
};
A.exportAllNotes=async function(format,stillRequested=()=>true,progress=()=>{},maximum=A.exportMaximumBytes){
 if(A.fatalStart)throw Error('Bitte öffne zuerst einen lesbaren Notenstand oder stelle eine Sicherung wieder her.');
 if(!['txt','docx','pdf'].includes(format))throw Error('Bitte wähle Text, Word oder PDF.');
 const data=A.N.clone(A.data),plan=Array.from(A.N.textListPlan(data));if(!plan.length)throw Error('Es sind noch keine Klassen zum Exportieren vorhanden.');if(plan.length>4096)throw Error('Der Gesamtexport enthält mehr als 4096 Dokumente. Bitte exportiere einzelne Fächer über „Ausgewählte Noten exportieren“.');
 const writer=A.zipWriter(maximum),texts=format==='txt'?A.N.textListEntries(data):null;let archive;
 try{
  for(let i=0;i<plan.length;i++){
   await new Promise(resolve=>setTimeout(resolve,0));if(!stillRequested())return false;
   const entry=plan[i];let value;
   if(texts){const next=texts.next();if(next.done||next.value.path!==entry.path)throw Error('Die Exportstruktur konnte nicht vollständig geprüft werden.');value=next.value.text;}
   else{const ctx=entry.context.type==='roster'?{...entry.context,data,prefs:A.N.clone(A.prefs)}:{...A.independentExportContext(entry.context.courseId,'overview',data),...entry.context};value=await A.renderReportFile(A.buildReport(ctx,{scope:'all',entries:'all',remarks:true,history:true}),format);}
   if(!stillRequested())return false;writer.add(entry.path.slice(0,-4)+'.'+format,value);progress(entry.path,i+1,plan.length);
  }
  if(texts&&!texts.next().done)throw Error('Die Exportstruktur enthält unerwartete Dateien.');if(!stillRequested())return false;archive=writer.finish();
 }finally{writer.discard();texts?.return();}
 if(!stillRequested())return false;
 const saved=await A.download('Notenblick-Alle-Noten.zip',archive,'application/zip',stillRequested);
 return saved===false?false:{documents:plan.length};
};
A.openAllNotesExport=function(format){
 A.feedback('export','');A.modal('Alle Noten exportieren','<p id="allExportContext">Alle Schuljahre, Klassen und Fächer werden als '+A.esc({txt:'Textdateien',docx:'Word-Dokumente',pdf:'PDF-Dokumente'}[format]||'Dokumente')+' in einem ZIP-Archiv gespeichert.</p>',async()=>{
  const result=await A.runOperation('Alle Noten werden exportiert',async(progress,requested)=>{progress('Dokumente vorbereiten.');return A.exportAllNotes(format,requested,(path,done,total)=>progress(path.replace(/\.txt$/,'')+' wird erstellt. '+done+' von '+total+' Dokumenten verarbeitet.',done,total));},{cancellable:true});
  if(result===false)return {keepOpen:true,focus:'dialogSave'};A.afterClose=()=>A.feedback('export','Alle Noten wurden erfolgreich exportiert. '+result.documents+' Dokumente wurden erstellt.');
 },'Exportieren',{describedBy:'allExportContext',cancelWhileBusy:true});
};
})(globalThis.Notenblick);
