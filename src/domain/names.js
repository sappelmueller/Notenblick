(function(N){'use strict';
N.parseNameLines=function(text,order='last-first'){
 const lines=text.split(/\r?\n/).filter(x=>x.trim());if(lines.length>10000)throw Error('Bitte übernimm höchstens 10.000 Namen auf einmal.');
 return lines.map((raw,index)=>{
  let parts,first,last,ambiguous=false;const line=raw.trim();
  if(/[;\t,]/.test(line)){
   parts=line.split(/[;\t,]/).map(x=>x.trim());if(parts.length!==2||parts.some(x=>!x))throw Error('Zeile '+(index+1)+': Bitte Vor- und Nachnamen eindeutig trennen.');
   [first,last]=order==='first-last'?parts:[parts[1],parts[0]];
  }else{
   parts=line.split(/\s+/);if(parts.length<2)throw Error('Zeile '+(index+1)+': Bitte Vor- und Nachnamen ergänzen.');
   ambiguous=parts.length>2;if(order==='first-last'){first=parts.slice(0,-1).join(' ');last=parts.at(-1);}else{last=parts[0];first=parts.slice(1).join(' ');}
  }
  if(first.length>100||last.length>100)throw Error('Ein Name in Zeile '+(index+1)+' ist zu lang.');
  return{first,last,alias:'',ambiguous,source:line};
 });
};
})(globalThis.NR=globalThis.NR||{});
