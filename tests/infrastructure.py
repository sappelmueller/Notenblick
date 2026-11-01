"""Development safety regressions; generated data only, no GUI/NVDA claims."""
from pathlib import Path
import hashlib, json, subprocess, sys, tempfile, unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'dev'))
import guard,manage,testplan,evidence,bootstrap

class Infrastructure(unittest.TestCase):
    def test_current_release_recognizes_own_data_without_migration(self):
        subprocess.run(['node','-e',"const a=require('node:assert/strict'),N=require('./src/core.js'),v=require('./package.json').version,d=N.blank();d.appVersion=v;a.equal(N.isCurrentData(d),true);a.deepEqual(N.upgrade(d),d);"],cwd=ROOT,check=True)

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

class Efficiency(unittest.TestCase):
    def test_math_selection_keeps_exact_reference_and_compatibility(self):
        plan=testplan.select(['src/domain/arithmetic.js'])
        self.assertTrue({'domain-storage','v150','v160','v170','v1140'}.issubset(plan['tests']))
        self.assertIn('v1140-storage',plan['tests']);self.assertIn('v1140-browser',plan['tests'])
        self.assertEqual(testplan.select(['src/domain/finals.js'],'integration')['tests'],testplan.ALL)

    def test_storage_selection_keeps_migration_backup_and_restore(self):
        for name in ['src/storage.js','src/session.js','src/app/changes.js','native/Storage.cs','native/Migration.cs']:
            with self.subTest(path=name):
                selected=testplan.select([name])['tests']
                self.assertTrue(set(testplan.STORAGE).issubset(selected));self.assertIn('native-host',selected)
                self.assertIn('v1140-browser',selected)

    def test_export_development_is_representative_but_integration_full(self):
        small=testplan.select(['src/exports/report.js'])['tests']
        self.assertTrue({'v1140','v1140-browser','v1140-files'}.issubset(small));self.assertNotIn('large',small)
        complete=testplan.select(['src/exports/report.js'],'integration')['tests']
        self.assertTrue(set(testplan.FILES+testplan.BROWSER).issubset(complete))

    def test_accessibility_changes_select_keyboard_focus_and_browser(self):
        for path in ['src/tabs.js','src/events.js','src/styles/responsive.css','src/dialogs/window.js','src/app/components.js','src/shell.html']:
            selected=testplan.select([path])['tests']
            self.assertTrue({'ui','browser','v1140-browser'}.issubset(selected),path)
            self.assertTrue(set(testplan.BROWSER).issubset(testplan.select([path],'integration')['tests']))

    def test_unknown_shared_native_and_configuration_expand_conservatively(self):
        for path in ['new-engine.rs','native/Window.cs','native/ExportFiles.cs','native/OfficePackage.cs','tests/fixtures.cjs','dev/manage.py','package-lock.json']:
            self.assertEqual(testplan.select([path])['tests'],testplan.ALL,path)

    def test_changed_producer_selects_transitive_consumers(self):
        tests=testplan.select(['tests/v1110.cjs'])['tests']
        self.assertTrue({'v1110-browser','export-files','office-schema','v1100','browser'}.issubset(tests))
        self.assertEqual(len(tests),len(set(tests)))
        for name in tests:
            for dep in testplan.DEPENDENCIES.get(name,[]):self.assertLess(tests.index(dep),tests.index(name))

    def test_documentation_does_not_require_program_build(self):
        self.assertEqual(testplan.select(['docs/PROJEKTUEBERSICHT.md'])['tests'],['infrastructure'])
        self.assertFalse(testplan.select([])['release_eligible'])

    def test_git_change_detection_includes_index_untracked_deleted_and_renamed(self):
        with tempfile.TemporaryDirectory(prefix='nb-changes-') as tmp:
            root=Path(tmp)
            def g(*args):return subprocess.check_output(['git','-C',tmp,*args])
            g('init','-q');(root/'old.txt').write_text('old');g('add','old.txt')
            g('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','synthetic')
            (root/'old.txt').rename(root/'new.txt');g('add','-A');(root/'extra.txt').write_text('untracked')
            self.assertEqual(testplan.changed(root),['extra.txt','new.txt','old.txt'])
            with self.assertRaises(subprocess.CalledProcessError):testplan.changed(root,'missing-ref')

    def test_source_identity_covers_content_mode_untracked_and_deletion(self):
        with tempfile.TemporaryDirectory(prefix='nb-source-') as tmp:
            root=Path(tmp);subprocess.run(['git','init','-q',tmp],check=True)
            p=root/'a';p.write_text('one');first=evidence.source(root);p.write_text('two');self.assertNotEqual(first,evidence.source(root))
            second=evidence.source(root);p.chmod(0o755);self.assertNotEqual(second,evidence.source(root))
            subprocess.run(['git','-C',tmp,'add','a'],check=True);p.unlink();self.assertIn('missing',evidence.source(root).values())

    def test_success_evidence_requires_key_completion_exit_and_output_bytes(self):
        with tempfile.TemporaryDirectory(prefix='nb-evidence-') as tmp:
            root=Path(tmp);p=root/'result.json';p.write_text('synthetic')
            entry={'key':'k','complete':True,'exit_code':0,'outputs':evidence.inventory(root,[p])}
            self.assertTrue(evidence.valid(entry,'k',root))
            for changed in [{'key':'old'},{'complete':False},{'exit_code':1},{'outputs':{}}]:self.assertFalse(evidence.valid({**entry,**changed},'k',root))
            self.assertFalse(evidence.valid(entry,'new-tool-key',root));p.write_text('corrupt');self.assertFalse(evidence.valid(entry,'k',root))
            p.unlink();self.assertFalse(evidence.valid(entry,'k',root))

    def test_malformed_cache_is_not_success(self):
        with tempfile.TemporaryDirectory(prefix='nb-bad-cache-') as tmp:
            p=Path(tmp)/'cache.json';p.write_text('{broken');self.assertEqual(evidence.read(p),{})
            self.assertFalse(evidence.valid({},'k'))

    def test_component_cache_restores_and_rebuilds_on_corruption_or_input_change(self):
        with tempfile.TemporaryDirectory(prefix='nb-component-') as tmp:
            root=Path(tmp);source=root/'source';source.write_text('v1');output=root/'artifact';calls=[]
            def compile():calls.append(1);output.write_text(source.read_text())
            with patch.dict('os.environ',{'NOTENBLICK_FRESH_BUILD':'0'}):
                self.assertFalse(evidence.component('probe',[source],[output],compile,root));output.unlink()
                self.assertTrue(evidence.component('probe',[source],[output],compile,root));self.assertEqual(output.read_text(),'v1')
                next((root/'.build/components/probe').rglob('0')).write_text('corrupt')
                self.assertFalse(evidence.component('probe',[source],[output],compile,root));source.write_text('v2')
                self.assertFalse(evidence.component('probe',[source],[output],compile,root))
            with patch.dict('os.environ',{'NOTENBLICK_FRESH_BUILD':'1'}):self.assertFalse(evidence.component('probe',[source],[output],compile,root))
            self.assertEqual(len(calls),4)

    def test_release_catalogue_retains_all_existing_suites(self):
        expected={'domain-storage','transfers','ui','new-features','v140','v150','v160','v170','v180','v190','v1100','v1110','v1120','v1130','v1140',
          'view-storage','v150-storage','v160-storage','v170-storage','v180-storage','v190-storage','v1110-storage','v1120-storage','v1130-storage','v1140-storage','workflow',
          'browser','v170-browser','v180-browser','v190-browser','v1100-browser','v1110-browser','v1120-browser','v1130-browser','v1140-browser',
          'export-files','office-schema','v1120-files','v1130-files','v1140-files','infrastructure','native-host','large','loader'}
        self.assertTrue(expected.issubset(testplan.ALL));self.assertEqual(testplan.expand(testplan.ALL),testplan.ALL)
        seen=[]
        with patch.object(manage,'execute',side_effect=seen.append):manage.tests('full')
        self.assertEqual(seen,testplan.ALL)

    def test_running_or_partial_report_cannot_grant_release(self):
        with tempfile.TemporaryDirectory(prefix='nb-report-') as tmp:
            steps=[{'exit_code':0} for _ in range(len(testplan.ALL)+7)]
            with patch.multiple(manage,REPORT=Path(tmp),STEPS=steps,STATUS='running',RELEASE=True):
                manage.save_report();d=json.loads((Path(tmp)/'summary.json').read_text());self.assertFalse(d['all_steps_passed']);self.assertFalse(d['release_eligible'])
            with patch.multiple(manage,REPORT=Path(tmp),STEPS=steps[:-1],STATUS='passed',RELEASE=True):
                manage.save_report();self.assertFalse(json.loads((Path(tmp)/'summary.json').read_text())['release_eligible'])
            steps[0]['reused']=True
            with patch.multiple(manage,REPORT=Path(tmp),STEPS=steps,STATUS='passed',RELEASE=True):
                manage.save_report();self.assertFalse(json.loads((Path(tmp)/'summary.json').read_text())['release_eligible'])

    def test_complete_release_still_needs_current_source_tools_and_runtime(self):
        with tempfile.TemporaryDirectory(prefix='nb-audit-') as tmp:
            p=Path(tmp)/'summary.json';evidence.write(p,{'release_eligible':True,'status':'passed','source_hash':evidence.digest({'a':'h'}),'tools_hash':'tools','runtime_outputs':{'runtime':'ok'}})
            with patch.object(manage,'git',return_value=''),patch.object(evidence,'source',return_value={'a':'h'}),patch.object(evidence,'tools',return_value='tools'),patch.object(evidence,'inventory',return_value={'runtime':'ok'}):
                self.assertTrue(manage.audit(p)['release_current'])
                with patch.object(manage,'git',return_value='unstaged-or-untracked'):self.assertFalse(manage.audit(p)['release_current'])
                with patch.object(evidence,'source',return_value={'a':'changed'}):self.assertFalse(manage.audit(p)['release_current'])
                with patch.object(evidence,'tools',return_value='other'):self.assertFalse(manage.audit(p)['release_current'])
                with patch.object(evidence,'inventory',return_value={}):self.assertFalse(manage.audit(p)['release_current'])

    def test_failure_summary_is_bounded_full_log_is_retained(self):
        with tempfile.TemporaryDirectory(prefix='nb-diagnostic-') as tmp:
            p=Path(tmp)/'log';content='successful synthetic line\n'*10000+'File "test.py", line 42, in test_focus\nAssertionError: wrong focus\nSystem.IO.FileNotFoundException: synthetic missing file\n';p.write_text(content)
            diagnosis=manage.diagnostic(p);self.assertLess(sum(map(len,diagnosis)),5000);self.assertTrue(any('test_focus' in l for l in diagnosis));self.assertIn('AssertionError: wrong focus',diagnosis);self.assertTrue(any('FileNotFoundException' in l for l in diagnosis));self.assertEqual(p.read_text(),content)

    def test_retry_keeps_unfinished_tasks_and_newly_affected_areas(self):
        previous={'plan':{'tests':['ui','v1140-browser']},'status':'failed','steps':[{'task':'ui','exit_code':0}]}
        selected=manage.retry_plan(['infrastructure','v1140-storage'],previous)
        self.assertTrue({'ui','v1140-browser','v1140','v1140-storage','native-host'}.issubset(selected))
        with self.assertRaises(ValueError):manage.retry_plan([],{'plan':{'tests':['forged-shell-command']}})
        with self.assertRaises(ValueError):manage.retry_plan([],{'status':'passed'})

    def test_real_runner_reuses_only_verified_success_and_reexecutes_failure(self):
        export=ROOT/'tests/exports';export.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(prefix='nb-cache-probe-',dir=export) as folder,tempfile.TemporaryDirectory(prefix='nb-run-') as tmp:
            output=Path(folder)/'proof';report=Path(tmp);cache=report/'cache.json';pending={};steps=[]
            command=[sys.executable,'-c','from pathlib import Path; Path('+repr(str(output))+').write_text("proof")']
            with patch.multiple(manage,REPORT=report,CACHE=cache,PENDING=pending,STEPS=steps,REUSE=True,TOOLS='synthetic-tools'),patch.object(evidence,'task_key',return_value='key'):
                manage.run('probe',command,task='ui');entry=dict(pending['ui']);entry.pop('source_after');evidence.write(cache,{'ui':entry})
                manage.run('probe',command,task='ui');self.assertTrue(steps[-1]['reused'])
                output.write_text('corrupt');manage.run('probe',command,task='ui');self.assertFalse(steps[-1]['reused'])
                with self.assertRaises(RuntimeError):manage.run('different command',[sys.executable,'-c','raise SystemExit(8)'],task='ui')
                self.assertFalse(steps[-1]['reused'])
                for _ in range(2):
                    with self.assertRaises(RuntimeError):manage.run('failed',[sys.executable,'-c','raise SystemExit(7)'],task='v1140')
                    self.assertFalse(steps[-1]['reused'])
                self.assertNotIn('v1140',pending);self.assertTrue((report/'failure.json').is_file())

    def test_concurrent_runs_cannot_mix_outputs(self):
        with tempfile.TemporaryDirectory(prefix='nb-lock-') as tmp:
            with evidence.workspace_lock(Path(tmp)):
                with self.assertRaises(RuntimeError):
                    with evidence.workspace_lock(Path(tmp)):pass
            with evidence.workspace_lock(Path(tmp)):pass

    def test_incremental_github_export_uses_exact_changed_blobs(self):
        # An identical tree needs no file transmission; full backward-compatible
        # export is independently checked by the existing binary fixture test.
        output=subprocess.check_output([sys.executable,str(ROOT/'dev/github-export.py'),'plan','HEAD','HEAD'],text=True)
        plan=json.loads(output);self.assertEqual(plan['entries'],[]);self.assertEqual(plan['deleted'],[])
        self.assertEqual(json.loads(subprocess.check_output([sys.executable,str(ROOT/'dev/github-export.py'),'texts','HEAD','0','20','HEAD'],text=True)),[])
        changed=json.loads(subprocess.check_output([sys.executable,str(ROOT/'dev/github-export.py'),'plan','HEAD','HEAD^'],text=True))
        expected=set(subprocess.check_output(['git','diff','--name-only','HEAD^','HEAD'],cwd=ROOT,text=True).splitlines())
        self.assertEqual({e['path'] for e in changed['entries']+changed['deleted']},expected)
        texts=json.loads(subprocess.check_output([sys.executable,str(ROOT/'dev/github-export.py'),'texts','HEAD','0','1','HEAD^'],text=True))
        if texts:
            text=texts[0]
            self.assertEqual(text['content'].encode(),subprocess.check_output(['git','show','HEAD:'+text['path']],cwd=ROOT))
        else:
            self.assertFalse(any(not e['binary'] for e in changed['entries']))

    def test_volatile_proxy_and_trace_metadata_are_not_test_conditions(self):
        first={'PATH':'stable','TZ':'Europe/Berlin','NODE_OPTIONS':'--test-flag','HTTP_PROXY':'per-call-a','CODEX_TOOL_CALL_ID':'a','NOTENBLICK_FLAG':'one'}
        second={**first,'HTTP_PROXY':'per-call-b','CODEX_TOOL_CALL_ID':'b'}
        self.assertEqual(evidence.environment(first),evidence.environment(second))
        self.assertNotIn('HTTP_PROXY',evidence.environment(first))
        for name in ['PATH','TZ','NODE_OPTIONS','NOTENBLICK_FLAG']:
            self.assertNotEqual(evidence.environment(first),evidence.environment({**first,name:'changed'}))

    def test_only_relevant_test_sources_invalidate_cached_suites(self):
        with tempfile.TemporaryDirectory(prefix='nb-dependencies-') as tmp:
            root=Path(tmp);subprocess.run(['git','init','-q',tmp],check=True)
            (root/'tests').mkdir();(root/'src/domain').mkdir(parents=True);(root/'src/views').mkdir()
            own=root/'tests/ui.cjs';own.write_text('ui');other=root/'tests/v140.cjs';other.write_text('other')
            fixture=root/'tests/fixtures.cjs';fixture.write_text('fixture');(root/'src/domain/arithmetic.js').write_text('math')
            view=root/'src/views/pupil.js';view.write_text('view')
            key=evidence.task_key('ui','tools',root);other.write_text('unrelated change');self.assertEqual(key,evidence.task_key('ui','tools',root))
            own.write_text('own changed');self.assertNotEqual(key,evidence.task_key('ui','tools',root))
            key=evidence.task_key('ui','tools',root);fixture.write_text('shared changed');self.assertNotEqual(key,evidence.task_key('ui','tools',root))
            math=evidence.task_key('domain-storage','tools',root);view.write_text('view changed');self.assertEqual(math,evidence.task_key('domain-storage','tools',root))

    def test_original_full_test_time_limits_are_preserved(self):
        for name,timeout in {'export-files':300,'office-schema':300,'v1120-files':900,'v1130-files':360,'v1140-files':360}.items():
            with patch.object(manage,'run') as run:
                manage.execute(name);self.assertEqual(run.call_args.kwargs['timeout'],timeout)

    def test_transient_transport_files_never_enter_allowlist(self):
        with tempfile.TemporaryDirectory(prefix='nb-settle-') as tmp:
            folder=Path(tmp);(folder/'real.dll').write_text('synthetic');staging=folder/'.rsync-tmp';staging.mkdir();(staging/'part').write_text('partial')
            def settle(_):
                if staging.exists():(staging/'part').unlink();staging.rmdir()
            with patch.object(evidence.time,'sleep',side_effect=settle):
                files=evidence.settled_files(folder,timeout=1,stable_passes=2)
            self.assertEqual([p.name for p in files],['real.dll'])
            staging.mkdir()
            with self.assertRaisesRegex(RuntimeError,'rsync-tmp'):evidence.settled_files(folder,timeout=.01,delay=0)
            self.assertTrue(staging.exists(),'persistent staging must fail, never silently remove/ignore')

    def test_setup_reuses_existing_sdk_browser_and_verified_npm_contents(self):
        with tempfile.TemporaryDirectory(prefix='nb-setup-') as tmp:
            root=Path(tmp);tools=root/'.tools';(root/'dev').mkdir();tools.mkdir();(root/'.githooks').mkdir();(root/'node_modules').mkdir()
            sdk=tools/'dotnet';sdk.write_text('synthetic SDK')
            (root/'dev/sdk-lock.json').write_text(json.dumps({'version':'8.0.426'}))
            lock=root/'package-lock.json';lock.write_text(json.dumps({'packages':{'':{'version':'1.14.0'},'node_modules/probe':{'version':'1.0'}}}))
            browserlock=root/'dev/browser-lock.json';browserlock.write_text(json.dumps({'executable':'chrome'}))
            browser=tools/'chromium';browser.mkdir();(browser/'chrome').write_text('synthetic browser');(browser/'installed-lock.sha256').write_text(hashlib.sha256(browserlock.read_bytes()).hexdigest())
            with patch.multiple(bootstrap,ROOT=root,TOOLS=tools),patch.object(bootstrap,'dotnet_path',return_value=sdk),patch.object(bootstrap.shutil,'which',return_value='/synthetic/npm'),patch.object(bootstrap.subprocess,'check_output',return_value='8.0.426 [/synthetic]'),patch.object(bootstrap.subprocess,'run') as run,patch.object(bootstrap,'inventory',return_value={'probe':'original'}) as inventory,patch.object(bootstrap.urllib.request,'urlopen',side_effect=AssertionError('Unnecessary vendor download')),patch.object(bootstrap.platform,'system',return_value='Linux'),patch.object(bootstrap.platform,'machine',return_value='x86_64'):
                bootstrap.setup();bootstrap.setup()
                self.assertEqual(sum('ci' in c.args[0] for c in run.call_args_list),1)
                # Version-only metadata changes do not reinstall identical deps.
                lock.write_text(json.dumps({'packages':{'':{'version':'1.15.0'},'node_modules/probe':{'version':'1.0'}}}));bootstrap.setup()
                self.assertEqual(sum('ci' in c.args[0] for c in run.call_args_list),1)
                inventory.return_value={'probe':'corrupt'};bootstrap.setup()
                self.assertEqual(sum('ci' in c.args[0] for c in run.call_args_list),2)

if __name__=='__main__':unittest.main(verbosity=2)
