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
  await expect(page.locator('.work-card:visible')).toHaveCount(4);
  await page.getByRole('button', { name: '叙事动画' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  await expect(page.locator('.work-card:visible')).toContainText('雨停之前');
  await page.getByRole('button', { name: '交互世界' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(2);
  await page.getByRole('button', { name: '音乐影像' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  await expect(page.locator('.work-card:visible')).toContainText('把回忆拼好给你');
  await expect(page.locator('.work-card:visible .prompt-tag')).toHaveText('作者原始提示词');
  await page.getByRole('button', { name: '全部作品' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(4);
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

test('MV has playable video and an original prompt, not fabricated source links', async ({ page, request }) => {
  await page.goto('/works/memory-pop-up-book/');
  await expect(page.locator('h1')).toHaveText('把回忆拼好给你');
  const video = page.locator('video');
  await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).toHaveAttribute('controls', '');
  await expect(video).not.toHaveAttribute('autoplay', '');
  await expect(page.locator('.prompt-disclaimer')).toContainText('作者提供的原始提示词');
  await expect(page.locator('[data-prompt]')).toContainText('puppeteer-core');
  await expect(page.getByRole('link', { name: '下载 HTML 源码' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '打开交互演示' })).toHaveCount(0);
  const prompt = await request.get('/downloads/memory-pop-up-book-prompt.md');
  expect(prompt.ok()).toBe(true);
  expect(await prompt.text()).toContain('作者提供的原始提示词');
  await page.getByRole('button', { name: '复制提示词' }).click();
  await expect(page.locator('[data-copy-status]')).toHaveText('已复制作者原始提示词。');
  const result = await video.evaluate(async (element: HTMLVideoElement) => {
    element.muted = true;
    await element.play();
    await new Promise<void>((resolve, reject) => {
      if (element.currentTime > 0) return resolve();
      const timeout = setTimeout(() => reject(new Error('Video did not advance')), 15000);
      element.addEventListener('timeupdate', () => { clearTimeout(timeout); resolve(); }, { once: true });
    });
    element.pause();
    element.currentTime = 190;
    await new Promise<void>(resolve => element.addEventListener('seeked', () => resolve(), { once: true }));
    return { duration: element.duration, width: element.videoWidth, height: element.videoHeight, time: element.currentTime, error: element.error?.message };
  });
  expect(result).toMatchObject({ width: 1280, height: 720, time: 190 });
  expect(result.duration).toBeCloseTo(381, 0);
  expect(result.error).toBeUndefined();
});

test('mobile pages fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/works/seasons-planet/', '/works/rain-platform/', '/works/memory-pop-up-book/', '/about/']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('homepage loads no 3D canvas or third-party assets', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4321') && !request.url().startsWith('data:')) external.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('canvas, iframe, video')).toHaveCount(0);
  expect(external).toEqual([]);
});
