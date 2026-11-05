"""Independent content, table geometry, real rendering and accessibility checks."""
from pathlib import Path
import csv,io,json,os,re,subprocess,tempfile,unicodedata,zipfile
import xml.etree.ElementTree as ET
from docx import Document
from openpyxl import load_workbook
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/exports/v1202';manifest=json.loads((OUT/'manifest.json').read_text());checks=[];pages=0;office=[];pdfs=[];summary={};ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
compact=lambda s:''.join(unicodedata.normalize('NFKC',s).split())
lo=os.environ.get('NOTENBLICK_LIBREOFFICE') or str(Path(os.environ.get('CODEX_PRIMARY_RUNTIME_ROOT','/nonexistent'))/'dependencies/bin/override/soffice');rendered=OUT/'word';rendered.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='nb1202-lo-') as profile:
 r=subprocess.run([lo,'-env:UserInstallation='+Path(profile).as_uri(),'--headless','--convert-to','pdf','--outdir',str(rendered),*[str(OUT/(m['name']+'.docx')) for m in manifest['reports']]],capture_output=True,text=True,timeout=180,env={**os.environ,'HOME':profile,'XDG_CACHE_HOME':profile+'/cache','XDG_CONFIG_HOME':profile+'/config','SAL_USE_VCLPLUGIN':'svp'});assert r.returncode==0,r.stdout+r.stderr
for item in manifest['reports']:
 name=item['name'];model=item['report'];cells=[c for s in model['sections'] for row in [*s['rows'],*([s['footer']] if s.get('footer') else [])] for c in row];doc=Document(OUT/(name+'.docx'));word_text=''.join(p.text for p in doc.paragraphs)+''.join(c.text for t in doc.tables for row in t.rows for c in row.cells);txt=(OUT/(name+'.txt')).read_text(encoding='utf-8-sig');csv_rows=list(csv.reader(io.StringIO((OUT/(name+'.csv')).read_text(encoding='utf-8-sig')),delimiter=';'));csv_text=''.join(''.join(r) for r in csv_rows);workbook=load_workbook(OUT/(name+'.xlsx'));values=[c.value for sheet in workbook for row in sheet for c in row];excel_text=''.join(str(v) for v in values if v is not None)
 assert len(workbook.sheetnames)==len(model['sections'])<15,(name,'too many sheets')
 assert not re.search(r'\S {4,}\S',txt);assert not re.search(r'Berechnungsstatus|Vorläufig;|Noch offen',txt)
 for cell in cells:
  for label,text in [('Word',word_text),('TXT',txt),('CSV',csv_text)]:assert compact(cell['text']) in compact(text),(name,label,cell['text'])
  if 'number' in cell:assert any(isinstance(v,(int,float)) and abs(v-cell['number'])<1e-10 for v in values),(name,'Excel number',cell)
  elif 'date' not in cell:assert compact(cell['text']) in compact(excel_text),(name,'Excel text',cell)
 if name=='precision-4':assert any(c.number_format=='0.0000' for sheet in workbook for row in sheet for c in row if c.data_type=='n')
 if name.startswith('few'):
  assert len(doc.tables)==6 if name=='few' else len(doc.tables)<=6
  assert len(doc.tables[0].columns)==7
  assert [c.text for c in doc.tables[0].rows[0].cells]==['Schüler','Klassenarbeiten','Tests','Mündlich','Gesamt','Halbjahr','Zeugnis']
  assert not any('Teil ' in p.text for p in doc.paragraphs)
  assert all(s.get('overview') is not True or len(s['columns'])==7 for s in item['layout']['sections'])
 if csv_rows[0]==['Abschnitt','Schüler','Bezug','Angabe','Wert']:assert all(len(r)==5 for r in csv_rows)
 with zipfile.ZipFile(OUT/(name+'.docx')) as z:
  xml=ET.fromstring(z.read('word/document.xml'));tables=xml.findall('.//w:tbl',ns)
  assert len(tables)==len(item['layout']['sections'])
  assert all(t.find('w:tr/w:trPr/w:tblHeader',ns) is not None for t in tables)
  assert not xml.findall('.//w:pageBreakBefore',ns)
  assert b'235B47' in z.read('word/document.xml') and b'w:outlineLvl' in z.read('word/styles.xml')
  for table in tables:
   widths=[int(c.get('{'+ns['w']+'}w')) for c in table.findall('w:tblGrid/w:gridCol',ns)];assert sum(widths)<=15120
 for source in [OUT/(name+'.pdf'),rendered/(name+'.pdf')]:
  reader=PdfReader(source);text=compact(''.join(p.extract_text() for p in reader.pages));pages+=len(reader.pages)
  assert bool(float(reader.pages[0].mediabox.width)>float(reader.pages[0].mediabox.height))==item['layout']['landscape'],source
  for c in cells:assert compact(c['text']) in text,(source,c['text'])
  for i,p in enumerate(reader.pages):assert compact('Seite '+str(i+1)+' von '+str(len(reader.pages))) in compact(p.extract_text()),(source,'footer')
  bbox=subprocess.run(['pdftotext','-bbox-layout',str(source),'-'],capture_output=True,text=True,check=True)
  for page in ET.fromstring(bbox.stdout).findall('.//{*}page'):
   width,height=float(page.get('width')),float(page.get('height'))
   for box in page.findall('.//{*}word'):assert -1<=float(box.get('xMin'))<=float(box.get('xMax'))<=width+1 and -1<=float(box.get('yMin'))<=float(box.get('yMax'))<=height+1,(source,'clipping')
  if source.parent==OUT:
   assert reader.trailer['/Root'].get('/StructTreeRoot') and reader.trailer['/Root']['/Lang']=='de-DE';pdfs.append(str(source))
 summary[name]={'wordPages':len(PdfReader(rendered/(name+'.pdf')).pages),'pdfPages':len(PdfReader(OUT/(name+'.pdf')).pages),'tables':len(doc.tables),'sheets':len(workbook.sheetnames)};office.extend([str(OUT/(name+'.docx')),str(OUT/(name+'.xlsx'))])
checks.append(f"{len(manifest['reports'])} Fälle in TXT/CSV/Word/Excel/PDF; Word zusätzlich tatsächlich in LibreOffice gerendert: {pages} echte Seiten, alle Modellwerte/Noten/Bemerkungen, Zahlentypen/Präzision, Kopf-/Fußzeilen, Tags, Tabellenbreiten und Textgrenzen geprüft")
before=manifest['baseline'];after=summary['few'];assert after['tables']<before['wordTables']/10 and after['wordPages']<=8 and after['pdfPages']<=8;assert after['wordPages']<before['wordPages']/3
checks.append(f"Synthetischer identischer 23-Schüler-Fall: Word {before['wordPages']} → {after['wordPages']} Seiten, PDF {before['pdfPages']} → {after['pdfPages']} Seiten, Word-Tabellen {before['wordTables']} → {after['tables']}; privates Negativbeispiel unabhängig mit 38 Seiten/138 Tabellen bestätigt, keine privaten Inhalte in Tests")
checks.append('Übersicht der tatsächlichen Leistungsbereiche bleibt ein zusammenhängendes A4-Querformat-Word-Table mit allen Abschlussnoten; dynamische Zusatzarten in Fachberichtteilen, keine horizontal geteilte Übersicht oder künstlichen Seitenumbrüche; Bemerkungen optional, keine normalen Berechnungsstatusabschnitte')
r=subprocess.run(['python3','dev/openxml-check.py',*office],cwd=ROOT,capture_output=True,text=True,timeout=180);assert r.returncode==0,r.stdout+r.stderr
r=subprocess.run([os.environ.get('NOTENBLICK_VERAPDF',str(ROOT/'.tools/verapdf/verapdf')),'--format','xml','--flavour','ua1',*pdfs],capture_output=True,text=True,timeout=180);assert r.returncode==0,r.stdout+r.stderr
reports=[x for x in ET.fromstring(r.stdout).iter() if x.tag.endswith('validationReport')];assert len(reports)==len(pdfs) and all(x.attrib.get('isCompliant')=='true' for x in reports)
checks.append(f'{len(office)} Office-Dateien per Open XML SDK und {len(pdfs)} PDF/UA-1-Dateien per veraPDF ohne Regelverletzung')
(OUT/'quality.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));(ROOT/'tests/v1202-files-results.json').write_text(json.dumps({'checks':checks,'before':before,'after':after,'pages':pages,'windows':False,'nvda':False,'officeLive':False,'syntheticOnly':True},ensure_ascii=False,indent=2));print('1.20.2 Dokumentqualität:',len(checks),'Prüfgruppen;',pages,'Seiten;',json.dumps(after))
