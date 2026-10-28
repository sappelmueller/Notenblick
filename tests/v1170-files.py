"""Independent file readers, Open XML, PDF/UA and actual print/Word rendering."""
from pathlib import Path
import csv,io,json,os,subprocess,sys,tempfile,unicodedata
from docx import Document
from openpyxl import load_workbook
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/exports/v1170';names=json.loads((OUT/'manifest.json').read_text())['documents'];checks=[]
compact=lambda s:''.join(unicodedata.normalize('NFKC',s).split())
lo=os.environ.get('NOTENBLICK_LIBREOFFICE') or str(Path(os.environ['CODEX_PRIMARY_RUNTIME_ROOT'])/'dependencies/bin/override/soffice')
word=OUT/'word';word.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='nb1170-word-') as profile:
 r=subprocess.run([lo,'-env:UserInstallation='+Path(profile).as_uri(),'--headless','--convert-to','pdf','--outdir',str(word),*[str(OUT/(n+'.docx')) for n in names]],capture_output=True,text=True,timeout=180,env={**os.environ,'HOME':profile,'XDG_CACHE_HOME':profile+'/cache','XDG_CONFIG_HOME':profile+'/config','SAL_USE_VCLPLUGIN':'svp'})
 assert r.returncode==0,r.stdout+r.stderr
pages=0
for name in names:
 model=json.loads((OUT/(name+'.json')).read_text());section=model['sections'][0];footer=section['footer'];expected=[c['text'] for c in footer[-2:]];assert len(section['rows'])==1
 text=(OUT/(name+'.txt')).read_text(encoding='utf-8-sig')
 for col,cell in zip(section['columns'][-2:],footer[-2:]):assert text.rsplit(col['label']+': ',1)[1].splitlines()[0]==cell['text']
 rows=list(csv.reader(io.StringIO((OUT/(name+'.csv')).read_text(encoding='utf-8-sig')),delimiter=';'));assert rows[-1][-2:]==expected
 doc=Document(OUT/(name+'.docx'));results=[r for t in doc.tables for r in t.rows if r.cells[0].text.startswith('Klassendurchschnitt')];assert len(results)==1;assert [c.text for c in results[0].cells[-2:]]==expected
 ws=load_workbook(OUT/(name+'.xlsx')).active;y=7+len(section['rows'])
 for x,cell in enumerate(footer,1):
  actual=ws.cell(y,x)
  if 'number' in cell:assert actual.data_type=='n' and abs(actual.value-cell['number'])<1e-12,(name,x,actual.value,cell)
 for x in [len(footer)-1,len(footer)]:assert ws.cell(y,x).number_format=='0.00'
 for source in [OUT/(name+'.pdf'),OUT/(name+'-print.pdf'),word/(name+'.pdf')]:
  pdf=PdfReader(source);pages+=len(pdf.pages);full=compact(''.join(p.extract_text() for p in pdf.pages));assert compact(''.join(c['text'] for c in footer[1:])) in full,(source,expected)
  assert 'Klassendurchschnitt' in full and 'vorläufig' not in full.lower()
checks.append(f'Vier Berichte mit nur einem angezeigten Schüler und zwölf tatsächlichen Festlegungen: korrekte Klassenwerte in TXT, CSV, Word, Excel, PDF, Chromium-Druck und LibreOffice ({pages} Seiten)')
r=subprocess.run([sys.executable,'dev/openxml-check.py',*[str(OUT/(n+ext)) for n in names for ext in ['.docx','.xlsx']]],cwd=ROOT,capture_output=True,text=True,timeout=180);assert r.returncode==0,r.stdout+r.stderr;assert len(json.loads(r.stdout)['results'])==8
validator=os.environ.get('NOTENBLICK_VERAPDF') or str(ROOT/'.tools/verapdf/verapdf')
r=subprocess.run([validator,'--flavour','ua1','--format','json',*[str(OUT/(n+'.pdf')) for n in names]],capture_output=True,text=True,timeout=180);assert r.returncode==0,r.stderr;jobs=json.loads(r.stdout)['report']['jobs'];assert len(jobs)==4 and all(j['validationResult'][0]['compliant'] for j in jobs)
checks.append('Acht Office-Pakete vollständig mit Open XML SDK und vier native PDF/UA-1-Dateien mit veraPDF 1.30.3 geprüft')
(ROOT/'tests/v1170-files-results.json').write_text(json.dumps({'checks':checks,'pages':pages,'windows':False,'nvda':False,'officeLive':False},ensure_ascii=False,indent=2));print('1.17 Dateien:',len(checks),'Prüfgruppen;',pages,'Seiten')
