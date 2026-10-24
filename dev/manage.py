"""One local entry point; no Actions, publication, paid service, or implicit push."""
from pathlib import Path
import argparse, datetime, hashlib, json, os, platform, shutil, signal, subprocess, sys, tempfile, time, zipfile
from guard import check_root, check_paths, git
from bootstrap import setup, dotnet_path

ROOT=Path(__file__).resolve().parents[1]
QUICK=['domain-storage','transfers','ui','new-features','v140','v150','v160','v170','v180','v190']
STORAGE=['view-storage','v150-storage','v160-storage','v170-storage','v180-storage','v190-storage','workflow']
BROWSER=['browser','v170-browser','v180-browser','v190-browser']
ENV=os.environ.copy()
ENV.update({'NOTENBLICK_DOTNET':str(dotnet_path()),'PLAYWRIGHT_BROWSERS_PATH':str(ROOT/'.tools/browsers'),
            'DOTNET_CLI_TELEMETRY_OPTOUT':'1','DOTNET_NOLOGO':'1','NOTENBLICK_OUTPUT':str(ROOT/'artifacts')})
if not ENV.get('NOTENBLICK_CHROMIUM') and (ROOT/'dev/browser-lock.json').is_file():
    browser_lock=json.loads((ROOT/'dev/browser-lock.json').read_text())
    if platform.system()=='Linux' and platform.machine()=='x86_64':
        ENV['NOTENBLICK_CHROMIUM']=str(ROOT/'.tools/chromium'/browser_lock['executable'])
STEPS=[]
REPORT=None
STATUS='running'
FAILURE=None

def run(label, command, timeout=300, extra_env=None):
    print('Prüfe: '+label,flush=True)
    start=time.monotonic()
    env={**ENV,**(extra_env or {})}
    proc=subprocess.Popen(command,cwd=ROOT,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,
                          text=True,start_new_session=(os.name!='nt'))
    try:
        output,_=proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        if os.name=='nt':proc.kill()
        else:os.killpg(proc.pid,signal.SIGKILL)
        output,_=proc.communicate()
        output+='\nTIMEOUT: '+label
        proc.returncode=124
    step={'name':label,'command':command,'exit_code':proc.returncode,'seconds':round(time.monotonic()-start,2)}
    STEPS.append(step)
    (REPORT/(str(len(STEPS)).zfill(2)+'.log')).write_text(output,encoding='utf-8')
    print('\n'.join(output.splitlines()[-8:]),flush=True)
    save_report()
    if proc.returncode:
        raise RuntimeError(label+' fehlgeschlagen; Details: '+str(REPORT))

def py(label, file):
    run(label,[sys.executable,file])

def save_report():
    data={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'version':json.loads((ROOT/'package.json').read_text())['version'],
          'platform':platform.platform(),'steps':STEPS,'status':STATUS,'failure':FAILURE,'all_steps_passed':bool(STEPS) and all(s['exit_code']==0 for s in STEPS),
          'windows_gui_tested':False,'nvda_tested':False,'github_actions_used':False}
    (REPORT/'summary.json').write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
    for p in (ROOT/'tests').glob('*results.json'):
        shutil.copy2(p,REPORT/p.name)

def verify_vendor():
    expected=json.loads((ROOT/'dev/vendor-lock.json').read_text())
    actual={p.relative_to(ROOT).as_posix() for folder in ['webview2','newtonsoft.json','microsoft.netframework.referenceassemblies.net48'] for p in (ROOT/'dev'/folder).rglob('*') if p.is_file()}
    assert set(expected)==actual, 'Bibliotheksbestand ist unvollständig oder enthält fremde Dateien'
    for name,sha in expected.items():
        assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==sha, 'Bibliotheksprüfsumme: '+name

def build():
    check_root();verify_vendor()
    dist=ROOT/'dist'
    if dist.exists():
        assert not (dist/'Daten').exists() and not (dist/'Datensicherung').exists(), 'Build enthält Nutzerdaten; nicht bereinigt'
        shutil.rmtree(dist)
    py('Web-Programm erstellen','dev/build.py')
    py('Windows-Programm kompilieren','dev/compile.py')

def js(names):
    for name in names:
        run(name,['node','tests/'+name+'.cjs'],timeout=360)

def tests(profile):
    py('Entwicklungsregressionen','tests/infrastructure.py')
    if profile in {'quick','full'}:js(QUICK)
    if profile in {'storage','full','stress'}:
        py('Nativen Testhost erstellen','dev/test-native.py')
    if profile in {'storage','full'}:js(STORAGE)
    if profile in {'full','stress'}:
        run('Großer Datenbestand',['node','--max-old-space-size=4096','tests/large.cjs'],timeout=900)
    if profile=='full':py('Produktiven Assembly-Lader prüfen','tests/loader.py')
    if profile in {'browser','full'}:js(BROWSER)

def hashes():
    return {p.relative_to(ROOT/'dist').as_posix():hashlib.sha256(p.read_bytes()).hexdigest()
            for p in (ROOT/'dist').rglob('*') if p.is_file()}

def package():
    py('ZIP-Archive vollständig erstellen','dev/package.py')
    version=json.loads((ROOT/'package.json').read_text())['version']
    with tempfile.TemporaryDirectory(prefix='notenblick-package-') as tmp:
        with zipfile.ZipFile(ROOT/'artifacts'/('Notenblick_'+version+'.zip')) as z:
            assert z.testzip() is None
            z.extractall(tmp)
        copied=Path(tmp)/'Notenblick'
        assert hashes()=={p.relative_to(copied).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in copied.rglob('*') if p.is_file()}
        run('Entpackte Auslieferung starten',['node','tests/package-smoke.cjs'],extra_env={'NB_DIST':str(copied/'Programm')})

def main():
    global REPORT,STATUS,FAILURE
    parser=argparse.ArgumentParser()
    parser.add_argument('command',choices=['setup','doctor','build','test','package','release'])
    parser.add_argument('profile',nargs='?',default='quick',choices=['quick','storage','browser','stress','full'])
    args=parser.parse_args()
    check_root()
    if args.command=='setup':setup();return
    REPORT=ROOT/'reports'/datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    REPORT.mkdir(parents=True)
    # Remove only generated old test reports; stale successes must not survive a failed run.
    for p in (ROOT/'tests').glob('*results.json'):p.unlink()
    try:
        if args.command=='doctor':
            verify_vendor()
            run('SDK',[str(dotnet_path()),'--list-sdks'])
            run('Node',['node','--version'])
            run('Gesperrte npm-Abhängigkeiten',['node','-e',"for(const n of ['jsdom','axe-core','playwright'])console.log(n,require(n+'/package.json').version)"])
        else:
            build()
            if args.command=='test':tests(args.profile)
            elif args.command=='package':package()
            elif args.command=='release':
                tests('full')
                first=hashes()
                build()
                assert hashes()==first,'Wiederholter Build ist nicht bytegleich'
                py('Assembly-Lader nach Wiederholungsbuild','tests/loader.py')
                package()
                (REPORT/'determinism.json').write_text(json.dumps({'byte_identical':True,'files':first},indent=2)+'\n')
        STATUS='passed'
        save_report()
        print('Erfolgreich. Bericht: '+str(REPORT))
    except Exception as error:
        STATUS='failed';FAILURE=str(error)
        save_report()
        (REPORT/'FAILURE.txt').write_text(str(error)+'\n')
        raise

if __name__=='__main__':
    main()
