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
  await page.locator('#tab-overview').click();
  const menu=page.locator('#overview [data-menu-key=add-performance]');
  await menu.press('Space');
  await page.getByRole('menuitem',{name:'Klassenarbeit',exact:true}).press('Enter');
  await page.locator('#draft-title').waitFor();
  assert.equal(await focus(),'assessmentWorkTitle');
  await page.keyboard.press('Tab');
  assert.equal(await focus(),'draft-title');
  assert.equal(await count(),init);
  assert.equal(await page.locator('#entryBody-exam tr').count(),6);
  await page.locator('#draft-title').fill('Klassenarbeit mit sehr langem Namen – Rechnen und verständlich begründen');
  await page.locator('#draft-title').press('Enter');
  assert.equal(await count(),init);
  await scan();
  for(const [width,height,zoom] of [[1280,900,1],[500,800,1],[1280,900,2],[1280,900,4]]){
   await page.setViewportSize({width,height});
   await page.evaluate(value=>{document.body.style.zoom=String(value);},zoom);
   const box=await page.locator('#newAssessmentFields').boundingBox();
   assert.ok(box.width>0);
   const bounds=await page.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);
   assert.ok(bounds[0]<=bounds[1]+1,'Keine horizontale Seitenüberbreite bei '+width+'px / '+zoom);
   await page.locator('#assessmentWorkTitle').focus();
   await page.locator('#assessmentWorkTitle').evaluate(el=>el.scrollIntoView({block:'start'}));
   await page.screenshot({path:path.join(out,'direkt-'+width+'-'+zoom+'.png')});
  }
  await page.evaluate(()=>document.body.style.zoom='1');
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
  assert.equal(await count(),init+2);
  assert.deepEqual(errors,[]);
  console.log('1.28 Browser Leistungserfassung: Tastatur und F1, schnelle Punkte/Noten, 2 Axe-Scans und 5 echte Darstellungen.');
 }finally{await browser?.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
