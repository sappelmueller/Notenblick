"""Independent file opening, layout, cross-format content and native ZIP checks."""
from pathlib import Path
import csv,io,json,os,subprocess,tempfile,unicodedata,zipfile
import xml.etree.ElementTree as ET
from docx import Document
from openpyxl import load_workbook
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/exports/v1210';manifest=json.loads((OUT/'manifest.json').read_text());checks=[];office=[];pdfs=[];summary={};pages=0
compact=lambda s:''.join(unicodedata.normalize('NFKC',str(s)).split())
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
def values(model):
 return [c['text'] for s in model['sections'] for row in [*s['rows'],*([s['footer']] if s.get('footer') else [])] for c in row]+[p for s in model['sections'] for p in s.get('paragraphs',[])]
def word_text(doc):return ''.join(p.text for p in doc.paragraphs)+''.join(c.text for t in doc.tables for row in t.rows for c in row.cells)
def pdf_check(source,expected,layout=None,model=None):
 global pages
 reader=PdfReader(source);text=compact(''.join(p.extract_text() for p in reader.pages));pages+=len(reader.pages)
 for i in range(len(reader.pages)):text=text.replace(compact(f'Seite {i+1} von {len(reader.pages)}'),'')
 if model:
  orientation='Notenblick · '+('' if model['type']=='roster' else model['subject']+' · ')+'Klasse '+model['className']+' · '+model['year'];text=text.replace(compact(orientation),'')
 for value in expected:assert compact(value) in text,(str(source),value)
 if layout is not None:assert (float(reader.pages[0].mediabox.width)>float(reader.pages[0].mediabox.height))==layout['landscape']
 for i,page in enumerate(reader.pages):assert compact(f'Seite {i+1} von {len(reader.pages)}') in compact(page.extract_text()),(source,'page footer')
 result=subprocess.run(['pdftotext','-bbox-layout',str(source),'-'],capture_output=True,text=True,check=True)
 for page in ET.fromstring(result.stdout).findall('.//{*}page'):
  width,height=float(page.get('width')),float(page.get('height'));boxes=page.findall('.//{*}word')
  for box in boxes:assert 0<=float(box.get('xMin'))<float(box.get('xMax'))<=width+1 and 0<=float(box.get('yMin'))<float(box.get('yMax'))<=height+1,(source,'clipping')
 return len(reader.pages)
for item in manifest['reports']:
 name=item['name'];model=item['report'];expected=values(model);doc=Document(OUT/(name+'.docx'));text=word_text(doc);txt=(OUT/(name+'.txt')).read_text(encoding='utf-8-sig');rows=list(csv.reader(io.StringIO((OUT/(name+'.csv')).read_text(encoding='utf-8-sig')),delimiter=';'));csv_text=''.join(''.join(row) for row in rows);book=load_workbook(OUT/(name+'.xlsx'));cells=[c.value for sheet in book for row in sheet for c in row];excel=''.join(str(v) for v in cells if v is not None)
 for value in expected:
  for label,content in [('Word',text),('TXT',txt),('CSV',csv_text)]:assert compact(value) in compact(content),(name,label,value)
 for section in model['sections']:
  for row in [*section['rows'],*([section['footer']] if section.get('footer') else [])]:
   for cell in row:
    if 'number' in cell:assert any(isinstance(v,(int,float)) and abs(v-cell['number'])<1e-9 for v in cells),(name,cell)
    elif 'date' not in cell:assert compact(cell['text']) in compact(excel),(name,'Excel',cell)
 if name=='empty':assert len(doc.tables)==0 and 'Für dieses Fach sind noch keine Noten erfasst.' in txt and 'Für dieses Fach sind noch keine Noten erfasst.' in csv_text and 'Für dieses Fach sind noch keine Noten erfasst.' in excel
 if name=='roster':assert 'Fach Schülerliste' not in txt and 'Schülerliste · Klasse' not in text
 if name=='complete':assert len([s for s in item['layout']['sections'] if s.get('overview')])==1 and not any(c['label']=='Punkte' for s in model['sections'] for c in s['columns'])
 with zipfile.ZipFile(OUT/(name+'.docx')) as z:
  xml=ET.fromstring(z.read('word/document.xml'));tables=xml.findall('.//w:tbl',ns);assert len(tables)==len(item['layout']['sections']);assert all(t.find('w:tr/w:trPr/w:tblHeader',ns) is not None for t in tables);assert not xml.findall('.//w:pageBreakBefore',ns)
 source=OUT/(name+'.pdf');pdf_pages=pdf_check(source,expected,item['layout'],model);reader=PdfReader(source);assert reader.trailer['/Root'].get('/StructTreeRoot') and reader.trailer['/Root']['/Lang']=='de-DE';pdfs.append(str(source));office.extend([str(OUT/(name+'.docx')),str(OUT/(name+'.xlsx'))]);summary[name]={'pdfPages':pdf_pages,'tables':len(doc.tables)}
assert summary['pupil-points']['pdfPages']==summary['pupil']['pdfPages'], summary
for name in ['points-0','points-1','points-2','points-3','direct']:assert summary[name]['pdfPages']==1,(name,summary[name])
paths=[];models={m['path']:m['report'] for m in manifest['models']};archives=[];archive_pages=0
for item in manifest['archives']:
 source=OUT/('all-'+item['format']+'.zip');archives.append(str(source))
 with zipfile.ZipFile(source) as z:
  assert z.testzip() is None and z.namelist()==item['files'] and len(z.namelist())==len(manifest['models']);paths.append([n.rsplit('.',1)[0] for n in z.namelist()]);assert len({n.casefold() for n in z.namelist()})==len(manifest['models'])
  for name in z.namelist():
   model=models[name.rsplit('.',1)[0]+'.txt'];expected=values(model);destination=OUT/'unpacked'/item['format']/name;destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(z.read(name))
   if item['format']=='txt':text=destination.read_text(encoding='utf-8-sig')
   elif item['format']=='docx':text=word_text(Document(destination));office.append(str(destination))
   else:
    reader=PdfReader(destination);text=''.join(p.extract_text() for p in reader.pages);archive_pages+=len(reader.pages);pdfs.append(str(destination));assert reader.trailer['/Root'].get('/StructTreeRoot')
   for value in expected:assert compact(value) in compact(text),(name,value)
assert paths[0]==paths[1]==paths[2]
checks.append('Drei ZIP-Formate: identische kollisionsfreie Pfade und alle Punkt-/Notenwerte der einzelnen Leistungen; Schüler- und Fachberichte ohne zusätzliche Punktspalten')
lo=os.environ.get('NOTENBLICK_LIBREOFFICE') or str(Path(os.environ['CODEX_PRIMARY_RUNTIME_ROOT'])/'dependencies/bin/override/soffice');rendered=OUT/'word';rendered.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='nb1203-lo-') as profile:
 result=subprocess.run([lo,'-env:UserInstallation='+Path(profile).as_uri(),'--headless','--convert-to','pdf','--outdir',str(rendered),*[str(OUT/(m['name']+'.docx')) for m in manifest['reports']]],capture_output=True,text=True,timeout=180,env={**os.environ,'HOME':profile,'XDG_CACHE_HOME':profile+'/cache','XDG_CONFIG_HOME':profile+'/config','SAL_USE_VCLPLUGIN':'svp'});assert result.returncode==0,result.stdout+result.stderr
for item in manifest['reports']:
 name=item['name'];summary[name]['wordPages']=pdf_check(rendered/(name+'.pdf'),values(item['report']),item['layout'],item['report'])
checks.append(f"{len(manifest['reports'])} tatsächliche Fälle in fünf Formaten; PDF und LibreOffice-Word-Darstellung mit Noten, Status, GFS/Faktor, Bemerkungen, Historie, manuellen Abschlussnoten, Seitenzahlen und Textgrenzen geprüft")
result=subprocess.run(['python3','dev/openxml-check.py',*office],cwd=ROOT,capture_output=True,text=True,timeout=180);assert result.returncode==0,result.stdout+result.stderr
result=subprocess.run([str(ROOT/'.tools/verapdf/verapdf'),'--format','xml','--flavour','ua1',*pdfs],capture_output=True,text=True,timeout=180);assert result.returncode==0,result.stdout+result.stderr
reports=[x for x in ET.fromstring(result.stdout).iter() if x.tag.endswith('validationReport')];assert len(reports)==len(pdfs) and all(x.attrib.get('isCompliant')=='true' for x in reports)
with tempfile.TemporaryDirectory(prefix='nb1203-native-') as folder:
 result=subprocess.run([str(ROOT/'.tools/dotnet/dotnet'),str(ROOT/'tests/native/ExportFilesProbe.dll'),'--archives',folder,*archives],cwd=ROOT,capture_output=True,text=True,timeout=180);assert result.returncode==0,result.stdout+result.stderr
 for archive in archives:assert (Path(folder)/Path(archive).name).read_bytes()==Path(archive).read_bytes()
checks.append(f'{len(office)} Open-XML- und {len(pdfs)} veraPDF-PDF/UA-1-Prüfungen ohne Regelverletzung; drei Archive durch produktive native Validierung und atomare Dateischreibung bytegleich geprüft')
printed=PdfReader(OUT/'single-print.pdf');print_model=json.loads((OUT/'single-print.json').read_text());print_text=compact(''.join(p.extract_text() for p in printed.pages))
for value in values(print_model):assert compact(value) in print_text,('Print',value)
(OUT/'quality.json').write_text(json.dumps(summary,indent=2));(ROOT/'tests/v1210-files-results.json').write_text(json.dumps({'checks':checks,'summary':summary,'archivePages':archive_pages,'pages':pages,'syntheticOnly':True,'windows':False,'nvda':False,'wordLive':False},ensure_ascii=False,indent=2));print('1.21.0 Dateien:',len(checks),'Prüfgruppen;',pages,'Seiten;',archive_pages,'PDF-Seiten im Gesamtexport')
