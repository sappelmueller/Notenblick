/* Course-owned areas. Names never identify records or affect arithmetic. */
(function(N){'use strict';
N.newAreas=()=>['exam','test','oral'].map(id=>({id,name:N.KINDS[id],...(id==='oral'?{role:'oral'}:{})}));
N.areas=c=>c?.areas||Object.entries(N.KINDS).map(([id,name])=>({id,name,...(id==='oral'?{role:'oral'}:{})}));
N.areaIds=c=>N.areas(c).map(a=>a.id);
N.areaLabels=c=>Object.fromEntries(N.areas(c).map(a=>[a.id,a.name]));
N.areaLabel=(c,id)=>id==='written'?(c?.writtenName||'Schriftlich'):N.areaLabels(c)[id]||'Leistungsbereich';
N.oralArea=c=>N.areas(c).find(a=>a.role==='oral')?.id||'oral';
N.groupIds=c=>c?.writtenIds||['exam','test'].filter(id=>N.areaIds(c).includes(id));
N.localWeight=(c,id)=>N.Q.from((N.courseMode(c)==='grouped'&&N.groupIds(c).includes(id)?c.weights.written[id]:c.weights.overall[id])||'0');
N.areaUsed=(d,cid,id)=>d.assessments.some(a=>a.courseId===cid&&a.kind===id);
N.visibleAreas=(c,d)=>N.areas(c).filter(a=>!(a.hidden||!c.areas&&['homework','notebook'].includes(a.id))||N.areaUsed(d,c.id,a.id)||N.localWeight(c,a.id).cmp(0)>0n);
N.validateAreas=function(c){
 const list=N.areas(c),seen=new Set(),names=new Set();let oral=0;
 if(!Array.isArray(list)||!list.length||list.length>1000)throw Error('Bitte mindestens einen Leistungsbereich anlegen.');
 for(const a of list){
  if(!a||typeof a.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(a.id)||['written','__proto__','constructor','prototype','overview','pupil','assessments'].includes(a.id)||seen.has(a.id))throw Error('Die Leistungsbereiche sind nicht eindeutig zugeordnet.');seen.add(a.id);
  if(typeof a.name!=='string'||!a.name.trim()||a.name!==a.name.trim()||a.name.length>80||/[\u0000-\u001f\u007f]/.test(a.name))throw Error('Bitte einen Bereichsnamen mit höchstens 80 Zeichen eingeben.');
  const key=a.name.normalize('NFKC').toLocaleLowerCase('de');if(names.has(key))throw Error('Diesen Bereichsnamen gibt es im Fach bereits.');names.add(key);
  if(a.role!==undefined&&a.role!=='oral')throw Error('Unbekannte Funktion des Leistungsbereichs.');if(a.role==='oral'){if(a.id!=='oral')throw Error('Die ursprüngliche mündliche Zuordnung muss erhalten bleiben.');oral++;}
  if(a.hidden!==undefined&&typeof a.hidden!=='boolean')throw Error('Ungültige Bereichsansicht.');
 }
 if(oral!==1)throw Error('Der ursprüngliche Bereich für mündliche Noten muss erhalten bleiben.');
 const ids=N.groupIds(c);if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!seen.has(id)))throw Error('Bitte gültige Bereiche für die gemeinsame Note wählen.');
 if(c.writtenName!==undefined&&(typeof c.writtenName!=='string'||!c.writtenName.trim()||c.writtenName.length>80||/[\u0000-\u001f\u007f]/.test(c.writtenName)))throw Error('Bitte einen kurzen Namen für die gemeinsame Note eingeben.');
 if(N.courseMode(c)==='grouped'&&names.has(N.areaLabel(c,'written').normalize('NFKC').toLocaleLowerCase('de')))throw Error('Die gemeinsame Note braucht einen anderen Namen als die Leistungsbereiche.');
 return true;
};
N.areaConfig=c=>({areas:N.clone(N.areas(c)),writtenIds:[...N.groupIds(c)],writtenName:c.writtenName||'Schriftlich',calculationMode:N.courseMode(c),weights:N.clone(c.weights),precision:c.precision,rounding:c.rounding});
N.applyAreaConfig=function(d,cid,config,transfers={}){
 const c=d.courses.find(c=>c.id===cid);if(!c)throw Error('Das Fach ist nicht mehr vorhanden.');
 N.validateAreas(config);N.weightsValid(config.weights,{mode:N.courseMode(config),course:config});
 if(N.oralArea(c)!==N.oralArea(config))throw Error('Der ursprüngliche Bereich für mündliche Noten bleibt erhalten.');
 const ids=new Set(N.areaIds(config));
 const records=d.assessments.filter(a=>a.courseId===cid),assignments=records.map(a=>[a,Object.hasOwn(transfers,a.kind)?transfers[a.kind]:a.kind]);
 for(const [,id]of assignments)if(!ids.has(id))throw Error('Bitte zuerst alle Leistungen einem vorhandenen Bereich zuordnen.');
 for(const [a,id]of assignments)if(id!==a.kind){if(a.kind===N.oralArea(c)&&!a.oralEntry)a.oralEntry='unclassified';a.kind=id;}
 const archive=d.legacyOther?.courses?.find(x=>x.courseId===cid);if(archive&&!archive.written)archive.written=N.clone(c.weights.written);
 Object.assign(c,N.clone(config));return c;
};
N.areaProjection=(d,cid,config,transfers)=>{const next=N.clone(d);N.applyAreaConfig(next,cid,config,transfers);return N.validate(next);};
})(globalThis.NR=globalThis.NR||{});
