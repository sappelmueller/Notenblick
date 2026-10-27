/* Notenblick – app/startup.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.boot = async function boot() {
  Notenblick.$('#main').setAttribute('aria-busy', 'true');
  Notenblick.status('Wird geöffnet …');
  try {
    if(window.NRDesktop.available){
      const next=new Notenblick.S.FolderStore(new window.NRDesktop.Directory(''));
      Notenblick.store=next;
      let raw,loadError;try{raw=await next.load();}catch(e){loadError=e;}
      if(!raw||!Notenblick.N.isCurrentData(raw)){
        const sources=await window.NRDesktop.call('migration-sources');
        const selected=await Notenblick.chooseMigration(raw,sources,loadError);
        if(selected&&selected.key!=='current'){
          const incoming=await window.NRDesktop.call('migration-read',{key:selected.key});
          Notenblick.N.upgrade(JSON.parse(incoming.text.replace(/^\ufeff/,'')));
          const currentSha256=await window.NRDesktop.call('current-hash');
          await window.NRDesktop.call('migration-commit',{key:selected.key,sha256:incoming.sha256,currentSha256});
          raw=await next.load();loadError=null;
        }
      }
      if(loadError)throw loadError;
      const view=await next.loadWorkspace();
      Notenblick.workspace=view||raw?.workspace||Notenblick.preferencesWorkspace(raw)||{};
      const empty=!raw;
      if(empty&&await next.hasDataEvidence())throw Error('Im Datenordner liegen bereits Dateien, aber keine lesbare Hauptdatei. Bitte stelle unter Sicherung einen vorhandenen Stand wieder her.');
      Notenblick.firstRun=empty;
      Notenblick.activate(next,raw||Notenblick.N.upgrade(Notenblick.N.blank()));
      if(Notenblick.dirty){await Notenblick.save();if(Notenblick.dirty)throw Error('Der übernommene Stand konnte noch nicht vollständig gespeichert werden. Die ursprünglichen Dateien bleiben erhalten.');}
      if(!empty&&(raw?.workspace||raw?.preferences||!view)){await next.saveWorkspace(Notenblick.getWorkspace());}
      if(empty){Notenblick.ui.main='home';Notenblick.activateGroup('main','home');}else try{await Notenblick.refreshTextLists();}catch(e){Notenblick.error(e.message,'storage');}
      Notenblick.storagePath=await window.NRDesktop.call('storage-info');
      if(next.workspaceWarning)Notenblick.error(next.workspaceWarning,'storage');
    }else{
      const saved=await window.NRSession.load();Notenblick.firstRun=!saved?.data;
      if(Notenblick.firstRun&&localStorage.getItem('notenblick-recovery')){Notenblick.firstRun=false;throw Error('Es liegen frühere Arbeitskopien vor. Bitte prüfe die Wiederherstellung unter Sicherung.');}
      if(saved?.data){Notenblick.workspace=saved.workspace||saved.data.workspace||Notenblick.preferencesWorkspace(saved.data)||{};Notenblick.data=Notenblick.N.upgrade(saved.data);delete Notenblick.data.workspace;delete Notenblick.data.preferences;Notenblick.restoreWorkspace();}
      if(saved?.workspace&&!saved?.data){Notenblick.workspace=saved.workspace;Notenblick.restoreWorkspace();}
      if(saved?.handle&&saved.handle.name==='Daten'&&await saved.handle.queryPermission({mode:'readwrite'})==='granted'){
        const next=new Notenblick.S.FolderStore(saved.handle),raw=await next.load();if(raw){Notenblick.firstRun=false;Notenblick.workspace=await next.loadWorkspace()||Notenblick.workspace;Notenblick.activate(next,raw);}else if(!Notenblick.data.years.length){if(await next.hasDataEvidence())throw Error('Bitte zuerst den bestehenden Datenordner unter Sicherung prüfen.');Notenblick.store=next;}
      }
      if(Notenblick.firstRun)Notenblick.ui.main='home';
      Notenblick.normalizeContext();Notenblick.activateGroup('main',Notenblick.ui.main);Notenblick.refreshCurrent();
    }

  } catch (e) {
    Notenblick.fatalStart = true;
    Notenblick.status('Nicht geöffnet', 'failed');
    Notenblick.ui.main='backup';Notenblick.activateGroup('main','backup');Notenblick.error('Die Noten konnten nicht geöffnet werden. Vorhandene Daten werden nicht durch leere Daten ersetzt. '+e.message,'storage');
  } finally {
    Notenblick.starting = false;
    Notenblick.$('#main').removeAttribute('aria-busy');
    Notenblick.$('#bootNotice').hidden = true;
    if(!Notenblick.fatalStart&&Notenblick.$('#bootError').dataset.kind==='timeout')Notenblick.$('#bootError').hidden=true;
    Notenblick.remember();
    document.documentElement.dataset.ready = 'true';
  }
};
Notenblick.folder = async function folder() {
  if (window.NRDesktop.available) {
    Notenblick.announce('Deine Noten werden automatisch im Ordner Daten gespeichert.');
    return;
  }
  if (!Notenblick.canLeave()) return;
  const remembered = await window.NRSession.load();
  let root = remembered?.handle;
  if (root && (await root.requestPermission({
    mode: 'readwrite'
  })) !== 'granted') root = null;
  if (!root) {
    if (!window.showDirectoryPicker) throw Error('Starte Notenblick.exe für die feste Ablage in Daten.');
    try {
      const chosen = await window.showDirectoryPicker({
        mode: 'readwrite',
        id:'notenblick-daten'
      });
      root = chosen.name === 'Daten' ? chosen : await chosen.getDirectoryHandle('Daten', {
        create: true
      });
    } catch (e) {
      if (e.name === 'AbortError') return;
      throw e;
    }
  }
  const next = new Notenblick.S.FolderStore(root, {
      textPrefix:'Notenlisten'
    }),
    loaded = await next.load();
  const connect = async () => {
    if (loaded) {Notenblick.firstRun=false;Notenblick.workspace=await next.loadWorkspace()||loaded.workspace||Notenblick.preferencesWorkspace(loaded)||{};Notenblick.activate(next, loaded);if(next.workspaceWarning)Notenblick.error(next.workspaceWarning,'storage');}else {
      Notenblick.store = next;
      Notenblick.mode = 'working';
      Notenblick.mark();
      await Notenblick.save();
    }
    await window.NRSession.remember(root);
    await next.saveWorkspace(Notenblick.getWorkspace());
    Notenblick.refreshCurrent();
  };
  if (loaded && Notenblick.data.years.length && Notenblick.data.id !== loaded.id) {
    Notenblick.confirm('Daten öffnen', 'Dieser Datenordner enthält einen anderen Notenstand. Sichere deine aktuellen Eingaben zuerst, wenn du sie behalten möchtest.', connect, 'Öffnen');
    return;
  }
  await connect();
};
Notenblick.requestClose = async function requestClose() {
  if (Notenblick.starting || Notenblick.saving) {
    await Notenblick.savingPromise;
    if (Notenblick.starting) return;
  }
  if (!Notenblick.canLeave()) return;
  if (Notenblick.$('#dialog').open) {
    if (Notenblick.submitDialog) {
      Notenblick.$('#dialogError').textContent = 'Bitte speichere deine Angaben oder wähle Abbrechen, bevor du das Programm schließt.';
      Notenblick.$('#dialogError').hidden = false;
      return;
    }
    Notenblick.closeModal();
  }
  await Notenblick.save();
  if (Notenblick.dirty && Notenblick.store) {
    Notenblick.error('Bitte erstelle eine Sicherung, bevor du das Programm schließt. Die letzten Änderungen sind noch nicht vollständig gespeichert.');
    return;
  }
  await Notenblick.workspacePromise;
  if(Notenblick.workspaceFailed){Notenblick.error('Die letzte Ansicht konnte nicht gespeichert werden. Bitte schließe die Meldung und versuche erneut zu speichern.','storage');return;}
  await window.NRDesktop.call('close-ready');
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
