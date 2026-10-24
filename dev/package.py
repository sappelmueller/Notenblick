"""Package the verified runtime and complete editable project separately. No seed data."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json,re,struct,hashlib,os
r=Path(__file__).resolve().parents[1];dist=r/'dist';output=Path(os.environ.get('NOTENBLICK_OUTPUT',r.parent/'Ausgabe'));output.mkdir(exist_ok=True)
assert {p.name for p in dist.iterdir()}=={'Notenblick.exe','Programm'}, 'Unexpected runtime root content'
html=(dist/'Programm/Notenblick.html').read_text()
assets=re.findall(r'(?:src|href)="((?:js|css)/[^"?#]+)"',html)
assert len(assets)==1+len(json.loads((r/'dev/load-order.json').read_text()))+len(list((r/'src/styles').glob('*.css')))
for asset in assets:assert (dist/'Programm'/asset).is_file(),asset
b=(dist/'Notenblick.exe').read_bytes();assert b[:2]==b'MZ'
assert b'UnsafeLoadFrom' in b and b'\0LoadFrom\0' not in b
pins=re.findall(r'new ProgramLibraries.LibrarySpec\("([^"]+)", "([A-F0-9]{64})"\)',(r/'native/ReleaseLibraries.g.cs').read_text());assert len(pins)==5
for name,expected in pins:
 assert hashlib.sha256((dist/'Programm/Windows'/(name+'.dll')).read_bytes()).hexdigest().upper()==expected
 assert expected.encode('utf-16le') in b
files=re.findall(r'new ProgramLibraries.ProgramFileSpec\("([^"]+)","([A-F0-9]{64})"\)',(r/'native/ReleaseFiles.g.cs').read_text())
actual={p.relative_to(dist/'Programm').as_posix() for p in (dist/'Programm').rglob('*') if p.is_file()};assert set(p for p,h in files)==actual
for name,sha in files:
 assert hashlib.sha256((dist/'Programm'/name).read_bytes()).hexdigest().upper()==sha,name
 assert sha.encode('utf-16le') in b
pe=struct.unpack_from('<I',b,60)[0];sections=struct.unpack_from('<H',b,pe+6)[0];optional=pe+24;sizeOpt=struct.unpack_from('<H',b,pe+20)[0];clrRva=struct.unpack_from('<I',b,optional+96+14*8)[0]
for i in range(sections):
 s=optional+sizeOpt+40*i;vSize,vAddr,rawSize,raw=struct.unpack_from('<IIII',b,s+8)
 if vAddr<=clrRva<vAddr+max(vSize,rawSize):flags=struct.unpack_from('<I',b,raw+clrRva-vAddr+16)[0];break
assert flags&1 and not flags&2 and not flags&0x20000
archive=output/'Notenblick_1.8.0.zip'
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(dist.rglob('*')):
  if p.is_file():z.write(p,'Notenblick/'+p.relative_to(dist).as_posix())
with ZipFile(archive) as z:
 assert z.testzip() is None
 names=z.namelist();assert all(n=='Notenblick/Notenblick.exe' or n.startswith('Notenblick/Programm/') for n in names)
 assert not any(n.endswith('.json') or '/tests/' in n or '/Daten/' in n for n in names)
 assert all('Notenblick/Programm/'+asset in names for asset in assets)
project=output/'Notenblick_1.8.0_Quellcode.zip'
with ZipFile(project,'w',ZIP_DEFLATED,compresslevel=9) as z:
 def put(p):z.write(p,'Notenblick-Projekt/'+p.relative_to(r).as_posix())
 for folder in ['src','native','tests']:
  for p in sorted((r/folder).rglob('*')):
   if p.is_file() and p.suffix in ['.js','.cjs','.html','.css','.cs','.json','.py','.manifest','.ico'] and not p.is_relative_to(r/'tests/native') and not p.is_relative_to(r/'tests/visual'):put(p)
 for name in ['ENTWICKLUNG.md','PRUEFBERICHT.md','AENDERUNGEN.md','QUELLEN.md','package.json']:put(r/name)
 for p in sorted((r/'dev').glob('*')):
  if p.is_file() and not p.is_symlink():put(p)
 # The exact required build libraries accompany the sources; no package download is needed.
 for name in ['mscorlib','System','System.Core','System.Drawing','System.Windows.Forms','System.IO.Compression']:put(r/'dev/microsoft.netframework.referenceassemblies.net48/build/.NETFramework/v4.8'/(name+'.dll'))
 for p in sorted((r/'dev/microsoft.netframework.referenceassemblies.net48').glob('*.nuspec')):put(p)
 for package,paths in [('newtonsoft.json',['LICENSE.md','Newtonsoft.Json.nuspec','lib/net45/Newtonsoft.Json.dll','lib/net6.0/Newtonsoft.Json.dll']),('webview2',['LICENSE.txt','Microsoft.Web.WebView2.nuspec','lib/net462/Microsoft.Web.WebView2.Core.dll','lib/net462/Microsoft.Web.WebView2.WinForms.dll',*[f'build/native/{arch}/WebView2Loader.dll' for arch in ['x86','x64','arm64']]])]:
  for name in paths:
   p=r/'dev'/package/name
   if p.is_file():put(p)
with ZipFile(project) as z:assert z.testzip() is None
report={'version':'1.8.0','runtimeFiles':len(names),'programFiles':len(files),'assets':len(assets),'dataIncluded':False,'anyCPU':True,'completeFileHashesVerified':True,'archives':[{'name':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [archive,project]]}
(output/'Notenblick_1.8.0_Pruefsummen.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
