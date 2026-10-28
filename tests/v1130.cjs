'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'exports/v1130'),checks=[],documents=[];let w,A;
fs.mkdirSync(out,{recursive:true});
(async()=>{
 ({w,q:A}=await require('./load.cjs').load());const N=A.N,fixture=require('./v1130-fixture.cjs');
 const install=(count=8)=>{A.data=fixture(N,count);A.normalizeContext();A.W().columns=['exam','test','written','oral'];A.refreshCurrent();return A.getCourse();};
 const fonts=['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(name=>new w.Uint8Array(fs.readFileSync(path.join(__dirname,'../src/fonts',name))));
 const plain=v=>JSON.parse(JSON.stringify(v)),show=(v,c)=>v===null?'–':N.show(v,c);
 async function write(name,r){for(const [ext,value]of [['json',JSON.stringify(r)],['docx',A.reportDocx(r)],['xlsx',A.reportXlsx(r)],['txt',A.reportText(r)],['csv',A.reportCSV(r)]])fs.writeFileSync(path.join(out,name+'.'+ext),typeof value==='string'?value:Buffer.from(value));fs.writeFileSync(path.join(out,name+'.pdf'),Buffer.from(await A.reportPdf(r,{fonts})));documents.push(name);}
 let c=install(),original=JSON.stringify(A.data),view=JSON.stringify(A.getWorkspace());
 const active=N.activeStudents(A.data,c),manual=N.average(active.map(s=>({value:N.calculate(A.data,c,s.id).total}))),means=A.classAverages(c);
 assert.equal(means.total.cmp(manual),0n);
 assert.equal(A.classAverages(c).categories.notebook,null);assert.equal(A.calculation(c,c.studentIds[3]).total,null);
 const allPeople=N.average(N.activeStudents(A.data,c,true).map(s=>({value:N.calculate(A.data,c,s.id).total})));
 assert.notEqual(allPeople.cmp(manual),0n,'fixture must distinguish former pupils');
 let footer;
 for(const search of ['', 'P000', 'Kein Treffer'])for(const scope of ['current','all']){
  A.W().search=search;const r=A.buildReport(A.exportContext('overview'),{scope,remarks:false}),s=r.sections[0];
  assert.equal(s.footer[0].text,'Klassendurchschnitt');assert.equal(s.footer.at(-1).text,show(N.average(active.map(p=>({value:N.finalFor(A.data,c.id,p.id,'annual')?.grade}))),c));assert.equal(s.footer.at(-3).text,show(manual,c));
  const row=new w.DOMParser().parseFromString(A.overviewTable(),'text/html').querySelector('tfoot tr');
  assert.deepEqual(Array.from(row.cells,el=>el.textContent.trim()),Array.from(s.footer,cell=>cell.text));
  if(footer)assert.deepEqual(plain(s.footer),footer);footer=plain(s.footer);
  assert.match(s.description,/alle aktiven Schüler.*unabhängig von Suche/);
  const csv=A.reportCSVRows(r);assert.equal(csv.length,s.rows.length+2);assert.match(csv.at(-1)[0],/^Klassendurchschnitt \(alle aktiven Schüler\)$/);
  assert.equal((A.reportHTML(r).match(/<tfoot>/g)||[]).length,1);
  await write('overview-'+(search===''?'unfiltered':search==='P000'?'filtered':'empty')+'-'+scope,r);
 }
 checks.push('Bildschirm/Export exakt gleich: alle aktiven Fachteilnehmer, auch bei Suche, null Treffern und Umfang Alle; ehemalige/archivierte und fehlende Noten korrekt');
 A.W().search='';A.W().showExited=false;
 for(const kind of A.kinds){
  const ctx={...A.exportContext(kind),type:'matrix',kind},r=A.buildReport(ctx,{scope:'current',remarks:false}),s=r.sections[0],foot=s.footer;
  const table=new w.DOMParser().parseFromString(A.matrixTable(kind),'text/html').querySelector('tfoot tr');
  const cells=Array.from(table.cells,el=>el.textContent.trim());
  assert.deepEqual(Array.from(foot,cell=>cell.text),[cells[0],cells.at(-1),...cells.slice(1,-1)]);
  assert.ok(foot.slice(2).every(cell=>cell.format==='average'||cell.text==='–'));
  await write('matrix-'+kind,r);
 }
 checks.push('Alle fünf Klassen-Notentabellen: Leistungsdurchschnitte und Bereichsdurchschnitt entsprechen der Bildschirmzeile; Nichtteilnahme und Status bleiben erhalten');
 for(const precision of [0,1,2])for(const rounding of ['round','truncate']){
  A.data=N.clone(A.data);c=A.getCourse();c.precision=precision;c.rounding=rounding;c.calculationMode='direct';c.weights.overall={exam:'33.33',test:'16.67',oral:'50',homework:'0',notebook:'0'};
  const r=A.buildReport(A.exportContext('overview'),{scope:'current',remarks:false}),mean=N.average(N.activeStudents(A.data,c).map(s=>({value:N.calculate(A.data,c,s.id).total})));
  assert.equal(r.sections[0].footer.at(-3).text,N.show(mean,c));await write('rounding-'+precision+'-'+rounding,r);
 }
 checks.push('Individuelle Fachgewichtung, Faktoren, direkte Gewichtung und alle 0/1/2-Stellen-Rundungs-/Abschneidemodi verwenden ungerundete zentrale Ergebnisse');
 c=install();A.data.years[0].archived=true;A.data.years[0].label='2024/25';
 await write('historical',A.buildReport(A.exportContext('overview'),{scope:'current',remarks:false}));assert.equal(A.data.years[0].label,'2024/25');
 for(const type of ['pupil','assessments','oral-individual']){
  const ctx={...A.exportContext('overview'),type,studentId:c.studentIds[0]},r=A.buildReport(ctx,{});assert.ok(r.sections.every(s=>!s.footer));
 }
 checks.push('Historische Fachzuordnung bleibt getrennt; keine Klassendurchschnittszeilen in Schülerberichten, Leistungs- oder Einzelnote-Listen');
 for(const columns of [8,9,10,20]){
  c=install(60);A.W().columns=['exam','test','written','oral'];
  const ctx=columns===8?A.exportContext('overview'):{...A.exportContext('exam'),type:'matrix',kind:'exam'};
  if(columns!==8){const template=N.clone(A.data.assessments[0]);A.data.assessments=A.data.assessments.filter(a=>a.kind!=='exam');for(let i=0;i<columns-2;i++)A.data.assessments.push({...N.clone(template),id:'wide-'+i,title:'K'+String(i+1).padStart(2,'0')});}
  const r=A.buildReport(ctx,{scope:'current',remarks:false}),parts=A.reportTables(r);assert.equal(r.sections[0].columns.length,columns);assert.equal(A.reportLayout(r).landscape,true);
  for(const part of parts){assert.equal(part.footer.length,part.columns.length);assert.deepEqual(plain(part.footer),plain(part.sourceIndices.map(i=>r.sections[0].footer[i])));}
  await write('pages-'+columns,r);
 }
 c=install(60);A.W().columns=[];const narrow=A.buildReport(A.exportContext('overview'),{scope:'current',remarks:false});assert.equal(A.reportLayout(narrow).landscape,false);await write('pages-portrait',narrow);
 checks.push('60 Schüler: acht bis zehn zusammenhängende Querformatspalten, vollständige breite Spaltenteile und schmale Hochformattabelle mit korrekter Ergebniszeile');
 install();original=JSON.stringify(A.data);view=JSON.stringify(A.getWorkspace());
 A.W().pupil=A.getCourse().studentIds[0];view=JSON.stringify(A.getWorkspace());A.output('pupil');
 const output=w.document.querySelector('#exportOutput'),hint=w.document.querySelector('#exportBatchHint'),format=w.document.querySelector('#exportFormat');
 assert.equal(hint.hidden,false);assert.equal(output.getAttribute('aria-describedby'),hint.id);assert.equal(hint.hasAttribute('aria-live'),false);assert.equal(hint.textContent,'Es wird ein Bericht für den ausgewählten Schüler erstellt.');
 output.focus();output.value='batch';output.dispatchEvent(new w.Event('change'));assert.equal(w.document.activeElement,output);assert.equal(hint.textContent,'Es werden 6 Schülerberichte in einem ZIP-Archiv erstellt.');
 output.value='single';output.dispatchEvent(new w.Event('change'));assert.equal(hint.textContent,'Es wird ein Bericht für den ausgewählten Schüler erstellt.');assert.equal(w.document.activeElement,output);
 format.value='print';format.dispatchEvent(new w.Event('change'));assert.equal(w.document.querySelector('#exportPrintHint').hidden,false);assert.match(w.document.querySelector('#exportPrintHint').textContent,/Empfohlen: A4 hoch/);format.value='csv';format.dispatchEvent(new w.Event('change'));assert.equal(w.document.querySelector('#exportPrintHint').hidden,true);A.closeModal();
 checks.push('Beide Ausgabe-Erklärungen sichtbar, dynamisch und zugeordnet; keine zweite Live-Region, unveränderter Fokus, Druckhinweis nur beim Drucken');
 assert.equal(JSON.stringify(A.data),original);assert.equal(JSON.stringify(A.getWorkspace()),view);
 let calls=0,printed=0;const bridge=w.NRDesktop;w.print=()=>printed++;
 w.NRDesktop={available:true,call:async op=>{assert.equal(op,'print-preview');calls++;return true;}};
 const r=A.buildReport(A.exportContext('overview'),{});assert.equal(await A.printReport(r),true);assert.equal(calls,1);assert.equal(printed,0);assert.ok(w.document.querySelector('#printOutput'));w.dispatchEvent(new w.Event('afterprint'));assert.equal(w.document.querySelector('#printOutput'),null);
 for(const call of [async()=>false,async()=>{throw Error('synthetic unavailable');}]){w.NRDesktop.call=call;await A.printReport(r);w.dispatchEvent(new w.Event('afterprint'));}assert.equal(printed,2);
 await A.printReport(r,()=>false);assert.equal(printed,2);assert.equal(w.document.querySelector('#printOutput'),null);w.NRDesktop=bridge;
 checks.push('Nativer Vorschauauftrag statt stiller Ausgabe, Fallback bei nicht unterstützter Laufzeit, Inhalt bis afterprint, spätes Abbrechen ohne Druck; simulierte Bridge, kein Windows-Livetest');
 // A user may spend longer than two minutes in a native print preview.
 const vm=require('node:vm');let posted,receive,timers=0;
 const sandbox={setTimeout:()=>++timers,clearTimeout:()=>{},crypto:{randomUUID:()=> 'synthetic-print'},chrome:{webview:{addEventListener:(name,fn)=>receive=fn,postMessage:msg=>posted=msg}},Map,Date,Math,Error,Promise};sandbox.globalThis=sandbox;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/desktop.js'),'utf8'),sandbox);
 const pending=sandbox.NRDesktop.call('print-preview');assert.equal(timers,0);receive({data:{id:posted.id,ok:true,result:true}});assert.equal(await pending,true);
 const host=fs.readFileSync(path.join(__dirname,'../native/Window.cs'),'utf8');assert.match(host,/ShowPrintUI\(CoreWebView2PrintDialogKind\.Browser\)/);assert.doesNotMatch(host,/\.PrintAsync\s*\(/);
 checks.push('Nativer Vorschaukanal ohne Bedienungs-Timeout; kompilierter Host ruft Browser-Druckvorschau auf und enthält keinen stillen PrintAsync-Aufruf');
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({documents}));fs.writeFileSync(path.join(__dirname,'v1130-results.json'),JSON.stringify({checks,syntheticOnly:true,windows:false,word:false,nvda:false},null,2));await A.workspacePromise;w.close();console.log('1.13:',checks.length,'Prüfgruppen;',documents.length,'Berichte in fünf Dateien und Druckmodell');
})().catch(async e=>{console.error(e);await A?.workspacePromise;w?.close();process.exitCode=1;});
