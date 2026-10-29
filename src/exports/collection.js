/* Extend the one report model; emergency lists supply the shared ZIP plan. */
(function(A){'use strict';
A.independentExportContext=function(courseId,kind='overview',data=A.N.clone(A.data)){
 const c=data.courses.find(c=>c.id===courseId);if(!c)throw Error('Bitte wähle ein Fach.');
 const w=A.N.clone(A.ui.workspaces[c.id]||A.defaults());w.columns=['written',...A.kinds];w.search=w.oralClassSearch=w.assessmentSearch=w.oralListSearch=w.oralSearch='';w.showExited=true;
 const studentId=c.studentIds.includes(w.pupil)?w.pupil:A.N.sorted(A.N.activeStudents(data,c,true))[0]?.id;if(kind==='pupil'&&!studentId)throw Error('Diesem Fach sind noch keine Schüler zugeordnet. Wähle einen anderen Inhalt oder ein anderes Fach.');
 return {data,w,prefs:A.N.clone(A.prefs),courseId,studentId,kind:kind==='all'?'all':kind,type:kind==='complete'?'complete':kind==='overview'?'overview':kind==='all'?'assessments':kind==='pupil'?'pupil':'kind-complete',independent:true,history:true,batch:kind==='pupil'};
};
const section=(title,labels,rows,extra={})=>({title,columns:labels.map(label=>typeof label==='string'?{label}:label),rows,...extra});
A.assessmentMeanCell=function(d,c,a){const q=A.N.assessmentProgress(d,c,a).average;if(q===null)return A.reportCell('–');const value=A.N.show(q,c);return {text:value,number:Number(value.replace(',','.')),format:'average',precision:c.precision};};
const cell=value=>A.reportCell(value);
A.legacyReportWarning=function(report,d,c){if(A.N.legacyPending?.(d,c.id)){const value='Frühere Noten dieses Fachs müssen noch geprüft werden. Der Gesamtdurchschnitt ist deshalb noch nicht verfügbar.';if(!report.intro.includes(value))report.intro.push(value);}};
A.appendReportHistory=function(report,ctx,options){
 const d=ctx.data||A.data,c=d.courses.find(c=>c.id===ctx.courseId);if(!c)return;const prefs=ctx.prefs||A.prefs,remarks=options.remarks===true,students=report.studentIds.map(id=>d.students.find(s=>s.id===id)).filter(Boolean),rows=[];
 for(const a of A.N.assessments(d,c.id))if(a.period&&A.N.datePeriod(d,c,a.date)!==a.period&&Object.values(a.results).some(A.N.hasEntry)&&(ctx.type!=='pupil'||!a.participantIds||a.participantIds.includes(ctx.studentId)))rows.push([cell(a.title+' · '+A.date(a.date)),cell('Bisherige Halbjahreszuordnung'),cell(a.period+'. Halbjahr'),cell('')]);
 for(const s of students){for(const f of [...(d.previousFinals||[]),...d.finals.filter(f=>f.period!=='all'&&!A.N.isHalfFinal(f))].filter(f=>f.courseId===c.id&&f.studentId===s.id))rows.push([cell(A.N.name(s,prefs.nameFormat)),cell('Frühere Zeugnisnote – '+(['1','2'].includes(f.period)?f.period+'. Halbjahr':'Zuordnung nicht eindeutig')),A.reportGrade(f.grade),cell(remarks?f.note||'':'')]);if(s.originStudentId){const prior=d.students.find(x=>x.id===s.originStudentId),cl=d.classes.find(x=>x.id===prior?.classId),y=d.years.find(x=>x.id===cl?.yearId);if(cl)rows.push([cell(A.N.name(s,prefs.nameFormat)),cell('Frühere Klasse'),cell(cl.name+(y?' – '+y.label:'')),cell('')]);}}
 if(rows.length)report.sections.push(section('Historische Angaben',['Schüler / Leistung','Angabe','Wert',...(remarks?['Bemerkung']:[])],rows.map(row=>remarks?row:row.slice(0,3))));
 if(ctx.type==='pupil'){
  const old=d.legacyOther?.assessments?.filter(a=>a.courseId===c.id&&(A.N.hasEntry(a.results[ctx.studentId])||remarks&&a.results[ctx.studentId]?.note))||[];
  if(old.length){const original=d.legacyOther.courses.find(x=>x.courseId===c.id)?.overall||{};report.sections.push(section('Frühere Leistungen',[{label:'Datum',type:'date'},'Bezeichnung','Note / Status','Gewichtung',...(remarks?['Bemerkung']:[])],old.map(a=>[A.reportDate(a.date),cell(a.title),A.reportResult(a,ctx.studentId),cell(A.reportFlags(a)),...(remarks?[cell(a.results[ctx.studentId]?.note||'')]:[])]),{role:'entries',description:'Ursprüngliche Gewichtung: '+Object.entries(original).map(([k,v])=>(A.N.OVERALL[k]||'Sonstige Leistungen')+' '+v.replace('.',',')+' %').join(' · ')}));report.recordIds.push(...old.map(a=>a.id));}
 }
};
A.buildExtendedReport=function(ctx,options={}){
 const d=ctx.data||A.data,prefs=ctx.prefs||A.prefs,c=d.courses.find(c=>c.id===ctx.courseId),cl=d.classes.find(x=>x.id===(c?.classId||ctx.classId));if(!cl)throw Error('Die gewählte Klasse ist nicht mehr vorhanden.');const y=d.years.find(x=>x.id===cl.yearId),remarks=options.remarks===true;
 let base={type:ctx.type,kind:ctx.kind,title:'',year:A.schoolYear(y),className:cl.name,subject:c?.name||'Schülerliste',created:A.today(),scope:'Alle Einträge',intro:[],sections:[],recordIds:[],studentIds:[],remarks,precision:c?.precision??2};
 const hasValue=a=>Object.values(a.results).some(r=>A.N.hasEntry(r)||remarks&&r?.note);
 if(ctx.type==='roster'){
  const students=A.N.sorted(d.students.filter(s=>s.classId===cl.id),prefs.sortBy,prefs.sortDir),status=students.some(s=>s.archived);base.title='Schülerliste';base.studentIds=students.map(s=>s.id);base.sections.push(section('',['Schüler',...(status?['Status']:[])],students.map(s=>[cell(A.N.name(s,prefs.nameFormat)),...(status?[cell(s.archived?'Ehemaliger Schüler':'Aktiv')]:[])])));
 }else if(ctx.type==='assessment'||ctx.type==='legacy-assessment'){
  const legacy=ctx.type==='legacy-assessment',a=(legacy?d.legacyOther?.assessments||[]:d.assessments).find(a=>a.id===ctx.assessmentId&&a.courseId===c?.id);if(!a)throw Error('Die gewählte Leistung ist nicht mehr vorhanden.');base.title=a.title;base.recordIds=[a.id];base.intro=[A.date(a.date)+' · '+(legacy?'Frühere Leistung':a.kind==='oral'?'Mündliche Noten':A.N.KINDS[a.kind])+(A.reportFlags(a)?' · '+A.reportFlags(a):'')];
  if(legacy)base.intro.push('Ursprüngliche Gewichtung: '+Object.entries(d.legacyOther.courses.find(x=>x.courseId===c.id)?.overall||{}).map(([k,v])=>(A.N.OVERALL[k]||'Sonstige Leistungen')+' '+v.replace('.',',')+' %').join(' · '));
  const students=A.N.sorted(A.N.assessmentStudents(d,c,a,true),prefs.sortBy,prefs.sortDir);base.studentIds=students.map(s=>s.id);base.sections.push(section('Noten',['Schüler',{label:'Note / Status',type:'grade'},...(remarks?['Bemerkung']:[])],students.map(s=>[A.reportPupil(s,c,prefs),A.reportResult(a,s.id),...(remarks?[cell(a.results[s.id]?.note||'')]:[])]),{footer:[cell('Klassendurchschnitt'),A.assessmentMeanCell(d,c,a),...(remarks?[cell('')]:[])]}));
 }else if(ctx.type==='kind-complete'){
  const matrix=A.buildReport({...ctx,type:'matrix'}, {...options,history:false});base={...matrix,type:ctx.type,title:ctx.kind==='oral'?'Mündliche Noten':A.N.KINDS[ctx.kind]};
  if(ctx.kind==='oral'){const individual=A.buildReport({...ctx,type:'oral-individual'}, {...options,history:false});if(individual.recordIds.length){base.sections.push(...individual.sections.map(s=>({...s,title:'Mündliche Einzelnoten'})));base.recordIds.push(...individual.recordIds);base.studentIds.push(...individual.studentIds);}}
  if(!base.recordIds.length)base.sections=[section('',['Hinweis'],[[cell('Noch keine Bewertungen erfasst.')]])];
  if(options.history)A.appendReportHistory(base,ctx,options);
 }else{
  const overview=A.buildReport({...ctx,type:'overview',w:{...ctx.w,columns:['written',...A.kinds]}},{...options,scope:'all',remarks:false,history:false});base={...overview,type:'complete',title:'Fachbericht mit Einzelnoten',remarks,recordIds:[]};base.sections[0].title='Fachübersicht';
  for(const kind of A.kinds){const list=A.selectAssessments(d,c.id,kind).filter(a=>!A.N.isOralIndividual(a)&&hasValue(a)).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'de')||a.id.localeCompare(b.id));if(list.length){base.sections.push(A.performanceTable({...ctx,kind},{...options,scope:'all'},list,{title:kind==='oral'?'Mündliche Klassenrunden':A.N.KINDS[kind]}));base.recordIds.push(...list.map(a=>a.id));}}
  const oral=A.buildReport({...ctx,type:'oral-individual',kind:'oral'}, {...options,scope:'all',remarks:false,history:false});if(oral.recordIds.length){base.sections.push(...oral.sections.map(s=>({...s,title:'Mündliche Einzelnoten'})));base.recordIds.push(...oral.recordIds);}
  // A note-only individual entry belongs in the collected remarks, without an empty grade row.
  if(remarks)base.recordIds.push(...A.N.assessments(d,c.id).filter(a=>A.N.isOralIndividual(a)&&hasValue(a)).map(a=>a.id));
  const old=d.legacyOther?.assessments?.filter(a=>a.courseId===c.id&&hasValue(a))||[];if(old.length){const part=A.performanceTable(ctx,{...options,scope:'all'},old,{title:'Frühere Leistungen',legacy:true});part.description='Ursprüngliche Gewichtung: '+Object.entries(d.legacyOther.courses.find(x=>x.courseId===c.id)?.overall||{}).map(([k,v])=>(A.N.OVERALL[k]||'Sonstige Leistungen')+' '+v.replace('.',',')+' %').join(' · ');base.sections.push(part);base.recordIds.push(...old.map(a=>a.id));}
  A.addReportRemarks(base,ctx,{remarks,finals:true});if(options.history!==false)A.appendReportHistory(base,ctx,options);
 }
 if(c)A.legacyReportWarning(base,d,c);return A.finishReport(base);
};
A.exportAllNotes=async function(format,stillRequested=()=>true,progress=()=>{},maximum=A.exportMaximumBytes,phase=()=>{}){
 if(A.fatalStart)throw Error('Bitte öffne zuerst einen lesbaren Notenstand oder stelle eine Sicherung wieder her.');
 if(!['txt','docx','pdf'].includes(format))throw Error('Bitte wähle Text, Word oder PDF.');
 const data=A.N.clone(A.data),plan=Array.from(A.N.textListPlan(data));if(!plan.length)throw Error('Es sind noch keine Klassen zum Exportieren vorhanden.');if(plan.length>4096)throw Error('Der Gesamtexport enthält mehr als 4096 Dokumente. Bitte exportiere einzelne Fächer über „Ausgewählte Noten exportieren“.');
 const writer=A.zipWriter(maximum);let archive;
 try{
  for(let i=0;i<plan.length;i++){
   await new Promise(resolve=>setTimeout(resolve,0));if(!stillRequested())return false;
   const entry=plan[i],ctx=entry.context.type==='roster'?{...entry.context,data,prefs:A.N.clone(A.prefs)}:{...A.independentExportContext(entry.context.courseId,'overview',data),...entry.context};
   const value=await A.renderReportFile(A.buildReport(ctx,{scope:'all',entries:'entered',remarks:true,history:true}),format);
   if(!stillRequested())return false;writer.add(entry.path.slice(0,-4)+'.'+format,value);progress(entry.path,i+1,plan.length);
  }
  if(!stillRequested())return false;phase('ZIP-Archiv zusammenstellen.');await new Promise(resolve=>setTimeout(resolve,0));if(!stillRequested())return false;archive=writer.finish();
 }finally{writer.discard();}
 if(!stillRequested())return false;
 phase('ZIP-Archiv zur Prüfung und Speicherung übergeben.',true);
 const messages={validating:'ZIP-Archiv prüfen.', 'save-dialog':'Datei speichern. Bitte wähle den Speicherort.',writing:'Datei wird gespeichert.'};
 const saved=await A.download('Notenblick-Alle-Noten.zip',archive,'application/zip',stillRequested,null,step=>{if(messages[step])phase(messages[step]);});
 return saved===false?false:{documents:plan.length};
};
A.openAllNotesExport=function(format){
 A.feedback('export','');A.modal('Alle Noten exportieren','<p id="allExportContext">Alle Schuljahre, Klassen und Fächer werden als '+A.esc({txt:'Textdateien',docx:'Word-Dokumente',pdf:'PDF-Dokumente'}[format]||'Dokumente')+' in einem ZIP-Archiv gespeichert.</p>',async()=>{
  const result=await A.runOperation('Alle Noten werden exportiert',async(progress,requested,lock)=>{progress('Dokumente erstellen.');return A.exportAllNotes(format,requested,(path,done,total)=>progress(path.replace(/\.txt$/,'')+' wurde erstellt. '+done+' von '+total+' Dokumenten verarbeitet.',done,total),A.exportMaximumBytes,(message,critical)=>{if(critical)lock();progress(message);});},{cancellable:true});
  if(result===false)return {keepOpen:true,focus:'dialogSave'};A.afterClose=()=>A.feedback('export','Alle Noten wurden erfolgreich exportiert. '+result.documents+' Dokumente wurden erstellt.');
 },'Exportieren',{describedBy:'allExportContext',cancelWhileBusy:true});
};
})(globalThis.Notenblick);
