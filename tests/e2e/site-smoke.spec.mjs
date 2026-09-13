import { test, expect } from '@playwright/test';

const isMobileProject = testInfo => testInfo.project.name === 'mobile-chromium';
async function assertNoHorizontalOverflow(page) { expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)).toBe(false); }

test.describe('responsive public shell', () => {
  test('Arabic shell loads without horizontal overflow', async ({ page, browserName }, testInfo) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', /ar/i);
    await expect(page.locator('#site-header')).toBeVisible();
    await expect(page.locator('#bottom-nav')).toBeAttached();
    if (isMobileProject(testInfo)) await expect(page.locator('#bottom-nav-more-btn')).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test('Arabic mobile More sheet opens', async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), 'mobile-only interaction');
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#global-voice-assistant-fab')).toBeVisible();
    await page.locator('#bottom-nav-more-btn').click();
    await expect(page.locator('#mobile-more-sheet')).toHaveClass(/is-open/);
    await assertNoHorizontalOverflow(page);
  });

  test('English mobile shell is LTR and More sheet opens', async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), 'mobile-only interaction');
    await page.goto('/en/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('#global-voice-assistant-fab')).toBeVisible();
    await page.locator('#bottom-nav-more-btn').click();
    await expect(page.locator('#mobile-more-sheet')).toHaveClass(/is-open/);
    await assertNoHorizontalOverflow(page);
  });

  test('PWA manifest and service worker are reachable', async ({ page, request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.ok()).toBeTruthy();
    expect((await manifest.json()).display).toBe('standalone');
    const sw = await request.get('/sw.js');
    expect(sw.ok()).toBeTruthy();
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(async () => (await page.evaluate(() => navigator.serviceWorker?.getRegistrations().then(r => r.length))) || 0).toBeGreaterThan(0);
  });
});
