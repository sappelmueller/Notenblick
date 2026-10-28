/* One authoritative set of presentation preferences, persisted only in Ansicht.json. */
(function(A){'use strict';
A.preferenceDefaults=()=>({version:1,startupView:'last',nameFormat:'first-last',sortBy:'last',sortDir:'asc',selectionMode:'quick',notesLayout:'compact',areaView:'matrix',visibleKinds:[...A.kinds],pupilOrder:'kind',pupilEntries:'all',defaultPrecision:2,defaultRounding:'round',defaultCalculationMode:'grouped',defaultWeights:A.N.defaultWeights(),quickIds:null,courseCodes:{}});
A.prefs=A.preferenceDefaults();
A.restorePreferences=function(workspace){
 const source=workspace.settings||{},old=workspace.workspaces?.[workspace.course]||{},p=A.preferenceDefaults();
 if(!Object.hasOwn(source,'selectionMode')&&A.firstRun===false)p.selectionMode='select';
 for(const[k,values]of Object.entries({startupView:['last','home'],nameFormat:['first-last','last-first'],sortBy:['first','last'],sortDir:['asc','desc'],selectionMode:['select','quick'],notesLayout:['compact','kinds'],areaView:['matrix','list'],pupilOrder:['kind','date'],pupilEntries:['all','entered'],defaultRounding:['round','truncate']}))if(values.includes(source[k]))p[k]=source[k];
 if(!workspace.settings){p.sortBy=workspace.main==='admin'?(workspace.adminSort||old.sortBy||'last'):(old.sortBy||workspace.adminSort||'last');p.sortDir=workspace.main==='admin'?(workspace.adminDir||old.sortDir||'asc'):(old.sortDir||workspace.adminDir||'asc');if(!['first','last'].includes(p.sortBy))p.sortBy='last';if(!['asc','desc'].includes(p.sortDir))p.sortDir='asc';}
 if(Array.isArray(source.visibleKinds))p.visibleKinds=A.kinds.filter(k=>source.visibleKinds.includes(k));
 if([0,1,2].includes(source.defaultPrecision))p.defaultPrecision=source.defaultPrecision;
 if(['grouped','direct'].includes(source.defaultCalculationMode)&&source.defaultWeights){try{A.N.weightsValid(source.defaultWeights,{mode:source.defaultCalculationMode});p.defaultCalculationMode=source.defaultCalculationMode;p.defaultWeights=A.N.clone(source.defaultWeights);}catch{A.error?.('Die allgemeinen Gewichtungsvorgaben sind ungültig. Bitte prüfe sie unter Einstellungen.','settings');}}
 if(Array.isArray(source.quickIds))p.quickIds=[...new Set(source.quickIds.filter(x=>typeof x==='string'))].slice(0,16);
 if(source.courseCodes&&typeof source.courseCodes==='object')for(const[id,code]of Object.entries(source.courseCodes))if(A.data.courses.some(c=>c.id===id)&&typeof code==='string'&&code.length<=16&&!/[\r\n\u0000-\u001f]/.test(code))p.courseCodes[id]=code.trim();
 A.prefs=p;A.ui.settingsView=['general','display','calculation'].includes(workspace.settingsView)?workspace.settingsView:'general';
};
A.showAverage=(v,c)=>v===null?'–':A.N.show(v,c);
A.studentName=s=>A.N.name(s,A.prefs.nameFormat);
A.matchesStudent=(s,term)=>[A.studentName(s),A.N.name(s,'first-last'),A.N.name(s,'last-first')].some(x=>x.toLocaleLowerCase('de').includes(term));
A.sorted=list=>A.N.sorted(list,A.prefs.sortBy,A.prefs.sortDir);
A.sortFields=function(prefix,hints=false){return`<div class="form-grid"><div class="field"><label for="${prefix}-sort">Sortieren nach</label><select id="${prefix}-sort" data-setting="sortBy"${hints?' aria-describedby="'+prefix+'-sort-hint"':''}>${A.opt('last','Nachname',A.prefs.sortBy)}${A.opt('first','Vorname',A.prefs.sortBy)}</select>${hints?`<small id="${prefix}-sort-hint">Bestimme, ob die Schüler nach Vorname oder Nachname sortiert werden.</small>`:''}</div><div class="field"><label for="${prefix}-dir">Reihenfolge</label><select id="${prefix}-dir" data-setting="sortDir"${hints?' aria-describedby="'+prefix+'-dir-hint"':''}>${A.opt('asc','A–Z',A.prefs.sortDir)}${A.opt('desc','Z–A',A.prefs.sortDir)}</select>${hints?`<small id="${prefix}-dir-hint">Zeige die Schüler aufsteigend oder absteigend an.</small>`:''}</div></div>`;};
A.setPreference=function(key,value){
 if(!A.canLeave())return false;
 const p={...A.prefs,[key]:value};
 if(key==='defaultPrecision')p[key]=Number(value);
 const allowed={startupView:['last','home'],nameFormat:['first-last','last-first'],sortBy:['first','last'],sortDir:['asc','desc'],selectionMode:['select','quick'],notesLayout:['compact','kinds'],areaView:['matrix','list'],pupilOrder:['kind','date'],pupilEntries:['all','entered'],defaultPrecision:[0,1,2],defaultRounding:['round','truncate']};
 if(key==='visibleKinds'){if(!Array.isArray(value)||value.some(k=>!A.kinds.includes(k)))throw Error('Bitte gültige Leistungsarten wählen.');p.visibleKinds=A.kinds.filter(k=>value.includes(k));}
 else if(!allowed[key]?.includes(p[key]))throw Error('Bitte eine gültige Einstellung wählen.');
 A.prefs=p;A.rendered={};A.remember();
 if(['notesLayout','visibleKinds'].includes(key)&&A.ui.main==='notes'){const focused=document.activeElement?.closest('#noteTabs');A.renderNotes();if(focused)A.$('#noteTabs [aria-selected=true]')?.focus();}
 // Synchronize controls in mounted views without replacing a focused form.
 for(const el of document.querySelectorAll('[data-setting="'+key+'"]')){if(key==='visibleKinds')el.checked=p.visibleKinds.includes(el.value);else el.value=String(p[key]);}
 if(['defaultPrecision','defaultRounding'].includes(key)&&A.$('#defaultWeightEditor')?.isConnected){A.settingsWeights.load(A.newCourseConfig());A.settingsWeights.saved();}
 A.updateSettingsVisibility?.();
 if(key==='selectionMode'&&A.ui.main==='notes')A.fillSelection();
 if(key==='areaView'&&A.ui.main==='notes'){const w=A.W(),kind=A.kinds.includes(w.view)?w.view:w.assessmentFilter;if(kind!=='oral'){w.assessmentWorkOpen=false;A.renderAssessments(A.kinds.includes(w.view)?w.view:'');const details=document.getElementById('areaViewDetails');if(details)details.open=true;document.getElementById('areaView')?.focus();}}
 if(['pupilOrder','pupilEntries'].includes(key)&&A.ui.main==='notes'&&A.W().view==='pupil'){const id=document.activeElement?.id;A.renderPupil();const details=document.getElementById("pupilViewDetails");if(details)details.open=true;document.getElementById(id)?.focus();}
 if(['sortBy','sortDir','nameFormat'].includes(key)){
  if(A.ui.main==='notes'){if(A.W().view==='overview')A.refreshTable('overview');else A.renderNotes();}
  if(A.ui.main==='admin'&&A.ui.adminView==='students')A.$('#adminStudentsTable').innerHTML=A.studentsTable(A.adminClass());
 }
 return true;
};
// Compatibility accessors reuse the new global values; they never hold separate settings.
A.attachSort=function(w){for(const[key,pref]of [['sortBy','sortBy'],['sortDir','sortDir']])Object.defineProperty(w,key,{configurable:true,enumerable:false,get:()=>A.prefs[pref],set:v=>{if((key==='sortBy'?['first','last']:['asc','desc']).includes(v))A.prefs[pref]=v;}});return w;};
for(const[key,pref]of [['adminSort','sortBy'],['adminDir','sortDir']])Object.defineProperty(A.ui,key,{configurable:true,enumerable:false,get:()=>A.prefs[pref],set:v=>{if((pref==='sortBy'?['first','last']:['asc','desc']).includes(v))A.prefs[pref]=v;}});
A.subjectCode=function(c){if(Object.hasOwn(A.prefs.courseCodes,c.id))return A.prefs.courseCodes[c.id];return A.suggestSubjectCode(c.name);};
A.suggestSubjectCode=function(name){const clean=x=>x.toLocaleLowerCase('de').normalize('NFKC').replace(/[\s,\/–—-]+/g,' ').trim();return (window.NRSubjectCatalog?.subjects||[]).find(x=>x.names.some(n=>clean(n)===clean(name)))?.code||'';};
A.copyCoursePresentation=function(sourceId,targetId){if(Object.hasOwn(A.prefs.courseCodes,sourceId))A.prefs.courseCodes[targetId]=A.prefs.courseCodes[sourceId];};
A.copyClassPresentation=function(sourceId,targetId,d=A.data){for(const c of d.courses.filter(c=>c.classId===sourceId)){const target=d.courses.find(x=>x.classId===targetId&&x.name===c.name);if(target)A.copyCoursePresentation(c.id,target.id);}};
A.newCourseConfig=(p=A.prefs)=>({calculationMode:p.defaultCalculationMode,weights:A.N.clone(p.defaultWeights),precision:p.defaultPrecision,rounding:p.defaultRounding});
A.classesByYear=list=>[...list].sort((a,b)=>A.N.compareSchoolYears(A.data.years.find(y=>y.id===a.yearId),A.data.years.find(y=>y.id===b.yearId))||a.name.localeCompare(b.name,'de',{numeric:true,sensitivity:'base'}));
A.schoolYear=y=>/^Schuljahr\b/i.test(y.label)?y.label:'Schuljahr '+y.label;
})(globalThis.Notenblick);
