'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const axe = require('axe-core').source;
const N = require('../src/core.js');
const fixture = require('./v1290-fixture.cjs')(N);

const root = path.resolve(process.env.NB_DIST || path.join(__dirname, '..', 'dist', 'Programm'));
const out = path.join(__dirname, 'visual', 'v1290-assessments');
const recordId = 'assessment126-1';
const record = fixture.assessments.find(item => item.id === recordId);
const server = http.createServer((request, response) => {
  const file = path.resolve(root, '.' + new URL(request.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.ttf': 'font/ttf' };
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  } catch {
    response.writeHead(404).end();
  }
});

async function dialogBounds(page, zoom) {
  const checks = await page.evaluate(() => {
    const dialog = document.querySelector('#dialog');
    const rect = dialog.getBoundingClientRect();
    const footer = dialog.querySelector('.dialog-actions');
    const headerRect = dialog.querySelector('.dialog-header').getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    return {
      inWindow: rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1,
      contentFits: dialog.scrollWidth <= dialog.clientWidth + 2 && footer.scrollWidth <= footer.clientWidth + 2,
      headerAndFooterVisible: headerRect.top >= rect.top - 1 && footerRect.bottom <= rect.bottom + 1,
    };
  });
  assert.equal(checks.inWindow, true, 'Dialog liegt bei ' + zoom + ' im Fenster.');
  assert.equal(checks.contentFits, true, 'Dialog ist bei ' + zoom + ' ohne waagerechtes Scrollen lesbar.');
  if (zoom < 4) assert.equal(checks.headerAndFooterVisible, true, 'Überschrift und Aktionen bleiben sichtbar.');
}

async function focusActionAtHighZoom(page, zoom) {
  if (zoom < 4) return;
  const control = page.locator('#dialogSave');
  await control.focus();
  const visible = await control.evaluate(el => {
    const button = el.getBoundingClientRect();
    return button.top >= 0 && button.bottom <= innerHeight;
  });
  assert.equal(visible, true, 'Die fokussierte Aktion scrollt bei 400 % in den sichtbaren Bereich.');
}

async function scanDialog(page) {
  const result = await page.evaluate(async () => {
    const scan = await axe.run('#dialog', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] },
    });
    return scan.violations.map(violation => [violation.id, violation.nodes.map(node => node.target)]);
  });
  assert.deepEqual(result, []);
}

(async () => {
  let browser;
  try {
    fs.mkdirSync(out, { recursive: true });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({
      executablePath: process.env.NOTENBLICK_CHROMIUM || undefined,
      headless: true,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage({ locale: 'de-DE', viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port + '/Notenblick.html');
    await page.waitForSelector('html[data-ready=true]');
    await page.addScriptTag({ content: axe });
    await page.evaluate(data => {
      const app = Notenblick;
      app.data = NR.clone(data);
      app.mode = 'demo';
      app.today = () => '2027-03-18';
      app.normalizeContext();
      app.prefs.notesLayout = 'kinds';
      app.prefs.areaView = 'matrix';
      app.courseNotes(data.courses[0].id);
      app.W().oralAreaView = 'matrix';
    }, fixture);
    const dialog = page.locator('#dialog');
    const toggle = () => page.locator('[data-assessment-menu="' + recordId + '"]:visible');
    const menu = () => page.locator('[role=menu]:visible');
    const menuItem = name => menu().getByRole('menuitem', { name, exact: true });
    const save = page.locator('#dialogSave');
    const cancel = dialog.getByRole('button', { name: 'Abbrechen', exact: true });
    const focusIsToggle = () => toggle().evaluate(el => el === document.activeElement);
    const closeDialog = () => dialog.waitFor({ state: 'hidden' });
    const openMenu = () => toggle().press('Space');
    const selectDestination = id => dialog.getByLabel('Neuer Leistungsbereich', { exact: true }).selectOption(id);
    const clickMove = () => menuItem('Leistung verschieben …').click();
    const clickDelete = () => menuItem('Leistung löschen …').click();

    await page.locator('#tab-test').click();
    assert.equal(await toggle().getAttribute('aria-haspopup'), 'menu');
    assert.equal(await toggle().getAttribute('aria-expanded'), 'false');
    assert.equal(await toggle().evaluate(el => el.closest('th').scope), 'col');
    await openMenu();
    assert.equal(await toggle().getAttribute('aria-expanded'), 'true');
    assert.deepEqual(await menu().getByRole('menuitem').allTextContents(), [
      'Noten anzeigen', 'Noten bearbeiten', 'Angaben ändern', 'Leistung verschieben …', 'Leistung löschen …',
    ]);
    assert.equal(await menu().getByRole('separator').count(), 1);
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Noten anzeigen');
    await page.keyboard.press('End');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Leistung löschen …');
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Noten bearbeiten');
    await page.keyboard.press('Escape');
    assert.equal(await focusIsToggle(), true);
    assert.equal(await toggle().getAttribute('aria-expanded'), 'false');
    await openMenu();
    await page.keyboard.press('Tab');
    assert.equal(await menu().count(), 0);
    assert.equal(await focusIsToggle(), false);

    await openMenu();
    await menuItem('Noten anzeigen').press('Enter');
    await page.locator('#assessmentWorkTitle').waitFor();
    assert.equal(await page.locator('#assessmentWorkTitle').textContent(), record.title);
    assert.equal(await page.getByRole('button', { name: 'Leistung exportieren', exact: true }).isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await focusIsToggle(), true);

    await openMenu();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Fertig', exact: true }).waitFor();
    assert.equal(await page.locator('#p-test-table-' + fixture.students[0].id).inputValue(), '32');
    await page.keyboard.press('Escape');
    assert.equal(await focusIsToggle(), true);

    await page.evaluate(() => Notenblick.setPreference('areaView', 'list'));
    assert.equal(await toggle().evaluate(el => el.closest('th').scope), 'row');
    await openMenu();
    await menuItem('Angaben ändern').click();
    await dialog.waitFor();
    assert.match(await page.locator('#dialogTitle').textContent(), /Leistung bearbeiten/);
    const propertiesMove = dialog.getByRole('button', { name: 'Leistungsbereich ändern', exact: true });
    await propertiesMove.click();
    assert.match(await page.locator('#dialogTitle').textContent(), /Leistung verschieben/);
    assert.equal(await save.isEnabled(), false);
    await cancel.click();
    assert.match(await page.locator('#dialogTitle').textContent(), /Leistung bearbeiten/);
    assert.equal(await propertiesMove.evaluate(el => el === document.activeElement), true);
    await cancel.click();
    await closeDialog();
    assert.equal(await focusIsToggle(), true);
    await page.evaluate(() => Notenblick.setPreference('areaView', 'matrix'));

    await openMenu();
    await clickMove();
    assert.match(await page.locator('#dialogTitle').textContent(), /Leistung verschieben/);
    assert.equal(await save.isEnabled(), false);
    assert.match(await dialog.locator('#dialogContent').textContent(), /Vokabeltest.*Tests/s);
    await selectDestination('area126-3');
    assert.equal(await save.isEnabled(), true);
    assert.match(await dialog.locator('#dialogContent').textContent(), /Kopfrechnen/);
    assert.match(await dialog.locator('#dialogContent').textContent(), /Gesamt(?:note|durchschnitt)|0\s*%/);
    const focusBeforeHelp = await page.evaluate(() => document.activeElement.id);
    await page.keyboard.press('F1');
    await page.waitForSelector('#contextHelp');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), focusBeforeHelp);
    await scanDialog(page);
    await cancel.click();
    await closeDialog();
    assert.equal(await focusIsToggle(), true);
    assert.equal(await page.evaluate(id => Notenblick.data.assessments.find(item => item.id === id).kind, recordId), 'test');

    for (const [label, width, height, zoom, forcedColors] of [
      ['schmal', 400, 780, 1, 'none'],
      ['zoom-kontrast', 900, 800, 2, 'active'],
      ['zoom400', 1120, 950, 4, 'none'],
    ]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(value => { document.body.style.zoom = String(value); }, zoom);
      await page.emulateMedia({ forcedColors });
      await openMenu();
      const menuBox = await menu().boundingBox();
      assert.ok(menuBox.x >= -1 && menuBox.x + menuBox.width <= width + 1);
      await page.screenshot({ path: path.join(out, 'menue-' + label + '.png') });

      await clickMove();
      await selectDestination('oral');
      await dialogBounds(page, zoom);
      await focusActionAtHighZoom(page, zoom);
      await page.screenshot({ path: path.join(out, 'verschieben-' + label + '.png') });
      await page.keyboard.press('Escape');
      await closeDialog();
      assert.equal(await focusIsToggle(), true);

      await openMenu();
      await clickDelete();
      await dialogBounds(page, zoom);
      assert.match(await page.locator('#dialogTitle').textContent(), /Leistung löschen/);
      assert.match(await dialog.locator('#dialogContent').textContent(), /Vokabeltest.*Noten.*Punkte.*Bemerkungen/s);
      assert.equal(await save.textContent(), 'Leistung löschen');
      assert.equal(await cancel.evaluate(el => el === document.activeElement), true);
      await focusActionAtHighZoom(page, zoom);
      await page.screenshot({ path: path.join(out, 'loeschen-' + label + '.png') });
      await cancel.click();
      await closeDialog();
      assert.equal(await focusIsToggle(), true);
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => { document.body.style.zoom = '1'; });
    await page.emulateMedia({ forcedColors: 'none' });
    await openMenu();
    await clickMove();
    await selectDestination('oral');
    await save.click();
    await closeDialog();
    await page.waitForFunction(id => document.activeElement.dataset.assessmentMenu === id, recordId);
    assert.equal(await page.evaluate(id => Notenblick.data.assessments.find(item => item.id === id).kind, recordId), 'oral');
    assert.equal(await page.locator('#tab-oral').getAttribute('aria-selected'), 'true');

    await openMenu();
    await clickMove();
    await selectDestination('test');
    await save.click();
    await closeDialog();
    await page.waitForFunction(id => document.activeElement.dataset.assessmentMenu === id, recordId);
    assert.equal(await page.locator('#tab-test').getAttribute('aria-selected'), 'true');

    await openMenu();
    await clickDelete();
    await scanDialog(page);
    await save.click();
    await closeDialog();
    await page.waitForFunction(() => document.activeElement.dataset.assessmentMenu === 'v1290-peer');
    assert.equal(await toggle().count(), 0);

    await page.evaluate(() => {
      Notenblick.getCourse().archived = true;
      Notenblick.rendered = {};
      Notenblick.refreshCurrent();
    });
    await page.locator('[data-assessment-menu="v1290-peer"]:visible').press('Enter');
    assert.deepEqual(await menu().getByRole('menuitem').allTextContents(), ['Noten anzeigen']);
    assert.deepEqual(errors, []);
    console.log('1.29 Leistungsaktionen: Menü, Dialoge, Fokus, F1, zwei Axe-Prüfungen und neun Darstellungen.');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
