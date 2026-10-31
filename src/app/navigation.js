/* Notenblick – app/navigation.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.canLeave = function canLeave({pointSettings=false}={}) {
 if(!pointSettings&&Notenblick.pointSettingsDirty?.()){Notenblick.error('Bitte übernimm die geänderten Notenschlüsseleinstellungen oder wähle Abbrechen.');Notenblick.$('#pointApply')?.focus();return false;}
  if(Notenblick.checkSettingsDraft&&!Notenblick.checkSettingsDraft())return false;
  for(const id of [...Notenblick.pending]){const el=document.getElementById(id);if(el?.dataset.entry)Notenblick.entryChange(el);}
  const el = document.querySelector('[data-entry][aria-invalid=true]');
  if (el) {
    Notenblick.error('Bitte korrigiere zuerst die markierte Eingabe.');
    el.focus();
    return false;
  }
  return true;
};
Notenblick.bind = function bind(id, keys, onActivate, before = Notenblick.canLeave) {
  const list = Notenblick.$('#' + id),
    tabs = keys.map(k => list.querySelector(`[data-key="${k}"]`)),
    panels = tabs.map(t => Notenblick.$('#' + t.getAttribute('href').slice(1)));
  return window.tsBindViewTabs(list, {
    tabs,
    panels,
    label: id === 'mainTabs' ? 'Hauptbereiche' : id === 'noteTabs' ? 'Notenbereiche' : id === 'extraTabs' ? 'Weitere Leistungen' : id === 'adminTabs' ? 'Verwaltung' : id==='settingsTabs'?'Einstellungen':id==='backupTabs'?'Sicherung':'Noteneingabe',
    beforeActivate: before,
    onError: e => Notenblick.error('Der Bereich konnte nicht geöffnet werden. '+e.message),
    onActivate: (tab, update) => onActivate(tab.dataset.key, update)
  });
};
Notenblick.initTabs = function initTabs() {
  const links = [...Notenblick.$('#mainTabs').querySelectorAll('a')];
  const show=key=>{for(const item of links){const active=item.dataset.key===key;if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');Notenblick.$('#'+item.dataset.key).hidden=!active;}Notenblick.ui.main=key;};
  Notenblick.groups.main = {activate(link, focus = false, update = false) {
    const key=link.dataset.key,origin=Notenblick.helpOrigin,returning=Notenblick.ui.main==='help'&&!!origin;
    // Help may be read with an invalid entry or an unsaved settings draft.
    // Return to those same mounted controls before validation; never rebuild them.
    if(returning)show(origin);
    if(key!=='help'&&!(returning&&key===origin)&&!Notenblick.canLeave())return false;
    if(key==='help'&&Notenblick.ui.main!=='help')Notenblick.helpOrigin=Notenblick.ui.main;else if(key!=='help')Notenblick.helpOrigin=null;
    Notenblick.closeMenu?.(false);Notenblick.clearAnnouncement();show(key);
    if(update)Notenblick.$('#actionFeedback').hidden=true;
    if(!(returning&&key===origin))Notenblick.refreshCurrent();
    if (focus) link.focus();
    if (update) Notenblick.remember();
    return true;
  }};
  links.forEach(link => link.addEventListener('click', e => {e.preventDefault(); Notenblick.groups.main.activate(link,true,true);}));
  Notenblick.ensureNoteTabs();
  Notenblick.groups.backup=Notenblick.bind('backupTabs',['status','create','restore','export'],(key,update)=>{Notenblick.ui.backupView=key;Notenblick.renderBackupPane(key);if(update)Notenblick.remember();});
  Notenblick.groups.settings=Notenblick.bind('settingsTabs',['general','display','calculation'],(key,update)=>{Notenblick.ui.settingsView=key;Notenblick.renderSettingsPane(key);if(update)Notenblick.remember();});
  Notenblick.groups.class = Notenblick.bind('adminTabs', ['years','classes','students','subjects'], (key, update) => {
    Notenblick.ui.adminView = key; Notenblick.renderAdminSelection(); Notenblick.renderAdminPane(key); if (update) Notenblick.remember();
  });
};
Notenblick.activateGroup = function activateGroup(group, key, focus = false, update = false) {
  if(group==='notes'){Notenblick.ensureNoteTabs();key=Notenblick.mapNotesView(key);}
  const map = {
      main: 'mainTabs',
      notes: 'noteTabs',
      class: 'adminTabs',
      settings:'settingsTabs',backup:'backupTabs'
    },
    tab = Notenblick.$('#' + map[group]).querySelector(`[data-key="${key}"]`);
  if (tab) Notenblick.groups[group].activate(tab, focus, update);
};
Notenblick.normalizeContext = function normalizeContext() {
  const u=Notenblick.ui,ys=Notenblick.data.years;
  if(!ys.some(y=>y.id===u.workingYear))u.workingYear=ys.find(y=>!y.archived)?.id||ys[0]?.id||'';
  if(!ys.some(y=>y.id===u.historicalYear)||u.historicalYear===u.workingYear)u.historicalYear='';
  u.year=u.historicalYear||u.workingYear;
  const classes = Notenblick.data.classes.filter(c => c.yearId === Notenblick.ui.year);
  if (!classes.some(c => c.id === Notenblick.ui.class)) Notenblick.ui.class = classes.find(c => !c.archived)?.id || classes[0]?.id || '';
  const courses = Notenblick.data.courses.filter(c => c.classId === Notenblick.ui.class);
  if (!courses.some(c => c.id === Notenblick.ui.course)) Notenblick.ui.course = courses.find(c => !c.archived)?.id || courses[0]?.id || '';
  if (!Notenblick.data.years.some(y => y.id === Notenblick.ui.adminYear)) Notenblick.ui.adminYear = Notenblick.ui.year;
};
Notenblick.courseChoices=function(yid=Notenblick.ui.year){const collator=new Intl.Collator('de',{numeric:true,sensitivity:'base'}),classes=new Map(Notenblick.data.classes.filter(c=>c.yearId===yid&&!c.archived).map(c=>[c.id,c]));return Notenblick.data.courses.filter(c=>classes.has(c.classId)&&!c.archived).sort((a,b)=>collator.compare(classes.get(a.classId).name,classes.get(b.classId).name)||collator.compare(a.name,b.name)||a.id.localeCompare(b.id));};
Notenblick.chooseContext=function({classId,courseId,historical=false,openNotes=false,view=null}={}){
 const A=Notenblick;if(!A.canLeave())return false;
 const course=courseId&&A.data.courses.find(c=>c.id===courseId),cl=A.data.classes.find(c=>c.id===(course?.classId||classId||A.ui.class));if(!cl)return false;
 if(cl.yearId!==A.ui.year&&!historical)return false;
 if(historical){A.ui.year=cl.yearId;A.ui.historicalYear=cl.yearId===A.ui.workingYear?'':cl.yearId;}
 A.ui.class=cl.id;A.ui.course=course?.id||A.ui.selections[cl.yearId+':'+cl.id]?.course||'';A.normalizeContext();
 A.openCourseWorkspace({view});A.openedNotesCourse=A.ui.course;A.ui.selections[cl.yearId+':'+cl.id]={course:A.ui.course};A.rendered={};if(openNotes)A.activateGroup('main','notes',false,true);else A.renderNotes();A.remember();return true;
};
Notenblick.openCourseWorkspace=function({view=null}={}){const A=Notenblick;A.clearAnnouncement();A.entrySession=null;if(view||A.prefs.courseOpenView==='overview'){A.W().view=view||'overview';A.W().assessmentWorkOpen=false;}};
Notenblick.fillSelection=function(yid=Notenblick.ui.year,cid=Notenblick.ui.class,fid=Notenblick.ui.course){
 const A=Notenblick,collator=new Intl.Collator('de',{numeric:true,sensitivity:'base'}),cs=A.data.classes.filter(c=>c.yearId===yid).sort((a,b)=>collator.compare(a.name,b.name)),fs=A.data.courses.filter(c=>c.classId===cid).sort((a,b)=>collator.compare(a.name,b.name));
 A.$('#class').innerHTML=cs.map(c=>A.opt(c.id,c.name+(c.archived?' (ausgeblendet)':''),cid)).join('')||A.opt('','Keine Klasse','');
 A.$('#course').innerHTML=fs.map(c=>A.opt(c.id,c.name+(c.archived?' (ausgeblendet)':''),fid)).join('')||A.opt('','Kein Fach','');
 const quick=A.prefs.selectionMode==='quick',all=A.$('#allSelection'),list=A.courseChoices(yid);
 A.$('#quickSelection').hidden=!quick;A.$('#allSelectionSummary').hidden=!quick;
 if(all.dataset.mode!==A.prefs.selectionMode){all.open=!quick;all.dataset.mode=A.prefs.selectionMode;}
 if(quick){const {chosen}=A.shortcutChoices(yid,fid);A.$('#quickSelection').innerHTML=A.quickLinks(chosen,{activeId:fid})+(!chosen.length?'<p class="hint">Keine Schnellzugriffe ausgewählt.</p>':'');}

};
Notenblick.noteTabKeys=()=>Notenblick.prefs.notesLayout==='kinds'?['overview',...Notenblick.prefs.visibleKinds,'pupil']:['overview','assessments','pupil'];
Notenblick.assessmentView=kind=>Notenblick.prefs.notesLayout==='kinds'?(Notenblick.prefs.visibleKinds.includes(kind)?kind:'overview'):'assessments';
Notenblick.mapNotesView=function(key){const A=Notenblick,w=A.W(),keys=A.noteTabKeys();
 if(A.prefs.notesLayout==='compact'&&A.kinds.includes(key)){w.assessmentFilter=key;return'assessments';}
 if(A.prefs.notesLayout==='kinds'&&key==='assessments'){const kind=A.data.assessments.find(a=>a.id===w.assessmentId)?.kind;return A.prefs.visibleKinds.includes(kind)?kind:'overview';}
 if(A.kinds.includes(key)&&!keys.includes(key)){w.assessmentFilter=key;return keys.includes('assessments')?'assessments':'overview';}
 return keys.includes(key)?key:'overview';
};
Notenblick.notePanel=key=>Notenblick.kinds.includes(key)?'notes-'+key:key;
Notenblick.ensureNoteTabs=function(){
 const A=Notenblick,list=A.$('#noteTabs'),layout=A.prefs.notesLayout+':'+A.prefs.visibleKinds.join(',');if(list.dataset.layout===layout)return;
 const keys=A.noteTabKeys(),labels={overview:'Übersicht',assessments:'Leistungen',pupil:'Schüler',...A.N.KINDS};
 for(const key of ['overview','assessments',...A.kinds,'pupil']){const panel=A.$('#'+A.notePanel(key));panel.hidden=true;panel.removeAttribute('role');panel.removeAttribute('aria-labelledby');if(key==='assessments'||A.kinds.includes(key))panel.innerHTML='';}
 list.innerHTML=keys.map(key=>`<li><a id="tab-${key}" href="#${A.notePanel(key)}" data-key="${key}">${labels[key]}</a></li>`).join('');list.dataset.layout=layout;
 A.groups.notes=A.bind('noteTabs',keys,(key,update)=>{A.clearAnnouncement();A.W().view=key;A.showNotesPane(key);if(update)A.remember();});
};
Notenblick.refreshCurrent = function refreshCurrent() {
  Notenblick.normalizeContext();
  Notenblick.$('#modeNotice').hidden = Notenblick.mode !== 'demo' && !!Notenblick.store;
  Notenblick.$('#modeNotice').textContent = Notenblick.mode === 'demo' ? 'Beispieldaten – Änderungen werden nicht dauerhaft gespeichert.' : !Notenblick.store ? 'Für die feste Ablage in „Daten“ starte Notenblick.exe. Bis dahin bleiben deine Eingaben in diesem Browser erhalten.' : '';
  if (Notenblick.ui.main === 'home') Notenblick.renderHome();
  if (Notenblick.ui.main === 'notes') Notenblick.renderNotes();
  if (Notenblick.ui.main === 'admin') Notenblick.renderAdmin();
  if (Notenblick.ui.main === 'backup') Notenblick.renderBackup();
  if (Notenblick.ui.main === 'settings') Notenblick.renderSettings();
  if (Notenblick.ui.main === 'help') Notenblick.renderHelp();
};
Notenblick.restoreScroll=function(){for(const el of document.querySelectorAll('.table-wrap')){const value=Notenblick.scrolls[Notenblick.ui.course+':'+(el.id||el.closest('[role=tabpanel]')?.id)];if(value!==undefined){const x=typeof value==='number'?value:value.x,y=typeof value==='number'?el.scrollTop:value.y;if(el.scrollLeft!==x)el.scrollLeft=x;if(el.scrollTop!==y)el.scrollTop=y;}}};
})(globalThis.Notenblick = globalThis.Notenblick || {});
