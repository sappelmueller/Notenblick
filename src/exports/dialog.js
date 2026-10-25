/* One contextual export dialog and one file dispatcher for every note view. */
(function(A){'use strict';
const formats={print:['Drucken',null],pdf:['PDF','application/pdf'],docx:['Word','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],xlsx:['Excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],txt:['Text','text/plain;charset=utf-8'],csv:['CSV','text/csv;charset=utf-8']};
A.exportFile=async function(context,options,format,prepared,stillRequested=()=>true){
 let report,value;
 try{report=prepared||A.buildReport(context,options);if(format==='print'){return await A.printReport(report,stillRequested);}value=format==='pdf'?await A.reportPdf(report):format==='docx'?A.reportDocx(report):format==='xlsx'?A.reportXlsx(report):format==='txt'?A.reportText(report):format==='csv'?A.reportCSV(report):null;if(value===null)throw Error();}
 catch{if(!stillRequested())return false;throw Error('Die Datei konnte nicht erstellt werden. Deine Noten bleiben unverändert.');}
 if(!stillRequested())return false;
 try{return await A.download(A.reportFilename(report,format),value,formats[format][1]);}
 catch(error){if(error.name==='AbortError')return false;throw Error(error.code==='export-location-unavailable'?'Der Speicherort ist nicht verfügbar.':error.code==='export-permission'?'An diesem Speicherort darf die Datei nicht gespeichert werden.':error.code==='export-invalid-file'?'Die erstellte Datei ist ungültig und wurde nicht gespeichert.':'Die Datei konnte nicht gespeichert werden. Deine Noten bleiben unverändert.');}
};
A.output=function(kind){
 const ctx=A.exportContext(kind),c=A.getCourse();
 if(!c)throw Error('Bitte wähle ein Fach.');
 const initial={scope:'current',entries:A.prefs.pupilEntries,grouping:A.prefs.pupilOrder,remarks:ctx.type==='pupil'||ctx.type==='oral-individual'},first=A.buildReport(ctx,initial),title=first.title+' – '+c.name+', Klasse '+A.getClass().name;
 const hint=`<small id="exportScopeHint" aria-live="polite" aria-atomic="true">${A.esc(A.reportScopeDescription(first))}</small>`;
 const scope=ctx.type==='pupil'?`<div class="field"><label for="exportEntries">Leistungen</label><select id="exportEntries" aria-describedby="exportScopeHint">${A.opt('all','Alle Leistungen',initial.entries)}${A.opt('entered','Nur mit Eintrag',initial.entries)}</select>${hint}</div>`:`<div class="field"><label for="exportScope">Umfang</label><select id="exportScope" aria-describedby="exportScopeHint">${A.opt('current','Mit aktuellen Filtern','current')}${A.opt('all','Alle Einträge','current')}</select>${hint}</div>`;
 const options=()=>({scope:A.$('#exportScope')?.value||'all',entries:A.$('#exportEntries')?.value||'all',grouping:A.$('#exportGrouping')?.value||'kind',remarks:A.$('#exportRemarks').checked});
 let update;const submit=async()=>{
  const report=update(),format=A.val('exportFormat');
  if(format==='print'){A.afterClose=()=>A.printReport(report).catch(()=>A.error('Die Druckausgabe konnte nicht geöffnet werden.'));return;}
  if(await A.exportFile(ctx,options(),format,report,()=>A.$('#dialog').open&&A.submitDialog===submit)===false)return {keepOpen:true,focus:'dialogSave'};
 };
 A.modal('Exportieren',`<p class="export-context">${A.esc(title)}</p><p class="subtle">${A.esc(first.year)}</p><div class="export-fields">${scope}<div class="field"><label for="exportFormat">Ausgabeformat</label><select id="exportFormat" aria-describedby="exportPageInfo">${Object.entries(formats).map(([id,[label]])=>A.opt(id,label,'pdf')).join('')}</select></div><p class="export-page" id="exportPageInfo"><span>Seitenformat</span> <strong id="exportPageValue">A4 ${A.reportLayout(first).landscape?'quer':'hoch'} (automatisch)</strong></p>${ctx.type==='pupil'?`<div class="field"><label for="exportGrouping">Anordnung</label><select id="exportGrouping">${A.opt('kind','Nach Leistungsart',initial.grouping)}${A.opt('date','Nach Datum',initial.grouping)}</select></div>`:''}<label class="check"><input type="checkbox" id="exportRemarks"${initial.remarks?' checked':''}>Bemerkungen einbeziehen</label></div><p class="export-privacy">Die Datei enthält Schülerdaten. Bewahre sie geschützt auf.</p>`,submit,'Exportieren',{size:'medium',cancelWhileBusy:true});
 update=()=>{
  const report=A.buildReport(ctx,options()),format=A.val('exportFormat'),description=A.reportScopeDescription(report),el=A.$('#exportScopeHint'),paged=['print','pdf','docx'].includes(format);
  if(el.textContent!==description)el.textContent=description;
  A.$('#exportPageInfo').hidden=!paged;
  A.$('#exportPageValue').textContent='A4 '+(A.reportLayout(report).landscape?'quer':'hoch')+' (automatisch)';
  if(paged)A.$('#exportFormat').setAttribute('aria-describedby','exportPageInfo');else A.$('#exportFormat').removeAttribute('aria-describedby');
  A.$('#dialogSave').textContent=format==='print'?'Drucken':'Exportieren';
  return report;
 };
 for(const id of ['exportScope','exportEntries','exportFormat','exportGrouping','exportRemarks'])A.$('#'+id)?.addEventListener('change',update);
 update();
};
// Compatibility entry points route to the same report model; no second exporter.
A.exportRows=function(kind){const r=A.buildReport(A.exportContext(kind),{scope:'all',remarks:false});return A.reportCSVRows(r);};
A.tableExport=(kind,text=false)=>A.exportFile(A.exportContext(kind),{scope:'current',remarks:true},text?'txt':'csv');
A.printList=kind=>A.printReport(A.buildReport(A.exportContext(kind),{scope:'current',remarks:true}));
})(globalThis.Notenblick);
