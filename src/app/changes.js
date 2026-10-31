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
  if (Notenblick.mode !== 'demo') { Notenblick.sessionWrites++;window.NRSession.save(Notenblick.data).then(()=>{Notenblick.sessionFailed=false;}).catch(() => {Notenblick.sessionFailed=true;Notenblick.error('Deine Eingaben konnten noch nicht gesichert werden. Bitte erstelle eine Sicherung.','storage');}).finally(()=>{Notenblick.sessionWrites--;Notenblick.updateSaveDetails?.();}); }
  if (Notenblick.store) {
    Notenblick.status('Wird gespeichert …', 'pending');
    clearTimeout(Notenblick.saveTimer);
    Notenblick.saveTimer = setTimeout(Notenblick.save, 220);
  } else Notenblick.status(Notenblick.mode === 'demo' ? 'Beispieldaten' : 'Im Browser aufbewahrt');
};
Notenblick.workspacePromise=Promise.resolve();
Notenblick.getWorkspace=()=>({...((Notenblick.data.workspace?.setupCommitId||Notenblick.workspace?.setupCommitId)?{setupCommitId:Notenblick.data.workspace?.setupCommitId||Notenblick.workspace?.setupCommitId}:{}),main:Notenblick.ui.main,lastNotesCourse:Notenblick.ui.lastNotesCourse,workingYear:Notenblick.ui.workingYear,historicalYear:Notenblick.ui.historicalYear,year:Notenblick.ui.year,class:Notenblick.ui.class,course:Notenblick.ui.course,weightClass:Notenblick.ui.weightClass,weightCourse:Notenblick.ui.weightCourse,adminYear:Notenblick.ui.adminYear,adminClass:Notenblick.ui.adminClass,adminView:Notenblick.ui.adminView,adminSearch:Notenblick.ui.adminSearch,showExitedAdmin:Notenblick.ui.showExitedAdmin,showArchived:Notenblick.ui.showArchived,nameOrder:Notenblick.ui.nameOrder,selections:Notenblick.N.clone(Notenblick.ui.selections||{}),scrolls:Notenblick.N.clone(Notenblick.scrolls),settings:Notenblick.N.clone(Notenblick.prefs),helpView:Notenblick.ui.helpView,settingsView:Notenblick.ui.settingsView,backupView:Notenblick.ui.backupView,workspaces:Notenblick.N.clone(Notenblick.ui.workspaces)});
Notenblick.remember=function(){
 if(Notenblick.starting||Notenblick.fatalStart)return;
 const workspace=Notenblick.getWorkspace(),store=Notenblick.store;Notenblick.workspace=workspace;
 Notenblick.workspacePromise=Notenblick.workspacePromise.catch(()=>{}).then(async()=>{await(store?store.saveWorkspace(workspace):window.NRSession.saveWorkspace(workspace));Notenblick.workspaceFailed=false;if(Notenblick.ui.main==='backup')Notenblick.updateSaveDetails();}).catch(e=>{Notenblick.error('Die letzte Ansicht konnte nicht gespeichert werden. '+e.message,'storage');Notenblick.workspaceFailed=true;if(Notenblick.ui.main==='backup')Notenblick.updateSaveDetails();});
};
Notenblick.restoreWorkspace = function restoreWorkspace(source=Notenblick.workspace||{}) {
  const a=source;Notenblick.entrySession=null;Notenblick.openedNotesCourse=null;Notenblick.restorePreferences(source);
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
  Notenblick.ui.helpView=globalThis.NRHelp.topics.some(t=>t.id===a.helpView)?a.helpView:'einstieg';
  Notenblick.ui.backupView=['status','create','restore','export'].includes(a.backupView)?a.backupView:'status';
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
  if(next.courses.some(c=>c.calculationMode==='direct')||next.assessments.some(a=>a.participantIds||a.oralEntry||a.pointKey||a.inputMode))next.appVersion=Notenblick.version;
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
// Publish a draft only after the existing storage layer has accepted its JSON.
Notenblick.commitDraft=async function(fn,options={}){
 const A=Notenblick;if(A.starting||A.fatalStart)throw Error('Bitte zuerst deine Noten vollständig öffnen.');
 if(A.saving)await A.savingPromise;if(A.store&&A.dirty){await A.save();if(A.dirty)throw Error('Der bisherige Stand konnte noch nicht vollständig gespeichert werden. Bitte erneut speichern.');}
 const previous=A.data,next=A.N.clone(previous);fn(next);next.appVersion=A.version;A.N.validate(next);
 const controls=[...A.$('#dialogContent').querySelectorAll('input,select,textarea,button')].map(el=>[el,el.disabled]);for(const[el]of controls)el.disabled=true;
 let finish;A.savingPromise=new Promise(r=>finish=r);A.saving=true;clearTimeout(A.saveTimer);
 try{
  const result=A.store?await A.store.save(next,{workspace:options.workspace||A.getWorkspace(),initialSetup:options.initialSetup===true}):A.mode!=='demo'?(await(options.workspace?window.NRSession.saveWithWorkspace(next,options.workspace):window.NRSession.save(next)),null):null;
  if(A.data!==previous)throw Error('Die Daten wurden inzwischen verändert. Bitte den Dialog erneut öffnen.');
  A.undo.push(A.N.clone(previous));if(A.undo.length>20)A.undo.shift();A.data=result?.data||next;A.seq++;A.jsonSavedSeq=A.seq;A.textPending=!!result?.txtError;A.savedSeq=A.store&&!result?.txtError?A.seq:A.seq-1;A.dirty=!!result?.txtError||!A.store;if(A.mode==='none')A.mode='working';A.rendered={};A.cache();A.refreshCurrent();A.lastSavedAt=A.data.updatedAt;
  if(result?.txtError){A.status('Notenlisten fehlen noch','failed');throw Error('Die Noten sind gespeichert. Die Textlisten konnten noch nicht aktualisiert werden. Bitte wähle erneut Speichern.');}
  A.status(A.store?'Gespeichert':A.mode==='demo'?'Beispieldaten':'Im Browser aufbewahrt');if(!A.pending.size)A.error();
 }finally{for(const[el,disabled]of controls)if(el.isConnected)el.disabled=disabled;A.saving=false;finish();A.savingPromise=null;}
};
Notenblick.save = async function save() {
  clearTimeout(Notenblick.saveTimer);
  if (Notenblick.saving) return Notenblick.savingPromise;
  if(Notenblick.store&&Notenblick.textPending&&Notenblick.dirty&&Notenblick.jsonSavedSeq===Notenblick.seq)return Notenblick.refreshTextLists(true);
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
      Notenblick.jsonSavedSeq=target;Notenblick.textPending=!!result.txtError;Notenblick.lastSavedAt=result.data.updatedAt;
      Notenblick.savedSeq = target;
      Notenblick.dirty = Notenblick.savedSeq < Notenblick.seq;
      if (result.txtError) {
        Notenblick.dirty = true;
        Notenblick.savedSeq = target - 1;
        Notenblick.status('Notenlisten fehlen noch', 'failed');
        Notenblick.error('Deine Noten sind gespeichert. Die Textlisten konnten noch nicht aktualisiert werden. Bitte wähle unter „Sicherung → Speicherstatus“ „Automatische Notenlisten prüfen“.','storage');
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
    Notenblick.savingPromise = null;Notenblick.updateSaveDetails?.();
  }
};
Notenblick.refreshTextLists=async function(force=false){
 const A=Notenblick;if(A.fatalStart)throw Error('Bitte öffne zuerst einen lesbaren Notenstand oder stelle eine Sicherung wieder her. Die vorhandenen Textdateien bleiben unverändert.');if(!A.store)return;if(A.saving)await A.savingPromise;let renewed=0;
 if(A.dirty&&!(A.textPending&&A.jsonSavedSeq===A.seq)){await A.save();if(A.dirty)throw Error('Bitte zuerst die Noten vollständig speichern.');renewed=A.store.lastTextResult?.written||0;}
 const at=A.seq;let finish;A.savingPromise=new Promise(r=>finish=r);A.saving=true;try{const result=await A.store.refreshTextLists(A.data,{force});A.textPending=false;if(A.seq===at&&A.jsonSavedSeq===at){A.dirty=false;A.savedSeq=at;A.forceText=false;}A.cache();A.status(A.dirty?'Änderungen noch nicht gespeichert':'TXT-Notenlisten geprüft');A.updateSaveDetails();if(!A.dirty&&!A.workspaceFailed)A.error('','storage');return {...result,written:result.written+renewed};}
 catch(e){A.textPending=true;A.status('Notenlisten fehlen noch','failed');A.updateSaveDetails();throw Error('Die JSON-Noten sind unverändert gespeichert. Die TXT-Notenlisten konnten noch nicht vollständig aktualisiert werden. Bitte wähle unter Sicherung → Speicherstatus „Automatische Notenlisten prüfen“. '+e.message);}
 finally{A.saving=false;finish();A.savingPromise=null;if(A.dirty&&A.seq!==at){clearTimeout(A.saveTimer);A.saveTimer=setTimeout(A.save,0);}}
};
Notenblick.activate = function activate(next, d) {
  Notenblick.store = next;
  Notenblick.mode = 'working';
  Notenblick.data = Notenblick.N.upgrade(d);
  Notenblick.dirty = false;
  Notenblick.seq = Notenblick.savedSeq = Notenblick.jsonSavedSeq = 0;Notenblick.textPending=false;
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
Notenblick.restoreData = async function restoreData(input,{onProgress=()=>{}}={}) {
  const A=Notenblick;onProgress('Sicherung prüfen.');const restored=A.N.upgrade(input);
  await A.workspacePromise;if(A.saving)await A.savingPromise;
  if(A.store&&A.dirty&&!A.fatalStart){await A.save();if(A.dirty)throw Error('Der aktuelle Stand konnte vor der Wiederherstellung nicht vollständig gesichert werden.');}
  const previous=A.data;let committed=false,warning='';clearTimeout(A.saveTimer);
  let finish;A.saving=true;A.savingPromise=new Promise(resolve=>finish=resolve);
  try{
    if(A.store){
      const result=await A.store.save(restored,{replace:true,repair:true,forceTXT:true,workspace:input.workspace||{},previousWorkspace:A.getWorkspace(),onProgress});
      A.data=result.data;committed=true;A.lastSavedAt=result.data.updatedAt;A.dirty=!!result.txtError;A.seq=1;A.jsonSavedSeq=1;A.textPending=!!result.txtError;A.savedSeq=result.txtError?0:1;
      if(result.txtError)warning='Deine Noten wurden wiederhergestellt. Die zusätzlichen Textdateien konnten noch nicht vollständig aktualisiert werden. Bitte prüfe die automatischen Notenlisten unter Speicherstatus.';
      A.status(result.txtError?'Notenlisten fehlen noch':'Gespeichert',result.txtError?'failed':'');
    }else{
      onProgress('Bisherigen Datenstand sichern.');localStorage.setItem('notenblick-vor-wiederherstellung',JSON.stringify({...A.data,workspace:A.getWorkspace()}));
      onProgress('Noten wiederherstellen.');const clean=A.N.clone(restored);delete clean.workspace;delete clean.preferences;await window.NRSession.save(clean);A.data=clean;committed=true;
      A.mode='working';A.dirty=true;A.seq=A.jsonSavedSeq=1;A.textPending=false;A.savedSeq=0;
    }
    A.firstRun=false;A.fatalStart=false;A.mode='working';A.undo=[];A.pending.clear();A.rendered={};
    A.workspace=input.workspace||A.preferencesWorkspace(input)||{};delete A.data.workspace;delete A.data.preferences;A.restoreWorkspace();
    // Restore settings and workspaces, then explicitly retain the recovery
    // context. A saved navigation choice must never move focus after restore.
    A.ui.main='backup';A.ui.backupView='restore';A.normalizeContext();onProgress('Wiederherstellung abschließen.');
    try{if(A.store)await A.store.saveWorkspace(A.getWorkspace());else await window.NRSession.saveWorkspace(A.getWorkspace());A.workspaceFailed=false;}
    catch{A.workspaceFailed=true;warning+=(warning?' ':'')+'Die Noten wurden übernommen. Die Einstellungen konnten noch nicht vollständig gespeichert werden. Bitte erneut speichern.';}
    A.cache();A.activateGroup('main','backup');A.activateGroup('backup','restore');
    if(warning)A.error(warning,'storage');else{A.error('','storage');A.error();}
    return {warning};
  }catch(e){if(!committed)A.data=previous;A.ui.main='backup';A.ui.backupView='restore';throw e;}
  finally{A.saving=false;finish();A.savingPromise=null;}
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
