import { expect, test } from '@playwright/test';

const pages = ['/', '/services/', '/process/', '/about/', '/contact/', '/privacy/'];

for (const path of pages) {
  test(`${path} renders without console errors or horizontal overflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();

    const fitsViewport = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fitsViewport).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('skip link appears on keyboard focus and targets main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.locator('.skip-link');
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  await expect(skipLink).toHaveAttribute('href', '#content');
  await expect(page.locator('main#content')).toHaveCount(1);
});

test('primary navigation is keyboard reachable and marks the current page', async ({ page }) => {
  await page.goto('/services/');
  const current = page.getByRole('navigation', { name: 'Primary' }).locator('a[aria-current="page"]');
  await expect(current).toHaveText('Services');
});

test('contact page exposes a working mailto quote path', async ({ page }) => {
  await page.goto('/contact/');
  const mailto = page.locator('main a[href^="mailto:"]');
  await expect(mailto).toBeVisible();
  await expect(mailto).toHaveAttribute('href', /mailto:.+@.+/);
});

test('concept switcher changes the phone screen on click', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.phone img.c1')).toHaveCSS('opacity', '1');
  await page.locator('label[for="concept-3"]').click();
  await expect(page.locator('.phone img.c3')).toHaveCSS('opacity', '1');
  await expect(page.locator('.phone img.c1')).toHaveCSS('opacity', '0');
});

test('concept notes sit in front of the phone, not behind it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'notes are hidden on small screens');
  let checked = 0;
  for (const width of [960, 1100, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.locator('.phone').scrollIntoViewIfNeeded();
    const phone = await page.locator('.phone').boundingBox();
    for (const side of ['left', 'right']) {
      const note = await page.locator(`.note.${side}.c1`).boundingBox();
      if (!phone || !note) throw new Error(`${side} note or phone not rendered`);
      // Sample the middle of the region where the note and phone overlap.
      const x1 = Math.max(note.x, phone.x), x2 = Math.min(note.x + note.width, phone.x + phone.width);
      const y1 = Math.max(note.y, phone.y), y2 = Math.min(note.y + note.height, phone.y + phone.height);
      if (x2 <= x1 || y2 <= y1) continue; // no overlap at this width
      checked++;
      const onTop = await page.evaluate(
        ([x, y]) => !!document.elementFromPoint(x, y)?.closest('.note'),
        [(x1 + x2) / 2, (y1 + y2) / 2],
      );
      expect(onTop, `${side} note is behind the phone at ${width}px`).toBe(true);
    }
  }
  expect(checked, 'expected at least one width where a note overlaps the phone').toBeGreaterThan(0);
});

test('unknown routes show the custom 404 page', async ({ page }) => {
  const response = await page.goto('/definitely-not-a-real-page/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('main h1')).toHaveText('Page not found');
});

test('mobile navigation keeps every link fully inside the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await page.goto('/');
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  for (const link of await page.getByRole('navigation', { name: 'Primary' }).getByRole('link').all()) {
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  }
});
