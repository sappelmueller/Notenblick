/* Exact conversion of existing percentage models; calculation remains in evaluation.js. */
(function(N){'use strict';
// Canonical decimal text; no rounding is used to persist existing values.
N.weightText=function(q){q=N.Q.from(q);if(q.n*10000n%q.d!==0n)throw Error('Der Prozentwert benötigt mehr als vier Nachkommastellen.');return q.fixed(4).replace(',','.').replace(/0+$/,'').replace(/\.$/,'');};
N.percentText=q=>N.weightText(q).replace('.',',');
function roundedDistribution(values){
 const keys=Object.keys(values),units={},remainders=[];let sum=0n;
 for(const k of keys){const q=N.Q.from(values[k]),scaled=q.n*10000n;units[k]=scaled/q.d;sum+=units[k];remainders.push({key:k,value:new N.Q(scaled%q.d,q.d)});}
 remainders.sort((a,b)=>a.value.cmp(b.value)>0n?-1:a.value.cmp(b.value)<0n?1:keys.indexOf(a.key)-keys.indexOf(b.key));
 const left=1000000n-sum;if(left<0n||left>BigInt(keys.length))throw Error('Die Anteile lassen sich nicht umrechnen.');
 for(let i=0n;i<left;i++)units[remainders[Number(i)].key]++;
 return Object.fromEntries(keys.map(k=>[k,N.weightText(new N.Q(units[k],10000n))]));
}
N.convertWeights=function(weights,from,to){
 N.weightsValid(weights,{mode:from});if(!['grouped','direct'].includes(to))throw Error('Bitte eine Berechnungsart wählen.');
 if(from===to)return {weights:N.clone(weights),exact:true,note:''};
 let values,overall,written=N.clone(weights.written),exact=true,note='';
 if(to==='direct'){
  values=Object.fromEntries(Object.keys(N.KINDS).map(k=>[k,['exam','test'].includes(k)?N.Q.from(weights.overall.written).mul(N.Q.from(weights.written[k])).div(100):N.Q.from(weights.overall[k])]));
  overall=roundedDistribution(values);exact=Object.keys(values).every(k=>N.Q.from(overall[k]).cmp(values[k])===0n);
 }else{
  const total=N.Q.from(weights.overall.exam).add(N.Q.from(weights.overall.test));
  overall={written:N.weightText(total),oral:weights.overall.oral,homework:weights.overall.homework,notebook:weights.overall.notebook};
  if(total.cmp(0)>0n){values={exam:N.Q.from(weights.overall.exam).mul(100).div(total),test:N.Q.from(weights.overall.test).mul(100).div(total)};written=roundedDistribution(values);exact=Object.keys(values).every(k=>N.Q.from(written[k]).cmp(values[k])===0n);}
  else note='Klassenarbeiten und Tests haben zusammen 0 %. Die bisherige Verteilung innerhalb der schriftlichen Note bleibt erhalten.';
 }
 const result={overall,written};N.weightsValid(result,{mode:to});return {weights:result,exact,note};
};
})(globalThis.NR=globalThis.NR||{});
