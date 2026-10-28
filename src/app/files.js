/* Notenblick – app/files.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.download = async function download(name, text, type = 'text/plain;charset=utf-8', stillRequested = () => true) {
  if(!stillRequested())return false;
  if (window.NRDesktop.available) {
    const blob=text instanceof Blob;if(blob&&text.size>64*1024*1024)throw Error('Die Exportdatei ist zu groß. Bitte schränke die Auswahl ein.');
    const bytes=typeof text==='string'?null:blob?new Uint8Array(await text.arrayBuffer()):new Uint8Array(text.buffer||text,text.byteOffset||0,text.byteLength);if(!stillRequested())return false;if(bytes&&bytes.length>64*1024*1024)throw Error('Die Exportdatei ist zu groß. Bitte schränke die Auswahl ein.');let dataBase64;if(bytes){const parts=[];for(let i=0;i<bytes.length;i+=24576)parts.push(btoa(String.fromCharCode(...bytes.subarray(i,i+24576))));dataBase64=parts.join('');}
    return window.NRDesktop.call('download',{name,...(bytes?{dataBase64}:{text}),mime:type}).then(saved=>{if(saved!==false)Notenblick.announce('Die Datei wurde gespeichert.');return saved;}).catch(e=>{if(e.name==='AbortError')return false;e.storageError=true;throw e;});
  }
  const url = URL.createObjectURL(new Blob([text], {
      type
    })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  Notenblick.announce('Die Datei wird gespeichert.');
};
Notenblick.backup = function backup() {
  return Notenblick.download('Notenblick-Sicherung-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json', JSON.stringify({...Notenblick.data,workspace:Notenblick.getWorkspace()},null,2), 'application/json');
};
Notenblick.backupDetails=function(d){const A=Notenblick;return '<dl class="storage-details">'+[['Datum und Uhrzeit',new Date(d.updatedAt).toLocaleString('de-DE')+' Uhr'],['Schuljahre',d.years.length],...(d.classes?[['Klassen',d.classes.length]]:[]),['Schüler',d.students.length],['Leistungen',d.assessments.length],...(d.legacyOther?.assessments.length?[['Frühere Leistungen',d.legacyOther.assessments.length]]:[])].map(([k,v])=>'<div><dt>'+A.esc(k)+'</dt><dd>'+A.esc(v)+'</dd></div>').join('')+'</dl>';};
Notenblick.confirmRestore=function(d,verify=null,title='Sicherung wiederherstellen',impact='Diese Sicherung ersetzt deinen aktuellen Datenstand. Notenblick sichert deine bisherigen Daten vorher zusätzlich.'){const A=Notenblick;A.modal(title,A.backupDetails(d)+'<p id="restoreImpact">'+A.esc(impact)+'</p>',async()=>{const current=verify?await verify():d;await A.restoreData(current);A.afterClose=()=>{A.activateGroup('main','notes',false,true);(A.$('#noteTabs [aria-selected=true]')&&!A.$('#notesWork').hidden?A.$('#noteTabs [aria-selected=true]'):A.$('#tab-notes'))?.focus();};},'Sicherung wiederherstellen',{describedBy:'restoreImpact'});};
Notenblick.importFile = async function importFile(file) {
  if (!file) return;
  if (file.size > 256 * 1024 * 1024) throw Error('Diese Sicherung ist zu groß.');
  let restored;
  try {
    restored = Notenblick.N.upgrade(JSON.parse((await file.text()).replace(/^\ufeff/, '')));
  } catch {
    throw Error('Diese Sicherung konnte nicht geöffnet werden. Bitte wähle eine vollständige Sicherung von Notenblick oder Notenraum.');
  }
  Notenblick.confirmRestore(restored);
};
Notenblick.restorePoint = async function restorePoint() {
  if (!Notenblick.store) return;
  let dir;
  try {
    dir=await Notenblick.store.root.getDirectoryHandle('Sicherungen');
  } catch {
    throw Error('Es gibt noch keine früheren Speicherstände.');
  }
  const versions = [];
  for await (const [name, h] of dir.entries()) if (h.kind === 'file' && /^(Stand_\d{8,}_[a-zA-Z0-9_-]+|Vor_Wiederherstellung_[a-zA-Z0-9_-]+|Vor_Einstellungen_1-4_[a-zA-Z0-9_-]+|Vor_Muendlich_Zuordnung_[a-zA-Z0-9_-]+)\.json$/.test(name)) {
    try {
      const text=await(await h.getFile()).text(),d=Notenblick.N.validate(JSON.parse(text.replace(/^\ufeff/,'')));
      versions.push({
        name,handle:h,digest:await Notenblick.N.textDigest(text),
        at:d.updatedAt,revision:d.revision,years:d.years.length,students:d.students.length,assessments:d.assessments.length
      });
    } catch {}
  }
  versions.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||b.revision-a.revision);
  if (!versions.length) throw Error('Es gibt noch keine lesbaren früheren Speicherstände.');
  const label=v=>new Date(v.at).toLocaleString('de-DE')+(v.name.startsWith('Vor_Muendlich_Zuordnung_')?' – vor Zuordnung mündlicher Noten':v.name.startsWith('Vor_Einstellungen')?' – vor Übernahme der Einstellungen':v.name.startsWith('Vor_')?' – vor Wiederherstellung':'');
  Notenblick.modal('Früheren Stand auswählen', `<div class="field"><label for="restorePoint">Gespeicherter Stand</label><select id="restorePoint" aria-describedby="restorePointHint">${versions.map((v,i)=>Notenblick.opt(i,label(v),'0')).join('')}</select><small id="restorePointHint">Die Auswahl allein ändert deine Daten nicht.</small></div><div id="restorePointDetails"></div>`,async()=>{
    const entry=versions[Number(Notenblick.val('restorePoint'))];if(!entry)throw Error('Bitte einen gespeicherten Stand auswählen.');
    const verify=async()=>{const text=await(await entry.handle.getFile()).text(),d=Notenblick.N.validate(JSON.parse(text.replace(/^\ufeff/,'')));if(await Notenblick.N.textDigest(text)!==entry.digest)throw Error('Dieser Speicherstand wurde inzwischen verändert. Bitte wähle ihn erneut aus.');return d;};
    const d=await verify();Notenblick.afterClose=()=>Notenblick.confirmRestore(d,verify,'Aktuellen Stand ersetzen');
  },'Weiter');
  const preview=()=>{const v=versions[Number(Notenblick.val('restorePoint'))];Notenblick.$('#restorePointDetails').innerHTML='<h3>Ausgewählter Stand</h3>'+Notenblick.backupDetails({updatedAt:v.at,years:{length:v.years},students:{length:v.students},assessments:{length:v.assessments}})+(v.name.startsWith('Vor_')?'<p class="hint">'+Notenblick.esc(label(v).split(' – ')[1])+'.</p>':'');};
  Notenblick.$('#restorePoint').addEventListener('change',preview);preview();
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
