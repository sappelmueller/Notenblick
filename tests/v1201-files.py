"""Real generated collections pass the productive C# validator AND atomic writer.
Windows SaveFileDialog/WebView2 itself is not executed by this Linux host test.
"""
from pathlib import Path
import io,json,os,re,struct,subprocess,sys,tempfile,unicodedata,warnings,zipfile
import xml.etree.ElementTree as ET
from docx import Document
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'dev'))
from toolchain import DOTNET
OUT=ROOT/'tests/exports/v1201';checks=[];probe=ROOT/'tests/native/ExportFilesProbe.dll'
compact=lambda s:''.join(unicodedata.normalize('NFKC',s).split())
def native(*args):
 r=subprocess.run([DOTNET,str(probe),*map(str,args)],cwd=ROOT,capture_output=True,text=True,timeout=120)
 assert r.returncode==0,r.stdout+r.stderr
 return r.stdout.strip()
def archive(entries):
 with io.BytesIO() as output:
  with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED) as z:
   with warnings.catch_warnings():
    warnings.simplefilter('ignore')
    for name,content in entries:z.writestr(name,content)
  return output.getvalue()
with tempfile.TemporaryDirectory(prefix='notenblick-1201-native-') as folder:
 tmp=Path(folder);good=tmp/'valid';bad=tmp/'invalid';saved=tmp/'saved';good.mkdir();bad.mkdir()
 actual=[ROOT/('tests/exports/'+v+'/all-'+f+'.zip') for v in ['v1200','v1201'] for f in ['txt','docx','pdf']]+[ROOT/'tests/exports/v1200/large-txt.zip',ROOT/'tests/native/synthetic-export.zip']
 # Distinct copies prevent a previous format with the same name hiding an error.
 for i,p in enumerate(actual):
  copy=good/(str(i)+'-'+p.name);copy.write_bytes(p.read_bytes())
 (good/'limit-4096.zip').write_bytes(archive([(f'2026-27/5a/Deutsch/{i}.txt','x') for i in range(4096)]))
 checks.append(native('--archives',saved,*sorted(good.glob('*.zip'))))
 for p in good.glob('*.zip'):assert (saved/p.name).read_bytes()==p.read_bytes()
 assert not list(saved.glob('*.tmp'))
 unsafe=['CON .txt','a/COM1 .txt','AUX  .txt','LPT² .txt','../escape.txt','./report.txt','2026/../report.txt','/report.txt','//server/report.txt','C:/report.txt','C:report.txt','a\\b.txt','a//b.txt','a/./b.txt','a/../../b.txt','a/','a/CON.txt','a/PRN.txt','NUL/report.txt','COM1.txt','lpt9.txt','COM¹/report.txt','CONIN$.txt','a/b.txt.','a /b.txt','a./b.txt','a/b.txt ','a/b:ads.txt','a/b?.txt','a/b\x01.txt','a/b\x7f.txt','a/<x>.txt','a/"x".txt','a/|x.txt','a/*.txt','a/'+'x'*121+'.txt','/'.join(['a']*33)+'.txt','report.json','report.exe']
 cases={f'path-{i}.zip':archive([(p,'synthetic')]) for i,p in enumerate(unsafe)}
 for label,names in {'duplicate':['A/B.txt','A/B.txt'],'case':['A/B.txt','a/b.TXT'],'unicode':['ä/B.txt','a\u0308/B.txt'],'prefix':['A.txt','a.TXT/B.txt'],'prefix-reversed':['a.TXT/B.txt','A.txt']}.items():cases[label+'.zip']=archive([(p,'synthetic') for p in names])
 cases['mixed.zip']=archive([('a.txt','synthetic'),('b.csv','synthetic')]);cases['bad-utf8.zip']=archive([('a.txt',b'\xff')]);cases['empty.zip']=archive([('a.txt','')]);cases['count.zip']=archive([(f'{i}.txt','x') for i in range(4097)])
 cases['raw-limit.zip']=archive([('large.txt',b'x')])+b'x'*(64*1024*1024);cases['expanded-limit.zip']=archive([('large.txt',b'x'*(64*1024*1024+1))]);cases['bad-docx.zip']=archive([('a/b.docx',b'PK\x03\x04broken')]);cases['bad-pdf.zip']=archive([('a/b.pdf',b'%PDF-fake')])
 original=actual[0].read_bytes();cases['truncated.zip']=original[:-10];cases['trailing.zip']=original+b'x';cases['payload-crc.zip']=original[:50]+bytes([original[50]^1])+original[51:]
 central=original.index(b'PK\x01\x02')
 for label,offset,value in [('central-crc',central+16,123),('local-offset',central+42,1),('expanded-size',central+24,0xffffffff),('compressed-size',central+20,0xffffffff)]:
  changed=bytearray(original);struct.pack_into('<I',changed,offset,value);cases[label+'.zip']=changed
 # Local/central disagreement, orphan bytes and aliased/overlapping payloads.
 altered=bytearray(original);altered[6]^=8;cases['flags.zip']=altered
 pdfzip=actual[2].read_bytes()
 with zipfile.ZipFile(io.BytesIO(pdfzip)) as z:pdf=z.read(z.namelist()[0])
 cases['truncated-pdf.zip']=archive([('a/b.pdf',pdf[:-30])])
 link=io.BytesIO()
 with zipfile.ZipFile(link,'w') as z:
  info=zipfile.ZipInfo('link.txt');info.create_system=3;info.external_attr=0o120777<<16;z.writestr(info,'target')
 cases['symlink.zip']=link.getvalue()
 for name,data in cases.items():(bad/name).write_bytes(data)
 checks.append(native('--reject-archives',bad))
 assert len(list(saved.glob('*.zip')))==len(actual)+1
checks.append('Echte vollständige TXT-/Word-/PDF-ZIPs und flaches Schülerarchiv: produktive native Validierung, Zielschutz, atomarer Erst-/Ersetzungsschreibvorgang und bytegleicher Rücklesetest; 4096-Dokument-Grenze akzeptiert')
manifest=json.loads((OUT/'manifest.json').read_text());ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'};pdfs=[];office=[];stems=[];documents=0
for item in manifest['archives']:
 with zipfile.ZipFile(OUT/('all-'+item['format']+'.zip')) as z:
  assert z.testzip() is None and z.namelist()==item['files'];stems.append([n.rsplit('.',1)[0] for n in z.namelist()])
  for m,name in zip(manifest['models'],z.namelist()):
   data=z.read(name);report=m['report'];expected=[c['text'] for s in report['sections'] for row in [*s['rows'],*([s['footer']] if s.get('footer') else [])] for c in row]
   destination=OUT/'unpacked'/item['format']/name;destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(data)
   if item['format']=='txt':
    text=data.decode('utf-8');assert text==m['txt'];assert not re.search(r'\S {4,}\S',text)
    if report['type'] in ['assessment','legacy-assessment']:
     mean=report['sections'][-1]['footer'][1]['text'];assert 'Klassendurchschnitt: '+mean in text
     for row in report['sections'][-1]['rows']:
      for cell in row:assert compact(cell['text']) in compact(text),(name,cell['text'])
   elif item['format']=='docx':
    doc=Document(io.BytesIO(data));text=''.join(p.text for p in doc.paragraphs)+''.join(c.text for t in doc.tables for row in t.rows for c in row.cells);office.append(str(destination))
    with zipfile.ZipFile(io.BytesIO(data)) as package:
     xml=ET.fromstring(package.read('word/document.xml'));tables=xml.findall('.//w:tbl',ns);assert all(t.find('w:tr/w:trPr/w:tblHeader',ns) is not None for t in tables)
     if tables:assert b'235B47' in package.read('word/document.xml')
     else:assert report.get('empty') is True and not report['sections'] and 'Für dieses Fach sind noch keine Noten erfasst.' in text
     styles=ET.fromstring(package.read('word/styles.xml'));assert styles.find("w:style[@w:styleId='Heading1']/w:rPr/w:color",ns).get('{'+ns['w']+'}val')=='235B47';assert styles.find("w:style[@w:styleId='Heading2']/w:pPr/w:spacing",ns).get('{'+ns['w']+'}before')=='200'
   else:
    reader=PdfReader(io.BytesIO(data));text=''.join(p.extract_text() for p in reader.pages);assert reader.trailer['/Root']['/Lang']=='de-DE';assert reader.trailer['/Root'].get('/StructTreeRoot');pdfs.append(str(destination))
   if item['format']!='txt':
    for value in expected:assert compact(value) in compact(text),(name,value)
   documents+=1
assert stems[0]==stems[1]==stems[2]
for fmt in ['docx','pdf']:
 name=manifest['individual']['path'].rsplit('.',1)[0]+'.'+fmt
 with zipfile.ZipFile(OUT/('all-'+fmt+'.zip')) as z:batch=z.read(name)
 individual=(OUT/('individual.'+fmt)).read_bytes()
 if fmt=='docx':
  with zipfile.ZipFile(io.BytesIO(batch)) as b,zipfile.ZipFile(io.BytesIO(individual)) as s:
   for part in ['word/document.xml','word/styles.xml','word/header1.xml','word/footer1.xml']:assert b.read(part)==s.read(part),part
 else:
  b=PdfReader(io.BytesIO(batch));s=PdfReader(io.BytesIO(individual));assert [p.extract_text() for p in b.pages]==[p.extract_text() for p in s.pages]
  assert [list(p.mediabox) for p in b.pages]==[list(p.mediabox) for p in s.pages]
checks.append(f'{documents} Dokumente unabhängig gelesen: gleiche Pfade/Inhalte/Mittelwerte, Tags und Tabellenköpfe; Word-Dokument/Stile/Kopf-/Fußzeile identisch zum Einzelrenderer, PDF-Text/Seitengröße identisch')
r=subprocess.run([sys.executable,'dev/openxml-check.py',*office],cwd=ROOT,capture_output=True,text=True,timeout=180);assert r.returncode==0,r.stdout+r.stderr
r=subprocess.run([os.environ.get('NOTENBLICK_VERAPDF',str(ROOT/'.tools/verapdf/verapdf')),'--format','xml','--flavour','ua1',*pdfs],capture_output=True,text=True,timeout=180);assert r.returncode==0,r.stdout+r.stderr
reports=[n for n in ET.fromstring(r.stdout).iter() if n.tag.endswith('validationReport')];assert len(reports)==len(pdfs) and all(n.attrib.get('isCompliant')=='true' for n in reports)
checks.append(f'{len(office)} Word-Dateien mit Open XML SDK und {len(pdfs)} PDFs mit veraPDF PDF/UA-1 validiert; LibreOffice-/Druck-/Layoutprüfung aller Berichtstypen zusätzlich in v1200-files')
(ROOT/'tests/v1201-files-results.json').write_text(json.dumps({'checks':checks,'host':'Linux .NET, produktive ExportFiles.cs/OfficePackage.cs','windows':False,'nvda':False,'officeLive':False,'syntheticOnly':True},ensure_ascii=False,indent=2));print('1.20.1 Native/Dateien:',len(checks),'Prüfgruppen;',documents,'Dokumente;',len(cases),'unsichere Archive')
