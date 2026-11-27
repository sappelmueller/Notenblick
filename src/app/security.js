/* Optional portable data protection and the protected start screen. */
(function(A){'use strict';
const stepHelp='sicherung-passwortschutz-einrichten',useHelp='sicherung-passwortschutz-verwenden';
const call=(op,args)=>window.NRDesktop.call(op,args);
const button=(id,label,kind='button',attrs='')=>'<button type="button" id="'+id+'" class="'+kind+'" '+attrs+'>'+label+'</button>';
const notice='Mit dem Notfallschlüssel kannst du deine Noten öffnen, falls du dein Passwort vergisst. Bewahre den Schlüssel getrennt von deinen Noten auf.';
const passwordRule='Wähle mindestens acht Zeichen. Verwende Groß- und Kleinbuchstaben, eine Ziffer und ein Sonderzeichen.';
const wrongPassword='Das Passwort stimmt nicht. Versuch es noch einmal.';
const wrongKey='Der Notfallschlüssel passt nicht zu deinen Noten. Prüfe die Eingabe oder öffne die passende Schlüsseldatei.';
const unreadableKey='Die Schlüsseldatei lässt sich nicht lesen. Wähle die Datei, die du beim Einrichten gespeichert hast.';
const keyField=(id,label='Notfallschlüssel')=>A.field(id,label,'','autocomplete="off" autocapitalize="none" spellcheck="false"','password');
const passField=(id,label='Passwort',hint='')=>A.field(id,label,'','autocomplete="off" autocapitalize="none" spellcheck="false"','password',hint);
const reveal=(id,label='Passwort anzeigen')=>'<label class="check"><input type="checkbox" id="'+id+'"><span>'+label+'</span></label>';
const value=id=>A.$('#'+id)?.value??'';
function fail(id,text){
 const field=A.$('#'+id);
 if(field){
  field.setAttribute('aria-invalid','true');
  field.setAttribute('aria-errormessage','dialogError');
  field.focus();
 }
 throw Error(text);
}
A.vault={enabled:false,locked:false,pending:false,ready:false,unprotected:[]};
function wireReveal(root,id,ids){
 root.querySelector('#'+id)?.addEventListener('change',e=>{for(const f of ids){const el=root.querySelector('#'+f);if(el)el.type=e.target.checked?'text':'password';}});
 for(const f of ids)root.querySelector('#'+f)?.addEventListener('input',e=>{
  if(e.target.getAttribute('aria-invalid')==='true'&&root.closest('#dialog'))dialogError('');
  e.target.removeAttribute('aria-invalid');
  e.target.removeAttribute('aria-errormessage');
 });
}
function newPassword(first,second){
 const password=value(first);
 if(password.length>4096||new TextEncoder().encode(password).length>4096)fail(first,'Das Passwort ist zu lang.');
 if(/[\uD800-\uDFFF]/u.test(password))fail(first,'Das Passwort enthält ein ungültiges Zeichen.');
 if([...password].length<8||!/\p{Lu}/u.test(password)||!/\p{Ll}/u.test(password)||!/\p{Nd}/u.test(password)||!/[\p{P}\p{S}]/u.test(password))fail(first,passwordRule);
 if(password!==value(second))fail(second,'Die beiden Passwörter stimmen nicht überein.');
 return password;
}
function acceptStatus(next){
 if(!next||typeof next.enabled!=='boolean'||typeof next.locked!=='boolean')throw Error('Der Passwortschutz konnte nicht geprüft werden.');
 Object.assign(A.vault,next,{unprotected:Array.isArray(next.unprotected)?next.unprotected:[]});
 if(A.store)A.store.protected=A.vault.enabled;
 A.mountVaultHome();
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
 const unprotected=v.enabled&&v.unprotected.length?'<details class="vault-remaining"><summary>Dateien ohne Passwortschutz ('+v.unprotected.length+')</summary><p>Diese Dateien sind weiterhin ohne Passwort lesbar. Wenn sie Noten enthalten, bewahre sie an einem geschützten Ort auf.</p><ul>'+v.unprotected.map(p=>'<li>'+A.esc(p)+'</li>').join('')+'</ul></details>':'';
 const state=v.enabled?'Eingeschaltet':'Ausgeschaltet';
 const controls=v.enabled
  ? '<p>Deine Noten und automatischen Sicherungen sind geschützt.</p>'+ctl('vaultChange','Passwort ändern')+
    '<div class="vault-settings-group"><h4>Notfallschlüssel</h4><div class="button-row">'+ctl('vaultVerify','Notfallschlüssel prüfen')+ctl('vaultReplace','Notfallschlüssel ersetzen')+'</div></div>'+
    unprotected+'<div class="vault-settings-group">'+ctl('vaultDisable','Passwortschutz ausschalten')+'</div>'
  : '<p>Mit einem Passwort kannst du deine gespeicherten Noten und Sicherungen schützen.</p>'+ctl('vaultEnable','Passwortschutz einrichten','button primary');
 return '<div id="passwordProtection" class="vault-settings"><div class="vault-settings-heading"><h3 id="passwordProtectionTitle" tabindex="-1">Passwortschutz</h3><p id="passwordProtectionState"><span class="sr-only">Passwortschutz </span>'+state+'</p></div>'+controls+'</div>';
};
A.mountVaultHome=function(){
 const slot=A.$('#homeVaultAction');
 if(!slot)return;
 if(!A.vault.enabled){slot.replaceChildren();slot.hidden=true;return;}
 slot.hidden=false;
 if(!slot.firstElementChild){
  slot.innerHTML=button('vaultLock','Notenblick sperren');
  slot.firstElementChild.addEventListener('click',()=>A.lockVault());
 }
};
A.mountVaultSettings=function(){
 for(const [id,action]of [['vaultEnable',()=>setup(false)],['vaultChange',changePassword],['vaultVerify',verifyKey],['vaultReplace',()=>setup(true)],['vaultDisable',disable]]){
  A.$('#'+id)?.addEventListener('click',()=>Promise.resolve().then(action).catch(e=>A.error(message(e),'storage')));
 }
};
const message=e=>String(e?.message||'Der Vorgang konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
function dialogError(text){
 const el=A.$('#dialogError');el.textContent=text;el.hidden=!text;
}
function gateError(text,field=null){
 const el=A.$('#vaultGateError');
 if(!el)return;
 for(const id of ['vaultGatePassword','vaultGateRecovery']){
  const input=A.$('#'+id);
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-errormessage');
 }
 if(field){
  field.setAttribute('aria-invalid','true');
  field.setAttribute('aria-errormessage',el.id);
 }
 if(el.textContent!==text)el.textContent=text;
 el.hidden=!text;
}
function gateControls({recovery=false,working=false}={}){
 const gate=A.$('#vaultGate');gate.dataset.mode=recovery?'recovery':'password';
 const startup=gate.dataset.startup==='true';
 const action=startup?'öffnen':'entsperren';
 gate.querySelector('#vaultPasswordFields').hidden=recovery;
 gate.querySelector('#vaultRecoveryFields').hidden=!recovery;
 gate.querySelector('#vaultGateChoice').textContent='Mit '+(recovery?'Passwort':'Notfallschlüssel')+' '+action;
 gate.querySelector('#vaultGateHint').textContent=recovery?'Gib deinen Notfallschlüssel ein oder wähle deine Schlüsseldatei.'
  :startup?'Gib dein Passwort ein, um deine Noten zu öffnen.':'Gib dein Passwort ein, um weiterzuarbeiten.';
 gate.querySelector('#vaultGateOpen').textContent=startup?'Öffnen':'Entsperren';
 gate.querySelector('#vaultGateWork').textContent=working?(A.vaultLocking?'Notenblick wird gesperrt …':'Deine Noten werden geöffnet …'):'';
 for(const el of gate.querySelectorAll('input,button'))el.disabled=working;
}
function closeGate(){
 document.documentElement.removeAttribute('data-vault-locked');
 const gate=A.$('#vaultGate');if(gate?.open)gate.close();
 for(const el of gate?.querySelectorAll('input')||[]){
  if(el.type==='checkbox')el.checked=false;
  else{el.type='password';el.value='';el.removeAttribute('aria-invalid');el.removeAttribute('aria-errormessage');}
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
  gate.innerHTML='<form role="none" novalidate><h2 id="vaultGateTitle" tabindex="-1"></h2><p id="vaultGateHint"></p>'+
   '<div id="vaultPasswordFields">'+passField('vaultGatePassword')+reveal('vaultGateShow')+'</div>'+
   '<div id="vaultRecoveryFields" hidden>'+keyField('vaultGateRecovery')+reveal('vaultGateShowRecovery','Notfallschlüssel anzeigen')+button('vaultGateRead','Schlüsseldatei öffnen','text-button')+'</div>'+
   '<p id="vaultGateError" class="field-error" role="alert" hidden></p><p id="vaultGateWork" class="hint" role="status"></p>'+
   '<div class="button-row vault-gate-actions"><button type="submit" id="vaultGateOpen" class="button primary">Öffnen</button>'+button('vaultGateChoice','Mit Notfallschlüssel öffnen')+button('vaultGateClose','Notenblick schließen','text-button')+'</div></form>'+
   '<div id="vaultGateHelp" hidden><h2 id="vaultGateHelpTitle" tabindex="-1">'+A.esc(help.heading)+'</h2>'+A.helpParagraphs(help)+button('vaultGateHelpBack','Zurück')+'</div>';
  document.body.append(gate);
  wireReveal(gate,'vaultGateShow',['vaultGatePassword']);
  wireReveal(gate,'vaultGateShowRecovery',['vaultGateRecovery']);
  for(const id of ['vaultGatePassword','vaultGateRecovery'])
   gate.querySelector('#'+id).addEventListener('input',()=>gateError(''));
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
   try{const key=await call('vault-key-read');if(key!==false){gateError('');gate.querySelector('#vaultGateRecovery').value=key;A.focusTarget('vaultGateOpen');}}
   catch{gateError(unreadableKey);}
  });
  gate.querySelector('#vaultGateClose').addEventListener('click',()=>A.closeVault());
  gate.querySelector('form').addEventListener('submit',async e=>{
   e.preventDefault();
   const recovery=gate.dataset.mode==='recovery',id=recovery?'vaultGateRecovery':'vaultGatePassword',secret=value(id);
   const field=gate.querySelector('#'+id);
   if(!secret){gateError(recovery?'Gib deinen Notfallschlüssel ein oder öffne die Schlüsseldatei.':'Gib dein Passwort ein.',field);A.focusTarget(id);return;}
   if(recovery?secret.length>200:secret.length>4096||new TextEncoder().encode(secret).length>4096){
    gateError(recovery?'Der Notfallschlüssel ist zu lang.':'Das Passwort ist zu lang.',field);A.focusTarget(id);return;
   }
   gateError('');gateControls({working:true,recovery});
   try{
    await call('vault-unlock',recovery?{recovery:secret}:{password:secret});
    await status();
    if(A.vault.locked||A.vault.pending)throw Error('Die Änderung am Passwortschutz ist noch offen. Öffne deine Noten erneut, um sie abzuschließen.');
    closeGate();const resolve=A.vaultStartupResolve;A.vaultStartupResolve=null;
    if(resolve)resolve();else if(!A.focusTarget(A.vaultFocus,{preventScroll:true}))A.focusTarget(A.$('#mainTabs [aria-current=page]'),{preventScroll:true});
    A.vaultFocus=null;
    if(A.vault.needsSave){A.vault.needsSave=false;A.error('Nicht alle Eingaben konnten vor dem Sperren gespeichert werden. Prüfe deine letzten Eingaben und speichere sie erneut.','storage');}
   }catch(e){
    gateControls({recovery});
    field.value='';field.type='password';
    gate.querySelector(recovery?'#vaultGateShowRecovery':'#vaultGateShow').checked=false;
    if(e.name==='VaultAccessException'){
     gateError(recovery?wrongKey:wrongPassword,field);
     A.focusTarget(id);
    }else{
     gateError(e.name==='InvalidDataException'||e.name==='NotFoundError'
      ?'Dieser Notenstand lässt sich nicht öffnen. Öffne eine Sicherung im Notfallzugriff.':message(e));
     A.focusTarget('vaultGateTitle');
    }
   }
  });
 }
 document.documentElement.setAttribute('data-vault-locked','');
 gateHelp(false);
 gate.dataset.startup=String(startup);
 gate.querySelector('#vaultGateTitle').textContent=startup?'Notenblick öffnen':'Notenblick ist gesperrt';
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
 if(!v?.pending)return v;
 await call('vault-lock').catch(()=>{});
 A.vault.locked=true;
 A.afterClose=null;
 A.closeModal({submitted:true});
 A.vaultFocus=A.$('#passwordProtectionTitle');
 showGate();
 gateError('Die Änderung am Passwortschutz wurde unterbrochen. Öffne deine Noten, um sie abzuschließen.');
 return v;
}
function setup(rotate){
 if(!A.canLeave()||A.$('#dialog').open)return;
 let step=0,password='',key='',verification=false,keyBusy=false,keyStatus='';
 const root=()=>A.$('#dialogContent');
 const dialog=A.$('#dialog'),title=A.$('#dialogTitle'),footer=A.$('#setupFooterSlot');
 const save=A.$('#dialogSave');
 const labels=rotate?['Passwort bestätigen','Neuen Notfallschlüssel sichern','Notfallschlüssel ersetzen']:['Passwort festlegen','Notfallschlüssel sichern','Passwortschutz einschalten'];
 const clean=()=>{
  key=password='';verification=false;root().replaceChildren();footer.replaceChildren();footer.hidden=true;
  title.removeAttribute('aria-describedby');delete dialog.dataset.vaultSetup;
  call('vault-key-clear').catch(()=>{});
 };
 async function submit(){
  if(keyBusy)return{keepOpen:true};
  if(!step){
   if(rotate){
    password=value('vaultSetupPassword');
    if(!password)fail('vaultSetupPassword','Gib dein aktuelles Passwort ein.');
    try{await call('vault-check-password',{password});}
    catch(e){if(e.name==='VaultAccessException')fail('vaultSetupPassword',wrongPassword);throw e;}
   }
   else password=newPassword('vaultSetupPassword','vaultSetupRepeat');
   await flushForProtection();
   if(!key)key=await call('vault-key');
   step=1;draw();return{keepOpen:true};
  }
  if(step===1){
   if(!verification){A.focusTarget('vaultKeyRead');throw Error('Öffne die gespeicherte Schlüsseldatei erneut, um sie zu prüfen.');}
   step=2;draw();return{keepOpen:true};
  }
  await flushForProtection();
  footer.hidden=true;
  try{
   await A.runOperation(labels[2],async progress=>{
    progress(rotate?'Notfallschlüssel wird ersetzt …':'Deine Noten und Sicherungen werden geschützt …');
    await call(rotate?'vault-rotate':'vault-enable',{password,currentPassword:rotate?password:undefined,recovery:key,verification:key});
   });
  }catch(error){
   const current=await checkTransition();
   if(!rotate&&current?.enabled===false)throw Error(message(error)+' Der Passwortschutz ist weiterhin ausgeschaltet.');
   throw error;
  }finally{if(dialog.open&&dialog.dataset.vaultSetup)footer.hidden=false;}
  await status();
  A.afterClose=()=>{settingsChanged(rotate?'Dein neuer Notfallschlüssel ist jetzt gültig.':'Der Passwortschutz ist eingeschaltet.');A.focusTarget('passwordProtectionTitle');};
 }
 function draw({focus=true}={}){
  title.textContent=labels[step];dialogError('');
  title.setAttribute('aria-describedby','vaultSetupStep');
  save.textContent=step<2?'Weiter':labels[2];
  footer.hidden=step===0;
  footer.innerHTML=step?button('vaultSetupBack','Zurück','text-button'):'';
  if(!step){
   root().innerHTML=(rotate?'<p>Bestätige den Wechsel mit deinem aktuellen Passwort.</p>':'')+
    '<div class="vault-password-fields">'+passField('vaultSetupPassword',rotate?'Aktuelles Passwort':'Passwort',rotate?'':passwordRule)+(rotate?'':passField('vaultSetupRepeat','Passwort wiederholen'))+reveal('vaultSetupShow')+'</div>';
   A.$('#vaultSetupPassword').value=password;
   if(!rotate)A.$('#vaultSetupRepeat').value=password;
   wireReveal(root(),'vaultSetupShow',['vaultSetupPassword','vaultSetupRepeat']);
  }else if(step===1){
   root().innerHTML='<p>'+notice+'</p><p>Speichere die Schlüsseldatei. Wähle sie danach unter „Schlüsseldatei prüfen“ aus.</p><div class="button-row vault-key-actions">'+button('vaultKeySave','Schlüsseldatei speichern')+button('vaultKeyRead','Schlüsseldatei prüfen')+'</div><p id="vaultKeyStatus" class="hint" role="status"></p><details><summary>Schlüssel kopieren oder drucken</summary>'+keyField('vaultGeneratedKey')+reveal('vaultGeneratedShow','Notfallschlüssel anzeigen')+'<div class="button-row vault-key-actions">'+button('vaultKeyCopy','Schlüssel kopieren','text-button')+button('vaultKeyPrint','Schlüssel drucken','text-button')+'</div></details>';
   const el=A.$('#vaultGeneratedKey');el.value=key;el.readOnly=true;wireReveal(root(),'vaultGeneratedShow',['vaultGeneratedKey']);
   A.$('#vaultKeyStatus').textContent=keyStatus;
   const keyAction=(id,op,statusText)=>A.$('#'+id).addEventListener('click',async(e)=>{
    if(keyBusy||A.dialogBusy)return;
    const target=e.currentTarget;keyBusy=true;target.disabled=true;save.disabled=true;dialogError('');
    try{
     const result=await call(op,{recovery:key});
     if(result===false||!target.isConnected)return;
     if(op==='vault-key-read'){
      if(result!==key)throw Error('Das ist nicht die gerade erstellte Schlüsseldatei. Bitte wähle die passende Datei.');
      verification=true;
     }
     keyStatus=statusText;
     A.$('#vaultKeyStatus').textContent=statusText;
    }catch(e){dialogError(message(e));}
    finally{keyBusy=false;if(target.isConnected){save.disabled=false;target.disabled=false;target.focus();}}
   });
   keyAction('vaultKeySave','vault-key-save','Schlüsseldatei gespeichert.');
   keyAction('vaultKeyRead','vault-key-read','Die Schlüsseldatei passt. Du kannst fortfahren.');
   keyAction('vaultKeyCopy','vault-key-copy','Notfallschlüssel kopiert.');
   keyAction('vaultKeyPrint','vault-key-print','Druckauftrag übergeben.');
  }else root().innerHTML=rotate?
   '<p>Nach dem Wechsel öffnet der neue Schlüssel deine aktuellen Noten. Bewahre den bisherigen Schlüssel für ältere Sicherungen auf.</p>':
   '<p>Beim Einschalten schützt Notenblick deine Noten, Notenlisten und Sicherungen im Datenordner. Das kann einen Moment dauern.</p><p class="hint">Kopien an anderen Orten behalten ihren bisherigen Schutz.</p>';
  root().insertAdjacentHTML('afterbegin','<p id="vaultSetupStep" class="hint">Schritt '+(step+1)+' von '+labels.length+'</p>');
  A.$('#vaultSetupBack')?.addEventListener('click',()=>{if(A.dialogBusy||keyBusy)return;step--;draw();});
  root().scrollTop=0;
  if(focus)A.focusTarget(title,{announceIfFocused:true});
 }
 dialog.dataset.vaultSetup='true';
 title.setAttribute('aria-describedby','vaultSetupStep');
 A.modal(labels[0],'<p id="vaultSetupStep" class="hint">Schritt 1 von 3</p>',submit,'Weiter',{size:'small',helpContext:stepHelp,onClose:clean});
 draw({focus:false});
}
function authFields({backup=false}={}){
 return '<div class="vault-auth"><div id="vaultAuthPassword">'+passField('vaultCurrent',backup?'Passwort der Sicherung':'Aktuelles Passwort')+reveal('vaultAuthShowPassword')+'</div>'+
  '<div id="vaultAuthRecovery" hidden>'+keyField('vaultCurrentKey')+reveal('vaultAuthShowRecovery','Notfallschlüssel anzeigen')+button('vaultReadCurrent','Schlüsseldatei öffnen','text-button')+'</div>'+
  button('vaultAuthChoice','Notfallschlüssel verwenden','text-button')+'</div>';
}
function mountAuth(){
 const root=A.$('#dialogContent'),choice=A.$('#vaultAuthChoice');
 mountReadKey('vaultCurrentKey','vaultReadCurrent');
 wireReveal(root,'vaultAuthShowPassword',['vaultCurrent']);
 wireReveal(root,'vaultAuthShowRecovery',['vaultCurrentKey']);
 choice.addEventListener('click',()=>{
  const password=A.$('#vaultAuthPassword'),recovery=A.$('#vaultAuthRecovery');
  password.hidden=!password.hidden;recovery.hidden=!password.hidden;
  choice.textContent=password.hidden?'Passwort verwenden':'Notfallschlüssel verwenden';
  for(const field of [A.$('#vaultCurrent'),A.$('#vaultCurrentKey')]){
   field.value='';field.type='password';field.removeAttribute('aria-invalid');field.removeAttribute('aria-errormessage');
  }
  A.$('#vaultAuthShowPassword').checked=false;A.$('#vaultAuthShowRecovery').checked=false;
  dialogError('');
  A.focusTarget(password.hidden?'vaultCurrentKey':'vaultCurrent');
 });
}
function authArgs(){
 const usingRecovery=A.$('#vaultAuthPassword').hidden;
 const password=usingRecovery?'':value('vaultCurrent'),recovery=usingRecovery?value('vaultCurrentKey'):'';
 if(usingRecovery&&!recovery)fail('vaultCurrentKey','Gib deinen Notfallschlüssel ein oder öffne die Schlüsseldatei.');
 if(!usingRecovery&&!password)fail('vaultCurrent','Gib dein Passwort ein.');
 if(password.length>4096||new TextEncoder().encode(password).length>4096)fail('vaultCurrent','Das Passwort ist zu lang.');
 if(recovery.length>200)fail('vaultCurrentKey','Der Notfallschlüssel ist zu lang.');
 return password?{password}:{recovery};
}
function mountReadKey(field,buttonId){
 const input=A.$('#'+field);
 A.$('#'+buttonId)?.addEventListener('click',async()=>{
  try{
   const code=await call('vault-key-read');
   if(code===false||!input.isConnected||input.closest('[hidden]'))return;
   input.value=code;
   input.removeAttribute('aria-invalid');input.removeAttribute('aria-errormessage');
   dialogError('');A.focusTarget('dialogSave');
  }catch{if(input.isConnected&&!input.closest('[hidden]'))dialogError(unreadableKey);}
 });
}
function rejectAccess(error,{recovery},{backup=false}={}){
 if(error.name==='VaultAccessException'){
  const text=backup?(recovery?'Der Notfallschlüssel passt nicht zu dieser Sicherung.':'Das Passwort passt nicht zu dieser Sicherung.'):(recovery?wrongKey:wrongPassword);
  fail(recovery?'vaultCurrentKey':'vaultCurrent',text);
 }
 throw error;
}
function clearSecretForm(){A.$('#dialogContent').replaceChildren();}
function changePassword(){
 A.modal('Passwort ändern',authFields()+'<div class="vault-password-fields vault-new-password">'+passField('vaultNew','Neues Passwort',passwordRule)+passField('vaultRepeat','Neues Passwort wiederholen')+reveal('vaultChangeShow','Neues Passwort anzeigen')+'</div><p class="hint">Ältere Sicherungen öffnest du weiterhin mit ihrem bisherigen Passwort oder Notfallschlüssel.</p>',async()=>{
  const auth=authArgs(),password=newPassword('vaultNew','vaultRepeat');
  await flushForProtection();
  try{await call('vault-change',{currentPassword:auth.password,recovery:auth.recovery,password});}
  catch(error){rejectAccess(error,auth);}
  await status();A.afterClose=()=>settingsChanged('Passwort geändert.');
 },'Passwort ändern',{size:'small',helpContext:useHelp,onClose:clearSecretForm});
 mountAuth();
 wireReveal(A.$('#dialogContent'),'vaultChangeShow',['vaultNew','vaultRepeat']);
}
function verifyKey(){
 A.modal('Notfallschlüssel prüfen','<p>Prüfe, ob du deine aktuellen Noten mit diesem Schlüssel öffnen kannst.</p><div class="vault-password-fields">'+keyField('vaultVerifyKey')+reveal('vaultVerifyShow','Notfallschlüssel anzeigen')+button('vaultVerifyRead','Schlüsseldatei öffnen','text-button')+'</div>',async()=>{
  const recovery=value('vaultVerifyKey');if(!recovery)fail('vaultVerifyKey','Gib den Notfallschlüssel ein oder öffne deine Schlüsseldatei.');
  try{await call('vault-verify',{recovery});}
  catch(error){if(error.name==='VaultAccessException')fail('vaultVerifyKey',wrongKey);throw error;}
  A.afterClose=()=>settingsChanged('Der Notfallschlüssel passt zu deinen aktuellen Noten.');
 },'Notfallschlüssel prüfen',{size:'small',helpContext:useHelp,onClose:clearSecretForm});
 mountReadKey('vaultVerifyKey','vaultVerifyRead');wireReveal(A.$('#dialogContent'),'vaultVerifyShow',['vaultVerifyKey']);
}
function disable(){
 A.modal('Passwortschutz ausschalten','<p>Danach kannst du deine aktuellen Noten und Notenlisten wieder ohne Passwort lesen. Geschützte Sicherungen brauchen weiterhin ihr Passwort oder ihren Notfallschlüssel.</p>'+authFields(),async()=>{
  const auth=authArgs();await flushForProtection();
  try{
   await A.runOperation('Passwortschutz ausschalten',async progress=>{
    progress('Deine aktuellen Noten werden wieder ohne Passwort gespeichert …');await call('vault-disable',auth);
   });
  }catch(error){if(!(await checkTransition())?.pending)rejectAccess(error,auth);throw error;}
  await status();A.afterClose=()=>{settingsChanged('Passwortschutz ausgeschaltet.');A.focusTarget('passwordProtectionTitle');};
 },'Passwortschutz ausschalten',{size:'small',helpContext:useHelp,onClose:clearSecretForm});
 mountAuth();
}
A.promptProtectedBackup=function(dataBase64,accept){
 A.modal('Geschützte Sicherung öffnen',authFields({backup:true}),async()=>{
  const auth=authArgs();
  let text;
  try{text=await call('vault-open-backup',{dataBase64,...auth});}
  catch(error){rejectAccess(error,auth,{backup:true});}
  const restored=accept(text);A.afterClose=()=>A.confirmRestore(restored);
 },'Sicherung öffnen',{size:'small',helpContext:useHelp,onClose:clearSecretForm});
 mountAuth();
};
})(globalThis.Notenblick);
