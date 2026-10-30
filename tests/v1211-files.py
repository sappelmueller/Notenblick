"""Independent file contents, natural pages, table headers and PDF/UA checks."""
from pathlib import Path
import csv,io,json,os,subprocess,tempfile,unicodedata,zipfile
import xml.etree.ElementTree as ET
from docx import Document
from openpyxl import load_workbook
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/exports/v1211'
manifest=json.loads((OUT/'manifest.json').read_text());checks=[];office=[];pdfs=[];summary={}
compact=lambda s:''.join(unicodedata.normalize('NFKC',str(s)).split())
def values(model):
 return [c['text'] for s in model['sections'] for row in [*s['rows'],*([s['footer']] if s.get('footer') else [])] for c in row]
for item in manifest['reports']:
 name=item['name'];model=item['report'];doc=Document(OUT/(name+'.docx'));pdf=PdfReader(OUT/(name+'.pdf'));pdfs.append(str(OUT/(name+'.pdf')));office.extend([str(OUT/(name+'.docx')),str(OUT/(name+'.xlsx'))])
 word=''.join(p.text for p in doc.paragraphs)+''.join(c.text for t in doc.tables for row in t.rows for c in row.cells)
 text=''.join(p.extract_text() for p in pdf.pages);txt=(OUT/(name+'.txt')).read_text(encoding='utf-8-sig');csv_text=''.join(''.join(r) for r in csv.reader(io.StringIO((OUT/(name+'.csv')).read_text(encoding='utf-8-sig')),delimiter=';'))
 book=load_workbook(OUT/(name+'.xlsx'));excel=''.join(str(c.value) for sheet in book for row in sheet for c in row if c.value is not None)
 for value in values(model):
  for label,content in [('Word',word),('PDF',text),('TXT',txt),('CSV',csv_text)]:
   assert compact(value) in compact(content),(name,label,value)
 # Numeric Excel grades are independently tested by v1210-files; textual key cells here.
 if model['type']=='point-key':
  for value in values(model):assert compact(value) in compact(excel),(name,'Excel',value)
 assert len(doc.tables)==1
 xml=ET.fromstring(zipfile.ZipFile(OUT/(name+'.docx')).read('word/document.xml'));ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 assert xml.find('.//w:tblHeader',ns) is not None
 if model['type']=='assessment':
  assert not any(p.text=='Noten' for p in doc.paragraphs);assert 'Erstellt am' not in word
  col=next((i for i,c in enumerate(model['sections'][0]['columns']) if c['label']=='Punkte'),None)
  if col is not None:
   assert all('von' not in row.cells[col].text for row in doc.tables[0].rows[1:])
   if model['sections'][0].get('footer'):assert doc.tables[0].rows[-1].cells[col].text==''
 assert '/StructTreeRoot' in pdf.trailer['/Root']
 result=subprocess.run(['pdftotext','-bbox-layout',str(OUT/(name+'.pdf')),'-'],capture_output=True,text=True,check=True)
 for p in ET.fromstring(result.stdout).findall('.//{*}page'):
  for box in p.findall('.//{*}word'):assert 0<=float(box.get('xMin'))<float(box.get('xMax'))<=float(p.get('width'))+1 and 0<=float(box.get('yMin'))<float(box.get('yMax'))<=float(p.get('height'))+1
 summary[name]={'pdfPages':len(pdf.pages),'tables':len(doc.tables),'rows':len(doc.tables[0].rows)}
checks.append('Tatsächliche Inhalte in TXT/CSV/Excel/Word/PDF gelesen; eine Tabelle, kurze Punkte, leere Durchschnittspunkte, semantische Word-Köpfe, PDF-Tags und Inhaltsgrenzen')
lo=os.environ.get('NOTENBLICK_LIBREOFFICE') or str(Path(os.environ['CODEX_PRIMARY_RUNTIME_ROOT'])/'dependencies/bin/override/soffice');rendered=OUT/'word';rendered.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='nb1211-lo-') as profile:
 result=subprocess.run([lo,'-env:UserInstallation='+Path(profile).as_uri(),'--headless','--convert-to','pdf','--outdir',str(rendered),*[str(OUT/(x['name']+'.docx')) for x in manifest['reports']]],capture_output=True,text=True,timeout=180,env={**os.environ,'HOME':profile,'XDG_CACHE_HOME':profile+'/cache','XDG_CONFIG_HOME':profile+'/config','SAL_USE_VCLPLUGIN':'svp'});assert result.returncode==0,result.stdout+result.stderr
for item in manifest['reports']:
 reader=PdfReader(rendered/(item['name']+'.pdf'));summary[item['name']]['wordPages']=len(reader.pages);text=''.join(p.extract_text() for p in reader.pages)
 for value in values(item['report']):assert compact(value) in compact(text),(item['name'],value)
result=subprocess.run(['python3','dev/openxml-check.py',*office],cwd=ROOT,capture_output=True,text=True,timeout=180);assert result.returncode==0,result.stdout+result.stderr
result=subprocess.run([str(ROOT/'.tools/verapdf/verapdf'),'--format','xml','--flavour','ua1',*pdfs],capture_output=True,text=True,timeout=180);assert result.returncode==0,result.stdout+result.stderr
reports=[x for x in ET.fromstring(result.stdout).iter() if x.tag.endswith('validationReport')];assert len(reports)==len(pdfs) and all(x.attrib.get('isCompliant')=='true' for x in reports)
checks.append(f'{len(office)} Open-XML- und {len(pdfs)} PDF/UA-1-Prüfungen; Word unabhängig mit LibreOffice gerendert und Inhalte erneut geprüft')
(OUT/'quality.json').write_text(json.dumps(summary,indent=2));(ROOT/'tests/v1211-files-results.json').write_text(json.dumps({'checks':checks,'summary':summary,'syntheticOnly':True,'windows':False,'nvda':False,'wordLive':False},ensure_ascii=False,indent=2));print('1.21.1 Dateien:',len(manifest['reports']),'Fälle;',len(pdfs),'PDF/UA- und',len(office),'Office-Prüfungen')
