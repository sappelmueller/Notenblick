/* One immutable report model. All results come from NR.calculate and NR.show. */
(function(A){'use strict';
const text=value=>({text:String(value??'')});
A.reportCell=text;
A.reportDate=value=>({text:A.date(value),date:value});
A.reportDateLine=r=>['assessment','legacy-assessment','point-key'].includes(r.type)?r.scope:'Erstellt am '+A.date(r.created)+(r.scope?' · '+r.scope:'');
A.reportGrade=value=>value===null||value===undefined?text('–'):{text:String(value).replace('.',','),number:Number(value)};
A.reportFinal=(f,type)=>!f?text('–'):A.N.finalConflict(f,type)?text(A.N.finalText(f.grade,f.reportType||type)+' (bisher: '+(A.N.FINAL_TYPES[f.reportType]||'Altbestand')+')'):{text:A.N.finalText(f.grade,f.reportType||type),number:Number(f.grade),finalType:f.reportType||type};
A.selectAssessments=(data,cid,kind='all',term='')=>A.N.assessments(data,cid,'all').filter(a=>(kind==='all'||a.kind===kind)&&a.title.toLocaleLowerCase('de').includes(term.toLocaleLowerCase('de'))).sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title,'de')||a.id.localeCompare(b.id));
A.selectOralRows=function(data,course,w,prefs){
 const name=s=>A.N.name(s,prefs.nameFormat),term=w.oralSearch.toLocaleLowerCase('de'),students=A.N.index(data).students,rank=new Map(A.N.sorted(A.N.activeStudents(data,course,true),prefs.sortBy,prefs.sortDir).map((s,i)=>[s.id,i]));
 return A.N.assessments(data,course.id).filter(A.N.isOralIndividual).map(a=>({a,s:students.get(a.participantIds[0]),r:a.results[a.participantIds[0]]})).filter(x=>x.s&&(w.oralStudent==='all'||w.oralStudent===x.s.id)&&[name(x.s),A.N.name(x.s,'first-last'),A.N.name(x.s,'last-first'),x.a.title].some(t=>t.toLocaleLowerCase('de').includes(term))).sort((x,y)=>(w.oralSort==='student'?(rank.get(x.s.id)-rank.get(y.s.id)):0)||y.a.date.localeCompare(x.a.date)||x.a.title.localeCompare(y.a.title,'de')||x.a.id.localeCompare(y.a.id));
};
A.exportContext=function(requested){
 const w=A.N.clone(A.W()),kind=A.kinds.includes(w.view)?w.view:w.assessmentFilter,view=w.view;
 let type=requested==='overview'?'overview':requested==='pupil'||(!requested&&view==='pupil')?'pupil':requested==='oral-individual'?'oral-individual':requested==='all'||requested==='assessments'?'assessments':null;
 const chosen=A.kinds.includes(requested)?requested:kind;
 if(!type){if(chosen==='oral'&&w.oralView==='individual')type='oral-individual';else type=chosen==='all'||(chosen==='oral'?w.oralAreaView:A.prefs.areaView)==='list'?'assessments':'matrix';}
 return {type,kind:chosen,courseId:A.ui.course,studentId:w.pupil,w,prefs:A.N.clone(A.prefs)};
};
A.reportTitle=ctx=>ctx.type==='overview'?'Notenübersicht':ctx.type==='pupil'?'Schülernoten':ctx.type==='oral-individual'?'Mündliche Einzelnoten':ctx.kind==='oral'?'Mündliche Klassenübersicht':ctx.type==='assessments'&&ctx.kind==='all'?'Leistungsliste':A.N.KINDS[ctx.kind]||'Leistungen';
A.reportMetadata=r=>(r.type==='roster'?'':r.subject+' · ')+'Klasse '+r.className+' · '+r.year;
A.reportOrientation=r=>'Notenblick · '+A.reportMetadata(r);
A.reportGroupingDescription=grouping=>grouping==='date'?'Alle Einzelnoten werden gemeinsam nach Datum sortiert, neueste zuerst.':'Die Einzelnoten werden nach Leistungsarten gruppiert, innerhalb der Gruppen neueste zuerst.';
A.batchStudents=function(ctx,includeExited=false){
 const d=ctx.data||A.data,course=d.courses.find(c=>c.id===ctx.courseId);if(!course)throw Error('Das gewählte Fach ist nicht mehr vorhanden.');
 return A.N.sorted(A.N.activeStudents(d,course,includeExited),ctx.prefs.sortBy,ctx.prefs.sortDir);
};
A.batchEntryName=function(student,extension,used){
 let base=(student.first+'_'+student.last).normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,'_').replace(/[\s.]+/g,'_').replace(/^_+|_+$/g,'').slice(0,100)||'Schueler';
 if(/^(con|prn|aux|nul|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(base))base='Schueler_'+base;
 let name=base+'.'+extension,n=1;while(used.has(name.toLocaleLowerCase('de')))name=base+'_'+(++n)+'.'+extension;used.add(name.toLocaleLowerCase('de'));return name;
};
// Shared presentation helpers. All arithmetic remains in the domain evaluator.
A.reportAverage=(q,c)=>q===null||q===undefined?text('–'):{text:A.N.show(q,c),number:Number(A.N.show(q,c).replace(',','.')),format:'average',precision:c.precision};
A.reportFlags=a=>[a.isGfs?'GFS':'',A.N.Q.from(a.weight).cmp(1)!==0n?String(a.weight).replace('.',',')+'-fach':''].filter(Boolean).join(' · ');
A.reportResult=(a,sid)=>a.participantIds&&!a.participantIds.includes(sid)?text('Nimmt nicht teil'):a.results[sid]?.status==='graded'?A.reportGrade(a.results[sid].grade):text(a.results[sid]?.status&&a.results[sid].status!=='open'?A.N.STATUS[a.results[sid].status]:'–');
A.reportSingleResult=function(a,sid){const r=a.results[sid],value=A.reportResult(a,sid);if(!A.N.isPoints(a))return value;const suffix=r?.manualGrade!=null?' · Manuell festgelegt':'';if(r?.status==='graded')return suffix?text(A.N.pointGradeText(r.grade,a.pointKey)+suffix):{...value,text:A.N.pointGradeText(r.grade,a.pointKey)};return text(value.text+(r?.calculatedGrade!=null?' · berechnet '+A.N.pointGradeText(r.calculatedGrade,a.pointKey):'')+suffix);};
A.reportPupilResult=function(a,sid,points){const value=A.reportResult(a,sid),r=a.results[sid];return points&&A.N.isPoints(a)&&r?.points!=null?text(value.text+' ('+r.points.replace('.',',')+' von '+a.pointKey.maximum.replace('.',',')+' Punkten)'):value;};
A.reportWeightLines=c=>['Gewichtung: '+Object.entries(A.N.overallLabels(c)).filter(([k])=>A.N.Q.from(c.weights.overall[k]).cmp(0)>0n).map(([k,label])=>label+' '+c.weights.overall[k].replace('.',',')+' %').join(' · '),...(A.N.courseMode(c)==='grouped'&&A.N.Q.from(c.weights.overall.written).cmp(0)>0n?['Innerhalb schriftlich: Klassenarbeiten '+c.weights.written.exam.replace('.',',')+' % · Tests '+c.weights.written.test.replace('.',',')+' %']:[])];
A.reportStudents=function(ctx,options={}){const d=ctx.data||A.data,c=d.courses.find(c=>c.id===ctx.courseId),prefs=ctx.prefs||A.prefs,w=ctx.w||A.defaults(),all=options.scope==='all';let list=A.N.sorted(A.N.activeStudents(d,c,all||w.showExited),prefs.sortBy,prefs.sortDir);if(!all){const term=(ctx.type!=='overview'&&ctx.kind==='oral'?w.oralClassSearch:w.search)||'';list=list.filter(s=>[A.N.name(s,prefs.nameFormat),A.N.name(s,'first-last'),A.N.name(s,'last-first')].some(t=>t.toLocaleLowerCase('de').includes(term.toLocaleLowerCase('de'))));}return list;};
A.reportPupil=(s,c,prefs)=>text(A.N.name(s,prefs.nameFormat)+(A.N.participationLabel(s,c)?' ('+A.N.participationLabel(s,c)+')':''));
// Export selection only: never infer relevance from a calculated average.
A.relevantReportEntry=(a,sid,remarks=true)=>(!a.participantIds||a.participantIds.includes(sid))&&(A.N.hasEntry(a.results[sid])||remarks&&!!a.results[sid]?.note?.trim());
A.hasPupilReportInformation=function(d,c,sid){return [...A.N.assessments(d,c.id),...(d.legacyOther?.assessments?.filter(a=>a.courseId===c.id)||[])].some(a=>A.relevantReportEntry(a,sid))||[...d.finals,...(d.previousFinals||[])].some(f=>f.courseId===c.id&&f.studentId===sid)||d.students.some(s=>s.id===sid&&s.originStudentId&&d.students.some(prior=>prior.id===s.originStudentId));};
A.hasCourseReportInformation=(d,c)=>c.studentIds.some(sid=>A.hasPupilReportInformation(d,c,sid));
A.reportAssessmentLabels=function(list,{dated=true,flags=true}={}){list=[...list].sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'de')||a.id.localeCompare(b.id));const counts=new Map(),seen=new Map();for(const a of list){const key=a.title+' · '+A.date(a.date);counts.set(key,(counts.get(key)||0)+1);}return new Map(list.map(a=>{const key=a.title+' · '+A.date(a.date),n=(seen.get(key)||0)+1;seen.set(key,n);return [a.id,(dated?key:a.title)+(counts.get(key)>1?' ('+n+')':'')+(flags&&A.reportFlags(a)?' ('+A.reportFlags(a)+')':'')];}));};
// Sparse class assessments stay class assessments. Only their report rows change.
A.oralReportSections=function(ctx,options,list,{title='Mündliche Klassenrunden'}={}){
 const d=ctx.data||A.data,c=d.courses.find(c=>c.id===ctx.courseId),prefs=ctx.prefs||A.prefs,students=A.reportStudents(ctx,options),labels=A.reportAssessmentLabels(A.N.assessments(d,c.id)),relevant=a=>students.filter(s=>A.relevantReportEntry(a,s.id,options.remarks)),rounds=[],sparse=[];
 for(const a of list){const entries=relevant(a),participants=students.filter(s=>!a.participantIds||a.participantIds.includes(s.id));(entries.length>1&&entries.length*2>=participants.length?rounds:sparse).push(a);}
 const roundMembers=students.filter(s=>rounds.some(a=>A.relevantReportEntry(a,s.id,options.remarks)));if(rounds.reduce((n,a)=>n+relevant(a).length,0)*2<roundMembers.length*rounds.length){sparse.push(...rounds);rounds.length=0;sparse.sort((a,b)=>list.indexOf(a)-list.indexOf(b));}
 const parts=[];if(rounds.length)parts.push(A.performanceTable({...ctx,kind:'oral'},options,rounds,{title,labels}));
 const withMean=sparse.some(a=>relevant(a).filter(s=>a.results[s.id]?.status==='graded').length>1),rows=sparse.flatMap(a=>relevant(a).map(s=>[A.reportDate(a.date),A.reportPupil(s,c,prefs),text(labels.get(a.id)),A.reportResult(a,s.id),...(withMean?[A.reportAverage(A.N.assessmentProgress(d,c,a).average,c)]:[])]));
 if(rows.length)parts.push({title:rounds.length?'Weitere mündliche Klassenbewertungen':title,role:'entries',columns:[{label:'Datum',type:'date'},{label:'Schüler'},{label:'Bewertung'},{label:'Note / Status',type:'grade'},...(withMean?[{label:'Klassenschnitt',type:'average'}]:[])],rows});
 if(sparse.length&&ctx.type!=='complete'){const members=students.filter(s=>list.some(a=>A.relevantReportEntry(a,s.id,options.remarks)));if(members.length)parts.push({title:'Mündliche Durchschnitte',columns:[{label:'Schüler'},{label:'Mündlich gesamt',type:'average'}],rows:members.map(s=>[A.reportPupil(s,c,prefs),A.reportAverage(A.calculation(c,s.id,d).categories.oral,c)]),footer:[text('Klassendurchschnitt'),A.reportAverage(A.classAverages(c,d).categories.oral,c)]});}return parts;
};
A.finishReport=function(r){for(const s of r.sections){const remove=s.columns.map((c,i)=>(c.label==='Bemerkung'||c.label==='Gewichtung')&&(!r.remarks&&c.label==='Bemerkung'||!s.rows.some(row=>row[i]?.text&&row[i].text!=='–'))?i:-1).filter(i=>i>=0);if(remove.length){const keep=s.columns.map((c,i)=>i).filter(i=>!remove.includes(i));s.columns=keep.map(i=>s.columns[i]);s.rows=s.rows.map(row=>keep.map(i=>row[i]));if(s.footer)s.footer=keep.map(i=>s.footer[i]);}}r.recordIds=[...new Set(r.recordIds)];r.studentIds=[...new Set(r.studentIds)];r.landscape=A.reportLayout(r).landscape;return r;};
A.addReportRemarks=function(report,ctx,{remarks=false,finals=false}={}){if(!remarks)return;const d=ctx.data||A.data,c=d.courses.find(c=>c.id===ctx.courseId),prefs=ctx.prefs||A.prefs,rows=[],ids=new Set(report.recordIds),students=report.studentIds.map(id=>d.students.find(s=>s.id===id)).filter(Boolean),labels=A.reportAssessmentLabels([...A.N.assessments(d,c.id),...(d.legacyOther?.assessments?.filter(a=>a.courseId===c.id)||[])]);for(const s of students){for(const a of [...A.N.assessments(d,c.id),...(d.legacyOther?.assessments?.filter(a=>a.courseId===c.id)||[])])if(ids.has(a.id)&&(!a.participantIds||a.participantIds.includes(s.id))&&a.results[s.id]?.note)rows.push([A.reportPupil(s,c,prefs),text(labels.get(a.id)),text(a.results[s.id].note)]);if(finals)for(const period of ['half','annual']){const f=A.N.finalFor(d,c.id,s.id,period);if(f?.note)rows.push([A.reportPupil(s,c,prefs),text(A.N.finalLabel(d,c,period)),text(f.note)]);}}if(rows.length)report.sections.push({title:'Bemerkungen',columns:['Schüler','Leistung','Bemerkung'].map(label=>({label})),rows});};
A.performanceTable=function(ctx,options,list,{title='',legacy=false,labels=null}={}){const d=ctx.data||A.data,c=d.courses.find(c=>c.id===ctx.courseId),prefs=ctx.prefs||A.prefs,kind=ctx.kind,students=A.reportStudents(ctx,options).filter(s=>legacy||kind!=='oral'||list.some(a=>A.relevantReportEntry(a,s.id,options.remarks))),withMean=!legacy;labels??=A.reportAssessmentLabels([...A.N.assessments(d,c.id),...(d.legacyOther?.assessments?.filter(a=>a.courseId===c.id)||[])]);return {title,role:'performances',matrix:true,fixed:1,meanLast:withMean,columns:[{label:'Schüler'},...list.map(a=>({label:labels.get(a.id),type:'grade',assessmentId:a.id})),...(withMean?[{label:kind==='oral'&&A.N.assessments(d,c.id).some(A.N.isOralIndividual)?'Mündlich gesamt':'Durchschnitt',type:'average'}]:[])],rows:students.map(s=>[A.reportPupil(s,c,prefs),...list.map(a=>A.reportResult(a,s.id)),...(withMean?[A.reportAverage(A.calculation(c,s.id,d).categories[kind],c)]:[])]),footer:[text('Klassendurchschnitt'),...list.map(a=>A.reportAverage(A.N.assessmentProgress(d,c,a).average,c)),...(withMean?[A.reportAverage(A.classAverages(c,d).categories[kind],c)]:[])]};};
A.buildReport=function(ctx,options={}){
 if(['roster','assessment','legacy-assessment','complete','kind-complete'].includes(ctx.type))return A.buildExtendedReport(ctx,options);
 const d=ctx.data||A.data,c=d.courses.find(c=>c.id===ctx.courseId);if(!c)throw Error('Das gewählte Fach ist nicht mehr vorhanden.');
 const cl=d.classes.find(x=>x.id===c.classId),year=d.years.find(y=>y.id===cl.yearId),w=ctx.w||A.defaults(),prefs=ctx.prefs||A.prefs,all=options.scope==='all',remarks=options.remarks??ctx.type==='pupil',grouping=options.grouping||prefs.pupilOrder||'kind',name=s=>A.N.name(s,prefs.nameFormat),sorted=list=>A.N.sorted(list,prefs.sortBy,prefs.sortDir),average=q=>A.reportAverage(q,c),pupil=s=>A.reportPupil(s,c,prefs);
 const report={type:ctx.type,kind:ctx.kind,title:A.reportTitle(ctx),year:A.schoolYear(year),className:cl.name,subject:c.name,created:A.today(),scope:ctx.type==='pupil'?(options.entries==='all'?'Alle Leistungen des Schülers':'Nur Leistungen mit Eintrag'):all?'Alle Einträge':'Mit aktuellen Filtern',intro:[],sections:[],recordIds:[],studentIds:[],remarks,precision:c.precision};
 const add=(title,headers,rows,extra={})=>report.sections.push({title,columns:headers.map(x=>typeof x==='string'?{label:x}:x),rows,...extra});
 const students=A.reportStudents(ctx,options),records=A.N.assessments(d,c.id),hasValue=a=>Object.values(a.results).some(r=>A.N.hasEntry(r)||remarks&&r?.note);
 if(ctx.type==='pupil'){
  const s=d.students.find(s=>s.id===ctx.studentId&&c.studentIds.includes(s.id));if(!s)throw Error('Bitte wähle einen Schüler.');report.student=name(s);report.title+=' – '+name(s);report.studentIds=[s.id];report.intro=A.reportWeightLines(c);const r=A.calculation(c,s.id,d),f=A.N.finalFor(d,c.id,s.id,'annual'),h=A.N.finalFor(d,c.id,s.id,'half'),halfType=A.N.halfType(d,c);
  add('Gesamtergebnis',['Ergebnis','Wert',...(remarks?['Bemerkung']:[])],[[text('Gesamtdurchschnitt'),average(r.total),...(remarks?[text('')]:[])],[text(A.N.FINAL_TYPES[halfType]),A.reportFinal(h,halfType),...(remarks?[text(h?.note||'')]:[])],[text('Zeugnisnote'),A.reportFinal(f,'annual'),...(remarks?[text(f?.note||'')]:[])]],{summary:true});
  const areas=['written',...A.kinds].filter(k=>r.categories[k]!==null);if(areas.length)add('Leistungsbereiche',['Bereich','Durchschnitt'],areas.map(k=>[text(A.N.KINDS[k]||A.N.OVERALL[k]),average(r.categories[k])]),{summary:true});
  const items=A.selectAssessments(d,c.id).filter(a=>(!a.participantIds||a.participantIds.includes(s.id))&&(options.entries==='all'||A.N.hasEntry(a.results[s.id])||remarks&&a.results[s.id]?.note));report.recordIds=items.map(a=>a.id);
  const labels=A.reportAssessmentLabels(records,{dated:false,flags:false}),groups=grouping==='date'?[['Einzelnoten',items]]:A.kinds.map(k=>[A.N.KINDS[k],items.filter(a=>a.kind===k)]).filter(([,items])=>items.length);
  for(const[title,list]of groups)if(list.length)add(title,[{label:'Datum',type:'date'},'Bezeichnung',...(grouping==='date'?['Leistungsart']:[]),{label:'Note / Status',type:'grade'},'Gewichtung',...(remarks?['Bemerkung']:[])],list.map(a=>[A.reportDate(a.date),text(labels.get(a.id)),...(grouping==='date'?[text(A.N.KINDS[a.kind])]:[]),A.reportPupilResult(a,s.id,options.points===true),text(A.reportFlags(a)),...(remarks?[text(a.results[s.id]?.note||'')]:[])]),{role:'entries'});
 }else if(ctx.type==='oral-individual'){
  const selected=A.selectOralRows(d,c,{...w,...(all?{oralSearch:'',oralStudent:'all'}:{})},prefs).filter(({a,s})=>A.N.hasEntry(a.results[s.id])||remarks&&a.results[s.id]?.note);const labels=A.reportAssessmentLabels(records,{dated:false,flags:false});report.recordIds=selected.map(x=>x.a.id);report.studentIds=[...new Set(selected.map(x=>x.s.id))];
  add('',[{label:'Datum',type:'date'},'Schüler','Bezeichnung',{label:'Note / Status',type:'grade'},...(remarks?['Bemerkung']:[]),'Gewichtung'],selected.map(({a,s})=>[A.reportDate(a.date),pupil(s),text(labels.get(a.id)),A.reportResult(a,s.id),...(remarks?[text(a.results[s.id]?.note||'')]:[]),text(A.reportFlags(a))]),{role:'entries'});
 }else if(ctx.type==='assessments'){
  const list=A.selectAssessments(d,c.id,ctx.kind,all?'':ctx.kind==='oral'?w.oralListSearch:w.assessmentSearch).filter(a=>ctx.kind!=='oral'||!A.N.isOralIndividual(a)),specific=list.some(a=>a.participantIds);report.recordIds=list.map(a=>a.id);report.studentIds=students.map(s=>s.id);
  add('',['Bezeichnung',{label:'Datum',type:'date'},'Leistungsart','Erfasst',{label:'Durchschnitt',type:'average'},...(specific?['Teilnahme']:[]),'Gewichtung'],list.map(a=>{const p=A.N.assessmentProgress(d,c,a);return[text(a.title),A.reportDate(a.date),text(A.N.KINDS[a.kind]+(A.N.isOralIndividual(a)?' – Einzelnote':'')),text(p.captured+' von '+p.total),average(p.average),...(specific?[text(a.participantIds?sorted(A.N.assessmentStudents(d,c,a)).map(name).join(', '):'Ganze Klasse')]:[]),text(A.reportFlags(a))];}));A.addReportRemarks(report,ctx,{remarks});
 }else if(ctx.type==='overview'){
  if(!A.hasCourseReportInformation(d,c)){report.intro.push('Für dieses Fach sind noch keine Noten erfasst.');report.empty=true;return A.finishReport(report);}
  report.intro=A.reportWeightLines(c);report.intro.push('KA: Klassenarbeiten · Halbjahr: '+A.N.finalLabel(d,c,'half'));const requested=new Set(w.columns||[]);if(requested.has('written')){requested.add('exam');requested.add('test');}let areas=['exam','test','written','oral','homework','notebook'].filter(k=>requested.has(k)&&(k==='written'?records.some(a=>['exam','test'].includes(a.kind)&&hasValue(a)):records.some(a=>a.kind===k&&hasValue(a))));
  // Six independent areas are the maximum; the two written subareas have
  // their own performance tables when the overview needs the four main areas.
  if(areas.length>4){const written=areas.some(k=>['exam','test','written'].includes(k));areas=areas.filter(k=>!['exam','test','written'].includes(k));if(written)areas.unshift('written');}const short={exam:'KA',test:'Tests',written:'Schriftlich',oral:'Mündlich',homework:'Hausaufgaben',notebook:'Heftführung'},means=A.classAverages(c,d);report.studentIds=students.map(s=>s.id);report.recordIds=records.map(a=>a.id);
  add('', ['Schüler',...areas.map(k=>({label:short[k],fullLabel:A.N.KINDS[k]||A.N.OVERALL[k],key:k,type:'average'})),{label:'Gesamt',fullLabel:'Gesamtdurchschnitt',key:'total',type:'average'},{label:'Halbjahr',fullLabel:A.N.finalLabel(d,c,'half'),key:'half',type:'grade'},{label:'Zeugnis',fullLabel:'Jahreszeugnisnote',key:'annual',type:'grade'}],students.map(s=>{const r=A.calculation(c,s.id,d);return[pupil(s),...areas.map(k=>average(r.categories[k])),average(r.total),A.reportFinal(A.N.finalFor(d,c.id,s.id,'half'),A.N.halfType(d,c)),A.reportFinal(A.N.finalFor(d,c.id,s.id,'annual'),'annual')];}),{matrix:true,overview:true,unbroken:true,fixed:1,footer:[text('Klassendurchschnitt'),...areas.map(k=>average(means.categories[k])),average(means.total),average(means.finals.half),average(means.finals.annual)]});A.addReportRemarks(report,ctx,{remarks,finals:true});
 }else{
  const list=records.filter(a=>a.kind===ctx.kind&&(ctx.kind!=='oral'||!A.N.isOralIndividual(a)&&hasValue(a))).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'de')||a.id.localeCompare(b.id));report.recordIds=list.map(a=>a.id);report.studentIds=students.map(s=>s.id);
  if(ctx.kind==='oral')report.sections.push(...A.oralReportSections(ctx,options,list));else report.sections.push(A.performanceTable(ctx,options,list));A.addReportRemarks(report,ctx,{remarks});
 }
 if(options.history)A.appendReportHistory(report,{...ctx,prefs},options);
 if(!report.sections.length)add('Einzelnoten',['Bezeichnung'],[]);
 A.legacyReportWarning(report,d,c);return A.finishReport(report);
};
// Deterministic typographic estimates in points. Layout never recalculates grades.
const extent=(value,size)=>Array.from(String(value)).reduce((n,ch)=>n+(/[ilI.,:;!'|]/u.test(ch)?.28:/[MW@%]/u.test(ch)?.88:/[A-ZÄÖÜ]/u.test(ch)?.66:.55)*size,0);
const quantile=values=>values.length?values.sort((a,b)=>a-b)[Math.floor((values.length-1)*.75)]:0;
function profiles(section,size){
 return section.columns.map((c,i)=>{
  const contents=section.rows.map(row=>String(row[i]?.text||'')),typical=quantile(contents.filter(Boolean).map(v=>Math.max(...v.split(/\r?\n/).map(t=>extent(t,size))))),maximum=contents.reduce((n,v)=>Math.max(n,extent(v,size)),0),heading=extent(c.label,size),words=c.label.split(/[\s,–]+/u),longest=Math.max(...words.map(t=>extent(t,size)),0),scale=size/10;
  let floor=48,cap=210;
  if(c.label==='Schüler'){floor=108;cap=185;}
  else if(c.type==='date'){floor=72;cap=84;}
  else if(c.type==='grade'||c.type==='average'){floor=c.type==='average'?48:37;cap=92;}
  else if(c.label==='Bezeichnung'){floor=105;cap=265;}
  else if(c.label==='Bemerkung'){floor=125;cap=300;}
  else if(c.label==='Gewichtung'){floor=65;cap=100;}
  let minimum=Math.max(floor*scale,Math.min(longest*1.28+12,92*scale),Math.min(heading/5.5+12,170*scale));
  if(c.label.startsWith('Halbjahres')||c.label==='Gesamtdurchschnitt')minimum=Math.max(minimum,heading+16);
  const desired=Math.max(minimum,Math.min(cap*scale,Math.max(heading/2.8+12,typical+12,Math.min(maximum+12,typical*1.25+24))));
  return {minimum,desired};
 });
}
function distribute(profile,width){
 const result=profile.map(p=>p.minimum);let remaining=width-result.reduce((a,b)=>a+b,0);
 if(remaining<-.01)throw Error('Die Tabelle ist für dieses Seitenformat zu breit.');
 const wants=profile.map((p,i)=>Math.max(0,p.desired-result[i])),total=wants.reduce((a,b)=>a+b,0);
 if(total){const amount=Math.min(total,remaining);for(let i=0;i<result.length;i++)result[i]+=amount*wants[i]/total;remaining-=amount;}
 if(remaining>0){const sum=profile.reduce((n,p)=>n+p.desired,0);for(let i=0;i<result.length;i++)result[i]+=remaining*profile[i].desired/sum;}
 return result;
}
function documentSections(report){
 return report.sections.map(original=>{
  const index=original.columns.findIndex(c=>c.label==='Bemerkung');
  if(index<0||!original.rows.some(row=>row[index].text.length>300))return original;
  return {...original,columns:original.columns.filter((c,i)=>i!==index),rows:original.rows.map(row=>row.filter((c,i)=>i!==index)),footer:original.footer?.filter((c,i)=>i!==index),paragraphs:[...(original.paragraphs||[]),...original.rows.filter(row=>row[index].text).map(row=>'Bemerkung – '+row.slice(0,Math.min(3,index)).map(c=>c.text).join(', ')+': '+row[index].text)]};
 });
}
A.reportLayout=function(report){
 const sections=documentSections(report),portrait=510,landscape=756;
 const profileFor=(section,size)=>section.unbroken?section.columns.map((c,i)=>({minimum:i?58:132,desired:i?84:180})):profiles(section,size);
 const portraitFits=sections.every(s=>{const p=profileFor(s,10);return (!s.unbroken||s.columns.length<=5)&&p.reduce((n,c)=>n+(report.type==='pupil'?c.minimum:c.desired),0)<=portrait;});
 const width=portraitFits?portrait:landscape,parts=[];
 for(const section of sections){
  let size=10,profile=profileFor(section,size);if(profile.reduce((n,c)=>n+c.minimum,0)>width){size=9;profile=profileFor(section,size);}
  if(profile.reduce((n,c)=>n+c.minimum,0)<=width+.01){parts.push({...section,fontSize:size,widths:distribute(profile,width),sourceIndices:section.columns.map((c,i)=>i)});continue;}
  // An overview is a single bounded table. It can continue only vertically.
  if(section.unbroken)throw Error('Die Notenübersicht ist für das Seitenformat zu breit.');
  const repeat=section.meanLast?[0,section.columns.length-1]:Array.from({length:section.matrix?(section.fixed||1):1},(_,i)=>i),candidates=section.columns.map((c,i)=>i).filter(i=>!repeat.includes(i)),groups=[];let group=[],used=repeat.reduce((n,i)=>n+profile[i].minimum,0),base=used;
  for(const index of candidates){if(group.length&&used+profile[index].minimum>width+.01){groups.push(group);group=[];used=base;}if(used+profile[index].minimum>width+.01)throw Error('Die Tabelle enthält eine zu breite Spalte.');group.push(index);used+=profile[index].minimum;}if(group.length)groups.push(group);
  if(groups.length>1&&groups.at(-1).length===1&&groups.at(-2).length>2)groups.at(-1).unshift(groups.at(-2).pop());
  for(let i=0;i<groups.length;i++){const indices=[...repeat,...groups[i]].sort((a,b)=>a-b),p=indices.map(n=>profile[n]);parts.push({...section,breakBefore:false,title:(section.title||report.title)+' – Teil '+(i+1)+' von '+groups.length,columns:indices.map(n=>section.columns[n]),rows:section.rows.map(row=>indices.map(n=>row[n])),footer:section.footer&&indices.map(n=>section.footer[n]),fontSize:size,widths:distribute(p,width),sourceIndices:indices,paragraphs:i===groups.length-1?section.paragraphs:[]});}
 }
 return {landscape:!portraitFits,width,sections:parts};
};
A.reportTables=report=>A.reportLayout(report).sections;
A.reportColumnWeights=s=>s.widths||profiles(s,s.fontSize||10).map(p=>p.desired);
A.reportScopeDescription=function(report){
 if(report.type==='complete')return 'Der Bericht enthält sämtliche Einzelnoten, Leistungsbereiche, Durchschnitte und Abschlussnoten des Fachs.';
 if(report.type==='kind-complete')return report.recordIds.length+' Leistungen mit sämtlichen Einzelnoten.';
 if(report.type==='assessment')return (report.studentIds.length===1?'Es wird 1 Schüler':'Es werden '+report.studentIds.length+' Schüler')+' für diese Leistung exportiert.';
 const all=report.scope==='Alle Einträge',n=report.type==='overview'||report.type==='matrix'?report.studentIds.length:report.recordIds.length,verb=n===1?'Es wird':'Es werden';
 if(!n)return 'Es sind keine passenden '+(report.type==='oral-individual'?'Einzelnoten':report.type==='overview'||report.type==='matrix'?'Schüler':'Leistungen')+' vorhanden.';
 if(report.type==='oral-individual')return verb+' '+(all&&n>1?'alle ':'')+n+' '+(n===1?'Einzelnote':'Einzelnoten')+' exportiert.';
 if(report.type==='pupil')return verb+' '+n+' '+(n===1?'Leistung':'Leistungen')+(report.scope==='Nur Leistungen mit Eintrag'?' mit Eintrag':' für diesen Schüler')+' exportiert.';
 if(report.type==='assessments')return verb+' '+(all&&n>1?'alle ':'')+n+' '+(!all&&n>1?'gefundene ':'')+(n===1?'Leistung':'Leistungen')+' exportiert.';
 const prefix=verb+' '+(all&&n>1?'alle ':'')+n+' Schüler';
 if(report.type==='overview'){const count=report.sections[0].columns.length-1;return prefix+' mit allen '+count+' Notenspalten exportiert.';}
 const count=report.recordIds.length,labels={exam:['Klassenarbeit','Klassenarbeiten'],test:['Test','Tests'],oral:['mündlichen Bewertungsrunde','mündlichen Bewertungsrunden'],homework:['Hausaufgabe','Hausaufgaben'],notebook:['Heftbewertung','Heftbewertungen']},label=labels[report.kind]||['Leistung','Leistungen'];
 return prefix+(count?' mit '+(count>1?'allen ':'')+count+' '+label[count===1?0:1]:' ohne '+label[1])+' exportiert.';
};
A.reportFilename=function(report,extension){const part=s=>String(s).normalize('NFKC').replace(/[^\p{L}\p{N}\p{M}_. -]/gu,'-').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,'-').replace(/[\s.]+$/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,60)||'Bericht';return 'Notenblick_'+[report.year.replace(/^Schuljahr\s+/i,'').replace('/','-'),report.className,report.subject,report.student||report.title].map(part).join('_').slice(0,210).replace(/[. ]+$/,'')+'.'+extension;};
})(globalThis.Notenblick);
