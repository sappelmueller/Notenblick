/* Optional portable data protection and the protected start screen. */
(function(A){'use strict';
const stepHelp='sicherung-passwortschutz-einrichten',useHelp='sicherung-passwortschutz-verwenden';
const call=(op,args)=>window.NRDesktop.call(op,args);
const button=(id,label,kind='button',attrs='')=>'<button type="button" id="'+id+'" class="'+kind+'" '+attrs+'>'+label+'</button>';
const notice='Bewahre deinen Notfallschlüssel getrennt von deinen Noten auf. Er kann deine Noten auch ohne Passwort öffnen.';
const keyField=(id,label='Notfallschlüssel')=>A.field(id,label,'','autocomplete="off" autocapitalize="none" spellcheck="false"','password');
const passField=(id,label='Passwort')=>A.field(id,label,'','autocomplete="off" autocapitalize="none" spellcheck="false"','password');
const reveal=(id,label='Passwort anzeigen')=>'<label class="check"><input type="checkbox" id="'+id+'"><span>'+label+'</span></label>';
const value=id=>A.$('#'+id)?.value??'';
const fail=(id,message)=>{const el=A.$('#'+id);if(el){el.setAttribute('aria-invalid','true');el.focus();}throw Error(message);};
A.vault={enabled:false,locked:false,pending:false,ready:false,unprotected:[]};
function wireReveal(root,id,ids){
 root.querySelector('#'+id)?.addEventListener('change',e=>{for(const f of ids){const el=root.querySelector('#'+f);if(el)el.type=e.target.checked?'text':'password';}});
 for(const f of ids)root.querySelector('#'+f)?.addEventListener('input',e=>e.target.removeAttribute('aria-invalid'));
}
function newPassword(first,second){
 const password=value(first);
 if(password.length>4096||new TextEncoder().encode(password).length>4096)fail(first,'Das Passwort ist zu lang.');
 if([...password].length<12||!password.trim())fail(first,'Wähle ein Passwort mit mindestens zwölf Zeichen, am besten mehrere Wörter.');
 if(password!==value(second))fail(second,'Die beiden Passwörter stimmen nicht überein.');
 return password;
}
function acceptStatus(next){
 if(!next||typeof next.enabled!=='boolean'||typeof next.locked!=='boolean')throw Error('Der Passwortschutz konnte nicht geprüft werden.');
 Object.assign(A.vault,next,{unprotected:Array.isArray(next.unprotected)?next.unprotected:[]});
 if(A.store)A.store.protected=A.vault.enabled;
 return A.vault;
}
async function status({ready=false}={}){
 if(!window.NRDesktop.available)return A.vault;
 const next=acceptStatus(await call('vault-status'));
 if(ready)next.ready=await call('vault-ready')===true;
 return next;
}
function settingsChanged(message){
 const active=document.activeElement?.id;
 const slot=A.$('#passwordProtection');if(slot){slot.outerHTML=A.vaultSettingsHTML();A.mountVaultSettings();}
 if(active&&active.startsWith('vault'))A.focusTarget(active);
 if(message)A.feedback('settings',message);
 if(A.vault.locked||A.vault.pending){A.vaultFocus=A.$('#passwordProtectionTitle');showGate();}
}
A.vaultSettingsHTML=function(){
 if(!window.NRDesktop.available)return '';
 const v=A.vault,cannot=A.starting||A.fatalStart||v.pending||v.locked;
 const ctl=(id,label,kind='button')=>button(id,label,kind,cannot?'disabled':'');
 const unprotected=v.enabled&&v.unprotected.length?'<details class="vault-remaining"><summary>Ungeschützte Dateien anzeigen ('+v.unprotected.length+')</summary><p>Diese Dateien wurden nicht verändert. Sichere sie bei Bedarf geschützt und entferne ungeschützte Kopien erst danach.</p><ul>'+v.unprotected.map(p=>'<li>'+A.esc(p)+'</li>').join('')+'</ul></details>':'';
 return '<div id="passwordProtection" class="vault-settings"><h3 id="passwordProtectionTitle" tabindex="-1">Passwortschutz</h3><p id="passwordProtectionState">'+(v.enabled?'Passwortschutz ist eingeschaltet.':'Passwortschutz ist ausgeschaltet.')+'</p>'+(v.enabled?'<p class="hint">Deine Noten und automatischen Sicherungen werden geschützt gespeichert.</p><div class="button-row">'+ctl('vaultChange','Passwort ändern')+ctl('vaultVerify','Notfallschlüssel prüfen')+ctl('vaultReplace','Notfallschlüssel ersetzen')+ctl('vaultDisable','Passwortschutz ausschalten')+ctl('vaultLock','Notenblick sperren','button primary')+'</div>'+unprotected:'<p class="hint">Schütze deine gespeicherten Noten und Sicherungen mit einem Passwort.</p>'+ctl('vaultEnable','Passwortschutz einrichten','button primary'))+'</div>';
};
A.mountVaultSettings=function(){
 for(const [id,action]of [['vaultEnable',()=>setup(false)],['vaultChange',changePassword],['vaultVerify',verifyKey],['vaultReplace',()=>setup(true)],['vaultDisable',disable],['vaultLock',()=>A.lockVault()]]){
  A.$('#'+id)?.addEventListener('click',()=>Promise.resolve().then(action).catch(e=>A.error(message(e),'storage')));
 }
};
const message=e=>String(e?.message||'Der Vorgang konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
function dialogError(text){
 const el=A.$('#dialogError');el.textContent=text;el.hidden=!text;
}
function gateError(text){
 const el=A.$('#vaultGateError');if(el){el.textContent=text;el.hidden=!text;}
}
function gateControls({recovery=false,working=false}={}){
 const gate=A.$('#vaultGate');gate.dataset.mode=recovery?'recovery':'password';
 gate.querySelector('#vaultPasswordFields').hidden=recovery;
 gate.querySelector('#vaultRecoveryFields').hidden=!recovery;
 gate.querySelector('#vaultGateChoice').textContent=recovery?'Mit Passwort öffnen':'Mit Notfallschlüssel öffnen';
 gate.querySelector('#vaultGateWork').hidden=!working;
 gate.querySelector('form').setAttribute('aria-busy',String(working));
 for(const el of gate.querySelectorAll('input,button'))el.disabled=working;
}
function closeGate(){
 document.documentElement.removeAttribute('data-vault-locked');
 const gate=A.$('#vaultGate');if(gate?.open)gate.close();
 for(const el of gate?.querySelectorAll('input')||[]){
  if(el.type==='checkbox')el.checked=false;
  else{el.type='password';el.value='';el.removeAttribute('aria-invalid');}
 }
}
let gateHelpOrigin=null;
function gateHelp(show){
 const gate=A.$('#vaultGate'),form=gate.querySelector('form'),help=gate.querySelector('#vaultGateHelp');
 if(show===!help.hidden)return;
 if(show){
  gateHelpOrigin=document.activeElement;
  form.hidden=true;help.hidden=false;gate.setAttribute('aria-labelledby','vaultGateHelpTitle');
  A.focusTarget('vaultGateHelpTitle');
 }else{
  help.hidden=true;form.hidden=false;gate.setAttribute('aria-labelledby','vaultGateTitle');
  if(!A.focusTarget(gateHelpOrigin))A.focusTarget('vaultGateTitle');
  gateHelpOrigin=null;
 }
}
window.addEventListener('keydown',e=>{
 const gate=A.$('#vaultGate');if(!gate?.open)return;
 // The global application router listens in capture phase. Keep commands
 // inside the protected view while retaining native text and Tab editing.
 e.stopPropagation();
 if(e.key==='F1'){e.preventDefault();gateHelp(true);}
 if(e.key==='Escape'){e.preventDefault();gateHelp(false);}
},true);
function showGate({startup=false,working=false}={}){
 let gate=A.$('#vaultGate');
 if(!gate){
  gate=document.createElement('dialog');gate.id='vaultGate';gate.setAttribute('aria-labelledby','vaultGateTitle');
  const help=A.helpSection(useHelp).section;
  gate.innerHTML='<form role="none" novalidate><h2 id="vaultGateTitle" tabindex="-1">Notenblick öffnen</h2><p id="vaultGateHint">Öffne deine geschützten Noten mit Passwort oder Notfallschlüssel.</p><div id="vaultPasswordFields">'+passField('vaultGatePassword')+reveal('vaultGateShow')+'</div><div id="vaultRecoveryFields" hidden>'+keyField('vaultGateRecovery')+reveal('vaultGateShowRecovery','Notfallschlüssel anzeigen')+button('vaultGateRead','Schlüsseldatei öffnen','text-button')+'</div><p id="vaultGateError" class="field-error" role="alert" hidden></p><p id="vaultGateWork" role="status" hidden>Bitte kurz warten …</p><div class="button-row vault-gate-actions"><button type="submit" id="vaultGateOpen" class="button primary">Öffnen</button>'+button('vaultGateChoice','Mit Notfallschlüssel öffnen')+button('vaultGateClose','Notenblick schließen','text-button')+'</div></form><div id="vaultGateHelp" hidden><h2 id="vaultGateHelpTitle" tabindex="-1">'+A.esc(help.heading)+'</h2>'+A.helpParagraphs(help)+button('vaultGateHelpBack','Zurück')+'</div>';
  document.body.append(gate);
  wireReveal(gate,'vaultGateShow',['vaultGatePassword']);
  wireReveal(gate,'vaultGateShowRecovery',['vaultGateRecovery']);
  gate.addEventListener('cancel',e=>{e.preventDefault();});
  gate.querySelector('#vaultGateHelpBack').addEventListener('click',()=>gateHelp(false));
  gate.querySelector('#vaultGateChoice').addEventListener('click',()=>{
   gateError('');const recovery=gate.dataset.mode!=='recovery';
   for(const id of ['vaultGatePassword','vaultGateRecovery']){
    const el=gate.querySelector('#'+id);el.value='';el.type='password';el.removeAttribute('aria-invalid');
   }
   gate.querySelector('#vaultGateShow').checked=false;gate.querySelector('#vaultGateShowRecovery').checked=false;
   gateControls({recovery});
   A.focusTarget(recovery?'vaultGateRecovery':'vaultGatePassword');
  });
  gate.querySelector('#vaultGateRead').addEventListener('click',async()=>{
   try{const key=await call('vault-key-read');if(key!==false){gate.querySelector('#vaultGateRecovery').value=key;A.focusTarget('vaultGateOpen');}}
   catch(e){gateError(message(e));}
  });
  gate.querySelector('#vaultGateClose').addEventListener('click',()=>A.closeVault());
  gate.querySelector('form').addEventListener('submit',async e=>{
   e.preventDefault();
   const recovery=gate.dataset.mode==='recovery',id=recovery?'vaultGateRecovery':'vaultGatePassword',secret=value(id);
   if(!secret){gateError(recovery?'Gib deinen Notfallschlüssel ein oder öffne die Schlüsseldatei.':'Gib dein Passwort ein.');A.focusTarget(id);return;}
   if(recovery?secret.length>200:secret.length>4096||new TextEncoder().encode(secret).length>4096){
    gateError(recovery?'Der Notfallschlüssel ist zu lang.':'Das Passwort ist zu lang.');A.focusTarget(id);return;
   }
   gateError('');gateControls({working:true,recovery});
   try{
    await call('vault-unlock',recovery?{recovery:secret}:{password:secret});
    await status();
    if(A.vault.locked||A.vault.pending)throw Error('Der laufende Wechsel ist noch nicht abgeschlossen. Öffne deine Noten erneut, um fortzufahren.');
    closeGate();const resolve=A.vaultStartupResolve;A.vaultStartupResolve=null;
    if(resolve)resolve();else if(!A.focusTarget(A.vaultFocus,{preventScroll:true}))A.focusTarget(A.$('#mainTabs [aria-current=page]'),{preventScroll:true});
    A.vaultFocus=null;
    if(A.vault.needsSave){A.vault.needsSave=false;A.error('Nicht alle Eingaben konnten vor dem Sperren gespeichert werden. Prüfe deine letzten Eingaben und speichere sie erneut.','storage');}
   }catch(e){
    gateControls({recovery});
    const el=gate.querySelector('#'+id);el.value='';el.setAttribute('aria-invalid','true');gateError(message(e));A.focusTarget(id);
   }
  });
 }
 document.documentElement.setAttribute('data-vault-locked','');
 gateHelp(false);
 gate.querySelector('#vaultGateTitle').textContent=startup?'Notenblick öffnen':'Notenblick ist gesperrt';
 gate.querySelector('#vaultGateHint').textContent='Öffne deine geschützten Noten mit Passwort oder Notfallschlüssel.';
 gateError('');gateControls({working});
 if(!gate.open){
  const h=gate.querySelector('h2');h.setAttribute('autofocus','');gate.showModal();h.removeAttribute('autofocus');h.focus();
 }
 if(startup)A.$('#bootNotice').hidden=true;
}
A.openVaultBeforeData=async function(){
 const v=await status();
 if(!v.enabled&&!v.pending)return;
 if(v.locked||v.pending){showGate({startup:true});await new Promise(resolve=>{A.vaultStartupResolve=resolve;});}
};
A.closeVault=async function(){
 try{await call('vault-request-close',{preserve:!!A.vault.needsSave||!!A.vaultLocking});}
 catch(e){gateError(message(e));}
};
A.lockVault=async function({forced=false}={}){
 if(!A.vault.enabled||A.vault.locked||A.vaultLocking)return;
 if(!forced&&A.$('#dialog').open)return;
 A.vaultLocking=true;A.vault.needsSave=true;A.vaultFocus=document.activeElement;
 A.clearAnnouncement();A.closeMenu(false);A.clearPrint?.(false);
 // Modal inertness hides the working session from keyboard and assistive
 // technology immediately. The native storage key is dropped after the
 // current serialized save has drained. Invalid raw input stays in memory.
 showGate({working:true});
 let saved=false;
 try{saved=await A.flushForClose();}catch{}
 A.vault.needsSave=!saved||A.pending.size>0||A.dialogBusy||!!A.setupDraft||!!A.settingsWeights?.dirty();
 try{
  await call('vault-lock');A.vault.locked=true;
 }catch(e){
  gateError(message(e));
  // Keep the workspace covered. The next successful unlock rechecks storage
  // and permits the existing work to be recovered.
 }finally{
  gateControls();A.vaultLocking=false;
  if(A.vault.needsSave)gateError('Deine Eingaben bleiben geöffnet. Entsperre Notenblick, um sie weiter zu bearbeiten.');
  A.focusTarget('vaultGateTitle');
 }
};
window.NRDesktop?.on?.('windows-locked',()=>A.lockVault({forced:true}));
async function flushForProtection(){
 if(!A.canLeave()||!await A.flushForClose())throw Error('Speichere bitte zuerst deine letzten Eingaben.');
 if(!A.store||A.fatalStart||!await call('vault-ready'))throw Error('Der Notfallzugriff fehlt oder konnte nicht geprüft werden. Entpacke Notenblick vollständig und versuche es erneut.');
 if(A.store.cleaning||A.store.protectWrites||A.store.workspaceWrites||A.store.saving)throw Error('Warte bitte, bis die laufende Speicherung abgeschlossen ist.');
}
async function checkTransition(){
 const v=await status().catch(()=>null);
 if(!v?.pending)return;
 await call('vault-lock').catch(()=>{});
 A.vault.locked=true;
 A.afterClose=null;
 A.closeModal({submitted:true});
 A.vaultFocus=A.$('#passwordProtectionTitle');
 showGate();
 gateError('Die Umstellung wurde unterbrochen. Öffne deine geschützten Noten erneut, um sie fortzusetzen.');
}
function setup(rotate){
 if(!A.canLeave()||A.$('#dialog').open)return;
 let step=0,password='',key='',verification=false;
 const root=()=>A.$('#dialogContent');
 const labels=rotate?['Passwort bestätigen','Neuen Notfallschlüssel sichern','Notfallschlüssel ersetzen']:['Passwort festlegen','Notfallschlüssel sichern','Daten verschlüsseln'];
 const notes='<p class="hint">Verwende am besten mehrere Wörter. Einfügen aus einem Passwortmanager ist möglich.</p>';
 const clean=()=>{key=password='';verification=false;root().replaceChildren();call('vault-key-clear').catch(()=>{});};
 async function submit(){
  if(!step){
   if(rotate){password=value('vaultSetupPassword');if(!password)fail('vaultSetupPassword','Gib dein aktuelles Passwort ein.');await call('vault-check-password',{password});}
   else password=newPassword('vaultSetupPassword','vaultSetupRepeat');
   await flushForProtection();key=await call('vault-key');step=1;draw();return{keepOpen:true};
  }
  if(step===1){
   if(!verification)throw Error('Speichere die Schlüsseldatei und öffne sie zur Prüfung erneut.');
   step=2;draw();return{keepOpen:true};
  }
  await flushForProtection();
  try{
   await A.runOperation(labels[2],async progress=>{
    progress(rotate?'Notfallschlüssel wird ersetzt …':'Deine Noten und Sicherungen werden geschützt …');
    await call(rotate?'vault-rotate':'vault-enable',{password,currentPassword:rotate?password:undefined,recovery:key,verification:key});
   });
  }catch(error){await checkTransition();throw error;}
  await status();
  A.afterClose=()=>{settingsChanged(rotate?'Neuer Notfallschlüssel geprüft und eingerichtet.':'Passwortschutz eingerichtet.');A.focusTarget('passwordProtectionTitle');};
 }
 function draw(){
  const title=A.$('#dialogTitle');title.textContent=labels[step];dialogError('');
  A.$('#dialogSave').textContent=step<2?'Weiter':labels[2];
  if(!step){
   root().innerHTML=(rotate?'<p>Der alte Schlüssel kann weiterhin zu älteren Sicherungen passen. Bewahre ihn dafür getrennt auf.</p>':notes)+passField('vaultSetupPassword',rotate?'Aktuelles Passwort':'Passwort')+(rotate?'':passField('vaultSetupRepeat','Passwort wiederholen'))+reveal('vaultSetupShow');
   wireReveal(root(),'vaultSetupShow',['vaultSetupPassword','vaultSetupRepeat']);
  }else if(step===1){
   root().innerHTML='<p>'+notice+'</p><p>Speichere den Schlüssel und öffne die Datei zur Prüfung erneut.</p>'+keyField('vaultGeneratedKey')+reveal('vaultGeneratedShow','Notfallschlüssel anzeigen')+'<div class="button-row vault-key-actions">'+button('vaultKeySave','Schlüsseldatei speichern','button primary')+button('vaultKeyRead','Gespeicherte Schlüsseldatei prüfen')+button('vaultKeyCopy','Schlüssel kopieren','text-button')+button('vaultKeyPrint','Schlüssel drucken','text-button')+'</div><p id="vaultKeyStatus" class="hint" role="status"></p>';
   const el=A.$('#vaultGeneratedKey');el.value=key;el.readOnly=true;wireReveal(root(),'vaultGeneratedShow',['vaultGeneratedKey']);
   const keyAction=(id,op,statusText)=>A.$('#'+id).addEventListener('click',async(e)=>{
    const target=e.currentTarget;target.disabled=true;dialogError('');
    try{
     const result=await call(op,{recovery:key});
     if(result===false||!target.isConnected)return;
     if(op==='vault-key-read'){
      if(result!==key)throw Error('Das ist nicht die gerade erstellte Schlüsseldatei. Bitte wähle die passende Datei.');
      verification=true;
     }
     A.$('#vaultKeyStatus').textContent=statusText;
    }catch(e){dialogError(message(e));}
    finally{if(target.isConnected){target.disabled=false;target.focus();}}
   });
   keyAction('vaultKeySave','vault-key-save','Schlüsseldatei gespeichert.');
   keyAction('vaultKeyRead','vault-key-read','Die Schlüsseldatei passt. Du kannst fortfahren.');
   keyAction('vaultKeyCopy','vault-key-copy','Notfallschlüssel kopiert.');
   keyAction('vaultKeyPrint','vault-key-print','Druckauftrag übergeben.');
  }else root().innerHTML='<p>'+(rotate?'Notenblick prüft den neuen Schlüssel und verschlüsselt den aktuellen Bestand erneut.':'Notenblick schützt jetzt deine Noten, Sicherungen und automatischen Notenlisten. Der Vorgang kann etwas dauern.')+'</p><p class="hint">Früher außerhalb dieses Datenordners gespeicherte Kopien bleiben wie sie sind.</p>'+button('vaultSetupBack','Zurück');
  if(step===1)root().insertAdjacentHTML('beforeend',button('vaultSetupBack','Zurück','text-button'));
  A.$('#vaultSetupBack')?.addEventListener('click',()=>{step--;if(step===0){key='';verification=false;}draw();});
  A.focusTarget(title);
 }
 A.modal(labels[0],'',submit,'Weiter',{size:'small',helpContext:stepHelp,onClose:clean});draw();
}
function authFields({backup=false}={}){
 return passField('vaultCurrent',backup?'Passwort der Sicherung':'Aktuelles Passwort')+'<p class="hint">Du kannst stattdessen den passenden Notfallschlüssel verwenden.</p>'+keyField('vaultCurrentKey')+button('vaultReadCurrent','Schlüsseldatei öffnen','text-button');
}
function authArgs(){
 const password=value('vaultCurrent'),recovery=value('vaultCurrentKey');
 if(!password&&!recovery)fail('vaultCurrent','Gib dein aktuelles Passwort oder deinen Notfallschlüssel ein.');
 if(password&&recovery)fail('vaultCurrentKey','Verwende entweder dein Passwort oder den Notfallschlüssel. Leere das andere Feld.');
 if(password.length>4096||new TextEncoder().encode(password).length>4096)fail('vaultCurrent','Das Passwort ist zu lang.');
 if(recovery.length>200)fail('vaultCurrentKey','Der Notfallschlüssel ist zu lang.');
 return password?{password}:{recovery};
}
function mountReadKey(field,buttonId){
 A.$('#'+buttonId)?.addEventListener('click',async()=>{
  try{const code=await call('vault-key-read');if(code!==false){A.$('#'+field).value=code;A.focusTarget('dialogSave');}}
  catch(e){dialogError(message(e));}
 });
}
function clearSecretForm(){A.$('#dialogContent').replaceChildren();}
function changePassword(){
 A.modal('Passwort ändern',authFields()+passField('vaultNew','Neues Passwort')+passField('vaultRepeat','Neues Passwort wiederholen')+reveal('vaultChangeShow')+'<p class="hint">Ältere Sicherungen können weiterhin das frühere Passwort oder den zugehörigen Notfallschlüssel benötigen.</p>',async()=>{
  const auth=authArgs(),password=newPassword('vaultNew','vaultRepeat');
  await flushForProtection();await call('vault-change',{currentPassword:auth.password,recovery:auth.recovery,password});
  await status();A.afterClose=()=>settingsChanged('Passwort geändert.');
 },'Passwort ändern',{size:'small',helpContext:useHelp,onClose:clearSecretForm});
 mountReadKey('vaultCurrentKey','vaultReadCurrent');
 wireReveal(A.$('#dialogContent'),'vaultChangeShow',['vaultCurrent','vaultNew','vaultRepeat']);
}
function verifyKey(){
 A.modal('Notfallschlüssel prüfen',keyField('vaultVerifyKey')+reveal('vaultVerifyShow','Notfallschlüssel anzeigen')+button('vaultVerifyRead','Schlüsseldatei öffnen','text-button'),async()=>{
  const recovery=value('vaultVerifyKey');if(!recovery)fail('vaultVerifyKey','Gib den Notfallschlüssel ein oder öffne deine Schlüsseldatei.');
  await call('vault-verify',{recovery});
  A.afterClose=()=>settingsChanged('Der Notfallschlüssel passt zu deinen Noten.');
 },'Notfallschlüssel prüfen',{size:'small',helpContext:useHelp,onClose:clearSecretForm});
 mountReadKey('vaultVerifyKey','vaultVerifyRead');wireReveal(A.$('#dialogContent'),'vaultVerifyShow',['vaultVerifyKey']);
}
function disable(){
 A.modal('Passwortschutz ausschalten','<p>Notenblick speichert deine aktiven Daten anschließend unverschlüsselt. Vorhandene verschlüsselte Sicherungen behalten ihren Schutz.</p>'+authFields()+reveal('vaultDisableShow'),async()=>{
  const auth=authArgs();await flushForProtection();
  try{
   await A.runOperation('Passwortschutz ausschalten',async progress=>{
    progress('Deine Noten werden für die unverschlüsselte Ablage vorbereitet …');await call('vault-disable',auth);
   });
  }catch(error){await checkTransition();throw error;}
  await status();A.afterClose=()=>{settingsChanged('Passwortschutz ausgeschaltet.');A.focusTarget('passwordProtectionTitle');};
 },'Passwortschutz ausschalten',{size:'small',helpContext:useHelp,onClose:clearSecretForm});
 mountReadKey('vaultCurrentKey','vaultReadCurrent');
 wireReveal(A.$('#dialogContent'),'vaultDisableShow',['vaultCurrent']);
}
A.promptProtectedBackup=function(dataBase64,accept){
 A.modal('Geschützte Sicherung öffnen',authFields({backup:true})+reveal('backupUnlockShow'),async()=>{
  const auth=authArgs(),text=await call('vault-open-backup',{dataBase64,...auth});
  const restored=accept(text);A.afterClose=()=>A.confirmRestore(restored);
 },'Sicherung öffnen',{size:'small',helpContext:useHelp,onClose:clearSecretForm});
 mountReadKey('vaultCurrentKey','vaultReadCurrent');
 wireReveal(A.$('#dialogContent'),'backupUnlockShow',['vaultCurrent']);
};
})(globalThis.Notenblick);
