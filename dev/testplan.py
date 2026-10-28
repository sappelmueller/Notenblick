"""Small conservative dependency map; existing tests remain the only test engine."""
from pathlib import Path
import subprocess

QUICK=['domain-storage','transfers','ui','new-features','v140','v150','v160','v170','v180','v190','v1100','v1110','v1120','v1130','v1140','v1150','v1160','v1170','v1180','v1190']
STORAGE=['view-storage','v150-storage','v160-storage','v170-storage','v180-storage','v190-storage','v1110-storage','v1120-storage','v1130-storage','v1140-storage','v1160-storage','v1170-storage','v1190-storage','workflow']
BROWSER=['browser','v170-browser','v180-browser','v190-browser','v1100-browser','v1110-browser','v1120-browser','v1130-browser','v1140-browser','v1150-browser','v1160-browser','v1170-browser','v1180-browser','v1190-browser']
FILES=['export-files','office-schema','v1120-files','v1130-files','v1140-files','v1170-files']
ALL=['infrastructure',*QUICK,'native-host',*STORAGE,'large','loader',*BROWSER,*FILES]
DEPENDENCIES={name:['native-host'] for name in [*STORAGE,'large']}
DEPENDENCIES.update({
 'v1110-browser':['v1110'], 'v1120-browser':['v1120'],
 'v1130-browser':['v1130'], 'v1140-browser':['v1140'],
 'export-files':['v1100','v1110','browser','v1100-browser','v1110-browser'],
 'office-schema':['v1100','v1110','v1100-browser','v1110-browser'],
 'v1120-files':['v1120','v1120-browser'], 'v1130-files':['v1130','v1130-browser'],
 'v1150-browser':['v1150'],
 'v1160-browser':['v1160'],
 'v1170-browser':['v1170'],
 'v1180-browser':['v1180'], 'v1190-browser':['v1190'],
 'v1170-files':['v1170','v1170-browser'],
 'v1140-files':['v1140','v1140-browser']})


def expand(names):
    selected=set()
    def visit(name):
        if name not in ALL:raise ValueError('Unbekannte Prüfung: '+name)
        if name in selected:return
        selected.add(name)
        for dependency in DEPENDENCIES.get(name,[]):visit(dependency)
    for name in names:visit(name)
    return [n for n in ALL if n in selected]


def changed(root,base='HEAD'):
    # Commit comparison also includes index and working tree. Deleted and old
    # rename paths remain visible; untracked, nonignored files are included.
    subprocess.run(['git','rev-parse','--verify',base+'^{commit}'],cwd=root,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    def output(args):return subprocess.check_output(['git',*args],cwd=root).decode().split('\0')
    return sorted(set(filter(None,output(['diff','--no-renames','--name-only','-z',base,'--'])+output(['ls-files','--others','--exclude-standard','-z']))))


def area(path):
    if path in ['README.md','AGENTS.md','AENDERUNGEN.md','ENTWICKLUNG.md','PRUEFBERICHT.md','QUELLEN.md'] or path.startswith('docs/'):return 'docs'
    if path.startswith('src/domain/') or path=='src/core.js':return 'math'
    if path in ['src/storage.js','src/session.js'] or path.startswith(('src/app/files','src/app/migration','src/app/changes','native/Storage','native/Migration')):return 'storage'
    if path.startswith(('native/ExportFiles','native/OfficePackage')):return 'shared'
    if path.startswith(('src/exports/','src/fonts/','src/vendor/','native/ExportFiles','native/OfficePackage')) or path=='src/styles/export.css':return 'export'
    if path in ['src/state.js','src/boot-guard.js','src/desktop.js','src/events.js','src/tabs.js','src/shell.html','src/app/components.js','src/app/context.js','src/app/preferences.js','src/app/navigation.js','src/dialogs/window.js']:return 'shared'
    if path.startswith('src/'):return 'ui'
    if path.startswith('tests/'):
        name=Path(path).stem
        if name in ALL:return 'test:'+name
        return 'shared'
    if path.startswith(('dev/','.githooks/')) or path in ['package.json','package-lock.json','global.json','.node-version','.gitignore','.gitattributes']:return 'infrastructure'
    return 'shared'


def select(paths,stage='develop'):
    areas={area(p) for p in paths};names={'infrastructure'};reasons=[]
    for group in sorted(areas):
        if group in ['shared','infrastructure']:
            names.update(ALL);reasons.append(group+': Auswirkungen breit oder unbekannt → alle Bereiche')
        elif group=='math':
            names.update(['v1170','v1170-storage','v1170-browser','v1170-files'])
            names.update(['domain-storage','transfers','v150','v160','v170','v1140'] if stage=='develop' else ALL);names.update(['v1140-storage','v1140-browser','v1150','v1150-browser','v1160','v1160-storage','v1160-browser']);reasons.append('math: exakte Referenzen, Gewichte, Kompatibilität und Abschlussnoten')
        elif group=='storage':
            names.update(['v1170','v1170-storage'])
            names.update(['domain-storage',*STORAGE,'v1140','v1140-browser','v1150','v1150-browser','v1160','v1160-browser']);
            if stage=='integration':names.update(ALL)
            reasons.append('storage: Integrität, Migration, Sicherung und Wiederherstellung')
        elif group=='export':
            names.update(['v1170','v1170-files'])
            names.update(['v1140-files','v1150','v1150-browser','v1160'] if stage=='develop' else [*QUICK,*BROWSER,*FILES]);reasons.append('export: acht repräsentative Optionsfälle / vollständige Integration')
        elif group=='ui':
            names.update(['v1180','v1180-browser','v1190','v1190-browser','v1190-storage'])
            names.update(['v1170','v1170-browser'])
            names.update([*QUICK,*BROWSER,*FILES] if stage=='integration' else ['ui','new-features','v140','v150','v160','v170','v180','v190','v1140','v1150','v1160','v1160-browser','browser','v1140-browser','v1150-browser']);reasons.append('ui: gemeinsame Oberfläche, Tastatur, Fokus, axe und Skalierung')
        elif group.startswith('test:'):
            name=group[5:];names.add(name)
            # A changed producer/helper requires its consumers, not just itself.
            pending={name}
            while pending:
                affected={n for n,deps in DEPENDENCIES.items() if pending.intersection(deps)}-names
                names.update(affected);pending=affected
            reasons.append(group+': Prüfung und abhängige Verbraucher')
        else:reasons.append('docs: Schutzprüfungen; kein Programmumbau')
    return {'stage':stage,'paths':paths,'areas':sorted(areas),'tests':expand(names),'reasons':reasons or ['Keine Änderungen: nur Schutzprüfungen'], 'release_eligible':False}
