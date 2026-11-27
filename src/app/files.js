/* Notenblick – app/files.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
function base64(bytes){const parts=[];for(let i=0;i<bytes.length;i+=24576)parts.push(btoa(String.fromCharCode(...bytes.subarray(i,i+24576))));return parts.join('');}
function importedBackup(text){
 const A=Notenblick,parsed=JSON.parse(text.replace(/^\ufeff/,''));
 const value=parsed?.version===1&&parsed.data&&Array.isArray(parsed.lists)?parsed.data:parsed;
 const {notfallListen,...data}=value;
 return A.N.upgrade(data);
}
Notenblick.download = async function download(name, text, type = 'text/plain;charset=utf-8', stillRequested = () => true, success = null, progress = null) {
  if(!stillRequested())return false;
  if (window.NRDesktop.available) {
    const blob=text instanceof Blob;if(blob&&text.size>64*1024*1024)throw Error('Die Exportdatei ist zu groß. Bitte schränke die Auswahl ein.');
    const bytes=typeof text==='string'?null:blob?new Uint8Array(await text.arrayBuffer()):new Uint8Array(text.buffer||text,text.byteOffset||0,text.byteLength);if(!stillRequested())return false;if(bytes&&bytes.length>64*1024*1024)throw Error('Die Exportdatei ist zu groß. Bitte schränke die Auswahl ein.');const dataBase64=bytes?base64(bytes):null;
    return window.NRDesktop.call('download',{name,...(bytes?{dataBase64}:{text}),mime:type},progress).then(saved=>{if(saved!==false&&success)success();return saved;}).catch(e=>{if(e.name==='AbortError')return false;e.storageError=true;throw e;});
  }
  const url = URL.createObjectURL(new Blob([text], {
      type
    })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  if(success)success();return true;
};
Notenblick.backup = async function backup() {
  const A=Notenblick;A.feedback('create','');
  if(A.fatalStart)throw Error('Bitte öffne zuerst einen lesbaren Notenstand oder stelle eine Sicherung wieder her.');
  if(A.flushAssessmentDrafts&&!await A.flushAssessmentDrafts())throw Error('Die letzte Eingabe konnte noch nicht vollständig gesichert werden. Bitte versuche es erneut.');
  if(A.saving)await A.savingPromise;
  const data={...A.N.clone(A.data),workspace:A.getWorkspace()};
  const lists=A.N.backupTextLists(data),name='Notenblick-Sicherung-'+new Date().toISOString().replace(/[:.]/g,'-');
  if(A.vault?.enabled){
   const saved=await window.NRDesktop.call('vault-download-backup',{name:name+'.nbx',text:JSON.stringify({version:1,data,lists})});
   if(saved)A.feedback('create','Geschützte Sicherung erstellt.');
   return saved;
  }
  return A.download(name+'.json',JSON.stringify({...data,notfallListen:lists},null,2),'application/json',()=>true,()=>A.feedback('create','Sicherung erfolgreich erstellt.'));
};
Notenblick.backupDetails=function(d){const A=Notenblick;return '<dl class="storage-details">'+[['Datum und Uhrzeit',new Date(d.updatedAt).toLocaleString('de-DE')+' Uhr'],['Schuljahre',d.years.length],...(d.classes?[['Klassen',d.classes.length]]:[]),['Schüler',d.students.length],['Leistungen',d.assessments.length],...(d.legacyOther?.assessments.length?[['Frühere Leistungen',d.legacyOther.assessments.length]]:[])].map(([k,v])=>'<div><dt>'+A.esc(k)+'</dt><dd>'+A.esc(v)+'</dd></div>').join('')+'</dl>';};
Notenblick.restoredContext=function(message,announce=true){const A=Notenblick;A.ui.main='backup';A.ui.backupView='restore';A.activateGroup('main','backup');A.activateGroup('backup','restore',true);A.remember();if(message){A.feedback('restore',message,announce);A.renderBackupPane('restore');}};
Notenblick.confirmRestore=function(d,verify=null,title='Sicherung wiederherstellen',impact='Diese Sicherung ersetzt deinen aktuellen Datenstand. Notenblick sichert deine bisherigen Daten vorher zusätzlich.'){
 const A=Notenblick;A.feedback('restore','');if(A.ui.main!=='backup'||A.ui.backupView!=='restore')A.restoredContext();A.modal(title,A.backupDetails(d)+'<p id="restoreImpact">'+A.esc(impact)+'</p>',async()=>{
  const outcome=await A.runOperation('Noten werden wiederhergestellt',async progress=>{progress('Sicherung prüfen.');const current=verify?await verify():d;return A.restoreData(current,{onProgress:progress});});
  A.afterClose=()=>A.restoredContext(outcome.warning||'Wiederherstellung erfolgreich. Der Stand vom '+new Date(d.updatedAt).toLocaleString('de-DE')+' Uhr wurde übernommen.',!outcome.warning);
 },'Sicherung wiederherstellen',{describedBy:'restoreImpact'});
};
Notenblick.importFile = async function importFile(file) {
  if (!file) return;
  Notenblick.feedback('restore','');
  if (file.size > 256 * 1024 * 1024) throw Error('Diese Sicherung ist zu groß.');
  const encrypted=/\.nbx$/i.test(file.name||'')||file.slice&&typeof file.slice(0,8).arrayBuffer==='function'&&new TextDecoder().decode(await file.slice(0,8).arrayBuffer())==='NBVAULT1';
  if(encrypted){
    if(!window.NRDesktop.available)throw Error('Öffne Notenblick.exe, um diese geschützte Sicherung zu lesen.');
    const dataBase64=base64(new Uint8Array(await file.arrayBuffer()));
    if(Notenblick.vault.enabled&&!Notenblick.vault.locked){
      let text;
      try{text=await window.NRDesktop.call('vault-open-backup',{dataBase64});}catch{}
      if(text){Notenblick.confirmRestore(importedBackup(text));return;}
    }
    Notenblick.promptProtectedBackup(dataBase64,importedBackup);return;
  }
  let restored;
  try {
    restored = importedBackup(await file.text());
  } catch {
    throw Error('Diese Sicherung konnte nicht geöffnet werden. Bitte wähle eine vollständige Sicherung von Notenblick oder Notenraum.');
  }
  Notenblick.confirmRestore(restored);
};
Notenblick.restorePoint = async function restorePoint() {
  const A=Notenblick;
  A.feedback('restore','');
  if (!A.store) return;
  let dir;
  try {
    dir=await A.store.root.getDirectoryHandle('Sicherungen');
  } catch (e) {
    if(e.name==='NotFoundError')throw Error('Es gibt noch keine früheren Speicherstände.');
    throw Error('Die früheren Speicherstände konnten nicht geöffnet werden. Bitte prüfe den Zugriff auf deinen Ordner „Daten“.');
  }
  const versions=[],desktop=window.NRDesktop.available&&dir instanceof window.NRDesktop.Directory;
  const normal=/^(Stand_\d{8,}_|Vor_(?:Wiederherstellung|Einstellungen_1-4|Muendlich_Zuordnung|Leistungsbereichen)_).*\.json$/i;
  const read=async (h,includeEncrypted=false)=>{
    try{
      if(desktop)return await window.NRDesktop.call('vault-stored-backup',{path:h.path,includeEncrypted});
      const text=await(await h.getFile()).text();
      return {kind:'text',text,digest:await A.N.textDigest(text)};
    }catch{throw Error('Ein früherer Speicherstand konnte nicht gelesen werden. Bitte prüfe den Zugriff auf deinen Ordner „Daten“ und versuche es erneut.');}
  };
  async function collect(folder,depth=0){
    if(depth>14)return;
    for await(const [name,h] of folder.entries()){
      if(h.kind==='directory'&&desktop){await collect(h,depth+1);continue;}
      const ownName=normal.test(name)||/^(?:Noten(?:blick|raum)-Sicherung-|Vor_(?:Migration|Ersetzen)_|Beschaedigt_|Ansicht_Beschaedigt_|\.notenblick-)/i.test(name);
      if(h.kind!=='file'||!(desktop?/\.(?:json|nbx|nbk|zip|tmp)$/i.test(name):ownName)||/^(?:Aufbewahrung|Notenlistenverzeichnis|Ansicht_Vor_Wiederherstellung_.*)\.json$/i.test(name))continue;
      const source=await read(h);
      let data;
      try{if(source.kind==='text')data=importedBackup(source.text);}catch{/* Beschädigte Dateien bleiben zur Prüfung erhalten. */}
      const kind=data?'text':source.kind==='encrypted'?'encrypted':'damaged';
      if(kind==='damaged'&&!(desktop&&(ownName||A.vault?.enabled)))continue;
      const summary=data&&{updatedAt:data.updatedAt,years:{length:data.years.length},classes:{length:data.classes.length},students:{length:data.students.length},assessments:{length:data.assessments.length}};
      versions.push({name,handle:h,kind,digest:source.digest,summary,revision:data?.revision||0,at:data?.updatedAt||h.meta?.lastModified||0});
    }
  }
  await collect(dir);
  versions.sort((a,b)=>(a.kind==='damaged')-(b.kind==='damaged')||new Date(b.at)-new Date(a.at)||b.revision-a.revision);
  if (!versions.length) throw Error('Es gibt noch keine lesbaren früheren Speicherstände.');
  const reason=name=>name.startsWith('Vor_Leistungsbereichen_')?'vor Änderung der Leistungsbereiche':name.startsWith('Vor_Muendlich_Zuordnung_')?'vor Zuordnung mündlicher Noten':name.startsWith('Vor_Einstellungen')?'vor Übernahme der Einstellungen':name.startsWith('Vor_Migration_')?'vor Übernahme älterer Daten':name.startsWith('Vor_Ersetzen_')||name.startsWith('Vor_Wiederherstellung_')?'vor Wiederherstellung':'';
  const label=v=>v.kind==='damaged'?v.name+' – beschädigt':v.kind==='encrypted'?v.name+' – verschlüsselt':[new Date(v.at).toLocaleString('de-DE'),reason(v.name)||(!normal.test(v.name)?v.name:'')].filter(Boolean).join(' – ');
  A.modal('Früheren Stand auswählen', `<div class="field"><label for="restorePoint">Gespeicherter Stand</label><select id="restorePoint" aria-describedby="restorePointHint">${versions.map((v,i)=>A.opt(i,label(v),'0')).join('')}</select><small id="restorePointHint">Die Auswahl allein ändert deine Daten nicht.</small></div><div id="restorePointDetails"></div>`,async()=>{
    const entry=versions[Number(A.val('restorePoint'))];
    if(!entry||entry.kind==='damaged')throw Error('Diese Sicherung ist beschädigt. Wähle einen anderen Stand.');
    const verify=async()=>{
      const source=await read(entry.handle,true);
      if(source.digest!==entry.digest)throw Error('Dieser Speicherstand wurde inzwischen verändert. Bitte wähle ihn erneut aus.');
      return source;
    };
    const source=await verify();
    if(entry.kind==='encrypted')A.afterClose=()=>A.promptProtectedBackup(source.dataBase64,importedBackup);
    else A.afterClose=()=>A.confirmRestore(importedBackup(source.text),async()=>importedBackup((await verify()).text),'Aktuellen Stand ersetzen');
  },'Weiter');
  const preview=()=>{
    const v=versions[Number(A.val('restorePoint'))];
    const summary=v.summary?A.backupDetails(v.summary)+(reason(v.name)?'<p class="hint">'+A.esc(reason(v.name))+'.</p>':''):
      v.kind==='encrypted'?'<p>Zum Öffnen brauchst du das Passwort oder den Notfallschlüssel dieser Sicherung.</p>':'<p>Diese Sicherung ist beschädigt. Wähle einen anderen Stand.</p>';
    A.$('#restorePointDetails').innerHTML='<h3>Ausgewählter Stand</h3>'+summary;
    A.$('#dialogSave').disabled=v.kind==='damaged';
  };
  A.$('#restorePoint').addEventListener('change',preview);preview();
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
