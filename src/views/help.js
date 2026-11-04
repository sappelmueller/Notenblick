/* Authoritative offline help; one source for the full help and short F1 excerpts. */
(function(A){'use strict';
const text=globalThis.NRHelp,contexts=globalThis.NRHelpContexts.contexts;
A.helpSection=function(index){const route=typeof index==='string'?{section_id:index}:contexts[index];if(!route)throw Error('Unbekannter Hilfekontext.');for(const topic of text.topics){const section=topic.sections.find(s=>s.id===route.section_id);if(section)return{topic,section,route};}throw Error('Hilfestelle fehlt.');};
A.helpParagraphs=s=>s.paragraphs.map(p=>'<p>'+A.esc(p)+'</p>').join('');
A.renderHelp=function(){
 const root=A.$('#help');if(!root.querySelector('#helpTabs')){
  root.innerHTML='<div class="page-heading"><h1>Hilfe</h1></div><p class="help-intro">'+A.esc(text.intro)+'</p><ul id="helpTabs" class="tabs area-tabs help-tabs">'+text.topics.map(t=>`<li><a id="help-tab-${t.id}" href="#help-panel-${t.id}" data-key="${t.id}">${A.esc(t.title)}</a></li>`).join('')+'</ul>'+text.topics.map(t=>`<div class="help-topic" id="help-panel-${t.id}" hidden><h2>${A.esc(t.title)}</h2>${t.sections.map(s=>`<div class="help-passage"><h3 id="${s.id}">${A.esc(s.heading)}</h3>${A.helpParagraphs(s)}</div>`).join('')}</div>`).join('');
  A.groups.help=A.bind('helpTabs',text.topics.map(t=>t.id),(key,update)=>{A.ui.helpView=key;if(update)A.remember();},()=>true);
 }
 const key=text.topics.some(t=>t.id===A.ui.helpView)?A.ui.helpView:text.topics[0].id;
 A.groups.help.activate(A.$('#help-tab-'+key),false,false);
};
// Deliberate selectors/structural state, never fuzzy searches through user labels.
A.helpContext=function(el=document.activeElement){
 const within=s=>!!el?.closest?.(s),dialog=A.$('#dialog'),has=s=>!!dialog.querySelector(s);
 if(A.contextHelp)return A.contextHelp.index;
 if(dialog.open){
  if(A.setupDraft)return 0;
  if(within('#halfYearReport,#confirmHalfYearChange,#halfYearWarning')&&has('#className'))return 'berechnung-halbjahresinformation-und-zeugnisse';
  if(within('.participation-options'))return 13;
  if(within('#a-weight,#a-gfs,#q-weight,#q-gfs'))return 14;
  if(within('#oralKeySettings,#oralKeyEdit,#oralKeyApply,#oralKeyCancel'))return 23;
  if(within('#q-points'))return 26;
  if(within('[data-date-part]'))return 'noten-ein-datum-eingeben';
  if(within('#q-change,#q-manualField'))return 25;
  if(has('#keyCheck'))return 24;
  if(has('#manualPointGrade'))return 25;
  if(has('#exportFormat')){
   if(within('#exportFormat'))return 33;
   if(within('#exportScope,#exportEntries'))return 34;
   if(within('#exportRemarks,#exportPoints'))return 35;
   if(within('#exportOutput,#exportPupil,#exportExited,#exportGrouping'))return 32;
   return 31;
  }
  if(has('#weightEditor')){
   if(within('#sourceWeights,#weightCopyPanel,[data-action=copy-weights]'))return 28;
   if(within('#rounding,#precision'))return 29;
   return 27;
  }
  if(has('#finalStatus,#final-grade,#final-note,#halfYearReport')&&!has('#className'))return 30;
  if(within('#q-keyShow,#q-keyPdf,#oralReadKey'))return 24;
  if(within('#oralEditButton')||has('#oralStudent')&&within('#dialogSave,[data-action=close]'))return 17;
  if(within('[data-action=oral-record-export]'))return 31;
  if(within('#q-reset'))return 25;
  if(has('#a-title'))return 12;
  if(has('#oralStudent'))return 19;
  if(has('#sourceClass'))return 5;
  if(has('#yearLabel'))return 5;
  if(has('#className'))return 4;
  if(has('#subjectName,#sourceCourse'))return 6;
  if(has('#bulkNames,#bulkClass'))return 8;
  if(has('#targetClass'))return 9;
  if(has('#first,#last'))return 7;
  if(has('[name=courseMember]'))return 9;
  if(has('#restorePoint'))return 42;
  if(has('#restoreImpact'))return 41;
  if(has('#cleanupImpact'))return 40;
  if(has('#shortcutChoices'))return 46;
  if(A.dialogHelpContext!=null)return A.dialogHelpContext;
  // A dialog without a declared context must never inherit controls behind it.
  return 1;
 }
 if(A.ui.main==='help')return 48;
 const action=el?.closest?.('[data-action]')?.dataset.action,menu=el?.closest?.('[data-menu-key]')?.dataset.menuKey;
 if(action?.startsWith('update-')||within('#updateAuto,#updateHide'))return 43;
 if(menu==='add-performance'||['new-assessment','quick-oral'].includes(action))return 12;
 if(menu==='finals'||['final-dialog','finals-class'].includes(action))return 30;
 if(['weights','settings-course-weights'].includes(action)||within('.weight-action'))return 27;
 if(['output','assessment-export','oral-record-export','selected-export'].includes(action))return 31;
 if(['assessment-edit','assessment-done','assessment-list','open-assessment'].includes(action))return 17;
 if(action==='delete-assessment')return 'noten-eine-leistung-nachtraglich-andern-oder-loschen';
 if(action==='all-notes')return 'export-alle-noten-exportieren';
 if(['exit-student','unexit-student'].includes(action))return 10;
 if(action==='choose-shortcuts')return 46;

 if(within('#class,#course,#quickSelection,#allSelection'))return 2;
 if(within('#allNotesFormat'))return 33;
 if(within('[data-action=regenerate]'))return 38;
 if(within('[data-action=cleanup]'))return 40;
 if(within('#setting-classOrder'))return 45;
 if(within('#shortcutSetting'))return 46;
 if(within('#pointConfiguration,[data-action=point-settings]'))return 23;
 if(within('[data-entry=points]'))return 26;
 if(within('[data-action=point-manual]'))return 25;
 if(within('[data-action=point-key]'))return 24;
 if(A.ui.main==='home')return A.firstRun&&!A.data.years.length?0:1;
 if(A.ui.main==='admin')return {years:3,classes:4,students:7,subjects:6}[A.ui.adminView]??3;
 if(A.ui.main==='backup')return {status:37,create:39,restore:41,export:36}[A.ui.backupView]??37;
 if(A.ui.main==='settings')return {general:43,display:44,calculation:47}[A.ui.settingsView]??43;
 if(A.ui.main==='notes'){
  if(A.W().assessmentWorkOpen){if(A.entrySession?.editing)return A.W().entryMode==='single'?16:15;return 17;}
  if(A.W().view==='pupil')return 22;
  const kind=A.kinds.includes(A.W().view)?A.W().view:A.W().assessmentFilter;
  if(kind==='oral')return A.W().oralView==='individual'?20:18;
  return A.W().view==='overview'?11:21;
 }
 return 1;
};
A.openContextHelp=function(index=A.helpContext()){
 if(A.contextHelp||A.ui.main==='help'&&!A.$('#dialog').open)return;
 const {topic,section}=A.helpSection(index),focus=document.activeElement,dialog=A.$('#dialog'),menuToggle=focus?.closest('[role=menu]')?.parentElement.querySelector('[data-menu-toggle]');
 A.closeMenu?.(false,true);
 if(dialog.open){
  if(A.dialogBusy)return;
  const form=A.$('#dialogForm'),nodes=[...form.children].map(el=>({el,hidden:el.hidden,inert:el.inert})),label=dialog.getAttribute('aria-labelledby'),description=dialog.getAttribute('aria-describedby'),scroll=dialog.scrollTop;
  const pane=document.createElement('div');pane.id='contextHelp';pane.className='help-context';pane.innerHTML=`<h2 id="contextHelpTitle" tabindex="-1">${A.esc(section.heading)}</h2>${A.helpParagraphs(section)}<button type="button" class="button" data-action="help-close">Zurück</button>`;
  // Keep all controls and listeners connected. Hiding does not blur/reparse/save them.
  A.contextHelp={index,focus,dialog:true,pane,nodes,label,description,scroll};
  for(const {el}of nodes){el.hidden=true;el.inert=true;}form.append(pane);dialog.setAttribute('aria-labelledby','contextHelpTitle');dialog.removeAttribute('aria-describedby');A.focusTarget('contextHelpTitle');
 }else{
  const state={index,focus,menuToggle,dialog:false,main:A.ui.main,helpView:A.ui.helpView,scrollX:window.scrollX,scrollY:window.scrollY};
  A.activateGroup('main','help',false,false);A.groups.help.activate(A.$('#help-tab-'+topic.id),false,false);A.focusTarget(section.id);
  const back=document.createElement('button');back.type='button';back.className='button help-return';back.dataset.action='help-close';back.textContent='Zurück';A.$('#helpTabs').before(back);A.contextHelp={...state,pane:back};
 }
};
A.closeContextHelp=function(){
 const state=A.contextHelp;if(!state)return false;A.contextHelp=null;state.pane.remove();
 if(state.dialog){for(const {el,hidden,inert}of state.nodes){el.hidden=hidden;el.inert=inert;}const d=A.$('#dialog');d.setAttribute('aria-labelledby',state.label);if(state.description)d.setAttribute('aria-describedby',state.description);else d.removeAttribute('aria-describedby');d.scrollTop=state.scroll;}
 else{A.ui.helpView=state.helpView;A.activateGroup('main',state.main,false,false);window.scrollTo?.(state.scrollX,state.scrollY);}
 if(state.menuToggle?.isConnected)A.openMenu(state.menuToggle,false,false);
 if(!A.focusTarget(state.focus,{preventScroll:true}))A.focusTarget(state.dialog?'dialogTitle':A.$('#mainTabs [aria-current=page]'));
 return true;
};
A.help=()=>A.activateGroup('main','help',true,true);
})(globalThis.Notenblick);
