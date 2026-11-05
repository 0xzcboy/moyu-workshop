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
  await expect(page.locator('.work-card:visible')).toHaveCount(7);
  await page.getByRole('button', { name: '叙事动画' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  await expect(page.locator('.work-card:visible')).toContainText('雨停之前');
  await page.getByRole('button', { name: '交互世界' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(4);
  await page.getByRole('button', { name: '音乐影像' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  await expect(page.locator('.work-card:visible')).toContainText('把回忆拼好给你');
  await expect(page.locator('.work-card:visible .prompt-tag')).toHaveText('作者原始提示词');
  await page.getByRole('button', { name: '交互设计' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  await expect(page.locator('.work-card:visible')).toContainText('可撕拉登机牌');
  await page.getByRole('button', { name: '全部作品' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(7);
});

test('every work has a real cover, demo, source and a labelled prompt', async ({ page, request }) => {
  for (const slug of ['seasons-planet', 'golden-gate', 'rain-platform', 'sr71-blackbird', 'rainy-konbini']) {
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
  for (const route of ['/', '/works/seasons-planet/', '/works/rain-platform/', '/works/memory-pop-up-book/', '/works/tearable-boarding-pass/', '/works/sr71-blackbird/', '/works/rainy-konbini/', '/about/']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('boarding pass has a real cover, project ZIP and honest source instructions', async ({ page, request }) => {
  await page.goto('/works/tearable-boarding-pass/');
  await expect(page.locator('h1')).toHaveText('可撕拉登机牌');
  expect(await page.locator('.detail-visual img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.prompt-disclaimer')).toContainText('不是当时的原始输入');
  await expect(page.getByRole('link', { name: '下载项目源码 ZIP' })).toHaveAttribute('href', '/downloads/tearable-boarding-pass.zip');
  await expect(page.getByRole('link', { name: '下载 HTML 源码' })).toHaveCount(0);
  await expect(page.locator('.project-content')).toContainText('Vite 开发服务');
  for (const path of ['/downloads/tearable-boarding-pass.zip', '/downloads/tearable-boarding-pass-prompt.md', '/demos/tearable-boarding-pass/THIRD_PARTY_LICENSES.txt']) {
    expect((await request.get(path)).ok()).toBe(true);
  }
  const { unzipSync, strFromU8 } = await import('fflate');
  const archive = unzipSync(new Uint8Array(await (await request.get('/downloads/tearable-boarding-pass.zip')).body()));
  expect(strFromU8(archive['tearable-boarding-pass/src/BoardingPass.tsx'])).toContain('onPointerMove');
  expect(archive['tearable-boarding-pass/package-lock.json']).toBeDefined();
  expect(Object.keys(archive).some(path => /node_modules|\.claude|dist\//.test(path))).toBe(false);
});

test('boarding pass supports dragging, keyboard tearing and reattachment without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/demos/tearable-boarding-pass/index.html');
  const stub = page.getByRole('button', { name: 'Boarding pass stub' });
  await expect(stub).toBeVisible();
  await expect(page.locator('#stub-status')).toHaveText('Stub attached');
  await stub.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#stub-status')).toHaveText('Stub 10% torn');
  await page.keyboard.press('Enter');
  await expect(stub).toHaveAttribute('data-free', 'true');
  await page.getByRole('button', { name: 'Reattach', exact: true }).click();
  await expect(page.locator('#stub-status')).toHaveText('Stub attached');
  const box = (await stub.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2 + 60, { steps: 20 });
  await page.mouse.up();
  await expect(stub).toHaveAttribute('data-free', 'true');
  await page.getByRole('button', { name: 'Reattach', exact: true }).click();
  await expect(page.locator('#stub-status')).toHaveText('Stub attached');
  expect(errors).toEqual([]);
});

test('boarding pass fits a touch viewport and works without remote fonts', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.goto('http://127.0.0.1:4321/demos/tearable-boarding-pass/index.html');
  // The original editor overlays the ticket on narrow screens; collapse it first.
  await page.getByRole('button', { name: 'Boarding pass', exact: true }).tap();
  await expect(page.getByRole('slider', { name: 'Swing', exact: true })).not.toBeVisible();
  const stub = page.locator('.stub');
  await expect(stub).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = (await stub.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  const touch = await context.newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let step = 1; step <= 10; step++) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + step * 4, y: y + step * 12 }] });
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(stub).toHaveAttribute('data-free', 'true');
  await expect.poll(() => stub.evaluate(element => {
    const transform = new DOMMatrix(getComputedStyle(element).transform);
    return Math.abs(transform.e - 24) < 0.1 && Math.abs(transform.f - 8) < 0.1;
  })).toBe(true);
  // End Chromium's post-drag tap-suppression window before starting a new tap.
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Reattach', exact: true }).tap();
  await expect(page.locator('#stub-status')).toHaveText('Stub attached');
  await context.close();
});

test('SR-71 runs offline with its modes and offers a standalone HTML download', async ({ page, request }) => {
  await page.goto('/works/sr71-blackbird/');
  await expect(page.locator('h1')).toHaveText('在两万四千米，看黑鸟');
  await expect(page.locator('.project-content')).toContainText('双击即可在浏览器中离线打开');
  await expect(page.locator('.command-block')).toHaveCount(0);
  const source = await request.get('/downloads/sr71-blackbird.html');
  expect(createHash('sha256').update(await source.body()).digest('hex')).toBe('3eb76e95ebddbc0bf3ac41c8c175bd3064a7e2bd191eee0b3929dddb23a732d7');
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', item => { if (!item.url().startsWith('http://127.0.0.1:4321') && !item.url().startsWith('data:')) external.push(item.url()); });
  await page.goto('/demos/sr71-blackbird/index.html');
  await expect(page.locator('canvas#view')).toBeVisible();
  await page.locator('[data-setmode="inlet"]').click();
  await page.locator('#i-mach').fill('3.2');
  await expect(page.locator('#i-travel')).toHaveText('26.0 in');
  await expect(page.locator('#i-beta')).toContainText('23.5');
  await page.locator('[data-setmode="flight"]').click();
  await expect(page.locator('#tdi')).toBeVisible();
  await page.locator('[data-view="cockpit"]').click();
  await expect(page.locator('[data-view="cockpit"]')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('rainy konbini runs with local Three.js and no UI overlay', async ({ page, request }) => {
  const source = await request.get('/downloads/rainy-konbini.html');
  expect(createHash('sha256').update(await source.body()).digest('hex')).toBe('5aaa6ced51ec98b4b7bf2c7218e19c3e03ff43fb4d9d9012dced5dca8d8e0ce9');
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', item => { if (!item.url().startsWith('http://127.0.0.1:4321') && !item.url().startsWith('data:') && !item.url().startsWith('blob:')) external.push(item.url()); });
  await page.goto('/demos/rainy-konbini/index.html');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(page.locator('body > :not(canvas):not(script)')).toHaveCount(0);
  await page.waitForTimeout(1500);
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('homepage loads no 3D canvas or third-party assets', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4321') && !request.url().startsWith('data:')) external.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('canvas, iframe, video')).toHaveCount(0);
  expect(external).toEqual([]);
});
