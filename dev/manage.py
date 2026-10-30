"""One local entry point: targeted development, integration, fresh full release."""
from pathlib import Path
import argparse,datetime,hashlib,json,os,platform,re,shutil,signal,subprocess,sys,tempfile,time,zipfile
from guard import check_root,check_paths,git
from bootstrap import setup,dotnet_path
from testplan import QUICK,STORAGE,BROWSER,FILES,ALL,select,changed,expand
import evidence as E
ROOT=Path(__file__).resolve().parents[1]
ENV={**os.environ,'NOTENBLICK_DOTNET':str(dotnet_path()),'PLAYWRIGHT_BROWSERS_PATH':str(ROOT/'.tools/browsers'),'DOTNET_CLI_TELEMETRY_OPTOUT':'1','DOTNET_NOLOGO':'1','NOTENBLICK_OUTPUT':str(ROOT/'artifacts')}
if not ENV.get('NOTENBLICK_CHROMIUM') and platform.system()=='Linux' and platform.machine()=='x86_64':
    ENV['NOTENBLICK_CHROMIUM']=str(ROOT/'.tools/chromium'/json.loads((ROOT/'dev/browser-lock.json').read_text())['executable'])
STEPS=[];REPORT=None;STATUS='running';FAILURE=None;PLAN={};SOURCE={};TOOLS='';REUSE=False;RELEASE=False;PENDING={};BUILD_OUTPUTS={}
STARTED=time.monotonic();PACKAGE_EVIDENCE=[]
CACHE=ROOT/'.build/test-evidence.json'


def stamp():return datetime.datetime.now(datetime.timezone.utc).isoformat()


def result_files():return {str(p):(p.stat().st_mtime_ns,p.stat().st_size) for p in (ROOT/'tests').glob('*results.json')}


def output_stats():
    paths=[ROOT/'tests/exports',ROOT/'tests/visual',ROOT/'tests/native']
    files=[p for folder in paths if folder.exists() for p in folder.rglob('*') if p.is_file()]
    files+=list((ROOT/'tests').glob('*results.json'))
    return {str(p):(p.stat().st_mtime_ns,p.stat().st_size) for p in files}


def save_report():
    if REPORT is None:return
    complete=STATUS=='passed' and bool(STEPS) and all(s['exit_code']==0 for s in STEPS)
    data={'utc':stamp(),'version':json.loads((ROOT/'package.json').read_text())['version'],'git_head':git('rev-parse','HEAD'),
          'source_hash':E.digest(SOURCE),'tools_hash':TOOLS,'plan':PLAN,'platform':platform.platform(),'steps':STEPS,'status':STATUS,'failure':FAILURE,
          'all_steps_passed':complete,'release_eligible':RELEASE and complete and len(STEPS)==len(ALL)+7 and not any(s.get('reused') for s in STEPS),
          'runtime_outputs':BUILD_OUTPUTS,'packages':PACKAGE_EVIDENCE,'wall_seconds':round(time.monotonic()-STARTED,2),'windows_gui_tested':False,'nvda_tested':False,'github_actions_used':False}
    E.write(REPORT/'summary.json',data)


def diagnostic(log):
    # Full bytes stay in the log. Only bounded evidence enters the terminal/AI.
    with log.open('rb') as f:f.seek(max(0,log.stat().st_size-65536));tail=f.read().decode('utf-8',errors='replace')
    lines=[line.strip() for line in tail.splitlines() if line.strip()]
    chosen=[l for l in lines if re.search(r'File ".*", line|\bat .*:[0-9]+|^FAIL|^ERROR|AssertionError|Error:|Exception:|^System\.|TIMEOUT',l)]
    return [l[:500] for l in (chosen[-8:] or lines[-6:])]


def run(label,command,timeout=300,extra_env=None,task=None):
    env=E.environment({**ENV,**(extra_env or {})});key=None
    cacheable=REUSE and task in ALL and task not in ['infrastructure','native-host','large','loader',*FILES]
    if cacheable:
        key=E.digest([E.task_key(task,TOOLS),command,E.digest(env),timeout]);entry=E.read(CACHE).get(task,{})
        if E.valid(entry,key):
            STEPS.append({'name':label,'task':task,'command':command,'exit_code':0,'seconds':0,'reused':True,'evidence':entry.get('report')})
            print('WIEDERVERWENDET '+label,flush=True);save_report();return
    before=output_stats() if cacheable else {};results_before=result_files();start=time.monotonic()
    log=REPORT/(str(len(STEPS)+1).zfill(2)+'.log')
    with log.open('wb') as stream:
        proc=subprocess.Popen(command,cwd=ROOT,env=env,stdout=stream,stderr=subprocess.STDOUT,start_new_session=os.name!='nt')
        try:code=proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            if os.name=='nt':proc.kill()
            else:os.killpg(proc.pid,signal.SIGKILL)
            proc.wait();stream.write(('\nTIMEOUT '+label).encode());code=124
    step={'name':label,'task':task,'command':command,'exit_code':code,'seconds':round(time.monotonic()-start,2),'reused':False,'log':log.name,'log_bytes':log.stat().st_size}
    STEPS.append(step)
    for name,stat in result_files().items():
        if results_before.get(name)!=stat:shutil.copy2(name,REPORT/Path(name).name)
    print(('OK ' if code==0 else 'FEHLER ')+label+' · '+str(step['seconds'])+' s',flush=True)
    if code:
        step['diagnosis']=diagnostic(log);E.write(REPORT/'failure.json',{'step':step,'full_log':log.name})
        for line in step['diagnosis']:print(line,flush=True)
    elif cacheable:
        after=output_stats();written=[name for name,stat in after.items() if before.get(name)!=stat]
        PENDING[task]={'key':key,'exit_code':0,'complete':True,'outputs':E.inventory(ROOT,written),'report':str(REPORT),'source_after':E.digest([E.task_key(task,TOOLS),command,E.digest(env),timeout])}
    save_report()
    if code:raise RuntimeError(label+' fehlgeschlagen (Exit '+str(code)+'); '+str(log))


def py(label,file,**kwargs):run(label,[sys.executable,file],**kwargs)


def verify_vendor():
    expected=json.loads((ROOT/'dev/vendor-lock.json').read_text());export=json.loads((ROOT/'dev/export-assets-lock.json').read_text())
    actual={p.relative_to(ROOT).as_posix() for folder in ['webview2','newtonsoft.json','microsoft.netframework.referenceassemblies.net48'] for p in (ROOT/'dev'/folder).rglob('*') if p.is_file()}
    assert set(expected)==actual,'Bibliotheksbestand unvollständig oder fremd'
    for name,sha in {**expected,**export['files']}.items():assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==sha,'Bibliotheksprüfsumme: '+name


def hashes():return {p.relative_to(ROOT/'dist').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'dist').rglob('*') if p.is_file()}


def build(fresh=False):
    global BUILD_OUTPUTS
    check_root();verify_vendor();dist=ROOT/'dist'
    assert not (dist/'Daten').exists() and not (dist/'Datensicherung').exists(),'Build enthält Nutzerdaten; nicht bereinigt'
    inputs={p:h for p,h in E.source(ROOT).items() if Path(p).is_relative_to(ROOT/'src') or Path(p).is_relative_to(ROOT/'native') or p in [str(ROOT/n) for n in ['package.json','dev/build.py','dev/compile.py','dev/toolchain.py','dev/evidence.py','dev/load-order.json','dev/vendor-lock.json','dev/export-assets-lock.json']]}
    inputs[str(ROOT/'package.json')]=E.digest(json.loads((ROOT/'package.json').read_text())['version'])
    key=E.digest([inputs,TOOLS]);manifest=E.read(ROOT/'.build/runtime-build.json');current=E.inventory(ROOT,[dist,ROOT/'.build/generated'])
    if not fresh and E.valid(manifest,key) and current==manifest['outputs']:
        print('BUILD unverändert, vollständige Datei-Prüfsummen bestätigt',flush=True);BUILD_OUTPUTS=E.inventory(ROOT,[dist]);return
    if dist.exists():shutil.rmtree(dist)
    extra={'NOTENBLICK_FRESH_BUILD':'1'} if fresh else {}
    py('Web-Programm erstellen','dev/build.py',extra_env=extra);py('Windows-Programm kompilieren','dev/compile.py',extra_env=extra)
    E.settled_files(dist)
    BUILD_OUTPUTS=E.inventory(ROOT,[dist]);E.write(ROOT/'.build/runtime-build.json',{'key':key,'exit_code':0,'complete':True,'outputs':E.inventory(ROOT,[dist,ROOT/'.build/generated'])})


def execute(name):
    if name=='infrastructure':py('Entwicklungsregressionen','tests/infrastructure.py',task=name)
    elif name=='native-host':py('Nativen Testhost erstellen','dev/test-native.py',task=name)
    elif name=='large':run('Großer Datenbestand',['node','--max-old-space-size=4096','tests/large.cjs'],timeout=900,task=name)
    elif name=='loader':py('Produktiven Assembly-Lader prüfen','tests/loader.py',task=name)
    elif name in FILES:py(name,'tests/'+name+'.py',timeout={'export-files':300,'office-schema':300,'v1120-files':900,'v1130-files':360,'v1140-files':360,'v1170-files':360,'v1200-files':360,'v1201-files':360,'v1202-files':360,'v1203-files':360,'v1210-files':360}[name],task=name)
    else:run(name,['node','tests/'+name+'.cjs'],timeout=360,task=name)


def tests(profile):
    selected=PLAN.get('tests') if profile=='changed' else {'quick':['infrastructure',*QUICK],'storage':['infrastructure',*STORAGE],'browser':['infrastructure',*BROWSER],'stress':['infrastructure','large'],'full':ALL}[profile]
    for name in expand(selected):execute(name)


def package(output=None):
    extra={'NOTENBLICK_OUTPUT':str(output)} if output else None
    py('ZIP-Archive vollständig erstellen','dev/package.py',extra_env=extra)
    version=json.loads((ROOT/'package.json').read_text())['version']
    archive=(output or ROOT/'artifacts')/('Notenblick_'+version+'.zip')
    PACKAGE_EVIDENCE.append({'name':archive.name,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'temporary':output is not None})
    with tempfile.TemporaryDirectory(prefix='notenblick-package-') as tmp:
        with zipfile.ZipFile((output or ROOT/'artifacts')/('Notenblick_'+version+'.zip')) as z:
            assert z.testzip() is None;z.extractall(tmp)
        copied=Path(tmp)/'Notenblick'
        assert hashes()=={p.relative_to(copied).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in copied.rglob('*') if p.is_file()}
        run('Entpackte Auslieferung starten',['node','tests/package-smoke.cjs'],extra_env={'NB_DIST':str(copied/'Programm')})


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


def audit(path):
    data=E.read(path);same=E.digest(E.source())==data.get('source_hash');tools_same=E.tools()==data.get('tools_hash')
    current=E.inventory(ROOT,[ROOT/'dist']);runtime=current==data.get('runtime_outputs')
    index_matches=not git('diff','--name-only') and not git('ls-files','--others','--exclude-standard')
    valid=bool(index_matches) and data.get('release_eligible') is True and data.get('status')=='passed' and same and tools_same and runtime
    return {'release_current':valid,'index_matches_tested_files':bool(index_matches),'source_current':same,'tools_current':tools_same,'runtime_current':runtime,'status':data.get('status'),'report':str(path)}


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
    if args.retry:
        previous=E.read(args.retry/'summary.json' if args.retry.is_dir() else args.retry)
        PLAN['tests']=retry_plan(PLAN['tests'],previous);PLAN['retry_from']=str(args.retry)
    if args.command=='release':PLAN.update(stage='release',tests=list(ALL))
    elif args.command=='test' and args.profile!='changed':
        PLAN['tests']=expand({'quick':['infrastructure',*QUICK],'storage':['infrastructure',*STORAGE],'browser':['infrastructure',*BROWSER],'stress':['infrastructure','large'],'full':ALL}[args.profile])
    if args.command=='plan':print(json.dumps(PLAN,indent=2,ensure_ascii=False));return 0
    RELEASE=args.command=='release';full=RELEASE or args.profile=='full'
    REUSE=args.command=='test' and args.profile=='changed' and not args.no_reuse
    preflight(full);SOURCE=E.source();TOOLS=E.tools()
    REPORT=ROOT/'reports'/datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ');REPORT.mkdir(parents=True);save_report()
    try:
        if args.command=='doctor':
            verify_vendor();run('SDK',[str(dotnet_path()),'--list-sdks']);run('Node',['node','--version'])
        else:
            # Fresh full runs have no result or generated-export reuse.
            if full:
                for p in (ROOT/'tests').glob('*results.json'):p.unlink()
                for folder in ['exports','visual']:
                    path=ROOT/'tests'/folder
                    if path.exists():assert not path.is_symlink();shutil.rmtree(path)
                ENV['NOTENBLICK_FRESH_BUILD']='1'
            needs_runtime=args.command!='test' or any(n!='infrastructure' for n in (PLAN['tests'] if args.profile=='changed' else ['all']))
            if needs_runtime:build(fresh=full)
            if args.command=='test':tests(args.profile)
            elif args.command=='package':package()
            elif RELEASE:
                tests('full');first=hashes();build(fresh=True);assert hashes()==first,'Wiederholter Build ist nicht bytegleich'
                py('Assembly-Lader nach Wiederholungsbuild','tests/loader.py')
                if args.check_only:
                    with tempfile.TemporaryDirectory(prefix='notenblick-release-check-') as tmp:package(Path(tmp))
                else:package()
                E.write(REPORT/'determinism.json',{'byte_identical':True,'files':first})
        STATUS='passed'
    except Exception as error:
        STATUS='failed';FAILURE=str(error);(REPORT/'FAILURE.txt').write_text(str(error))
    finally:
        stable=E.source()==SOURCE and E.tools()==TOOLS
        if not stable:
            STATUS='failed';FAILURE='Quellstand, Werkzeuge oder Prüfbedingungen während des Laufs verändert; erneut prüfen'
            (REPORT/'FAILURE.txt').write_text(FAILURE)
        if stable and PENDING:
            cache=E.read(CACHE)
            for name,item in PENDING.items():
                if item['key']==item.pop('source_after') and E.valid(item,item['key']):cache[name]=item
            E.write(CACHE,cache)
        save_report()
    ran=sum(not s.get('reused') for s in STEPS);reused=len(STEPS)-ran
    print(('ERFOLGREICH' if STATUS=='passed' else 'FEHLGESCHLAGEN')+f' · {ran} ausgeführt · {reused} wiederverwendet · '+str(round(sum(s['seconds'] for s in STEPS),2))+' s · '+str(REPORT.relative_to(ROOT)))
    if FAILURE:print(FAILURE)
    return 0 if STATUS=='passed' else 1

if __name__=='__main__':
    try:
        with E.workspace_lock():sys.exit(main())
    except (ValueError,AssertionError,RuntimeError,subprocess.SubprocessError) as error:print('VORPRÜFUNG: '+str(error),file=sys.stderr);sys.exit(1)
