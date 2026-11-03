/* One command router, shared by DOM keys and the WebView2 Ctrl+Tab handoff. */
(function(A){'use strict';
const visible=el=>el?.isConnected&&!el.disabled&&!el.closest('[hidden],[inert],dialog:not([open])');
A.shortcutTabs=function(){
 const main={notes:'noteTabs',admin:'adminTabs',backup:'backupTabs',settings:'settingsTabs',help:'helpTabs'}[A.ui.main];
 return main?document.getElementById(main):null;
};
A.labelCourseHeading=function(){
 const h=A.$('#subjectTitle'),tab=A.$('#noteTabs [aria-selected=true]');
 // One focus announcement, including the active area; the visible H1 stays intact.
 const label=h.textContent+(tab?', '+tab.textContent:'');
 if(h.getAttribute('aria-label')!==label)h.setAttribute('aria-label',label);
};
A.focusCourseHeading=function({announceIfFocused=true}={}){A.labelCourseHeading();A.focusTarget(A.$('#subjectTitle'),{announceIfFocused});};
A.activateShortcutTab=function(list,target){
 if(!target){A.announce('Keine Registerkarte vorhanden.',{defer:true});return;}
 const group=list.id.startsWith('entryTabs-')?'entry-'+list.id.slice(10):{noteTabs:'notes',adminTabs:'class',settingsTabs:'settings',backupTabs:'backup',helpTabs:'help'}[list.id];
 const done=ok=>{if(!ok)return;const panel=document.getElementById(target.getAttribute('aria-controls')),heading=[...panel.querySelectorAll('h2,h3,h4')].find(visible);A.focusTarget(heading,{announceIfFocused:true});};
 if(target.getAttribute('aria-selected')==='true'){if(A.canLeave())done(true);return;}
 const result=A.groups[group].activate(target,false,true);if(result?.then)result.then(done);else done(result);
};
A.handleShortcut=function(e){
 if(e.defaultPrevented||e.isComposing||e.repeat||e.metaKey||e.getModifierState?.('AltGraph')||e.altKey&&e.ctrlKey)return false;
 const key=e.key.toLowerCase(),digit=/^Digit[0-9]$/.test(e.code||'')?e.code.slice(5):/^[0-9]$/.test(key)?key:null,dialog=A.$('#dialog'),consume=()=>{e.preventDefault();e.stopPropagation?.();return true;};
 if(key==='f1'&&!e.ctrlKey&&!e.altKey&&!e.shiftKey){consume();A.openContextHelp();return true;}
 if(A.contextHelp){if(key==='escape'&&!e.ctrlKey&&!e.altKey){consume();A.closeContextHelp();return true;}if(A.contextHelp.dialog){if(e.ctrlKey||e.altKey)return consume();return false;}}
 // Dialog-specific input/Enter/final-grade commands keep their existing handlers.
 if(dialog.open)return false;
 if(e.altKey&&!e.shiftKey&&!e.ctrlKey){
  const main={s:'home',n:'notes',v:'admin',i:'backup',e:'settings',h:'help'}[key];
  if(main){consume();
   if(main==='notes'&&A.getCourse()){const repeated=A.ui.main==='notes';if(A.chooseContext({courseId:A.ui.course,historical:true,openNotes:true,shortcut:true}))A.focusCourseHeading({announceIfFocused:repeated});}
   else if(A.activateGroup('main',main,false,true))A.focusTarget(A.$('#'+main+' h1'),{announceIfFocused:true});
   return true;
  }
  if(digit!==null){
   consume();
   if(digit==='0'){
    if(!A.canLeave())return true;const wasNotes=A.ui.main==='notes';
    if(!wasNotes&&!A.activateGroup('main','notes',false,true))return true;
    const all=A.$('#allSelection');
    if(A.$('#allSelectionSummary').hidden){all.open=true;A.focusTarget('class');}
    else{all.open=!wasNotes||!all.open;A.focusTarget('allSelectionSummary');}return true;
   }
   const year=A.ui.main==='notes'?A.ui.year:A.ui.workingYear,chosen=A.shortcutChoices(year).chosen[Number(digit)-1];
   if(!chosen){A.announce('Kein Fach zugeordnet.',{defer:true});return true;}
   const repeated=A.ui.main==='notes';if(A.chooseContext({courseId:chosen.id,historical:true,openNotes:true,shortcut:true}))A.focusCourseHeading({announceIfFocused:repeated});return true;
  }
 }
 if(!e.ctrlKey||e.altKey)return false;
 if(e.shiftKey&&['1','2'].includes(digit)){
  if(A.ui.main!=='notes'||!A.W().assessmentWorkOpen||!A.entrySession?.editing)return false;
  consume();const list=[...document.querySelectorAll('[id^=entryTabs-]')].find(visible);
  if(list)A.activateShortcutTab(list,list.querySelector('[data-key="'+(digit==='1'?'table':'single')+'"]'));return true;
 }
 if((digit&&digit!=='0'&&!e.shiftKey)||key==='tab'){
  consume();const list=A.shortcutTabs(),tabs=list?[...list.querySelectorAll('[role=tab]')].filter(visible):[];
  if(key==='tab'&&!tabs.length)return true;
  const at=tabs.findIndex(t=>t.getAttribute('aria-selected')==='true'),index=key==='tab'?(at+(e.shiftKey?-1:1)+tabs.length)%tabs.length:Number(digit)-1;
  A.activateShortcutTab(list,tabs[index]);return true;
 }
 if(e.shiftKey&&key==='a'){
  consume();if(A.ui.main!=='notes'||!A.getCourse()||!A.canLeave())return true;
  let toggle=[...document.querySelectorAll('[data-menu-key=finals]')].find(visible);
  if(!toggle){A.closeMenu(false);A.cleanupShortcutMenu(false);A.shortcutMenuOrigin=document.activeElement;const holder=document.createElement('div');holder.id='shortcutAddMenu';holder.className='shortcut-menu';holder.innerHTML=A.finalMenu();A.$('#noteTabs').before(holder);toggle=holder.querySelector('[data-menu-toggle]');}
  A.openMenu(toggle);return true;
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
  if(!toggle){A.closeMenu(false);A.cleanupShortcutMenu(false);A.shortcutMenuOrigin=document.activeElement;const holder=document.createElement('div');holder.id='shortcutAddMenu';holder.className='shortcut-menu';holder.innerHTML=A.addPerformanceMenu();A.$('#noteTabs').before(holder);toggle=holder.querySelector('[data-menu-toggle]');}
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
  }else{A.activateGroup('main','backup',false,true);A.activateGroup('backup','export',true,true);}return true;
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
