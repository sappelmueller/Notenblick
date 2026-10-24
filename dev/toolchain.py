"""Resolve the local .NET SDK. No network access or package installation."""
from pathlib import Path
import os,re,shutil,subprocess
ROOT=Path(__file__).resolve().parents[1]
DOTNET=os.environ.get('NOTENBLICK_DOTNET') or str(ROOT/'.tools/dotnet'/('dotnet.exe' if os.name=='nt' else 'dotnet'))
def compiler():
    lines=subprocess.check_output([DOTNET,'--list-sdks'],text=True).splitlines()
    for line in reversed(lines):
        match=re.fullmatch(r'(\S+) \[(.+)\]',line.strip())
        if match and match[1]=='8.0.426':
            path=Path(match[2])/match[1]/'Roslyn/bincore/csc.dll'
            if path.is_file():return [DOTNET,str(path)]
    raise RuntimeError('Das festgelegte .NET SDK fehlt. Zuerst python3 dev/manage.py setup ausführen.')
