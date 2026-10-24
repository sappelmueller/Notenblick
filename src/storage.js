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
    async protect(label,input,workspace) {const full={...N.clone(N.validate(input)),workspace:N.clone(workspace||{})},path='Sicherungen/'+String(label).replace(/[^a-zA-Z0-9_-]/g,'_')+'_'+new Date().toISOString().replace(/[:.]/g,'-')+'_'+N.id()+'.json';await writeAt(this.root,path,JSON.stringify(full));const restored=json(await readAt(this.root,path));N.validate(restored);if(JSON.stringify(restored)!==JSON.stringify(full))throw Error('Die Sicherung konnte nicht geprüft werden. Es wurden keine Daten übernommen.');return path;}
    async saveWorkspace(value) {if(this.viewBefore140){const d=await this.raw();if(d)await writeAt(this.root,'Sicherungen/Vor_Einstellungen_1-4_'+new Date().toISOString().replace(/[:.]/g,'-')+'_'+N.id()+'.json',JSON.stringify({...d,workspace:this.viewBefore140}));this.viewBefore140=null;}await writeAt(this.root,'Ansicht.json',JSON.stringify(value));}
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
    async save(input, {
      replace = false,
      forceTXT = false,
      repair = false,
      workspace = null,
      previousWorkspace = null
    } = {}) {
      if (this.saving) throw Error('Bitte warte, bis die Noten gespeichert sind.');
      this.saving = true;
      try {
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
        const next = N.upgrade(input);next.appVersion='1.8.0';
        delete next.workspace;delete next.preferences;
        next.revision = Math.max(current?.revision || 0, next.revision) + 1;
        next.commitId = N.id();
        next.updatedAt = new Date().toISOString();
        const full=(d,previous=false)=>({...d,workspace:(previous?previousWorkspace:null)||workspace||d.workspace||{}});
        const snap = d => `Sicherungen/Stand_${String(d.revision).padStart(8, '0')}_${d.commitId}.json`;
        const snapshotMeta=new Map([[snap(next).split('/').at(-1),{at:next.updatedAt,revision:next.revision}]]);
        if(current)snapshotMeta.set(snap(current).split('/').at(-1),{at:current.updatedAt,revision:current.revision});
        if (current) {await writeAt(this.root, snap(current), JSON.stringify(full(current,true), null, 2));
          if(replace) await writeAt(this.root,'Sicherungen/Vor_Wiederherstellung_'+new Date().toISOString().replace(/[:.]/g,'-')+'_'+N.id()+'.json',JSON.stringify(full(current,true),null,2));
        }
        await writeAt(this.root, snap(next), JSON.stringify(full(next), null, 2));
        await writeAt(this.root, this.path, JSON.stringify(next, null, 2));
        this.base = {
          id: next.id,
          commitId: next.commitId,
          revision: next.revision
        };
        let txtError = null;
        const textPath = p => this.textPrefix ? this.textPrefix + '/' + p : p;
        try {
          let manifest = {};
          try {
            manifest = json(await readAt(this.root, 'Sicherungen/Notenlistenverzeichnis.json')) || {};
          } catch (e) {
            if (!missing(e) && !(e instanceof SyntaxError)) throw e;
          }
          const files = N.exportsTXT(next),
            previous = !forceTXT && current && manifest.commitId === current.commitId && manifest.version === 13 ? (this.textCache?.commitId===current.commitId?this.textCache.files:N.exportsTXT(N.upgrade(current))) : {};
          for (const [p, t] of Object.entries(files)) if (previous[p] !== t) await writeAt(this.root, textPath(p), t);
          const parents = new Set();
          for (const p of manifest.version===13 && Array.isArray(manifest.files) ? manifest.files : []) {
            if (typeof p !== 'string' || !p.endsWith('.txt') || p.split('/').length < 3 || p.split('/').length > 5 || p.split('/').some(part => !part || part === '.' || part === '..') || p.split('/')[0].toLocaleLowerCase('de') === 'daten' || p.startsWith('/') || p.includes('\\') || Object.hasOwn(files, p)) continue;
            try {
              await removeAt(this.root, textPath(p));
            } catch (e) {
              if (!missing(e)) throw e;
            }
            let parent = p.split('/').slice(0, -1);
            while (parent.length) {
              parents.add(parent.join('/'));
              parent.pop();
            }
          }
          for (const p of [...parents].sort((a, b) => b.length - a.length)) {
            const all = p.split('/');
            let dir = this.textPrefix ? await this.root.getDirectoryHandle(this.textPrefix) : this.root;
            try {
              for (const part of all.slice(0, -1)) dir = await dir.getDirectoryHandle(part);
              const child = await dir.getDirectoryHandle(all.at(-1));
              let empty = true;
              for await (const entry of child.entries()) {
                empty = false;
                break;
              }
              if (empty) await dir.removeEntry(all.at(-1));
            } catch (e) {
              if (!missing(e) && e.name !== 'InvalidModificationError') throw e;
            }
          }
          if(parents.size)writeDirectories.delete(this.root);
          await writeAt(this.root, 'Sicherungen/Notenlistenverzeichnis.json', JSON.stringify({
            version: 13,
            commitId: next.commitId,
            files: Object.keys(files)
          }));
          this.textCache={commitId:next.commitId,files};
        } catch (e) {
          this.textCache=null;txtError = e.message;
        }
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
