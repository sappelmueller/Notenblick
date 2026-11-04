'use strict';
// Test-only durable receipts. A section is committed only after its real
// assertions return the exact expected case count. No application code uses it.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
exports.create=function({directory,key,reuse=true}){
  if(!/^[a-f0-9]{64}$/.test(key))throw Error('Invalid checkpoint key');
  const folder=path.join(directory,key),stats={executed:0,reused:0,cases:0};
  fs.mkdirSync(folder,{recursive:true});
  return {stats,section(id,input,expected,action){
    if(!/^[a-zA-Z0-9_-]+$/.test(id)||!Number.isSafeInteger(expected)||expected<1)throw Error('Invalid checkpoint section');
    const file=path.join(folder,id+'.json'),inputHash=hash(input);let old;
    try{old=JSON.parse(fs.readFileSync(file,'utf8'));}catch{}
    const body={schema:1,key,id,inputHash,passed:expected};
    if(reuse&&old&&hash(body)===old.seal&&Object.keys(old).length===6&&Object.keys(body).every(k=>old[k]===body[k])){stats.reused++;stats.cases+=expected;return;}
    // A failed forced rerun cannot expose an older success.
    fs.rmSync(file,{force:true});
    const passed=action();
    if(passed!==expected)throw Error('Incomplete checkpoint '+id+': '+passed+' / '+expected);
    const staging=file+'.'+process.pid+'.tmp';let fd;
    try{fd=fs.openSync(staging,'w');fs.writeFileSync(fd,JSON.stringify({...body,seal:hash(body)}));fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(staging,file);}
    finally{if(fd!==undefined)fs.closeSync(fd);fs.rmSync(staging,{force:true});}
    stats.executed++;stats.cases+=passed;
  }};
};
