"""Independent readers and actual LibreOffice/Chromium/PDF pages, synthetic only."""
from pathlib import Path
import csv,io,json,os,re,subprocess,tempfile,zipfile,unicodedata
import xml.etree.ElementTree as ET
from docx import Document
from openpyxl import load_workbook
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/exports/v1120';manifest=json.loads((OUT/'manifest.json').read_text());checks=[]
# Chromium can expose typographic ligatures (e.g. oﬀen) in selectable text.
# Normalize the reader representation; never change the report or its values.
compact=lambda s:''.join(unicodedata.normalize('NFKC',s).split())
assert compact('oﬀen')==compact('offen')
assert compact('Noch offen')!=compact('Noch')
word=OUT/'word';word.mkdir(exist_ok=True)
# Only known synthetic outputs are removed; never reuse a stale conversion.
for render_name in manifest['documents']:(word/(render_name+'.pdf')).unlink(missing_ok=True)
runtime=Path(os.environ.get('CODEX_PRIMARY_RUNTIME_ROOT','/nonexistent'))/'dependencies/bin/override/soffice'
lo=os.environ.get('NOTENBLICK_LIBREOFFICE') or str(runtime if runtime.is_file() else ROOT/'.tools/lo/opt/libreoffice25.8/program/soffice')
assert Path(lo).is_file(),'LibreOffice-Renderer fehlt; NOTENBLICK_LIBREOFFICE setzen.'
with tempfile.TemporaryDirectory(prefix='nb1120-lo-') as profile:
 run=subprocess.run([lo,'-env:UserInstallation='+Path(profile).as_uri(),'--headless','--convert-to','pdf','--outdir',str(word),*[str(OUT/(n+'.docx')) for n in manifest['documents']]],capture_output=True,text=True,timeout=180,env={**os.environ,'HOME':profile,'XDG_CACHE_HOME':profile+'/cache','XDG_CONFIG_HOME':profile+'/config','SAL_USE_VCLPLUGIN':'svp'})
 assert run.returncode==0,run.stdout+run.stderr
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'};pages=0;continuations=0
for name in manifest['documents']:
 model=json.loads((OUT/(name+'.json')).read_text())
 with zipfile.ZipFile(OUT/(name+'.docx')) as z:
  tables=ET.fromstring(z.read('word/document.xml')).findall('.//w:tbl',ns)
  headers=[[compact(''.join(c.itertext())) for c in t.findall('w:tr',ns)[0].findall('w:tc',ns)] for t in tables]
  assert b'updateFields' not in z.read('word/settings.xml')
  assert not ET.fromstring(z.read('word/header1.xml')).findall('.//w:fldSimple',ns)
 for ext in ['.pdf','-print.pdf']:
  assert (OUT/(name+ext)).is_file()
 for source in [OUT/(name+'.pdf'),OUT/(name+'-print.pdf'),word/(name+'.pdf')]:
  pdf=PdfReader(source);
  if model['type']=='pupil':
   for page in pdf.pages:assert not re.search(r'\b\d{2}\.\d{2}\.\d{1,3}\s+\d\b',page.extract_text()),(source,'date broken over lines')
  texts=[compact(p.extract_text()) for p in pdf.pages];full=''.join(texts);pages+=len(texts)
  for section in model['sections']:
   for row in section['rows']:
    for cell in row:assert compact(cell['text']) in full,(source.name,cell['text'][:70])
  for i,text in enumerate(texts):
   assert compact('Seite '+str(i+1)+' von '+str(len(texts))) in text,(source,i,'footer')
   if i:assert compact('Notenblick · '+model['subject']+' · Klasse '+model['className']+' · '+model['year']) in text,(source,i,'orientation')
   if model['type']=='matrix' and re.search(r'P\d{3}',text):
    assert any(all(label in text for label in head) for head in headers),(source,i,'missing complete table header')
    if i:continuations+=1
   elif model['type']=='pupil':
    # Date-bearing rows always have their own table header, including repeats.
    if re.search(r'\d{2}\.\d{2}\.2026Leistung',text):
     expected=['Datum','Bezeichnung','Note/Status'] # optional weight appears only for an actual deviation
     assert all(compact(label) in text for label in expected),(source,i,'pupil header')
     if i:continuations+=1
 assert float(pdf.pages[0].mediabox.width)>0
checks.append(f'{pages} tatsächlich gerenderte Seiten, {continuations} Tabellen-Fortsetzungsseiten: vollständige Köpfe, Orientierung, Seitennummerierung und Inhalte in PDF/Chromium/LibreOffice')
# Read every report in every archive independently. Compare all results to the
# same canonical report model; schema-validate every contained Office document.
count=0;pdfs=[];office=[str(OUT/(n+'.docx')) for n in manifest['documents']]
with tempfile.TemporaryDirectory(prefix='nb1120-documents-') as tmp:
 tmp=Path(tmp)
 for batch in manifest['batches']:
  with zipfile.ZipFile(OUT/(batch['name']+'.zip')) as z:
   assert z.testzip() is None
   names=z.namelist();assert len(names)==batch['count'] and len({n.casefold() for n in names})==len(names)
   models={e['base']:e['report'] for e in json.loads((OUT/('batch-'+str(batch['count'])+'-models.json')).read_text())} if batch['name']!='batch-exited' else {}
   for name in names:
    assert '/' not in name and '\\' not in name and '..' not in name
    data=z.read(name);format=batch['format'];assert name.endswith('.'+format)
    model=models.get(name.rsplit('.',1)[0]);expected=[c['text'] for s in model['sections'] for row in s['rows'] for c in row] if model else []
    unique=tmp/(batch['name']+'-'+name)
    if format=='pdf':
     reader=PdfReader(io.BytesIO(data));text=compact(''.join(p.extract_text() for p in reader.pages));assert reader.trailer['/Root']['/Lang']=='de-DE';unique.write_bytes(data);pdfs.append(str(unique))
    elif format=='docx':
     doc=Document(io.BytesIO(data));text=compact(''.join(p.text for p in doc.paragraphs)+''.join(c.text for t in doc.tables for row in t.rows for c in row.cells));unique.write_bytes(data);office.append(str(unique))
    elif format=='xlsx':
     wb=load_workbook(io.BytesIO(data));text=compact(''.join(str(c.value or '') for ws in wb for row in ws for c in row));unique.write_bytes(data);office.append(str(unique))
     assert all(ws.freeze_panes=='A7' for ws in wb)
     # Independent numeric/date cell checks are already part of export-files.py.
     expected=[x for x in expected if not re.fullmatch(r'\d{2}\.\d{2}\.\d{4}|\d+(?:,\d+)?',x)]
    elif format=='csv':
     rows=list(csv.reader(io.StringIO(data.decode('utf-8-sig')),delimiter=';'));assert all(len(r)==len(rows[0]) for r in rows);text=compact(''.join(''.join(r) for r in rows))
    else:text=compact(data.decode('utf-8-sig'))
    for cell in expected:assert compact(cell) in text,(batch['name'],name,cell[:50])
    if model and format!='csv':assert compact(model['title']) in text
    count+=1
 run=subprocess.run(['python3','dev/openxml-check.py',*office],cwd=ROOT,capture_output=True,text=True,timeout=180);assert run.returncode==0,run.stdout[:3000]+run.stderr
 validator=os.environ.get('NOTENBLICK_VERAPDF') or str(ROOT/'.tools/verapdf/verapdf')
 targets=pdfs+[str(OUT/(n+'.pdf')) for n in manifest['documents']]
 run=subprocess.run([validator,'--flavour','ua1','--format','json',*targets],capture_output=True,text=True,timeout=240);assert run.returncode==0,run.stderr
 result=json.loads(run.stdout);jobs=result['report']['jobs'];assert len(jobs)==len(targets) and all(j['validationResult'][0]['compliant'] for j in jobs),run.stdout[:4000]
 checks.append(f'{count} enthaltene Dokumente unabhängig gelesen; {len(office)} enthaltene Office-Dateien schemavalidiert; {len(jobs)} PDFs mit veraPDF PDF/UA-1 bestanden')
# Real browser ZIPs have their own counts (28 in first, 26 in subsequent cases).
for format in ['txt','csv','docx','xlsx','pdf']:
 with zipfile.ZipFile(OUT/('browser-'+format+'.zip')) as z:assert z.testzip() is None and len(z.namelist())==(28 if format=='txt' else 26)
(ROOT/'tests/v1120-files-results.json').write_text(json.dumps({'checks':checks,'windows':False,'wordLive':False,'nvda':False},ensure_ascii=False,indent=2))
print('\n'.join(checks))
