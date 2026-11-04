"""Small control scenarios for evidence/retry. Never runs program/release suites."""
from pathlib import Path
import contextlib,io,json,os,subprocess,sys,tempfile,time,unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'dev'))
import evidence as E,manage as M,testplan as T

@contextlib.contextmanager
def workspace():
    with tempfile.TemporaryDirectory(prefix='nb-test-management-') as tmp:
        root=Path(tmp);subprocess.run(['git','init','-q',tmp],check=True)
        for folder in ['tests','src/domain','src/styles','src/views','dev','reports']:(root/folder).mkdir(parents=True,exist_ok=True)
        (root/'.gitignore').write_text('.build/\nreports/\ndist/\nartifacts/\ntests/*results.json\ntests/exports/\n')
        for name in ['ui','v140','v150','large','domain-storage','transfers']:(root/'tests'/(name+'.cjs')).write_text('// synthetic '+name)
        for name in ['src/domain/arithmetic.js','src/core.js','src/storage.js','src/styles/views.css','src/views/pupil.js','README.md','dev/manage.py','dev/evidence.py','dev/testplan.py','dev/github-export.py']:(root/name).write_text('synthetic')
        (root/'package.json').write_text('{"version":"1.24.0"}')
        with patch.multiple(M,ROOT=root,REPORT=root/'reports/run',STEPS=[],STATUS='running',FAILURE=None,PLAN={},SOURCE={},TOOLS='synthetic',BUILD_OUTPUTS={},PACKAGE_EVIDENCE=[],DETERMINISM={},REUSE=True,RELEASE=False,ENV=dict(os.environ)),patch.object(E,'tools',return_value='synthetic-tools'):
            M.REPORT.mkdir();yield root

class Management(unittest.TestCase):
    def quiet_run(self,name,command,**options):
        with contextlib.redirect_stdout(io.StringIO()):M.run(name,command,task=name,**options)
        return M.STEPS[-1]

    def command(self,root,name,code=0):
        output=root/'tests'/(name+'-results.json')
        return [sys.executable,'-c',f'from pathlib import Path; Path({str(output)!r}).write_text("verified {name}"); raise SystemExit({code})']

    def test_success_commits_immediately_and_recovers_deleted_or_overwritten_outputs(self):
        with workspace() as root:
            cmd=self.command(root,'ui');first=self.quiet_run('ui',cmd)
            receipt=Path(first['receipt']);self.assertTrue(receipt.is_file())
            # No finalization/PENDING map is required for durable success.
            output=root/'tests/ui-results.json';output.unlink()
            self.assertTrue(self.quiet_run('ui',cmd)['reused']);self.assertEqual(output.read_text(),'verified ui')
            output.write_text('overwritten by another group')
            self.assertTrue(self.quiet_run('ui',cmd)['reused']);self.assertEqual(output.read_text(),'verified ui')

    def test_stdout_only_success_can_be_reused(self):
        with workspace():
            cmd=[sys.executable,'-c','pass']
            first=self.quiet_run('ui',cmd);self.assertTrue(E.valid(E.read(Path(first['receipt'])),first['key'],M.ROOT))
            self.assertTrue(self.quiet_run('ui',cmd)['reused'])

    def test_failed_groups_rerun_and_other_successes_survive(self):
        with workspace() as root:
            cmd=self.command(root,'ui');self.quiet_run('ui',cmd)
            for _ in range(2):
                with self.assertRaisesRegex(RuntimeError,'v140 fehlgeschlagen'):self.quiet_run('v140',self.command(root,'v140',7))
            self.assertTrue(self.quiet_run('ui',cmd)['reused'])
            self.assertFalse(self.quiet_run('v140',self.command(root,'v140'))['reused'])
            self.assertFalse(self.quiet_run('v150',self.command(root,'v150'))['reused'])

    def test_force_rerun_failure_revokes_previous_same_key_success(self):
        with workspace() as root:
            marker=root/'.build/fail';marker.parent.mkdir();cmd=[sys.executable,'-c',f'from pathlib import Path; raise SystemExit(7 if Path({str(marker)!r}).exists() else 0)']
            first=self.quiet_run('ui',cmd);marker.write_text('fail')
            with patch.object(M,'REUSE',False),self.assertRaises(RuntimeError):self.quiet_run('ui',cmd)
            self.assertFalse(Path(first['receipt']).exists())

    def test_corrupt_or_manipulated_receipts_are_not_reused(self):
        with workspace() as root:
            cmd=self.command(root,'ui');step=self.quiet_run('ui',cmd);receipt=Path(step['receipt'])
            entry=E.read(receipt);Path(next(iter(entry['outputs']))).write_text('tampered output')
            self.assertFalse(self.quiet_run('ui',cmd)['reused'])
            entry=E.read(receipt);entry['exit_code']=9;E.write(receipt,entry)
            self.assertFalse(self.quiet_run('ui',cmd)['reused'])
            receipt.write_text('[]');self.assertFalse(self.quiet_run('ui',cmd)['reused'])
            receipt.write_text('{partial');self.assertFalse(self.quiet_run('ui',cmd)['reused'])

    def test_invalid_restore_destination_and_symlink_are_rejected(self):
        with workspace() as root:
            p=root/'proof';p.write_text('proof');entry=E.record(root/'.build/proof','key',[p],root)
            entry['restore']={'../escape':next(iter(entry['outputs']))};entry=E.sealed({k:v for k,v in entry.items() if k!='seal'})
            self.assertFalse(E.restore(entry,'key',root))
            p.unlink();p.symlink_to(root/'package.json')
            with self.assertRaises(ValueError):E.record(root/'.build/other','key',[p],root)

    def test_key_changes_only_for_relevant_inputs(self):
        with workspace() as root:
            key=lambda name:E.task_key(name,'tools',root)
            math=key('large-math');ui=key('ui');pure=key('domain-storage')
            (root/'src/styles/views.css').write_text('new margin')
            self.assertEqual(math,key('large-math'));self.assertEqual(pure,key('domain-storage'));self.assertNotEqual(ui,key('ui'))
            ui=key('ui');(root/'README.md').write_text('new docs');(root/'dev/github-export.py').write_text('dev-only')
            self.assertEqual(math,key('large-math'));self.assertEqual(ui,key('ui'))
            (root/'src/domain/arithmetic.js').write_text('new math')
            self.assertNotEqual(math,key('large-math'));self.assertNotEqual(pure,key('domain-storage'))
            math=key('large-math');self.assertNotEqual(math,E.task_key('large-math','changed tools',root))
            (root/'tests/large.cjs').write_text('changed assertions');self.assertNotEqual(math,key('large-math'))

    def test_dependency_change_invalidates_consumer_but_not_unrelated_group(self):
        with workspace() as root:
            (root/'tests/v1110.cjs').write_text('producer')
            before=E.task_key('v1110-browser','tools',root);other=E.task_key('ui','tools',root)
            (root/'tests/v1110.cjs').write_text('producer changed')
            self.assertNotEqual(before,E.task_key('v1110-browser','tools',root));self.assertEqual(other,E.task_key('ui','tools',root))

    def test_source_change_during_group_cannot_publish_success(self):
        with workspace() as root:
            command=[sys.executable,'-c',f'from pathlib import Path; Path({str(root/"src/views/pupil.js")!r}).write_text("changed during test")']
            with self.assertRaisesRegex(RuntimeError,'Prüfbedingungen'):self.quiet_run('ui',command)
            self.assertFalse(any((root/'.build/evidence').rglob('manifest.json')))

    def test_reuse_after_abrupt_process_exit_without_finalizer(self):
        with workspace() as root:
            # A real process exits after one success. The next process uses the
            # exact runner/receipt code, with tiny synthetic commands/tool ID.
            cmd=self.command(root,'ui')
            script=f'''import sys,os
from pathlib import Path
sys.path.insert(0,{str(ROOT/'dev')!r})
import manage as M,evidence as E
M.ROOT=Path({str(root)!r});M.REPORT=M.ROOT/'reports/run';M.REUSE=True;M.ENV=dict(os.environ);E.tools=lambda *a,**k:'synthetic-tools'
M.run('ui',{cmd!r},task='ui')
os._exit(23)
'''
            child=subprocess.run([sys.executable,'-c',script],capture_output=True,text=True);self.assertEqual(child.returncode,23,child.stderr)
            self.assertTrue(self.quiet_run('ui',cmd)['reused'])

    def test_retry_keeps_all_release_and_unfinished_tests(self):
        previous={'plan':{'tests':list(T.ALL),'stage':'release'},'status':'failed','steps':[{'task':'ui','exit_code':0}]}
        self.assertEqual(M.retry_plan(['infrastructure'],previous),T.ALL)
        with patch.object(M,'PLAN',{'tests':['ui','v150']}),patch.object(M,'execute') as execute:M.tests('full')
        self.assertEqual([c.args[0] for c in execute.call_args_list],['ui','v150'])

    def test_release_reuse_requires_complete_catalogue_and_additional_proofs(self):
        with workspace():
            with patch.object(M,'RELEASE',True),patch.object(M,'STATUS','passed'):
                M.STEPS[:]=[{'task':name,'exit_code':0,'receipt':'synthetic','reused':True} for name in T.ALL]
                M.save_report();self.assertFalse(E.read(M.REPORT/'summary.json')['release_eligible'])
                M.DETERMINISM.update(key='synthetic');M.PACKAGE_EVIDENCE.append({'synthetic':True})
                M.STEPS.append({'task':'package-smoke','exit_code':0,'receipt':'synthetic'})
                M.save_report();report=E.read(M.REPORT/'summary.json');self.assertTrue(report['release_eligible'])
                # Flags and counts alone never pass the actual release gate.
                self.assertFalse(M.evidence_current(report))
                M.STEPS.pop(0);self.assertFalse(M.release_complete())

    def test_time_and_orchestration_metadata_are_not_conditions(self):
        first={'PATH':'same','TZ':'UTC','LANG':'de_DE.UTF-8','CODEX_TOOL_CALL_ID':'a','HTTP_PROXY':'a','CURRENT_DATE':'today','NOTENBLICK_FRESH_BUILD':'0'}
        second={**first,'CODEX_TOOL_CALL_ID':'b','HTTP_PROXY':'b','CURRENT_DATE':'tomorrow','NOTENBLICK_FRESH_BUILD':'1'}
        self.assertEqual(E.conditions(first),E.conditions(second))
        for name in ['TZ','LANG','PATH']:self.assertNotEqual(E.conditions(first),E.conditions({**first,name:'changed'}))

    def test_build_inputs_do_not_depend_on_docs_but_include_licenses(self):
        with workspace() as root:
            for name in ['LICENSE','LICENSE-EXCEPTION','COPYRIGHT','THIRD-PARTY-NOTICES.md']:(root/name).write_text('license')
            before=M.build_key();(root/'README.md').write_text('new doc');self.assertEqual(before,M.build_key())
            (root/'LICENSE').write_text('new license');self.assertNotEqual(before,M.build_key())

    def test_existing_catalogue_and_timeouts_remain_with_updater_added(self):
        original=subprocess.check_output(['git','show','v1.24.0:dev/testplan.py'],cwd=ROOT,text=True)
        ns={};exec(compile(original,'baseline-testplan','exec'),ns)
        self.assertTrue(set(ns['ALL']).issubset(T.ALL));self.assertEqual(len(T.ALL),len(set(T.ALL)))
        self.assertTrue({'update','update-browser'}.issubset(T.ALL))
        for name in ns['ALL']:
            for dep in ns['DEPENDENCIES'].get(name,[]):self.assertIn(dep,T.DEPENDENCIES.get(name,[]))
        self.assertEqual(M.specification('large')[2],900);self.assertEqual(M.specification('v1120-files')[2],900)
        self.assertEqual(M.specification('office-schema')[2],300)
        self.assertEqual(T.select(['dev/github-export.py'])['tests'],['infrastructure'])

    def test_release_retry_reuses_build_proof_and_good_groups_end_to_end(self):
        # The real release orchestration and gate, isolated from all application
        # suites by three tiny synthetic commands. Nothing is compiled/exported.
        with workspace() as root:
            names=['ui','v140','v150'];builds=[];seen=[]
            (root/'tests/v150.cjs').write_text('FAIL')
            commands={name:[sys.executable,'-c',f"from pathlib import Path; assert 'FAIL' not in Path({str(root/'tests'/(name+'.cjs'))!r}).read_text()"] for name in names}
            commands['package-smoke']=[sys.executable,'-c','pass']
            def build(fresh=False):
                builds.append(fresh);(root/'dist').mkdir(exist_ok=True);(root/'dist/Notenblick.exe').write_text('synthetic build')
                M.BUILD_OUTPUTS=E.inventory(root,[root/'dist'])
            def package(*args):
                M.run('smoke',commands['package-smoke'],task='package-smoke')
                out=root/'artifacts';out.mkdir(exist_ok=True)
                for i in range(4):
                    p=out/str(i);p.write_text('synthetic package')
                    M.PACKAGE_EVIDENCE.append({'path':str(p),'bytes':p.stat().st_size,'sha256':E.file_hash(p)})
            def g(*args):return '' if args[0] in ['diff','ls-files'] else 'synthetic-head'
            def invoke(*args):
                M.STEPS=[];M.PACKAGE_EVIDENCE=[];M.DETERMINISM={};M.STATUS='running';M.FAILURE=None
                with patch.object(sys,'argv',['manage.py','release',*args]),contextlib.redirect_stdout(io.StringIO()):return M.main()
            with patch.object(M,'ALL',names),patch.object(M,'check_root'),patch.object(M,'preflight'),patch.object(M,'changed',return_value=[]),patch.object(M,'build',side_effect=build),patch.object(M,'package',side_effect=package),patch.object(M,'git',side_effect=g),patch.object(M,'specification',side_effect=lambda name:(name,commands[name],300)):
                self.assertEqual(invoke(),1);first=M.REPORT
                self.assertEqual([s['exit_code'] for s in M.STEPS],[0,0,1])
                self.assertEqual(builds,[True,True])
                (root/'tests/v150.cjs').write_text('fixed assertion fixture')
                self.assertEqual(invoke('--retry',str(first)),0)
                self.assertEqual([s['reused'] for s in M.STEPS if s.get('task') in names],[True,True,False])
                self.assertEqual(builds,[True,True,False])
                report=E.read(M.REPORT/'summary.json');self.assertTrue(report['release_eligible']);self.assertTrue(M.audit(M.REPORT/'summary.json')['release_current'])
                # Whole-source freshness still blocks release after a doc edit.
                (root/'README.md').write_text('updated documentation')
                self.assertFalse(M.audit(M.REPORT/'summary.json')['release_current'])
                self.assertEqual(invoke('--retry',str(M.REPORT)),0)
                self.assertEqual([s['reused'] for s in M.STEPS if s.get('task') in names],[True,True,True])
                proof=Path(E.read(Path(M.DETERMINISM['receipt']))['restore'].popitem()[1]);proof.write_text('corrupt')
                self.assertFalse(M.audit(M.REPORT/'summary.json')['release_current'])

    def test_clean_build_cache_checks_exact_file_set_and_corruption(self):
        with workspace() as root:
            (root/'dist').mkdir();(root/'.build/generated').mkdir(parents=True)
            calls=[]
            def compile(label,file,**kwargs):
                calls.append(file);(root/'dist').mkdir(exist_ok=True);(root/'dist/Notenblick.exe').write_text('synthetic binary')
                (root/'.build/generated/allowlist.cs').write_text('synthetic allowlist')
            with patch.object(M,'check_root'),patch.object(M,'verify_vendor'),patch.object(M,'py',side_effect=compile),patch.object(E,'settled_files'):
                with contextlib.redirect_stdout(io.StringIO()):
                    M.build();self.assertEqual(len(calls),2);M.build();self.assertEqual(len(calls),2)
                    (root/'dist/Notenblick.exe').write_text('corrupt');M.build();self.assertEqual(len(calls),4)
                    (root/'dist/extra.dll').write_text('unexpected');M.build();self.assertEqual(len(calls),6)
                    (root/'README.md').write_text('docs');M.build();self.assertEqual(len(calls),6)

    def test_export_consumers_bind_actual_producer_bytes(self):
        with workspace() as root:
            deps=T.DEPENDENCIES['v1120-files'];out=root/'tests/exports/v1120';out.mkdir(parents=True)
            for dep in deps:
                file=out/(dep+'.pdf');file.write_text('synthetic document')
                receipt=root/'.build/producers'/dep/'first'
                E.record(receipt,'producer-v1',[file],root)
                M.STEPS.append({'task':dep,'exit_code':0,'key':'producer-v1','receipt':str(receipt/'manifest.json')})
            key=lambda:M.task_identity('v1120-files',['synthetic-validator'],300,M.ENV)
            before=key();(root/'src/styles/views.css').write_text('new margin')
            # Producers rerun after CSS changes, but exactly identical documents
            # need no repeated independent Office/PDF validation.
            for step in M.STEPS:
                dep=step['task'];file=out/(dep+'.pdf');receipt=root/'.build/producers'/dep/'second'
                E.record(receipt,'producer-v2',[file],root);step.update(key='producer-v2',receipt=str(receipt/'manifest.json'))
            self.assertEqual(before,key())
            step=M.STEPS[-1];file=out/(step['task']+'.pdf');file.write_text('changed document')
            receipt=root/'.build/producers'/step['task']/'third';E.record(receipt,'producer-v3',[file],root);step.update(key='producer-v3',receipt=str(receipt/'manifest.json'))
            self.assertNotEqual(before,key())
            Path(next(iter(E.read(receipt/'manifest.json')['outputs']))).write_text('corrupt snapshot')
            with self.assertRaisesRegex(ValueError,'Erzeugernachweis'):key()

    def test_timeout_keeps_previous_group_and_has_no_success_receipt(self):
        with workspace() as root:
            cmd=self.command(root,'ui');self.quiet_run('ui',cmd)
            with self.assertRaises(RuntimeError):self.quiet_run('v140',[sys.executable,'-c','import time; time.sleep(10)'],timeout=.05)
            self.assertEqual(M.STEPS[-1]['exit_code'],124);self.assertNotIn('receipt',M.STEPS[-1])
            self.assertTrue(self.quiet_run('ui',cmd)['reused'])

    def test_alternate_runtime_is_bound_but_random_extraction_path_is_not(self):
        with workspace() as root:
            other=root/'alternate';other.mkdir();file=other/'runtime.js';file.write_text('first runtime')
            env={**M.ENV,'NB_DIST':str(other)};key=M.task_identity('ui',['probe'],300,env)
            file.write_text('changed runtime');self.assertNotEqual(key,M.task_identity('ui',['probe'],300,env))
            first=M.task_identity('package-smoke',['probe'],300,{**M.ENV,'NB_DIST':'/temporary/extraction-a'})
            second=M.task_identity('package-smoke',['probe'],300,{**M.ENV,'NB_DIST':'/temporary/extraction-b'})
            self.assertEqual(first,second)

    def test_real_checkpoint_helper_with_small_sections(self):
        result=subprocess.run(['node','tests/checkpoints-test.cjs'],cwd=ROOT,capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr)

def benchmark():
    measurements=[]
    for reuse in [False,True]:
        with workspace() as root:
            names=['ui','v140','v150'];commands={name:[sys.executable,'-c',f"import time; from pathlib import Path; time.sleep(.04); assert 'FAIL' not in Path({str(root/'tests'/(name+'.cjs'))!r}).read_text()"] for name in names}
            (root/'tests/v150.cjs').write_text('FAIL');M.REUSE=reuse
            with contextlib.redirect_stdout(io.StringIO()):
                for name in names:
                    try:M.run(name,commands[name],task=name)
                    except RuntimeError:break
                (root/'tests/v150.cjs').write_text('fixed')
                M.STEPS=[];start=time.perf_counter()
                for name in names:M.run(name,commands[name],task=name)
                seconds=time.perf_counter()-start
            measurements.append({'mode':'new-reuse' if reuse else 'old-fresh-policy','executed':sum(not s['reused'] for s in M.STEPS),'reused':sum(s['reused'] for s in M.STEPS),'retry_wall_seconds':round(seconds,4)})
    before,after=measurements
    print(json.dumps({'scenario':'three synthetic 40-ms checks; third fails, then is fixed','measurements':measurements,'avoided_checks':before['executed']-after['executed'],'measured_retry_wall_saved_seconds':round(before['retry_wall_seconds']-after['retry_wall_seconds'],4),'not_a_full_program_benchmark':True},ensure_ascii=False,indent=2))

if __name__=='__main__':
    if sys.argv[1:]==['--benchmark']:benchmark()
    else:unittest.main(verbosity=1)
