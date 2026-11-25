'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn, execFileSync } = require('node:child_process');
const { createInterface } = require('node:readline');
const { createHash } = require('node:crypto');
const { runInNewContext } = require('node:vm');
const N = require('../src/core.js');
const { FolderStore } = require('../src/storage.js');
const cli = path.join(__dirname, 'native', 'StorageCli.dll');
const dotnet = process.env.NOTENBLICK_DOTNET || path.join(__dirname, '..', '.tools', 'dotnet', process.platform === 'win32' ? 'dotnet.exe' : 'dotnet');
const password = 'Rote Ampel im Winter 1!';
const nextPassword = 'Morgen am Radweg 2026!';
const finalPassword = 'Birne, Quelle, Schulweg 2027';
const primary = 'notenverwaltung.json';
const privatePath = 'Notenlisten/Schuljahr Alfa/Klasse Synthetisch/Fach-Probe.txt';
const listText = 'Ganz eindeutiger synthetischer Testname: Notenblatt 123';
const sample = JSON.stringify({ id: 'fixture-only', appVersion: '1.27.0', years: [], classes: [], students: [], assessments: [], text: listText });
const prior = 'Sicherungen/Vor_Leistungsbereichen_2026-11-25T08-00-00-000Z_00112233-4455-6677-8899-aabbccddeeff.json';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const exists = async file => fs.stat(file).then(() => true, () => false);

function host(folder, boundary, executable = cli) {
  const proc = spawn(dotnet, [executable, folder, ...(boundary ? [boundary] : [])], { stdio: ['pipe', 'pipe', 'pipe'] });
  let id = 0, error = '';
  const pending = new Map();
  const onExit = new Promise(resolve => proc.once('close', (code, signal) => {
    for (const item of pending.values()) item.reject(new Error(`Native host stopped (${code ?? signal}): ${error.slice(0, 500)}`));
    pending.clear();
    resolve(code);
  }));
  proc.on('error', e => { for (const item of pending.values()) item.reject(e); pending.clear(); });
  proc.stderr.on('data', data => { error += data; });
  createInterface({ input: proc.stdout }).on('line', line => {
    const result = JSON.parse(line), item = pending.get(result.id);
    if (item && !result.progress) { pending.delete(result.id); item.resolve(result); }
  });
  function call(op, input = {}) {
    return new Promise((resolve, reject) => {
      const requestId = ++id;
      pending.set(requestId, { resolve, reject });
      proc.stdin.write(JSON.stringify({ id: requestId, op, ...input }) + '\n');
    });
  }
  async function ok(op, input) { const r = await call(op, input); assert.equal(r.ok, true, `${op}: ${r.error}`); return r.result; }
  async function fails(op, input) { const r = await call(op, input); assert.equal(r.ok, false, op); return r.error; }
  return { call, ok, fails, async close() { if (!proc.stdin.destroyed) proc.stdin.end(); return onExit; } };
}
async function fixture(t, boundary) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'nb-vault-'));
  const data = path.join(base, 'Daten');
  await fs.mkdir(data);
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  const instance = host(base, boundary);
  t.after(() => instance.close());
  await instance.ok('write', { path: primary, text: sample });
  await instance.ok('write', { path: 'Ansicht.json', text: JSON.stringify({ performanceDrafts: [listText] }) });
  await instance.ok('write', { path: privatePath, text: '\ufeff' + listText });
  const name = privatePath.slice('Notenlisten/'.length);
  await instance.ok('write', { path: 'Sicherungen/Notenlistenverzeichnis.json', text: JSON.stringify({ files: [name], hashes: { [name]: sha256(listText) } }) });
  await instance.ok('write', { path: prior, text: sample });
  return { base, data, instance };
}
async function allFiles(root) {
  const result = [];
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...await allFiles(file));
    else result.push(file);
  }
  return result;
}
const read = (instance, name = primary) => instance.ok('read', { path: name });

// The Linux host talks to the same native storage implementation as Windows.
test('Verschlüsselung, Sperren, Dateiablage und unabhängige Sicherung', async t => {
  const { base, data, instance: a } = await fixture(t);
  assert.equal((await a.ok('vault-status')).enabled, false);
  const recovery = await a.ok('vault-key');
  assert.match(recovery, /^(?:[0-9A-Z]{4}-){13}[0-9A-Z]{4}$/);
  await a.fails('vault-enable', { password, recovery, verification: await a.ok('vault-key') });
  assert.equal(await read(a), sample);
  const enabled = await a.ok('vault-enable', { password, recovery, verification: recovery });
  assert.deepEqual(enabled, { enabled: true, locked: false, pending: false, unprotected: [] });
  assert.ok((await fs.stat(path.join(data, primary))).isDirectory());
  assert.ok((await fs.stat(path.join(data, 'Sicherungen'))).isFile());
  assert.ok(!await exists(path.join(data, 'Notenlisten')));
  assert.equal(await read(a, privatePath), listText);
  assert.equal(await read(a, prior), sample);
  await a.ok('vault-verify', { recovery });
  const classes = await a.ok('entries', { path: 'Notenlisten/Schuljahr Alfa' });
  assert.equal(classes[0].name, 'Klasse Synthetisch');
  assert.equal(classes[0].kind, 'directory');
  for (const file of await allFiles(data)) {
    assert.ok(!file.includes('Klasse Synthetisch'));
    assert.ok(!(await fs.readFile(file)).includes(listText));
  }
  const backup = JSON.stringify({version: 1, data: JSON.parse(sample), lists: [{path: privatePath, text: listText}]});
  const encrypted = await a.ok('vault-backup', { text: backup });
  const bytes = Buffer.from(encrypted, 'base64');
  assert.equal(bytes.subarray(0, 8).toString(), 'NBVAULT1');
  assert.ok(!bytes.includes(listText));
  assert.equal(await a.ok('vault-open-backup', { dataBase64: encrypted }), backup);
  for (const corruptAt of [8, 30, 150, 195, 203, bytes.length - 1]) {
    const altered = Buffer.from(bytes); altered[corruptAt] ^= 1;
    await a.fails('vault-open-backup', { dataBase64: altered.toString('base64') });
  }
  await a.fails('vault-open-backup', { dataBase64: bytes.subarray(0, -1).toString('base64') });
  await a.ok('vault-lock');
  assert.equal((await a.ok('vault-status')).locked, true);
  await a.fails('write', { path: primary, text: '{}' });
  await a.fails('read', { path: primary });
  await a.fails('migration-commit', { key: 'old-root' });
  await a.fails('vault-unlock', { password: password + ' ' });
  await a.fails('vault-unlock', { recovery: await a.ok('vault-key') });
  await a.ok('vault-unlock', { recovery: recovery.toLowerCase().replaceAll('-', ' ') });
  assert.equal(await read(a), sample);
  await a.close();
  const secondPath = path.join(base, 'Anderer-Rechner');
  await fs.mkdir(secondPath);
  await fs.cp(data, path.join(secondPath, 'Daten'), { recursive: true });
  const second = host(secondPath);
  t.after(() => second.close());
  assert.equal((await second.ok('vault-status')).locked, true);
  await second.ok('vault-unlock', { password });
  assert.equal(await read(second), sample);
  assert.equal(await second.ok('vault-open-backup', { dataBase64: encrypted, recovery }), backup);
});

test('Passwort ändern, Notfallschlüssel ersetzen und Bestand entschlüsseln', async t => {
  const { data, instance: a } = await fixture(t);
  const recovery = await a.ok('vault-key');
  await a.ok('vault-enable', { password, recovery, verification: recovery });
  const oldBackup = await a.ok('vault-backup', { text: sample });
  await a.ok('vault-change', { recovery, password: nextPassword });
  await a.ok('vault-lock');
  await a.fails('vault-unlock', { password });
  await a.ok('vault-unlock', { password: nextPassword });
  await a.ok('vault-verify', { recovery });
  const oldGeneration = (await fs.readdir(data)).find(name => /^Geschuetzt-/.test(name));
  const newRecovery = await a.ok('vault-key');
  await a.ok('vault-rotate', { currentPassword: nextPassword, password: finalPassword, recovery: newRecovery, verification: newRecovery });
  assert.equal(await exists(path.join(data, oldGeneration)), false);
  await a.ok('vault-lock');
  await a.fails('vault-unlock', { recovery });
  await a.fails('vault-unlock', { password: nextPassword });
  await a.ok('vault-unlock', { recovery: newRecovery });
  assert.equal(await read(a), sample);
  await a.fails('vault-open-backup', { dataBase64: oldBackup });
  assert.equal(await a.ok('vault-open-backup', { dataBase64: oldBackup, password }), sample);
  assert.equal(await a.ok('vault-open-backup', { dataBase64: oldBackup, recovery }), sample);
  await a.fails('vault-disable', { password: nextPassword });
  const status = await a.ok('vault-disable', { password: finalPassword });
  assert.equal(status.enabled, false);
  assert.equal(await fs.readFile(path.join(data, primary), 'utf8'), sample);
  assert.equal(await fs.readFile(path.join(data, privatePath), 'utf8'), '\ufeff' + listText);
  assert.ok((await fs.readdir(data)).some(name => /^Geschuetzt-/.test(name)));
  assert.ok(!await exists(path.join(data, prior)));
});

test('Uneindeutige Sicherungsdatei belassen, manipulierten Schutzverweis erkennen', async t => {
  const { base, data, instance: a } = await fixture(t);
  const foreign = path.join(data, 'Sicherungen', 'Eigene-Zusatzdatei.txt');
  await fs.writeFile(foreign, 'Eigene Datei der Testperson');
  const recovery = await a.ok('vault-key');
  assert.match(await a.fails('vault-enable', { password, recovery, verification: recovery }), /Eigene-Zusatzdatei\.txt/);
  assert.equal(await fs.readFile(foreign, 'utf8'), 'Eigene Datei der Testperson');
  assert.equal(await read(a), sample);
  await fs.rename(foreign, path.join(base, 'Eigene-Zusatzdatei.txt'));
  await a.ok('vault-enable', { password, recovery, verification: recovery });
  await a.close();
  const marker = path.join(data, 'Notenblick-Schutz.txt');
  const originalMarker = await fs.readFile(marker);
  for (const alternative of [false, 'NBSTORE1\n../ausserhalb']) {
    if (alternative === false) await fs.unlink(marker); else await fs.writeFile(marker, alternative);
    const broken = host(base);
    t.after(() => broken.close());
    await assert.rejects(broken.ok('vault-status'), /Native host stopped/);
    assert.ok((await fs.stat(path.join(data, primary))).isDirectory());
  }
  await fs.writeFile(marker, originalMarker);
  const reopened = host(base);
  t.after(() => reopened.close());
  await reopened.ok('vault-unlock', { password });
  assert.equal(await read(reopened), sample);
});

async function productionFolder(instance) {
  let receive;
  const webview = {
    addEventListener(_, handler) { receive = handler; },
    async postMessage({ id, op, ...args }) {
      const response = await instance.call(op, args);
      receive({ data: { ...response, id } });
    },
  };
  const context = { chrome: { webview }, setTimeout, clearTimeout };
  runInNewContext(await fs.readFile(path.join(__dirname, '../src/desktop.js'), 'utf8'), context);
  return new context.NRDesktop.Directory('');
}

test('Echte Sicherungen bei fehlenden oder älteren Angaben verschlüsseln und nach Abschalten öffnen', async t => {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'nb-vault-snapshots-'));
  const data = path.join(base, 'Daten');
  const a = host(base);
  t.after(async () => { await a.close(); await fs.rm(base, { recursive: true, force: true }); });
  const store = new FolderStore(await productionFolder(a));
  let current = N.demo();
  const workspace = { settings: { notesLayout: 'compact' } };
  await store.saveWorkspace(workspace);
  for (let i = 0; i < 3; i++) {
    current.students[0].alias = `Synthetischer Speicherstand ${i}`;
    current = (await store.save(current, { workspace })).data;
  }
  const disk = name => path.join(data, name);
  const backups = async () => fs.readdir(disk('Sicherungen'));
  const regular = (await backups()).filter(name => name.startsWith('Stand_')).sort();
  assert.equal(regular.length, 3);
  const retentionFile = disk('Sicherungen/Aufbewahrung.json');
  const metadata = JSON.parse(await fs.readFile(retentionFile));
  delete metadata[regular[0]];
  delete metadata[regular[1]].digest;
  await fs.writeFile(retentionFile, JSON.stringify(metadata));
  const copied = disk('Sicherungen/' + regular[2]);
  await fs.utimes(copied, new Date('2023-01-02T03:04:05Z'), new Date('2023-01-02T03:04:05Z'));
  const verified = await store.protect('Vor_Wiederherstellung', current, workspace);
  const oldRoot = path.join(base, primary);
  await fs.writeFile(oldRoot, await fs.readFile(disk(primary)));
  const oldSource = await a.ok('migration-read', { key: 'old-root' });
  await a.ok('migration-commit', { key: 'old-root', sha256: oldSource.sha256, currentSha256: await a.ok('current-hash') });
  await fs.unlink(oldRoot);
  const migration = (await backups()).find(name => name.startsWith('Vor_Migration_'));
  assert.ok(migration);
  let manual;
  const manualContext = { Notenblick: {
    N, data: current, getWorkspace: () => workspace, feedback() {},
  } };
  runInNewContext(await fs.readFile(path.join(__dirname, '../src/app/files.js'), 'utf8'), manualContext);
  manualContext.Notenblick.download = async (name, payload) => { manual = 'Sicherungen/' + name; await fs.writeFile(disk(manual), payload); };
  await manualContext.Notenblick.backup();
  const repaired = 'Sicherungen/Beschaedigt_2026-11-25T08-00-00-000Z.json';
  await fs.writeFile(disk(repaired), '{nicht lesbar: Ausschluss persönlicher Daten im Test');
  const legacy = 'Sicherungen/Alte Sicherungen/Umbenannte Notenraum-Sicherung.nbk';
  await fs.mkdir(path.dirname(disk(legacy)));
  await fs.writeFile(disk(legacy), JSON.stringify({ ...current, appVersion: '1.9.0' }));

  const historical = path.join(base, 'Früher');
  const history = host(historical);
  t.after(() => history.close());
  await history.ok('write', { path: primary, text: JSON.stringify(current) });
  const historicalKey = await history.ok('vault-key');
  await history.ok('vault-enable', { password: nextPassword, recovery: historicalKey, verification: historicalKey });
  const originalEncrypted = await history.ok('vault-backup', { text: JSON.stringify({ version: 1, data: current, lists: [] }) });
  const protectedBackup = 'Sicherungen/Bereits geschützt.nbx';
  await fs.writeFile(disk(protectedBackup), Buffer.from(originalEncrypted, 'base64'));

  const expected = new Map();
  for (const name of [...regular.map(name => 'Sicherungen/' + name), verified, manual, legacy, repaired, protectedBackup, 'Sicherungen/' + migration])
    expected.set(name, await fs.readFile(disk(name)));
  const recovery = await a.ok('vault-key');
  const enabled = await a.ok('vault-enable', { password, recovery, verification: recovery });
  assert.deepEqual(enabled, { enabled: true, locked: false, pending: false, unprotected: [] });
  assert.equal((await fs.stat(disk('Sicherungen'))).isFile(), true);
  for (const [name, bytes] of expected) {
    const result = await a.ok('vault-stored-backup', { path: name, includeEncrypted: true });
    assert.equal(result.digest, createHash('sha256').update(bytes).digest('base64'), name);
    assert.equal(result.kind, name === repaired ? 'damaged' : name === protectedBackup ? 'encrypted' : 'text');
    if (name === protectedBackup) assert.equal(result.dataBase64, originalEncrypted);
  }
  assert.equal(JSON.parse(await a.ok('vault-open-backup', { dataBase64: originalEncrypted, recovery: historicalKey })).data.commitId, current.commitId);
  await a.fails('vault-open-backup', { dataBase64: originalEncrypted, recovery });
  const generation = (await fs.readdir(data)).find(name => /^Geschuetzt-/.test(name));
  await a.ok('vault-lock');
  await a.ok('vault-unlock', { password });
  store.protected = true;
  current = await store.load();
  current.students[0].alias = 'Synthetische Änderung bei aktivem Schutz';
  current = (await store.save(current, {workspace})).data;
  await a.fails('vault-disable', { recovery: historicalKey });
  await a.ok('vault-disable', { recovery });
  assert.deepEqual(JSON.parse(await fs.readFile(disk('Ansicht.json'))), workspace);
  const notes = await allFiles(disk('Notenlisten'));
  assert.ok(notes.length);
  assert.ok((await Promise.all(notes.map(file => fs.readFile(file, 'utf8')))).some(text => text.includes(current.students[0].alias)));
  await a.close();
  const restart = host(base);
  t.after(() => restart.close());
  assert.equal((await restart.ok('vault-status')).enabled, false);
  const plainStore = new FolderStore(await productionFolder(restart));
  const changed = await plainStore.load();
  changed.students[0].alias = 'Synthetische Änderung nach Neustart';
  const saved = (await plainStore.save(changed, {workspace})).data;
  assert.equal(saved.students[0].alias, changed.students[0].alias);

  const detached = path.join(base, 'Historisches-Archiv');
  await fs.mkdir(detached);
  await fs.cp(disk(generation), path.join(detached, 'Daten'), { recursive: true });
  const archived = host(detached);
  t.after(() => archived.close());
  await archived.fails('vault-unlock', { recovery: historicalKey });
  await archived.ok('vault-unlock', { recovery });
  assert.equal(JSON.parse((await archived.ok('vault-stored-backup', { path: manual })).text).commitId, JSON.parse(expected.get(manual)).commitId);
  const oldCopy = await archived.ok('vault-stored-backup', { path: protectedBackup, includeEncrypted: true });
  assert.equal(oldCopy.dataBase64, originalEncrypted);
  assert.equal(JSON.parse(await archived.ok('vault-open-backup', { dataBase64: oldCopy.dataBase64, password: nextPassword })).data.commitId, JSON.parse(expected.get(manual)).commitId);
  const newKey = await restart.ok('vault-key');
  await restart.ok('vault-enable', { password: finalPassword, recovery: newKey, verification: newKey });
  assert.equal(JSON.parse(await read(restart)).students[0].alias, changed.students[0].alias);
});

// Reference outputs were also calculated with the independent OpenSSL
// implementation (cryptography 50.0.0). Salt is 00...0f; the password ends in a
// space and is encoded as UTF-8 without transformations. AES key, input and IV
// are all zero, and the reference value contains the 128-bit GCM tag after CT.
test('Referenzvektoren für Argon2id und AES-256-GCM', async t => {
  const { instance: a } = await fixture(t);
  assert.deepEqual(await a.ok('test-vault-vectors'), {
    argon2id: '9ecc001c592a256851a25ebb3020ae28572e2b2d499625daf2d2150415e70771',
    aes256gcm: 'cea7403d4d606b6e074ec5d3baf39d18d0d1c8a799996bf0265b98b5d48ab919',
  });
});

for (const boundary of ['enable-staged', 'enable-published', 'enable-delete']) {
  test(`Schutz nach Prozessabbruch fortsetzen (${boundary})`, async t => {
    const { base, data, instance: a } = await fixture(t, boundary);
    const recovery = await a.ok('vault-key');
    await assert.rejects(a.ok('vault-enable', { password, recovery, verification: recovery }), /Native host stopped \(77\)/);
    const reopened = host(base);
    t.after(() => reopened.close());
    const before = await reopened.ok('vault-status');
    assert.equal(before.enabled, true);
    assert.equal(before.pending, true);
    await reopened.fails('write', { path: primary, text: '{}' });
    await reopened.fails('vault-unlock', { recovery: await reopened.ok('vault-key') });
    assert.equal((await reopened.ok('vault-status')).locked, true);
    const after = await reopened.ok('vault-unlock', { recovery });
    assert.equal(after.pending, false);
    assert.equal(await read(reopened), sample);
    assert.equal(await read(reopened, privatePath), listText);
    assert.ok((await fs.stat(path.join(data, primary))).isDirectory());
  });
}

for (const boundary of ['rotate-published', 'disable-journal', 'disable-write', 'disable-retired']) {
  test(`Schlüsselwechsel oder Abschalten nach Prozessabbruch fortsetzen (${boundary})`, async t => {
    const { base, data, instance: a } = await fixture(t, boundary);
    const recovery = await a.ok('vault-key');
    await a.ok('vault-enable', { password, recovery, verification: recovery });
    const previous = (await fs.readdir(data)).find(name => /^Geschuetzt-/.test(name));
    const newRecovery = await a.ok('vault-key');
    const rotate = boundary === 'rotate-published';
    const mutate = rotate ? a.ok('vault-rotate', { currentPassword: password, password: nextPassword, recovery: newRecovery, verification: newRecovery }) : a.ok('vault-disable', { recovery });
    await assert.rejects(mutate, /Native host stopped \(77\)/);
    const reopened = host(base);
    t.after(() => reopened.close());
    assert.equal((await reopened.ok('vault-status')).pending, true);
    if (rotate) await reopened.fails('vault-unlock', { recovery });
    const after = await reopened.ok('vault-unlock', { recovery: rotate ? newRecovery : recovery });
    assert.equal(after.pending, false);
    assert.equal(after.enabled, rotate);
    assert.equal(await exists(path.join(data, previous)), !rotate);
    assert.equal(await read(reopened), sample);
    assert.equal(await read(reopened, privatePath), listText);
  });
}

async function oldNativeHost(base) {
  const repo = path.resolve(__dirname, '..');
  const directory = path.join(base, 'old-host');
  await fs.mkdir(directory);
  const sdk = JSON.parse(await fs.readFile(path.join(repo, 'global.json'), 'utf8')).sdk.version;
  const sdkRoot = execFileSync(dotnet, ['--list-sdks'], { encoding: 'utf8' }).split('\n').map(line => line.match(/^([^ ]+) \[(.+)]$/)).find(item => item?.[1] === sdk)[2];
  const refs = path.join(repo,'dev','microsoft.netframework.referenceassemblies.net48', 'build', '.NETFramework', 'v4.8');
  const json = path.join(repo, 'dev', 'newtonsoft.json', 'lib');
  const files = ['native/Storage.cs', 'native/Migration.cs', 'native/ExportFiles.cs', 'native/OfficePackage.cs', 'tests/StorageCli.cs'];
  for (const file of files) await fs.writeFile(path.join(directory, path.basename(file)), execFileSync('git', ['show', 'v1.27.0:' + file], { cwd: repo }));
  const entry = path.join(directory, 'OldStorageCli.dll');
  execFileSync(dotnet, [path.join(sdkRoot, sdk, 'Roslyn', 'bincore', 'csc.dll'), '-nologo', '-nostdlib+', '-target:exe', '-out:' + entry,
    ...['mscorlib', 'System', 'System.Core', 'System.IO.Compression', 'System.Xml'].map(name => '-r:' + path.join(refs, name + '.dll')),
    '-r:' + path.join(json, 'net45', 'Newtonsoft.Json.dll'), ...files.map(file => path.join(directory, path.basename(file)))]);
  await fs.copyFile(path.join(json, 'net6.0', 'Newtonsoft.Json.dll'), path.join(directory, 'Newtonsoft.Json.dll'));
  await fs.copyFile(cli.replace(/\.dll$/, '.runtimeconfig.json'), entry.replace(/\.dll$/, '.runtimeconfig.json'));
  return entry;
}

test('Unveränderte Speicherung aus 1.27 kann geschützten Bestand nicht ersetzen', async t => {
  const { base, data, instance: a } = await fixture(t);
  const recovery = await a.ok('vault-key');
  await a.ok('vault-enable', { password, recovery, verification: recovery });
  await a.close();
  const old = host(base, null, await oldNativeHost(base));
  t.after(() => old.close());
  await fs.writeFile(path.join(base, primary), JSON.stringify({ id: 'external-old-fixture', secret: 'Alte Kopie' }));
  const before = new Map();
  for (const file of await allFiles(data)) before.set(file, sha256(await fs.readFile(file)));
  const [source] = await old.ok('migration-sources');
  assert.equal(source.key, 'old-root');
  const incoming = await old.ok('migration-read', { key: 'old-root' });
  assert.equal(await old.ok('current-hash'), null);
  await old.fails('migration-commit', { key: 'old-root', sha256: incoming.sha256, currentSha256: null });
  await old.fails('write', { path: primary, text: '{}' });
  const after = new Map();
  for (const file of await allFiles(data)) after.set(file, sha256(await fs.readFile(file)));
  assert.deepEqual(after, before);
  const reopened = host(base);
  t.after(() => reopened.close());
  await reopened.ok('vault-unlock', { recovery });
  assert.equal(await read(reopened), sample);
});

test('Acht Unicode-Zeichen für neue Passwörter und weiter nutzbarer alter Zugang', async t => {
  const { base, data, instance: a } = await fixture(t);
  const recovery = await a.ok('vault-key');
  const auth = { recovery, verification: recovery };
  for (const rejected of ['Äbc1!😊d', 'äbc1!😊de', 'ÄBC1!😊DE', 'ÄbcD!😊de', 'Äbc1 deF']) {
    assert.match(await a.fails('vault-enable', { ...auth, password: rejected }), /mindestens acht Zeichen/);
    assert.equal((await a.ok('vault-status')).enabled, false);
  }
  const accepted = 'Äbc1!😊de';
  await a.ok('vault-enable', { ...auth, password: accepted });
  await a.fails('vault-change', { recovery, password: 'Äbc1!😊d' });
  const pointer = await fs.readFile(path.join(data, 'Notenblick-Schutz.txt'), 'utf8');
  const headerPath = path.join(data, pointer.trim().split('\n')[1], 'Zugang.bin');
  const header = (await fs.readFile(headerPath)).toString('base64');
  const legacyPassword = 'Frühere Prüfdaten ohne Ziffern';
  const legacy = await a.ok('test-vault-legacy-header', { header, password: accepted, legacyPassword, recovery });
  await a.close();
  await fs.writeFile(headerPath, Buffer.from(legacy, 'base64'));
  const reopened = host(base);
  t.after(() => reopened.close());
  await reopened.ok('vault-unlock', { password: legacyPassword });
  const backup = await reopened.ok('vault-backup', { text: sample });
  const replacement = await reopened.ok('vault-key');
  await reopened.ok('vault-rotate', { currentPassword: legacyPassword, password: legacyPassword, recovery: replacement, verification: replacement });
  await reopened.ok('vault-lock');
  await reopened.ok('vault-unlock', { password: legacyPassword });
  assert.equal(await reopened.ok('vault-open-backup', { password: legacyPassword, dataBase64: backup }), sample);
  assert.equal((await reopened.ok('vault-disable', { password: legacyPassword })).enabled, false);
});
