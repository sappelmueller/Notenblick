"""Verify the real 1.28 package against the unchanged 1.27 updater source."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'dev'))
from toolchain import compiler,DOTNET

sources={'UpdateClient.cs':'7c51a96f47ed0d1e96485c24d29754962a3f7c3eda9bd42bfb03d4cc11ec908f',
         'UpdateTransaction.cs':'2cc8ee803642ff5893a48dffb4f874ff53be2174e9eae7eab78b242a5b2effd3'}
for name,digest in sources.items():
    assert hashlib.sha256((root/'native'/name).read_bytes()).hexdigest()==digest,name
output=Path(sys.argv[1]).resolve()
storage=root/'dist/Programm/Windows/Notenblick.Speicherung.dll'
newton=root/'dev/newtonsoft.json/lib/net45/Newtonsoft.Json.dll'
refs=sorted((Path(DOTNET).parent/'packs/Microsoft.NETCore.App.Ref').glob('*/ref/net8.0'))[-1]
with tempfile.TemporaryDirectory(prefix='notenblick-legacy-update-') as tmp:
    folder=Path(tmp)
    exe=folder/'Update1280Probe.dll'
    subprocess.run(compiler()+['-nologo','-nowarn:SYSLIB0014','-nostdlib+','-target:exe','-out:'+str(exe)]
        +['-r:'+str(p) for p in [*refs.glob('*.dll'),storage,newton]]
        +[str(root/'native'/p) for p in sources]+[str(root/'tests/Update1280Probe.cs')],check=True)
    for p in [storage,newton]:shutil.copy2(p,folder/p.name)
    exe.with_suffix('.runtimeconfig.json').write_text(json.dumps({'runtimeOptions':{'tfm':'net8.0','framework':{'name':'Microsoft.NETCore.App','version':'8.0.15'}}}))
    subprocess.run([DOTNET,str(exe),str(output/'Notenblick_1.28.0.zip'),str(output/'Notenblick_1.28.0_Aktualisierung.json'),
        str(root/'dist/Notenblick-Notfallzugriff.exe'),str(folder/'Update')],check=True)
