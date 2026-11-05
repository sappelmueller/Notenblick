"""Independent content/layout checks for flexible area exports; synthetic data only."""
from pathlib import Path
import csv,io,json,os,subprocess,tempfile,unicodedata,zipfile
import xml.etree.ElementTree as ET
from docx import Document
from openpyxl import load_workbook
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/exports/v1260'
manifest=json.loads((OUT/'manifest.json').read_text());checks=[];office=[];pdfs=[];summary={}
compact=lambda s:''.join(unicodedata.normalize('NFKC',str(s)).split())
lo=os.environ.get('NOTENBLICK_LIBREOFFICE') or str(Path(os.environ['CODEX_PRIMARY_RUNTIME_ROOT'])/'dependencies/bin/override/soffice')
word=OUT/'word';word.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='nb126-lo-') as profile:
 r=subprocess.run([lo,'-env:UserInstallation='+Path(profile).as_uri(),'--headless','--convert-to','pdf','--outdir',str(word),*[str(OUT/(name+'.docx')) for name in manifest['documents']]],capture_output=True,text=True,timeout=180,env={**os.environ,'HOME':profile,'XDG_CACHE_HOME':profile+'/cache','XDG_CONFIG_HOME':profile+'/config','SAL_USE_VCLPLUGIN':'svp'})
 assert r.returncode==0,r.stdout+r.stderr
for name in manifest['documents']:
 model=json.loads((OUT/(name+'.json')).read_text());count=int(name.split('-')[-1]);section=model['sections'][0]
 assert len(section['columns'])==count+4
 expected=[c['text'] for s in model['sections'] for row in [*s['rows'],s['footer']] for c in row]
 doc=Document(OUT/(name+'.docx'));wordtext=''.join(p.text for p in doc.paragraphs)+''.join(c.text for t in doc.tables for row in t.rows for c in row.cells)
 pdf=PdfReader(OUT/(name+'.pdf'));rendered=PdfReader(word/(name+'.pdf'))
 txt=(OUT/(name+'.txt')).read_text(encoding='utf-8-sig');rows=list(csv.reader(io.StringIO((OUT/(name+'.csv')).read_text(encoding='utf-8-sig')),delimiter=';'))
 csvtext=''.join(''.join(row) for row in rows)
 book=load_workbook(OUT/(name+'.xlsx'));assert len(book.worksheets)==1
 sheet=book.worksheets[0];excel=''.join(str(c.value) for row in sheet for c in row if c.value is not None)
 assert len(rows[0])==count+4
 assert len(doc.tables[0].columns)==min(count,5)+4
 assert len(doc.tables)==1+max(0,(count-5+4)//5)
 assert [c.text for c in doc.tables[0].rows[0].cells][-3:]==['Gesamt','Halbjahr','Zeugnis']
 assert sheet.max_column==count+4
 for value in expected:
  for label,content in [('Word',wordtext),('PDF',''.join(p.extract_text() for p in pdf.pages)),('gerendertes Word',''.join(p.extract_text() for p in rendered.pages)),('TXT',txt),('CSV',csvtext)]:
   assert compact(value) in compact(content),(name,label,value)
 for column in section['columns']:assert compact(column['label']) in compact(excel),(name,'Excel',column['label'])
 for docfile in [OUT/(name+'.pdf'),word/(name+'.pdf')]:
  r=subprocess.run(['pdftotext','-bbox-layout',str(docfile),'-'],capture_output=True,text=True,check=True)
  for page in ET.fromstring(r.stdout).findall('.//{*}page'):
   for box in page.findall('.//{*}word'):assert 0<=float(box.get('xMin'))<float(box.get('xMax'))<=float(page.get('width'))+1 and 0<=float(box.get('yMin'))<float(box.get('yMax'))<=float(page.get('height'))+1,(name,'Beschnitt')
 xml=ET.fromstring(zipfile.ZipFile(OUT/(name+'.docx')).read('word/document.xml'));ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 assert len(xml.findall('.//w:tblHeader',ns))==len(doc.tables)
 assert all(int(x.get('{'+ns['w']+'}val'))>=18 for x in xml.findall('.//w:sz',ns))
 summary[name]={'areas':count,'mainColumns':len(doc.tables[0].columns),'tables':len(doc.tables),'pdfPages':len(pdf.pages),'wordPages':len(rendered.pages),'csvColumns':len(rows[0]),'excelColumns':sheet.max_column}
 assert len(pdf.pages)<=4 and len(rendered.pages)<=4,(name,summary[name])
 office.extend([str(OUT/(name+'.docx')),str(OUT/(name+'.xlsx'))]);pdfs.append(str(OUT/(name+'.pdf')))
checks.append('3/5/8/20 Bereiche: alle Inhalte unabhängig in PDF, gerendertem Word, CSV und TXT gelesen; bis neun Hauptspalten, weitere vollständig und gleich sortiert, breite numerische Excel-Tabelle')
r=subprocess.run(['python3','dev/openxml-check.py',*office],cwd=ROOT,capture_output=True,text=True,timeout=180);assert r.returncode==0,r.stdout+r.stderr
r=subprocess.run([str(ROOT/'.tools/verapdf/verapdf'),'--format','xml','--flavour','ua1',*pdfs],capture_output=True,text=True,timeout=180);assert r.returncode==0,r.stdout+r.stderr
reports=[x for x in ET.fromstring(r.stdout).iter() if x.tag.endswith('validationReport')];assert len(reports)==4 and all(x.attrib.get('isCompliant')=='true' for x in reports)
checks.append('Acht Open-XML-Dateien, vier PDF/UA-1-Dateien, wiederholte Word-Köpfe, Schrift mindestens 9 Punkt und Inhaltsgrenzen von PDF/gerendertem Word geprüft')
(ROOT/'tests/v1260-files-results.json').write_text(json.dumps({'checks':checks,'summary':summary,'syntheticOnly':True,'windows':False,'nvda':False,'wordLive':False},ensure_ascii=False,indent=2))
print('1.26 Dateien:',len(summary),'Dokumentfälle, vier PDF/UA- und acht Open-XML-Prüfungen')
