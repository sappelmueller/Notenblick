"""Execute the actual release loader in isolated processes; never claims a Windows GUI test."""
from pathlib import Path
import hashlib,json,shutil,subprocess,tempfile,sys,struct,xml.etree.ElementTree as ET
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'dev'))
from toolchain import compiler, DOTNET

root=Path(__file__).resolve().parents[1]
dotnet=Path(DOTNET)
refs=root/'dev/microsoft.netframework.referenceassemblies.net48/build/.NETFramework/v4.8'
names=['Newtonsoft.Json','Microsoft.Web.WebView2.Core','Microsoft.Web.WebView2.WinForms','Notenblick.Speicherung','Notenblick.Fenster']
checks=[]
def pe(file):
    data=file.read_bytes();assert data[:2]==b'MZ',str(file)
    start=struct.unpack_from('<I',data,60)[0];assert data[start:start+4]==b'PE\0\0'
    machine,count=struct.unpack_from('<HH',data,start+4);optional=start+24
    size=struct.unpack_from('<H',data,start+20)[0];magic=struct.unpack_from('<H',data,optional)[0]
    directories=optional+({0x10b:96,0x20b:112}[magic]);sections=optional+size
    def offset(rva):
        for i in range(count):
            vsize,address,rawsize,raw=struct.unpack_from('<IIII',data,sections+i*40+8)
            if address<=rva<address+max(vsize,rawsize):return raw+rva-address
        raise AssertionError('Unmapped PE RVA: '+str(file))
    clr=struct.unpack_from('<I',data,directories+14*8)[0]
    flags=struct.unpack_from('<I',data,offset(clr)+16)[0] if clr else None
    return data,machine,flags,directories,offset

for file in [root/'dist/Notenblick.exe',root/'dist/Programm/Windows/Notenblick.Aktualisierung.exe',*(root/'dist/Programm/Windows').glob('*.dll')]:
    _,machine,flags,_,_=pe(file)
    assert machine==0x14c and flags is not None and flags&1 and not flags&(2|0x20000),str(file)
    checks.append(file.name+': IL-only AnyCPU; neither 32BITREQUIRED nor 32BITPREFERRED')
for arch,machine in [('x86',0x14c),('x64',0x8664),('arm64',0xaa64)]:
    file=root/'dist/Programm/Windows'/arch/'WebView2Loader.dll'
    _,actual,flags,_,_=pe(file);assert actual==machine and flags is None,str(file)
    checks.append(arch+': native WebView2 loader PE machine verified')
data,_,_,directories,offset=pe(root/'dist/Notenblick.exe')
resource=offset(struct.unpack_from('<I',data,directories+2*8)[0])
def entries(relative):
    at=resource+relative;named,ids=struct.unpack_from('<HH',data,at+12)
    return [struct.unpack_from('<II',data,at+16+i*8) for i in range(named+ids)]
manifest=next(target&0x7fffffff for key,target in entries(0) if key==24)
name,target=entries(manifest)[0];assert name==1 and target&0x80000000
_,target=entries(target&0x7fffffff)[0];assert not target&0x80000000
rva,length=struct.unpack_from('<II',data,resource+target)
embedded=ET.fromstring(data[offset(rva):offset(rva)+length].decode('utf-8-sig'))
ns={'a':'urn:schemas-microsoft-com:asm.v3','w':'http://schemas.microsoft.com/SMI/2024/WindowsSettings'}
node=embedded.find('a:application/a:windowsSettings/w:supportedArchitectures',ns)
assert node is not None and node.text.split()==['amd64','arm64'] and not node.attrib
assert len(list(embedded.iter('{'+ns['w']+'}supportedArchitectures')))==1
assert embedded.find('.//{http://schemas.microsoft.com/SMI/2005/WindowsSettings}dpiAware').text=='true/pm'
assert embedded.find('.//a:requestedExecutionLevel',ns).attrib=={'level':'asInvoker','uiAccess':'false'}
checks.append('Actual EXE RT_MANIFEST/1: WindowsSettings 2024 amd64 arm64; DPI and asInvoker preserved')
with tempfile.TemporaryDirectory(prefix='notenblick-loader-') as temp:
    temp=Path(temp); probe=temp/'LoaderProbe.exe'
    architecture=temp/'ArchitectureProbe.exe'
    probe_refs=sorted((dotnet.parent/'packs/Microsoft.NETCore.App.Ref').glob('*/ref/net8.0'))[-1]
    subprocess.run(compiler()+['-nologo','-nostdlib+','-target:exe','-out:'+str(architecture)]+['-r:'+str(p) for p in probe_refs.glob('*.dll')]+[str(root/'native/ProcessArchitecture.cs'),str(root/'tests/ArchitectureProbe.cs')],check=True)
    (temp/'ArchitectureProbe.runtimeconfig.json').write_text(json.dumps({'runtimeOptions':{'tfm':'net8.0','framework':{'name':'Microsoft.NETCore.App','version':'8.0.15'}}}))
    subprocess.run([str(dotnet),str(architecture),str(root/'dist/Programm/Windows/Notenblick.Fenster.dll')],check=True)
    checks.append('Compiled production architecture selector: native and emulated process cases; no Windows API execution on Linux')
    checks.append('Compiled Windows DLL IL: startup Maximized before Shown, no delayed resize, standard window controls retained; no real Windows GUI execution')
    updater_folder=temp/'updater';updater_folder.mkdir();updater=updater_folder/'UpdateProbe.exe'
    storage=root/'dist/Programm/Windows/Notenblick.Speicherung.dll'
    newton=root/'dev/newtonsoft.json/lib/net45/Newtonsoft.Json.dll'
    subprocess.run(compiler()+['-nologo','-nostdlib+','-target:exe','-out:'+str(updater)]+['-r:'+str(p) for p in probe_refs.glob('*.dll')]+['-r:'+str(storage),'-r:'+str(newton)]+[str(root/'native'/p) for p in ['UpdateTransaction.cs','UpdateClient.cs']]+[str(root/'tests/UpdateProbe.cs')],check=True)
    shutil.copy2(storage,updater_folder/storage.name);shutil.copy2(newton,updater_folder/newton.name)
    (updater_folder/'UpdateProbe.runtimeconfig.json').write_text((temp/'ArchitectureProbe.runtimeconfig.json').read_text())
    subprocess.run([str(dotnet),str(updater),str(root/'dist')],check=True)
    checks.append('Production updater: controlled releases/transport, complete archive checks, opt-in/daily preferences and cancellation; real filesystem rollback at every journal boundary; no Windows updater execution')
    subprocess.run(compiler()+['-nologo','-nostdlib+','-target:exe','-out:'+str(probe)]+['-r:'+str(refs/(name+'.dll')) for name in ['mscorlib','System','System.Core']]+[str(root/'native/ProgramLibraries.cs'),str(root/'.build/generated/ReleaseLibraries.g.cs'),str(root/'.build/generated/ReleaseFiles.g.cs'),str(root/'tests/LoaderProbe.cs')],check=True)
    (temp/'LoaderProbe.runtimeconfig.json').write_text(json.dumps({'runtimeOptions':{'tfm':'net8.0','framework':{'name':'Microsoft.NETCore.App','version':'8.0.15'}}}))
    def run(mode,folder,label):
        result=subprocess.run([str(dotnet),str(probe),mode,str(folder)],capture_output=True,text=True)
        assert result.returncode==0, label+'\n'+result.stdout+result.stderr
        checks.append(label)
    # The probe has no .exe.config. The release loader cannot depend on its switch.
    run('valid',root/'dist','Real release assemblies load without .exe.config')
    for index,name in enumerate(names):
        for mode in ['missing','corrupt']:
            folder=temp/(str(index)+'-'+mode)/'Notenblick üben mit Leerzeichen'
            shutil.copytree(root/'dist/Programm',folder/'Programm');files=folder/'Programm/Windows'
            target=files/(name+'.dll')
            if mode=='missing':target.unlink()
            else:
                data=bytearray(target.read_bytes());data[len(data)//2]^=1;target.write_bytes(data)
            run(mode,folder,name+': '+mode+' rejected before code loads')
    folder=temp/'Kopierter Ordner ü';shutil.copytree(root/'dist/Programm',folder/'Programm')
    run('valid',folder,'Copied folder with spaces and Unicode loads identical release files')
    for file in ['Notenblick.html','js/tabs.js','Windows/x64/WebView2Loader.dll']:
        folder=temp/('mixed-'+file.replace('/','_'));shutil.copytree(root/'dist/Programm',folder/'Programm');target=folder/'Programm'/file
        target.write_bytes(target.read_bytes()+b'older release')
        run('corrupt',folder,'Mixed release rejected: '+file)
    folder=temp/'Extra';shutil.copytree(root/'dist/Programm',folder/'Programm');(folder/'Programm/old.js').write_text('obsolete');run('corrupt',folder,'Unexpected old program file rejected')
    folder=temp/'Linked';shutil.copytree(root/'dist/Programm',folder/'Programm');target=folder/'Programm/js/tabs.js';target.unlink();target.symlink_to(root/'dist/Programm/js/tabs.js');run('linked',folder,'Linked program file rejected')
report={'passed':len(checks),'checks':checks,'runtime':'.NET 8 on Linux; no Windows zone-policy emulation','windows_gui_tested':False,'launcher_sha256':hashlib.sha256((root/'dist/Notenblick.exe').read_bytes()).hexdigest()}
(root/'tests/loader-results.json').write_text(json.dumps(report,indent=2))
print('Loader checks passed:',len(checks))
