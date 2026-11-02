"""Local, redacted audit of every reachable Git blob and optional release ZIPs."""
from pathlib import Path
import argparse,hashlib,json,re,subprocess,zipfile
from guard import SECRET_PATTERN,check_root

ROOT=Path(__file__).resolve().parents[1]
PRIVATE_PATH=re.compile(r'(?i)(?:^|/)(?:Daten|Datensicherung|Sicherungen|Notenlisten)(?:/|$)|(?:^|/)(?:\.env(?:\..*)?|notenverwaltung\.json|ansicht\.json)$|\.(?:pfx|p12|pem|key|bak)$')

def scan_bytes(data):
    # Decode without exposing matches; the same signatures also cover binary strings.
    return bool(re.search(SECRET_PATTERN,data.decode('utf-8','replace')))

def scan_repository(root):
    def git(*args):return subprocess.check_output(['git','-C',str(root),*args])
    objects=git('rev-list','--objects','--all').decode().splitlines()
    ids=[row.split(' ',1)[0] for row in objects]
    paths={row.split(' ',1)[0]:row.split(' ',1)[1] for row in objects if ' ' in row}
    kinds=subprocess.check_output(['git','-C',str(root),'cat-file','--batch-check=%(objectname) %(objecttype)'],input=('\n'.join(ids)+'\n').encode()).decode()
    blobs=[line.split()[0] for line in kinds.splitlines() if line.endswith(' blob')]
    findings=[]
    checked=set()
    # rev-list names each object only once. Inspect every tree as well so an
    # identical blob at both a harmless and a private path cannot hide the latter.
    for tree in set(git('log','--all','--format=%T').decode().splitlines()):
        for entry in git('ls-tree','-r','-z',tree).split(b'\0'):
            if not entry:continue
            meta,name=entry.split(b'\t',1);path=name.decode('utf-8','surrogateescape');sha=meta.split()[2].decode()
            if PRIVATE_PATH.search(path) and (sha,path) not in checked:
                findings.append({'kind':'private_path','object':sha,'path':path});checked.add((sha,path))
    for sha in blobs:
        path=paths.get(sha,'[historical blob]')
        if scan_bytes(git('cat-file','blob',sha)):findings.append({'kind':'credential','object':sha,'path':path})
    commits=git('rev-list','--all').decode().splitlines()
    personal=0
    for sha in commits:
        raw=git('cat-file','commit',sha).split(b'\n\n',1)[0]
        emails=re.findall(rb'^(?:author|committer) .*<([^>]+)>',raw,re.M)
        if any(not e.endswith((b'@users.noreply.github.com',b'@example.invalid')) for e in emails):personal+=1
    return {'commits':len(commits),'blobs':len(blobs),'findings':findings,'commits_with_personal_author_email':personal,'content_scan_passed':not findings,'publication_ready':not findings and personal==0}

def scan_archive(path):
    findings=[]
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None,'Defektes ZIP'
        for e in z.infolist():
            assert not e.filename.startswith(('/', '\\')) and '..' not in e.filename.replace('\\','/').split('/'),'Unsicherer ZIP-Pfad'
            if PRIVATE_PATH.search(e.filename):findings.append({'kind':'private_path','path':e.filename})
            if not e.is_dir() and scan_bytes(z.read(e)):findings.append({'kind':'credential','path':e.filename})
    return {'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'findings':findings,'passed':not findings}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archives',nargs='*',type=Path,default=[])
    args=parser.parse_args();check_root()
    result=scan_repository(ROOT);result['archives']=[scan_archive(p) for p in args.archives]
    result['publication_ready']=result['publication_ready'] and all(a['passed'] for a in result['archives'])
    print(json.dumps(result,ensure_ascii=False,indent=2))
    raise SystemExit(0 if result['publication_ready'] else 2)
