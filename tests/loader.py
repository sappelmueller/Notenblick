"""Execute the actual release loader in isolated processes; never claims a Windows GUI test."""
from pathlib import Path
import hashlib,json,shutil,subprocess,tempfile,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'dev'))
from toolchain import compiler, DOTNET

root=Path(__file__).resolve().parents[1]
dotnet=Path(DOTNET)
refs=root/'dev/microsoft.netframework.referenceassemblies.net48/build/.NETFramework/v4.8'
names=['Newtonsoft.Json','Microsoft.Web.WebView2.Core','Microsoft.Web.WebView2.WinForms','Notenblick.Speicherung','Notenblick.Fenster']
checks=[]
with tempfile.TemporaryDirectory(prefix='notenblick-loader-') as temp:
    temp=Path(temp); probe=temp/'LoaderProbe.exe'
    subprocess.run(compiler()+['-nologo','-nostdlib+','-target:exe','-out:'+str(probe)]+['-r:'+str(refs/(name+'.dll')) for name in ['mscorlib','System','System.Core']]+[str(root/'native/ProgramLibraries.cs'),str(root/'native/ReleaseLibraries.g.cs'),str(root/'native/ReleaseFiles.g.cs'),str(root/'tests/LoaderProbe.cs')],check=True)
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
