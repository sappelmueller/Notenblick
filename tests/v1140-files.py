"""Independent readers and actual renderer output; no Windows/NVDA live claim."""
from pathlib import Path
import csv,io,json,os,subprocess,sys,tempfile,unicodedata,xml.etree.ElementTree as ET
from docx import Document
from openpyxl import load_workbook
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/exports/v1140';names=json.loads((OUT/'manifest.json').read_text())['documents'];checks=[]
compact=lambda s:''.join(unicodedata.normalize('NFKC',s).split())
lo=os.environ.get('NOTENBLICK_LIBREOFFICE') or str(Path(os.environ.get('CODEX_PRIMARY_RUNTIME_ROOT','/nonexistent'))/'dependencies/bin/override/soffice')
assert Path(lo).is_file(),'LibreOffice fehlt'
word=OUT/'word';word.mkdir(exist_ok=True)
for name in names:(word/(name+'.pdf')).unlink(missing_ok=True)
with tempfile.TemporaryDirectory(prefix='nb1140-lo-') as profile:
 r=subprocess.run([lo,'-env:UserInstallation='+Path(profile).as_uri(),'--headless','--convert-to','pdf','--outdir',str(word),*[str(OUT/(name+'.docx')) for name in names]],capture_output=True,text=True,timeout=180,env={**os.environ,'HOME':profile,'XDG_CACHE_HOME':profile+'/cache','XDG_CONFIG_HOME':profile+'/config','SAL_USE_VCLPLUGIN':'svp'})
 assert r.returncode==0,r.stdout+r.stderr
pages=0
for name in names:
 model=json.loads((OUT/(name+'.json')).read_text());remarks=model['remarks'];summary=model['sections'][0]
 text=(OUT/(name+'.txt')).read_text(encoding='utf-8-sig');csvtext=(OUT/(name+'.csv')).read_text(encoding='utf-8-sig')
 doc=Document(OUT/(name+'.docx'));doc_text=''.join(c.text for table in doc.tables for row in table.rows for c in row.cells)+''.join(p.text for p in doc.paragraphs)
 for source in [text,csvtext,doc_text]:
  assert ('Halbjahresbemerkung' in source)==remarks
  assert ('Jahresbemerkung' in source)==remarks
  assert 'Zeugnisnote' in source
 assert ('Halbjahresinformation' in doc_text)==name.startswith('information')
 rows=list(csv.reader(io.StringIO(csvtext),delimiter=';'));assert len(rows)==1+sum(len(s['rows'])+bool(s.get('footer')) for s in model['sections'])
 for section in model['sections']:
  for row in section['rows']:
   for cell in row:
    for source in [text,doc_text]:assert compact(cell['text']) in compact(source),(name,cell)
 wb=load_workbook(OUT/(name+'.xlsx'));ws=wb.active
 for y,row in enumerate(summary['rows'],7):
  for x,cell in enumerate(row,1):
   actual=ws.cell(y,x)
   if 'number' in cell:
    assert actual.data_type=='n' and abs(actual.value-cell['number'])<1e-12
    if cell.get('finalType')=='information':assert actual.number_format=='0.00" (2+)"',actual.number_format
   else:assert (actual.value or '')==cell['text']
 for source in [OUT/(name+'.pdf'),OUT/(name+'-print.pdf'),word/(name+'.pdf')]:
  pdf=PdfReader(source);pages+=len(pdf.pages);full=compact(''.join(p.extract_text() for p in pdf.pages));landscape=float(pdf.pages[0].mediabox.width)>float(pdf.pages[0].mediabox.height);assert landscape==model['landscape'],(source,'orientation')
  for section in model['sections']:
   for row in section['rows']:
    for cell in row:assert compact(cell['text']) in full,(source,cell['text'])
  assert ('Halbjahresbemerkung' in full)==remarks
  assert ('Jahresbemerkung' in full)==remarks
  bbox=subprocess.run(['pdftotext','-bbox-layout',str(source),'-'],capture_output=True,text=True,timeout=30);assert bbox.returncode==0
  for page in ET.fromstring(bbox.stdout).findall('.//{*}page'):
   width,height=float(page.get('width')),float(page.get('height'))
   for box in page.findall('.//{*}word'):
    assert -1<=float(box.get('xMin'))<=float(box.get('xMax'))<=width+1,(source,'horizontal clipping')
    assert -1<=float(box.get('yMin'))<=float(box.get('yMax'))<=height+1,(source,'vertical clipping')
checks.append(f'Acht Optionsfälle in allen sechs Formen, {pages} echte PDF-/Chromium-/LibreOffice-Seiten: vollständige Werte, gespeicherte Noten, optionale Bemerkungen, Excel-Zahlentypen/Tendenzformat, Orientierung und Textgrenzen')
targets=[str(OUT/(name+ext)) for name in names for ext in ['.docx','.xlsx']]
r=subprocess.run([sys.executable,'dev/openxml-check.py',*targets],cwd=ROOT,capture_output=True,text=True,timeout=180);assert r.returncode==0,r.stdout+r.stderr;assert len(json.loads(r.stdout)['results'])==16
checks.append('Open XML SDK 3.3.0: 16 vollständige Word-/Excel-Pakete ohne Schemafehler')
validator=os.environ.get('NOTENBLICK_VERAPDF') or str(ROOT/'.tools/verapdf/verapdf')
r=subprocess.run([validator,'--flavour','ua1','--format','json',*[str(OUT/(name+'.pdf')) for name in names]],capture_output=True,text=True,timeout=180);assert r.returncode==0,r.stderr
jobs=json.loads(r.stdout)['report']['jobs'];assert len(jobs)==8 and all(j['validationResult'][0]['compliant'] for j in jobs),r.stdout
checks.append('veraPDF 1.30.3: acht native PDF/UA-1-Dateien ohne verletzte maschinelle Regeln')
(OUT/'verapdf.json').write_text(r.stdout);(ROOT/'tests/v1140-files-results.json').write_text(json.dumps({'checks':checks,'pages':pages,'windows':False,'nvda':False,'officeLive':False},ensure_ascii=False,indent=2));print('1.14 Dateien:',len(checks),'Prüfgruppen;',pages,'gerenderte Seiten; 16 Office-Pakete; 8 PDF/UA')
