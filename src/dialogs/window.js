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
  Notenblick.opener = {
    element: document.activeElement,
    key: Notenblick.origin(document.activeElement),
    course:Notenblick.ui.course,main:Notenblick.ui.main,windowX:window.scrollX,windowY:window.scrollY,
    details:[...document.querySelectorAll('#oralSettings[open]')].map(el=>el.id),
    wraps:[...document.querySelectorAll('.table-wrap')].filter(el=>el.id&&!el.closest('[hidden]')).map(el=>({id:el.id,x:el.scrollLeft,y:el.scrollTop}))
  };
  Notenblick.dialogCancellable=options.cancelWhileBusy===true;
  Notenblick.setDialogSize(options.size||'medium');
  Notenblick.$('#dialogNext').hidden=true;Notenblick.oralDraft=null;Notenblick.afterClose=null;
  Notenblick.$('#dialogTitle').textContent = title;
  Notenblick.$('#dialogContent').innerHTML = content;
  Notenblick.$('#dialogSave').textContent = label;
  Notenblick.$('#dialogSave').hidden = !fn;
  Notenblick.$('#dialog .dialog-actions [data-action=close]').textContent = fn ? 'Abbrechen' : 'Schließen';
  Notenblick.$('#dialogError').hidden = true;
  Notenblick.submitDialog = fn;
  Notenblick.$('#dialog').showModal();
  ([...Notenblick.$('#dialogContent').querySelectorAll('input:not([type=checkbox]):not([type=hidden]):not(:disabled),select:not(:disabled),textarea:not(:disabled)')].find(el=>!el.closest('[hidden]'))||Notenblick.$('#dialog .close')).focus();
};
Notenblick.closeModal = function closeModal() {
  if(!Notenblick.$('#dialog').open)return;
  const cancel=Notenblick.migrationCancel;Notenblick.migrationCancel=null;
  const previous = Notenblick.opener;
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
  if (target && !target.closest('[hidden]')) target.focus({preventScroll:true});else {
    const tab = document.querySelector('#' + (Notenblick.ui.main === 'notes' ? 'noteTabs' : Notenblick.ui.main === 'admin' && Notenblick.ui.adminClass ? 'adminTabs' : 'mainTabs') + ' [aria-selected=true]');
    (tab || document.querySelector('#mainTabs [aria-current=page]'))?.focus();
  }
  if(previous?.main===Notenblick.ui.main&&previous?.course===Notenblick.ui.course){for(const pos of previous.wraps||[]){const el=document.getElementById(pos.id);if(el){el.scrollLeft=pos.x;el.scrollTop=pos.y;}}window.scrollTo?.(previous.windowX,previous.windowY);}
  Notenblick.oralDraft=null;Notenblick.legacyPreview=null;if(cancel)cancel();
  const next=Notenblick.afterClose; Notenblick.afterClose=null; if(next)next();
};
Notenblick.submitModal=async function(next=false){
 if(Notenblick.dialogBusy||!Notenblick.submitDialog)return;
 Notenblick.dialogBusy=true;const fn=Notenblick.submitDialog;let result;
 Notenblick.$('#dialogSave').disabled=true;Notenblick.$('#dialogNext').disabled=true;Notenblick.$('#dialogError').hidden=true;
 try{result=await fn(next);if(Notenblick.submitDialog===fn&&Notenblick.$('#dialog').open&&!result?.keepOpen)Notenblick.closeModal();}
 catch(e){if(Notenblick.submitDialog!==fn||!Notenblick.$('#dialog').open)return;const el=Notenblick.$('#dialogError');el.textContent=e.message;el.hidden=false;}
 finally{if(Notenblick.submitDialog===fn||!Notenblick.$('#dialog').open){Notenblick.dialogBusy=false;Notenblick.$('#dialogSave').disabled=false;Notenblick.$('#dialogNext').disabled=false;Notenblick.updateOralNext?.();if(Notenblick.submitDialog===fn&&Notenblick.$('#dialog').open){if(result?.focus)document.getElementById(result.focus)?.focus();else if(!Notenblick.$('#dialog').contains(document.activeElement))Notenblick.$('#dialogSave').focus();}}}
};
Notenblick.confirm = function confirm(title, text, fn, label = 'Bestätigen') {
  Notenblick.modal(title, '<p>' + Notenblick.esc(text) + '</p>', fn, label,{size:'small'});
};
Notenblick.ensureClassEdit=function(cl){if(cl?.archived||Notenblick.data.years.find(y=>y.id===cl?.yearId)?.archived)throw Error('Bitte öffne das Schuljahr und die Klasse zuerst wieder.');};
Notenblick.ensureEdit = function ensureEdit(c = Notenblick.getCourse()) {
  const cl = Notenblick.data.classes.find(x => x.id === c?.classId),
    y = Notenblick.data.years.find(x => x.id === cl?.yearId);
  if (c?.archived || cl?.archived || y?.archived) throw Error('Bitte öffne das Schuljahr, die Klasse oder das Fach zuerst wieder in der Verwaltung.');
};
})(globalThis.Notenblick = globalThis.Notenblick || {});
