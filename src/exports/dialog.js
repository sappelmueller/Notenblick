/* One contextual export dialog and one file dispatcher for every note view. */
(function(A){'use strict';
const formats={print:['Drucken',null],pdf:['PDF','application/pdf'],docx:['Word','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],xlsx:['Excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],txt:['Text','text/plain;charset=utf-8'],csv:['CSV','text/csv;charset=utf-8']};
A.renderReportFile=async function(report,format){
 const value=format==='pdf'?await A.reportPdf(report):format==='docx'?A.reportDocx(report):format==='xlsx'?A.reportXlsx(report):format==='txt'?A.reportText(report):format==='csv'?A.reportCSV(report):null;
 if(value===null)throw Error('Unbekanntes Ausgabeformat.');return value;
};
const saveError=error=>Error(error.code==='export-location-unavailable'?'Der Speicherort ist nicht verfügbar.':error.code==='export-permission'?'An diesem Speicherort darf die Datei nicht gespeichert werden.':error.code==='export-invalid-file'?'Die erstellte Datei ist ungültig und wurde nicht gespeichert.':'Die Datei konnte nicht gespeichert werden. Deine Noten bleiben unverändert.');
A.exportFile=async function(context,options,format,prepared,stillRequested=()=>true,notify=true){
 let report,value;
 try{report=prepared||A.buildReport(context,options);if(format==='print')return await A.printReport(report,stillRequested);value=await A.renderReportFile(report,format);}
 catch{if(!stillRequested())return false;throw Error('Die Datei konnte nicht erstellt werden. Deine Noten bleiben unverändert.');}
 if(!stillRequested())return false;
 try{return await A.download(A.reportFilename(report,format),value,formats[format][1],stillRequested,notify?()=>A.feedback('export',report.title+' erfolgreich exportiert.'):null);}
 catch(error){if(error.name==='AbortError')return false;throw saveError(error);}
};
A.exportPupilBatch=async function(context,options,format,stillRequested=()=>true,progress=()=>{},maximum=A.exportMaximumBytes,notify=true){
 if(context.type!=='pupil'||!formats[format]||format==='print')throw Error('Bitte wähle ein Dateiformat für die Schülerberichte.');
 const students=A.batchStudents(context,options.includeExited===true);if(!students.length)throw Error('Es sind keine passenden Schüler vorhanden.');
 const writer=A.zipWriter(maximum),used=new Set();let first,archive;
 try{
  for(let i=0;i<students.length;i++){
   // Yield between documents so Escape/cancel is processed, including text/Office.
   await new Promise(resolve=>setTimeout(resolve,0));if(!stillRequested())return false;
   const report=A.buildReport({...context,studentId:students[i].id},options);first??=report;
   let value;try{value=await A.renderReportFile(report,format);}catch{if(!stillRequested())return false;throw Error('Ein Schülerbericht konnte nicht erstellt werden. Es wurde kein ZIP-Archiv gespeichert.');}
   if(!stillRequested())return false;
   if(typeof value!=='string'&&!(value instanceof Uint8Array))throw Error('Ein Schülerbericht konnte nicht erstellt werden.');
   writer.add(A.batchEntryName(students[i],format,used),value);progress(i+1,students.length);
  }
  if(!stillRequested())return false;archive=writer.finish();
 }finally{writer.discard();}
 if(!stillRequested())return false;
 const name=A.reportFilename({...first,student:'Schuelerberichte'},'zip');
 try{return await A.download(name,archive,'application/zip',stillRequested,notify?()=>A.feedback('export','Schülerberichte erfolgreich exportiert.'):null);}
 catch(error){if(error.name==='AbortError')return false;throw saveError(error);}
};
A.output=function(kind,context=null){
 A.feedback('export','');
 const ctx=context||A.exportContext(kind),data=ctx.data||A.data,c=data.courses.find(c=>c.id===ctx.courseId);if(!c)throw Error('Bitte wähle ein Fach.');
 const pupil=ctx.type==='pupil',initial={scope:ctx.independent?'all':'current',entries:'entered',grouping:A.prefs.pupilOrder,remarks:pupil||ctx.type==='oral-individual'},first=A.buildReport(ctx,initial),title=first.title+' – '+c.name+', Klasse '+data.classes.find(cl=>cl.id===c.classId).name;
 const hint=`<small id="exportScopeHint" aria-live="polite" aria-atomic="true">${A.esc(A.reportScopeDescription(first))}</small>`;
 const scope=pupil?`<div class="field"><label for="exportOutput">Ausgabe</label><select id="exportOutput" aria-describedby="exportBatchHint">${A.opt('single','Ausgewählter Schüler',ctx.batch?'batch':'single')}${A.opt('batch','Alle Schüler einzeln',ctx.batch?'batch':'single')}</select><small id="exportBatchHint">Es wird ein Bericht für den ausgewählten Schüler erstellt.</small></div><label class="check" id="exportExitedField" hidden><input type="checkbox" id="exportExited">Ehemalige Schüler einbeziehen</label><div class="field"><label for="exportEntries">Leistungen</label><select id="exportEntries" aria-describedby="exportScopeHint">${A.opt('all','Alle Leistungen',initial.entries)}${A.opt('entered','Nur mit Eintrag',initial.entries)}</select>${hint}</div>`:`<div class="field"><label for="exportScope">Umfang</label><select id="exportScope" aria-describedby="exportScopeHint">${A.opt('current','Mit aktuellen Filtern',initial.scope)}${A.opt('all','Alle Einträge',initial.scope)}</select>${hint}</div>`;
 const options=()=>({history:ctx.history===true,scope:A.$('#exportScope')?.value||'all',entries:A.$('#exportEntries')?.value||'entered',grouping:A.$('#exportGrouping')?.value||'kind',remarks:A.$('#exportRemarks').checked,includeExited:A.$('#exportExited')?.checked===true});
 let update;const requested=()=>A.$('#dialog').open&&A.submitDialog===submit;
 const submit=async()=>{
  const report=update(),format=A.val('exportFormat'),opts=options(),batch=pupil&&A.val('exportOutput')==='batch';
  if(format==='print'){A.afterClose=()=>A.printReport(report).catch(()=>A.error('Die Druckausgabe konnte nicht geöffnet werden.'));return;}
  const controls=[...A.$('#dialogContent').querySelectorAll('select,input')];controls.forEach(el=>el.disabled=true);
  let last=0;const progress=(done,total)=>{if(!requested())return;A.$('#exportProgress').hidden=false;const text=done+' von '+total+' Schülerberichten erstellt.';A.$('#exportProgressValue').textContent=text;if(done===total||Date.now()-last>=2500){A.$('#exportProgressLive').textContent=text;last=Date.now();}};
  try{const saved=batch?await A.exportPupilBatch(ctx,opts,format,requested,progress,A.exportMaximumBytes,false):await A.exportFile(ctx,opts,format,report,requested,false);if(saved===false)return {keepOpen:true,focus:'dialogSave'};A.afterClose=()=>A.feedback('export',batch?'Schülerberichte erfolgreich exportiert.':report.title+' erfolgreich exportiert.');}
  finally{if(requested()){controls.forEach(el=>el.disabled=false);A.$('#exportProgress').hidden=true;A.$('#exportProgressLive').textContent='';}}
 };
 A.modal('Exportieren',`<p class="export-context" id="exportContext">${A.esc(title)}</p><p class="subtle">${A.esc(first.year)}</p><div class="export-fields">${scope}${pupil?`<div class="field"><label for="exportGrouping">Anordnung</label><select id="exportGrouping" aria-describedby="exportGroupingHint">${A.opt('kind','Nach Leistungsart',initial.grouping)}${A.opt('date','Nach Datum',initial.grouping)}</select><small id="exportGroupingHint" aria-live="polite" aria-atomic="true">${A.esc(A.reportGroupingDescription(initial.grouping))}</small></div>`:''}<label class="check"><input type="checkbox" id="exportRemarks"${initial.remarks?' checked':''}>Bemerkungen einbeziehen</label><div class="field"><label for="exportFormat">Ausgabeformat</label><select id="exportFormat" aria-describedby="exportPageInfo">${Object.entries(formats).map(([id,[label]])=>A.opt(id,label,'pdf')).join('')}</select></div><p class="export-page" id="exportPageInfo"><span>Seitenformat</span> <strong id="exportPageValue"></strong><small id="exportPrintHint" hidden></small></p></div><p class="export-privacy">Die Datei enthält Schülerdaten. Bewahre sie geschützt auf.</p><p id="exportProgress" hidden><span id="exportProgressValue" aria-hidden="true"></span></p><span id="exportProgressLive" class="sr-only" role="status" aria-atomic="true"></span>`,submit,'Exportieren',{size:'medium',cancelWhileBusy:true});
 update=()=>{
  const opts=options(),batch=pupil&&A.val('exportOutput')==='batch',report=A.buildReport(ctx,opts),formatEl=A.$('#exportFormat');
  if(batch&&formatEl.value==='print')formatEl.value='pdf';
  const print=formatEl.querySelector('[value="print"]');print.disabled=batch;print.hidden=batch;
  let description=A.reportScopeDescription(report),format=formatEl.value,paged=['print','pdf','docx'].includes(format);
  if(pupil){
   A.$('#exportExitedField').hidden=!batch;const batchHint=A.$('#exportBatchHint');
   if(batch){const n=A.batchStudents(ctx,opts.includeExited).length;const message=n?'Es '+(n===1?'wird ein Schülerbericht':'werden '+n+' Schülerberichte')+' in einem ZIP-Archiv erstellt.':'Es sind keine passenden Schüler vorhanden.';if(batchHint.textContent!==message)batchHint.textContent=message;description=opts.entries==='entered'?'In jedem Bericht werden nur Leistungen mit Eintrag berücksichtigt.':'In jedem Bericht werden alle Leistungen des Schülers berücksichtigt.';}
   else batchHint.textContent='Es wird ein Bericht für den ausgewählten Schüler erstellt.';
   A.$('#exportContext').textContent=batch?'Schülerberichte – '+c.name+', Klasse '+data.classes.find(cl=>cl.id===c.classId).name:title;
   const grouping=A.$('#exportGroupingHint'),message=A.reportGroupingDescription(opts.grouping);if(grouping.textContent!==message)grouping.textContent=message;
  }
  const el=A.$('#exportScopeHint');if(el.textContent!==description)el.textContent=description;
  A.$('#exportPageInfo').hidden=!paged;
  const printHint=A.$('#exportPrintHint');printHint.hidden=format!=='print';printHint.textContent=format==='print'?'Empfohlen: A4 '+(A.reportLayout(report).landscape?'quer':'hoch')+'. Bitte in der Druckvorschau prüfen.':'';
  A.$('#exportPageValue').textContent=batch?'A4 automatisch je Schülerbericht':'A4 '+(A.reportLayout(report).landscape?'quer':'hoch')+' (automatisch)';
  if(paged)formatEl.setAttribute('aria-describedby','exportPageInfo');else formatEl.removeAttribute('aria-describedby');
  A.$('#dialogSave').textContent=format==='print'?'Drucken':'Exportieren';return report;
 };
 for(const id of ['exportOutput','exportExited','exportScope','exportEntries','exportFormat','exportGrouping','exportRemarks'])A.$('#'+id)?.addEventListener('change',update);
 update();
};
A.exportRows=function(kind){const r=A.buildReport(A.exportContext(kind),{scope:'all',remarks:false});return A.reportCSVRows(r);};
A.tableExport=(kind,text=false)=>A.exportFile(A.exportContext(kind),{scope:'current',remarks:true},text?'txt':'csv');
A.printList=kind=>A.printReport(A.buildReport(A.exportContext(kind),{scope:'current',remarks:true}));
})(globalThis.Notenblick);
