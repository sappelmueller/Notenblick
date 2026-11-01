(function (global) {
  'use strict';

  const N = typeof module !== 'undefined' ? require('./core.js') : global.NR;
  async function readAt(root, path) {
    let dir = root;
    const parts = path.split('/');
    for (const p of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(p);
    return (await (await dir.getFileHandle(parts.at(-1))).getFile()).text();
  }
  const writeDirectories=new WeakMap();
  async function writeAt(root, path, text) {
    let dir = root;
    const parts = path.split('/');
    let dirs=writeDirectories.get(root);if(!dirs){dirs=new Map();writeDirectories.set(root,dirs);}let prefix='';
    for (const p of parts.slice(0,-1)){prefix+=p+'/';if(dirs.has(prefix))dir=dirs.get(prefix);else{dir=await dir.getDirectoryHandle(p,{create:true});dirs.set(prefix,dir);}}
    const h = await dir.getFileHandle(parts.at(-1), {
        create: true
      }),
      w = await h.createWritable();
    try {
      await w.write(text);
      await w.close();
    } catch (e) {
      writeDirectories.delete(root);
      try {
        await w.abort();
      } catch {}
      throw e;
    }
  }
  async function removeAt(root, path) {
    const parts = path.split('/');
    let dir = root;
    for (const p of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(p);
    await dir.removeEntry(parts.at(-1));
  }
  const missing = e => e?.name === 'NotFoundError';
  const json = text => JSON.parse(text.replace(/^\ufeff/, ''));
  class FolderStore {
    constructor(root, {
      textPrefix = 'Notenlisten'
    } = {}) {
      this.root = root;
      this.textPrefix = textPrefix;
      this.base = null;
      this.path = 'notenverwaltung.json';
      this.saving = false;
    }
    async protect(label,input,workspace) {if(this.cleaning)throw Error('Bitte warte, bis die Sicherungen bereinigt sind.');this.protectWrites=(this.protectWrites||0)+1;try{const full={...N.clone(N.validate(input)),workspace:N.clone(workspace||{})},path='Sicherungen/'+String(label).replace(/[^a-zA-Z0-9_-]/g,'_')+'_'+new Date().toISOString().replace(/[:.]/g,'-')+'_'+N.id()+'.json';await writeAt(this.root,path,JSON.stringify(full));const restored=json(await readAt(this.root,path));N.validate(restored);if(JSON.stringify(restored)!==JSON.stringify(full))throw Error('Die Sicherung konnte nicht geprüft werden. Es wurden keine Daten übernommen.');return path;}finally{this.protectWrites--;}}
    async saveWorkspace(value) {if(this.cleaning)throw Error('Bitte warte, bis die Sicherungen bereinigt sind.');this.workspaceWrites=(this.workspaceWrites||0)+1;try{if(this.viewBefore140){const d=await this.raw();if(d)await writeAt(this.root,'Sicherungen/Vor_Einstellungen_1-4_'+new Date().toISOString().replace(/[:.]/g,'-')+'_'+N.id()+'.json',JSON.stringify({...d,workspace:this.viewBefore140}));this.viewBefore140=null;}await writeAt(this.root,'Ansicht.json',JSON.stringify(value));}finally{this.workspaceWrites--;}}
    async loadWorkspace() {
      let text;try{text=await readAt(this.root,'Ansicht.json');}catch(e){if(missing(e))return null;throw e;}
      try{const value=json(text);if(!value||typeof value!=='object'||Array.isArray(value))throw new SyntaxError('Ungültige Ansicht');if(!value.settings)this.viewBefore140=N.clone(value);return value;}catch(e){
        if(!(e instanceof SyntaxError))throw e;
        await writeAt(this.root,'Sicherungen/Ansicht_Beschaedigt_'+new Date().toISOString().replace(/[:.]/g,'-')+'_'+N.id()+'.json',text);
        this.workspaceWarning='Die letzte Ansicht konnte nicht gelesen werden. Die ursprüngliche Datei wurde gesichert; deine Noten sind unverändert vorhanden.';return null;
      }
    }
    async raw(){try{return N.validate(json(await readAt(this.root,this.path)));}catch(e){if(missing(e))return null;throw e;}}
    async load() {
      try {
        const d = await this.raw();
        if (d) this.base = {
          id: d.id,
          commitId: d.commitId,
          revision: d.revision
        };
        return d;
      } catch (e) {
        throw Error('Die Noten konnten nicht geöffnet werden. Bitte öffne eine Sicherung oder wähle einen anderen Speicherort.');
      }
    }
    async hasDataEvidence(){
      for await(const [name,h] of this.root.entries()){
        if(h.kind==='file'&&!['Ansicht.json','InBenutzung.lock'].includes(name)&&!name.startsWith('.notenblick-Schreibpruefung-'))return true;
        if(h.kind==='directory'&&['Sicherungen','Notenlisten'].includes(name))for await(const entry of h.entries())return true;
      }return false;
    }
    async refreshTextLists(d,{force=false}={}){if(this.saving)throw Error('Bitte warte, bis die Noten gespeichert sind.');this.saving=true;try{return await this.syncTextLists(N.validate(d),{force});}finally{this.saving=false;}}
    async syncTextLists(d,{force=false}={}){
      const manifestPath='Sicherungen/Notenlistenverzeichnis.json',normal=t=>t.replace(/^\ufeff/,''),textPath=p=>this.textPrefix?this.textPrefix+'/'+p:p;
      let old={};try{old=json(await readAt(this.root,manifestPath))||{};}catch(e){if(!missing(e)&&!(e instanceof SyntaxError))throw e;}
      const safe=p=>typeof p==='string'&&!p.includes('\\')&&!/[\u0000-\u001f:]/.test(p)&&!p.startsWith('/')&&p.split('/').every(x=>x&&x!=='.'&&x!=='..')&&p.split('/')[0].toLocaleLowerCase('de')!=='daten'&&(p.split('/').length===3&&p.endsWith('/Schülerliste.txt')||p.split('/').length===4&&p.endsWith('/Notenübersicht.txt')||p.split('/').length===5&&['Schülernoten','Mündliche Noten','Gesicherter Altbestand',...Object.values(N.KINDS)].includes(p.split('/')[3])&&p.endsWith('.txt'));
      const files=N.exportsTXT(d),previous=[13,14,16,17,18,N.TEXT_LIST_VERSION].includes(old.version)&&Array.isArray(old.files)?[...new Set([...old.files,...(Array.isArray(old.retained)?old.retained:[])])].filter(safe):[],hashes={};
      // A pending directory can never be mistaken for a complete update.
      await writeAt(this.root,manifestPath,JSON.stringify({version:N.TEXT_LIST_VERSION,state:'updating',commitId:d.commitId,files:[...new Set([...previous,...Object.keys(files)])],hashes:old.version===N.TEXT_LIST_VERSION?old.hashes||{}:{}}));
      let written=0;for(const[p,text]of Object.entries(files)){
        let current;try{current=await readAt(this.root,textPath(p));}catch(e){if(!missing(e))throw e;}
        if(force||current===undefined||normal(current)!==normal(text)){await writeAt(this.root,textPath(p),text);const verified=await readAt(this.root,textPath(p));if(normal(verified)!==normal(text))throw Error('Die TXT-Datei '+p+' konnte nicht vollständig geprüft werden.');written++;}
        hashes[p]=await N.textDigest(text);
      }
      const parents=new Set(),retained=[];for(const p of previous){if(Object.hasOwn(files,p))continue;let current;try{current=await readAt(this.root,textPath(p));}catch(e){if(missing(e))continue;throw e;}
        // Legacy or manually edited files have no verified ownership: retain them.
        if(old.version!==N.TEXT_LIST_VERSION||typeof old.hashes?.[p]!=='string'||await N.textDigest(current)!==old.hashes[p]){retained.push(p);continue;}
        await removeAt(this.root,textPath(p));let parts=p.split('/').slice(0,-1);while(parts.length){parents.add(parts.join('/'));parts.pop();}
      }
      for(const p of [...parents].sort((a,b)=>b.length-a.length)){try{const parts=textPath(p).split('/');let dir=this.root;for(const part of parts.slice(0,-1))dir=await dir.getDirectoryHandle(part);const child=await dir.getDirectoryHandle(parts.at(-1));let empty=true;for await(const entry of child.entries()){empty=false;break;}if(empty)await dir.removeEntry(parts.at(-1));}catch(e){if(!missing(e)&&e.name!=='InvalidModificationError')throw e;}}if(parents.size)writeDirectories.delete(this.root);
      await writeAt(this.root,manifestPath,JSON.stringify({version:N.TEXT_LIST_VERSION,state:'complete',commitId:d.commitId,files:Object.keys(files),hashes,retained}));
      this.textCache={commitId:d.commitId,files};this.textWarning=retained.length?retained.length+' ältere oder nachträglich geänderte TXT-Dateien wurden zur Sicherheit beibehalten.':'';return this.lastTextResult={files:Object.keys(files).length,written,retained};
    }
    // Cleanup never trusts a cached or partially received directory listing.
    async backupInventory() {
      let dir;try{dir=await this.root.getDirectoryHandle('Sicherungen');}catch(e){if(missing(e))return {regular:[],protected:[],remove:[],bytes:0,protectedBytes:0,signature:'empty',metadata:{},reason:''};throw e;}
      const entries=[];for await(const [name,h] of dir.entries())entries.push({name,h});
      const listing=entries.map(({name,h})=>[name,h.kind,h.meta?.size,h.meta?.lastModified]).sort((a,b)=>a[0].localeCompare(b[0]));
      let metadata={},metaText='',reason='';
      try{metaText=await readAt(this.root,'Sicherungen/Aufbewahrung.json');metadata=json(metaText);if(!metadata||Array.isArray(metadata)||typeof metadata!=='object')throw new SyntaxError();if(Object.entries(metadata).some(([name,v])=>!/^Stand_\d{8,}_[a-zA-Z0-9_-]+\.json$/.test(name)||!v||v.name!==name||!Number.isFinite(Date.parse(v.at))||!Number.isSafeInteger(v.revision)||!Number.isSafeInteger(v.size)||!Number.isFinite(v.lastModified)))throw new SyntaxError();}
      catch(e){if(!missing(e)&&!(e instanceof SyntaxError))throw e;reason='Die Aufbewahrungsinformationen sind nicht vollständig lesbar. Zur Sicherheit wird keine Sicherung entfernt.';metadata={};}
      const regular=[],protectedFiles=[],digests=[];
      for(const {name,h} of entries){
        if(h.kind!=='file')continue;
        const match=/^Stand_(\d{8,})_([a-zA-Z0-9_-]+)\.json$/.exec(name),protectedName=/^(Vor_Wiederherstellung_|Vor_Einstellungen_1-4_|Vor_Muendlich_Zuordnung_|Ansicht_Vor_Wiederherstellung_|Ansicht_Beschaedigt_|Beschaedigt_)[a-zA-Z0-9_-]+\.json$/.test(name)||/^(Vor_Migration_|Vor_Ersetzen_)[a-zA-Z0-9_-]+\.zip$/.test(name);
        if(!match&&!protectedName)continue;
        let info,text,size;
        try{info=h.meta||await h.getFile();if(protectedName&&Number.isSafeInteger(info.size)){protectedFiles.push({name,size:info.size});continue;}text=await(await h.getFile()).text();size=Number.isSafeInteger(info.size)?info.size:new TextEncoder().encode(text).length;}
        catch(e){throw Error('Die Sicherungen konnten nicht vollständig gelesen werden. Es wurde nichts bereinigt. '+e.message);}
        if(protectedName){protectedFiles.push({name,size});continue;}
        const entry={name,size,valid:false,owned:false};regular.push(entry);
        try{
          const d=N.validate(json(text));if(String(d.revision).padStart(8,'0')!==match[1]||d.commitId!==match[2])throw Error('Name und Inhalt stimmen nicht überein.');
          Object.assign(entry,{valid:true,at:d.updatedAt,revision:d.revision,digest:await N.textDigest(text)});digests.push([name,entry.digest]);
          const known=metadata[name];entry.owned=!!known&&known.name===name&&known.at===d.updatedAt&&known.revision===d.revision&&known.size===size&&known.lastModified===info.lastModified;
        }catch{reason='Mindestens ein automatischer Speicherstand ist nicht vollständig gültig. Zur Sicherheit wird keine Sicherung entfernt.';}
      }
      const again=[];for await(const [name,h]of dir.entries())again.push([name,h.kind,h.meta?.size,h.meta?.lastModified]);again.sort((a,b)=>a[0].localeCompare(b[0]));
      if(JSON.stringify(listing)!==JSON.stringify(again))throw Error('Die Sicherungen haben sich während der Prüfung verändert. Bitte erneut prüfen.');
      regular.sort((a,b)=>Date.parse(b.at||0)-Date.parse(a.at||0)||(b.revision||0)-(a.revision||0)||a.name.localeCompare(b.name));
      // Foreign/modified files stay. Keep 30 valid owned snapshots in addition
      // to every protected snapshot; invalid snapshots prevent all deletion.
      const owned=regular.filter(e=>e.valid&&e.owned),keep=new Set(owned.slice(0,30).map(e=>e.name)),remove=reason?[]:owned.filter(e=>!keep.has(e.name));
      return {regular,protected:protectedFiles,remove,bytes:regular.reduce((n,e)=>n+e.size,0),protectedBytes:protectedFiles.reduce((n,e)=>n+e.size,0),metadata,reason,signature:await N.textDigest(JSON.stringify([listing,metaText,digests]))};
    }
    async cleanBackups(plan) {
      if(this.saving||this.workspaceWrites||this.protectWrites)throw Error('Bitte warte, bis alle Daten gespeichert sind.');
      this.saving=this.cleaning=true;let removed=0,bytes=0,current,meta;
      try{
        current=await this.backupInventory();
        if(current.signature!==plan.signature)throw Error('Die Sicherungen haben sich inzwischen verändert. Bitte öffne die Bereinigung erneut.');
        if(current.reason)throw Error(current.reason);
        const dir=await this.root.getDirectoryHandle('Sicherungen');meta={...current.metadata};
        const present=new Set(current.regular.map(e=>e.name));for(const name of Object.keys(meta))if(!present.has(name))delete meta[name];
        for(const entry of current.remove){
          const text=await(await(await dir.getFileHandle(entry.name)).getFile()).text();
          if(await N.textDigest(text)!==entry.digest)throw Error('Ein Speicherstand wurde inzwischen verändert. Die Bereinigung wurde angehalten.');
          await dir.removeEntry(entry.name);removed++;bytes+=entry.size;delete meta[entry.name];
          await writeAt(this.root,'Sicherungen/Aufbewahrung.json',JSON.stringify(meta));this.retentionMeta=meta;
        }
        await writeAt(this.root,'Sicherungen/Aufbewahrung.json',JSON.stringify(meta));this.retentionMeta=meta;return {removed,bytes};
      }catch(e){
        if(removed){try{await writeAt(this.root,'Sicherungen/Aufbewahrung.json',JSON.stringify(meta));this.retentionMeta=meta;}catch{}throw Error('Die Bereinigung wurde nicht vollständig abgeschlossen. '+removed+' ältere Sicherungen wurden entfernt; die übrigen bleiben erhalten. '+e.message);}
        throw e;
      }finally{this.saving=this.cleaning=false;}
    }
    async save(input, {
      replace = false,
      forceTXT = false,
      repair = false,
      workspace = null,
      previousWorkspace = null,
      initialSetup = false,
      onProgress = () => {}
    } = {}) {
      if (this.saving) throw Error('Bitte warte, bis die Noten gespeichert sind.');
      this.saving = true;
      try {
        if(replace)onProgress('Bisherigen Datenstand sichern.');
        if(replace){let priorView;try{priorView=await readAt(this.root,'Ansicht.json');}catch(e){if(!missing(e))throw e;}if(priorView!==undefined)await writeAt(this.root,'Sicherungen/Ansicht_Vor_Wiederherstellung_'+new Date().toISOString().replace(/[:.]/g,'-')+'_'+N.id()+'.json',priorView);}
        let current;
        try {
          current = await this.raw();
        } catch {
          if (!replace || !repair) throw Error('Die vorhandenen Noten konnten nicht gelesen werden. Sie wurden nicht überschrieben.');
          let raw;
          try {
            raw = await readAt(this.root, this.path);
          } catch {
            throw Error('Die vorhandene Datei konnte vor der Wiederherstellung nicht gesichert werden.');
          }
          await writeAt(this.root, 'Sicherungen/Beschaedigt_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json', raw);
          current = null;
        }
        if (!replace && (this.base ? !current || current.id !== this.base.id || current.commitId !== this.base.commitId : !!current)) throw Error('Die Noten wurden in einem anderen Fenster geändert. Erstelle hier zuerst eine Sicherung und öffne deine Noten anschließend erneut.');
        const next = N.upgrade(input);next.appVersion=globalThis.NRVersion;
        delete next.workspace;delete next.preferences;
        next.revision = Math.max(current?.revision || 0, next.revision) + 1;
        next.commitId = N.id();
        next.updatedAt = new Date().toISOString();
        if(initialSetup){if(current)throw Error('Es sind inzwischen Daten vorhanden. Die Einrichtung hat nichts überschrieben.');next.workspace={...N.clone(workspace||{}),setupCommitId:next.commitId};}
        const full=(d,previous=false)=>({...d,workspace:(previous?previousWorkspace:null)||workspace||d.workspace||{}});
        const snap = d => `Sicherungen/Stand_${String(d.revision).padStart(8, '0')}_${d.commitId}.json`;
        const snapshotMeta=new Map([[snap(next).split('/').at(-1),{at:next.updatedAt,revision:next.revision}]]);
        if(current)snapshotMeta.set(snap(current).split('/').at(-1),{at:current.updatedAt,revision:current.revision});
        if (current) {await writeAt(this.root, snap(current), JSON.stringify(full(current,true), null, 2));
          if(replace) await writeAt(this.root,'Sicherungen/Vor_Wiederherstellung_'+new Date().toISOString().replace(/[:.]/g,'-')+'_'+N.id()+'.json',JSON.stringify(full(current,true),null,2));
        }
        onProgress('Noten wiederherstellen.');
        await writeAt(this.root, snap(next), JSON.stringify(full(next), null, 2));
        await writeAt(this.root, this.path, JSON.stringify(next, null, 2));
        this.base = {
          id: next.id,
          commitId: next.commitId,
          revision: next.revision
        };
        let txtError = null;
        try {onProgress('Automatische Notenlisten aktualisieren.');await this.syncTextLists(next,{force:forceTXT});}catch(e){this.textCache=null;txtError=e.message;}
        try {
          const backup=await this.root.getDirectoryHandle('Sicherungen'), points=[],meta={};
          if(!this.retentionMeta){try{this.retentionMeta=json(await readAt(this.root,'Sicherungen/Aufbewahrung.json'));}catch{this.retentionMeta={};}}
          for await(const [name,h] of backup.entries())if(h.kind==='file'&&/^Stand_\d{8,}_[a-zA-Z0-9_-]+\.json$/.test(name)){
            try{const known=this.retentionMeta?.[name],info=h.meta||await h.getFile(),matches=known&&known.size===info.size&&known.lastModified===info.lastModified;
              const d=snapshotMeta.get(name)||(matches?known:null)||json(await (await h.getFile()).text());const at=d.at||d.updatedAt;
              if(Number.isFinite(Date.parse(at))&&Number.isSafeInteger(d.revision)){const p={name,at,revision:d.revision};points.push(p);meta[name]={...p,size:info.size,lastModified:info.lastModified};}
            }catch{}
          }
          points.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||b.revision-a.revision);
          const keep=new Set(points.slice(0,30).map(p=>p.name)), days=new Set(),weeks=new Set(),years=new Set(),now=Date.now();
          for(const p of points){const age=(now-Date.parse(p.at))/86400000,day=p.at.slice(0,10),week=Math.floor(Date.parse(day)/604800000);
            if(age<=31&&!days.has(day)){keep.add(p.name);days.add(day);}
            if(age<=366&&!weeks.has(week)){keep.add(p.name);weeks.add(week);}
            if(age>366&&!years.has(p.at.slice(0,4))){keep.add(p.name);years.add(p.at.slice(0,4));}
          }
          for(const p of points)if(!keep.has(p.name)){await backup.removeEntry(p.name);delete meta[p.name];}
          await writeAt(this.root,'Sicherungen/Aufbewahrung.json',JSON.stringify(meta));this.retentionMeta=meta;
        } catch {}
        return {
          data: next,
          txtError
        };
      } finally {
        this.saving = false;
      }
    }
  }
  const api = {
    FolderStore,
    readAt,
    writeAt
  };
  if (typeof module !== 'undefined') module.exports = api;else global.NRStorage = api;
})(typeof window !== 'undefined' ? window : globalThis);
