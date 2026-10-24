/* Explicit native number fields avoid Chromium's incorrect German year label.
   No shadow-DOM access, patched browser resources or replacement calendar. */
(function(A){'use strict';
A.dateField=function(id,label,value,attrs=''){
 const [year='',month='',day='']=value.split('-');return`<fieldset class="date-field field" id="${id}-group" data-date-group="${id}"><legend>${label}</legend><div class="date-parts">${[['day','Tag',day,1,31],['month','Monat',month,1,12],['year','Jahr',year,1,9999]].map(([key,text,v,min,max])=>`<div><label for="${id}-${key}">${text}</label><input type="number" id="${id}-${key}" data-date-id="${id}" data-date-part="${key}" value="${A.esc(v?Number(v):'')}" min="${min}" max="${max}" step="1" inputmode="numeric" autocomplete="off" ${attrs}></div>`).join('')}</div><input type="hidden" id="${id}" name="${id}" data-date-value value="${A.esc(value)}"></fieldset>`;
};
A.readDate=function(id){
 const parts=['day','month','year'].map(k=>A.$('#'+id+'-'+k)),nums=parts.map(e=>Number(e.value));
 const fail=(at,message)=>{parts[at].setAttribute('aria-invalid','true');parts[at].focus();throw Error(message);};
 for(let i=0;i<3;i++)if(!parts[i].value||!Number.isInteger(nums[i])||nums[i]<Number(parts[i].min)||nums[i]>Number(parts[i].max))fail(i,'Bitte '+['einen gültigen Tag','einen gültigen Monat','ein gültiges Jahr'][i]+' eingeben.');
 const value=String(nums[2]).padStart(4,'0')+'-'+String(nums[1]).padStart(2,'0')+'-'+String(nums[0]).padStart(2,'0');
 if(!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)fail(0,'Dieses Datum gibt es nicht. Bitte prüfe Tag, Monat und Jahr.');
 parts.forEach(e=>e.removeAttribute('aria-invalid'));A.$('#'+id).value=value;return value;
};
document.addEventListener('input',e=>{if(e.target.dataset.datePart)e.target.removeAttribute('aria-invalid');});
document.addEventListener('keydown',e=>{const el=e.target;if(!el.dataset.datePart||!['ArrowLeft','ArrowRight'].includes(e.key))return;const keys=['day','month','year'],at=keys.indexOf(el.dataset.datePart),next=at+(e.key==='ArrowRight'?1:-1);if(keys[next]){e.preventDefault();A.$('#'+el.dataset.dateId+'-'+keys[next]).focus();}});
document.addEventListener('paste',e=>{const el=e.target;if(!el.dataset.datePart)return;const text=e.clipboardData?.getData('text').trim(),match=text?.match(/^(\d{4})-(\d{2})-(\d{2})$/)||text?.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);if(!match)return;e.preventDefault();const iso=text.includes('-'),values=iso?[match[3],match[2],match[1]]:match.slice(1);['day','month','year'].forEach((k,i)=>{const input=A.$('#'+el.dataset.dateId+'-'+k);input.value=Number(values[i]);input.removeAttribute('aria-invalid');});});
})(globalThis.Notenblick);
