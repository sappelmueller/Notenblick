/* One exact conversion for input, saved results, key preview and every export. */
(function(N){'use strict';
const Q=N.Q,sub=(a,b)=>Q.from(a).add(Q.from(b).mul(-1));
N.POINT_KEYS={linear:'Linear',kink:'Mit Knick',custom:'Individuelle Notengrenzen'};
N.POINT_STEPS={whole:'Ganze Noten',half:'Halbe Noten',quarter:'Viertelnoten',tenth:'Zehntelnoten'};
const divisions={whole:1,half:2,quarter:4,tenth:10};
N.pointNumber=function(value){const s=String(value).trim().replace(',','.');if(!/^\d+(?:\.\d{1,4})?$/.test(s)||s.length>18)throw Error('Bitte eine Zahl mit höchstens vier Nachkommastellen eingeben.');const [a,b='']=s.split('.'),fraction=b.replace(/0+$/,'');return (a.replace(/^0+(?=\d)/,'')||'0')+(fraction?'.'+fraction:'');};
N.defaultPointKey=()=>({maximum:'',type:'linear',pass:'50',limits:['90','75','60','50','25'],step:'quarter'});
N.validatePointKey=function(input){
 if(!input||!Object.hasOwn(N.POINT_KEYS,input.type)||!Object.hasOwn(divisions,input.step))throw Error('Bitte einen gültigen Notenschlüssel und eine Notenabstufung wählen.');
 const k=N.clone(input);k.maximum=N.pointNumber(k.maximum);if(Q.from(k.maximum).cmp(0)<=0n)throw Error('Die maximale Punktzahl muss größer als 0 sein.');
 try{k.pass=N.pointNumber(k.pass??'50');if(Q.from(k.pass).cmp(0)<=0n||Q.from(k.pass).cmp(100)>=0n)throw Error('Die Grenze für Note 4 muss größer als 0 und kleiner als 100 Prozent sein.');}catch(e){if(k.type==='kink')throw e;k.pass='50';}
 try{if(!Array.isArray(k.limits)||k.limits.length!==5)throw Error('Bitte die fünf individuellen Notengrenzen angeben.');let previous=new Q(101);k.limits=k.limits.map(v=>{const s=N.pointNumber(v),q=Q.from(s);if(q.cmp(0)<=0n||q.cmp(100)>0n||q.cmp(previous)>=0n)throw Error('Notengrenzen müssen streng absteigen und zwischen mehr als 0 und 100 Prozent liegen.');previous=q;return s;});}catch(e){if(k.type==='custom')throw e;k.limits=N.defaultPointKey().limits;}
 return k;
};
N.pointValue=function(value,key){if(String(value).trim()==='')return null;const s=N.pointNumber(value),q=Q.from(s);if(q.cmp(0)<0n||q.cmp(key.maximum)>0n)throw Error('Bitte einen Wert zwischen 0 und '+key.maximum.replace('.',',')+' eingeben.');return s;};
function anchors(k){return k.type==='linear'?[[new Q(100),new Q(1)],[new Q(0),new Q(6)]]:k.type==='kink'?[[new Q(100),new Q(1)],[Q.from(k.pass),new Q(4)],[new Q(0),new Q(6)]]:[...k.limits.map((p,i)=>[Q.from(p),new Q(i+1)]),[new Q(0),new Q(6)]];}
function barriers(k){return k.type==='kink'?[[4,Q.from(k.pass)]]:k.type==='custom'?k.limits.map((p,i)=>[i+1,Q.from(p)]):[];}
function rawGrade(p,k){const list=anchors(k);if(p.cmp(list[0][0])>=0n)return new Q(1);for(let i=1;i<list.length;i++){const [hi,g]=list[i-1],[lo,h]=list[i];if(p.cmp(lo)>=0n)return g.add(sub(hi,p).mul(sub(h,g)).div(sub(hi,lo)));}return new Q(6);}
function inverse(g,k){const list=anchors(k);if(g.cmp(1)<=0n)return list[0][0];for(let i=1;i<list.length;i++){const [hi,a]=list[i-1],[lo,b]=list[i];if(g.cmp(b)<=0n)return sub(hi,sub(g,a).mul(sub(hi,lo)).div(sub(b,a)));}return new Q(0);}
N.pointGrade=function(value,input){
 const k=N.validatePointKey(input),v=N.pointValue(value,k);if(v===null)return null;const p=Q.from(v).mul(100).div(k.maximum),scale=BigInt(divisions[k.step]),raw=rawGrade(p,k).mul(new Q(scale));
 // Exactly half way: choose the higher (worse) grade. No intermediate rounding.
 let units=raw.n/raw.d;if((raw.n%raw.d)*2n>=raw.d)units++;
 for(const [g,limit]of barriers(k))if(p.cmp(limit)<0n&&units<=BigInt(g)*scale)units=BigInt(g)*scale+1n;
 units=units<scale?scale:units>6n*scale?6n*scale:units;
 return new Q(units,scale).fixed(2).replace(',','.').replace(/\.?0+$/,'');
};
N.pointGradeText=(grade,key)=>grade===null?'Noch keine Note':Q.from(grade).fixed(Math.max(key.step==='quarter'?2:key.step==='whole'?0:1,(String(grade).replace(',','.').split('.')[1]||'').length));
N.pointKeySummary=k=>k.maximum.replace('.',',')+' Punkte · '+N.POINT_KEYS[k.type]+(k.type==='kink'?' · Note 4 bei '+k.pass.replace('.',',')+' %':'')+' · '+N.POINT_STEPS[k.step];
N.pointKeyDetails=k=>[N.pointKeySummary(k),...(k.type==='custom'?k.limits.map((p,i)=>'Note '+(i+1)+' ab '+p.replace('.',',')+' %'):[]),'Genau zwischen zwei Notenstufen gilt die höhere Note. Festgelegte Mindestgrenzen gelten auch nach der Rundung.'];
N.exactPointText=function(q){let d=q.d;while(d%2n===0n)d/=2n;while(d%5n===0n)d/=5n;if(d!==1n)return q.n+'/'+q.d;let digits=0,power=1n;while(power%q.d!==0n){power*=10n;digits++;}return q.fixed(digits).replace(/(,\d*?)0+$/,'$1').replace(/,$/,'');};
N.pointBoundaries=function(input){
 const k=N.validatePointKey(input),scale=divisions[k.step],rows=[];
 for(let unit=scale;unit<=6*scale;unit++){
  const grade=new Q(unit,scale);let minimum=new Q(0),inclusive=true;
  if(unit<6*scale){minimum=inverse(grade.add(new Q(1,2*scale)),k);inclusive=false;
   for(const [g,p]of barriers(k))if(grade.cmp(g)<=0n){const cmp=p.cmp(minimum);if(cmp>=0n){minimum=p;inclusive=true;}}
  }
  rows.push({grade:grade.fixed(k.step==='quarter'?2:k.step==='whole'?0:1),minimum:minimum.mul(k.maximum).div(100),inclusive});
 }
 return rows.map((r,i)=>{const upper=i?(rows[i-1].inclusive?'unter ':'')+N.exactPointText(rows[i-1].minimum):k.maximum.replace('.',',');return {...r,range:(r.inclusive?'ab ':'mehr als ')+N.exactPointText(r.minimum)+' bis '+upper};});
};
N.isPoints=a=>a.inputMode==='points';
N.pointResult=function(a,old,value,{status=null}={}){
 const r=N.clone(old||{grade:null,status:'open',note:''}),points=N.pointValue(value,a.pointKey);r.points=points;r.calculatedGrade=points===null?null:N.pointGrade(points,a.pointKey);
 r.status=status||(points!==null?(r.status==='open'?'graded':r.status):r.status==='graded'&&!r.manualGrade?'open':r.status);
 r.grade=r.status==='graded'?(r.manualGrade??r.calculatedGrade):null;
 if(r.status==='graded'&&r.grade===null)throw Error('Bitte Punkte eingeben oder einen anderen Status wählen.');r.pointStatus=r.status;return r;
};
N.pointKeyImpact=function(a,mode,key){
 if(!['direct','points'].includes(mode))throw Error('Unbekannte Eingabeart.');if(mode==='points'&&!['exam','test','oral'].includes(a.kind))throw Error('Für diese Leistungsart ist keine Punktebewertung vorgesehen.');
 const next=N.clone(a);if(key)next.pointKey=N.validatePointKey(key);if(mode==='points'&&!next.pointKey)throw Error('Bitte den Notenschlüssel festlegen.');
 const invalid=[],changes=[];let occupied=0;next.inputMode=mode;
 for(const [sid,old]of Object.entries(a.results)){
  if(N.hasEntry(old)||old.note||old.points!=null||old.manualGrade!=null)occupied++;
  const r=N.clone(old);
  if(N.isPoints(a)&&mode==='direct'){r.pointStatus=r.status;r.grade=Object.hasOwn(r,'directGrade')?r.directGrade:r.grade;r.status=r.directStatus||(r.grade!==null?'graded':r.status==='graded'?'open':r.status);}
  if(mode==='points'){
   if(!N.isPoints(a)){r.directGrade=r.grade;r.directStatus=r.status;if(r.manualGrade===undefined&&r.points==null&&r.grade!==null)r.manualGrade=r.grade;r.status=r.pointStatus||r.status;}
   try{Object.assign(r,N.pointResult(next,r,r.points??'',{status:r.status}));}catch{invalid.push(sid);continue;}
  }
  if((r.calculatedGrade??null)!==(old.calculatedGrade??null)||r.grade!==old.grade||r.status!==old.status)changes.push(sid);next.results[sid]=r;
 }
 return {assessment:next,invalid,changes,occupied};
};
N.validatePointRecord=function(a,r){
 if(a.inputMode!==undefined&&!['direct','points'].includes(a.inputMode))throw Error('Ungültige Eingabeart.');
 if(a.pointKey){const key=N.validatePointKey(a.pointKey);if(JSON.stringify(key)!==JSON.stringify(a.pointKey))throw Error('Ungültig gespeicherter Notenschlüssel.');}
 if(N.isPoints(a)&&(!['exam','test','oral'].includes(a.kind)||!a.pointKey))throw Error('Ungültige Punktebewertung.');
 if(!r)return;
 for(const key of ['points','calculatedGrade','manualGrade','directGrade'])if(r[key]!==undefined&&r[key]!==null){if(typeof r[key]!=='string')throw Error('Punktdaten müssen als Dezimaltext gespeichert sein.');if(key==='points'){if(!a.pointKey||N.pointValue(r[key],a.pointKey)!==r[key])throw Error('Ungültige Punktzahl.');}else N.grade(r[key]);}
 for(const key of ['pointStatus','directStatus'])if(r[key]!==undefined&&!Object.hasOwn(N.STATUS,r[key]))throw Error('Ungültiger gesicherter Bewertungsstatus.');
 if(N.isPoints(a)){const expected=r.points!=null?N.pointGrade(r.points,a.pointKey):null;if((r.calculatedGrade??null)!==expected||r.grade!==(r.status==='graded'?(r.manualGrade??expected):null))throw Error('Punkte und gewertete Note stimmen nicht überein.');}
};
})(globalThis.NR=globalThis.NR||{});
