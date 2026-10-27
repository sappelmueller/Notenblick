"""Content-addressed local evidence. Never used to waive a release test."""
from pathlib import Path
import hashlib,json,os,platform,shutil,subprocess,sys,datetime,time,locale,importlib.util,sysconfig
from contextlib import contextmanager
from testplan import ALL,expand,area
ROOT=Path(__file__).resolve().parents[1]

def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=True).encode()).hexdigest()

def environment(values=None):
    # Tests/builds are local. Per-tool authenticated proxy URLs and trace IDs
    # change on every orchestration call; remove them from child processes too.
    # Setup retains the original environment for authorized vendor downloads.
    values=os.environ if values is None else values
    volatile={'CODEX_TOOL_CALL_ID','CODEX_SESSION_ID','CODEX_FLORA_CCA_EXPECTED_EXECUTOR_PID','CODEX_EXEC_SERVER_REMOTE_BASE_URL','_','SHLVL','PWD','OLDPWD'}
    return {k:v for k,v in values.items() if k not in volatile and not k.upper().endswith('_PROXY') and not k.startswith('OTEL_')}


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
                result[str(file)]='link:'+os.readlink(file)
                target=file.resolve()
                if target.is_dir():result.update(inventory(root,[target],seen))
                elif target.is_file():result[str(file)]=digest([os.readlink(file),hashlib.sha256(file.read_bytes()).hexdigest(),file.stat().st_mode&0o777])
                else:result[str(file)]+=':missing'
            elif file.is_file():result[str(file)]=digest([hashlib.sha256(file.read_bytes()).hexdigest(),file.stat().st_mode&0o777])
            elif file==p:result[str(file)]='missing'
    return result

def source(root=ROOT):
    names=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0')
    # Full source identity, including docs/deletions, independent of commit dates.
    return inventory(root,filter(None,names))

def tools(root=ROOT):
    # Byte checks, not timestamps or package versions alone. No environment
    # values/credentials are written to disk, only their aggregate digest.
    paths=[sys.executable,shutil.which('node') or 'missing-node',root/'node_modules',root/'.tools/dotnet',root/'.tools/chromium',root/'.tools/browsers']
    # Export results are never cached, but release provenance also binds their
    # independent readers, Java validator and actual LibreOffice installation.
    for module in ['docx','openpyxl','pypdf','lxml','PIL']:
        spec=importlib.util.find_spec(module)
        if spec and spec.origin:paths.append(Path(spec.origin).parent)
    stdlib=Path(sysconfig.get_path('stdlib'))
    for folder,dirs,files in os.walk(stdlib):
        dirs[:]=[d for d in dirs if d not in ['site-packages','dist-packages','__pycache__']]
        paths.extend(Path(folder)/f for f in files if not f.endswith('.pyc'))
    java=shutil.which('java')
    if java:
        java_root=Path(java).resolve().parent.parent
        paths.extend(java_root/name for name in ['bin','lib','conf','release'])
    paths.append(Path(os.environ.get('NOTENBLICK_VERAPDF') or root/'.tools/verapdf/verapdf').resolve().parent)
    runtime=Path(os.environ.get('CODEX_PRIMARY_RUNTIME_ROOT','/nonexistent'))
    paths.extend([Path('/usr/share/fonts'),Path('/etc/fonts'),runtime/'dependencies/bin/override/soffice',runtime/'dependencies/native/libreoffice-headless/libreoffice'])
    if os.environ.get('NOTENBLICK_LIBREOFFICE'):paths.append(Path(os.environ['NOTENBLICK_LIBREOFFICE']).resolve().parent.parent)
    for name in ['NOTENBLICK_DOTNET','NOTENBLICK_CHROMIUM']:
        if os.environ.get(name):paths.append(Path(os.environ[name]).resolve().parent)
    return digest({'platform':platform.platform(),'python':sys.version,'day':datetime.date.today().isoformat(),'timezone':time.tzname,'locale':locale.getlocale(),'environment':digest(environment()),'files':inventory(root,paths)})

def task_key(name,tool_hash,root=ROOT):
    # Pure mathematics need no UI source. Shared test helpers are intentionally
    # conservative; a new helper cannot silently evade dependency invalidation.
    pure=name in ['domain-storage','transfers']
    paths=['dev','package.json','package-lock.json','global.json','.node-version','README.md','AGENTS.md']
    own={str(root/'tests'/(n+ext)) for n in expand([name]) for ext in ['.cjs','.py']}
    snapshot=source(root)
    selected={}
    for p,h in snapshot.items():
        path=Path(p)
        shared_test=path.is_relative_to(root/'tests') and area(path.relative_to(root).as_posix())=='shared'
        runtime=path.is_relative_to(root/'src/domain') or p==str(root/'src/core.js') if pure else path.is_relative_to(root/'src')
        if p in own or shared_test or any(path.is_relative_to(root/q) for q in paths) or path.is_relative_to(root/'native') or runtime:selected[p]=h
    return digest([name,tool_hash,selected])

def read(path):
    try:return json.loads(path.read_text())
    except (OSError,ValueError):return {}

def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(data,sort_keys=True,ensure_ascii=False));tmp.replace(path)

def valid(entry,key,root=ROOT):
    if entry.get('key')!=key or entry.get('exit_code')!=0 or not entry.get('complete') or not entry.get('outputs'):return False
    for name,sha in entry['outputs'].items():
        p=Path(name)
        if not p.resolve().is_relative_to(root.resolve()) or not p.is_file() or inventory(root,[p]).get(str(p))!=sha:return False
    return True

def outputs(root=ROOT):
    # Capture per-task changed/new outputs in the runner, not this complete set.
    paths=[root/'tests/exports',root/'tests/visual',root/'tests/native']
    paths.extend((root/'tests').glob('*results.json'))
    return {p:h for p,h in inventory(root,paths).items() if h!='missing'}

def component(name,inputs,outputs,action,root=ROOT):
    """Reuse immutable compilation products; release explicitly bypasses it."""
    fresh=os.environ.get('NOTENBLICK_FRESH_BUILD')=='1' and name!='openxml-validator'
    sdk=Path(os.environ.get('NOTENBLICK_DOTNET') or root/'.tools/dotnet'/('dotnet.exe' if os.name=='nt' else 'dotnet'))
    key=digest([inventory(root,[*inputs,sdk,sdk.parent/'host']),platform.platform(),environment()])
    folder=root/'.build/components'/name/key;manifest=read(folder/'manifest.json')
    if not fresh and manifest.get('key')==key and len(manifest.get('files',[]))==len(outputs):
        files=[folder/str(i) for i in range(len(outputs))]
        if all(f.is_file() and hashlib.sha256(f.read_bytes()).hexdigest()==h for f,h in zip(files,manifest['files'])):
            for f,dest in zip(files,outputs):Path(dest).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest)
            return True
    action();folder.mkdir(parents=True,exist_ok=True);hashes=[]
    for i,p in enumerate(outputs):
        p=Path(p);shutil.copy2(p,folder/str(i));hashes.append(hashlib.sha256(p.read_bytes()).hexdigest())
    write(folder/'manifest.json',{'key':key,'files':hashes});return False


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
