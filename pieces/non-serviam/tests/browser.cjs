const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');

(async () => {
  const server = http.createServer(async (req, res) => {
    try {
      let name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (name.endsWith('/')) name += 'index.html';
      const file = path.resolve(root, '.' + name);
      if (!file.startsWith(root + path.sep)) throw new Error('outside piece');
      res.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(file)] || 'application/octet-stream');
      res.end(await fs.readFile(file));
    } catch { res.statusCode = 404; res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser, count = 0;
  try {
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const origin = `http://127.0.0.1:${server.address().port}`;
    async function check(name, options, action) {
      const context = await browser.newContext({ viewport: options.mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 },
        hasTouch: Boolean(options.mobile), isMobile: Boolean(options.mobile), reducedMotion: 'reduce' });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(options => {
        if (options.audio === 'missing') { window.AudioContext = undefined; window.webkitAudioContext = undefined; }
        if (options.audio === 'throws') {
          window.AudioContext = class { constructor() { throw new Error('Audio context unavailable'); } };
          window.webkitAudioContext = undefined;
        }
        if (options.audio === 'rejects') {
          const Original = window.AudioContext;
          window.AudioContext = class extends Original {
            get state() { return 'suspended'; }
            resume() { return Promise.reject(new Error('Resume denied')); }
          };
        }
        if (Object.hasOwn(options, 'handoff') && !sessionStorage.getItem('fixture-seeded')) {
          let state = options.handoff;
          if (state && typeof state === 'object' && !Array.isArray(state)) {
            state = { savedAt: Date.now() - (options.age || 0), ...state };
          }
          sessionStorage.setItem('non-serviam-language-state', JSON.stringify(state));
          sessionStorage.setItem('fixture-seeded', 'yes');
        }
        if (options.storage === 'blocked') Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage blocked'); } });
      }, options);
      try {
        await page.goto(origin + (options.german ? '/de.html' : '/'), { waitUntil: 'domcontentloaded' });
        await action(page);
        assert.deepEqual(errors, [], name);
        count++;
      } catch (error) {
        throw new Error(`${name}: ${error.message}; page errors: ${JSON.stringify(errors)}`, { cause: error });
      } finally { await context.close(); }
    }
    const open = async page => {
      await page.locator('#open-report').click();
      await page.waitForFunction(() => document.querySelector('#clock').textContent !== '00:00:00', null, { timeout: 2500 });
      assert.ok(await page.locator('body').evaluate(body => body.classList.contains('report-open')));
    };

    await check('ordinary playback and pause', {}, async page => {
      await open(page); await page.locator('#pause-run').click();
      const clock = await page.locator('#clock').textContent();
      await page.waitForTimeout(120);
      assert.equal(await page.locator('#clock').textContent(), clock);
    });
    for (const audio of ['throws', 'missing', 'rejects']) {
      for (const german of [false, true]) {
        await check(`silent recovery: ${audio}, german=${german}`, { audio, german, mobile: german }, async page => {
          await open(page);
          await page.waitForFunction(() => document.querySelector('#toggle-sound').getAttribute('aria-pressed') === 'false');
          await page.locator('#pause-run').click(); await page.locator('#pause-run').click();
          await page.locator('#toggle-sound').click();
          assert.equal(await page.locator('#toggle-sound').getAttribute('aria-pressed'), 'false');
        });
      }
    }
    const invalid = [null, [], { started: true, time: 'bad', soundOn: true },
      { started: true, time: {}, soundOn: true }, { started: true, time: -1, soundOn: true },
      { started: true, time: 400, soundOn: true }, { started: true, time: 50, savedAt: null, soundOn: true },
      { started: true, time: 50, soundOn: 'yes' }, { started: 'yes', time: 50, soundOn: true }];
    for (const handoff of invalid) await check('invalid language handoff', { handoff }, async page => {
      assert.equal(await page.locator('body').evaluate(body => body.classList.contains('report-open')), false);
      assert.equal(await page.locator('#clock').textContent(), '00:00:00');
      assert.equal(await page.evaluate(() => sessionStorage.getItem('non-serviam-language-state')), null);
      await open(page);
    });
    for (const age of [-1000, 31000]) await check('handoff outside freshness window',
      { age, handoff: { started: true, time: 50, soundOn: true } }, async page => {
        assert.equal(await page.locator('body').evaluate(body => body.classList.contains('report-open')), false);
      });
    await check('real language navigation preserves paused time and mute choice',
      { handoff: { started: true, time: 82, soundOn: false } }, async page => {
        await page.waitForFunction(() => document.querySelector('#clock').textContent !== '00:00:00');
        const before = await page.locator('#clock').textContent();
        await page.locator('[data-language-link]').click();
        await page.waitForURL('**/de.html');
        await page.waitForFunction(() => document.querySelector('#clock').textContent !== '00:00:00');
        assert.equal(await page.locator('#clock').textContent(), before);
        assert.equal(await page.locator('#toggle-sound').getAttribute('aria-pressed'), 'false');
        assert.ok(await page.locator('#protocol').textContent());
        await page.waitForTimeout(120);
        assert.equal(await page.locator('#clock').textContent(), before);
      });
    await check('unavailable session storage still allows entry', { storage: 'blocked' }, open);
    await check('ended report cannot restart its sound bed',
      { handoff: { started: true, time: 345, soundOn: true } }, async page => {
        assert.ok(await page.locator('body').evaluate(body => body.classList.contains('report-ended')));
        assert.equal(await page.locator('#pause-run').isDisabled(), true);
        assert.equal(await page.locator('#toggle-sound').isDisabled(), true);
        await page.keyboard.press('m');
        assert.equal(await page.locator('#toggle-sound').isDisabled(), true);
      });
    console.log(`${count} NON SERVIAM browser cases passed.`);
  } finally {
    if (browser) await browser.close();
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
