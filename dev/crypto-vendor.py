"""Retrieve the pinned official managed cryptography dependency if absent."""
import hashlib
import io
import json
from pathlib import Path
from tempfile import NamedTemporaryFile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.tools' / 'bouncycastle'
LOCK = json.loads((ROOT / 'dev' / 'crypto-lock.json').read_text(encoding='utf-8'))


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def prepare():
    if all((CACHE / name).is_file() and sha256((CACHE / name).read_bytes()) == sha
           for name, sha in LOCK['files'].items()):
        return
    request = urllib.request.Request(LOCK['url'], headers={'User-Agent': 'Notenblick build'})
    # Use the configured HTTPS proxy when present. Package and extracted files
    # are authenticated against the repository pins before being used.
    proxy = urllib.request.getproxies().get('https')
    try:
        response = urllib.request.urlopen(request, timeout=12)
    except OSError:
        if not proxy:
            raise
        request.set_proxy(urllib.request.ProxyHandler().proxies['https'].split('://', 1)[-1], 'http')
        response = urllib.request.urlopen(request, timeout=25)
    with response:
        package = response.read(16 * 1024 * 1024 + 1)
    if sha256(package) != LOCK['sha256']:
        raise ValueError('Unerwartete Prüfsumme der Kryptografiebibliothek.')
    with zipfile.ZipFile(io.BytesIO(package)) as archive:
        for name, sha in LOCK['files'].items():
            data = archive.read(name)
            if sha256(data) != sha:
                raise ValueError('Unerwartete Prüfsumme der Bibliotheksdatei: ' + name)
            target = CACHE / name
            target.parent.mkdir(parents=True, exist_ok=True)
            with NamedTemporaryFile(dir=target.parent, delete=False) as stream:
                temporary = Path(stream.name)
                stream.write(data)
            try:
                temporary.replace(target)
            finally:
                temporary.unlink(missing_ok=True)


if __name__ == '__main__':
    prepare()
