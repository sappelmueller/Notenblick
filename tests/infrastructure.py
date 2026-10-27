"""Development safety regressions; generated data only, no GUI/NVDA claims."""
from pathlib import Path
import hashlib, json, subprocess, sys, tempfile, unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'dev'))
import guard,manage

class Infrastructure(unittest.TestCase):
    def test_calculation_and_native_storage_contract_unchanged(self):
        # The setup-only whole-application freeze is replaced for the authorized
        # 1.9 feature work. These mathematical/storage modules remain byte-identical.
        baseline=json.loads((ROOT/'dev/baseline-source.sha256.json').read_text())
        names=['src/domain/'+name+'.js' for name in ['arithmetic','migrations','oral','weighting','transfers']]
        names+=['native/Storage.cs','native/Migration.cs']
        for name in names:
            self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),baseline[name],name)

    def test_exact_repository_urls_only(self):
        for url in ['https://github.com/sappelmueller/Notenblick.git','git@github.com:sappelmueller/Notenblick.git']:
            self.assertTrue(guard.valid_url(url))
        for url in ['https://github.com/sappelmueller/TrainScope.git','https://github.com/other/Notenblick.git','https://github.com/sappelmueller/Notenblick.git.evil','https://github.com.evil/sappelmueller/Notenblick.git']:
            self.assertFalse(guard.valid_url(url))

    def test_private_paths_and_actions_are_rejected(self):
        for name in ['Daten/notenverwaltung.json','copy/Datensicherung/backup.txt','Sicherungen/test.json','Notenlisten/6a.txt','Ansicht.json','.github/workflows/test.yml','.env','key.pfx','backup.zip']:
            with self.subTest(name=name),self.assertRaises(AssertionError):guard.check_paths([name])
        guard.check_paths(['src/domain/arithmetic.js','tests/fixtures.cjs','dev/vendor-lock.json'])

    def test_foreign_push_fails_before_network(self):
        with patch.object(guard,'remote_state',side_effect=AssertionError('network must not run')):
            result=subprocess.run([sys.executable,str(ROOT/'dev/guard.py'),'--push','origin','https://github.com/sappelmueller/TrainScope.git'],capture_output=True,text=True)
        self.assertNotEqual(result.returncode,0)
        self.assertIn('fremdes Repository',result.stderr)

    def test_effective_push_url_is_checked(self):
        def fake(*args):
            if args==('rev-parse','--show-toplevel'):return str(ROOT)
            if args==('remote',):return 'origin'
            if '--push' in args:return 'https://github.com/sappelmueller/TrainScope.git'
            return 'https://github.com/sappelmueller/Notenblick.git'
        with patch.object(guard,'git',side_effect=fake),self.assertRaises(AssertionError):guard.check_root()

    def test_remote_requires_repository_id(self):
        with patch.object(guard,'check_root',return_value={'repository_id':None}),self.assertRaises(AssertionError):guard.remote_state()

    def test_vendor_integrity(self):manage.verify_vendor()

    def test_failed_test_stops_runner(self):
        with tempfile.TemporaryDirectory(prefix='notenblick-runner-') as tmp:
            with patch.object(manage,'REPORT',Path(tmp)),patch.object(manage,'STEPS',[]):
                with self.assertRaises(RuntimeError):manage.run('intentional failure',[sys.executable,'-c','raise SystemExit(7)'])
                report=json.loads((Path(tmp)/'summary.json').read_text())
                self.assertFalse(report['all_steps_passed'])
                self.assertEqual(report['steps'][0]['exit_code'],7)

    def test_build_never_deletes_user_data(self):
        with tempfile.TemporaryDirectory(prefix='notenblick-clean-') as tmp:
            root=Path(tmp);data=root/'dist/Daten';data.mkdir(parents=True)
            (data/'keep.txt').write_text('synthetic sentinel')
            with patch.object(manage,'ROOT',root),patch.object(manage,'check_root'),patch.object(manage,'verify_vendor'),self.assertRaises(AssertionError):manage.build()
            self.assertEqual((data/'keep.txt').read_text(),'synthetic sentinel')

    def test_runtime_and_dependency_versions_are_locked(self):
        self.assertEqual(json.loads((ROOT/'global.json').read_text())['sdk']['version'],json.loads((ROOT/'dev/sdk-lock.json').read_text())['version'])
        manifest=json.loads((ROOT/'package.json').read_text());lock=json.loads((ROOT/'package-lock.json').read_text())
        self.assertEqual(manifest['devDependencies'],lock['packages']['']['devDependencies'])

    def test_no_workflow_exists(self):self.assertFalse((ROOT/'.github/workflows').exists())

    def test_staged_content_cannot_be_hidden_by_clean_worktree(self):
        with tempfile.TemporaryDirectory(prefix='notenblick-stage-') as tmp:
            folder=Path(tmp)
            subprocess.run(['git','init','-q',str(folder)],check=True)
            file=folder/'example.txt';file.write_text('ghp_'+'a'*40)
            subprocess.run(['git','-C',str(folder),'add','example.txt'],check=True)
            file.write_text('harmless working copy')
            with patch.object(guard,'ROOT',folder):
                guard.check_paths(['example.txt'])
                with self.assertRaises(AssertionError):guard.check_paths(['example.txt'],staged=True)

    def test_optimized_python_cannot_disable_guard(self):
        result=subprocess.run([sys.executable,'-O',str(ROOT/'dev/guard.py')],capture_output=True,text=True)
        self.assertNotEqual(result.returncode,0)
        self.assertIn('Optimierung',result.stderr)

    def test_github_export_preserves_tree_and_binary_bytes(self):
        import base64
        def export(*args):return subprocess.check_output([sys.executable,str(ROOT/'dev/github-export.py'),*args],text=True)
        plan=json.loads(export('plan','HEAD'))
        expected=subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD^{tree}'],text=True).strip()
        self.assertEqual(plan['tree'],expected)
        entry=next(e for e in plan['entries'] if e['path']=='native/Notenblick.ico')
        self.assertEqual(base64.b64decode(export('blob',entry['sha'],'0','63')),(ROOT/entry['path']).read_bytes()[:63])
        first=json.loads(export('texts','HEAD','0','1'))[0]
        exact=subprocess.check_output(['git','-C',str(ROOT),'show','HEAD:'+first['path']])
        self.assertEqual(first['content'].encode('utf-8'),exact)

if __name__=='__main__':unittest.main(verbosity=2)
