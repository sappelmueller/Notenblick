from pathlib import Path
import base64,json,re,subprocess,sys
r=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(r/'dev'))
from guard import check_root
check_root()
def git(*args):return subprocess.check_output(['git','-C',str(r),*args])
action=sys.argv[1]
if action=='blob':
 sha=sys.argv[2];assert re.fullmatch('[a-f0-9]{40}',sha)
 data=git('cat-file','blob',sha);offset=int(sys.argv[3]);length=int(sys.argv[4])
 print(base64.b64encode(data[offset:offset+length]).decode())
else:
 rev=sys.argv[2];assert re.fullmatch('[a-zA-Z0-9.^_-]+',rev)
 entries=[]
 for line in git('ls-tree','-r','-z',rev).split(b'\0'):
  if not line:continue
  head,path=line.split(b'\t',1);mode,kind,sha=head.decode().split();path=path.decode()
  entries.append({'path':path,'mode':mode,'type':kind,'sha':sha,'size':len(git('cat-file','blob',sha)),'binary':Path(path).suffix in ['.dll','.ico']})
 if action=='plan':print(json.dumps({'rev':rev,'tree':git('rev-parse',rev+'^{tree}').decode().strip(),'entries':entries}))
 elif action=='texts':
  text_entries=[e for e in entries if not e['binary']]
  batch=text_entries[int(sys.argv[3]):int(sys.argv[3])+int(sys.argv[4])]
  print(json.dumps([{'path':e['path'],'mode':e['mode'],'type':'blob','content':git('cat-file','blob',e['sha']).decode('utf-8')} for e in batch],ensure_ascii=False))
