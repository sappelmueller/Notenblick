"""Exact Git bytes; optional base revision avoids retransmitting unchanged files."""
from pathlib import Path
import base64,json,re,subprocess,sys
r=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(r/'dev'))
from guard import check_root
check_root()
def git(*args):return subprocess.check_output(['git','-C',str(r),*args])
def revision(value):
 assert re.fullmatch('[a-zA-Z0-9_][a-zA-Z0-9.^_-]*',value),'Ungültiger Git-Bezug'
 return value
def entries(rev):
 result=[]
 for line in git('ls-tree','-r','-z',revision(rev)).split(b'\0'):
  if not line:continue
  head,path=line.split(b'\t',1);mode,kind,sha=head.decode().split();path=path.decode()
  result.append({'path':path,'mode':mode,'type':kind,'sha':sha,'binary':Path(path).suffix in ['.dll','.ico','.ttf']})
 shas='\n'.join(e['sha'] for e in result)+'\n'
 sizes=subprocess.check_output(['git','-C',str(r),'cat-file','--batch-check=%(objectname) %(objectsize)'],input=shas.encode()).decode().splitlines()
 for item,line in zip(result,sizes):item['size']=int(line.split()[1])
 return result

action=sys.argv[1]
if action=='blob':
 sha=sys.argv[2];assert re.fullmatch('[a-f0-9]{40}',sha)
 data=git('cat-file','blob',sha);offset=int(sys.argv[3]);length=int(sys.argv[4]);assert offset>=0 and length>=0
 print(base64.b64encode(data[offset:offset+length]).decode())
else:
 rev=revision(sys.argv[2]);items=entries(rev);base=sys.argv[3] if action=='plan' and len(sys.argv)>3 else sys.argv[5] if action=='texts' and len(sys.argv)>5 else None
 deleted=[]
 if base:
  old={e['path']:e for e in entries(revision(base))};present={e['path'] for e in items}
  deleted=[{'path':name,'mode':e['mode'],'type':e['type'],'sha':None} for name,e in old.items() if name not in present]
  items=[e for e in items if e['path'] not in old or any(e[k]!=old[e['path']][k] for k in ['sha','mode','type'])]
 if action=='plan':print(json.dumps({'rev':rev,'base':base,'tree':git('rev-parse',rev+'^{tree}').decode().strip(),'entries':items,'deleted':deleted}))
 elif action=='texts':
  offset,count=int(sys.argv[3]),int(sys.argv[4]);assert offset>=0 and count>=0
  batch=[e for e in items if not e['binary']][offset:offset+count]
  print(json.dumps([{'path':e['path'],'mode':e['mode'],'type':'blob','content':git('cat-file','blob',e['sha']).decode('utf-8')} for e in batch],ensure_ascii=False))
 else:raise ValueError('Unbekannte Aktion')
