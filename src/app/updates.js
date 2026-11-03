/* Optional native updates. Preferences never enter notes or the workspace. */
(function(A){'use strict';
const current='Dein Notenblick ist aktuell.',found='Eine neue Version ist verfügbar.',failed='Die Aktualisierung konnte nicht geprüft werden. Du kannst normal weiterarbeiten.';
A.updates={enabled:false,hiddenVersion:'',offer:null,checking:false,message:'',sessionHidden:'',active:false,diagnostic:'',copyingError:false};
const validOffer=o=>o&&typeof o.version==='string'&&/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(o.version)&&Array.isArray(o.notes)&&o.notes.length>=3&&o.notes.length<=5&&o.notes.every(t=>typeof t==='string'&&t.length>=5&&t.length<=240);
A.acceptUpdateState=function(state){if(!state||typeof state.enabled!=='boolean')throw Error(failed);A.updates.enabled=state.enabled;A.updates.hiddenVersion=typeof state.hiddenVersion==='string'?state.hiddenVersion:'';A.updates.offer=validOffer(state.offer)?{version:state.offer.version,notes:[...state.offer.notes]}:null;};
A.updateSettingsHTML=()=>`<section class="update-settings" aria-labelledby="updatesTitle"><h2 id="updatesTitle">Aktualisierungen</h2><p>Installierte Version: <strong>${A.esc(A.version)}</strong></p><div class="button-row">${A.b('update-check','Aktualisierung prüfen','id="updateCheck"'+(window.NRDesktop.available?'':' disabled'))}</div><label class="check update-auto"><input id="updateAuto" type="checkbox"${A.updates.enabled?' checked':''}${window.NRDesktop.available?'':' disabled'}><span>Beim Programmstart nach Aktualisierungen suchen</span></label><p class="hint">Notenblick prüft, ob eine neue Version verfügbar ist. Deine Noten werden dabei nicht übertragen.</p><p id="updateResult" class="update-result" hidden></p><div id="updateErrorActions" class="button-row" hidden>${A.b('update-copy-error','Fehlerdetails kopieren','id="updateCopyError"')}</div><div id="updateActions" class="button-row" hidden>${A.b('update-notes','Was ist neu?')}${A.b('update-install','Jetzt aktualisieren','','button primary')}</div></section>`;
A.syncUpdateViews=function(){
 const u=A.updates,check=A.$('#updateCheck'),auto=A.$('#updateAuto'),result=A.$('#updateResult'),actions=A.$('#updateActions');
 if(check){check.disabled=u.checking||!window.NRDesktop.available;check.setAttribute('aria-busy',String(u.checking));}
 if(auto)auto.checked=u.enabled;
 if(result){result.textContent=u.checking?'Aktualisierung wird geprüft …':u.message;result.hidden=!result.textContent;}
 if(actions)actions.hidden=!u.offer;
 const errorActions=A.$('#updateErrorActions');if(errorActions)errorActions.hidden=u.checking||!u.diagnostic;
 const copy=A.$('#updateCopyError');if(copy)copy.setAttribute('aria-busy',String(u.copyingError));
 const slot=A.$('#homeUpdateSlot');if(!slot)return;
 const show=u.offer&&u.hiddenVersion!==u.offer.version&&u.sessionHidden!==u.offer.version;
 slot.hidden=!show;if(!show)return;
 if(!slot.firstElementChild)slot.innerHTML=`<section class="panel update-card" aria-labelledby="homeUpdateTitle"><h2 id="homeUpdateTitle">Aktualisierung verfügbar</h2><p id="homeUpdateVersion"></p><div class="button-row">${A.b('update-notes','Was ist neu?')}${A.b('update-install','Jetzt aktualisieren','','button primary')}${A.b('update-later','Später')}</div><label class="check"><input id="updateHide" type="checkbox"><span>Für diese Version nicht mehr anzeigen</span></label></section>`;
 slot.querySelector('#homeUpdateVersion').textContent='Notenblick '+u.offer.version+' ist verfügbar.';
 slot.querySelector('#updateHide').checked=false;
 slot.querySelector('#updateHide').onchange=async e=>{if(!e.target.checked)return;try{await A.setUpdatePreference({hiddenVersion:u.offer.version});A.focusTarget(A.$('#home h1'));}catch{e.target.checked=false;}};
};
A.mountUpdateSettings=function(){A.syncUpdateViews();const box=A.$('#updateAuto');if(box)box.onchange=()=>A.setUpdatePreference({enabled:box.checked}).catch(()=>{});};
A.mountHomeUpdate=function(){const home=A.$('#home');if(!home.querySelector('#homeUpdateSlot')){const slot=document.createElement('div');slot.id='homeUpdateSlot';slot.hidden=true;(home.querySelector('.home-grid')||home.querySelector('.program-version')).before(slot);}A.syncUpdateViews();};
A.setUpdatePreference=async function(values){try{A.acceptUpdateState(await window.NRDesktop.call('update-preferences',values));A.syncUpdateViews();}catch{A.syncUpdateViews();A.announce('Die Einstellung konnte nicht gespeichert werden. Bitte versuche es erneut.');throw Error('Die Einstellung konnte nicht gespeichert werden. Bitte versuche es erneut.');}};
A.checkUpdates=async function(automatic=false){
 const u=A.updates;if(u.checking||!window.NRDesktop.available)return;
 u.checking=true;u.diagnostic='';if(!automatic)u.message='';A.syncUpdateViews();
 try{const state=await window.NRDesktop.call('update-check',{automatic});A.acceptUpdateState(state);if(state.checked!==false){u.message=u.offer?found:current;if(!automatic||(u.offer&&A.ui.main==='home'&&!A.$('#dialog').open&&u.hiddenVersion!==u.offer.version&&u.sessionHidden!==u.offer.version))A.announce(u.message,{defer:true});}}
 catch(error){u.message=failed;u.diagnostic=typeof error.updateDiagnostic==='string'&&error.updateDiagnostic?error.updateDiagnostic:`Notenblick – Fehlerdiagnose der Aktualisierungsprüfung\nNotenblick-Version: ${A.version}\nZeitpunkt (UTC): ${new Date().toISOString()}\nFehlgeschlagener Schritt: Antwort der Windows-Programmoberfläche verarbeiten\nFehlerkategorie: Kommunikation/Antwortverarbeitung\nTechnischer Ausnahmetyp: ${/^[A-Za-z]+Error$/.test(error.name)?error.name:'Error'}\nTechnische Zusammenfassung: Keine vollständige native Fehlerdiagnose empfangen. Die Prüfung wurde nicht als erfolgreich gewertet.`;if(!automatic)A.announce(failed,{defer:true});}
 finally{u.checking=false;A.syncUpdateViews();}
};
A.copyUpdateError=async function(){
 const u=A.updates;if(!u.diagnostic||u.checking||u.copyingError)return;
 u.copyingError=true;A.syncUpdateViews();
 try{if(await window.NRDesktop.call('update-copy-error')!==true)throw Error();A.announce('Fehlerdetails kopiert.',{defer:true});}
 catch{
  if(!A.$('#dialog').open){A.modal('Fehlerdetails','<p id="updateCopyHelp">Die Fehlerdetails konnten nicht kopiert werden. Du kannst den Text hier markieren und mit Strg+C kopieren.</p><div class="field"><label for="updateErrorText">Fehlerdetails</label><textarea id="updateErrorText" rows="14" readonly spellcheck="false" aria-describedby="updateCopyHelp"></textarea></div>',null,'',{cancelLabel:'Schließen',describedBy:'updateCopyHelp'});A.$('#updateErrorText').value=u.diagnostic;}
  else A.announce('Die Fehlerdetails konnten nicht kopiert werden. Bitte schließe den Dialog und versuche es erneut.',{defer:true});
 }finally{u.copyingError=false;A.syncUpdateViews();}
};
A.initUpdates=async function(){
 if(A.updates.initialized||!window.NRDesktop.available)return;A.updates.initialized=true;
 try{A.acceptUpdateState(await window.NRDesktop.call('update-state'));A.syncUpdateViews();if(A.updates.enabled)setTimeout(()=>A.checkUpdates(true),1200);}catch{/* Starting and offline work never depend on optional updates. */}
};
A.dismissUpdate=function(){if(!A.updates.offer)return;A.updates.sessionHidden=A.updates.offer.version;A.syncUpdateViews();if(A.ui.main==='home')A.focusTarget(A.$('#home h1'));};
function options(notes){return{size:'small',cancelLabel:notes?'Schließen':'Abbrechen',onClose:()=>{if(A.updates.active)window.NRDesktop.call('update-cancel').catch(()=>{});}};}
A.updateDialog=function(notes=false){
 const o=A.updates.offer;if(!o||A.updates.active||A.$('#dialog').open||!A.canLeave())return;
 const title=notes?'Was ist neu in Notenblick '+o.version+'?':'Notenblick aktualisieren';
 A.modal(title,(notes?'<ul class="update-notes">'+o.notes.map(t=>'<li>'+A.esc(t)+'</li>').join('')+'</ul>':'<p>Notenblick '+A.esc(o.version)+' ist verfügbar.</p>')+'<p>Notenblick wird kurz geschlossen und anschließend neu geöffnet. Deine Noten und Einstellungen bleiben erhalten.</p>',A.installUpdate,'Jetzt aktualisieren',options(notes));
};
A.installUpdate=async function(){
 if(A.updates.active||!A.updates.offer)return{keepOpen:true};
 if(A.starting||A.fatalStart||!A.canLeave())throw Error('Bitte schließe zuerst deine Eingaben ab.');
 A.updates.active=true;let accepted=false;
 try{
  await A.runOperation('Notenblick aktualisieren',async(update,alive,lock,handoff)=>{
   const texts={downloading:'Aktualisierung wird heruntergeladen …',checking:'Aktualisierung wird geprüft …',installing:'Notenblick wird aktualisiert …',restarting:'Notenblick wird neu gestartet …'};
   update(texts.checking);
   const token=await window.NRDesktop.call('update-prepare',{version:A.updates.offer.version},phase=>{const[key,percent]=phase.split(':');if(texts[key])update(texts[key],percent===undefined?undefined:Number(percent),percent===undefined?undefined:100);});
   if(!alive()){await window.NRDesktop.call('update-cancel');return;}
   if(!A.canLeave()||!await A.flushForClose())throw Error('Bitte speichere zuerst deine letzten Eingaben. Die Aktualisierung wurde nicht begonnen.');
   if(!alive()){await window.NRDesktop.call('update-cancel');return;}
   lock();update(texts.installing);await window.NRDesktop.call('update-install',{token});accepted=true;handoff();update(texts.restarting);
  },{cancellable:true});return{keepOpen:true,keepBusy:accepted};
 }catch(e){if(!accepted)await window.NRDesktop.call('update-cancel').catch(()=>{});if(e.name==='AbortError')return{keepOpen:true};throw Error(e.message||'Die Aktualisierung konnte nicht abgeschlossen werden. Deine Noten sind unverändert.');}
 finally{A.updates.active=false;}
};
})(globalThis.Notenblick);
