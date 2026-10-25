"""Full SDK schema validation plus explicit package/field/layout regressions.

Uses generated synthetic reports only; this is not a Microsoft Word live test.
"""
from pathlib import Path, PurePosixPath
import json, posixpath, subprocess, sys, tempfile, zipfile
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'tests/exports'
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r':'http://schemas.openxmlformats.org/package/2006/relationships'}
W='{'+NS['w']+'}'
manifest=json.loads((OUT/'v1110-manifest.json').read_text())
files=sorted(p for p in OUT.iterdir() if p.suffix in {'.docx','.xlsx'} and not p.name.startswith('invalid-'))
assert len(files)>=30
run=subprocess.run([sys.executable,'dev/openxml-check.py',*[str(p) for p in files]],cwd=ROOT,capture_output=True,text=True,timeout=180)
assert run.returncode==0,run.stdout[:6000]+run.stderr
result=json.loads(run.stdout); assert len(result['results'])==len(files)
checks=['Open XML SDK 3.3.0: vollständige Office-2010-Schema- und semantische Paketvalidierung, '+str(len(files))+' DOCX/XLSX, null Fehler']
for file in files:
    with zipfile.ZipFile(file) as z:
        assert z.testzip() is None
        assert len(z.namelist())==len(set(z.namelist()))
        names=set(z.namelist())
        for name in names:
            assert not name.startswith('/') and '..' not in PurePosixPath(name).parts
            if name.endswith(('.xml','.rels')): ET.fromstring(z.read(name))
            if not name.endswith('.rels'):continue
            rel=ET.fromstring(z.read(name)); ids=[]
            parent='' if name=='_rels/.rels' else str(PurePosixPath(name).parent.parent)
            for item in rel:
                ids.append(item.attrib['Id']); assert item.get('TargetMode')!='External'
                target=item.attrib['Target']; assert ':' not in target and not target.startswith('/')
                resolved=posixpath.normpath(posixpath.join(parent,target)); assert resolved in names,(name,resolved)
            assert len(ids)==len(set(ids))
        if file.suffix!='.docx':continue
        doc=ET.fromstring(z.read('word/document.xml'));settings=ET.fromstring(z.read('word/settings.xml'))
        assert settings.find('w:updateFields',NS) is None
        footer=ET.fromstring(z.read('word/footer1.xml'))
        fields=footer.findall('.//w:fldSimple',NS)
        assert [f.get(W+'instr').strip() for f in fields]==['PAGE','NUMPAGES']
        assert all(not ''.join(f.itertext()).strip() for f in fields) # No false fixed page counts.
        assert not doc.findall('.//w:fldSimple',NS) and not doc.findall('.//w:instrText',NS)
        sect=doc.find('.//w:sectPr',NS);page=sect.find('w:pgSz',NS)
        assert sect.find('w:footerReference',NS) is not None
        assert int(page.get(W+'w')) in {11906,16838}
        for table in doc.findall('.//w:tbl',NS):
            props=list(table.find('w:tblPr',NS));tags=[p.tag for p in props]
            assert tags.index(W+'tblLook')<tags.index(W+'tblCaption')
            grid=table.find('w:tblGrid',NS);columns=len(grid)
            for i,row in enumerate(table.findall('w:tr',NS)):
                assert len(row.findall('w:tc',NS))==columns
                tags=[p.tag for p in row.find('w:trPr',NS)]
                assert W+'cantSplit' in tags
                if i==0:assert tags.index(W+'cantSplit')<tags.index(W+'tblHeader')
        if file.stem in manifest:
            model=json.loads(file.with_suffix('.json').read_text())
            landscape=int(page.get(W+'w'))>int(page.get(W+'h'))
            assert landscape==model['landscape']
            if file.stem in {'v1110-columns-7','v1110-columns-8','v1110-columns-9','v1110-columns-10'}:
                assert landscape and len(doc.findall('.//w:tbl',NS))==1
checks.append('ZIP-Integrität, alle XML-Teile/Beziehungen, keine externen Ziele, lokale PAGE/NUMPAGES ohne Öffnungsaktualisierung, Raster/Zeilen/Abschnitte geprüft')
# Prove that the schema check catches the previous errors, rather than merely
# accepting the files. Intentionally invalid files never enter release archives.
source=OUT/'v1110-columns-8.docx'
mutations={
    'table-order':lambda b:b.replace(b'<w:tblLook',b'<w:tblCaption w:val="invalid"/><w:tblLook',1),
    'required-shading':lambda b:b.replace(b'<w:shd w:val="clear"',b'<w:shd',1),
    'row-value':lambda b:b.replace(b'<w:tblHeader/>',b'<w:tblHeader w:val="invalid"/>',1),
}
with tempfile.TemporaryDirectory(prefix='nb-schema-negative-') as tmp:
    targets=[]
    for name,mutate in mutations.items():
        target=Path(tmp)/(name+'.docx');targets.append(str(target))
        with zipfile.ZipFile(source) as inp,zipfile.ZipFile(target,'w') as out:
            for entry in inp.infolist():
                data=inp.read(entry.filename)
                if entry.filename=='word/document.xml':
                    changed=mutate(data);assert changed!=data;data=changed
                out.writestr(entry,data)
    negative=subprocess.run([sys.executable,'dev/openxml-check.py',*targets],cwd=ROOT,capture_output=True,text=True,timeout=180)
    assert negative.returncode!=0
    invalid=json.loads(negative.stdout);assert all(item['errors'] for item in invalid['results']),negative.stdout
checks.append('Drei absichtlich beschädigte Tabellen-/Zeileneigenschaften werden vom vollständigen SDK-Validator abgewiesen')
(ROOT/'tests/office-schema-results.json').write_text(json.dumps({'checks':checks,'sdk':result,'wordLive':False,'nvdaLive':False},ensure_ascii=False,indent=2))
print('Office schema checks:',len(files),'valid files; 3 invalid files correctly rejected')
