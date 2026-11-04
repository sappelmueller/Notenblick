"""Local, content-bound evidence shared by development and release runs.

Checksums detect incomplete/corrupt local evidence, not a hostile machine owner.
No cache is a replacement for a Windows/NVDA acceptance test.
"""
from pathlib import Path
import hashlib,json,os,platform,shutil,subprocess,sys,time,locale,importlib.util,sysconfig,re,tempfile
from contextlib import contextmanager
from testplan import ALL,FILES,DEPENDENCIES,expand
ROOT=Path(__file__).resolve().parents[1]
SCHEMA=2
_FILE_HASHES={}

def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=True).encode()).hexdigest()

def file_hash(path):
    # Within one process unchanged stat identities avoid re-reading SDKs for
    # every group. A new invocation always hashes actual bytes again.
    p=Path(path);st=p.stat();identity=(str(p.resolve()),st.st_dev,st.st_ino,st.st_size,st.st_mtime_ns,st.st_ctime_ns,st.st_mode)
    if identity not in _FILE_HASHES:
        with p.open('rb') as stream:
            _FILE_HASHES[identity]=hashlib.file_digest(stream,'sha256').hexdigest()
    return _FILE_HASHES[identity]

def environment(values=None):
    values=os.environ if values is None else values
    volatile={'CODEX_TOOL_CALL_ID','CODEX_SESSION_ID','CODEX_FLORA_CCA_EXPECTED_EXECUTOR_PID','CODEX_EXEC_SERVER_REMOTE_BASE_URL','_','SHLVL','PWD','OLDPWD'}
    return {k:v for k,v in values.items() if k not in volatile and not k.upper().endswith('_PROXY') and not k.startswith('OTEL_')}

def conditions(values=None):
    # Only conditions read by the test tools. Orchestration IDs, date, report
    # directory and optional fresh/retry controls do not change a test case.
    values=environment(values)
    exact={'PATH','NODE_PATH','NODE_OPTIONS','PYTHONPATH','PYTHONHOME','PYTHONHASHSEED','TZ','LANG','LANGUAGE','LC_ALL','LC_CTYPE','HOME','TMPDIR','TEMP','TMP','SYSTEMROOT','WINDIR','COMSPEC','FONTCONFIG_PATH','FONTCONFIG_FILE','SAL_USE_VCLPLUGIN','LD_LIBRARY_PATH'}
    ignored={'NOTENBLICK_FRESH_BUILD','NOTENBLICK_OUTPUT','NOTENBLICK_CHECKPOINT_KEY','NOTENBLICK_NO_REUSE'}
    return {k:v for k,v in values.items() if (k in exact or k.startswith(('NOTENBLICK_','NB_','DOTNET_','COMPlus_','LC_'))) and k not in ignored}

def inventory(root,paths,_seen=None):
    result={};seen=set() if _seen is None else _seen
    for name in sorted(set(map(str,paths))):
        p=Path(name);p=p if p.is_absolute() else root/p
        if p.is_dir():
            resolved=p.resolve()
            if resolved in seen:continue
            seen.add(resolved)
        candidates=sorted(p.rglob('*')) if p.is_dir() else [p]
        for file in candidates:
            if '__pycache__' in file.parts or file.suffix=='.pyc':continue
            if file.is_symlink():
                result[str(file)]='link:'+os.readlink(file);target=file.resolve()
                if target.is_dir():result.update(inventory(root,[target],seen))
                elif target.is_file():result[str(file)]=digest([os.readlink(file),file_hash(file),file.stat().st_mode&0o777])
                else:result[str(file)]+=':missing'
            elif file.is_file():result[str(file)]=digest([file_hash(file),file.stat().st_mode&0o777])
            elif file==p:result[str(file)]='missing'
    return result

def source(root=ROOT):
    names=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0')
    return inventory(root,filter(None,names))

def node_packages(root,values):
    # Follow actual installed dependency trees, not an entire unrelated runtime
    # bundle exposed by NODE_PATH. Include transitive and optional dependencies.
    script="""const fs=require('fs'),path=require('path'),{createRequire}=require('module');
const req=createRequire(path.join(process.cwd(),'package.json')),seen=new Set(),missing=[];
function visit(name,from){try{let p=from.resolve(name);while(!fs.existsSync(path.join(p,'package.json'))){const parent=path.dirname(p);if(parent===p)throw Error(name);p=parent;}p=fs.realpathSync(p);if(seen.has(p))return;seen.add(p);const m=JSON.parse(fs.readFileSync(path.join(p,'package.json'))),next=createRequire(path.join(p,'package.json'));for(const n of Object.keys({...m.dependencies,...m.optionalDependencies}))visit(n,next);}catch{missing.push(name);}}
for(const name of Object.keys(require('./package.json').devDependencies||{}))visit(name,req);
process.stdout.write(JSON.stringify({files:[...seen].sort(),missing:missing.sort()}));"""
    try:
        data=json.loads(subprocess.check_output(['node','-e',script],cwd=root,env=values,stderr=subprocess.DEVNULL,text=True))
        return [*map(Path,data['files']),*[root/'.tools'/('missing-npm-'+n.replace('/','_')) for n in data['missing']]]
    except (OSError,ValueError,subprocess.SubprocessError):return [root/'node_modules',root/'package-lock.json']


def tools(root=ROOT,scope='all',values=None):
    values=environment(values);paths=[sys.executable]
    stdlib=Path(sysconfig.get_path('stdlib'))
    for folder,dirs,files in os.walk(stdlib):
        dirs[:]=[d for d in dirs if d not in ['site-packages','dist-packages','__pycache__']]
        paths.extend(Path(folder)/f for f in files if not f.endswith('.pyc'))
    if scope in ['all','node','browser','native','build','export']:
        paths.append(shutil.which('node') or 'missing-node')
    if scope in ['all','node','browser','native','export']:
        paths.extend(node_packages(root,values))
    if scope in ['all','browser','export']:
        paths.extend([root/'.tools/chromium',root/'.tools/browsers'])
        if values.get('NOTENBLICK_CHROMIUM'):paths.append(Path(values['NOTENBLICK_CHROMIUM']).parent)
    if scope in ['all','native','build','export']:
        paths.append(Path(values.get('NOTENBLICK_DOTNET') or root/'.tools/dotnet'/('dotnet.exe' if os.name=='nt' else 'dotnet')).parent)
    if scope in ['all','export']:
        for module in ['docx','openpyxl','pypdf','lxml','PIL']:
            spec=importlib.util.find_spec(module)
            if spec and spec.origin:paths.append(Path(spec.origin).parent)
        for binary in ['java','pdftotext','pdfinfo','fc-match']:
            found=shutil.which(binary)
            if found:paths.append(Path(found).resolve().parent.parent if binary=='java' else Path(found).resolve())
        paths.append(Path(values.get('NOTENBLICK_VERAPDF') or root/'.tools/verapdf/verapdf').resolve().parent)
        runtime=Path(values.get('CODEX_PRIMARY_RUNTIME_ROOT','/nonexistent'))
        paths.extend([Path('/usr/share/fonts'),Path('/etc/fonts'),runtime/'dependencies/bin/override/soffice',runtime/'dependencies/native/libreoffice-headless/libreoffice'])
        if values.get('NOTENBLICK_LIBREOFFICE'):paths.append(Path(values['NOTENBLICK_LIBREOFFICE']).resolve().parent.parent)
    return digest({'platform':platform.platform(),'machine':platform.machine(),'python':sys.version,'timezone':time.tzname,'locale':locale.getlocale(),'environment':conditions(values),'scope':scope,'files':inventory(root,paths)})

def scope(name):
    if name=='infrastructure':return 'python'
    if name in FILES:return 'export'
    if name in ['native-host','loader','update'] or name.endswith('-storage') or name in ['workflow','large']:return 'native'
    if name=='browser' or name.endswith('-browser') or name=='package-smoke':return 'browser'
    return 'node'

def test_sources(name,root=ROOT):
    """Literal local require closure plus conservative non-suite helper files.

    Dynamic module loading cannot silently omit a newly introduced helper.
    Application imports are covered separately by the runtime source set.
    """
    suites={root/'tests'/(n+ext) for n in ALL for ext in ['.cjs','.py']}
    selected={root/'tests'/(name+ext) for ext in ['.cjs','.py'] if (root/'tests'/(name+ext)).exists()}
    pending=list(selected)
    while pending:
        file=pending.pop()
        for relative in re.findall(r"require\(['\"](\.[^'\"]+)['\"]\)",file.read_text()):
            target=(file.parent/relative).resolve()
            if not target.suffix:target=target.with_suffix('.cjs')
            if target.is_file() and target.is_relative_to(root/'tests') and target not in selected:selected.add(target);pending.append(target)
    # Shared Python/C# fixtures, baselines and dynamically chosen JS helpers.
    selected.update(p for p in (root/'tests').rglob('*') if p.is_file() and p not in suites and p.suffix in ['.py','.cs','.json','.js'])
    if name=='native-host':selected.update([root/'tests/native-export-fixture.cjs',root/'tests/load.cjs',root/'tests/fixtures.cjs',root/'tests/dependencies.cjs'])
    if name=='update':selected.update(test_sources('update-ui',root))
    if name in ['domain-storage','transfers','large']:selected={p for p in selected if p.suffix not in ['.cs','.py']}
    selected.discard(root/'tests/test_management.py')
    return selected

def task_key(name,tool_hash,root=ROOT):
    if name not in ALL and name not in ['package-smoke','large-math']:raise ValueError('Unbekannte Prüfung: '+name)
    snapshot=source(root);selected={}
    own=test_sources('large' if name=='large-math' else name,root)
    control={'dev/evidence.py','dev/testplan.py','dev/manage.py'}
    pure=name in ['domain-storage','transfers','large-math']
    for p,h in snapshot.items():
        rel=Path(p).relative_to(root).as_posix()
        runtime=(rel.startswith('src/domain/') or rel=='src/core.js' or name=='domain-storage' and rel=='src/storage.js') if pure else rel.startswith('src/')
        native=not pure and rel.startswith('native/')
        dev=rel in control or rel in ['package.json','package-lock.json','.node-version','global.json']
        if name=='infrastructure':include=True
        else:
            include=p in map(str,own) or (runtime or native) and name not in FILES or dev
            if name in ['native-host','loader','update'] and rel.startswith('dev/') and rel not in ['dev/github-export.py','dev/audit.py','dev/bootstrap.py']:include=True
            if name in FILES and (rel=='dev/openxml-check.py' or rel.startswith('dev/openxml-validator/')):include=True
            if name=='export-files' and rel=='README.md':include=True
        if include:
            if rel=='package.json' and name!='infrastructure':
                meta=json.loads((root/rel).read_text());h=digest({k:meta.get(k) for k in ['version','devDependencies','engines']})
            selected[p]=h
    dependencies={} if name in FILES else {dep:task_key(dep,tool_hash,root) for dep in DEPENDENCIES.get(name,[])}
    return digest([SCHEMA,name,tool_hash,selected,dependencies])

def read(path):
    try:
        data=json.loads(Path(path).read_text());return data if isinstance(data,dict) else {}
    except (OSError,ValueError,TypeError):return {}

def write(path,data):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    # Unique staging files and fsync: a killed process never publishes a
    # half-written receipt, and an older successful record stays intact.
    fd,tmp=tempfile.mkstemp(prefix=path.name+'.',suffix='.tmp',dir=path.parent)
    try:
        with os.fdopen(fd,'w') as stream:json.dump(data,stream,sort_keys=True,ensure_ascii=False);stream.flush();os.fsync(stream.fileno())
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)

def sealed(data):
    data={k:v for k,v in data.items() if k!='seal'};data['schema']=SCHEMA;data['seal']=digest(data);return data

def intact(data):
    return isinstance(data,dict) and data.get('schema')==SCHEMA and data.get('seal')==digest({k:v for k,v in data.items() if k!='seal'})

def valid(entry,key,root=ROOT):
    if not intact(entry) or entry.get('key')!=key or entry.get('exit_code')!=0 or entry.get('complete') is not True or not isinstance(entry.get('outputs'),dict) or not entry['outputs']:return False
    try:
        for name,sha in entry['outputs'].items():
            p=Path(name)
            if not p.resolve().is_relative_to(root.resolve()) or not p.is_file() or p.is_symlink() or inventory(root,[p]).get(str(p))!=sha:return False
        return True
    except (OSError,ValueError,TypeError):return False

def record(folder,key,paths,root=ROOT,**metadata):
    """Persist immutable copies before the receipt; results survive SIGKILL."""
    folder=Path(folder);folder.mkdir(parents=True,exist_ok=True)
    outputs={};restore={}
    for i,name in enumerate(sorted(set(map(str,paths)))):
        p=Path(name)
        if not p.resolve().is_relative_to(root.resolve()) or p.is_symlink() or not p.is_file():raise ValueError('Ungültiger Nachweispfad: '+str(p))
        dest=folder/('file-'+str(i));shutil.copy2(p,dest);outputs.update(inventory(root,[dest]));restore[str(p)]=str(dest)
    entry=sealed({'key':key,'exit_code':0,'complete':True,'outputs':outputs,'restore':restore,**metadata})
    write(folder/'manifest.json',entry);return entry

def restore(entry,key,root=ROOT):
    if not valid(entry,key,root):return False
    mapping=entry.get('restore')
    if not isinstance(mapping,dict) or not all(isinstance(k,str) and isinstance(v,str) for k,v in mapping.items()) or set(mapping.values())!=set(entry['outputs']):return False
    for target,saved in mapping.items():
        p=Path(target)
        if not p.resolve().is_relative_to(root.resolve()) or p.is_symlink():return False
    for target,saved in mapping.items():
        p=Path(target);p.parent.mkdir(parents=True,exist_ok=True)
        if not p.is_file() or inventory(root,[p]).get(str(p))!=inventory(root,[Path(saved)]).get(saved):shutil.copy2(saved,p)
    return True

def outputs(root=ROOT):
    paths=[root/'tests/exports',root/'tests/visual',root/'tests/native']
    paths.extend((root/'tests').glob('*results.json'))
    return {p:h for p,h in inventory(root,paths).items() if h!='missing'}

def component(name,inputs,outputs,action,root=ROOT):
    fresh=os.environ.get('NOTENBLICK_FRESH_BUILD')=='1' and name!='openxml-validator'
    sdk=Path(os.environ.get('NOTENBLICK_DOTNET') or root/'.tools/dotnet'/('dotnet.exe' if os.name=='nt' else 'dotnet'))
    key=digest([inventory(root,[*inputs,sdk,sdk.parent/'host']),platform.platform(),conditions()])
    folder=root/'.build/components'/name/key;manifest=read(folder/'manifest.json')
    if not fresh and valid(manifest,key,root) and set(manifest.get('restore',{}))==set(map(str,outputs)) and restore(manifest,key,root):return True
    action();record(folder,key,outputs,root);return False


@contextmanager
def workspace_lock(root=ROOT):
    """OS-owned lock, released on crashes too; no stale success or PID heuristic."""
    folder=root/'.build';folder.mkdir(exist_ok=True)
    with (folder/'runner.lock').open('a+b') as stream:
        stream.seek(0,2)
        if not stream.tell():stream.write(b'0');stream.flush()
        stream.seek(0)
        try:
            if os.name=='nt':
                import msvcrt
                msvcrt.locking(stream.fileno(),msvcrt.LK_NBLCK,1)
            else:
                import fcntl
                fcntl.flock(stream.fileno(),fcntl.LOCK_EX|fcntl.LOCK_NB)
        except OSError as error:raise RuntimeError('Ein Entwicklungsprüflauf verwendet diese Arbeitskopie bereits.') from error
        try:yield
        finally:
            stream.seek(0)
            if os.name=='nt':msvcrt.locking(stream.fileno(),msvcrt.LK_UNLCK,1)
            else:fcntl.flock(stream.fileno(),fcntl.LOCK_UN)


def settled_files(folder,timeout=5,delay=.1,stable_passes=3):
    """Never publish transport staging files in a release allowlist.

    The workspace synchronizer can briefly expose .rsync-tmp while a compiler
    or copy finishes. Wait for its disappearance and consecutive identical
    snapshots; a persistent/unstable tree fails instead of being filtered out.
    """
    deadline=time.monotonic()+timeout;last=None;stable=0
    while time.monotonic()<deadline:
        files=sorted(p for p in folder.rglob('*') if p.is_file())
        transient=any('.rsync-tmp' in p.parts for p in folder.rglob('*'))
        if not transient:
            try:snapshot=inventory(folder,files)
            except OSError:snapshot=None
            if snapshot is not None and snapshot==last:stable+=1
            else:last=snapshot;stable=1
            if stable>=stable_passes:return files
        else:last=None;stable=0
        time.sleep(delay)
    raise RuntimeError('Build-Dateien sind noch instabil oder enthalten .rsync-tmp; keine vollständige Programmliste erstellt.')
