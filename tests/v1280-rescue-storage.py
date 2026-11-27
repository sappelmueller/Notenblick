"""Exercise the production emergency reader with no Windows UI or WebView2."""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'dev'))
from toolchain import DOTNET, compiler

refs = ROOT / 'dev/microsoft.netframework.referenceassemblies.net48/build/.NETFramework/v4.8'
json_lib = ROOT / 'dev/newtonsoft.json/lib'
crypto_lib = ROOT / '.tools/bouncycastle/lib'

with tempfile.TemporaryDirectory(prefix='notenblick-notfall-test-') as temp:
    root = Path(temp)
    probe = root / 'RescueProbe.dll'
    references = ['mscorlib', 'System', 'System.Core', 'System.IO.Compression', 'System.Xml']
    # Compiling only these production readers proves that these workflows do not
    # need the normal application, WebView2, or its program directory.
    subprocess.run(compiler() + ['-nologo', '-nostdlib+', '-target:exe', '-out:' + str(probe)] +
        ['-r:' + str(refs / (name + '.dll')) for name in references] +
        ['-r:' + str(json_lib / 'net45/Newtonsoft.Json.dll'), '-r:' + str(crypto_lib / 'net461/BouncyCastle.Cryptography.dll')] +
        [str(ROOT / name) for name in ('tests/RescueProbe.cs', 'native/RescueData.cs', 'native/VaultCrypto.cs', 'native/VaultStore.cs')],
        check=True, cwd=ROOT)
    shutil.copy2(json_lib / 'net6.0/Newtonsoft.Json.dll', root)
    shutil.copy2(crypto_lib / 'net6.0/BouncyCastle.Cryptography.dll', root)
    (root / 'RescueProbe.runtimeconfig.json').write_text(json.dumps({
        'runtimeOptions': {'tfm': 'net8.0', 'framework': {'name': 'Microsoft.NETCore.App', 'version': '8.0.15'}}
    }))
    subprocess.run([DOTNET, str(probe), str(root / 'Prüfdaten')], check=True, cwd=root)
