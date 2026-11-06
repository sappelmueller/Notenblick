(function(A){'use strict';
A.preferencesWorkspace=function(d){if(!d?.preferences)return null;const p=d.preferences;return{workspaces:Object.fromEntries(d.courses.map(c=>[c.id,{...A.defaults(),sortBy:p.sortBy,sortDir:p.sortDir,columns:p.columns.filter(k=>k!=='other')}]))};};
A.chooseMigration=async function(current,sources,loadError){
 if(!sources.length)return current?{key:'current'}:null;
 if(!current&&!loadError&&sources.length===1)return sources[0];
 const choices=[];if(current)choices.push({key:'current',label:'Vorhandener Ordner Daten',data:current});
 for(const s of sources){let data,error;try{const x=await window.NRDesktop.call('migration-read',{key:s.key});data=A.N.validate(JSON.parse(x.text.replace(/^\ufeff/,'')));}catch(e){error=e.message;}choices.push({...s,data,error});}
 const valid=choices.filter(x=>x.data);if(!valid.length)throw Error('Keiner der vorhandenen Datenbestände konnte sicher geöffnet werden. Bitte bewahre alle Dateien auf und stelle eine vollständige Sicherung wieder her.');
 return new Promise((resolve,reject)=>{
  A.modal('Datenbestand auswählen',`<p>Es wurden mehrere oder abweichende Datenbestände gefunden. Wähle den Stand, mit dem du weiterarbeiten möchtest. Die ursprünglichen Dateien bleiben erhalten.</p><div class="field"><label for="migrationSource">Datenbestand</label><select id="migrationSource">${valid.map(x=>A.opt(x.key,x.label+' – '+new Date(x.data.updatedAt).toLocaleString('de-DE')+' – '+x.data.students.length+' Schüler, '+x.data.assessments.length+' Leistungen','')).join('')}</select></div>${choices.filter(x=>x.error).map(x=>`<p class="hint">${A.esc(x.label)} konnte nicht geprüft werden.</p>`).join('')}${current?'<p class="notice">Wenn du den bisherigen Ordner wählst, ersetzt er den aktuellen Stand in Daten. Vorher werden beide Bestände gesichert.</p>':''}`,()=>{
    const found=valid.find(x=>x.key===A.val('migrationSource'));A.migrationCancel=null;resolve(found);
  },'Auswahl übernehmen');
  A.migrationCancel=()=>reject(Error('Die Übernahme wurde abgebrochen. Alle ursprünglichen Daten bleiben erhalten.'));
 });
};
A.legacyDialog=function(cid){
 const c=A.data.courses.find(x=>x.id===cid),source=A.N.legacyPending(A.data,cid);if(!source)throw Error('Für dieses Fach ist keine Übernahme offen.');
 A.ensureEdit(c);
 const records=A.data.legacyOther.assessments.filter(a=>a.courseId===cid);let previewSignature='',applied=false;
 const collect=()=>({choices:Object.fromEntries(records.map(a=>[a.id,A.val('legacy-'+a.id)])),overall:Object.fromEntries(Object.keys(A.N.OVERALL).map(k=>[k,A.val('legacy-weight-'+k).replace(',','.')]))});
 const simulate=()=>{const p=collect(),d=A.N.clone(A.data);A.N.resolveLegacy(d,cid,p.choices,p.overall);return{...p,data:d,signature:JSON.stringify(p)};};
 A.modal('Altbestand prüfen – '+c.name,`<p>Leistungen der entfernten Leistungsart wurden unverändert gesichert. Entscheide, welche du übernehmen möchtest. Ohne Übernahme bleiben sie ausschließlich im gesicherten Altbestand.</p><div class="table-panel"><div class="table-header"><h3 id="legacyRecordsTitle">Gesicherte Leistungen</h3></div><div class="table-wrap"><table aria-labelledby="legacyRecordsTitle"><thead><tr><th scope="col">Leistung</th><th scope="col">Datum</th><th scope="col">Übernehmen als</th></tr></thead><tbody>${records.map(a=>`<tr><th scope="row">${A.esc(a.title)}</th><td>${A.date(a.date)}</td><td><label class="sr-only" for="legacy-${a.id}">${A.esc(a.title)} übernehmen als</label><select id="legacy-${a.id}">${A.opt('','Im Altbestand belassen','')}${A.kinds.map(k=>A.opt(k,A.kindLabels[k],'')).join('')}</select></td></tr>`).join('')||'<tr><td colspan="3">Keine Einzelleistungen; eine bisherige Gewichtung muss angepasst werden.</td></tr>'}</tbody></table></div></div><fieldset><legend>Neue Gewichtung der Gesamtnote</legend><p class="hint">Bisheriger Anteil der entfernten Leistungsart: ${A.esc(source.overall.other)} %. Die neue Summe muss 100 % ergeben.</p><div class="weight-grid">${Object.entries(A.N.OVERALL).map(([k,l])=>A.field('legacy-weight-'+k,l+' (%)',c.weights.overall[k],'inputmode="decimal"')).join('')}</div></fieldset>${A.b('legacy-preview','Durchschnitte vergleichen')}<div id="legacyPreview"></div>`,async()=>{
  A.ensureEdit(A.data.courses.find(x=>x.id===cid));
  if(!applied){const p=simulate();if(p.signature!==previewSignature)throw Error('Bitte sieh dir zuerst die Auswirkungen der aktuellen Auswahl an.');
  if(A.store){await A.save();if(A.dirty)throw Error('Der aktuelle Stand konnte noch nicht gesichert werden.');}
  A.mutate(d=>A.N.resolveLegacy(d,cid,p.choices,p.overall));applied=true;}await A.save();
  if(A.store&&A.dirty)throw Error('Die Übernahme konnte noch nicht vollständig gespeichert werden. Bitte versuche die Bestätigung erneut.');
 },'Übernahme bestätigen');
 A.legacyPreview=()=>{const p=simulate();previewSignature=p.signature;const list=A.sorted(A.N.activeStudents(A.data,c,true));A.$('#legacyPreview').innerHTML=`<h3 id="legacyPreviewTitle">Auswirkungen auf die Gesamtdurchschnitte</h3><p class="hint">Zeugnisnoten bleiben unverändert. Die ursprünglichen Leistungen und Gewichtungen bleiben im Altbestand erhalten.</p><div class="table-wrap"><table aria-labelledby="legacyPreviewTitle"><thead><tr><th scope="col">Schüler</th><th scope="col">Bisher</th><th scope="col">Nach Übernahme</th></tr></thead><tbody>${list.map(s=>{const before=A.N.legacyCalculation(A.data,cid,s.id),after=A.N.calculate(p.data,p.data.courses.find(x=>x.id===cid),s.id);return`<tr><th scope="row">${A.rowName(s)}</th><td>${A.showAverage(before.total,c)}</td><td>${A.showAverage(after.total,c)}</td></tr>`;}).join('')}</tbody></table></div>`;};
};
})(globalThis.Notenblick);
(function(A){'use strict';
A.legacyArchive=function(cid,sid){
 const c=A.data.courses.find(c=>c.id===cid),source=A.data.legacyOther?.courses.find(x=>x.courseId===cid);if(!c||!source)throw Error('Für dieses Fach ist kein gesicherter Altbestand vorhanden.');
 const rows=A.data.legacyOther.assessments.filter(a=>a.courseId===cid).flatMap(a=>Object.entries(a.results).filter(([id])=>!sid||id===sid).map(([id,r])=>({a,s:A.getStudent(id),r})));
 A.modal('Gesicherter Altbestand – '+c.name,`<p>Die ursprünglichen Leistungen und Gewichtungen bleiben unverändert erhalten. ${source.status==='pending'?'Die Übernahme ist noch offen.':'Die Übernahme wurde am '+A.date(source.resolvedAt.slice(0,10))+' bestätigt.'}</p><h3>Ursprüngliche Gewichtung</h3><p>${Object.entries(source.overall).map(([k,v])=>A.esc((k==='other'?'Entfernte Leistungsart':A.N.OVERALL[k])+': '+v+' %')).join(' · ')}</p><h3 id="legacyArchiveTitle">Gesicherte Einzelnoten</h3><div class="table-wrap"><table aria-labelledby="legacyArchiveTitle"><thead><tr><th scope="col">Leistung</th><th scope="col">Datum</th><th scope="col">Schüler</th><th scope="col">Note oder Status</th><th scope="col">Bemerkung</th><th scope="col">Entscheidung</th></tr></thead><tbody>${rows.map(({a,s,r})=>`<tr><th scope="row">${A.esc(a.title)}<span class="secondary"><span class="sr-only">, </span>${A.esc(a.weight)}-fache Gewichtung</span></th><td>${A.date(a.date)}</td><td>${A.esc(A.studentName(s))}</td><td>${A.resultValue(r)}</td><td class="wrap-cell">${A.esc(r.note)}</td><td>${source.status==='pending'?'Noch offen':A.kindLabels[source.choices?.[a.id]]||'Im Altbestand belassen'}</td></tr>`).join('')||'<tr><td colspan="6">Keine gespeicherten Einzelnoten.</td></tr>'}</tbody></table></div>`,null);
};
})(globalThis.Notenblick);
