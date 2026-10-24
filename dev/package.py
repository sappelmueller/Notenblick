"""Package the verified runtime and complete editable project separately. No seed data."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED,ZipInfo
import json,re,struct,hashlib,os
def add(z,p,name):
 info=ZipInfo(name,(2020,1,1,0,0,0));info.compress_type=ZIP_DEFLATED;info.create_system=3;info.external_attr=(0o100755 if name.endswith(('pre-push','pre-commit')) else 0o100644)<<16
 z.writestr(info,p.read_bytes(),compresslevel=9)
r=Path(__file__).resolve().parents[1];dist=r/'dist';output=Path(os.environ.get('NOTENBLICK_OUTPUT',r/'artifacts'));output.mkdir(exist_ok=True)
assert {p.name for p in dist.iterdir()}=={'Notenblick.exe','Programm'}, 'Unexpected runtime root content'
html=(dist/'Programm/Notenblick.html').read_text()
assets=re.findall(r'(?:src|href)="((?:js|css)/[^"?#]+)"',html)
assert len(assets)==1+len(json.loads((r/'dev/load-order.json').read_text()))+len(list((r/'src/styles').glob('*.css')))
for asset in assets:assert (dist/'Programm'/asset).is_file(),asset
b=(dist/'Notenblick.exe').read_bytes();assert b[:2]==b'MZ'
assert b'UnsafeLoadFrom' in b and b'\0LoadFrom\0' not in b
pins=re.findall(r'new ProgramLibraries.LibrarySpec\("([^"]+)", "([A-F0-9]{64})"\)',(r/'.build/generated/ReleaseLibraries.g.cs').read_text());assert len(pins)==5
for name,expected in pins:
 assert hashlib.sha256((dist/'Programm/Windows'/(name+'.dll')).read_bytes()).hexdigest().upper()==expected
 assert expected.encode('utf-16le') in b
files=re.findall(r'new ProgramLibraries.ProgramFileSpec\("([^"]+)","([A-F0-9]{64})"\)',(r/'.build/generated/ReleaseFiles.g.cs').read_text())
actual={p.relative_to(dist/'Programm').as_posix() for p in (dist/'Programm').rglob('*') if p.is_file()};assert set(p for p,h in files)==actual
for name,sha in files:
 assert hashlib.sha256((dist/'Programm'/name).read_bytes()).hexdigest().upper()==sha,name
 assert sha.encode('utf-16le') in b
pe=struct.unpack_from('<I',b,60)[0];sections=struct.unpack_from('<H',b,pe+6)[0];optional=pe+24;sizeOpt=struct.unpack_from('<H',b,pe+20)[0];clrRva=struct.unpack_from('<I',b,optional+96+14*8)[0]
for i in range(sections):
 s=optional+sizeOpt+40*i;vSize,vAddr,rawSize,raw=struct.unpack_from('<IIII',b,s+8)
 if vAddr<=clrRva<vAddr+max(vSize,rawSize):flags=struct.unpack_from('<I',b,raw+clrRva-vAddr+16)[0];break
assert flags&1 and not flags&2 and not flags&0x20000
version=json.loads((r/'package.json').read_text())['version']
archive=output/('Notenblick_'+version+'.zip')
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(dist.rglob('*')):
  if p.is_file():add(z,p,'Notenblick/'+p.relative_to(dist).as_posix())
with ZipFile(archive) as z:
 assert z.testzip() is None
 names=z.namelist();assert all(n=='Notenblick/Notenblick.exe' or n.startswith('Notenblick/Programm/') for n in names)
 assert not any(n.endswith('.json') or '/tests/' in n or '/Daten/' in n for n in names)
 assert all('Notenblick/Programm/'+asset in names for asset in assets)
project=output/('Notenblick_'+version+'_Quellcode.zip')
from guard import check_paths,git
source_paths=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0')
source_paths=[name for name in source_paths if name and (r/name).is_file()]
check_paths(source_paths)
with ZipFile(project,'w',ZIP_DEFLATED,compresslevel=9) as z:
 for name in sorted(set(source_paths)):add(z,r/name,'Notenblick-Projekt/'+name)
with ZipFile(project) as z:assert z.testzip() is None
report={'version':version,'runtimeFiles':len(names),'programFiles':len(files),'assets':len(assets),'dataIncluded':False,'anyCPU':True,'completeFileHashesVerified':True,'archives':[{'name':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [archive,project]]}
(output/('Notenblick_'+version+'_Pruefsummen.json')).write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
