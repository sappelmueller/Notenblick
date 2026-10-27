/* Human-readable emergency lists; the existing exact evaluator remains authoritative. */
(function(N){'use strict';
N.TEXT_LIST_VERSION=16;
N.participationLabel=(s,c)=>s.archived?'Ehemaliger Schüler':(c.inactiveStudentIds||[]).includes(s.id)?'Nimmt nicht teil':'';
N.safePart=s=>String(s).normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/[. ]+$/g,'').slice(0,90)||'Ohne_Name';
N.plain=s=>String(s??'').replace(/[\r\n\t]/g,' ');
N.textDigest=async text=>Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text.replace(/^\ufeff/,''))))).map(b=>b.toString(16).padStart(2,'0')).join('');
N.exportsTXT=function(d){
 const files={},clean=s=>{let n=N.safePart(String(s).replaceAll('/','-')).trim();if(n.toLocaleLowerCase('de')==='daten'||/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i.test(n))n='_'+n;return n||'Ohne_Name';};
 const names=(items,fn)=>{const used=new Set(),out=new Map();for(const x of items){const base=clean(fn(x));let n=base,i=2;while(used.has(n.toLocaleLowerCase('de')))n=base+' ('+i+++')';used.add(n.toLocaleLowerCase('de'));out.set(x.id,n);}return out;};
 const date=s=>s.split('-').reverse().join('.'),number=s=>String(s).replace('.',','),value=(q,c)=>q===null?'–':N.show(q,c),put=(p,lines)=>files[p]='\ufeff'+lines.join('\r\n')+'\r\n';
 const result=r=>r?.status==='graded'?number(r.grade):N.STATUS[r?.status||'open'];
 const years=names(d.years,y=>y.label);
 for(const y of d.years){const classes=d.classes.filter(cl=>cl.yearId===y.id),classNames=names(classes,cl=>cl.name);
  for(const cl of classes){const base=years.get(y.id)+'/'+classNames.get(cl.id),classStudents=N.sorted(d.students.filter(s=>s.classId===cl.id)),courses=d.courses.filter(c=>c.classId===cl.id),courseNames=names(courses,c=>c.name);
   put(base+'/Schülerliste.txt',[`Klasse ${cl.name} – ${y.label}`,'',...(classStudents.length?classStudents.map(s=>N.name(s)+(s.archived?' (ehemalig)':'')):['Noch keine Schüler erfasst.'])]);
   for(const c of courses){const folder=base+'/'+courseNames.get(c.id),head=`${c.name} – Klasse ${cl.name} – ${y.label}`,list=N.assessments(d,c.id,'all'),students=N.sorted(N.activeStudents(d,c,true)),studentNames=names(students,s=>N.name(s).replace(/\s+/g,'_')),calculated=new Map(students.map(s=>[s.id,N.calculate(d,c,s.id)]));
    const weights=['Gewichtung: '+Object.entries(N.overallLabels(c)).filter(([k])=>N.Q.from(c.weights.overall[k]).n).map(([k,label])=>label+' '+number(c.weights.overall[k])+' %').join(', '),N.courseMode(c)==='direct'?'Berechnung: Leistungsarten einzeln gewichten':'Schriftlich: Klassenarbeiten '+number(c.weights.written.exam)+' %, Tests '+number(c.weights.written.test)+' %'];
    const explanation='Durchschnitte und Leistungsbereiche sind berechnet. Halbjahres- und Zeugnisnoten sind manuell festgelegt.';
    const historical=s=>{const out=[];for(const f of [...(d.previousFinals||[]),...d.finals.filter(f=>f.period!=='all'&&!N.isHalfFinal(f))].filter(f=>f.courseId===c.id&&f.studentId===s.id))out.push('Bisherige Zeugnisnote, Abschnitt '+f.period+': '+number(f.grade)+(f.note?' – '+N.plain(f.note):''));if(s.originStudentId){const prior=d.students.find(x=>x.id===s.originStudentId),pc=d.classes.find(x=>x.id===prior?.classId),py=d.years.find(x=>x.id===pc?.yearId);if(pc)out.push('Frühere Klasse: '+pc.name+(py?' – '+py.label:''));}return out;};
    const summary=s=>{const r=calculated.get(s.id),h=N.finalFor(d,c.id,s.id,'half'),f=N.finalFor(d,c.id,s.id,'annual'),out=[];for(const k of ['exam','test','written','oral','homework','notebook'])if(r.categories[k]!==null||(k==='written'?list.some(a=>['exam','test'].includes(a.kind)):list.some(a=>a.kind===k)))out.push((k==='written'?'Schriftlich':N.KINDS[k])+': '+value(r.categories[k],c));out.push('Durchschnitt: '+(r.blocked?'Altbestand noch prüfen':value(r.total,c)));if(r.total&&r.missing.length)out.push('Vorläufig; ohne bewertete Leistungen: '+r.missing.join(', '));out.push(N.finalLabel(d,c,'half')+': '+N.finalText(h?.grade,h?.reportType||N.halfType(d,c))+(N.finalConflict(h,N.halfType(d,c))?' (bisher: '+(N.FINAL_TYPES[h.reportType]||'Altbestand')+')':''),'Zeugnisnote: '+N.finalText(f?.grade,f?.reportType||'annual'));if(h?.note)out.push('Bemerkung zum Halbjahr: '+N.plain(h.note));if(f?.note)out.push('Bemerkung zur Zeugnisnote: '+N.plain(f.note));return out.concat(historical(s));};
    const status=s=>s.archived?' (ehemaliger Klassenschüler)':(c.inactiveStudentIds||[]).includes(s.id)?' (nimmt nicht teil)':'';
    const overview=[head,...weights,explanation,'',...(!list.length?['Noch keine Leistungen erfasst.','']:[])];if(!students.length)overview.push('Noch keine Schüler zugeordnet.','');
    for(const s of students){overview.push(N.name(s)+status(s),...summary(s));for(const a of list){const r=a.results[s.id];if(r?.note)overview.push('Bemerkung zu '+a.title+' ('+date(a.date)+'): '+N.plain(r.note));}overview.push('');}
    const avg=N.average(N.activeStudents(d,c).map(s=>({value:calculated.get(s.id).total})));if(avg)overview.push('Klassendurchschnitt: '+N.show(avg,c));put(folder+'/Notenübersicht.txt',overview);
    for(const s of students){const lines=[head,'Schüler: '+N.name(s)+status(s),...weights,explanation,'',...summary(s),''];let any=false;
     for(const kind of Object.keys(N.KINDS)){const entries=list.filter(a=>a.kind===kind&&(!a.participantIds||a.participantIds.includes(s.id))).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'de')||a.id.localeCompare(b.id));if(!entries.length)continue;any=true;lines.push(N.KINDS[kind]);for(const a of entries){lines.push(date(a.date)+' · '+a.title+': '+result(a.results[s.id]),'Gewichtungsfaktor: '+number(a.weight)+(a.isGfs?' · GFS':''));if(a.period)lines.push('Gespeicherter Zeitabschnitt: '+a.period);if(a.results[s.id]?.note)lines.push('Bemerkung: '+N.plain(a.results[s.id].note));}lines.push('');}
     const archive=d.legacyOther?.assessments?.filter(a=>a.courseId===c.id&&a.results[s.id]);if(archive?.length){lines.push('Gesicherter Altbestand');for(const a of archive){lines.push(date(a.date)+' · '+a.title+': '+result(a.results[s.id]),'Gewichtungsfaktor: '+number(a.weight)+(a.isGfs?' · GFS':''));if(a.results[s.id].note)lines.push('Bemerkung: '+N.plain(a.results[s.id].note));}lines.push('Ursprüngliche Gewichtung: '+Object.entries(d.legacyOther.courses.find(x=>x.courseId===c.id)?.overall||{}).map(([k,v])=>(N.OVERALL[k]||'Sonstige Leistungen')+' '+number(v)+' %').join(', '));}
     if(!any)lines.push('Noch keine Leistungen erfasst.');put(folder+'/Schülernoten/'+studentNames.get(s.id)+'.txt',lines);
    }
    for(const kind of Object.keys(N.KINDS)){const entries=list.filter(a=>a.kind===kind).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'de')||a.id.localeCompare(b.id)),fileNames=names(entries,a=>a.date+' - '+a.title);
     for(const a of entries){const lines=[head,a.title,'Datum: '+date(a.date),'Gewichtungsfaktor: '+number(a.weight)+(a.isGfs?' · GFS':''),...(a.isGfs?['GFS']:[]),''];for(const s of N.sorted(N.assessmentStudents(d,c,a,true))){const r=a.results[s.id];lines.push(N.name(s)+status(s)+': '+result(r));if(r?.note)lines.push('Bemerkung: '+N.plain(r.note));}const avg=N.average(N.activeStudents(d,c).filter(s=>!a.participantIds||a.participantIds.includes(s.id)).map(s=>a.results[s.id]).filter(r=>r?.status==='graded').map(r=>({value:r.grade})));if(avg)lines.push('','Durchschnitt der teilnehmenden Schüler: '+N.show(avg,c));put(folder+'/'+(kind==='oral'?'Mündliche Noten':N.KINDS[kind])+'/'+fileNames.get(a.id)+'.txt',lines);}
    }
   }
  }
 }
 return files;
};
})(globalThis.NR=globalThis.NR||{});
