import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

test('Moyu branding uses the original fish logo on every page', async ({ page, request }) => {
  const logo = await request.get('/logo.png');
  expect(logo.ok()).toBe(true);
  expect(createHash('sha256').update(await logo.body()).digest('hex')).toBe('344cbccdc3891ce61e7a79382c17e7ae69c6bc3aae11a4bed43c36e4a04f7adb');
  for (const route of ['/', '/about/', '/works/seasons-planet/']) {
    await page.goto(route);
    await expect(page).toHaveTitle(/摸鱼工坊/);
    await expect(page.getByRole('link', { name: '摸鱼工坊首页' })).toBeVisible();
    await expect(page.locator('.footer-name')).toContainText('摸鱼工坊');
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/logo.png');
    expect(await page.locator('.brand-logo').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 256)).toBe(true);
    await expect(page.locator('body')).not.toContainText('造物手记');
  }
});

test('gallery filters are functional and recoverable', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.work-card:visible')).toHaveCount(3);
  await page.getByRole('button', { name: '叙事动画' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  await expect(page.locator('.work-card:visible')).toContainText('雨停之前');
  await page.getByRole('button', { name: '交互世界' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(2);
  await page.getByRole('button', { name: '全部作品' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(3);
});

test('every work has a real cover, demo, source and a labelled prompt', async ({ page, request }) => {
  for (const slug of ['seasons-planet', 'golden-gate', 'rain-platform']) {
    await page.goto(`/works/${slug}/`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.prompt-disclaimer')).toContainText('不是当时的原始输入');
    expect(await page.locator('.detail-visual img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    for (const path of [`/demos/${slug}/index.html`, `/downloads/${slug}.html`, `/downloads/${slug}-prompt.md`]) {
      expect((await request.get(path)).ok()).toBe(true);
    }
    await page.getByRole('button', { name: '复制提示词' }).click();
    await expect(page.locator('[data-copy-status]')).toContainText('已复制');
  }
});

test('copy failure offers a usable fallback', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true }));
  await page.goto('/works/rain-platform/');
  await page.getByRole('button', { name: '复制提示词' }).click();
  await expect(page.locator('[data-copy-status]')).toContainText('下载 Markdown');
});

test('mobile pages fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/works/seasons-planet/', '/works/rain-platform/', '/about/']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('homepage loads no 3D canvas or third-party assets', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4321') && !request.url().startsWith('data:')) external.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('canvas, iframe')).toHaveCount(0);
  expect(external).toEqual([]);
});
