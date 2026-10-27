(function(A){'use strict';
const previews=new Map();
A.namesInput=function(id,label='Namensliste'){previews.delete(id);return`<div class="field"><label for="${id}-order">Namensreihenfolge</label><select id="${id}-order">${A.opt('last-first','Nachname, Vorname',A.ui.nameOrder||'last-first')}${A.opt('first-last','Vorname Nachname',A.ui.nameOrder)}</select></div><div class="field"><label for="${id}">${label}</label><textarea id="${id}" rows="5" aria-describedby="${id}-hint"></textarea><small id="${id}-hint">Eine Person je Zeile. Vor- und Nachnamen mit Semikolon oder Tab trennen; einfache Namen dürfen auch durch Leerzeichen getrennt sein.</small></div>${A.b('preview-names','Vorschau',`data-prefix="${id}"`)}<div id="${id}-preview"></div>`;};
function fingerprint(id){return JSON.stringify({text:A.val(id),order:A.val(id+'-order'),source:id==='bulkNames'?A.val('bulkClass'):''});}
A.previewNames=function(id){
 const source=id==='bulkNames'?A.val('bulkClass'):'';if(source&&A.val(id))throw Error('Bitte wähle eine bisherige Klasse oder füge eine Namensliste ein.');
 const rows=source?A.sorted(A.data.students.filter(s=>s.classId===source&&!s.archived)).map(s=>({...s,ambiguous:false,source:A.studentName(s)})):A.N.parseNameLines(A.val(id),A.val(id+'-order'));
 if(!rows.length)throw Error('Bitte füge eine Namensliste ein oder wähle eine gefüllte Klasse.');
 previews.set(id,{fingerprint:fingerprint(id),rows});if(!A.setupDraft){A.ui.nameOrder=A.val(id+'-order');A.remember();}
 A.$('#'+id+'-preview').innerHTML=`<h3 id="${id}-preview-title">Erkannte Namen (${rows.length})</h3><p class="hint">Prüfe die Zuordnung. Du kannst alle Namen vor dem Übernehmen korrigieren.</p><div class="table-wrap"><table aria-labelledby="${id}-preview-title"><thead><tr><th scope="col">Nr.</th><th scope="col">Vorname</th><th scope="col">Nachname</th><th scope="col">Prüfung</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><th scope="row">${i+1}</th><td>${A.field(id+'-first-'+i,'Vorname, Zeile '+(i+1),r.first,'maxlength="100"')}</td><td>${A.field(id+'-last-'+i,'Nachname, Zeile '+(i+1),r.last,'maxlength="100"')}</td><td>${r.ambiguous?`<label class="check"><input type="checkbox" id="${id}-checked-${i}">Mehrteiligen Namen geprüft</label>`:'Eindeutig getrennt'}</td></tr>`).join('')}</tbody></table></div>`;
 if(!A.restoringNames)A.$('#'+id+'-first-0')?.focus();
};
A.captureNamesDraft=function(id){const preview=previews.get(id);return{text:A.val(id),order:A.val(id+'-order'),preview:preview&&preview.fingerprint===fingerprint(id)?{...preview,values:preview.rows.map((r,i)=>({first:A.val(id+'-first-'+i),last:A.val(id+'-last-'+i),checked:!!A.$('#'+id+'-checked-'+i)?.checked}))}:null};};
A.restoreNamesDraft=function(id,state){if(!state)return;A.$('#'+id).value=state.text;A.$('#'+id+'-order').value=state.order;if(state.preview){A.restoringNames=true;try{A.previewNames(id);state.preview.values.forEach((r,i)=>{A.$('#'+id+'-first-'+i).value=r.first;A.$('#'+id+'-last-'+i).value=r.last;if(A.$('#'+id+'-checked-'+i))A.$('#'+id+'-checked-'+i).checked=r.checked;});}finally{A.restoringNames=false;}}};
A.readNames=function(id,optional=false){
 if(optional&&!A.val(id))return[];const preview=previews.get(id);if(!preview||preview.fingerprint!==fingerprint(id))throw Error('Bitte öffne zuerst die Vorschau der aktuellen Namensliste.');
 return preview.rows.map((r,i)=>{if(r.ambiguous&&!A.$('#'+id+'-checked-'+i).checked)throw Error('Bitte prüfe den mehrteiligen Namen in Zeile '+(i+1)+' und bestätige die Zuordnung.');return{first:A.required(id+'-first-'+i,'den Vornamen in Zeile '+(i+1)),last:A.required(id+'-last-'+i,'den Nachnamen in Zeile '+(i+1)),alias:r.alias||''};});
};
})(globalThis.Notenblick);
