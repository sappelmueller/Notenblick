"""Pinned, checksum-verified project-local SDK and locked test dependencies."""
from pathlib import Path
import hashlib, json, os, platform, shutil, subprocess, sys, tarfile, urllib.request, zipfile
from evidence import digest as fingerprint,inventory,read,write

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT/'.tools'

def dotnet_path():
    return Path(os.environ.get('NOTENBLICK_DOTNET') or TOOLS/'dotnet'/('dotnet.exe' if os.name=='nt' else 'dotnet'))

def setup():
    TOOLS.mkdir(exist_ok=True)
    lock = json.loads((ROOT/'dev/sdk-lock.json').read_text())
    executable = dotnet_path()
    if not executable.is_file():
        arch = {'x86_64':'x64','AMD64':'x64','aarch64':'arm64','ARM64':'arm64'}.get(platform.machine())
        rid = ('win' if os.name=='nt' else 'linux')+'-'+str(arch)
        assert rid in lock['files'], 'Für diese Plattform ist kein SDK festgelegt: '+rid
        item = lock['files'][rid]
        archive = TOOLS/item['name']
        print('Installiere .NET SDK '+lock['version'], flush=True)
        digest = hashlib.sha512()
        with urllib.request.urlopen(item['url'], timeout=60) as source, archive.open('wb') as dest:
            while chunk := source.read(1024*1024):
                digest.update(chunk); dest.write(chunk)
        assert digest.hexdigest() == item['hash'].lower(), 'SDK-Prüfsumme stimmt nicht'
        target = TOOLS/'dotnet'
        target.mkdir(exist_ok=True)
        if archive.suffix == '.zip':
            with zipfile.ZipFile(archive) as z:
                for name in z.namelist():
                    assert (target/name).resolve().is_relative_to(target.resolve()), 'Ungültiger SDK-Pfad'
                z.extractall(target)
        else:
            with tarfile.open(archive) as tar:
                tar.extractall(target, filter='data')
        archive.unlink()
    installed = subprocess.check_output([str(executable),'--list-sdks'],cwd=ROOT,text=True).splitlines()
    assert any(line.startswith(lock['version']+' [') for line in installed), 'Erwartetes SDK fehlt: '+lock['version']
    npm = shutil.which('npm.cmd' if os.name=='nt' else 'npm')
    assert npm, 'Node.js/npm fehlen. Version siehe .node-version.'
    state = TOOLS/'npm-state.json'
    packages=json.loads((ROOT/'package-lock.json').read_text())['packages']
    packages[''].pop('version',None)
    expected=fingerprint([packages,inventory(ROOT,[shutil.which('node'),Path(npm).resolve()])])
    installed=inventory(ROOT,[ROOT/'node_modules']);previous=read(state)
    if previous.get('key')!=expected or previous.get('files')!=installed or not (ROOT/'node_modules').is_dir():
        subprocess.run([npm,'ci','--ignore-scripts','--no-audit','--no-fund'],cwd=ROOT,check=True)
        write(state,{'key':expected,'files':inventory(ROOT,[ROOT/'node_modules'])})
    env = os.environ.copy()
    env['PLAYWRIGHT_BROWSERS_PATH'] = str(TOOLS/'browsers')
    browser_lock = ROOT/'dev/browser-lock.json'
    if platform.system()=='Linux' and platform.machine()=='x86_64' and browser_lock.is_file():
        browser = json.loads(browser_lock.read_text())
        target = TOOLS/'chromium'
        marker = target/'installed-lock.sha256'
        expected_browser = hashlib.sha256(browser_lock.read_bytes()).hexdigest()
        if not (target/browser['executable']).is_file() or not marker.is_file() or marker.read_text()!=expected_browser:
            archive=TOOLS/'chromium.zip'
            digest=hashlib.sha256()
            with urllib.request.urlopen(browser['url'],timeout=60) as source,archive.open('wb') as dest:
                while chunk:=source.read(1024*1024):digest.update(chunk);dest.write(chunk)
            assert digest.hexdigest()==browser['sha256'], 'Testbrowser-Prüfsumme stimmt nicht'
            target.mkdir(exist_ok=True)
            with zipfile.ZipFile(archive) as z:
                for item in z.infolist():
                    assert (target/item.filename).resolve().is_relative_to(target.resolve()), 'Ungültiger Browserpfad'
                    z.extract(item,target)
                    mode=item.external_attr>>16
                    if mode:(target/item.filename).chmod(mode&0o777)
            archive.unlink();marker.write_text(expected_browser)
    else:
        subprocess.run([npm,'exec','--','playwright','install','chromium','--only-shell'],cwd=ROOT,env=env,check=True)
    subprocess.run(['git','-C',str(ROOT),'config','--local','core.hooksPath','.githooks'],check=True)
    if os.name != 'nt':
        for p in (ROOT/'.githooks').iterdir():
            p.chmod(0o755)
    subprocess.run([sys.executable,str(ROOT/'dev/openxml-check.py'),'setup'],cwd=ROOT,env=env,check=True)
    print('Einrichtung vollständig. SDK, npm-Lockdatei und Chromium bereit.')

if __name__ == '__main__':
    setup()
