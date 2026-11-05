import { chromium } from '@playwright/test';

const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 756 }, deviceScaleFactor: 1 });
  await page.goto(`${origin}/`);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '[data-reveal]{opacity:1!important;transform:none!important}' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'public/og-home.jpg', type: 'jpeg', quality: 88 });
  console.log('Captured homepage share cover: public/og-home.jpg');
} finally { await browser.close(); }
