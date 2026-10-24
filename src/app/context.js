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
  columns: ['exam', 'test', 'written', 'oral'],
  showExited: false,
  selected: {},
  entryMode: 'table',
  studentIndex: 0,
  assessmentFilter: 'all',
  assessmentId: '',
  assessmentSearch: '',
  entrySearch: '',
  matrixPages: {},
  assessmentWorkOpen: false,
  oralView:'classes',oralSearch:'',oralStudent:'all',oralSort:'date',oralPage:0,oralFocusId:'',
  pupil: ''
});
const calculations = new WeakMap();
Notenblick.calculation = function(c, sid) {
  let cache = calculations.get(Notenblick.data);
  if (!cache) {cache = new Map(); calculations.set(Notenblick.data, cache);}
  const key = c.id + ':' + sid;
  if (!cache.has(key)) cache.set(key, Notenblick.N.calculate(Notenblick.data, c, sid));
  return cache.get(key);
};
const assessmentStats = new WeakMap();
Notenblick.assessmentStats = function(a,c=Notenblick.getCourse()) {
 let cache=assessmentStats.get(Notenblick.data);if(!cache){cache=new Map();assessmentStats.set(Notenblick.data,cache);}
 if(!cache.has(a.id)){
  cache.set(a.id,Notenblick.N.assessmentProgress(Notenblick.data,c,a));
 }
 return cache.get(a.id);
};
Notenblick.W = function W() {
  if (!Notenblick.ui.workspaces[Notenblick.ui.course]) Notenblick.ui.workspaces[Notenblick.ui.course] = Notenblick.defaults();
  return Notenblick.attachSort(Notenblick.ui.workspaces[Notenblick.ui.course]);
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
Notenblick.announce=function(text){Notenblick.$('#announcement').textContent=text;};
Notenblick.status=function(text,state=''){Notenblick.saveState=state||'saved';if(Notenblick.ui.main==='backup')Notenblick.updateSaveDetails?.();};
Notenblick.weightsText = c => Object.keys(Notenblick.N.overallLabels(c)).filter(k => Notenblick.N.Q.from(c.weights.overall[k]).n).map(k => Notenblick.N.overallLabels(c)[k] + ' ' + c.weights.overall[k] + ' %').join(' · ');
Notenblick.val = id => Notenblick.$('#'+id).dataset.dateValue!==undefined?Notenblick.readDate(id):Notenblick.$('#'+id).value.trim();
Notenblick.required = (id, label) => {
  const v = Notenblick.val(id);
  if (!v) {
    Notenblick.$('#' + id).focus();
    throw Error('Bitte ' + label + ' eingeben.');
  }
  return v;
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
