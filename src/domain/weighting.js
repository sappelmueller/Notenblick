/* Exact conversion of existing percentage models; calculation remains in evaluation.js. */
(function(N){'use strict';
// Canonical decimal text; no rounding is used to persist existing values.
N.weightText=function(q){q=N.Q.from(q);if(q.n*10000n%q.d!==0n)throw Error('Der Prozentwert benötigt mehr als vier Nachkommastellen.');return q.fixed(4).replace(',','.').replace(/0+$/,'').replace(/\.$/,'');};
N.percentText=q=>N.weightText(q).replace('.',',');
function roundedDistribution(values){
 const keys=Object.keys(values),units={},remainders=[];let sum=0n;
 for(const k of keys){const q=N.Q.from(values[k]),scaled=q.n*100n;units[k]=scaled/q.d;sum+=units[k];remainders.push({key:k,value:new N.Q(scaled%q.d,q.d)});}
 remainders.sort((a,b)=>a.value.cmp(b.value)>0n?-1:a.value.cmp(b.value)<0n?1:keys.indexOf(a.key)-keys.indexOf(b.key));
 const left=10000n-sum;if(left<0n||left>BigInt(keys.length))throw Error('Die Anteile lassen sich nicht umrechnen.');
 for(let i=0n;i<left;i++)units[remainders[Number(i)].key]++;
 return Object.fromEntries(keys.map(k=>[k,N.weightText(new N.Q(units[k],100n))]));
}
N.distributeWeights=function(ids){if(!ids.length)throw Error('Bitte mindestens einen Bereich wählen.');const unit=10000n/BigInt(ids.length),rest=10000n%BigInt(ids.length);return Object.fromEntries(ids.map((id,i)=>[id,N.weightText(new N.Q(unit+(BigInt(i)<rest?1n:0n),100n))]));};
N.convertWeights=function(weights,from,to,course=null){
 N.weightsValid(weights,{mode:from,course});if(!['direct','grouped'].includes(to))throw Error('Bitte eine Berechnungsart wählen.');
 if(from===to)return {weights:N.clone(weights),writtenIds:N.groupIds(course),exact:true,note:''};
 const ids=N.areaIds(course),inside=N.groupIds(course),values={};let overall,written=N.clone(weights.written||{}),exact=true,needsDistribution=false,note='';
 if(to==='direct'){
  for(const id of ids)values[id]=inside.includes(id)?N.Q.from(weights.overall.written).mul(weights.written[id]).div(100):N.Q.from(weights.overall[id]);overall=roundedDistribution(values);exact=ids.every(id=>N.Q.from(overall[id]).cmp(values[id])===0n);
 }else{
  const total=inside.reduce((q,id)=>q.add(weights.overall[id]),new N.Q(0));const outer={written:total,...Object.fromEntries(ids.filter(id=>!inside.includes(id)).map(id=>[id,N.Q.from(weights.overall[id])]))};overall=roundedDistribution(outer);exact=Object.keys(outer).every(id=>N.Q.from(overall[id]).cmp(outer[id])===0n);
  if(total.cmp(0)>0n){for(const id of inside)values[id]=N.Q.from(weights.overall[id]).mul(100).div(total);written=roundedDistribution(values);exact=exact&&inside.every(id=>N.Q.from(written[id]).cmp(values[id])===0n);}
  else {
   written=Object.fromEntries(inside.map(id=>[id,weights.written?.[id]||'0']));
   needsDistribution=!inside.length||inside.reduce((q,id)=>q.add(written[id]),new N.Q(0)).cmp(100)!==0n;
   note=needsDistribution?'Wähle die Bereiche der gemeinsamen Note und verteile ihre Anteile auf 100 %.':'Die ausgewählten Bereiche haben zusammen 0 %. Ihre bisherige innere Verteilung bleibt erhalten.';
  }
 }
 const next={...course,calculationMode:to,writtenIds:inside,weights:{overall,written}};
 if(!needsDistribution)N.weightsValid(next.weights,{mode:to,course:course?.areas?next:null});
 return {weights:next.weights,writtenIds:inside,exact,needsDistribution,note:exact?note:'Die umgerechneten Prozente wurden auf zwei Nachkommastellen gerundet.'};
};
})(globalThis.NR=globalThis.NR||{});
