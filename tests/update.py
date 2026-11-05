"""Only updater checks; no release, grade, export or general loader suite."""
from pathlib import Path
import argparse,json,shutil,subprocess,sys,time

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'dev'))
from toolchain import compiler,DOTNET

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--live',action='store_true',help='Also query the public GitHub source; never install')
parser.add_argument('--diagnostics',action='store_true',help='Only the changed diagnostic/check functions and copy UI')
parser.add_argument('--live-only',action='store_true',help='Only one real GitHub check plus the updater UI checks')
args=parser.parse_args()
start=time.monotonic()
folder=ROOT/'.build/updater-probe';folder.mkdir(parents=True,exist_ok=True)
refs=sorted((Path(DOTNET).parent/'packs/Microsoft.NETCore.App.Ref').glob('*/ref/net8.0'))[-1]
probe=folder/'UpdateProbe.exe'
storage=ROOT/'dist/Programm/Windows/Notenblick.Speicherung.dll'
newton=ROOT/'dev/newtonsoft.json/lib/net45/Newtonsoft.Json.dll'
command=compiler()+['-nologo','-nowarn:SYSLIB0014,SYSLIB0039','-nostdlib+','-target:exe','-out:'+str(probe)]
command+=['-r:'+str(p) for p in refs.glob('*.dll')]+['-r:'+str(storage),'-r:'+str(newton)]
# Exercise the unchanged 1.25.1 updater protocol against a real 1.26 payload.
source=(ROOT/'tests/UpdateProbe.cs').read_text()
anchor='  foreach(var field in new[]{"approved","repositoryId","version","dataSchema","minimumUpdater","notes"})'
bridge='''  if(offer.Version=="1.26.0"){
   var bridgeManifest=Manifest("1.26.0",files,bytes.Length,UpdateTransaction.Digest(bytes));
   var bridgeRelease=Release("1.26.0",bytes.Length);
   var bridgeOffer=UpdateSource.Descriptor(bridgeRelease,bridgeManifest,"1.25.1");
   Check(bridgeOffer.Version=="1.26.0","Direct 1.25.1 to 1.26.0 without intermediate update");
   UpdateSource.Extract(bytes,bridgeOffer,Empty(),CancellationToken.None);count++;
   bridgeManifest["approved"]=false;
   Reject(()=>UpdateSource.Descriptor(bridgeRelease,bridgeManifest,"1.25.1"),"1.26 test build is not publicly approved");
  }
'''
assert anchor in source
probe_source=folder/'UpdateProbe.cs';probe_source.write_text(source.replace(anchor,bridge+anchor))
command+=[str(ROOT/'native'/p) for p in ['UpdateTransaction.cs','UpdateClient.cs']]+[str(probe_source)]
subprocess.run(command,cwd=ROOT,check=True)
for source in [storage,newton]:shutil.copy2(source,folder/source.name)
(folder/'UpdateProbe.runtimeconfig.json').write_text(json.dumps({'runtimeOptions':{'tfm':'net8.0','framework':{'name':'Microsoft.NETCore.App','version':'8.0.15'}}}))
subprocess.run([DOTNET,str(probe),str(ROOT/'dist'),*(['--live-only'] if args.live_only else []),*(['--diagnostics'] if args.diagnostics else []),*(['--live'] if args.live else [])],cwd=ROOT,check=True,timeout=90)
subprocess.run(['node','tests/update-ui.cjs'],cwd=ROOT,check=True,timeout=30)
print('Updater-only checks completed in',round(time.monotonic()-start,2),'s; .NET 8/jsdom on Linux, no Windows/NVDA claim.')
