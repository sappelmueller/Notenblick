"""Resolve the local .NET SDK. No network access or package installation."""
from pathlib import Path
import os,re,shutil,subprocess
DOTNET=os.environ.get('NOTENBLICK_DOTNET') or shutil.which('dotnet') or '/tmp/notenblick-dotnet/dotnet'
def compiler():
    lines=subprocess.check_output([DOTNET,'--list-sdks'],text=True).splitlines()
    for line in reversed(lines):
        match=re.fullmatch(r'(\S+) \[(.+)\]',line.strip())
        if match and int(match[1].split('.')[0])>=8:
            path=Path(match[2])/match[1]/'Roslyn/bincore/csc.dll'
            if path.is_file():return [DOTNET,str(path)]
    raise RuntimeError('Ein installiertes .NET SDK ab Version 8 wird zum Erstellen benötigt.')
