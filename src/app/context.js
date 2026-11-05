/* Notenblick – app/context.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.getCourse = () => Notenblick.data.courses.find(c => c.id === Notenblick.ui.course);
Notenblick.getClass = () => Notenblick.data.classes.find(c => c.id === Notenblick.ui.class);
Notenblick.getYear = () => Notenblick.data.years.find(y => y.id === Notenblick.ui.year);
Notenblick.getStudent = id => Notenblick.data.students.find(s => s.id === id);
Notenblick.defaults = () => ({
  view: 'overview',
  extra: 'homework',
  search: '',
  columns: [...(Notenblick.N.courseMode(Notenblick.getCourse())==='grouped'?['written']:[]),...Notenblick.kinds],
  showExited: false,
  selected: {},
  hiddenTabs: [],knownKinds:[...Notenblick.kinds],
  entryMode: 'table',
  studentIndex: 0,
  assessmentFilter: 'all',
  assessmentId: '',
  assessmentSearch: '',
  entrySearch: '',
  matrixPages: {},
  assessmentWorkOpen: false,
  oralView:'classes',oralAreaView:Notenblick.prefs.areaView,oralClassSearch:'',oralListSearch:'',oralSearch:'',oralStudent:'all',oralSort:'date',oralPage:0,oralFocusId:'',
  pupil: ''
});
const calculations = new WeakMap();
Notenblick.calculation = function(c, sid, data=Notenblick.data) {
  let cache = calculations.get(data);
  if (!cache) {cache = new Map(); calculations.set(data, cache);}
  const key = c.id + ':' + sid;
  if (!cache.has(key)) cache.set(key, Notenblick.N.calculate(data, c, sid));
  return cache.get(key);
};
// The class result always uses active course members, independently of the
// displayed search, pagination and inclusion of former pupils. Keep the exact
// individual results until NR.show applies the course's rounding for display.
Notenblick.classAverages = function(c,data=Notenblick.data) {
 const A=Notenblick,results=A.N.activeStudents(data,c).map(s=>A.calculation(c,s.id,data));
 return {categories:Object.fromEntries(['written',...A.N.areaIds(c)].map(k=>[k,A.N.average(results.map(r=>({value:r.categories[k]})))])),total:A.N.average(results.map(r=>({value:r.total}))),finals:A.N.classFinalAverages(data,c)};
};
const assessmentStats = new WeakMap();
Notenblick.assessmentStats = function(a,c=Notenblick.getCourse(),data=Notenblick.data) {
 let cache=assessmentStats.get(data);if(!cache){cache=new Map();assessmentStats.set(data,cache);}
 if(!cache.has(a.id)){
  cache.set(a.id,Notenblick.N.assessmentProgress(data,c,a));
 }
 return cache.get(a.id);
};
Notenblick.W = function W() {
  if (!Notenblick.ui.workspaces[Notenblick.ui.course]) Notenblick.ui.workspaces[Notenblick.ui.course] = Notenblick.defaults();
  const w=Notenblick.ui.workspaces[Notenblick.ui.course],c=Notenblick.getCourse();if(c){const ids=Notenblick.N.areaIds(c),known=new Set(w.knownKinds||ids),shown=new Set(w.columns);for(const id of ids)if(!known.has(id))shown.add(id);w.columns=[...(Notenblick.N.courseMode(c)==='grouped'?['written']:[]),...ids].filter(id=>shown.has(id));w.knownKinds=ids;w.hiddenTabs=(w.hiddenTabs||[]).filter(id=>ids.includes(id));}return Notenblick.attachSort(w);
};
Notenblick.b = (action, label, attrs = '', cls = 'button') => `<button type="button" class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
Notenblick.opt = (v, label, selected) => `<option value="${Notenblick.esc(v)}"${String(v) === String(selected) ? ' selected' : ''}>${Notenblick.esc(label)}</option>`;
Notenblick.field = (id, label, value = '', attrs = '', type = 'text', hint = '') => type==='date'?Notenblick.dateField(id,label,value,attrs): `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${Notenblick.esc(value)}" ${attrs}${hint ? ` aria-describedby="${id}-hint"` : ''}>${hint ? `<small id="${id}-hint">${hint}</small>` : ''}</div>`;
Notenblick.date = s => s.split('-').reverse().join('.');
Notenblick.today = () => new Date().toLocaleDateString('sv-SE');
Notenblick.display = (q,c,pill=false) => q===null ? '–' : `<span class="grade${pill?' total':''}">${Notenblick.N.show(q,c)}</span>`;
Notenblick.resultValue=r=>Notenblick.N.hasEntry(r)?r.status==='graded'?Notenblick.esc(r.grade.replace('.',',')):Notenblick.N.STATUS[r.status]:'–';
Notenblick.rowName = s => Notenblick.esc(Notenblick.studentName(s));
Notenblick.errors=new Map();
Notenblick.error=function(message='',kind='input'){
  if(message)Notenblick.errors.set(kind,message);else Notenblick.errors.delete(kind);
  const text=[...Notenblick.errors.values()].join(' '),box=Notenblick.$('#error');
  if(box.dataset.message===text)return;box.dataset.message=text;box.hidden=!text;
  box.innerHTML=text?`<div>${[...Notenblick.errors.values()].map(x=>`<p>${Notenblick.esc(x)}</p>`).join('')}</div>${Notenblick.b('dismiss-errors','Meldung schließen','','text-button')}`:'';
};
Notenblick.announcementEpoch=0;
Notenblick.clearAnnouncement=function(){const A=Notenblick;A.announcementEpoch++;clearTimeout(A.announcementTimer);clearTimeout(A.announcementClearTimer);A.$('#announcement').textContent='';};
Notenblick.announce=function(text,{defer=false}={}){const A=Notenblick,el=A.$('#announcement'),same=el.textContent===text;A.clearAnnouncement();const epoch=A.announcementEpoch;const write=()=>{if(epoch!==A.announcementEpoch)return;el.textContent=text;A.announcementClearTimer=setTimeout(()=>{if(epoch===A.announcementEpoch)el.textContent='';},Math.max(15000,text.length*100));};if(same||defer)A.announcementTimer=setTimeout(write,100);else write();};
// Visible messages have no live semantics. The existing single status source
// announces each completed action, including a repeated deliberate action.
Notenblick.feedbacks={};
Notenblick.feedback=function(key,text,announce=true){const A=Notenblick;A.feedbacks[key]=text;const el=(A.ui.main==='backup'&&A.ui.backupView===key?A.$('#backup-message-'+key):null)||A.$('#actionFeedback');if(el){el.textContent=text;el.hidden=!text;}if(text&&announce)A.announce(text);};
Notenblick.paintFeedback=function(key){const el=Notenblick.$('#backup-message-'+key);if(el){el.textContent=Notenblick.feedbacks[key]||'';el.hidden=!el.textContent;}};
Notenblick.status=function(text,state=''){Notenblick.saveState=state||'saved';if(Notenblick.ui.main==='backup')Notenblick.updateSaveDetails?.();};
Notenblick.weightsText = c => Object.keys(Notenblick.N.overallLabels(c)).filter(k => Notenblick.N.Q.from(c.weights.overall[k]).n).map(k => Notenblick.N.overallLabels(c)[k] + ' ' + c.weights.overall[k].replace('.',',') + ' %').join(' · ');
Notenblick.val = id => Notenblick.$('#'+id).dataset.dateValue!==undefined?Notenblick.readDate(id):Notenblick.$('#'+id).value.trim();
Notenblick.readGrade=function(id){const A=Notenblick,el=A.$('#'+id);try{const grade=el.value.trim()?A.N.grade(el.value):null;el.removeAttribute('aria-invalid');return grade;}catch(e){el.setAttribute('aria-invalid','true');A.focusTarget(el);throw e;}};
Notenblick.required = (id, label) => {
  const v = Notenblick.val(id);
  if (!v) {
    Notenblick.$('#' + id).focus();
    throw Error('Bitte ' + label + ' eingeben.');
  }
  return v;
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
