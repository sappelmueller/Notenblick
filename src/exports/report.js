/* One immutable report model. All results come from NR.calculate and NR.show. */
(function(A){'use strict';
const text=value=>({text:String(value??'')});
A.reportCell=text;
A.reportDate=value=>({text:A.date(value),date:value});
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
A.reportTitle=ctx=>ctx.type==='overview'?'Notenübersicht':ctx.type==='pupil'?'Schülernoten':ctx.type==='oral-individual'?'Mündliche Einzelnoten':ctx.kind==='oral'?'Mündliche Klassenübersicht':ctx.type==='assessments'&&ctx.kind==='all'?'Leistungen':A.N.KINDS[ctx.kind]||'Leistungen';
A.reportOrientation=r=>'Notenblick · '+r.subject+' · '+r.className+' · '+r.year.replace(/^Schuljahr\s+/i,'');
A.reportGroupingDescription=grouping=>grouping==='date'?'Alle Einzelnoten werden gemeinsam nach Datum sortiert, neueste zuerst.':'Die Einzelnoten werden nach Leistungsarten gruppiert, innerhalb der Gruppen neueste zuerst.';
A.batchStudents=function(ctx,includeExited=false){
 const course=A.data.courses.find(c=>c.id===ctx.courseId);if(!course)throw Error('Das gewählte Fach ist nicht mehr vorhanden.');
 return A.N.sorted(A.N.activeStudents(A.data,course,includeExited),ctx.prefs.sortBy,ctx.prefs.sortDir);
};
A.batchEntryName=function(student,extension,used){
 let base=(student.first+'_'+student.last).normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,'_').replace(/[\s.]+/g,'_').replace(/^_+|_+$/g,'').slice(0,100)||'Schueler';
 if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(base))base='Schueler_'+base;
 let name=base+'.'+extension,n=1;while(used.has(name.toLocaleLowerCase('de')))name=base+'_'+(++n)+'.'+extension;used.add(name.toLocaleLowerCase('de'));return name;
};
A.buildReport=function(ctx,options={}){
 const d=A.data,c=d.courses.find(c=>c.id===ctx.courseId);if(!c)throw Error('Das gewählte Fach ist nicht mehr vorhanden.');
 const cl=d.classes.find(x=>x.id===c.classId),year=d.years.find(y=>y.id===cl.yearId),w=ctx.w,prefs=ctx.prefs,all=options.scope==='all',remarks=options.remarks??ctx.type==='pupil',grouping=options.grouping||prefs.pupilOrder||'kind',name=s=>A.N.name(s,prefs.nameFormat),sorted=list=>A.N.sorted(list,prefs.sortBy,prefs.sortDir),cache=new Map();
 const calc=sid=>{if(!cache.has(sid))cache.set(sid,A.calculation(c,sid));return cache.get(sid);};
 const average=value=>value===null?text('–'):{text:A.N.show(value,c),number:Number(A.N.show(value,c).replace(',','.')),format:'average',precision:c.precision};
 const flags=a=>[a.isGfs?'GFS':'',A.N.Q.from(a.weight).cmp(1)!==0n?'Faktor '+a.weight.replace('.',','):''].filter(Boolean).join(', ');
 const pupil=s=>text(name(s)+(A.N.participationLabel(s,c)?' ('+A.N.participationLabel(s,c)+')':''));
 const result=(a,sid)=>a.participantIds&&!a.participantIds.includes(sid)?text('Nimmt nicht teil'):a.results[sid]?.status==='graded'?A.reportGrade(a.results[sid].grade):text(A.N.STATUS[a.results[sid]?.status||'open']);
 const column=(label,type='text')=>({label,type});
 const classNote='Klassendurchschnitt: alle aktiven Schüler des Fachs, unabhängig von Suche und Umfang.';
 const report={type:ctx.type,kind:ctx.kind,title:A.reportTitle(ctx),year:A.schoolYear(year),className:cl.name,subject:c.name,created:A.today(),scope:ctx.type==='pupil'?(options.entries==='entered'?'Nur Leistungen mit Eintrag':'Alle Leistungen des Schülers'):all?'Alle Einträge':'Mit aktuellen Filtern',sections:[],recordIds:[],studentIds:[],remarks,precision:c.precision};
 const add=(title,headers,rows,extra={})=>report.sections.push({title,columns:headers.map(x=>typeof x==='string'?column(x):x),rows,...extra});
 let students=sorted(A.N.activeStudents(d,c,all||w.showExited));
 if(!all){const term=(ctx.type!=='overview'&&ctx.kind==='oral'?w.oralClassSearch:w.search).toLocaleLowerCase('de');students=students.filter(s=>[name(s),A.N.name(s,'first-last'),A.N.name(s,'last-first')].some(t=>t.toLocaleLowerCase('de').includes(term)));}
 if(ctx.type==='pupil'){
  const s=d.students.find(s=>s.id===ctx.studentId&&c.studentIds.includes(s.id));if(!s)throw Error('Bitte wähle einen Schüler.');report.student=name(s);report.title+=' – '+name(s);report.studentIds=[s.id];const r=calc(s.id),f=A.N.finalFor(d,c.id,s.id,'annual'),h=A.N.finalFor(d,c.id,s.id,'half'),halfType=A.N.halfType(d,c);
  add('Gesamtergebnis',['Ergebnis','Wert',...(remarks?['Bemerkung']:[])],[[text('Gesamtdurchschnitt (berechnet)'),average(r.total),...(remarks?[text('')]:[])],[text(A.N.FINAL_TYPES[halfType]+' (manuell festgelegt)'),A.reportFinal(h,halfType),...(remarks?[text(h?.note||'')]:[])],[text('Zeugnisnote (manuell festgelegt)'),A.reportFinal(f,'annual'),...(remarks?[text(f?.note||'')]:[])]],{summary:true});
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
  const means=A.classAverages(c);report.studentIds=students.map(s=>s.id);add('', ['Schüler',...w.columns.map(k=>column(A.N.KINDS[k]||A.N.OVERALL[k],'average')),column('Gesamtdurchschnitt','average'),column(A.N.finalLabel(d,c,'half'),'grade'),column('Zeugnisnote','grade')],students.map(s=>{const r=calc(s.id),f=A.N.finalFor(d,c.id,s.id,'annual'),h=A.N.finalFor(d,c.id,s.id,'half'),halfType=A.N.halfType(d,c);return[pupil(s),...w.columns.map(k=>average(r.categories[k])),average(r.total),A.reportFinal(h,halfType),A.reportFinal(f,'annual')];}),{matrix:true,fixed:1,description:'Gesamtdurchschnitt: berechnet. Halbjahres- und Zeugnisnoten: manuell festgelegt. '+classNote,footer:[text('Klassendurchschnitt'),...w.columns.map(k=>average(means.categories[k])),average(means.total),text('–'),text('–')]});
  if(remarks){const rows=[];for(const student of students)for(const period of ['half','annual']){const f=A.N.finalFor(d,c.id,student.id,period);if(f?.note)rows.push([pupil(student),text(A.N.FINAL_TYPES[f.reportType]||A.N.finalLabel(d,c,period)),text(f.note)]);}if(rows.length)add('Bemerkungen zu Abschlussnoten',['Schüler','Abschluss','Bemerkung'],rows);}
 }else{
  const list=A.N.assessments(d,c.id).filter(a=>a.kind===ctx.kind&&(ctx.kind!=='oral'||!A.N.isOralIndividual(a))).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'de')||a.id.localeCompare(b.id));report.recordIds=list.map(a=>a.id);report.studentIds=students.map(s=>s.id);
  add('', ['Schüler',column('Durchschnitt','average'),...list.map(a=>column(a.title+', '+A.date(a.date)+(flags(a)?' ('+flags(a)+')':''),'grade'))],students.map(s=>[pupil(s),average(calc(s.id).categories[ctx.kind]),...list.map(a=>result(a,s.id))]),{matrix:true,fixed:2,description:classNote,footer:[text('Klassendurchschnitt'),average(A.classAverages(c).categories[ctx.kind]),...list.map(a=>average(A.assessmentStats(a,c).average))]});
  if(remarks){const rows=[];for(const s of students)for(const a of list)if((!a.participantIds||a.participantIds.includes(s.id))&&a.results[s.id]?.note)rows.push([pupil(s),text(a.title+', '+A.date(a.date)),text(a.results[s.id].note)]);if(rows.length)add('Bemerkungen',['Schüler','Leistung','Bemerkung'],rows);}
 }
 if(!report.sections.length)add('Einzelnoten',['Bezeichnung'],[]);
 report.landscape=A.reportLayout(report).landscape;return report;
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
  return {...original,columns:original.columns.filter((c,i)=>i!==index),rows:original.rows.map(row=>row.filter((c,i)=>i!==index)),paragraphs:[...(original.paragraphs||[]),...original.rows.filter(row=>row[index].text).map(row=>'Bemerkung – '+row.slice(0,Math.min(3,index)).map(c=>c.text).join(', ')+': '+row[index].text)]};
 });
}
A.reportLayout=function(report){
 const sections=documentSections(report),portrait=510,landscape=756;
 // Prefer a comfortable portrait table; pupil reports retain their section layout.
 const portraitFits=sections.every(s=>{const p=profiles(s,10);return p.reduce((n,c)=>n+(report.type==='pupil'?c.minimum:c.desired),0)<=portrait;});
 const width=portraitFits?portrait:landscape,parts=[];
 for(const section of sections){
  let size=10,profile=profiles(section,size);
  if(profile.reduce((n,c)=>n+c.minimum,0)>width){size=9;profile=profiles(section,size);}
  if(profile.reduce((n,c)=>n+c.minimum,0)<=width+.01){parts.push({...section,fontSize:size,widths:distribute(profile,width),sourceIndices:section.columns.map((c,i)=>i)});continue;}
  // Only real width pressure splits a matrix. Names/averages repeat; each
  // performance column appears once, in its original order, at readable size.
  const fixed=section.matrix?(section.fixed||1):1,groups=[];let start=fixed;
  while(start<section.columns.length){
   const indices=Array.from({length:fixed},(_,i)=>i);let used=indices.reduce((n,i)=>n+profile[i].minimum,0);
   while(start<section.columns.length&&(used+profile[start].minimum<=width+.01||indices.length===fixed)){indices.push(start);used+=profile[start++].minimum;}
   if(used>width+.01)throw Error('Die Tabelle enthält eine zu breite Spalte.');groups.push(indices);
  }
  for(let i=0;i<groups.length;i++){
   const indices=groups[i],p=indices.map(n=>profile[n]);
   parts.push({...section,breakBefore:i>0,title:(section.title||report.title)+' – Teil '+(i+1)+' von '+groups.length,columns:indices.map(n=>section.columns[n]),rows:section.rows.map(row=>indices.map(n=>row[n])),footer:section.footer&&indices.map(n=>section.footer[n]),fontSize:size,widths:distribute(p,width),sourceIndices:indices,paragraphs:i===groups.length-1?section.paragraphs:[]});
  }
 }
 return {landscape:!portraitFits,width,sections:parts};
};
A.reportTables=report=>A.reportLayout(report).sections;
A.reportColumnWeights=s=>s.widths||profiles(s,s.fontSize||10).map(p=>p.desired);
A.reportScopeDescription=function(report){
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
