/* One command router, shared by DOM keys and the WebView2 Ctrl+Tab handoff. */
(function(A){'use strict';
const visible=el=>el?.isConnected&&!el.disabled&&!el.closest('[hidden],[inert],dialog:not([open])');
A.shortcutTabs=function(){
 const main={notes:'noteTabs',admin:'adminTabs',backup:'backupTabs',settings:'settingsTabs',help:'helpTabs'}[A.ui.main];
 if(!main)return null;
 if(A.ui.main==='notes'&&A.W().assessmentWorkOpen&&A.entrySession?.editing){const list=[...document.querySelectorAll('[role=tablist]')].find(el=>el.id.startsWith('entryTabs-')&&visible(el));if(list)return list;}
 return document.getElementById(main);
};
A.handleShortcut=function(e){
 if(e.defaultPrevented||e.isComposing||e.repeat||e.metaKey||e.getModifierState?.('AltGraph')||e.altKey&&e.ctrlKey)return false;
 const key=e.key.toLowerCase(),dialog=A.$('#dialog'),consume=()=>{e.preventDefault();e.stopPropagation?.();return true;};
 if(key==='f1'&&!e.ctrlKey&&!e.altKey&&!e.shiftKey){consume();A.openContextHelp();return true;}
 if(A.contextHelp){if(key==='escape'&&!e.ctrlKey&&!e.altKey){consume();A.closeContextHelp();return true;}if(A.contextHelp.dialog){if(e.ctrlKey||e.altKey)return consume();return false;}}
 // Dialog-specific input/Enter/final-grade commands keep their existing handlers.
 if(dialog.open)return false;
 if(e.altKey&&!e.shiftKey&&!e.ctrlKey){
  const main={s:'home',n:'notes',v:'admin',i:'backup',e:'settings',h:'help'}[key];
  if(main){consume();A.activateGroup('main',main,true,true);return true;}
  if(/^[0-9]$/.test(key)){
   consume();if(!A.canLeave())return true;
   if(key==='0'){A.action({dataset:{action:'home-all-courses'}}).catch(err=>A.error(err.message));return true;}
   const root=A.ui.main==='home'?A.$('#home'):A.ui.main==='notes'&&!A.$('#quickSelection').hidden?A.$('#quickSelection'):null;
   const links=root?[...root.querySelectorAll('[data-action=quick-course]')].filter(visible):[],link=links[Number(key)-1];
   if(link)link.click();else if(!root){const chosen=A.shortcutChoices(A.ui.workingYear).chosen[Number(key)-1];if(chosen&&A.chooseContext({courseId:chosen.id,historical:true,openNotes:true}))A.focusTarget('subjectTitle');}return true;
  }
 }
 if(!e.ctrlKey||e.altKey)return false;
 if((/^[1-9]$/.test(key)&&!e.shiftKey)||key==='tab'){
  consume();const list=A.shortcutTabs();if(!list)return true;
  const tabs=[...list.querySelectorAll('[role=tab]')].filter(visible);if(!tabs.length)return true;
  const at=tabs.findIndex(t=>t.getAttribute('aria-selected')==='true'),index=key==='tab'?(at+(e.shiftKey?-1:1)+tabs.length)%tabs.length:Number(key)-1,target=tabs[index];if(target)target.click();return true;
 }
 if(key==='s'&&!e.shiftKey){consume();if(A.canLeave()){if(A.store){A.remember();A.save();}else if(A.mode!=='none')A.backup().catch(err=>A.error(err.message,'storage'));}return true;}
 if(e.shiftKey&&['k','t','m'].includes(key)){
  consume();if(A.ui.main!=='notes'||!A.getCourse()||A.readonly()||!A.canLeave())return true;
  A.assessmentDialog(null,{k:'exam',t:'test',m:'oral'}[key],true);return true;
 }
 if(e.shiftKey)return false;
 if(key==='n'){
  consume();if(A.ui.main!=='notes'||!A.getCourse()||A.readonly()||!A.canLeave())return true;
  let toggle=[...document.querySelectorAll('[data-menu-key=add-performance]')].find(visible);
  if(!toggle){A.shortcutMenuOrigin=document.activeElement;const holder=document.createElement('div');holder.id='shortcutAddMenu';holder.className='shortcut-menu';holder.innerHTML=A.addPerformanceMenu();A.$('#noteTabs').before(holder);toggle=holder.querySelector('[data-menu-toggle]');}
  A.openMenu(toggle);return true;
 }
 if(key==='g'){
  consume();if(!A.getCourse()||!A.canLeave())return true;A.weightsDialog(A.getCourse());return true;
 }
 if(key==='e'){
  consume();if(!A.canLeave())return true;
  if(A.ui.main==='notes'&&A.getCourse()){
   const record=A.W().assessmentWorkOpen&&A.data.assessments.find(a=>a.id===A.W().assessmentId);
   if(record)A.output(record.kind,A.singleAssessmentContext(record));else A.output(A.W().view==='assessments'?'all':A.W().view);
  }else{A.activateGroup('main','backup',true,true);A.activateGroup('backup','export',true,true);}return true;
 }
 if(key==='escape')return false;
 return false;
};
// Capture only commands; native editing, tab activation and rapid entry stay local.
document.addEventListener('keydown',e=>{try{
 if(A.handleShortcut(e))return;
 if(e.key==='Escape'&&!e.defaultPrevented&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!A.$('#dialog').open){
  if(document.querySelector('[role=menu]:not([hidden])'))return;
  if(e.target.closest('details[open]')||['allSelection','viewDetails','adminViewDetails'].some(id=>{const el=document.getElementById(id);return el?.open&&visible(el);}))return;
  if(A.ui.main==='help'&&A.helpOrigin){e.preventDefault();A.activateGroup('main',A.helpOrigin,true,false);return;}
  if(A.ui.main==='notes'&&A.W().assessmentWorkOpen){e.preventDefault();if(!A.canLeave())return;if(A.entrySession?.settings)A.closePointSettings();else A.returnToAssessmentList();}
 }
 }catch(err){A.error(err.message);}
},true);
})(globalThis.Notenblick);
