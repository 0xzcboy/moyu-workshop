import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
await mkdir('public/covers', { recursive: true });
try {
  for (const slug of ['seasons-planet', 'golden-gate', 'rain-platform']) {
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
    } else { await page.waitForTimeout(1000); }
    if (errors.length) throw new Error(`${slug}: ${errors.join('; ')}`);
    await page.screenshot({ path: `public/covers/${slug}.jpg`, type: 'jpeg', quality: 90 });
    console.log(`Captured real demo: ${slug}`);
    await page.close();
  }
} finally { await browser.close(); }
