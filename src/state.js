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
Notenblick.kinds = Object.keys(Notenblick.N.KINDS);
Notenblick.mainKeys = ['home','notes', 'admin', 'backup', 'settings', 'help'];
Notenblick.noteKeys = ['overview', 'assessments', ...Notenblick.kinds, 'pupil'];
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
