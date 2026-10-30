'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),N=require('../src/core.js');
const out=path.join(__dirname,'exports/v1211'),checks=[];let ctx,A;
(async()=>{
 fs.mkdirSync(out,{recursive:true});ctx=await require('./load.cjs').load({beforeParse:w=>w.Blob=Blob,cache:new Map()});A=ctx.q;
 const data=require('./v1210-fixture.cjs')(N);A.data=ctx.w.NR.clone(data);A.mode='demo';A.normalizeContext();A.courseNotes(data.courses[0].id);
 const before=JSON.stringify(A.data);let values=0;
 for(const maximum of ['25','37','43','37.5','0.125'])for(const type of Object.keys(N.POINT_KEYS))for(const step of Object.keys(N.POINT_STEPS))for(const increment of ['1','0.5','0.1']){
  const key={...N.defaultPointKey(),maximum,type,step},rows=A.pointTableRows(key,increment);
  assert.equal(rows[0].points,maximum.replace('.',','));assert.equal(rows.at(-1).points,'0');let previous=N.Q.from(maximum).add(1);
  for(const row of rows){assert.ok(N.Q.from(row.points).cmp(previous)<0n);previous=N.Q.from(row.points);assert.equal(row.grade,N.pointGradeText(N.pointGrade(row.points,key),key));assert.doesNotMatch(row.points,/mehr als|unter|\//);values++;}
 }
 assert.equal(JSON.stringify(A.data),before);checks.push(values+' Tabellenwerte: zwölf Schlüssel-/Notenstufenkombinationen, drei Punkteschritte und fünf Maxima einschließlich Dezimalmaxima; ausschließlich zentrale exakte Umrechnung, keine Datenänderung');
 const fonts=['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(n=>new ctx.w.Uint8Array(fs.readFileSync(path.join(__dirname,'../src/fonts',n)))),pdf=A.reportPdf;A.reportPdf=r=>pdf(r,{fonts});
 const reports=[];
 async function save(name,report){for(const format of ['txt','csv','docx','xlsx','pdf']){const value=await A.renderReportFile(report,format);fs.writeFileSync(path.join(out,name+'.'+format),typeof value==='string'?value:Buffer.from(value));}reports.push({name,report,layout:A.reportLayout(report)});}
 for(const a of A.data.assessments){const report=A.buildReport(A.singleAssessmentContext(a),{scope:'all',remarks:true}),s=report.sections[0];assert.equal(s.title,'');assert.equal(A.reportDateLine(report),'');if(N.isPoints(a)){const col=s.columns.findIndex(c=>c.label==='Punkte');for(const row of s.rows)assert.doesNotMatch(row[col].text,/von/);if(s.footer)assert.deepEqual(N.clone(s.footer[col]),{text:'',blank:true});}await save(a.id,report);}
 for(const increment of ['1','0.5','0.1']){const a={...A.data.assessments[1],pointKey:{...A.data.assessments[1].pointKey,maximum:'25.5',type:'linear',step:'tenth'}},report=A.pointKeyReport(a,increment);assert.equal(report.sections[0].columns.map(c=>c.label).join(','),'Punkte,Note');assert.doesNotMatch(JSON.stringify(report),/Brüche|Mehr als|Geltende Grenzen/);await save('key-'+increment,report);}
 const sample=N.clone(A.data.assessments[1]);sample.title='Test 1';sample.date='2026-10-30';sample.pointKey={...N.defaultPointKey(),maximum:'25',type:'linear',step:'tenth'};sample.results={};for(const [i,sid]of data.courses[0].studentIds.entries())sample.results[sid]=N.pointResult(sample,{grade:null,status:'open',note:''},['25','17.5','20','12','2','18.5'][i]);const sampleData={...A.data,assessments:[sample]},sampleReport=A.buildReport({...A.singleAssessmentContext(sample),data:sampleData},{scope:'all',remarks:true});sampleReport.className='6ac';assert.equal(sampleReport.sections[0].columns.map(c=>c.label).join(','),'Schüler,Punkte,Note');assert.equal(sampleReport.sections[0].footer.at(-1).text,'2,83');await save('reference-style',sampleReport);
 const context=A.singleAssessmentContext(A.data.assessments[0]);assert.equal(A.buildReport(context,{scope:'current'}).scope,'');context.w.entrySearch='Anna';assert.match(A.buildReport(context,{scope:'current'}).scope,/Auswahl: 1 von/);
 checks.push('Neun echte Berichte in fünf Formaten; kurze Punkte, eine Leistungstabelle, bewusst leere Durchschnittszelle, kein doppelter Datumsblock, Filterhinweis nur bei tatsächlicher Einschränkung');
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({reports}));await A.workspacePromise;await new Promise(r=>setTimeout(r,40));assert.deepEqual(ctx.errors,[]);ctx.w.close();fs.writeFileSync(path.join(__dirname,'v1211-results.json'),JSON.stringify({checks,values,syntheticOnly:true,windows:false,nvda:false},null,2));console.log('1.21.1:',checks.length,'Gruppen;',values,'Tabellenwerte;',reports.length,'Berichte');
})().catch(async e=>{console.error(e);await A?.workspacePromise;ctx?.w.close();process.exitCode=1;});
