"""Read every new archive independently; validate real Word/PDF and print files."""
from pathlib import Path
import csv,datetime,io,json,os,re,subprocess,tempfile,unicodedata,zipfile
import xml.etree.ElementTree as ET
from docx import Document
from pypdf import PdfReader
from openpyxl import load_workbook
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/exports/v1200';manifest=json.loads((OUT/'manifest.json').read_text());checks=[]
compact=lambda s:''.join(unicodedata.normalize('NFKC',s).split())
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
models={m['path']:m for m in manifest['models']};paths=[];pdfs=[];docs=[];office=[];doc_models={};files=0
unpacked=OUT/'unpacked';unpacked.mkdir(exist_ok=True)
for archive in manifest['archives']:
 with zipfile.ZipFile(OUT/('all-'+archive['format']+'.zip')) as z:
  assert z.testzip() is None
  assert z.namelist()==archive['files'];assert len({n.casefold() for n in z.namelist()})==len(z.namelist())
  assert all(not n.endswith('/') and not re.search(r'[<>:"\\|?*\x00-\x1f]',n) and all(p not in ['.','..',''] and not p.endswith((' ','.')) for p in n.split('/')) for n in z.namelist())
  stems=[n.rsplit('.',1)[0] for n in z.namelist()];paths.append(stems)
  assert any(n.startswith('2025-26/') for n in stems) and any('/_CON/' in n for n in stems)
  assert any('(2)' in n for n in stems) and any('/Gesicherter Altbestand/' in n for n in stems)
  for name in z.namelist():
   data=z.read(name);key=name.rsplit('.',1)[0]+'.txt';m=models[key];report=m['report'];expected=[cell['text'] for s in report['sections'] for row in [*s['rows'],*([s['footer']] if s.get('footer') else [])] for cell in row]+[p for s in report['sections'] for p in s.get('paragraphs',[])]
   destination=unpacked/archive['format']/name;destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(data)
   if archive['format']=='txt':
    assert data.decode('utf-8')==m['txt'];assert not re.search(r'\S {4,}\S',data.decode('utf-8'))
   elif archive['format']=='docx':
    document=Document(io.BytesIO(data));text=compact(''.join(p.text for p in document.paragraphs)+''.join(c.text for t in document.tables for row in t.rows for c in row.cells));docs.append(str(destination));office.append(str(destination));doc_models[str(destination)]=report
    assert any(p.style.name=='Heading 1' for p in document.paragraphs)
    with zipfile.ZipFile(io.BytesIO(data)) as word:
     xml=ET.fromstring(word.read('word/document.xml'));tables=xml.findall('.//w:tbl',ns)
     assert all(t.find('w:tr/w:trPr/w:tblHeader',ns) is not None for t in tables)
     assert b'w:lang w:val="de-DE"' in word.read('word/styles.xml')
    for value in expected:assert compact(value) in text,(name,value)
   else:
    reader=PdfReader(io.BytesIO(data));assert reader.trailer['/Root']['/Lang']=='de-DE';assert reader.trailer['/Root'].get('/StructTreeRoot');assert all(p.mediabox.width>0 for p in reader.pages);text=compact(''.join(p.extract_text() for p in reader.pages));pdfs.append(str(destination))
    for value in expected:assert compact(value) in text,(name,value)
   files+=1
assert paths[0]==paths[1]==paths[2]
checks.append(f'{files} ZIP-Dokumente: gleiche geordnete Struktur, CRC, kollisionsfreie Windows-Namen, geschlossene Jahre, historische/leere Daten und vollständige TXT-Inhalte')
selected=manifest['selected'];report=selected['report'];cells=[c for s in report['sections'] for row in [*s['rows'],*([s['footer']] if s.get('footer') else [])] for c in row]
for name in selected['files']:
 source=OUT/name;ext=source.suffix
 if ext=='.pdf':
  reader=PdfReader(source);text=compact(''.join(p.extract_text() for p in reader.pages));pdfs.append(str(source))
 elif ext=='.docx':
  document=Document(source);text=compact(''.join(p.text for p in document.paragraphs)+''.join(c.text for t in document.tables for row in t.rows for c in row.cells));docs.append(str(source));office.append(str(source));doc_models[str(source)]=report
 elif ext=='.xlsx':
  workbook=load_workbook(source);values=[c.value for sheet in workbook for row in sheet for c in row];text=compact(''.join(str(v or '') for v in values));office.append(str(source))
  for c in cells:
   if 'number' in c:assert any(isinstance(v,(int,float)) and float(v)==float(c['number']) for v in values),(name,c)
   elif 'date' in c:assert any(isinstance(v,datetime.datetime) and v.date().isoformat()==c['date'] for v in values),(name,c)
   else:assert compact(c['text']) in text,(name,c)
  continue
 elif ext=='.csv':text=compact(''.join(''.join(row) for row in csv.reader(io.StringIO(source.read_text(encoding='utf-8-sig')),delimiter=';')))
 else:text=compact(source.read_text(encoding='utf-8-sig'))
 for c in cells:assert compact(c['text']) in text,(name,c)
checks.append('Vollständiger ausgewählter Fachbericht in TXT/CSV/Word/Excel/PDF unabhängig gelesen; sämtliche Berichtszellen sowie typisierte Excel-Noten und Datumswerte geprüft')
# New complete report, actually printed by Chromium, includes every model cell.
model=json.loads((OUT/'complete-print.json').read_text());reader=PdfReader(OUT/'complete-print.pdf');text=compact(''.join(p.extract_text() for p in reader.pages))
for s in model['sections']:
 for row in [*s['rows'],*([s['footer']] if s.get('footer') else [])]:
  for cell in row:assert compact(cell['text']) in text,('complete-print',cell['text'])
checks.append(f'Vollständiger Fachbericht in echter Chromium-Druckausgabe: {len(reader.pages)} Seiten mit sämtlichen Einzelnoten, Durchschnitten und Abschluss-/Historienangaben')
result=subprocess.run(['python3','dev/openxml-check.py',*office],cwd=ROOT,capture_output=True,text=True,timeout=180);assert result.returncode==0,result.stdout+result.stderr
validator=os.environ.get('NOTENBLICK_VERAPDF',str(ROOT/'.tools/verapdf/verapdf'))
result=subprocess.run([validator,'--format','xml','--flavour','ua1',*pdfs],capture_output=True,text=True,timeout=180);assert result.returncode==0,result.stdout+result.stderr
root=ET.fromstring(result.stdout);reports=[n for n in root.iter() if n.tag.endswith('validationReport')];assert len(reports)==len(pdfs) and all(n.attrib.get('isCompliant')=='true' for n in reports)
checks.append(f'{len(docs)} Word-Dateien per Open XML SDK und {len(pdfs)} PDF/UA-Dateien per veraPDF unabhängig validiert; sämtliche Berichtszellen vorhanden')
# Render every contained Word file and read its output, independently of OOXML.
lo=os.environ.get('NOTENBLICK_LIBREOFFICE') or str(Path(os.environ.get('CODEX_PRIMARY_RUNTIME_ROOT','/nonexistent'))/'dependencies/bin/override/soffice');rendered=OUT/'word-rendered';rendered.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='nb1200-lo-') as profile:
 # Duplicate leaf names live in different subject folders. Unique temporary
 # filenames prevent the renderer from overwriting a different document.
 tmp=Path(profile);sources=[]
 for i,source in enumerate(docs):
  p=tmp/f'document-{i}.docx';p.write_bytes(Path(source).read_bytes());sources.append(str(p))
 result=subprocess.run([lo,'-env:UserInstallation='+tmp.as_uri(),'--headless','--convert-to','pdf','--outdir',str(rendered),*sources],capture_output=True,text=True,timeout=180,env={**os.environ,'HOME':profile,'XDG_CACHE_HOME':profile+'/cache','XDG_CONFIG_HOME':profile+'/config','SAL_USE_VCLPLUGIN':'svp'});assert result.returncode==0,result.stdout+result.stderr
 for i,source in enumerate(docs):
  pdf=PdfReader(rendered/f'document-{i}.pdf');text=compact(''.join(p.extract_text() for p in pdf.pages));model=doc_models[source]
  for section in model['sections']:
   for row in [*section['rows'],*([section['footer']] if section.get('footer') else [])]:
    for cell in row:assert compact(cell['text']) in text,(source,cell['text'])
checks.append('Alle enthaltenen Word-Dokumente zusätzlich tatsächlich in LibreOffice gerendert und auf vollständige Inhalte geprüft')
if manifest.get('large'):
 with zipfile.ZipFile(OUT/'large-txt.zip') as z:assert z.testzip() is None and len(z.namelist())==manifest['large']['documents']
 checks.append('Größerer TXT-Gesamtexport unabhängig entpackt und vollständig per CRC geprüft')
(ROOT/'tests/v1200-files-results.json').write_text(json.dumps({'checks':checks,'syntheticOnly':True,'windows':False,'nvda':False,'office':False},ensure_ascii=False,indent=2))
print('1.20 Exportdateien:',len(checks),'Prüfgruppen;',files,'Dokumente')
