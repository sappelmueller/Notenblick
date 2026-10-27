"""Offline Open XML SDK validation after one checksum-locked local setup."""
from pathlib import Path
import base64, hashlib, json, os, subprocess, sys, urllib.request, zipfile
from guard import check_root
from toolchain import compiler, DOTNET
from evidence import component
ROOT=Path(__file__).resolve().parents[1]
PROJECT=ROOT/'dev/openxml-validator'
OUT=ROOT/'.build/openxml-validator'

def packages(setup=False):
    lock=json.loads((PROJECT/'packages.lock.json').read_text())['dependencies']['net8.0'];assets=json.loads((PROJECT/'assets-lock.json').read_text())
    result=[]
    for name,item in lock.items():
        lower=name.lower();version=item['resolved']
        package=ROOT/'.tools/openxml-nuget'/lower/version/(lower+'.'+version+'.nupkg')
        if not package.is_file():
            if not setup:raise RuntimeError('Open-XML-Prüfwerkzeug fehlt. python3 dev/openxml-check.py setup ausführen.')
            package.parent.mkdir(parents=True,exist_ok=True)
            url='https://api.nuget.org/v3-flatcontainer/'+lower+'/'+version+'/'+package.name
            with urllib.request.urlopen(url,timeout=60) as response:data=response.read()
            assert hashlib.sha256(data).hexdigest()==assets[name]['sha256'],name
            package.write_bytes(data)
        data=package.read_bytes()
        assert assets[name]['version']==version and hashlib.sha256(data).hexdigest()==assets[name]['sha256'],'NuGet-Prüfsumme: '+name
        result.append(package)
    return result

def build(setup=False):
    OUT.mkdir(parents=True,exist_ok=True)
    libraries=[]
    for package in packages(setup):
        with zipfile.ZipFile(package) as z:
            assert z.testzip() is None
            for name in z.namelist():
                if name.startswith('lib/net8.0/') and name.endswith('.dll'):
                    target=OUT/Path(name).name;data=z.read(name)
                    if not target.is_file() or target.read_bytes()!=data:target.write_bytes(data)
                    libraries.append(target)
    sdk=Path(DOTNET).parent
    ref=max((sdk/'packs/Microsoft.NETCore.App.Ref').iterdir(),key=lambda p:tuple(map(int,p.name.split('.'))))/'ref/net8.0'
    args=compiler()+['-nologo','-nostdlib+','-deterministic+','-nullable:enable','-target:exe','-out:'+str(OUT/'Validator.dll')]
    args+=['-r:'+str(p) for p in sorted(ref.glob('*.dll'))+libraries]
    inputs=[PROJECT/'Program.cs',PROJECT/'packages.lock.json',PROJECT/'assets-lock.json',ROOT/'dev/openxml-check.py',ROOT/'dev/evidence.py',ref,Path(DOTNET).parent/'shared',Path(compiler()[1]).parent,*libraries]
    # This validator is a dependency, not a reproducibility target of the app.
    component('openxml-validator',inputs,[OUT/'Validator.dll'],lambda:subprocess.run(args+[str(PROJECT/'Program.cs')],check=True,cwd=ROOT))
    (OUT/'Validator.runtimeconfig.json').write_text(json.dumps({'runtimeOptions':{'tfm':'net8.0','framework':{'name':'Microsoft.NETCore.App','version':'8.0.15'}}}))

if __name__=='__main__':
    check_root();args=sys.argv[1:]
    if args==['setup']:build(True);print('Open XML SDK 3.3.0 für lokale Prüfungen bereit.')
    else:
        assert args,'Zu prüfende DOCX-/XLSX-Dateien angeben.'
        build();sys.exit(subprocess.run([DOTNET,str(OUT/'Validator.dll'),*args],cwd=ROOT).returncode)
