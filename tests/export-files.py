"""Actual app-generated files; structure/content checks, not Office/NVDA certification."""
from pathlib import Path
import csv, datetime, io, json, os, shutil, subprocess, sys, zipfile
import xml.etree.ElementTree as ET
from docx import Document
from openpyxl import load_workbook
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'tests/exports';checks=[]
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
reports=sorted(OUT.glob('*.json'));reports=[p for p in reports if p.stem in {'overview','assessments','exam','test','oral','homework','notebook','oral-250','pupil','historical','metadata-special'} or p.stem.startswith('v1110-') and not p.stem.endswith('manifest')]
assert len(reports)>=10
for model in reports:
    report=json.loads(model.read_text());stem=OUT/model.stem
    text=stem.with_suffix('.txt').read_text(encoding='utf-8-sig')
    assert report['title'] in text and report['year'] in text
    with stem.with_suffix('.csv').open(encoding='utf-8-sig',newline='') as f: rows=list(csv.reader(f,delimiter=';'))
    assert len(rows)==1+sum(len(s['rows'])+bool(s.get('footer')) for s in report['sections'])
    assert all(len(row)==len(rows[0]) for row in rows)
    doc=Document(stem.with_suffix('.docx'))
    assert any(p.style.name=='Heading 1' and p.text==report['title'] for p in doc.paragraphs)
    with zipfile.ZipFile(stem.with_suffix('.docx')) as z:
        assert z.testzip() is None
        tree=ET.fromstring(z.read('word/document.xml'));styles=ET.fromstring(z.read('word/styles.xml'))
        assert styles.find('.//w:lang',ns).get('{'+ns['w']+'}val')=='de-DE'
        for table in tree.findall('.//w:tbl',ns):assert table.find('w:tr/w:trPr/w:tblHeader',ns) is not None
        assert b'PAGE' in z.read('word/footer1.xml') and b'NUMPAGES' in z.read('word/footer1.xml')
    wb=load_workbook(stem.with_suffix('.xlsx'),data_only=False)
    assert len(wb.sheetnames)<=max(3,len(report['sections']))
    for ws in wb:
        assert ws.freeze_panes in {'A7','B7'}
        assert len(ws.merged_cells.ranges)==0
        assert ws['A1'].value=='Notenblick'
        assert all(c.data_type!='f' for row in ws for c in row)
        assert ws.print_title_rows=='$1:$6'
    if report['type']!='pupil':
        for ws,section in zip(wb,report['sections']):
            # The document metadata uses C5 for the scope, even in a two-column report.
            assert ws.max_column==max(3,len(section['columns']))
            assert [ws.cell(6,x).value for x in range(1,len(section['columns'])+1)]==[c['label'] for c in section['columns']]
            for y,row in enumerate(section['rows'],7):
                for x,cell in enumerate(row,1):
                    value=ws.cell(y,x).value
                    if 'date' in cell:assert value.date().isoformat()==cell['date']
                    elif 'number' in cell:assert abs(value-cell['number'])<1e-12
                    else:assert (value or '')==cell['text']
    doc_text=''.join(''.join(c.text.split()) for table in doc.tables for row in table.rows for c in row.cells)+''.join(''.join(p.text.split()) for p in doc.paragraphs)
    for section in report['sections']:
        for row in section['rows']:
            for cell in row:assert ''.join(cell['text'].split()) in doc_text
    if report['type']=='oral-individual':
        ws=wb.active;assert ws.max_row>=len(report['recordIds'])+6
        assert isinstance(ws['A7'].value,datetime.datetime)
        assert any(isinstance(row[3].value,(float,int)) for row in ws.iter_rows(min_row=7))
    pdf=PdfReader(stem.with_suffix('.pdf'));root=pdf.trailer['/Root']
    assert root['/Lang']=='de-DE' and root['/MarkInfo']['/Marked']
    assert root['/ViewerPreferences']['/DisplayDocTitle']
    ET.fromstring(root['/Metadata'].get_data().decode('utf-8').strip())
    structure=root['/StructTreeRoot'];tags=[]
    def visit(node):
        node=node.get_object() if hasattr(node,'get_object') else node
        if isinstance(node,list):
            for child in node:visit(child)
        elif isinstance(node,dict):
            if '/S' in node:tags.append(str(node['/S']))
            if node.get('/S')=='/TH':assert node['/A']['/Scope'] in {'/Row','/Column'}
            if '/K' in node:visit(node['/K'])
    visit(structure['/K']);assert '/H1' in tags and '/Table' in tags and '/TH' in tags and '/TD' in tags
    extracted='\n'.join(page.extract_text() for page in pdf.pages)
    assert report['title'] in extracted
    for s in report['sections']:
        for row in s['rows']:
            for cell in row:
                # Whitespace may change at line/page boundaries, words and numbers may not.
                compact=lambda value:''.join(value.split())
                assert compact(cell['text']) in compact(extracted),(model.stem,cell['text'][:50])
    assert len(pdf.pages)<500
    checks.append(model.stem+': TXT/CSV, DOCX-Stile/Tabellen, XLSX-Typen, PDF-Tags/Sprache/Metadaten/vollständiger Text')
printed=PdfReader(OUT/'browser-print.pdf');assert float(printed.pages[0].mediabox.width)>float(printed.pages[0].mediabox.height)
checks.append('Tatsächlich gerenderte lange Einzelnotenliste im A4-Querformat')
for count in [7,8,10,20]:
    name='v1110-print-eight' if count==8 else 'v1110-print-columns-'+str(count)
    pdf=PdfReader(OUT/(name+'.pdf'))
    assert float(pdf.pages[0].mediabox.width)>float(pdf.pages[0].mediabox.height)
    text=''.join(''.join(p.extract_text().split()) for p in pdf.pages)
    if count!=8:
        model=json.loads((OUT/('v1110-columns-'+str(count)+'.json')).read_text())
        for section in model['sections']:
            for row in section['rows']:
                for cell in row:assert ''.join(cell['text'].split()) in text
checks.append('Tatsächlich gerenderter Chromium-Druck mit 7/8/10/20 Spalten: A4 quer und vollständiger Text, keine Bildschirmbegrenzung')
# PDF/UA machine rules, including every generated report and the real browser PDF.
validator=os.environ.get('NOTENBLICK_VERAPDF') or str(ROOT/'.tools/verapdf/verapdf')
if not Path(validator).is_file():raise RuntimeError('veraPDF 1.30.3 fehlt. Siehe docs/EXPORT-PRUEFUNG.md; NOTENBLICK_VERAPDF setzen.')
targets=[str(p.with_suffix('.pdf')) for p in reports]+[str(OUT/'browser-oral.pdf'),str(OUT/'v1110-browser-overview.pdf')]
result=subprocess.run([validator,'--flavour','ua1','--format','json',*targets],capture_output=True,text=True,timeout=240)
assert result.returncode==0,result.stderr
validation=json.loads(result.stdout);jobs=validation['report']['jobs'];assert len(jobs)==len(targets)
assert all(j['validationResult'][0]['compliant'] for j in jobs),result.stdout
checks.append('veraPDF PDF/UA-1: '+str(len(jobs))+' Dateien, keine verletzten maschinellen Regeln')
(OUT/'verapdf-final.json').write_text(result.stdout)
version=json.loads((ROOT/'package.json').read_text())['version']
assert json.loads((ROOT/'package-lock.json').read_text())['version']==version
assert version in (ROOT/'README.md').read_text()
assert version in (ROOT/'.build/generated/Launcher.cs').read_text()
assert 'globalThis.NRVersion="'+version+'"' in (ROOT/'dist/Programm/js/version.js').read_text()
checks.append('Zentrale Buildversion stimmt mit Anwendung, Paketmetadaten, Starter und README überein')
(ROOT/'tests/export-files-results.json').write_text(json.dumps({'checks':checks,'verapdf':validation['report']['buildInformation'],'windows':False,'office':False,'nvda':False,'humanPdfUaCertification':False},ensure_ascii=False,indent=2))
print('Export file checks:',len(checks),'; PDF/UA files:',len(jobs))
