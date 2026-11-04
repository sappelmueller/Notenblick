'use strict';
// Tiny independent checks of the exact section receipt implementation used by
// large.cjs. No real grade/stress test runs here.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),{create}=require('./checkpoints.cjs');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'nb-sections-')),key='a'.repeat(64);let calls=0;
try{
  const probe=create({directory,key});
  for(let i=0;i<4;i++)probe.section('part'+i,{value:i},3,()=>{calls++;return 3;});
  assert.deepEqual(probe.stats,{executed:4,reused:0,cases:12});
  const resumed=create({directory,key});
  for(let i=0;i<4;i++)resumed.section('part'+i,{value:i},3,()=>{throw Error('must reuse');});
  assert.deepEqual(resumed.stats,{executed:0,reused:4,cases:12});
  const broken=path.join(directory,key,'part1.json');fs.writeFileSync(broken,'{partial');
  const changed=create({directory,key});
  for(let i=0;i<4;i++)changed.section('part'+i,{value:i===2?'changed':i},3,()=>{calls++;return 3;});
  assert.deepEqual(changed.stats,{executed:2,reused:2,cases:12});
  const other=create({directory,key:'b'.repeat(64)});other.section('part0',{value:0},3,()=>{calls++;return 3;});assert.equal(other.stats.executed,1);
  const forged=JSON.parse(fs.readFileSync(path.join(directory,key,'part0.json')));forged.passed=999;fs.writeFileSync(path.join(directory,key,'part0.json'),JSON.stringify(forged));
  changed.section('part0',{value:0},3,()=>{calls++;return 3;});
  assert.throws(()=>changed.section('failed',{},3,()=>2),/Incomplete/);assert.equal(fs.existsSync(path.join(directory,key,'failed.json')),false);
  // A separate process exits abruptly after two sections, without finally.
  const helper=path.join(__dirname,'checkpoints.cjs');const crashKey='c'.repeat(64);
  const child=spawnSync(process.execPath,['-e',`const p=require(${JSON.stringify(helper)}).create({directory:${JSON.stringify(directory)},key:${JSON.stringify(crashKey)}});for(let i=0;i<2;i++)p.section('part'+i,{i},2,()=>2);process.exit(23);`]);
  assert.equal(child.status,23);const afterCrash=create({directory,key:crashKey});
  for(let i=0;i<4;i++)afterCrash.section('part'+i,{i},2,()=>2);
  assert.deepEqual(afterCrash.stats,{executed:2,reused:2,cases:8});
  const forced=create({directory,key:crashKey,reuse:false});assert.throws(()=>forced.section('part0',{i:0},2,()=>{throw Error('failure');}),/failure/);
  assert.equal(fs.existsSync(path.join(directory,crashKey,'part0.json')),false);
  console.log('Checkpoint controls: reuse, input changes, corruption, incomplete counts, process interruption and forced failure passed.');
}finally{fs.rmSync(directory,{recursive:true,force:true});}
