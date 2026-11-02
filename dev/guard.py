"""Fail closed at the Notenblick repository boundary. Never configures other projects."""
from pathlib import Path
import argparse, json, os, re, subprocess, urllib.request

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = 'sappelmueller/Notenblick'
if not __debug__:
    raise SystemExit('Schutzprüfungen dürfen nicht mit Python-Optimierung deaktiviert werden.')

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args], text=True).strip()

def valid_url(url):
    return url in {f'https://github.com/{EXPECTED}', f'https://github.com/{EXPECTED}.git',
                  f'git@github.com:{EXPECTED}.git', f'ssh://git@github.com/{EXPECTED}.git'}

def check_root():
    assert Path(git('rev-parse', '--show-toplevel')).resolve() == ROOT, 'Falsches Git-Arbeitsverzeichnis'
    config = json.loads((ROOT/'dev/repository.json').read_text())
    assert config['full_name'] == EXPECTED
    assert config['repository_id'] == 1432518047, 'Falsche gespeicherte Repository-ID'
    assert config['allowed_visibilities'] == ['private', 'public'], 'Unzulässige Sichtbarkeitskonfiguration'
    assert config['actions_enabled'] is False
    for remote in git('remote').splitlines():
        for mode in [[], ['--push']]:
            urls = git('remote', 'get-url', *mode, '--all', remote).splitlines()
            assert urls and all(valid_url(url) for url in urls), 'Fremdes Repository als Remote: '+remote
    return config

def check_paths(paths, staged=False):
    for name in paths:
        path = Path(name)
        parts = {p.casefold() for p in path.parts}
        assert not parts.intersection({'daten','datensicherung','sicherungen','notenlisten'}), 'Private Daten: '+name
        assert not name.startswith('.github/workflows/'), 'GitHub Actions sind verboten'
        assert path.name.casefold() not in {'ansicht.json','notenverwaltung.json'}, 'Private Datei: '+name
        assert path.suffix.casefold() not in {'.zip','.bak','.pfx','.p12','.key','.pem'}, 'Unzulässige Datei: '+name
        assert path.name != '.env' and not path.name.startswith('.env.'), 'Zugangsdaten: '+name
        p = ROOT/path
        if not p.is_file():
            continue
        assert not p.is_symlink(), 'Verknüpfung nicht erlaubt: '+name
        if p.suffix not in {'.dll','.ico','.ttf'}:
            text = subprocess.check_output(['git','-C',str(ROOT),'show',':'+name]).decode('utf-8',errors='replace') if staged else p.read_text(encoding='utf-8', errors='replace')
            assert not re.search(SECRET_PATTERN, text), 'Mögliches Geheimnis: '+name

SECRET_PATTERN = r'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|sk-proj-[A-Za-z0-9_-]{40,}|xox[baprs]-[A-Za-z0-9-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)'

def validate_remote(config, repo, actions):
    assert repo['full_name'] == EXPECTED and repo['id'] == config['repository_id'], 'Repository-ID stimmt nicht'
    assert repo.get('visibility') in config['allowed_visibilities'], 'Unzulässige Sichtbarkeit'
    assert repo.get('private') is (repo['visibility'] == 'private'), 'Widersprüchliche Sichtbarkeit'
    assert actions['enabled'] is False, 'Actions müssen deaktiviert sein'

def remote_state():
    config = check_root()
    assert config.get('repository_id'), 'Repository-ID muss nach der Einrichtung gespeichert werden'
    token = os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN')
    def get(path):
        if token:
            request = urllib.request.Request('https://api.github.com/'+path,
                headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','User-Agent':'Notenblick-guard'})
            with urllib.request.urlopen(request, timeout=20) as response:
                return json.load(response)
        return json.loads(subprocess.check_output(['gh','api',path], text=True))
    repo = get('repos/'+EXPECTED)
    validate_remote(config, repo, get('repos/'+EXPECTED+'/actions/permissions'))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--staged', action='store_true')
    parser.add_argument('--push', nargs=2, metavar=('REMOTE','URL'))
    parser.add_argument('--remote', action='store_true')
    args = parser.parse_args()
    check_root()
    if args.push:
        assert valid_url(args.push[1]), 'Push auf fremdes Repository blockiert'
    if args.push or args.remote:
        remote_state()
    paths = git('diff','--cached','--name-only','--diff-filter=ACMR').splitlines() if args.staged else git('ls-files').splitlines()
    check_paths(paths, staged=args.staged)
    print('Notenblick: Repositorygrenze und Dateiauswahl geprüft.')

if __name__ == '__main__':
    main()
