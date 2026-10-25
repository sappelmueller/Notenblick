/* Notenblick – app/files.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.download = function download(name, text, type = 'text/plain;charset=utf-8') {
  if (window.NRDesktop.available) {
    const bytes=typeof text==='string'?null:new Uint8Array(text.buffer||text,text.byteOffset||0,text.byteLength);if(bytes&&bytes.length>64*1024*1024)throw Error('Die Exportdatei ist zu groß. Bitte schränke die Auswahl ein.');let dataBase64;if(bytes){const parts=[];for(let i=0;i<bytes.length;i+=32768)parts.push(String.fromCharCode(...bytes.subarray(i,i+32768)));dataBase64=btoa(parts.join(''));}
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
Notenblick.importFile = async function importFile(file) {
  if (!file) return;
  if (file.size > 256 * 1024 * 1024) throw Error('Diese Sicherung ist zu groß.');
  let restored;
  try {
    restored = Notenblick.N.upgrade(JSON.parse((await file.text()).replace(/^\ufeff/, '')));
  } catch {
    throw Error('Diese Sicherung konnte nicht geöffnet werden. Bitte wähle eine vollständige Sicherung von Notenblick oder Notenraum.');
  }
  Notenblick.confirm('Sicherung wiederherstellen', `Sicherung vom ${new Date(restored.updatedAt).toLocaleString('de-DE')}: ${restored.years.length} Schuljahre, ${restored.classes.length} Klassen, ${restored.students.length} Schüler und ${restored.assessments.length} Leistungen${restored.legacyOther?.assessments.length?' und '+restored.legacyOther.assessments.length+' Leistungen im gesicherten Altbestand':''}. ${Notenblick.store ? 'Die bisherigen Noten werden vorher gesichert.' : 'Dein aktueller Stand wird vor dem Ersetzen zusätzlich aufbewahrt.'}`, () => Notenblick.restoreData(restored), 'Wiederherstellen');
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
      const d = Notenblick.N.validate(JSON.parse((await (await h.getFile()).text()).replace(/^\ufeff/, '')));
      versions.push({
        name,handle:h,
        at:d.updatedAt,revision:d.revision,years:d.years.length,students:d.students.length,assessments:d.assessments.length
      });
    } catch {}
  }
  versions.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||b.revision-a.revision);
  if (!versions.length) throw Error('Es gibt noch keine lesbaren früheren Speicherstände.');
  Notenblick.modal('Speicherstand wiederherstellen', `<div class="field"><label for="restorePoint">Gespeicherter Stand</label><select id="restorePoint">${versions.map((v,i)=>Notenblick.opt(i,new Date(v.at).toLocaleString('de-DE')+' – '+v.years+' Schuljahre, '+v.students+' Schüler, '+v.assessments+' Leistungen'+(v.name.startsWith('Vor_Muendlich_Zuordnung_')?' (vor mündlicher Zuordnung)':v.name.startsWith('Vor_Einstellungen')?' (vor Einstellungsübernahme)':v.name.startsWith('Vor_')?' (vor Wiederherstellung)':''),'0')).join('')}</select></div>`,async()=>{
    const entry=versions[Number(Notenblick.val('restorePoint'))],d=Notenblick.N.validate(JSON.parse((await(await entry.handle.getFile()).text()).replace(/^\ufeff/,'')));
    Notenblick.afterClose=()=>Notenblick.confirm('Aktuellen Stand ersetzen','Der Stand vom '+new Date(d.updatedAt).toLocaleString('de-DE')+' mit '+d.students.length+' Schülern und '+d.assessments.length+' Leistungen ersetzt deine aktuellen Daten. Dein aktueller Stand wird vorher zusätzlich gesichert.',()=>Notenblick.restoreData(d),'Wiederherstellen');
  },'Weiter');
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
