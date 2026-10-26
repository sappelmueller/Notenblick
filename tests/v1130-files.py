"""Independent readers and real rendered pages, never a Windows/Office live claim."""
from pathlib import Path
import csv, io, json, os, re, subprocess, sys, tempfile, unicodedata, zipfile
import xml.etree.ElementTree as ET
from docx import Document
from openpyxl import load_workbook
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/exports/v1130'
names=json.loads((OUT/'manifest.json').read_text())['documents'];checks=[]
compact=lambda s:''.join(unicodedata.normalize('NFKC',s).split())
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'};W='{'+ns['w']+'}'
runtime=Path(os.environ.get('CODEX_PRIMARY_RUNTIME_ROOT','/nonexistent'))/'dependencies/bin/override/soffice'
lo=os.environ.get('NOTENBLICK_LIBREOFFICE') or str(runtime)
assert Path(lo).is_file(),'LibreOffice fehlt; NOTENBLICK_LIBREOFFICE setzen'
word=OUT/'word';word.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='nb1130-lo-') as profile:
 run=subprocess.run([lo,'-env:UserInstallation='+Path(profile).as_uri(),'--headless','--convert-to','pdf','--outdir',str(word),*[str(OUT/(n+'.docx')) for n in names]],capture_output=True,text=True,timeout=180,env={**os.environ,'HOME':profile,'XDG_CACHE_HOME':profile+'/cache','XDG_CONFIG_HOME':profile+'/config','SAL_USE_VCLPLUGIN':'svp'})
 assert run.returncode==0,run.stderr
pages=continuations=0
for name in names:
 model=json.loads((OUT/(name+'.json')).read_text());section=model['sections'][0];footer=section['footer'];expected={c['label']:v for c,v in zip(section['columns'],footer)}
 text=(OUT/(name+'.txt')).read_text(encoding='utf-8-sig')
 assert 'alle aktiven Schüler des Fachs, unabhängig von Suche' in text
 assert text.count('Schüler: Klassendurchschnitt')==1
 for column,value in zip(section['columns'],footer):assert column['label']+': '+value['text'] in text
 rows=list(csv.reader(io.StringIO((OUT/(name+'.csv')).read_text(encoding='utf-8-sig')),delimiter=';'))
 assert len(rows)==len(section['rows'])+2
 assert rows[-1]==['Klassendurchschnitt (alle aktiven Schüler)',*[c['text'] for c in footer[1:]]]
 assert sum(row==rows[0] for row in rows)==1
 wb=load_workbook(OUT/(name+'.xlsx'));ws=wb.active;y=len(section['rows'])+7
 assert ws.cell(y,1).value=='Klassendurchschnitt\n(alle aktiven Schüler)'
 assert ws.freeze_panes=='B7' and ws.print_title_rows=='$1:$6'
 assert ws.auto_filter.ref==('A6:'+ws.cell(6,len(footer)).column_letter+str(y-1) if section['rows'] else None)
 for x,cell in enumerate(footer,1):
  actual=ws.cell(y,x);assert actual.font.bold and actual.fill.fgColor.rgb=='FFE9F1EC'
  if x==1:continue
  if 'number' in cell:
   assert actual.data_type=='n' and abs(actual.value-cell['number'])<1e-12
   assert actual.number_format in {'0','0.0','0.00'}
  else:assert actual.value==cell['text']
 assert sum(str(row[0].value or '').startswith('Klassendurchschnitt') for row in ws.iter_rows(min_row=7))==1
 with zipfile.ZipFile(OUT/(name+'.docx')) as z:
  assert z.testzip() is None
  doc=ET.fromstring(z.read('word/document.xml'));tables=doc.findall('.//w:tbl',ns)
  assert b'updateFields' not in z.read('word/settings.xml')
  assert [f.get(W+'instr') for f in ET.fromstring(z.read('word/footer1.xml')).findall('.//w:fldSimple',ns)]==['PAGE','NUMPAGES']
  assert not ET.fromstring(z.read('word/header1.xml')).findall('.//w:fldSimple',ns)
  for part in z.namelist():
   if part.endswith('.rels'):assert b'TargetMode="External"' not in z.read(part)
  heads=[];footers=[]
  for table in tables:
   tr=table.findall('w:tr',ns);head=[''.join(c.itertext()) for c in tr[0].findall('w:tc',ns)]
   assert tr[0].find('w:trPr/w:tblHeader',ns) is not None
   last=tr[-1];values=[''.join(c.itertext()) for c in last.findall('w:tc',ns)]
   assert values==[expected[h]['text'] for h in head]
   assert last.find('w:trPr/w:tblHeader',ns) is None and last.find('w:trPr/w:cantSplit',ns) is not None
   assert all(c.find('w:tcPr/w:shd',ns).get(W+'fill')=='E9F1EC' for c in last.findall('w:tc',ns))
   heads.append(head);footers.append(values)
 for source in [OUT/(name+'.pdf'),OUT/(name+'-print.pdf'),word/(name+'.pdf')]:
  pdf=PdfReader(source);texts=[compact(p.extract_text()) for p in pdf.pages];full=''.join(texts);pages+=len(pdf.pages)
  landscape=float(pdf.pages[0].mediabox.width)>float(pdf.pages[0].mediabox.height)
  assert landscape==model['landscape'],(source,'orientation')
  # Every width part ends with exactly one class result. CSS tfoot must not
  # repeat it as a page footer when the table continues.
  assert full.count('Klassendurchschnitt')==2*len(tables),(source,'duplicate class result') # one basis description + one result per width part
  for values in footers:assert compact(''.join(values)) in full,(source,'class result values/order')
  for row in section['rows']:
   for cell in row:assert compact(cell['text']) in full,(source,'missing data')
  if section['rows']:assert re.search(r'P\d{3}',texts[-1]),(source,'class result stranded without last pupil')
  for i,text in enumerate(texts):
   assert compact('Seite '+str(i+1)+' von '+str(len(texts))) in text,(source,i,'page count')
   if re.search(r'P\d{3}',text) or 'Klassendurchschnitt' in text and i:
    assert any(all(compact(label) in text for label in head) for head in heads),(source,i,'missing full header')
    if i:continuations+=1
   if i:assert compact('Notenblick · '+model['subject']+' · '+model['className']+' · '+model['year'].replace('Schuljahr ','')) in text
  # Check actual selectable word boxes, including wide reports and the final row.
  bbox=subprocess.run(['pdftotext','-bbox-layout',str(source),'-'],capture_output=True,text=True,timeout=30)
  assert bbox.returncode==0
  tree=ET.fromstring(bbox.stdout)
  for page in tree.findall('.//{*}page'):
   width,height=float(page.get('width')),float(page.get('height'))
   for box in page.findall('.//{*}word'):
    assert -1<=float(box.get('xMin'))<=float(box.get('xMax'))<=width+1,(source,'horizontal clipping')
    assert -1<=float(box.get('yMin'))<=float(box.get('yMax'))<=height+1,(source,'vertical clipping')
checks.append(f'{len(names)} Berichte in allen sechs Formen: unabhängige Werteprüfung, Klassenbasis, genau eine Ergebniszeile je Tabelle, echte Excel-Zahlen/Drucktitel und eine CSV-Kopfzeile')
checks.append(f'{pages} echte PDF-/Chromium-/LibreOffice-Seiten, {continuations} Tabellenfortsetzungen: vollständige Köpfe, Hoch/Quer, Seitenzahlen, Ergebniswerte und Textgrenzen')
targets=[str(OUT/(name+ext)) for name in names for ext in ['.docx','.xlsx']]
run=subprocess.run([sys.executable,'dev/openxml-check.py',*targets],cwd=ROOT,capture_output=True,text=True,timeout=180)
assert run.returncode==0,run.stdout[:4000]+run.stderr
schema=json.loads(run.stdout);assert len(schema['results'])==len(targets)
checks.append(f'Open XML SDK 3.3.0: {len(targets)} vollständige DOCX/XLSX-Pakete, null Schemafehler; Word-Felder/Beziehungen und wiederholte Köpfe zusätzlich geprüft')
validator=os.environ.get('NOTENBLICK_VERAPDF') or str(ROOT/'.tools/verapdf/verapdf')
run=subprocess.run([validator,'--flavour','ua1','--format','json',*[str(OUT/(name+'.pdf')) for name in names]],capture_output=True,text=True,timeout=180)
assert run.returncode==0,run.stderr
validation=json.loads(run.stdout);jobs=validation['report']['jobs'];assert len(jobs)==len(names)
assert all(j['validationResult'][0]['compliant'] for j in jobs),run.stdout
checks.append(f'veraPDF 1.30.3 PDF/UA-1: {len(jobs)} native PDFs ohne verletzte maschinelle Regeln; Ergebniszeile als TH/TD im bestehenden Tabellenbaum')
(OUT/'verapdf.json').write_text(run.stdout)
(ROOT/'tests/v1130-files-results.json').write_text(json.dumps({'checks':checks,'pages':pages,'continuations':continuations,'windows':False,'webview2Live':False,'office':False,'nvda':False},ensure_ascii=False,indent=2))
print('1.13 Dateiprüfung:',len(names),'Fälle;',pages,'Seiten;',continuations,'Tabellenfortsetzungen;',len(targets),'Office-Pakete;',len(jobs),'PDF/UA')
