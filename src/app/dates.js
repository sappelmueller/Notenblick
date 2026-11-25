/* Explicit native number fields avoid Chromium's incorrect German year label.
   No shadow-DOM access, patched browser resources or replacement calendar. */
(function(A){'use strict';
const dateParts=[['day','Tag',31,'einen gültigen Tag'],['month','Monat',12,'einen gültigen Monat'],['year','Jahr',9999,'ein gültiges Jahr']];
A.dateField=function(id,label,value,attrs=''){
 const [year='',month='',day='']=value.split('-'),values={day,month,year};
 return`<fieldset class="date-field field" id="${id}-group" data-date-group="${id}"><legend>${label}</legend><div class="date-parts">${dateParts.map(([key,text,max])=>`<div><label for="${id}-${key}">${text}</label><input type="number" id="${id}-${key}" data-date-id="${id}" data-date-part="${key}" value="${A.esc(values[key]?Number(values[key]):'')}" min="1" max="${max}" step="1" inputmode="numeric" autocomplete="off" ${attrs}></div>`).join('')}</div><input type="hidden" id="${id}" name="${id}" data-date-value value="${A.esc(value)}"></fieldset>`;
};
A.parseDateParts=function(values){
 for(const [key,,max,prompt] of dateParts){
  const value=Number(values[key]);
  if(!/^\d+$/.test(values[key])||value<1||value>max)return {part:key,message:'Bitte gib '+prompt+' ein.'};
 }
 const value=['year','month','day'].map((part,i)=>String(Number(values[part])).padStart(i===0?4:2,'0')).join('-');
 if(!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)return {part:'day',message:'Dieses Datum gibt es nicht. Bitte prüfe Tag, Monat und Jahr.'};
 return {value};
};
A.readDate=function(id){
 const parts=Object.fromEntries(dateParts.map(([key])=>[key,A.$('#'+id+'-'+key)]));
 const {value,part,message}=A.parseDateParts(Object.fromEntries(Object.entries(parts).map(([key,field])=>[key,field.value])));
 if(part){parts[part].setAttribute('aria-invalid','true');parts[part].focus();throw Error(message);}
 Object.values(parts).forEach(e=>e.removeAttribute('aria-invalid'));A.$('#'+id).value=value;return value;
};
document.addEventListener('input',e=>{if(e.target.dataset.datePart)e.target.removeAttribute('aria-invalid');});
document.addEventListener('keydown',e=>{const el=e.target;if(!el.dataset.datePart||!['ArrowLeft','ArrowRight'].includes(e.key))return;const keys=['day','month','year'],at=keys.indexOf(el.dataset.datePart),next=at+(e.key==='ArrowRight'?1:-1);if(keys[next]){e.preventDefault();A.$('#'+el.dataset.dateId+'-'+keys[next]).focus();}});
document.addEventListener('paste',e=>{const el=e.target;if(!el.dataset.datePart)return;const text=e.clipboardData?.getData('text').trim(),match=text?.match(/^(\d{4})-(\d{2})-(\d{2})$/)||text?.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);if(!match)return;e.preventDefault();const iso=text.includes('-'),values=iso?[match[3],match[2],match[1]]:match.slice(1);['day','month','year'].forEach((k,i)=>{const input=A.$('#'+el.dataset.dateId+'-'+k);input.value=Number(values[i]);input.removeAttribute('aria-invalid');});el.dispatchEvent(new Event('input',{bubbles:true}));});
})(globalThis.Notenblick);
