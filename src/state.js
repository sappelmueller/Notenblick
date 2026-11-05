/* Notenblick – state.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.N = window.NR;
Notenblick.version = globalThis.NRVersion;
Notenblick.S = window.NRStorage;
Notenblick.$ = s => document.querySelector(s);
Notenblick.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
Object.defineProperty(Notenblick,'kinds',{get:()=>Notenblick.getCourse&&Notenblick.data&&Notenblick.getCourse()?Notenblick.N.areaIds(Notenblick.getCourse()):Notenblick.N.newAreas().map(a=>a.id)});
Object.defineProperty(Notenblick,'kindLabels',{get:()=>Notenblick.N.areaLabels(Notenblick.getCourse?.())});
Notenblick.kindLabel=(id,c=Notenblick.getCourse())=>Notenblick.N.areaLabel(c,id);
Notenblick.mainKeys = ['home','notes', 'admin', 'backup', 'settings', 'help'];
Object.defineProperty(Notenblick,'noteKeys',{get:()=>['overview','assessments',...Notenblick.kinds,'pupil']});
Notenblick.extraKeys = ['homework', 'notebook'];
Notenblick.data = Notenblick.N.upgrade(Notenblick.N.blank());
Notenblick.store = null;
Notenblick.mode = 'working';
Notenblick.dirty = false;
Notenblick.seq = 0;
Notenblick.savedSeq = 0;
Notenblick.jsonSavedSeq=0;Notenblick.textPending=false;
Notenblick.saving = false;
Notenblick.sessionWrites = 0;
Notenblick.savingPromise = null;
Notenblick.forceText = false;
Notenblick.saveTimer = null;
Notenblick.undo = [];
Notenblick.opener = null;
Notenblick.submitDialog = null;
Notenblick.pending = new Set();
Notenblick.groups = {};
Notenblick.rendered = {};
Notenblick.scrolls = {};
Notenblick.ui = {
  main: 'notes',
  year: '',
  workingYear:'',historicalYear:'',selections:{},
  class: '',
  course: '',
  lastNotesCourse: '',
  adminYear: '',
  adminClass: '',
  adminView: 'years',
  adminSearch: '',
  showArchived: false,
  workspaces: {}
};
Notenblick.starting = true;
Notenblick.fatalStart = false;
})(globalThis.Notenblick = globalThis.Notenblick || {});
