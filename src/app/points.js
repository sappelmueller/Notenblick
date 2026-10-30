/* Points extend the existing entry, dialog and live-status components. */
(function(A){'use strict';
A.suggestPointKey=function(a){const last=A.data.assessments.filter(x=>x.courseId===a.courseId&&x.pointKey).sort((x,y)=>(y.pointKeyUsedAt||y.date).localeCompare(x.pointKeyUsedAt||x.date)||y.id.localeCompare(x.id))[0];return a.pointKey?A.N.clone(a.pointKey):{...(last?A.N.clone(last.pointKey):A.N.defaultPointKey()),maximum:''};};
A.pointSettingsMarkup=function(a,p='point',inline=true){
 if(!['exam','test','oral'].includes(a.kind))return '';const k=A.suggestPointKey(a),mode=a.inputMode||'direct',field=(id,label,value,hint)=>A.field(p+id,label,value,'inputmode="decimal"','text',hint);
 return `<div class="point-settings" id="${p}Settings"><div class="field"><label for="${p}Mode">Eingabeart</label><select id="${p}Mode" aria-describedby="${p}ModeHint"${A.readonly()?' disabled':''}>${A.opt('direct','Noten direkt eingeben',mode)}${A.opt('points','Punkte mit Notenschlüssel',mode)}</select><small id="${p}ModeHint">${mode==='points'?'Gib die erreichten Punkte ein. Die Note wird automatisch berechnet.':'Gib für jeden Schüler die Note ein.'}</small></div><div id="${p}Options"${mode==='points'?'':' hidden'}><div class="form-grid">${field('Maximum','Maximal erreichbare Punkte',k.maximum,'Wie viele Punkte konnten insgesamt erreicht werden?')}<div class="field"><label for="${p}Type">Notenschlüssel</label><select id="${p}Type" aria-describedby="${p}TypeHint">${Object.entries(A.N.POINT_KEYS).map(([id,label])=>A.opt(id,label,k.type)).join('')}</select><small id="${p}TypeHint"></small></div><div id="${p}PassField">${field('Pass','Note 4 bei (%)',k.pass,'Ab diesem Punkteanteil wird mindestens die Note 4 erreicht.')}</div><fieldset class="full" id="${p}Limits"><legend>Mindestgrenzen in Prozent</legend><div class="form-grid">${k.limits.map((v,i)=>field('Limit'+i,'Note '+(i+1)+' ab (%)',v,'')).join('')}</div></fieldset><div class="field"><label for="${p}Step">Notenabstufung</label><select id="${p}Step" aria-describedby="${p}StepHint">${Object.entries(A.N.POINT_STEPS).map(([id,label])=>A.opt(id,label,k.step)).join('')}</select><small id="${p}StepHint">Wähle, wie genau die berechneten Noten abgestuft werden.</small></div></div></div>${inline?`<div class="button-row"><button type="button" class="button small" id="${p}Apply" hidden>Einstellungen übernehmen</button><button type="button" class="text-button" id="${p}Cancel">Abbrechen</button></div>`:''}</div>`;
};
A.readPointSettings=function(p='point'){
 const mode=A.val(p+'Mode');if(mode!=='points')return {mode,key:null};
 const key=A.N.validatePointKey({maximum:A.val(p+'Maximum'),type:A.val(p+'Type'),pass:A.val(p+'Pass'),limits:Array.from({length:5},(_,i)=>A.val(p+'Limit'+i)),step:A.val(p+'Step')});return {mode,key};
};
A.pointSettingsDirty=()=>{const root=A.$('#pointConfiguration');return root&&!root.hidden&&A.pointSettingsSnapshot!==JSON.stringify([...root.querySelectorAll('input,select')].map(e=>e.value));};
A.closePointSettings=function(){A.entrySession.settings=false;A.$('#pointConfiguration').hidden=true;A.error();A.rendered={};A.renderNotes();A.$('[data-action=point-settings]')?.focus();};
A.pointSummaryMarkup=function(a,editing=false){const points=A.N.isPoints(a);return (points?'<div class="point-key-summary"><p class="point-summary">'+A.esc(A.N.pointKeySummary(a.pointKey))+'</p>'+A.b('point-key','Notenschlüssel anzeigen',`data-id="${a.id}"`,'text-button'):'<div class="point-key-summary">')+(editing&&['exam','test','oral'].includes(a.kind)?A.b('point-settings',points?'Notenschlüssel ändern':'Eingabeart ändern','','text-button'):'')+'</div>';};
A.editPointSettings=function(){if(!A.canLeave())return;A.entrySession.settings=true;A.$('#pointConfiguration').hidden=false;A.pointSettingsSnapshot=JSON.stringify([...A.$('#pointConfiguration').querySelectorAll('input,select')].map(e=>e.value));A.$('#pointMode').focus();};
A.pointImpactText=impact=>`Der neue Notenschlüssel verändert die berechneten oder gewerteten Noten von ${impact.changes.length} ${impact.changes.length===1?'Schüler':'Schülern'}. Vorhandene Punkte und manuelle Festlegungen bleiben erhalten.`;
A.bindPointSettings=function(a,p='point',inline=true){
 const root=A.$('#'+p+'Settings');if(!root)return;const update=()=>{const points=A.val(p+'Mode')==='points',type=A.val(p+'Type');A.$('#'+p+'Options').hidden=!points;A.$('#'+p+'PassField').hidden=type!=='kink';A.$('#'+p+'Limits').hidden=type!=='custom';A.$('#'+p+'ModeHint').textContent=points?'Gib die erreichten Punkte ein. Die Note wird automatisch berechnet.':'Gib für jeden Schüler die Note ein.';A.$('#'+p+'TypeHint').textContent={linear:'Die Noten werden gleichmäßig zwischen 1 und 6 verteilt.',kink:'Lege fest, ab wie viel Prozent die Note 4 erreicht wird.',custom:'Bestimme selbst, ab wie viel Prozent welche Note erreicht wird.'}[type];};
 for(const el of root.querySelectorAll('input,select')){el.disabled=A.readonly();el.addEventListener('input',()=>{if(inline)A.$('#'+p+'Apply').hidden=false;});el.addEventListener('change',()=>{update();if(inline)A.$('#'+p+'Apply').hidden=false;});}update();
 if(!inline)return;A.pointSettingsSnapshot=JSON.stringify([...root.querySelectorAll('input,select')].map(e=>e.value));A.$('#'+p+'Cancel').addEventListener('click',A.closePointSettings);
 A.$('#'+p+'Apply').addEventListener('click',()=>{try{
  if(!A.canLeave({pointSettings:true}))return;A.ensureEdit();const current=A.data.assessments.find(x=>x.id===a.id),{mode,key}=A.readPointSettings(p),impact=A.N.pointKeyImpact(current,mode,key);
  if(impact.invalid.length){A.$('#'+p+'Maximum').focus();throw Error(impact.invalid.length+' gespeicherte Punktzahlen liegen über dem neuen Maximum. Bitte korrigiere zuerst diese Punkte oder erhöhe das Maximum.');}
  const commit=()=>{A.mutate(d=>{const saved=d.assessments.find(x=>x.id===a.id);if(JSON.stringify(saved)!==JSON.stringify(current))throw Error('Die Leistung wurde inzwischen geändert. Bitte erneut prüfen.');Object.assign(saved,impact.assessment);if(mode==='points')saved.pointKeyUsedAt=new Date().toISOString();},{refresh:false});A.entrySession.settings=false;root.closest('#pointConfiguration').hidden=true;A.error();A.rendered={};A.renderNotes();const target=A.$('[data-action=point-settings]');if(A.$('#dialog').open&&A.opener){A.opener.element=target;A.opener.key=A.origin(target);}else target?.focus();};
  if(mode===(current.inputMode||'direct')&&(!key||JSON.stringify(key)===JSON.stringify(current.pointKey))){A.closePointSettings();return;}
  if(impact.occupied)A.confirm('Eingabeart und Notenschlüssel ändern',A.pointImpactText(impact)+(mode==='points'&&!A.N.isPoints(current)?' Direkte vorhandene Noten bleiben als manuelle Festlegungen erhalten.':'')+' Die bisherigen Eingaben beider Eingabearten bleiben gesichert.',commit,'Übernehmen');else commit();
 }catch(e){A.error(e.message);}});
};
A.pointKeySteps=new Map();
A.pointStepLabels={'1':'Ganze Punkte','0.5':'Halbe Punkte','0.1':'Zehntelpunkte'};
A.pointTableRows=function(key,step='1'){
 const N=A.N,k=N.validatePointKey(key);if(!Object.hasOwn(A.pointStepLabels,step))throw Error('Bitte gültige Punkteschritte wählen.');
 const maximum=N.Q.from(k.maximum),increment=N.Q.from(step),units=maximum.div(increment),count=units.n/units.d;
 if(count>100000n)throw Error('Diese Tabelle ist zu umfangreich. Bitte wähle größere Punkteschritte oder prüfe die gewünschte Punktzahl im Eingabefeld.');
 const values=[maximum];for(let i=count;i>=0n;i--){const q=new N.Q(i).mul(increment);if(q.cmp(maximum)!==0n)values.push(q);}
 return values.map(q=>{const points=N.exactPointText(q);return {points,grade:N.pointGradeText(N.pointGrade(points,k),k)};});
};
A.pointKeyReport=function(a,step=A.pointKeySteps.get(a.id)||'1'){
 const c=A.getCourse(),cl=A.getClass();return A.finishReport({type:'point-key',kind:a.kind,title:'Notenschlüssel – '+a.title,subject:c.name,className:cl.name,year:A.schoolYear(A.getYear()),created:A.today(),scope:'',intro:[A.date(a.date),A.N.pointKeySummary(a.pointKey),...(a.pointKey.type==='custom'?a.pointKey.limits.map((p,i)=>'Note '+(i+1)+' ab '+p.replace('.',',')+' %'):[]),'Punkteschritte: '+A.pointStepLabels[step]],sections:[{title:'',columns:[{label:'Punkte'},{label:'Note'}],rows:A.pointTableRows(a.pointKey,step).map(r=>[A.reportCell(r.points),A.reportCell(r.grade)])}],recordIds:[a.id],studentIds:[],remarks:false,precision:2});
};
A.showPointKey=function(a){
 const html='<p class="point-summary">'+A.esc(A.N.pointKeySummary(a.pointKey))+'</p><div class="field"><label for="keyCheck">Punktzahl</label><input id="keyCheck" inputmode="decimal" autocomplete="off" aria-describedby="keyCheckResult"><p id="keyCheckResult">Noch keine Punktzahl eingegeben.</p></div><div class="field"><label for="keyStep">Punkteschritte</label><select id="keyStep">'+Object.entries(A.pointStepLabels).map(([v,l])=>A.opt(v,l,A.pointKeySteps.get(a.id)||'1')).join('')+'</select></div><div id="keyTable"></div><button type="button" class="button" id="keyPdf">Notenschlüssel als PDF speichern</button>';
 const title='Notenschlüssel – '+a.title;if(A.$('#dialog').open){A.confirmInDialog(title,'',()=>{},'','Schließen');A.$('#dialogContent').innerHTML=html;A.$('#dialogSave').hidden=true;A.setDialogSize('medium');}else A.modal(title,html,null,'Schließen',{size:'medium',focus:'keyCheck'});
 let page=0;const render=()=>{try{
  const rows=A.pointTableRows(a.pointKey,A.val('keyStep')),size=200,start=page*size;
  A.$('#keyTable').innerHTML='<div class="table-wrap"><table aria-label="Punkte und Noten"><thead><tr><th scope="col">Punkte</th><th scope="col">Note</th></tr></thead><tbody>'+rows.slice(start,start+size).map(r=>'<tr><th scope="row">'+A.esc(r.points)+'</th><td>'+A.esc(r.grade)+'</td></tr>').join('')+'</tbody></table></div>'+(rows.length>size?'<p>'+(start+1)+' bis '+Math.min(start+size,rows.length)+' von '+rows.length+' Punktwerten</p><div class="button-row"><button type="button" class="button" id="keyPrev"'+(page===0?' disabled':'')+'>Vorherige Punktwerte</button><button type="button" class="button" id="keyNext"'+(start+size>=rows.length?' disabled':'')+'>Weitere Punktwerte</button></div>':'');
  for(const[id,delta]of [['keyPrev',-1],['keyNext',1]])A.$('#'+id)?.addEventListener('click',()=>{page+=delta;render();(A.$('#'+id+':not(:disabled)')||A.$('#keyStep')).focus();});
 }catch(e){A.$('#keyTable').textContent=e.message;}};
 A.$('#keyCheck').addEventListener('keydown',e=>{if(e.key==='Enter')e.preventDefault();});
 A.$('#keyCheck').addEventListener('input',e=>{const el=e.target;try{const grade=A.N.pointGrade(el.value,a.pointKey);A.$('#keyCheckResult').textContent=grade===null?'Noch keine Punktzahl eingegeben.':'Note: '+A.N.pointGradeText(grade,a.pointKey);el.removeAttribute('aria-invalid');}catch{A.$('#keyCheckResult').textContent='Bitte einen Wert zwischen 0 und '+a.pointKey.maximum.replace('.',',')+' eingeben.';el.setAttribute('aria-invalid','true');}});
 A.$('#keyStep').addEventListener('change',()=>{A.pointKeySteps.set(a.id,A.val('keyStep'));page=0;render();});
 A.$('#keyPdf').addEventListener('click',async()=>{try{await A.exportFile({}, {},'pdf',A.pointKeyReport(a,A.val('keyStep')));}catch(e){A.$('#dialogError').textContent=e.message;A.$('#dialogError').hidden=false;}});render();A.$('#keyCheck').focus();
};
A.pointAnnouncement=function(a,r){return r.points===null||r.points===undefined?'Keine Punktebewertung.':r.points.replace('.',',')+' von '+a.pointKey.maximum.replace('.',',')+' Punkten, '+(r.grade!==null?'Note '+A.N.pointGradeText(r.grade,a.pointKey)+(r.manualGrade!=null?', manuell festgelegt':''):'berechnet Note '+A.N.pointGradeText(r.calculatedGrade,a.pointKey)+', '+A.N.STATUS[r.status])+'.';};
// Reuse the one polite live source. Focus is placed first, then its queued
// announcement is updated in the next frame; no per-cell live regions.
A.restorePointAnnouncement=function(){if(!A.pointAnnouncementHome)return;const {parent,next}=A.pointAnnouncementHome;parent.insertBefore(A.$('#announcement'),next?.parentNode===parent?next:null);A.pointAnnouncementHome=null;};
A.announcePoints=function(a,r){const text=A.pointAnnouncement(a,r);requestAnimationFrame(()=>{const live=A.$('#announcement');if(A.$('#dialog').open){if(!A.$('#dialog').contains(live)){A.pointAnnouncementHome={parent:live.parentNode,next:live.nextSibling};A.$('#dialogForm').append(live);}}else A.restorePointAnnouncement();live.setAttribute('aria-atomic','true');A.announce(text);});};
A.previewPoints=function(el){const a=A.data.assessments.find(x=>x.id===el.dataset.assessment),r=a?.results[el.dataset.student]||{},cell=A.$('#pointNote-'+el.dataset.kind+'-'+el.dataset.mode+'-'+el.dataset.student);if(!a||!cell)return;const preview=cell.querySelector('.point-preview');try{const grade=A.N.pointGrade(el.value,a.pointKey);preview.textContent=grade===null?'Noch keine Punkte':(r.manualGrade!=null?'Berechnet: ':'Berechnete Note: ')+A.N.pointGradeText(grade,a.pointKey);preview.classList.remove('point-error');}catch{preview.textContent='Bitte einen Wert zwischen 0 und '+a.pointKey.maximum.replace('.',',')+' eingeben.';preview.classList.add('point-error');}};
A.pointNoteMarkup=(a,r,sid,mode='table')=>`<span class="point-preview">${r.calculatedGrade!=null?'Berechnet: '+A.esc(A.N.pointGradeText(r.calculatedGrade,a.pointKey)):'Noch keine Punkte'}</span><span class="computed-grade">${r.manualGrade!=null?'Festgelegt: '+A.esc(A.N.pointGradeText(r.manualGrade,a.pointKey))+'<span class="secondary">Manuell festgelegt</span>':''}</span> ${A.readonly()?'':A.b('point-manual','Ändern',`id="point-manual-${a.id}-${mode}-${sid}" data-id="${a.id}" data-student="${sid}"`,'text-button')}`;
A.manualPointGrade=function(a,sid){
 A.ensureEdit();const r=a.results[sid]||{grade:null,status:'open',note:''};A.modal('Note festlegen',`<p>${A.esc(A.studentName(A.getStudent(sid)))}</p><p>${r.points!=null?A.esc(r.points.replace('.',',')+' von '+a.pointKey.maximum.replace('.',',')+' Punkten'):'Noch keine Punkte'}</p><p>Berechnet: ${A.esc(A.N.pointGradeText(r.calculatedGrade??null,a.pointKey))}</p>${A.field('manualPointGrade','Festgelegt',r.manualGrade?.replace('.',',')||r.grade?.replace('.',',')||'','inputmode="decimal"')}<button class="text-button" type="button" id="useCalculatedGrade"${r.calculatedGrade==null?' disabled':''}>Berechnete Note übernehmen</button>`,()=>{const value=A.val('manualPointGrade');const next=A.N.clone(r);next.manualGrade=value?A.N.grade(value):null;next.status=r.status==='open'?'graded':r.status;Object.assign(next,A.N.pointResult(a,next,next.points??''));A.mutate(d=>d.assessments.find(x=>x.id===a.id).results[sid]=next,{refresh:false});A.renderNotes();A.afterClose=()=>A.announcePoints(a,next);},'Übernehmen',{size:'small',focus:'manualPointGrade'});
 A.$('#useCalculatedGrade').addEventListener('click',()=>{A.$('#manualPointGrade').value='';A.submitModal();});
};
A.singleAssessmentContext=function(a){return {...A.exportContext(a.kind),type:'assessment',kind:a.kind,assessmentId:a.id};};
A.pointEntryList=a=>A.entryList(a).filter(s=>!A.N.isPoints(a)||A.matchesStudent(s,A.W().entrySearch.toLocaleLowerCase('de')));
A.bindOralPoints=function(a,old,record){
 let lastMode=A.val('oralKeyMode'),directValue=(A.N.isPoints(a)?old.directGrade??old.grade:old.grade)?.replace('.',',')||'';
 const preview=()=>{const mode=A.val('oralKeyMode'),points=mode==='points';if(mode!==lastMode){if(points)directValue=A.val('q-grade');else A.$('#q-grade').value=directValue;lastMode=mode;}A.$('#q-directField').hidden=points;A.$('#q-pointField').hidden=!points;if(!record)A.$('#q-pointStatusField').hidden=!points;if(!points)return;
  try{const {key}=A.readPointSettings('oralKey');A.$('#q-keySummary').textContent=A.N.pointKeySummary(key);const calculated=A.N.pointGrade(A.val('q-points'),key),base=A.data.assessments.find(x=>x.id===A.oralDraft?.id)||a,projected=A.N.pointKeyImpact(base,'points',key).assessment.results[A.val('oralStudent')]||old,manual=A.oralDraft?.manualEdited?(A.val('q-manual')?A.N.grade(A.val('q-manual')):null):projected.manualGrade??null;
   A.$('#q-calculated').textContent='Berechnet: '+A.N.pointGradeText(calculated,key);A.$('#q-effective').textContent=manual!=null?'Festgelegt: '+manual.replace('.',',')+' · Manuell festgelegt':'';A.$('#q-reset').disabled=calculated===null;A.$('#q-points').removeAttribute('aria-invalid');return {calculated,manual,key};
  }catch{A.$('#q-calculated').textContent=A.val('oralKeyMaximum')?'Bitte einen Wert zwischen 0 und '+A.val('oralKeyMaximum')+' eingeben und den Notenschlüssel prüfen.':'Bitte maximale Punktzahl und Notenschlüssel festlegen.';}
 };
 const snapshot=()=>({id:A.oralDraft?.id||a.id,kind:'oral',pointKey:A.readPointSettings('oralKey').key,title:A.val('q-title')||'Mündliche Note',date:A.val('q-date')||A.today()});
 const error=e=>{A.$('#dialogError').textContent=e.message;A.$('#dialogError').hidden=false;};
 A.$('#q-keyShow').addEventListener('click',()=>{try{A.showPointKey(snapshot());}catch(e){error(e);}});
 A.$('#q-keyPdf').addEventListener('click',async()=>{try{await A.exportFile({}, {}, 'pdf',A.pointKeyReport(snapshot()));}catch(e){error(e);}});
 A.updateOralPoints=preview;
 let keyValues;A.$('#oralKeyEdit').addEventListener('click',()=>{keyValues=[...A.$('#oralKeySettings').querySelectorAll('input,select')].map(el=>el.value);A.$('#oralKeyConfiguration').hidden=false;A.$('#oralKeyMode').focus();});
 A.$('#oralKeyCancel').addEventListener('click',()=>{[...A.$('#oralKeySettings').querySelectorAll('input,select')].forEach((el,i)=>el.value=keyValues[i]);A.$('#oralKeyMode').dispatchEvent(new Event('change'));A.$('#oralKeyConfiguration').hidden=true;preview();A.$('#oralKeyEdit').focus();});
 A.$('#oralKeyApply').addEventListener('click',()=>{try{const settings=A.readPointSettings('oralKey'),base=A.data.assessments.find(x=>x.id===A.oralDraft?.id)||a,impact=A.N.pointKeyImpact(base,settings.mode,settings.key);if(impact.invalid.length)throw Error('Gespeicherte Punkte liegen über dem neuen Maximum.');const apply=()=>{A.oralDraft.keyConfirmed=true;A.$('#oralKeyConfiguration').hidden=true;A.$('#oralKeyEdit').textContent=settings.mode==='points'?'Notenschlüssel ändern':'Eingabeart ändern';preview();A.$('#oralKeyEdit').focus();};if(impact.occupied&&!A.oralDraft.keyConfirmed)A.confirmInDialog('Notenschlüssel ändern',A.pointImpactText(impact),apply,'Übernehmen');else apply();}catch(e){error(e);}});

 for(const el of A.$('#oralKeySettings').querySelectorAll('input,select'))el.addEventListener('change',()=>{if(A.oralDraft)A.oralDraft.keyConfirmed=false;preview();});
 A.$('#q-points').addEventListener('input',preview);
 A.$('#q-points').addEventListener('keydown',e=>{if(e.key==='Tab'){if(!preview()){e.preventDefault();return;}A.submitModal('stay');}});
 A.$('#q-points').addEventListener('change',()=>{if(!preview())A.$('#q-points').setAttribute('aria-invalid','true');});
 A.$('#q-change').addEventListener('click',()=>{A.$('#q-manualField').hidden=false;A.$('#q-manual').focus();});
 A.$('#q-manual').addEventListener('input',()=>{if(A.oralDraft)A.oralDraft.manualEdited=true;});A.$('#q-manual').addEventListener('change',preview);
 A.$('#q-reset').addEventListener('click',()=>{A.$('#q-manual').value='';A.oralDraft.manualEdited=true;preview();A.$('#q-points').focus();});
 A.$('#q-points').addEventListener('keydown',async e=>{if(e.key!=='Enter')return;e.preventDefault();e.stopPropagation();if(!preview()){A.$('#q-points').setAttribute('aria-invalid','true');A.$('#dialogError').textContent='Bitte einen Wert zwischen 0 und '+A.val('oralKeyMaximum')+' eingeben und den Notenschlüssel prüfen.';A.$('#dialogError').hidden=false;return;}await A.submitModal(e.shiftKey?'previous':true);});
 // A captured new note keeps its original pupil even when the capture dialog
 // stays open after Tab or at the list boundary. Commit pending edits before
 // starting another pupil; reuse the same transaction and retain invalid input.
 for(const el of A.$('#dialogContent').querySelectorAll('input,select,textarea'))el.addEventListener('input',()=>{
  const draft=A.oralDraft;if(!draft)return;
  if(el.id==='oralStudent'&&A.data.assessments.some(x=>x.id===draft.id)){
   const chosen=el.value;el.value=draft.student;
   const begin=()=>{if(A.oralDraft!==draft||!draft.committed||!A.$('#dialog').open)return;A.oralDraft={id:A.N.id(),committed:false};el.value=chosen;A.$('#q-points').value='';A.$('#q-grade').value='';A.$('#q-note').value='';A.$('#q-manual').value='';A.$('#q-manualField').hidden=true;A.updateOralNext();preview();};
   if(draft.committed)begin();else A.submitModal('stay').then(begin);return;
  }
  if(draft.committed){draft.committed=false;draft.editExisting=true;}
 });

 if(A.readonly()){A.$('#q-change').disabled=true;A.$('#q-reset').disabled=true;}
 preview();
};
})(globalThis.Notenblick);
