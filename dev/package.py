"""Package the verified runtime and complete editable project separately. No seed data."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED,ZipInfo
import json,re,struct,hashlib,os,sys,tempfile
from contextlib import contextmanager

@contextmanager
def atomic_file(path,mode):
 fd,tmp=tempfile.mkstemp(prefix=path.name+'.',suffix='.tmp',dir=path.parent)
 try:
  with os.fdopen(fd,mode) as stream:
   yield stream
   stream.flush();os.fsync(stream.fileno())
  os.replace(tmp,path)
 finally:
  if os.path.exists(tmp):os.unlink(tmp)

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
metadata=json.loads((r/'package.json').read_text());version=metadata['version']
notes=metadata.get('releaseNotes');assert isinstance(notes,list) and 3<=len(notes)<=5
assert all(isinstance(t,str) and 5<=len(t)<=240 and not re.search(r'[<>\x00-\x1f]|https?://|\b(commit|sha[- ]?256|AnyCPU|WebView2)\b|[a-f0-9]{40,}|\.(exe|dll|json)\b',t,re.I) for t in notes),'Neuerungen kurz und aus Sicht einer Lehrkraft pflegen'
approved=False
if len(sys.argv)>1:
 assert len(sys.argv)==3 and sys.argv[1]=='--approve-update','Nur nach ausdrücklicher Freigabe: --approve-update reports/<Lauf>/summary.json'
 from manage import audit
 assert audit(Path(sys.argv[2]))['release_current'],'Ein vollständiger aktueller Release-Nachweis fehlt'
 approved=True
archive=output/('Notenblick_'+version+'.zip')
with atomic_file(archive,'w+b') as stream:
 with ZipFile(stream,'w',ZIP_DEFLATED,compresslevel=9) as z:
  for p in sorted(dist.rglob('*')):
   if p.is_file():add(z,p,'Notenblick/'+p.relative_to(dist).as_posix())
 with ZipFile(stream) as z:assert z.testzip() is None
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
with atomic_file(project,'w+b') as stream:
 with ZipFile(stream,'w',ZIP_DEFLATED,compresslevel=9) as z:
  for name in sorted(set(source_paths)):add(z,r/name,'Notenblick-Projekt/'+name)
 with ZipFile(stream) as z:assert z.testzip() is None
with ZipFile(project) as z:assert z.testzip() is None
update_manifest={'schema':1,'repository':'sappelmueller/Notenblick','repositoryId':1432518047,'version':version,'approved':approved,'minimumUpdater':'1.24.0','dataSchema':1,'notes':notes,'archive':{'name':archive.name,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()},'files':[{'path':p.relative_to(dist).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(dist.rglob('*')) if p.is_file()]}
descriptor=output/('Notenblick_'+version+'_Aktualisierung.json')
with atomic_file(descriptor,'w') as stream:stream.write(json.dumps(update_manifest,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
report={'version':version,'runtimeFiles':len(names),'programFiles':len(files),'assets':len(assets),'dataIncluded':False,'anyCPU':True,'completeFileHashesVerified':True,'archives':[{'name':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [archive,project]],'updateDescriptor':{'name':descriptor.name,'bytes':descriptor.stat().st_size,'sha256':hashlib.sha256(descriptor.read_bytes()).hexdigest(),'approved':approved}}
with atomic_file(output/('Notenblick_'+version+'_Pruefsummen.json'),'w') as stream:stream.write(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
