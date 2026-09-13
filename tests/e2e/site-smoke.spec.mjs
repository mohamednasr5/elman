import { test, expect } from '@playwright/test';

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflow).toBe(false);
}

test.describe('public responsive shell', () => {
  test('Arabic desktop shell loads', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', /ar/i);
    await expect(page.locator('#site-header')).toBeVisible();
    await expect(page.locator('#bottom-nav')).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test('Arabic mobile shell exposes voice and More controls', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#global-voice-assistant-fab')).toBeVisible();
    await expect(page.locator('#bottom-nav-more-btn')).toBeVisible();
    await page.locator('#bottom-nav-more-btn').click();
    await expect(page.locator('#mobile-more-sheet')).toHaveClass(/is-open/);
    await assertNoHorizontalOverflow(page);
  });

  test('English mobile shell is LTR and keeps responsive controls', async ({ page }) => {
    await page.goto('/en/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('#global-voice-assistant-fab')).toBeVisible();
    await expect(page.locator('#bottom-nav-more-btn')).toBeVisible();
    await page.locator('#bottom-nav-more-btn').click();
    await expect(page.locator('#mobile-more-sheet')).toHaveClass(/is-open/);
    await assertNoHorizontalOverflow(page);
  });

  test('PWA manifest and service worker are reachable', async ({ page, request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.ok()).toBeTruthy();
    const manifestJson = await manifest.json();
    expect(manifestJson.display).toBe('standalone');
    const sw = await request.get('/sw.js');
    expect(sw.ok()).toBeTruthy();
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(async () => (await page.evaluate(() => navigator.serviceWorker?.getRegistrations().then(r => r.length))) || 0).toBeGreaterThan(0);
  });
});
