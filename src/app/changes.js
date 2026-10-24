/* Notenblick – app/changes.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.cache = function cache() {
  if (window.NRDesktop.available || Notenblick.mode === 'demo' || Notenblick.mode === 'none') return;
  try {
    localStorage.setItem('notenblick-recovery', JSON.stringify({
      data: Notenblick.data,
      workspace:Notenblick.getWorkspace(),
      dirty: Notenblick.dirty,
      demo: Notenblick.mode === 'demo',
      at: new Date().toISOString()
    }));
  } catch {}
};
Notenblick.mark = function mark() {
  Notenblick.dirty = true;
  Notenblick.seq++;
  Notenblick.cache();
  if (Notenblick.mode !== 'demo') { Notenblick.sessionWrites++;window.NRSession.save(Notenblick.data).catch(() => Notenblick.error('Deine Eingaben konnten noch nicht gesichert werden. Bitte erstelle eine Sicherung.','storage')).finally(()=>Notenblick.sessionWrites--); }
  if (Notenblick.store) {
    Notenblick.status('Wird gespeichert …', 'pending');
    clearTimeout(Notenblick.saveTimer);
    Notenblick.saveTimer = setTimeout(Notenblick.save, 220);
  } else Notenblick.status(Notenblick.mode === 'demo' ? 'Beispieldaten' : 'Im Browser aufbewahrt');
};
Notenblick.workspacePromise=Promise.resolve();
Notenblick.getWorkspace=()=>({main:Notenblick.ui.main,lastNotesCourse:Notenblick.ui.lastNotesCourse,workingYear:Notenblick.ui.workingYear,historicalYear:Notenblick.ui.historicalYear,year:Notenblick.ui.year,class:Notenblick.ui.class,course:Notenblick.ui.course,weightClass:Notenblick.ui.weightClass,weightCourse:Notenblick.ui.weightCourse,adminYear:Notenblick.ui.adminYear,adminClass:Notenblick.ui.adminClass,adminView:Notenblick.ui.adminView,adminSearch:Notenblick.ui.adminSearch,showExitedAdmin:Notenblick.ui.showExitedAdmin,showArchived:Notenblick.ui.showArchived,nameOrder:Notenblick.ui.nameOrder,selections:Notenblick.N.clone(Notenblick.ui.selections||{}),scrolls:Notenblick.N.clone(Notenblick.scrolls),settings:Notenblick.N.clone(Notenblick.prefs),settingsView:Notenblick.ui.settingsView,workspaces:Notenblick.N.clone(Notenblick.ui.workspaces)});
Notenblick.remember=function(){
 if(Notenblick.starting||Notenblick.fatalStart)return;
 const workspace=Notenblick.getWorkspace(),store=Notenblick.store;Notenblick.workspace=workspace;
 Notenblick.workspacePromise=Notenblick.workspacePromise.catch(()=>{}).then(async()=>{await(store?store.saveWorkspace(workspace):window.NRSession.saveWorkspace(workspace));Notenblick.workspaceFailed=false;if(Notenblick.ui.main==='backup')Notenblick.updateSaveDetails();}).catch(e=>{Notenblick.error('Die letzte Ansicht konnte nicht gespeichert werden. '+e.message,'storage');Notenblick.workspaceFailed=true;if(Notenblick.ui.main==='backup')Notenblick.updateSaveDetails();});
};
Notenblick.restoreWorkspace = function restoreWorkspace(source=Notenblick.workspace||{}) {
  const a=source;Notenblick.restorePreferences(source);
  Notenblick.workspace=source;
  Notenblick.ui.workingYear=typeof a.workingYear==='string'?a.workingYear:a.year||'';
  Notenblick.ui.historicalYear=typeof a.historicalYear==='string'?a.historicalYear:'';
  Notenblick.ui.lastNotesCourse=typeof a.lastNotesCourse==='string'?a.lastNotesCourse:a.course||'';
  Notenblick.ui.selections=a.selections&&typeof a.selections==='object'?Notenblick.N.clone(a.selections):{};
  Notenblick.scrolls=a.scrolls&&typeof a.scrolls==='object'?Notenblick.N.clone(a.scrolls):{};
  Notenblick.ui.adminSearch=typeof a.adminSearch==='string'?a.adminSearch.slice(0,100):'';
  Notenblick.ui.showExitedAdmin=a.showExitedAdmin===true;Notenblick.ui.showArchived=a.showArchived===true;
  Notenblick.ui.nameOrder=a.nameOrder==='first-last'?'first-last':'last-first';
  for (const key of ['year', 'class', 'course', 'adminYear', 'adminClass','weightClass','weightCourse']) Notenblick.ui[key] = typeof a[key] === 'string' ? a[key] : '';
  Notenblick.ui.main = Notenblick.starting&&Notenblick.prefs.startupView==='home'?'home':Notenblick.mainKeys.includes(a.main)?a.main:'notes';
  Notenblick.ui.adminView = ['years','classes','students','subjects'].includes(a.adminView) ? a.adminView : 'years';
  Notenblick.ui.workspaces = {};
  if (a.workspaces && typeof a.workspaces === 'object') for (const [id, w] of Object.entries(a.workspaces)) {
    if (!Notenblick.data.courses.some(c => c.id === id) || !w || typeof w !== 'object') continue;
    const x = Notenblick.defaults();
    if (Notenblick.noteKeys.includes(w.view)) x.view=w.view; else if(Notenblick.kinds.includes(w.view)||w.view==='extra')x.view='assessments';
    x.assessmentFilter=Notenblick.kinds.includes(w.assessmentFilter)?w.assessmentFilter:'all';
    x.assessmentId=typeof w.assessmentId==='string'?w.assessmentId:typeof w.selected?.[w.view==='extra'?w.extra:w.view]==='string'&&w.selected[w.view==='extra'?w.extra:w.view]!=='all'?w.selected[w.view==='extra'?w.extra:w.view]:'';
    x.assessmentSearch=typeof w.assessmentSearch==='string'?w.assessmentSearch.slice(0,100):'';
    x.entrySearch=typeof w.entrySearch==='string'?w.entrySearch.slice(0,100):'';
    x.matrixPages=Object.fromEntries(Notenblick.kinds.filter(k=>Number.isSafeInteger(w.matrixPages?.[k])&&w.matrixPages[k]>=0).map(k=>[k,w.matrixPages[k]]));
    x.assessmentWorkOpen=w.assessmentWorkOpen===true;
    x.oralAreaView=['matrix','list'].includes(w.oralAreaView)?w.oralAreaView:Notenblick.prefs.areaView;x.oralClassSearch=typeof w.oralClassSearch==='string'?w.oralClassSearch.slice(0,100):(typeof w.search==='string'?w.search.slice(0,100):'');x.oralListSearch=typeof w.oralListSearch==='string'?w.oralListSearch.slice(0,100):(typeof w.assessmentSearch==='string'?w.assessmentSearch.slice(0,100):'');
    x.oralView=w.oralView==='individual'?'individual':'classes';x.oralSearch=typeof w.oralSearch==='string'?w.oralSearch.slice(0,100):'';x.oralStudent=typeof w.oralStudent==='string'?w.oralStudent:'all';x.oralSort=w.oralSort==='student'?'student':'date';x.oralPage=Number.isSafeInteger(w.oralPage)?Math.max(0,w.oralPage):0;x.oralFocusId=typeof w.oralFocusId==='string'?w.oralFocusId:'';
    x.pupil=typeof w.pupil==='string'?w.pupil:'';
    if (Notenblick.extraKeys.includes(w.extra)) x.extra = w.extra;
    if (Array.isArray(w.columns)) x.columns = [...new Set(w.columns.filter(k => ['written', ...Notenblick.kinds].includes(k)))];
    x.showExited = w.showExited === true;
    x.entryMode = w.entryMode === 'single' ? 'single' : 'table';
    x.search = typeof w.search === 'string' ? w.search.slice(0, 100) : '';
    x.studentIndex = Number.isInteger(w.studentIndex) ? Math.max(0, w.studentIndex) : 0;
    x.selected = {};
    for (const k of Notenblick.kinds) if (typeof w.selected?.[k] === 'string') x.selected[k] = w.selected[k];
    Notenblick.ui.workspaces[id] = x;
  }
};
Notenblick.mutate = function mutate(fn, {
  refresh = true,
  record = true
} = {}) {
  if (Notenblick.starting) throw Error('Bitte warte, bis deine Noten geöffnet sind.');
  if (Notenblick.fatalStart) throw Error('Bitte öffne zuerst eine lesbare Sicherung deiner Noten.');
  if (Notenblick.mode === 'none') Notenblick.mode = 'working';
  const next = Notenblick.N.clone(Notenblick.data);
  fn(next);
  if(next.courses.some(c=>c.calculationMode==='direct')||next.assessments.some(a=>a.participantIds||a.oralEntry))next.appVersion='1.9.0';
  try{Notenblick.N.validate(next);}catch(e){throw Error(e.message.replace(/^Ungültige Datendatei: /,''));}
  if (record) {
    Notenblick.undo.push(Notenblick.N.clone(Notenblick.data));
    if (Notenblick.undo.length > 20) Notenblick.undo.shift();
  }
  Notenblick.data = next;
  Notenblick.rendered = {};
  Notenblick.mark();
  if (!Notenblick.pending.size) Notenblick.error();
  if (refresh) Notenblick.refreshCurrent();
};
Notenblick.save = async function save() {
  clearTimeout(Notenblick.saveTimer);
  if (Notenblick.saving) return Notenblick.savingPromise;
  if (!Notenblick.store || !Notenblick.dirty) return;
  let finish;
  Notenblick.savingPromise = new Promise(r => finish = r);
  Notenblick.saving = true;
  try {
    while (Notenblick.savedSeq < Notenblick.seq) {
      const target = Notenblick.seq,
        snapshot = Notenblick.N.clone(Notenblick.data),
        task = () => Notenblick.store.save(snapshot, {
          forceTXT: Notenblick.forceText,
          workspace:Notenblick.getWorkspace()
        });
      const result = navigator.locks ? await navigator.locks.request('notenblick-' + Notenblick.data.id, task) : await task();
      Object.assign(Notenblick.data, {
        revision: result.data.revision,
        commitId: result.data.commitId,
        updatedAt: result.data.updatedAt,
        appVersion: result.data.appVersion
      });
      Notenblick.savedSeq = target;
      Notenblick.dirty = Notenblick.savedSeq < Notenblick.seq;
      if (result.txtError) {
        Notenblick.dirty = true;
        Notenblick.savedSeq = target - 1;
        Notenblick.status('Notenlisten fehlen noch', 'failed');
        Notenblick.error('Deine Noten sind gespeichert. Die Textlisten konnten noch nicht aktualisiert werden. Bitte wähle unter „Sicherung“ erneut „TXT-Notenlisten aktualisieren“.','storage');
        break;
      }
      Notenblick.forceText = false;
      if (!Notenblick.pending.size) Notenblick.error();
      Notenblick.lastSavedAt=result.data.updatedAt;
      if(Notenblick.ui.main==='backup')Notenblick.updateSaveDetails();
      Notenblick.status(Notenblick.dirty ? 'Wird gespeichert …' : 'Gespeichert', Notenblick.dirty ? 'pending' : '');
    }
    Notenblick.cache();
  } catch (e) {
    Notenblick.dirty = true;
    Notenblick.status('Nicht gespeichert', 'failed');
    Notenblick.error(e.message + ' Über „Sicherung“ kannst du den aktuellen Stand sichern.','storage');
    Notenblick.cache();
  } finally {
    Notenblick.saving = false;
    finish();
    Notenblick.savingPromise = null;
  }
};
Notenblick.activate = function activate(next, d) {
  Notenblick.store = next;
  Notenblick.mode = 'working';
  Notenblick.data = Notenblick.N.upgrade(d);
  Notenblick.dirty = false;
  Notenblick.seq = Notenblick.savedSeq = 0;
  Notenblick.undo = [];
  Notenblick.pending.clear();
  Notenblick.rendered = {};
  if(d.workspace&&!Object.keys(Notenblick.workspace||{}).length)Notenblick.workspace=Notenblick.N.clone(d.workspace);
  delete Notenblick.data.workspace;delete Notenblick.data.preferences;
  Notenblick.restoreWorkspace();
  Notenblick.normalizeContext();
  Notenblick.activateGroup('main', Notenblick.ui.main);
  Notenblick.cache();
  Notenblick.error();
  Notenblick.lastSavedAt=d.updatedAt;
  Notenblick.status('Gespeichert');
  if(!Notenblick.N.isCurrentData(d)||d.workspace||d.preferences)Notenblick.mark();
};
Notenblick.restoreData = async function restoreData(input) {
  const restored = Notenblick.N.upgrade(input);
  await Notenblick.workspacePromise;
  if(!Notenblick.store) localStorage.setItem('notenblick-vor-wiederherstellung',JSON.stringify({...Notenblick.data,workspace:Notenblick.getWorkspace()}));
  if(Notenblick.saving)await Notenblick.savingPromise;
  if(Notenblick.store && Notenblick.dirty && !Notenblick.fatalStart){await Notenblick.save();if(Notenblick.dirty)throw Error('Der aktuelle Stand konnte vor der Wiederherstellung nicht vollständig gesichert werden.');}
  if (Notenblick.store) {
    const result = await Notenblick.store.save(restored, {
      replace: true,
      repair: true,
      forceTXT: true,workspace:input.workspace||{},previousWorkspace:Notenblick.getWorkspace()
    });
    Notenblick.data = result.data;
    Notenblick.lastSavedAt=result.data.updatedAt;
    Notenblick.dirty = !!result.txtError;
    Notenblick.seq = 1;
    Notenblick.savedSeq = result.txtError ? 0 : 1;
    Notenblick.status(result.txtError ? 'Notenlisten fehlen noch' : 'Gespeichert', result.txtError ? 'failed' : '');
    if (result.txtError) Notenblick.error('Die Noten wurden wiederhergestellt. Bitte aktualisiere die Notenlisten erneut.','storage');
  } else {
    Notenblick.data = restored;
    Notenblick.mode = 'working';
    Notenblick.dirty = true;
    Notenblick.seq = 1;
    Notenblick.savedSeq = 0;
    Notenblick.status('Noch nicht gespeichert', 'pending');
  }
  Notenblick.fatalStart = false;
  Notenblick.undo = [];
  Notenblick.pending.clear();
  Notenblick.rendered = {};
  Notenblick.workspace=input.workspace||Notenblick.preferencesWorkspace(input)||{};delete Notenblick.data.workspace;delete Notenblick.data.preferences;
  if(!Notenblick.store)await window.NRSession.save(Notenblick.data);
  Notenblick.restoreWorkspace();
  if(Notenblick.store)await Notenblick.store.saveWorkspace(Notenblick.getWorkspace());else await window.NRSession.saveWorkspace(Notenblick.getWorkspace());
  Notenblick.ui.main = 'notes';
  Notenblick.activateGroup('main', 'notes');
  Notenblick.remember();
  Notenblick.cache();
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
