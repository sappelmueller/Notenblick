/* One immutable report model. All results come from NR.calculate and NR.show. */
(function(A){'use strict';
const text=value=>({text:String(value??'')});
A.reportCell=text;
A.reportDate=value=>({text:A.date(value),date:value});
A.reportGrade=value=>value===null||value===undefined?text('–'):{text:String(value).replace('.',','),number:Number(value)};
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
A.reportTitle=ctx=>ctx.type==='overview'?'Notenübersicht':ctx.type==='pupil'?'Schülernoten':ctx.type==='oral-individual'?'Mündliche Einzelnoten':ctx.kind==='oral'?'Mündliche Klassenübersicht':ctx.type==='assessments'&&ctx.kind==='all'?'Leistungen':A.N.KINDS[ctx.kind]||'Leistungen';
A.buildReport=function(ctx,options={}){
 const d=A.data,c=d.courses.find(c=>c.id===ctx.courseId);if(!c)throw Error('Das gewählte Fach ist nicht mehr vorhanden.');
 const cl=d.classes.find(x=>x.id===c.classId),year=d.years.find(y=>y.id===cl.yearId),w=ctx.w,prefs=ctx.prefs,all=options.scope==='all',remarks=options.remarks??ctx.type==='pupil',grouping=options.grouping||prefs.pupilOrder||'kind',name=s=>A.N.name(s,prefs.nameFormat),sorted=list=>A.N.sorted(list,prefs.sortBy,prefs.sortDir),cache=new Map();
 const calc=sid=>{if(!cache.has(sid))cache.set(sid,A.calculation(c,sid));return cache.get(sid);};
 const average=value=>value===null?text('–'):{text:A.N.show(value,c),number:Number(A.N.show(value,c).replace(',','.')),format:'average',precision:c.precision};
 const flags=a=>[a.isGfs?'GFS':'',A.N.Q.from(a.weight).cmp(1)!==0n?'Faktor '+a.weight.replace('.',','):''].filter(Boolean).join(', ');
 const pupil=s=>text(name(s)+(s.archived||(c.inactiveStudentIds||[]).includes(s.id)?' (ausgeschieden)':''));
 const result=(a,sid)=>a.participantIds&&!a.participantIds.includes(sid)?text('Nicht beteiligt'):a.results[sid]?.status==='graded'?A.reportGrade(a.results[sid].grade):text(A.N.STATUS[a.results[sid]?.status||'open']);
 const column=(label,type='text')=>({label,type});
 const report={type:ctx.type,kind:ctx.kind,title:A.reportTitle(ctx),year:A.schoolYear(year),className:cl.name,subject:c.name,created:A.today(),scope:ctx.type==='pupil'?(options.entries==='entered'?'Nur Leistungen mit Eintrag':'Alle Leistungen des Schülers'):all?'Alle Einträge':'Aktuelle Auswahl',sections:[],recordIds:[],studentIds:[],remarks,precision:c.precision};
 const add=(title,headers,rows,extra={})=>report.sections.push({title,columns:headers.map(x=>typeof x==='string'?column(x):x),rows,...extra});
 let students=sorted(A.N.activeStudents(d,c,all||w.showExited));
 if(!all){const term=(ctx.type!=='overview'&&ctx.kind==='oral'?w.oralClassSearch:w.search).toLocaleLowerCase('de');students=students.filter(s=>[name(s),A.N.name(s,'first-last'),A.N.name(s,'last-first')].some(t=>t.toLocaleLowerCase('de').includes(term)));}
 if(ctx.type==='pupil'){
  const s=d.students.find(s=>s.id===ctx.studentId&&c.studentIds.includes(s.id));if(!s)throw Error('Bitte wähle einen Schüler.');report.student=name(s);report.title+=' – '+name(s);report.studentIds=[s.id];const r=calc(s.id),f=d.finals.find(f=>f.courseId===c.id&&f.studentId===s.id&&f.period==='all');
  add('Gesamtergebnis',['Ergebnis','Wert'],[[text('Gesamtdurchschnitt (berechnet)'),average(r.total)],[text('Zeugnisnote (manuell festgelegt)'),A.reportGrade(f?.grade)]],{summary:true});
  if(remarks&&f?.note)report.sections.at(-1).paragraphs=['Bemerkung zur Zeugnisnote: '+f.note];
  add('Leistungsbereiche',['Bereich','Durchschnitt','Gewichtung'],['written',...A.kinds].map(k=>[text(A.N.KINDS[k]||A.N.OVERALL[k]),average(r.categories[k]),text(A.N.areaWeight(c,k).cmp(0)===0n?'Nicht gewichtet':A.N.areaWeight(c,k).fixed(4).replace(/,?0+$/,'')+' %')]),{summary:true});
  const entries=options.entries||'all',items=A.selectAssessments(d,c.id).filter(a=>(!a.participantIds||a.participantIds.includes(s.id))&&(entries!=='entered'||A.N.hasEntry(a.results[s.id])));report.recordIds=items.map(a=>a.id);
  const groups=grouping==='date'?[['Einzelnoten',items]]:A.kinds.map(k=>[A.N.KINDS[k],items.filter(a=>a.kind===k)]).filter(([,items])=>items.length);
  for(const[title,list]of groups)add(title,[column('Datum','date'),'Bezeichnung',...(grouping==='date'?['Leistungsart']:[]),column('Note / Status','grade'),'Gewichtung',...(remarks?['Bemerkung']:[])],list.map(a=>[A.reportDate(a.date),text(a.title),...(grouping==='date'?[text(A.N.KINDS[a.kind])]:[]),result(a,s.id),text(flags(a)),...(remarks?[text(a.results[s.id]?.note||'')]:[])]));
 }else if(ctx.type==='oral-individual'){
  const selected=A.selectOralRows(d,c,{...w,...(all?{oralSearch:'',oralStudent:'all'}:{})},prefs);report.recordIds=selected.map(x=>x.a.id);report.studentIds=[...new Set(selected.map(x=>x.s.id))];
  const weighted=selected.some(x=>flags(x.a));add('',[column('Datum','date'),'Schüler','Bezeichnung',column('Note / Status','grade'),...(remarks?['Bemerkung']:[]),...(weighted?['Gewichtung']:[])],selected.map(({a,s})=>[A.reportDate(a.date),pupil(s),text(a.title),result(a,s.id),...(remarks?[text(a.results[s.id]?.note||'')]:[]),...(weighted?[text(flags(a))]:[])]));
 }else if(ctx.type==='assessments'){
  const list=A.selectAssessments(d,c.id,ctx.kind,all?'':ctx.kind==='oral'?w.oralListSearch:w.assessmentSearch).filter(a=>ctx.kind!=='oral'||!A.N.isOralIndividual(a));report.recordIds=list.map(a=>a.id);
  add('',['Bezeichnung',column('Datum','date'),'Leistungsart','Erfasst',column('Durchschnitt','average'),'Teilnahme','Gewichtung'],list.map(a=>{const p=A.N.assessmentProgress(d,c,a),members=A.N.assessmentStudents(d,c,a);return[text(a.title),A.reportDate(a.date),text(A.N.KINDS[a.kind]+(A.N.isOralIndividual(a)?' – Einzelnote':'')),text(p.captured+' von '+p.total),average(p.average),text(a.participantIds?sorted(members).map(name).join(', '):'Ganze Klasse'),text(flags(a))];}));
  if(remarks){const listRows=[];for(const a of list)for(const s of sorted(A.N.assessmentStudents(d,c,a)))if(a.results[s.id]?.note)listRows.push([text(a.title+', '+A.date(a.date)),pupil(s),text(a.results[s.id].note)]);if(listRows.length)add('Bemerkungen',['Leistung','Schüler','Bemerkung'],listRows);}
 }else if(ctx.type==='overview'){
  report.studentIds=students.map(s=>s.id);add('', ['Schüler',...w.columns.map(k=>column(A.N.KINDS[k]||A.N.OVERALL[k],'average')),column('Gesamtdurchschnitt (berechnet)','average'),column('Zeugnisnote (manuell)','grade')],students.map(s=>{const r=calc(s.id),f=d.finals.find(f=>f.courseId===c.id&&f.studentId===s.id&&f.period==='all');return[pupil(s),...w.columns.map(k=>average(r.categories[k])),average(r.total),A.reportGrade(f?.grade)];}),{matrix:true,fixed:1});
  if(remarks){const rows=students.map(s=>({s,f:d.finals.find(f=>f.courseId===c.id&&f.studentId===s.id&&f.period==='all')})).filter(x=>x.f?.note).map(({s,f})=>[pupil(s),text(f.note)]);if(rows.length)add('Bemerkungen zur Zeugnisnote',['Schüler','Bemerkung'],rows);}
 }else{
  const list=A.N.assessments(d,c.id).filter(a=>a.kind===ctx.kind&&(ctx.kind!=='oral'||!A.N.isOralIndividual(a))).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'de')||a.id.localeCompare(b.id));report.recordIds=list.map(a=>a.id);report.studentIds=students.map(s=>s.id);
  add('', ['Schüler',column('Durchschnitt','average'),...list.map(a=>column(a.title+', '+A.date(a.date)+(flags(a)?' ('+flags(a)+')':''),'grade'))],students.map(s=>[pupil(s),average(calc(s.id).categories[ctx.kind]),...list.map(a=>result(a,s.id))]),{matrix:true,fixed:2});
  if(remarks){const rows=[];for(const s of students)for(const a of list)if((!a.participantIds||a.participantIds.includes(s.id))&&a.results[s.id]?.note)rows.push([pupil(s),text(a.title+', '+A.date(a.date)),text(a.results[s.id].note)]);if(rows.length)add('Bemerkungen',['Schüler','Leistung','Bemerkung'],rows);}
 }
 if(!report.sections.length)add('Einzelnoten',['Bezeichnung'],[]);
 report.landscape=report.sections.some(s=>s.columns.length>5||(ctx.type!=='pupil'&&s.columns.length>=4&&s.rows.some(row=>row.reduce((n,c)=>n+c.text.length,0)>140)));return report;
};
A.reportColumnWeights=s=>s.columns.map(c=>c.type==='date'?1.25:c.label==='Schüler'?1.7:c.label==='Bezeichnung'?3:c.label==='Bemerkung'?3:c.label==='Gewichtung'?1.2:c.type==='grade'||c.type==='average'?.9:2);
A.reportTables=function(report,maxColumns=6){const sections=[];for(const original of report.sections){let section=original;const remark=section.columns.findIndex(c=>c.label==='Bemerkung');if(remark>=0&&section.rows.some(row=>row[remark].text.length>300)){section={...section,columns:section.columns.filter((c,i)=>i!==remark),rows:section.rows.map(row=>row.filter((c,i)=>i!==remark)),paragraphs:[...(section.paragraphs||[]),...section.rows.filter(row=>row[remark].text).map(row=>'Bemerkung – '+row.slice(0,Math.min(3,remark)).map(c=>c.text).join(', ')+': '+row[remark].text)]};}if(section.matrix&&section.columns.length>maxColumns){const fixed=section.fixed||1,step=maxColumns-fixed,count=Math.ceil((section.columns.length-fixed)/step);for(let start=fixed,index=1;start<section.columns.length;start+=step,index++){const indices=[...Array(fixed).keys(),...Array.from({length:Math.min(step,section.columns.length-start)},(_,i)=>start+i)];sections.push({...section,title:(section.title||report.title)+' – Spaltengruppe '+index+' von '+count,columns:indices.map(i=>section.columns[i]),rows:section.rows.map(row=>indices.map(i=>row[i]))});}}else sections.push(section);}return sections;};
A.reportFilename=function(report,extension){const part=s=>String(s).normalize('NFKC').replace(/[^\p{L}\p{N}\p{M}_. -]/gu,'-').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,'-').replace(/[\s.]+$/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,60)||'Bericht';return 'Notenblick_'+[report.year.replace(/^Schuljahr\s+/i,'').replace('/','-'),report.className,report.subject,report.student||report.title].map(part).join('_').slice(0,210).replace(/[. ]+$/,'')+'.'+extension;};
})(globalThis.Notenblick);
