"""One local entry point: targeted development and resumable, fully evidenced releases."""
from pathlib import Path
import argparse,datetime,hashlib,json,os,platform,re,shutil,signal,subprocess,sys,tempfile,time,zipfile
from guard import check_root,check_paths,git
from bootstrap import setup,dotnet_path
from testplan import QUICK,STORAGE,BROWSER,FILES,ALL,DEPENDENCIES,select,changed,expand
import evidence as E
ROOT=Path(__file__).resolve().parents[1]
ENV={**os.environ,'NOTENBLICK_DOTNET':str(dotnet_path()),'PLAYWRIGHT_BROWSERS_PATH':str(ROOT/'.tools/browsers'),'DOTNET_CLI_TELEMETRY_OPTOUT':'1','DOTNET_NOLOGO':'1','NOTENBLICK_OUTPUT':str(ROOT/'artifacts')}
if not ENV.get('NOTENBLICK_CHROMIUM') and platform.system()=='Linux' and platform.machine()=='x86_64':
    ENV['NOTENBLICK_CHROMIUM']=str(ROOT/'.tools/chromium'/json.loads((ROOT/'dev/browser-lock.json').read_text())['executable'])
STEPS=[];REPORT=None;STATUS='running';FAILURE=None;PLAN={};SOURCE={};TOOLS='';REUSE=False;RELEASE=False;BUILD_OUTPUTS={}
STARTED=time.monotonic();PACKAGE_EVIDENCE=[];DETERMINISM={}


def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()


def result_files():return {str(p):(p.stat().st_mtime_ns,p.stat().st_size) for p in (ROOT/'tests').glob('*results.json')}


def output_stats():
    paths=[ROOT/'tests/exports',ROOT/'tests/visual',ROOT/'tests/native']
    files=[p for folder in paths if folder.exists() for p in folder.rglob('*') if p.is_file()]
    files+=list((ROOT/'tests').glob('*results.json'))
    return {str(p):(p.stat().st_mtime_ns,p.stat().st_size) for p in files}


def release_complete():
    tasks={s.get('task'):s for s in STEPS if s.get('task') in ALL}
    if set(tasks)!=set(ALL) or not DETERMINISM or not PACKAGE_EVIDENCE:return False
    if not all(s.get('exit_code')==0 and s.get('receipt') for s in tasks.values()):return False
    return any(s.get('task')=='package-smoke' and s.get('receipt') and s.get('exit_code')==0 for s in STEPS)


def save_report():
    if REPORT is None:return
    complete=STATUS=='passed' and bool(STEPS) and all(s['exit_code']==0 for s in STEPS)
    data={'schema':E.SCHEMA,'utc':stamp(),'version':json.loads((ROOT/'package.json').read_text())['version'],'git_head':git('rev-parse','HEAD'),
          'source_hash':E.digest(SOURCE),'tools_hash':TOOLS,'plan':PLAN,'platform':platform.platform(),'steps':STEPS,'status':STATUS,'failure':FAILURE,
          'all_steps_passed':complete,'release_eligible':RELEASE and complete and release_complete(),
          'runtime_outputs':BUILD_OUTPUTS,'packages':PACKAGE_EVIDENCE,'determinism':DETERMINISM,'wall_seconds':round(time.monotonic()-STARTED,2),'windows_gui_tested':False,'nvda_tested':False,'github_actions_used':False}
    E.write(REPORT/'summary.json',E.sealed(data))


def tool_identity(plan,runtime=True):
    scopes={E.scope(n) for n in plan.get('tests',[])}
    if runtime:scopes.add('build')
    return E.digest({scope:E.tools(ROOT,scope,ENV) for scope in sorted(scopes)})


def dependency_outputs(task,steps):
    result={}
    for dependency in DEPENDENCIES.get(task,[]):
        step=next((s for s in reversed(steps) if s.get('task')==dependency and s.get('exit_code')==0),{})
        entry=E.read(Path(step.get('receipt','')))
        if not E.valid(entry,step.get('key'),ROOT):raise ValueError('Gültiger Erzeugernachweis fehlt: '+dependency)
        files={}
        for target,saved in entry.get('restore',{}).items():
            path=Path(target)
            if path.is_relative_to(ROOT/'tests/exports') or path.is_relative_to(ROOT/'tests/native'):
                expected=entry['outputs'][saved]
                if E.inventory(ROOT,[path]).get(str(path))!=expected:raise ValueError('Erzeugerausgabe verändert: '+str(path))
                files[path.relative_to(ROOT).as_posix()]=expected
        result[dependency]=files
    return result


def task_identity(task,command,timeout,env,steps=None):
    env=dict(env)
    if task=='package-smoke':env.pop('NB_DIST',None)
    tool=E.tools(ROOT,E.scope(task),env)
    runtime=E.inventory(ROOT,[ROOT/'dist',ROOT/'.build/generated']) if task in ['loader','package-smoke'] else {}
    artifacts=dependency_outputs(task,STEPS if steps is None else steps) if task in FILES else {}
    if task in ['export-files','office-schema']:
        # These original validators enumerate top-level inputs, including files
        # left by another producer. Bind the actual complete consumed set too.
        folder=ROOT/'tests/exports'
        artifacts['enumerated']=E.inventory(ROOT,[p for p in folder.glob('*') if p.is_file() and not p.name.startswith('invalid-')])
    if env.get('NB_DIST'):runtime=E.inventory(ROOT,[Path(env['NB_DIST'])])
    if task=='export-files':runtime=E.inventory(ROOT,[ROOT/'.build/generated/Launcher.cs',ROOT/'dist/Programm/js/version.js'])
    return E.digest([E.task_key(task,tool,ROOT),runtime,artifacts,command,E.conditions(env),timeout])


def receipt_path(task,key):return ROOT/'.build/evidence'/('tasks/'+task)/key/'manifest.json'


def diagnostic(log):
    # Full bytes stay in the log. Only bounded evidence enters the terminal/AI.
    with log.open('rb') as f:f.seek(max(0,log.stat().st_size-65536));tail=f.read().decode('utf-8',errors='replace')
    lines=[line.strip() for line in tail.splitlines() if line.strip()]
    chosen=[l for l in lines if re.search(r'File ".*", line|\bat .*:[0-9]+|^FAIL|^ERROR|AssertionError|Error:|Exception:|^System\.|TIMEOUT',l)]
    return [l[:500] for l in (chosen[-8:] or lines[-6:])]


def run(label,command,timeout=300,extra_env=None,task=None):
    env=E.environment({**ENV,**(extra_env or {})});key=None
    cacheable=task in [*ALL,'package-smoke']
    if cacheable:
        key=task_identity(task,command,timeout,env);receipt=receipt_path(task,key);entry=E.read(receipt)
        if REUSE and E.restore(entry,key,ROOT):
            STEPS.append({'name':label,'task':task,'command':command,'timeout':timeout,'conditions':E.digest(E.conditions(env)),'exit_code':0,'seconds':0,'reused':True,'saved_seconds':entry.get('seconds',0),'key':key,'receipt':str(receipt)})
            print('WIEDERVERWENDET '+label,flush=True);save_report();return
        # A forced rerun which fails must not leave an older same-key success.
        if receipt.exists():receipt.unlink()
    before=output_stats() if cacheable else {};results_before=result_files();start=time.monotonic()
    log=REPORT/(str(len(STEPS)+1).zfill(2)+'.log')
    if task=='large':
        env['NOTENBLICK_CHECKPOINT_KEY']=E.task_key('large-math',E.tools(ROOT,'node',env),ROOT)
    env['NOTENBLICK_NO_REUSE']='0' if REUSE else '1'
    with log.open('wb') as stream:
        proc=subprocess.Popen(command,cwd=ROOT,env=env,stdout=stream,stderr=subprocess.STDOUT,start_new_session=os.name!='nt')
        try:code=proc.wait(timeout=timeout)
        except (subprocess.TimeoutExpired,KeyboardInterrupt) as error:
            if os.name=='nt':proc.kill()
            else:os.killpg(proc.pid,signal.SIGKILL)
            proc.wait();stream.write(('\n'+('TIMEOUT ' if isinstance(error,subprocess.TimeoutExpired) else 'ABBRUCH ')+label).encode());code=124 if isinstance(error,subprocess.TimeoutExpired) else 130
    step={'name':label,'task':task,'command':command,'timeout':timeout,'conditions':E.digest(E.conditions(env)),'exit_code':code,'seconds':round(time.monotonic()-start,3),'reused':False,'log':log.name,'log_bytes':log.stat().st_size}
    STEPS.append(step)
    for name,stat in result_files().items():
        if results_before.get(name)!=stat:shutil.copy2(name,REPORT/Path(name).name)
    print(('OK ' if code==0 else 'FEHLER ')+label+' · '+str(step['seconds'])+' s',flush=True)
    if code:
        step['diagnosis']=diagnostic(log);E.write(REPORT/'failure.json',{'step':step,'full_log':log.name})
        for line in step['diagnosis']:print(line,flush=True)
    elif cacheable:
        if key!=task_identity(task,command,timeout,env):raise RuntimeError(label+': Prüfbedingungen während der Prüfung verändert')
        after=output_stats();written=[name for name,stat in after.items() if before.get(name)!=stat]
        # Even stdout-only checks have a nonempty, byte-verified receipt/log.
        E.record(receipt.parent,key,[log,*written],ROOT,seconds=step['seconds'],task=task)
        step.update(key=key,receipt=str(receipt))
    save_report()
    if code:raise RuntimeError(label+' fehlgeschlagen (Exit '+str(code)+'); '+str(log))


def py(label,file,**kwargs):run(label,[sys.executable,file],**kwargs)


def verify_vendor():
    expected=json.loads((ROOT/'dev/vendor-lock.json').read_text());export=json.loads((ROOT/'dev/export-assets-lock.json').read_text())
    actual={p.relative_to(ROOT).as_posix() for folder in ['webview2','newtonsoft.json','microsoft.netframework.referenceassemblies.net48'] for p in (ROOT/'dev'/folder).rglob('*') if p.is_file()}
    assert set(expected)==actual,'Bibliotheksbestand unvollständig oder fremd'
    for name,sha in {**expected,**export['files']}.items():assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==sha,'Bibliotheksprüfsumme: '+name


def hashes():return {p.relative_to(ROOT/'dist').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'dist').rglob('*') if p.is_file()}


def build_key():
    names=['src','native','dev/build.py','dev/compile.py','dev/toolchain.py','dev/evidence.py','dev/load-order.json','dev/vendor-lock.json','dev/export-assets-lock.json','dev/sdk-lock.json','global.json','LICENSE','LICENSE-EXCEPTION','COPYRIGHT','THIRD-PARTY-NOTICES.md']
    inputs=E.inventory(ROOT,names)
    inputs['version']=json.loads((ROOT/'package.json').read_text())['version']
    return E.digest([inputs,E.tools(ROOT,'build',ENV)])


def build(fresh=False):
    global BUILD_OUTPUTS
    check_root();verify_vendor();dist=ROOT/'dist'
    assert not (dist/'Daten').exists() and not (dist/'Datensicherung').exists(),'Build enthält Nutzerdaten; nicht bereinigt'
    key=build_key();manifest=E.read(ROOT/'.build/runtime-build.json');current=E.inventory(ROOT,[dist,ROOT/'.build/generated'])
    if not fresh and E.valid(manifest,key,ROOT) and current==manifest['outputs']:
        print('BUILD unverändert, vollständige Datei-Prüfsummen bestätigt',flush=True);BUILD_OUTPUTS=E.inventory(ROOT,[dist]);return
    if dist.exists():shutil.rmtree(dist)
    extra={'NOTENBLICK_FRESH_BUILD':'1'} if fresh else {}
    py('Web-Programm erstellen','dev/build.py',extra_env=extra);py('Windows-Programm kompilieren','dev/compile.py',extra_env=extra)
    E.settled_files(dist)
    assert key==build_key(),'Buildvoraussetzungen während der Erstellung geändert'
    BUILD_OUTPUTS=E.inventory(ROOT,[dist]);E.write(ROOT/'.build/runtime-build.json',E.sealed({'key':key,'exit_code':0,'complete':True,'outputs':E.inventory(ROOT,[dist,ROOT/'.build/generated'])}))


def reproducible_build():
    global DETERMINISM
    key=build_key();path=ROOT/'.build/reproducibility'/key/'manifest.json';entry=E.read(path)
    if REUSE and E.valid(entry,key,ROOT) and entry.get('two_clean_builds') is True:
        build()
        if BUILD_OUTPUTS==entry.get('runtime_outputs'):
            DETERMINISM={'key':key,'receipt':str(path)};print('REPRODUZIERBARKEIT zwei saubere bytegleiche Builds nachgewiesen',flush=True);return
    # Both independent clean builds bypass every compiler component cache.
    build(fresh=True);first=hashes();build(fresh=True)
    assert hashes()==first,'Wiederholter Build ist nicht bytegleich'
    proof=REPORT/'determinism.json';E.write(proof,{'two_clean_builds':True,'byte_identical':True,'files':first})
    E.record(path.parent,key,[proof],ROOT,runtime_outputs=BUILD_OUTPUTS,two_clean_builds=True)
    DETERMINISM={'key':key,'receipt':str(path)};save_report()


def specification(name):
    fixed={
      'infrastructure':('Entwicklungsregressionen',[sys.executable,'tests/infrastructure.py'],300),
      'native-host':('Nativen Testhost erstellen',[sys.executable,'dev/test-native.py'],300),
      'large':('Großer Datenbestand',['node','--max-old-space-size=4096','tests/large.cjs'],900),
      'loader':('Produktiven Assembly-Lader prüfen',[sys.executable,'tests/loader.py'],300),
      'update':('Aktualisierungsregressionen',[sys.executable,'tests/update.py'],300),
      'package-smoke':('Entpackte Auslieferung starten',['node','tests/package-smoke.cjs'],300)}
    if name in fixed:return fixed[name]
    if name in FILES:return name,[sys.executable,'tests/'+name+'.py'],{'export-files':300,'office-schema':300,'v1120-files':900}.get(name,360)
    if name not in ALL:raise ValueError('Unbekannte Prüfung: '+name)
    return name,['node','tests/'+name+'.cjs'],360


def execute(name):
    label,command,timeout=specification(name);run(label,command,timeout=timeout,task=name)


def tests(profile):
    selected=PLAN.get('tests') if PLAN.get('tests') is not None else ALL if profile=='full' else []
    for name in expand(selected):execute(name)


def package(output=None):
    extra={'NOTENBLICK_OUTPUT':str(output)} if output else None
    py('ZIP-Archive vollständig erstellen','dev/package.py',extra_env=extra)
    version=json.loads((ROOT/'package.json').read_text())['version'];out=output or ROOT/'artifacts'
    paths=[out/('Notenblick_'+version+suffix) for suffix in ['.zip','_Quellcode.zip','_Pruefsummen.json','_Aktualisierung.json']]
    archive=paths[0]
    with tempfile.TemporaryDirectory(prefix='notenblick-package-') as tmp:
        with zipfile.ZipFile(archive) as z:
            assert z.testzip() is None;z.extractall(tmp)
        copied=Path(tmp)/'Notenblick'
        assert hashes()=={p.relative_to(copied).as_posix():E.file_hash(p) for p in copied.rglob('*') if p.is_file()}
        # Verify the extracted bytes every time; identical runtime smoke results
        # can be reused without keying on the random extraction directory.
        run('Entpackte Auslieferung starten',['node','tests/package-smoke.cjs'],extra_env={'NB_DIST':str(copied/'Programm')},task='package-smoke')
    with zipfile.ZipFile(paths[1]) as z:assert z.testzip() is None
    key=E.digest([E.digest(SOURCE),E.inventory(ROOT,paths),BUILD_OUTPUTS])
    folder=ROOT/'.build/packages'/key
    if output:
        # check-only's temporary files must still have verifiable lasting proof.
        receipt=E.record(folder,key,paths,ROOT)
        paths=[Path(receipt['restore'][str(p)]) for p in paths]
    PACKAGE_EVIDENCE.extend({'name':p.name,'path':str(p),'bytes':p.stat().st_size,'sha256':E.file_hash(p)} for p in paths)


def preflight(full=False):
    assert not sys.flags.optimize,'Python-Optimierung würde Sicherheitsprüfungen deaktivieren'
    if not ENV.get('NOTENBLICK_CHROMIUM'):
        ENV['NOTENBLICK_CHROMIUM']=subprocess.check_output(['node','-e','process.stdout.write(require("playwright").chromium.executablePath())'],cwd=ROOT,env=ENV,text=True)
    for file in [ENV['NOTENBLICK_DOTNET'],shutil.which('node') or 'missing-node',ENV.get('NOTENBLICK_CHROMIUM','')]:
        assert file and Path(file).is_file(),'Werkzeug fehlt: '+str(file)+'; manage.py setup ausführen'
    if full:
        validator=ENV.get('NOTENBLICK_VERAPDF') or ROOT/'.tools/verapdf/verapdf'
        lo=ENV.get('NOTENBLICK_LIBREOFFICE') or Path(ENV.get('CODEX_PRIMARY_RUNTIME_ROOT','/nonexistent'))/'dependencies/bin/override/soffice'
        assert Path(validator).is_file() and Path(lo).is_file(),'Exportwerkzeuge fehlen: siehe docs/EXPORT-PRUEFUNG.md'
        subprocess.run([sys.executable,'-c','import docx,openpyxl,pypdf'],check=True,stdout=subprocess.DEVNULL)


def evidence_current(data):
    try:return _evidence_current(data)
    except (OSError,ValueError,KeyError,TypeError):return False


def _evidence_current(data):
    if not E.intact(data) or not data.get('release_eligible') or data.get('status')!='passed':return False
    steps=data.get('steps',[]);tasks={s.get('task'):s for s in steps if s.get('task') in ALL}
    if set(tasks)!=set(ALL) or not all(s.get('exit_code')==0 for s in steps):return False
    for s in [*tasks.values(),*[s for s in steps if s.get('task')=='package-smoke']]:
        env=E.environment(ENV)
        # NB_DIST is intentionally excluded; all extracted bytes were compared
        # to the bound runtime before the independent smoke check.
        _,command,timeout=specification(s['task'])
        if command!=s.get('command') or timeout!=s.get('timeout'):return False
        key=task_identity(s['task'],command,timeout,env,steps)
        if s.get('key')!=key or not E.valid(E.read(Path(s.get('receipt',''))),key,ROOT):return False
    if not any(s.get('task')=='package-smoke' for s in steps):return False
    d=data.get('determinism',{});key=build_key();entry=E.read(Path(d.get('receipt','')))
    if d.get('key')!=key or entry.get('two_clean_builds') is not True or not E.valid(entry,key,ROOT) or entry.get('runtime_outputs')!=data.get('runtime_outputs'):return False
    packages=data.get('packages',[])
    if len(packages)!=4:return False
    for item in packages:
        p=Path(item.get('path',''))
        if not p.resolve().is_relative_to(ROOT.resolve()) or not p.is_file() or p.stat().st_size!=item.get('bytes') or E.file_hash(p)!=item.get('sha256'):return False
    return True


def audit(path):
    data=E.read(path)
    if not E.intact(data):return {'release_current':False,'evidence_current':False,'reason':'Unvollständiger, veralteter oder beschädigter Bericht','report':str(path)}
    same=E.digest(E.source(ROOT))==data.get('source_hash');tools_same=tool_identity(data.get('plan',{}),bool(data.get('runtime_outputs')))==data.get('tools_hash')
    current=E.inventory(ROOT,[ROOT/'dist']);runtime=current==data.get('runtime_outputs')
    index_matches=not git('diff','--name-only') and not git('ls-files','--others','--exclude-standard')
    proof=evidence_current(data) if same and tools_same and runtime else False
    valid=bool(index_matches) and proof
    return {'release_current':valid,'evidence_current':proof,'index_matches_tested_files':bool(index_matches),'source_current':same,'tools_current':tools_same,'runtime_current':runtime,'status':data.get('status'),'report':str(path)}


def retry_plan(current,previous):
    if not previous.get('plan',{}).get('tests'):raise ValueError('Kein vollständiger Wiederholungsplan im Bericht')
    return expand(set(current)|set(previous['plan']['tests']))


def main():
    global REPORT,STATUS,FAILURE,PLAN,SOURCE,TOOLS,REUSE,RELEASE
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['setup','doctor','plan','status','build','test','package','release'])
    parser.add_argument('profile',nargs='?',default='changed',choices=['changed','quick','storage','browser','stress','full'])
    parser.add_argument('--stage',choices=['develop','integration'],default='develop');parser.add_argument('--base',default='HEAD')
    parser.add_argument('--only',nargs='+',choices=ALL,help='Gezielte Diagnose, keine Integrations-/Releasefreigabe');parser.add_argument('--paths',nargs='+',help='Nur Plan-Simulation, kein Testnachweis');parser.add_argument('--retry',type=Path)
    parser.add_argument('--report',type=Path);parser.add_argument('--no-reuse',action='store_true');parser.add_argument('--check-only',action='store_true')
    args=parser.parse_args();check_root()
    if args.paths and args.command!='plan':parser.error('--paths ist nur für Plansimulationen erlaubt')
    if args.command=='setup':setup();return 0
    if args.command=='status':
        if not args.report:parser.error('status benötigt --report reports/.../summary.json')
        result=audit(args.report);print(json.dumps(result,ensure_ascii=False));return 0 if result['release_current'] else 1
    PLAN=select(args.paths if args.paths is not None else changed(ROOT,args.base),args.stage);PLAN['base']=args.base
    if args.only:
        if args.command not in ['plan','test'] or args.profile!='changed':parser.error('--only nur für gezielte changed-Prüfungen')
        PLAN['tests']=expand(['infrastructure',*args.only]);PLAN['manual_diagnostic']=True
    if args.command=='release':PLAN.update(stage='release',tests=list(ALL))
    elif args.command=='test' and args.profile!='changed':
        PLAN['tests']=expand({'quick':['infrastructure',*QUICK],'storage':['infrastructure',*STORAGE],'browser':['infrastructure',*BROWSER],'stress':['infrastructure','large'],'full':ALL}[args.profile])
    if args.retry:
        previous=E.read(args.retry/'summary.json' if args.retry.is_dir() else args.retry)
        PLAN['tests']=retry_plan(PLAN['tests'],previous);PLAN['retry_from']=str(args.retry)
    if args.command=='plan':print(json.dumps(PLAN,indent=2,ensure_ascii=False));return 0
    RELEASE=args.command=='release';full=RELEASE or args.profile=='full'
    REUSE=args.command in ['test','release'] and not args.no_reuse
    needs_runtime=args.command!='test' or any(n!='infrastructure' for n in PLAN['tests'])
    if needs_runtime:preflight(full)
    SOURCE=E.source(ROOT);TOOLS=tool_identity(PLAN,needs_runtime)
    REPORT=ROOT/'reports'/datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ');REPORT.mkdir(parents=True);save_report()
    try:
        if args.command=='doctor':
            verify_vendor();run('SDK',[str(dotnet_path()),'--list-sdks']);run('Node',['node','--version'])
        else:
            # Full coverage is a catalogue, not a request to destroy valid work.
            if RELEASE:reproducible_build()
            elif needs_runtime:build(fresh=args.no_reuse)
            if args.command=='test':tests(args.profile)
            elif args.command=='package':package()
            elif RELEASE:
                tests('full')
                if args.check_only:
                    with tempfile.TemporaryDirectory(prefix='release-check-',dir=ROOT/'.build') as tmp:package(Path(tmp))
                else:package()
        STATUS='passed'
    except (Exception,KeyboardInterrupt) as error:
        STATUS='failed';FAILURE=str(error);(REPORT/'FAILURE.txt').write_text(str(error))
    finally:
        stable=E.source(ROOT)==SOURCE and tool_identity(PLAN,needs_runtime)==TOOLS
        if not stable:
            STATUS='failed';FAILURE='Quellstand, Werkzeuge oder Prüfbedingungen während des Laufs verändert; erneut prüfen'
            (REPORT/'FAILURE.txt').write_text(FAILURE)
        if STATUS=='passed':
            for step in STEPS:
                if step.get('receipt') and not E.valid(E.read(Path(step['receipt'])),step.get('key'),ROOT):
                    STATUS='failed';FAILURE='Prüfnachweis beschädigt: '+step['name'];break
        save_report()
        if STATUS=='passed' and RELEASE and not evidence_current(E.read(REPORT/'summary.json')):
            STATUS='failed';FAILURE='Vollständiger aktueller Release-Nachweis fehlt';save_report()
    ran=sum(not s.get('reused') for s in STEPS);reused=len(STEPS)-ran
    print(('ERFOLGREICH' if STATUS=='passed' else 'FEHLGESCHLAGEN')+f' · {ran} ausgeführt · {reused} wiederverwendet · '+str(round(sum(s['seconds'] for s in STEPS),2))+' s · '+str(REPORT.relative_to(ROOT)))
    if FAILURE:print(FAILURE)
    return 0 if STATUS=='passed' else 1

if __name__=='__main__':
    def interrupted(signum,frame):raise KeyboardInterrupt('Prüflauf unterbrochen')
    signal.signal(signal.SIGTERM,interrupted)
    try:
        with E.workspace_lock():sys.exit(main())
    except (ValueError,AssertionError,RuntimeError,subprocess.SubprocessError) as error:print('VORPRÜFUNG: '+str(error),file=sys.stderr);sys.exit(1)
