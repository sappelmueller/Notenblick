"""Compile a Linux test host from the release storage source; the Windows GUI is not emulated."""
from pathlib import Path
from toolchain import compiler, DOTNET
import json,shutil,subprocess
from evidence import component
r=Path(__file__).resolve().parents[1];refs=r/'dev/microsoft.netframework.referenceassemblies.net48/build/.NETFramework/v4.8';out=r/'tests/native';out.mkdir(exist_ok=True)
compile_args=compiler()+['-nologo','-nostdlib+','-target:exe','-out:'+str(out/'StorageCli.dll')]+['-r:'+str(refs/(n+'.dll')) for n in ['mscorlib','System','System.Core','System.IO.Compression','System.Xml']]+['-r:'+str(r/'dev/newtonsoft.json/lib/net45/Newtonsoft.Json.dll'),str(r/'native/Storage.cs'),str(r/'native/Migration.cs'),str(r/'native/ExportFiles.cs'),str(r/'native/OfficePackage.cs'),str(r/'tests/StorageCli.cs')]
inputs=[r/'dev/test-native.py',r/'dev/toolchain.py',r/'dev/evidence.py',refs,Path(DOTNET).parent/'shared',Path(compiler()[1]).parent,r/'native',r/'dev/newtonsoft.json']
component('StorageCli',inputs+[r/'tests/StorageCli.cs'],[out/'StorageCli.dll'],lambda:subprocess.run(compile_args,check=True))
# On Linux use the .NET 6 build of the same JSON dependency. Windows ships its net45 build.
shutil.copy2(r/'dev/newtonsoft.json/lib/net6.0/Newtonsoft.Json.dll',out/'Newtonsoft.Json.dll')
(out/'StorageCli.runtimeconfig.json').write_text(json.dumps({'runtimeOptions':{'tfm':'net8.0','framework':{'name':'Microsoft.NETCore.App','version':'8.0.15'}}}))
probe_args=compiler()+['-nologo','-nostdlib+','-target:exe','-out:'+str(out/'ExportFilesProbe.dll')]+['-r:'+str(refs/(n+'.dll')) for n in ['mscorlib','System','System.Core','System.IO.Compression','System.Xml']]+['-r:'+str(r/'dev/newtonsoft.json/lib/net45/Newtonsoft.Json.dll'),str(r/'native/ExportFiles.cs'),str(r/'native/OfficePackage.cs'),str(r/'tests/ExportFilesProbe.cs')]
component('ExportFilesProbe',inputs+[r/'tests/ExportFilesProbe.cs'],[out/'ExportFilesProbe.dll'],lambda:subprocess.run(probe_args,check=True))
shutil.copy2(out/'StorageCli.runtimeconfig.json',out/'ExportFilesProbe.runtimeconfig.json')
import tempfile
with tempfile.TemporaryDirectory(prefix='notenblick-export-test-') as folder:
 subprocess.run(['node',str(r/'tests/native-export-fixture.cjs')],check=True,cwd=r)
 subprocess.run([DOTNET,str(out/'ExportFilesProbe.dll'),folder,str(out)],check=True)
