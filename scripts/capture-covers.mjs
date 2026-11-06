import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
await mkdir('public/covers', { recursive: true });
try {
  for (const slug of process.argv.slice(2).length ? process.argv.slice(2) : ['seasons-planet', 'golden-gate', 'rain-platform', 'tearable-boarding-pass', 'sr71-blackbird', 'rainy-konbini']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (slug === 'seasons-planet') {
      // Wider camera framing for the cover only; archived demo stays untouched.
      await page.route('**/demos/seasons-planet/index.html', async route => {
        const response = await route.fetch();
        const html = (await response.text()).replace('dist: 26, distTarget: 4.6', 'dist: 38, distTarget: 38');
        await route.fulfill({ response, body: html });
      });
    }
    await page.goto(`${origin}/demos/${slug}/index.html${slug === 'rain-platform' ? '?t=4.5' : ''}`);
    if (slug === 'seasons-planet') {
      await page.waitForSelector('#loader.done', { timeout: 90000, state: 'attached' });
      await page.waitForTimeout(3500);
      await page.addStyleTag({ content: '.hud,#loader{display:none!important}' });
    } else if (slug === 'golden-gate') {
      await page.waitForFunction(() => document.querySelector('canvas') && (!document.querySelector('#loading') || document.querySelector('#loading')?.style.opacity === '0'), { timeout: 90000 });
      await page.waitForTimeout(2000);
      await page.addStyleTag({ content: '#panel,#stats,#hint,#toggle,#loading{display:none!important}' });
    } else if (slug === 'tearable-boarding-pass') {
      await page.locator('.stub').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1000);
      // Only the captured image hides the editor; the published demo keeps it.
      await page.addStyleTag({ content: '.dialkit-root{display:none!important}' });
    } else if (slug === 'sr71-blackbird') {
      // Let the opening camera move finish before capturing.
      await page.waitForTimeout(5000);
      await page.addStyleTag({ content: '#hotspots,.hint,.bar,.src-btn{display:none!important}' });
      await page.waitForTimeout(300);
    } else if (slug === 'izakaya-yozakura') {
      await page.waitForFunction(() => !!window.__ctx);
      await page.addStyleTag({ content: '#title,#panel,#hint,#tip,#toast{display:none!important}' });
      await page.waitForTimeout(1000);
    } else if (slug === 'rainy-konbini') {
      // Wait for shaders, static shadows and reflections to settle.
      await page.waitForTimeout(4000);
    } else { await page.waitForTimeout(1000); }
    if (errors.length) throw new Error(`${slug}: ${errors.join('; ')}`);
    await page.screenshot({ path: `public/covers/${slug}.jpg`, type: 'jpeg', quality: 90 });
    console.log(`Captured real demo: ${slug}`);
    await page.close();
  }
} finally { await browser.close(); }
