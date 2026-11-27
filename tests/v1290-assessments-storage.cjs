'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const N = require('../src/core.js');
const { start } = require('./host-client.cjs');
const { load } = require('./load.cjs');
const fixture = require('./v1290-fixture.cjs');

const primary = 'notenverwaltung.json';
const manifestPath = 'Sicherungen/Notenlistenverzeichnis.json';
const recordId = 'assessment126-1';
const normalized = text => text.replace(/^\ufeff/, '');
const clone = value => JSON.parse(JSON.stringify(value));
const listPath = (data, type, id) => [...N.textListPlan(data)].find(item =>
  item.context.type === type && (!id || (item.context.assessmentId || item.context.studentId) === id)).path;

for (const protectedStorage of [false, true]) {
  test(protectedStorage ? 'Leistung im geschützten Bestand verschieben, löschen und zurückholen' :
    'Leistung und TXT-Listen pflegen, bei TXT-Fehler ohne weitere Revision fortsetzen', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nb1290-storage-'));
    const client = start(root);
    let ctx;
    const read = relative => client.request('read', { path: relative });
    const readPrimary = async () => JSON.parse(await read(primary));
    const manifest = async () => JSON.parse(await read(manifestPath));
    const missing = relative => assert.rejects(() => read(relative), { name: 'NotFoundError' });
    const write = (relative, text) => client.request('write', { path: relative, text });

    async function boot() {
      ctx = await load({ beforeParse: win => client.attach(win), maxWait: 30000 });
      assert.equal(ctx.q.fatalStart, false);
      await ctx.q.workspacePromise;
    }
    async function expectCurrentList(data, wantedPath) {
      const entry = (await manifest()).paths[wantedPath];
      assert.ok(entry, 'Die aktuelle TXT-Datei steht im Verzeichnis.');
      assert.equal(normalized(await read('Notenlisten/' + entry)), normalized(N.exportsTXT(data)[wantedPath]));
      return entry;
    }

    try {
      const data = fixture(N);
      if (protectedStorage) data.assessments.find(item => item.id === recordId).oralEntry = 'individual';
      N.validate(data);
      await fs.mkdir(path.join(root, 'Daten'));
      await write(primary, JSON.stringify(data));
      await boot();
      if (protectedStorage) {
        ctx.w.close();
        ctx = null;
        const recovery = await client.request('vault-key');
        const status = await client.request('vault-enable', {
          password: 'Synthetisches Testpasswort 1!', recovery, verification: recovery,
        });
        assert.equal(status.enabled, true);
        assert.equal(status.locked, false);
        await boot();
        assert.equal(ctx.q.store.protected, true);
      }

      const { q: app, w } = ctx;
      const find = selector => w.document.querySelector(selector);
      const course = app.data.courses[0];
      const [studentId] = course.studentIds;
      app.courseNotes(course.id);
      const record = data => data.assessments.find(item => item.id === recordId);
      const calc = data => N.calculate(data, data.courses[0], studentId).total.fixed(5);
      const toggle = () => find('[data-assessment-menu="' + recordId + '"], #oral-edit-' + recordId);
      const original = clone(record(app.data));
      const finalGrades = clone(app.data.finals);
      const firstTotal = calc(app.data);
      const testPath = listPath(app.data, 'assessment', recordId);
      const overviewPath = listPath(app.data, 'overview');
      const pupilPath = listPath(app.data, 'pupil', studentId);
      await expectCurrentList(app.data, testPath);
      await expectCurrentList(app.data, overviewPath);
      await expectCurrentList(app.data, pupilPath);

      const openMove = async kind => {
        await app.openAssessmentMove(recordId, toggle());
        assert.equal(find('#dialog').open, true);
        const select = find('#dialogContent select');
        assert.ok(select);
        select.value = kind;
        select.dispatchEvent(new w.Event('change', { bubbles: true }));
        assert.equal(find('#dialogSave').disabled, false);
      };
      const close = () => assert.equal(find('#dialog').open, false);

      if (!protectedStorage) {
        const sync = app.store.syncTextLists;
        app.store.syncTextLists = async () => { throw Error('Synthetischer TXT-Fehler'); };
        await openMove('oral');
        try {
          await app.submitModal();
          assert.equal(app.textPending, true);
          assert.equal(record(await readPrimary()).kind, 'oral');
          assert.equal(find('#dialog').open, true);
          assert.match(find('#dialogError').textContent, /verschoben.*Notenlisten/i);
          assert.equal(find('#dialogSave').textContent, 'Notenlisten aktualisieren');
        } finally {
          app.store.syncTextLists = sync;
        }
        const afterCommit = await read(primary);
        await app.submitModal();
        close();
        assert.equal(await read(primary), afterCommit, 'TXT-Wiederholung erzeugt keine weitere JSON-Revision.');
        assert.equal(app.textPending, false);
      } else {
        await openMove('oral');
        await app.submitModal();
        close();
      }

      const moved = await readPrimary();
      const oralEntry = protectedStorage ? 'individual' : 'class';
      assert.deepEqual(record(moved), { ...original, kind: 'oral', oralEntry });
      assert.deepEqual(moved.finals, finalGrades);
      assert.notEqual(calc(moved), firstTotal);
      const oralPath = listPath(moved, 'assessment', recordId);
      assert.notEqual(oralPath, testPath);
      await missing('Notenlisten/' + testPath);
      await expectCurrentList(moved, oralPath);
      await expectCurrentList(moved, overviewPath);
      await expectCurrentList(moved, pupilPath);

      if (!protectedStorage) {
        await openMove('test');
        await app.submitModal();
        close();
        const returned = await readPrimary();
        assert.deepEqual(record(returned), { ...original, oralEntry });
        assert.equal(calc(returned), firstTotal);
        await missing('Notenlisten/' + oralPath);
        await expectCurrentList(returned, testPath);
      }

      const beforeDelete = await read(primary);
      await app.openAssessmentDelete(recordId, toggle());
      assert.equal(find('#dialog').open, true);
      app.closeModal();
      assert.equal(await read(primary), beforeDelete);

      const currentPath = listPath(app.data, 'assessment', recordId);
      const manualPath = 'Notenlisten/' + overviewPath;
      const manual = 'Eigene, synthetische Übersicht';
      if (!protectedStorage) await write(manualPath, manual);

      await app.openAssessmentDelete(recordId, toggle());
      await app.submitModal();
      close();
      const deleted = await readPrimary();
      assert.equal(record(deleted), undefined);
      assert.deepEqual(deleted.finals, finalGrades);
      await missing('Notenlisten/' + currentPath);
      await expectCurrentList(deleted, overviewPath);
      await expectCurrentList(deleted, pupilPath);
      if (protectedStorage) {
        await assert.rejects(() => fs.stat(path.join(root, 'Daten', 'Notenlisten')), { code: 'ENOENT' });
        const snapshots = await client.request('entries', { path: 'Sicherungen' });
        assert.ok(snapshots.some(item => item.name.startsWith('Stand_')));
      } else {
        assert.equal(await read(manualPath), manual);
      }

      const undo = w.document.createElement('button');
      undo.dataset.action = 'undo';
      await app.action(undo);
      await app.save();
      const restored = await readPrimary();
      assert.deepEqual(record(restored), record(JSON.parse(beforeDelete)));
      assert.deepEqual(restored.finals, finalGrades);
      await expectCurrentList(restored, currentPath);
      assert.deepEqual(ctx.errors, []);
    } finally {
      await ctx?.q.workspacePromise;
      ctx?.w.close();
      client.stop();
      await fs.rm(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });
}
