/* Tagged text PDF. Explicit structure, embedded fonts and semantic table cells. */
(function(A){'use strict';
let fontPromise;
A.reportPdf=async function(report,{fonts}={}){
 if(!fonts){fontPromise??=Promise.all(['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(async name=>{const response=await fetch('fonts/'+name);if(!response.ok)throw Error('Die Schriftdateien für PDF fehlen. Bitte ersetze den vollständigen Ordner Programm.');return new Uint8Array(await response.arrayBuffer());})).catch(e=>{fontPromise=null;throw e;});fonts=await fontPromise;}
 const PDF=globalThis.PDFDocument;if(!PDF)throw Error('Die PDF-Komponente fehlt. Bitte ersetze den vollständigen Ordner Programm.');
 return new Promise((resolve,reject)=>{try{
 const layout=A.reportLayout(report);const doc=new PDF({size:'A4',layout:layout.landscape?'landscape':'portrait',margins:{top:42,bottom:50,left:42,right:42},bufferPages:true,pdfVersion:'1.7',tagged:true,lang:'de-DE',displayTitle:true,info:{Title:report.title,Author:'Notenblick',Creator:'Notenblick',Subject:report.subject+' · '+report.year,CreationDate:new Date(report.created+'T00:00:00Z')}}),chunks=[];
 doc.on('data',chunk=>chunks.push(new Uint8Array(chunk)));doc.on('error',()=>reject(Error('Die PDF-Datei konnte nicht erstellt werden.')));doc.on('end',()=>{const result=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let at=0;for(const c of chunks){result.set(c,at);at+=c.length;}resolve(result);});
 // PDFKit 0.20.2 writes an incomplete optional CIDSet for subset fonts.
 // PDF/UA-1 permits its omission. Keep embedded fonts/ToUnicode and supply
 // the UA identification through the public XMP API instead of that preset.
 doc.appendXML('<rdf:Description xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/" rdf:about=""><pdfuaid:part>1</pdfuaid:part></rdf:Description>');
 // The library interpolates metadata without XML escaping. Retain literal
 // PDF Info values and escape only while its XMP serializer reads them.
 const addInfo=doc._addInfo.bind(doc);doc._addInfo=()=>{const original=doc.info;doc.info={...original};for(const key of ['Title','Author','Subject','Creator','Producer','Keywords'])if(doc.info[key])doc.info[key]=String(doc.info[key]).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));try{addInfo();}finally{doc.info=original;}};
 doc.registerFont('Regular',fonts[0]);doc.registerFont('Bold',fonts[1]);doc.font('Regular');
 const root=doc.struct('Document',{lang:'de-DE'});doc.addStructure(root);let y=42;const left=42,width=layout.width,right=left+width,bottom=()=>doc.page.height-50,lineHeight=13;
 const artifact=fn=>{doc.markContent('Artifact',{type:'Layout'});fn();doc.endMarkedContent();};
 const continuation=()=>{doc.addPage();y=42;doc.markContent('Artifact',{type:'Pagination',attached:['Top']});doc.font('Regular').fontSize(9).fillColor('#495950').text(A.reportOrientation(report),left,y,{width,lineBreak:false});doc.endMarkedContent();y+=24;};
 const lines=(value,w,font='Regular',size=10)=>{doc.font(font).fontSize(size);const result=[];for(const paragraph of String(value||'–').split(/\r?\n/)){let line='';for(const word of paragraph.split(/\s+/)){if(!word)continue;if(doc.widthOfString((line?line+' ':'')+word)<=w){line+=(line?' ':'')+word;continue;}if(line){result.push(line);line='';}if(doc.widthOfString(word)<=w){line=word;continue;}for(const ch of word){if(line&&doc.widthOfString(line+ch)>w){result.push(line);line='';}line+=ch;}}result.push(line);}return result;};
 const textBlock=(value,type='P',size=10,color='#20382D')=>{const font=type.startsWith('H')?'Bold':'Regular',element=doc.struct(type);root.add(element);const l=lines(value,width,font,size),height=size*1.35;if(y+l.length*height>bottom()&&l.length*height<bottom()-70)continuation();for(const line of l){if(y+height>bottom())continuation();const marked=doc.markStructureContent(type);element.add(marked);doc.font(font).fontSize(size).fillColor(color).text(line+' ',left,y,{lineBreak:false});doc.endMarkedContent();y+=height;}element.end();y+=8;};
 textBlock('Notenblick','P',10,'#235B47');textBlock(report.title,'H1',20,'#235B47');textBlock(report.subject+' · Klasse '+report.className+' · '+report.year);textBlock('Erstellt am '+A.date(report.created)+' · '+report.scope,'P',9,'#495950');y+=8;
 for(const section of layout.sections){
  const result=section.title==='Gesamtergebnis';
  const widths=section.widths,fontSize=result?11.5:section.fontSize,lineHeight=fontSize*1.3,headSize=Math.max(9,fontSize-.5),xs=widths.map((w,i)=>left+widths.slice(0,i).reduce((a,b)=>a+b,0));
  const headerLines=section.columns.map((c,i)=>lines(c.label,widths[i]-12,'Bold',headSize)),headerHeight=Math.max(...headerLines.map(l=>l.length))*lineHeight+10;
  const headingHeight=section.title?lines(section.title,width,'Bold',14).length*18.9+8:0,descriptionHeight=section.description?lines(section.description,width,'Regular',9).length*12.15+8:0;
  if(section.breakBefore&&y>70||y+headingHeight+descriptionHeight+headerHeight+2*lineHeight+10>bottom())continuation();
  if(section.title)textBlock(section.title,'H2',14,'#235B47');if(section.description)textBlock(section.description,'P',9,'#495950');const table=doc.struct('Table');root.add(table);
  const drawHeader=repeat=>{if(y+headerHeight+lineHeight>bottom())continuation();const row=repeat?null:doc.struct('TR');if(row)table.add(row);artifact(()=>{doc.rect(left,y,width,headerHeight).fill('#235B47');});for(let i=0;i<section.columns.length;i++){let cell;if(row){cell=doc.struct('TH',{scope:'Column'});row.add(cell);cell.add(doc.markStructureContent('TH'));}else doc.markContent('Artifact',{type:'Pagination',attached:['Top']});doc.font('Bold').fontSize(headSize).fillColor('#FFFFFF');headerLines[i].forEach((line,j)=>doc.text(line+' ',xs[i]+6,y+5+j*lineHeight,{lineBreak:false}));doc.endMarkedContent();cell?.end();}row?.end();y+=headerHeight;};
  drawHeader(false);
  const bodyRows=section.rows.length?section.rows:[section.columns.map((c,i)=>A.reportCell(i?'':'Keine passenden Einträge.'))],rows=[...bodyRows,...(section.footer?[section.footer]:[])];
  for(const [rowIndex,values] of rows.entries()){const bodyFont=values===section.footer||result?'Bold':'Regular';const wrapped=values.map((v,i)=>lines(v.text,widths[i]-12,bodyFont,fontSize)),rowHeight=Math.max(...wrapped.map(l=>l.length))*lineHeight+10;const keepHeight=rows[rowIndex+1]===section.footer&&section.footer?Math.max(...section.footer.map((v,i)=>lines(v.text,widths[i]-12,'Bold',fontSize).length))*lineHeight+10:0;if(rowHeight+keepHeight<bottom()-80-headerHeight&&y+rowHeight+keepHeight>bottom()){continuation();drawHeader(true);}const row=doc.struct('TR');table.add(row);const cells=values.map((v,i)=>{const cell=doc.struct(i===0?'TH':'TD',i===0?{scope:'Row'}:{});row.add(cell);return cell;});let offset=0,total=Math.max(...wrapped.map(l=>l.length));
   while(offset<total){let available=Math.floor((bottom()-y-10)/lineHeight);if(available<1){continuation();drawHeader(true);available=Math.floor((bottom()-y-10)/lineHeight);}const count=Math.min(total-offset,available),height=count*lineHeight+10;
    artifact(()=>{if(values===section.footer)doc.rect(left,y,width,height).fill('#E9F1EC');doc.strokeColor('#CBD8CF').lineWidth(.45).moveTo(left,y+height).lineTo(right,y+height).stroke();});
    for(let i=0;i<cells.length;i++){cells[i].add(doc.markStructureContent(i===0?'TH':'TD'));doc.font(bodyFont).fontSize(fontSize).fillColor('#20382D');wrapped[i].slice(offset,offset+count).forEach((line,j)=>doc.text(line+' ',xs[i]+6,y+5+j*lineHeight,{lineBreak:false}));doc.endMarkedContent();}y+=height;offset+=count;if(offset<total){continuation();drawHeader(true);}
   }cells.forEach(cell=>cell.end());row.end();
  }table.end();y+=12;for(const p of section.paragraphs||[])textBlock(p);
 }
 root.end();const pages=doc.bufferedPageRange();for(let i=pages.start;i<pages.start+pages.count;i++){doc.switchToPage(i);const originalBottom=doc.page.margins.bottom;doc.page.margins.bottom=0;doc.markContent('Artifact',{type:'Pagination',attached:['Bottom']});doc.font('Regular').fontSize(9).fillColor('#495950').text('Seite '+(i+1)+' von '+pages.count,left,doc.page.height-31,{width,align:'center',lineBreak:false});doc.endMarkedContent();doc.page.margins.bottom=originalBottom;}doc.end();
 }catch{reject(Error('Die PDF-Datei konnte nicht erstellt werden.'));}});
};
})(globalThis.Notenblick);
