/* Abschlussnoten use the existing exact calculation. No displayed average is rounded twice. */
(function(N){'use strict';
N.FINAL_TYPES={information:'Halbjahresinformation',certificate:'Halbjahreszeugnis',annual:'Zeugnisnote'};
N.schoolYearRange=function(y){
 if(!y)return null;const m=String(y.label).match(/^(?:Schuljahr\s+)?(\d{4})\s*[\/–-]\s*(\d{2}|\d{4})$/i);let start=y.startYear;
 if(m){const parsed=Number(m[1]);if(Number(m[2])===(m[2].length===2?(parsed+1)%100:parsed+1))start=parsed;}
 if(!Number.isInteger(start)||start<1900||start>9998)return null;
 return {start:start+'-08-01',halfEnd:(start+1)+'-01-31',end:(start+1)+'-07-31'};
};
N.courseRange=(d,c)=>N.schoolYearRange(d.years.find(y=>y.id===d.classes.find(cl=>cl.id===c?.classId)?.yearId));
N.datePeriod=function(d,c,date){const r=N.courseRange(d,c);return !r||!date||date<r.start||date>r.end?null:date<=r.halfEnd?'1':'2';};
N.halfType=(d,c)=>d.classes.find(cl=>cl.id===c?.classId)?.halfYearReport||'information';
N.finalType=(d,c,period)=>period==='half'?N.halfType(d,c):'annual';
N.finalLabel=(d,c,period)=>N.FINAL_TYPES[N.finalType(d,c,period)];
N.isHalfFinal=f=>f.period==='1'&&['information','certificate'].includes(f.reportType);
const indexes=new WeakMap();
N.finalFor=function(d,cid,sid,period='annual'){
 let x=indexes.get(d);if(!x||x.ref!==d.finals||x.length!==d.finals.length){x={ref:d.finals,length:d.finals.length,values:new Map()};for(const f of d.finals){const p=f.period==='all'?'annual':N.isHalfFinal(f)?'half':null;if(p)x.values.set(f.courseId+'|'+f.studentId+'|'+p,f);}indexes.set(d,x);}return x.values.get(cid+'|'+sid+'|'+period)||null;
};
N.finalGrade=function(value,type){if(!Object.hasOwn(N.FINAL_TYPES,type))throw Error('Unbekannte Zeugnisart.');const g=N.grade(value),q=N.Q.from(g),step=type==='information'?4n:1n;if(q.n*step%q.d!==0n)throw Error(type==='information'?'Bitte eine Viertelnote von 1,00 bis 6,00 wählen.':'Bitte eine ganze Note von 1 bis 6 wählen.');return g;};
N.finalText=function(value,type='annual',spoken=false){if(value===null||value===undefined||value==='')return '–';if(type!=='information')return String(value).replace('.',',');const q=N.Q.from(value);if(q.n*4n%q.d!==0n)return String(value).replace('.',',');const n=Number(q.n*4n/q.d),part=n%4,tendency=part===1?Math.floor(n/4)+(spoken?' minus':'−'):part===3?Math.ceil(n/4)+(spoken?' plus':'+'):'';return q.fixed(2).replace('.',',')+(tendency?(spoken?' – ':' (')+tendency+(spoken?'':')'):'');};
// Nearest quarter/integer; an exact tie goes to the higher numeric (weaker) grade.
N.finalSuggestion=function(average,type){if(average===null||average===undefined)return null;const q=N.Q.from(average),step=type==='information'?4n:1n,scaled=q.n*step,rounded=scaled/q.d+(scaled%q.d*2n>=q.d?1n:0n);return N.finalGrade(String(Number(rounded)/Number(step)),type);};
N.finalBasis=function(d,c,sid,period='annual'){
 const type=N.finalType(d,c,period),range=N.courseRange(d,c),calc=N.calculate(d,c,sid,period==='half'?'1':'year'),orientation=period==='annual'&&N.halfType(d,c)==='certificate';
 const reason=!range?'Der Beginn des Schuljahres ist noch nicht eindeutig festgelegt.':calc.blocked?'Bitte zuerst den ungeklärten Altbestand prüfen.':orientation?'Der Jahresdurchschnitt dient nur der Orientierung. Die endgültige Abschlussnote wird manuell festgelegt; Prüfungsleistungen und besondere Abschlussregeln sind hier nicht berechnet.':'';
 return {type,range,average:calc.total,suggestion:orientation||calc.blocked||!range?null:N.finalSuggestion(calc.total,type),orientation,reason,missing:calc.missing};
};
N.finalConflict=function(f,type){if(!f)return false;if(f.reportType&&f.reportType!==type)return true;try{N.finalGrade(f.grade,type);return false;}catch{return true;}};
N.setFinal=function(d,c,sid,period,grade,note='',{remove=false}={}){
 if(!['half','annual'].includes(period)||!c||!c.studentIds.includes(sid))throw Error('Ungültige Zuordnung der Abschlussnote.');const cl=d.classes.find(x=>x.id===c.classId),year=d.years.find(x=>x.id===cl?.yearId);if(c.archived||cl?.archived||year?.archived)throw Error('Bitte das Schuljahr, die Klasse und das Fach zuerst wieder öffnen.');
 const prior=N.finalFor(d,c.id,sid,period),type=N.finalType(d,c,period);
 if(grade===null){if(prior&&!remove)throw Error('Bitte das Entfernen der festgelegten Note bestätigen.');if(prior)d.finals=d.finals.filter(x=>x.id!==prior.id);return;}
 grade=N.finalGrade(grade,type);if(typeof note!=='string'||note.length>2000)throw Error('Die Bemerkung ist zu lang.');if(prior&&prior.grade===grade&&prior.note===note&&!N.finalConflict(prior,type))return;
 const b=N.finalBasis(d,c,sid,period);if(!b.range)throw Error(b.reason);
 const f={id:prior?.id||N.id(),courseId:c.id,studentId:sid,classId:cl.id,yearId:year.id,period:period==='half'?'1':'all',reportType:type,grade,note,decidedAt:new Date().toISOString(),referenceStart:b.range.start,referenceEnd:period==='half'?b.range.halfEnd:b.range.end,averageAtDecision:b.average?{n:String(b.average.n),d:String(b.average.d)}:null};
 if(prior)d.finals=d.finals.map(x=>x.id===prior.id?f:x);else d.finals.push(f);
};
N.finalAverage=f=>f?.averageAtDecision?new N.Q(BigInt(f.averageAtDecision.n),BigInt(f.averageAtDecision.d)):null;
})(globalThis.NR=globalThis.NR||{});
