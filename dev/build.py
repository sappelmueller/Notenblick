"""Build only program files. The release archive never contains personal data."""
from pathlib import Path
import json,shutil
ROOT=Path(__file__).resolve().parents[1];target=ROOT/'dist/Programm';target.mkdir(parents=True,exist_ok=True)
order=['boot-guard.js']+json.loads((ROOT/'dev/load-order.json').read_text())
html=(ROOT/'src/shell.html').read_text().replace('<!-- SCRIPTS -->','\n'.join('<script defer src="js/'+file+'"></script>' for file in order))
(target/'Notenblick.html').write_text(html)
for file in order:
 p=target/'js'/file;p.parent.mkdir(parents=True,exist_ok=True);
 if file=='version.js':p.write_text('globalThis.NRVersion='+json.dumps(json.loads((ROOT/'package.json').read_text())['version'])+';')
 elif file=='help-data.js':p.write_text('globalThis.NRHelp='+json.dumps(json.loads((ROOT/'src/data/HILFE-1.23.0.json').read_text()),ensure_ascii=False)+';globalThis.NRHelpContexts='+json.dumps(json.loads((ROOT/'src/data/F1-KONTEXTE.json').read_text()),ensure_ascii=False)+';')
 elif file=='subject-catalog.js':p.write_text('window.NRSubjectCatalog='+json.dumps(json.loads((ROOT/'src/data/subjects.json').read_text()),ensure_ascii=False)+';')
 else:shutil.copy2(ROOT/'src'/file,p)
for file in (ROOT/'src/styles').glob('*.css'):
 p=target/'css'/file.name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,p)
print('Modular runtime:',len(order),'JavaScript modules; no personal data in build output.')

for folder in ['fonts','vendor']:
 for source in (ROOT/'src'/folder).glob('*'):
  if source.is_file() and source.suffix!='.js':
   dest=target/folder/source.name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)

# License information is part of the integrity-checked portable program.
legal=target/"Lizenzen";legal.mkdir(exist_ok=True)
for name in ["LICENSE","LICENSE-EXCEPTION","COPYRIGHT","THIRD-PARTY-NOTICES.md"]:
 shutil.copy2(ROOT/name,legal/name)
