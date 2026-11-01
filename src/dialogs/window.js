/* Notenblick – dialogs/window.js. Shared application API: Notenblick. */
(function (Notenblick) {
'use strict';
Notenblick.origin = function origin(el) {
  if (!el) return null;
  return {
    id: el.id,
    action: el.dataset?.action,
    item: el.dataset?.id,
    kind: el.dataset?.kind,
    menuKey:el.dataset?.menuKey,
    tableId:el.closest('table')?.id,rowIndex:el.closest('tbody tr')?.sectionRowIndex
  };
};
Notenblick.setDialogSize=size=>{Notenblick.$('#dialog').dataset.size=['small','medium','wide'].includes(size)?size:'medium';};
Notenblick.modal = function modal(title, content, fn, label = 'Speichern', options = {}) {
  if(Notenblick.contextHelp)Notenblick.closeContextHelp();
  Notenblick.dialogHelpContext=options.helpContext??null;
  if(!options.reuse)Notenblick.opener = {
    element: document.activeElement,
    key: Notenblick.origin(document.activeElement),
    course:Notenblick.ui.course,main:Notenblick.ui.main,windowX:window.scrollX,windowY:window.scrollY,
    details:[...document.querySelectorAll('#oralSettings[open]')].map(el=>el.id),
    wraps:[...document.querySelectorAll('.table-wrap')].filter(el=>el.id&&!el.closest('[hidden]')).map(el=>({id:el.id,x:el.scrollLeft,y:el.scrollTop}))
  };
  if(options.describedBy)Notenblick.$('#dialog').setAttribute('aria-describedby',options.describedBy);else Notenblick.$('#dialog').removeAttribute('aria-describedby');
  Notenblick.dialogOnClose=options.onClose||null;
  Notenblick.dialogBeforeClose=options.beforeClose||null;
  Notenblick.dialogCancellable=options.cancelWhileBusy===true;
  Notenblick.setDialogSize(options.size||'medium');Notenblick.$('#dialog').dataset.context=Notenblick.ui.main;
  Notenblick.$('#setupFooterSlot').hidden=true;Notenblick.$('#setupFooterSlot').innerHTML='';Notenblick.$('#dialog .dialog-actions [data-action=close]').classList.remove('text-button');
  Notenblick.$('#dialogNext').hidden=true;Notenblick.oralDraft=null;Notenblick.afterClose=null;
  Notenblick.$('#dialogTitle').textContent = title;
  Notenblick.$('#dialogContent').innerHTML = content;
  Notenblick.$('#dialogSave').textContent = label;
  Notenblick.$('#dialogSave').hidden = !fn;
  Notenblick.$('#dialog .dialog-actions [data-action=close]').textContent = fn ? 'Abbrechen' : 'Schließen';
  Notenblick.$('#dialogError').hidden = true;
  Notenblick.submitDialog = fn;
  Notenblick.clearAnnouncement();
  const dialog=Notenblick.$('#dialog'),heading=Notenblick.$('#dialogTitle');heading.tabIndex=-1;
  const initial=options.focus?document.getElementById(options.focus):heading;
  const target=initial&&!initial.disabled&&!initial.closest('[hidden]')&&(dialog.contains(initial))?initial:heading;
  const autofocus=!target.hasAttribute('autofocus');if(autofocus)target.setAttribute('autofocus','');
  if(options.reuse){Notenblick.dialogBusy=false;Notenblick.$('#dialogSave').disabled=false;Notenblick.$('#dialogNext').disabled=false;}
  if(!options.reuse||!dialog.open)dialog.showModal();
  Notenblick.focusTarget(target);if(autofocus)target.removeAttribute('autofocus');
};
Notenblick.closeModal = function closeModal(options={}) {
  if(Notenblick.closeContextHelp?.())return;
  if(!Notenblick.$('#dialog').open)return;
  if(Notenblick.dialogReturn){const back=Notenblick.dialogReturn;Notenblick.dialogReturn=null;back();return;}
  if(!options.submitted&&Notenblick.dialogBeforeClose?.()===false)return;
  Notenblick.dialogBeforeClose=null;
  const cancel=Notenblick.migrationCancel;Notenblick.migrationCancel=null;
  const onClose=Notenblick.dialogOnClose;Notenblick.dialogOnClose=null;
  const previous = Notenblick.opener;
  Notenblick.clearAnnouncement();Notenblick.restorePointAnnouncement?.();
  Notenblick.$('#dialog').close();
  Notenblick.submitDialog = null;
  Notenblick.dialogBusy=false;Notenblick.$('#dialogSave').disabled=false;Notenblick.$('#dialogNext').disabled=false;
  let target = previous?.element;
  if (!target?.isConnected) {
    const k = previous?.key;
    target = k?.menuKey?[...document.querySelectorAll('[data-menu-key]')].find(e=>e.dataset.menuKey===k.menuKey):k?.id?document.getElementById(k.id):null;
    if(!target&&k?.tableId){const rows=document.getElementById(k.tableId)?.tBodies?.[0]?.rows;const row=rows?.[Math.min(k.rowIndex,rows.length-1)];target=row?.querySelector('button,a,input,select');}
    if (!target && k?.action) {
      target = [...document.querySelectorAll(`[data-action="${k.action}"]`)].find(el => (!k.item || el.dataset.id === k.item) && (!k.kind || el.dataset.kind === k.kind) && !el.closest('[hidden]'));
    }
  }
  if(previous?.main===Notenblick.ui.main&&previous?.course===Notenblick.ui.course)for(const id of previous.details||[]){const el=document.getElementById(id);if(el)el.open=true;}
  if (!Notenblick.focusTarget(target,{preventScroll:true})) {
    const tab = document.querySelector('#' + (Notenblick.ui.main === 'notes' ? 'noteTabs' : Notenblick.ui.main === 'admin' && Notenblick.ui.adminClass ? 'adminTabs' : 'mainTabs') + ' [aria-selected=true]');
    Notenblick.focusTarget(tab || document.querySelector('#mainTabs [aria-current=page]'),{preventScroll:true});
  }
  if(previous?.main===Notenblick.ui.main&&previous?.course===Notenblick.ui.course){for(const pos of previous.wraps||[]){const el=document.getElementById(pos.id);if(el){el.scrollLeft=pos.x;el.scrollTop=pos.y;}}window.scrollTo?.(previous.windowX,previous.windowY);}
  Notenblick.oralDraft=null;Notenblick.legacyPreview=null;if(cancel)cancel();
  if(onClose)onClose();
  const next=Notenblick.afterClose; Notenblick.afterClose=null; if(next)next();
};
Notenblick.submitModal=async function(next=false){
 if(Notenblick.contextHelp||Notenblick.dialogBusy||!Notenblick.submitDialog)return;
 Notenblick.dialogBusy=true;const fn=Notenblick.submitDialog;let result;
 Notenblick.$('#dialogSave').disabled=true;Notenblick.$('#dialogNext').disabled=true;Notenblick.$('#dialogError').hidden=true;
 try{result=await fn(next);if(Notenblick.submitDialog===fn&&Notenblick.$('#dialog').open&&!result?.keepOpen)Notenblick.closeModal({submitted:true});}
 catch(e){if(Notenblick.submitDialog!==fn||!Notenblick.$('#dialog').open)return;const el=Notenblick.$('#dialogError');el.textContent=e.message;el.hidden=false;if(document.activeElement===Notenblick.$('#dialogTitle'))result={keepOpen:true,focus:'dialogSave'};}
 finally{if(Notenblick.submitDialog===fn||!Notenblick.$('#dialog').open){Notenblick.dialogBusy=false;Notenblick.$('#dialogSave').disabled=false;Notenblick.$('#dialogNext').disabled=false;Notenblick.updateOralNext?.();if(Notenblick.submitDialog===fn&&Notenblick.$('#dialog').open){if(result?.focus)document.getElementById(result.focus)?.focus();else if(!Notenblick.$('#dialog').contains(document.activeElement))Notenblick.$('#dialogSave').focus();}}}
};
Notenblick.confirm = function confirm(title, text, fn, label = 'Bestätigen', options = {}) {
  Notenblick.modal(title, '<p>' + Notenblick.esc(text) + '</p>', fn, label,{size:'small',...options});
};
// Suspend the current form in the shared dialog, preserving nodes/listeners,
// invalid input, selection and focus. Cancel/Escape restores without closing it.
Notenblick.confirmInDialog=function(title,text,fn,label='Bestätigen',cancelLabel='Abbrechen',helpContext=null){
 const A=Notenblick;if(A.dialogReturn)return;
 const content=A.$('#dialogContent'),save=A.$('#dialogSave'),cancel=A.$('#dialog .dialog-actions [data-action=close]'),next=A.$('#dialogNext'),error=A.$('#dialogError'),focus=document.activeElement;
 // Commit the focused control's native change while all form fields are still
 // connected. Detaching it first can dispatch change during partial removal.
 const previousTitle=A.$('#dialogTitle').textContent;A.$('#dialogTitle').textContent=title;A.focusTarget('dialogTitle',{preventScroll:true});
 const state={helpContext:A.dialogHelpContext,title:previousTitle,size:A.$('#dialog').dataset.size,submit:A.submitDialog,onClose:A.dialogOnClose,beforeClose:A.dialogBeforeClose,afterClose:A.afterClose,opener:A.opener,cancellable:A.dialogCancellable,save:save.textContent,hidden:save.hidden,cancel:cancel.textContent,nextHidden:next.hidden,error:error.textContent,errorHidden:error.hidden,footerHidden:A.$('#setupFooterSlot').hidden,scroll:content.scrollTop,dialogScroll:A.$('#dialog').scrollTop};
 const nodes=document.createDocumentFragment();while(content.firstChild)nodes.append(content.firstChild);
 const restore=()=>{
  A.dialogHelpContext=state.helpContext;A.dialogReturn=null;A.$('#dialogTitle').textContent=state.title;A.setDialogSize(state.size);content.replaceChildren(nodes);content.scrollTop=state.scroll;A.$('#dialog').scrollTop=state.dialogScroll;
  A.$('#setupFooterSlot').hidden=state.footerHidden;A.submitDialog=state.submit;A.dialogOnClose=state.onClose;A.dialogBeforeClose=state.beforeClose;A.afterClose=state.afterClose;A.opener=state.opener;A.dialogCancellable=state.cancellable;A.dialogBusy=false;
  save.textContent=state.save;save.hidden=state.hidden;save.disabled=false;cancel.textContent=state.cancel;next.hidden=state.nextHidden;next.disabled=false;error.textContent=state.error;error.hidden=state.errorHidden;
  (focus?.isConnected?focus:save).focus({preventScroll:true});
 };
 A.dialogHelpContext=helpContext??A.dialogHelpContext;A.dialogReturn=restore;A.dialogBeforeClose=null;A.dialogOnClose=null;A.afterClose=null;A.setDialogSize('small');A.$('#dialogTitle').textContent=title;
 A.$('#setupFooterSlot').hidden=true;content.innerHTML='<p>'+A.esc(text)+'</p>';A.$('#dialog').scrollTop=0;error.hidden=true;save.textContent=label;save.hidden=false;cancel.textContent=cancelLabel;next.hidden=true;
 A.submitDialog=async()=>{restore();try{await fn();}catch(e){error.textContent=e.message;error.hidden=false;}return{keepOpen:true};};
};
Notenblick.ensureClassEdit=function(cl){if(cl?.archived||Notenblick.data.years.find(y=>y.id===cl?.yearId)?.archived)throw Error('Bitte öffne das Schuljahr und die Klasse zuerst wieder.');};
Notenblick.ensureEdit = function ensureEdit(c = Notenblick.getCourse()) {
  const cl = Notenblick.data.classes.find(x => x.id === c?.classId),
    y = Notenblick.data.years.find(x => x.id === cl?.yearId);
  if (c?.archived || cl?.archived || y?.archived) throw Error('Bitte öffne das Schuljahr, die Klasse oder das Fach zuerst wieder in der Verwaltung.');
};
// Temporarily use the existing dialog and the one existing live status source.
// Original form nodes survive errors, so retry never loses the user's selection.
Notenblick.runOperation=async function(title,work,{cancellable=false}={}){
 const A=Notenblick,dialog=A.$('#dialog'),content=A.$('#dialogContent'),fn=A.submitDialog,heading=A.$('#dialogTitle'),save=A.$('#dialogSave'),live=A.$('#announcement');
 const nodes=document.createDocumentFragment(),saved={title:heading.textContent,cancellable:A.dialogCancellable,saveHidden:save.hidden,description:dialog.getAttribute('aria-describedby'),scroll:dialog.scrollTop,liveParent:live.parentNode,liveNext:live.nextSibling};
 const close=[...dialog.querySelectorAll('[data-action=close]')].map(el=>[el,el.disabled]);
 while(content.firstChild)nodes.append(content.firstChild);
 heading.textContent=title;heading.tabIndex=-1;save.hidden=true;A.dialogCancellable=cancellable;for(const[el]of close)el.disabled=!cancellable;
 content.innerHTML='<div class="operation-progress"><p id="operationStep"></p><progress id="operationProgress" aria-label="Fortschritt"></progress></div>';content.append(live);dialog.setAttribute('aria-describedby','operationStep');dialog.scrollTop=0;heading.focus();
 let last=0,previous='';const update=(text,done,total)=>{
  if(!dialog.open||A.submitDialog!==fn)return;
  A.$('#operationStep').textContent=text;const bar=A.$('#operationProgress');
  if(Number.isSafeInteger(total)&&total>0&&Number.isSafeInteger(done)){bar.max=total;bar.value=done;}else bar.removeAttribute('value');
  if(text!==previous&&(Date.now()-last>=2500||!last||done===total)){A.announce(text);last=Date.now();previous=text;}
 };
 // Once the native save handoff begins, only its save dialog can cancel it.
 // Keep the originating form alive until the native final reply arrives.
 const lock=()=>{A.dialogCancellable=false;for(const[el]of close)el.disabled=true;};
 try{return await work(update,()=>dialog.open&&A.submitDialog===fn,lock);}
 finally{
  live.textContent='';saved.liveParent.insertBefore(live,saved.liveNext?.parentNode===saved.liveParent?saved.liveNext:null);
  if(dialog.open&&A.submitDialog===fn){content.replaceChildren(nodes);if(saved.description)dialog.setAttribute('aria-describedby',saved.description);else dialog.removeAttribute('aria-describedby');heading.textContent=saved.title;save.hidden=saved.saveHidden;A.dialogCancellable=saved.cancellable;for(const[el,disabled]of close)el.disabled=disabled;dialog.scrollTop=saved.scroll;save.focus();}
 }
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
