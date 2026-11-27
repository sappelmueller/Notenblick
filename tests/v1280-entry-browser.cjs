'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),axe=require('axe-core').source,NR=require('../src/core.js');
const fixture=require('./v1260-fixture.cjs')(NR,5),course=fixture.courses[0],sid=course.studentIds[0];
const root=path.resolve(__dirname,'../dist/Programm'),out=path.join(__dirname,'visual/v1280-entry');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}
 catch{res.writeHead(404).end();}
});
(async()=>{
 let browser;
 try{
  fs.mkdirSync(out,{recursive:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({executablePath:process.env.NOTENBLICK_CHROMIUM||undefined,headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({locale:'de-DE',viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/Notenblick.html');
  await page.waitForSelector('html[data-ready=true]');
  await page.addScriptTag({content:axe});
  await page.evaluate(data=>{const a=Notenblick;a.data=NR.clone(data);a.mode='demo';a.today=()=> '2026-11-25';a.normalizeContext();a.courseNotes(data.courses[0].id);},fixture);
  const focus=()=>page.evaluate(()=>document.activeElement.id);
  const scan=async()=>assert.deepEqual(await page.evaluate(async()=>{
   const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}});
   return result.violations.map(v=>[v.id,v.nodes.map(n=>n.target)]);
  }),[]);
  const count=()=>page.evaluate(()=>Notenblick.data.assessments.length);
  const init=await count();
  const saveAndClose=page.getByRole('button',{name:'Speichern und schließen',exact:true});
  await page.locator('#tab-overview').click();
  const menu=page.locator('#overview [data-menu-key=add-performance]');
  await menu.press('Space');
  await page.getByRole('menuitem',{name:'Klassenarbeit',exact:true}).press('Enter');
  await page.locator('#draft-title').waitFor();
  assert.equal(await focus(),'assessmentWorkTitle');
  await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'assessment-done');
   await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'assessment-list');
   await page.keyboard.press('Tab');
  assert.equal(await focus(),'draft-title');
  assert.equal(await count(),init);
  assert.equal(await page.locator('#entryBody-exam tr').count(),6);
   assert.equal(await page.getByLabel('Teilnahme',{exact:true}).inputValue(),'class');
   await page.getByLabel('Teilnahme',{exact:true}).selectOption('selected');
   assert.match(await page.locator('#entry-summary-exam').textContent(),/0 von 0/);
   await page.locator('#draft-participantAll').click();
   assert.match(await page.locator('#entry-summary-exam').textContent(),/0 von 6/);
   await page.getByLabel('Teilnahme',{exact:true}).selectOption('class');
  await page.locator('#draft-title').fill('Klassenarbeit mit sehr langem Namen – Rechnen und verständlich begründen');
  await page.locator('#draft-title').press('Enter');
  assert.equal(await count(),init);
   const month=page.locator('#draft-date-month'),year=page.locator('#draft-date-year');
   await month.fill('13');
   await page.getByRole('button',{name:'Fertig',exact:true}).click();
   assert.equal(await focus(),'draft-date-month');
   assert.equal(await month.getAttribute('aria-invalid'),'true');
   await month.fill('11');
   await year.fill('0');
   await page.getByRole('button',{name:'Fertig',exact:true}).click();
   assert.equal(await focus(),'draft-date-year');
   assert.equal(await year.getAttribute('aria-invalid'),'true');
   for(const date of ['2026-11-25','25.11.2026']){
    await month.evaluate((el,value)=>{
     const clipboardData=new DataTransfer();clipboardData.setData('text',value);
     el.dispatchEvent(new ClipboardEvent('paste',{clipboardData,bubbles:true,cancelable:true}));
    },date);
    assert.equal(await year.inputValue(),'2026');
   }
   await year.press('Enter');
   assert.equal(await count(),init);
  await scan();
  for(const [width,height,zoom] of [[1280,900,1],[500,800,1],[1280,900,2],[1280,900,4]]){
   await page.setViewportSize({width,height});
   await page.evaluate(value=>{document.body.style.zoom=String(value);},zoom);
   const box=await page.locator('#newAssessmentFields').boundingBox();
   assert.ok(box.width>0);
    const title=await page.locator('#draft-title').boundingBox();
    const date=await page.locator('#draft-date-group').boundingBox();
    if(width===1280&&zoom===1){
     const end=await year.boundingBox();
     assert.ok(title.width>date.width*2,'Die Bezeichnung erhält den größeren Platzanteil');
     assert.ok(Math.abs(title.y-end.y)<=1,'Die Eingabekanten sind bündig');
    }else{
     assert.ok(date.y>=title.y+title.height,'Die Datumsgruppe steht unter der Bezeichnung');
     if(width===500&&zoom===1)assert.ok(date.y-title.y-title.height<=18,'Bezeichnung und Datum bleiben in einem kompakten Block');
    }
   const bounds=await page.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);
   assert.ok(bounds[0]<=bounds[1]+1,'Keine horizontale Seitenüberbreite bei '+width+'px / '+zoom);
   const layout=await page.evaluate(()=>{
    const work=document.querySelector('#assessmentWorkTitle').closest('.entry-workspace');
    const rect=selector=>work.querySelector(selector).getBoundingClientRect();
    return {
     headingEnd:rect('#assessmentWorkTitle').bottom,
     actionsStart:rect('.entry-heading .button-row').top,
     actionsEnd:rect('.entry-heading .button-row').bottom,
     fieldsStart:rect('#newAssessmentFields').top,
     fieldsEnd:rect('#newAssessmentFields').bottom,
     toolsStart:rect('.performance-draft-tools').top,
     toolsEnd:rect('.performance-draft-tools').bottom,
     tabsStart:rect('.entry-tabs').top,
     tableEnd:rect('.entry-table').bottom,
     footerStart:rect('.entry-footer').top,
     footerOutsideTable:!work.querySelector('.entry-footer').closest('.table-wrap'),
     footerPosition:getComputedStyle(work.querySelector('.entry-footer')).position
    };
   });
   assert.ok(layout.actionsStart>=layout.headingEnd&&layout.fieldsStart>=layout.actionsEnd,
    'Aktionen bleiben zwischen Überschrift und Eingabefeldern');
   assert.ok(layout.toolsStart>layout.fieldsEnd&&layout.tabsStart>layout.toolsEnd,
    'Eingabefelder, Optionen und Noteneingabe bleiben optisch getrennt');
   assert.ok(layout.footerStart>layout.tableEnd&&layout.footerOutsideTable);
   assert.equal(layout.footerPosition,'static');
   await page.locator('#assessmentWorkTitle').focus();
   await page.locator('#assessmentWorkTitle').evaluate(el=>el.scrollIntoView({block:'start'}));
   await page.screenshot({path:path.join(out,'direkt-'+width+'-'+zoom+'.png')});
  }
  await page.evaluate(()=>document.body.style.zoom='1');
   await page.emulateMedia({forcedColors:'active'});
   await scan();
   await page.locator('#assessmentWorkTitle').evaluate(el=>el.scrollIntoView({block:'start'}));
   await page.screenshot({path:path.join(out,'kontrast.png')});
   await page.emulateMedia({forcedColors:'none'});
  const a=page.locator('#g-exam-table-'+sid);
  await a.fill('2,25');await a.press('Enter');
  assert.equal(await count(),init+1);
  assert.notEqual(await focus(),'g-exam-table-'+sid);
  const next=page.locator('#'+await focus());
  await next.fill('3');await next.press('Shift+Enter');
  assert.equal(await focus(),'g-exam-table-'+sid);
  await page.locator('#entry-tab-exam-single').click();
  assert.equal(await focus(),'entry-tab-exam-single');
  await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');
  assert.equal(await focus(),'entry-tab-exam-table');
  assert.equal(await a.inputValue(),'2,25');
  await page.locator('#draft-title').focus();
  await page.keyboard.press('F1');
  assert.equal(await page.evaluate(()=>Notenblick.contextHelp?.index),12);
  await page.keyboard.press('Escape');
  assert.equal(await focus(),'draft-title');
  await page.locator('[data-action=assessment-list]').click();
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.menuKey),'add-performance');
  await page.locator('#tab-test').click();
  await page.locator('#notes-test [data-action=new-assessment]').click();
  await page.locator('[data-action=point-settings]').click();
  await page.locator('#pointMode').selectOption('points');
  await page.locator('#pointMaximum').fill('40');
  await page.locator('#pointStep').selectOption('tenth');
  await page.locator('#pointApply').click();
  const p=page.locator('#p-test-table-'+sid);
  await p.fill('41');await p.press('Enter');
  assert.equal(await focus(),'p-test-table-'+sid);
  await p.fill('30');await p.press('Enter');
  assert.equal(await count(),init+1);
  await page.locator('#draft-title').fill('Punkteprüfung');
  assert.equal(await count(),init+2);
  assert.equal(await page.evaluate(()=>Notenblick.data.assessments.at(-1).results[Notenblick.getCourse().studentIds[0]].points),'30');
  await scan();
  const spacing=await page.evaluate(()=>{
   const bottom=document.getElementById('draft-date-year').getBoundingClientRect().bottom;
   const top=document.getElementById('newAssessmentStatus').getBoundingClientRect().top;
   return top-bottom;
  });
  assert.ok(spacing<=42,'Status bleibt bei den Leistungsangaben ('+spacing+'px)');
  await page.screenshot({path:path.join(out,'punkte.png')});
  await page.locator('[data-action=assessment-done]').click();
  await page.locator('#draft-title').waitFor({state:'detached'});
   assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'assessment-edit');
  assert.equal(await count(),init+2);
   const assessmentId=await page.evaluate(()=>Notenblick.W().assessmentId);
   const heading=page.locator('#assessmentWorkTitle');
   assert.match(await page.locator('.assessment-details').textContent(),/25\.11\.2026.*Ganze Klasse/);
   await page.getByRole('button',{name:'Angaben ändern',exact:true}).click();
   assert.equal(await page.locator('#a-title').inputValue(),'Punkteprüfung');
   await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Noten bearbeiten',exact:true}).click();
   assert.equal(await focus(),'assessmentWorkTitle');
   await p.fill('41');
   await saveAndClose.click();
   assert.equal(await focus(),'p-test-table-'+sid);
   assert.equal(await p.getAttribute('aria-invalid'),'true');
   await p.fill('29');
   await page.evaluate(()=>{
    const A=Notenblick;
    A.originalFooterSave=A.save;
    A.save=()=>new Promise((resolve,reject)=>{A.failFooterSave=reject;});
   });
   await saveAndClose.click();
   await page.waitForFunction(()=>Notenblick.entryFinishing);
   assert.equal(await heading.count(),1);
   await page.evaluate(()=>Notenblick.failFooterSave(Error('Synthetischer Speicherfehler')));
   await page.waitForFunction(()=>!Notenblick.entryFinishing);
   assert.equal(await saveAndClose.evaluate(el=>el===document.activeElement),true);
   assert.equal(await heading.count(),1);
   await page.evaluate(()=>{Notenblick.save=Notenblick.originalFooterSave;});
   await saveAndClose.press('Enter');
   await heading.waitFor({state:'detached'});
   assert.equal(await page.evaluate(({assessmentId,sid})=>Notenblick.data.assessments.find(a=>a.id===assessmentId).results[sid].points,{assessmentId,sid}),'29');

   await page.evaluate(()=>{
    const A=Notenblick,c=A.getCourse();
    for(let i=0;i<30;i++){
     const id='synthetic-entry-'+i;
     A.data.students.push({id,classId:c.classId,first:'Langer Vorname '+i,last:'Langer Nachname '+i,archived:false});
     c.studentIds.push(id);
    }
    A.data=NR.clone(A.data);
    A.rendered={};
    A.setPreference('areaView','matrix');
   });
   await page.locator('#tab-exam').click();
   await page.locator('#matrixTitle').waitFor();
   await page.locator('#matrix-search').fill('Anna');
   const matrixAdd=page.locator('#notes-exam [data-action=new-assessment]');
   await matrixAdd.click();
   assert.equal(await page.locator('#entryBody-exam tr').count(),36);
   await page.locator('#draft-title').fill('Klassenarbeit aus der Notentabelle');
   await page.locator('#entry-tab-exam-single').click();
   const single=page.locator('#g-exam-single-'+sid);
   await single.fill('2,75');
   await single.press('Enter');
   assert.ok(await saveAndClose.evaluate(el=>el.closest('.entry-footer').previousElementSibling.id==='entry-exam-single'));
   await saveAndClose.press('Enter');
   await page.locator('#draft-title').waitFor({state:'detached'});
   assert.equal(await page.locator('#matrix-search').inputValue(),'Anna');
   assert.equal(await matrixAdd.evaluate(el=>el===document.activeElement),true);

   await page.evaluate(()=>Notenblick.setPreference('areaView','list'));
   await page.locator('#assessmentListTitle').waitFor();
   await page.locator('#assessmentSearch').fill('Bewertung');
   await matrixAdd.click();
   await page.locator('#draft-title').fill('Klassenarbeit aus der Leistungsliste');
   await month.fill('13');
   await saveAndClose.click();
   assert.equal(await page.locator('#error').isVisible(),true);
   assert.equal(await focus(),'draft-date-month');
   await month.fill('11');
   await saveAndClose.click();
   await page.locator('#draft-title').waitFor({state:'detached'});
   assert.equal(await page.locator('#error').isVisible(),false);
   assert.equal(await page.locator('#assessmentSearch').inputValue(),'Bewertung');
   assert.equal(await matrixAdd.evaluate(el=>el===document.activeElement),true);
   assert.equal(await count(),init+4);
  assert.deepEqual(errors,[]);
   console.log('Browser Leistungserfassung: Tastatur und F1, Punkte und Noten, Abschluss aus Tabelle und Einzelansicht, Speicherrückfall, 3 Axe-Scans und 6 Darstellungen.');
 }finally{await browser?.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
