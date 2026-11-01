import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
const base = (process.env.BASE_PATH || '').replace(/\/$/, '');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const failures = [];
await mkdir('test-results', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  const home = `${origin}${base}/`;
  await page.goto(home);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map(image => image.decode()));
  });
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true, animations: 'disabled' });
  await page.screenshot({ path: 'test-results/home-preview.png', animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(home);
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true, animations: 'disabled' });
  await page.locator('a.work-image').first().click();
  if (!page.url().includes(`${base}/works/seasons-planet/`)) throw new Error('Incorrect detail page base path');
  const demo = await page.getByRole('link', { name: '打开交互演示' }).getAttribute('href');
  if (!demo?.startsWith(`${base}/demos/`)) throw new Error('Incorrect demo base path');
  await page.goto(new URL(demo, origin).href);
  await page.waitForSelector('#loader.done', { state: 'attached' });
  await page.waitForTimeout(1000);
  if (failures.length) throw new Error(failures.join('\n'));
  console.log(`Verified homepage, detail link and real WebGL loading under ${home}; no HTTP or runtime errors.`);
} finally { await browser.close(); }
