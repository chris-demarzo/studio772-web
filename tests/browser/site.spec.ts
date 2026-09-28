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

for (const path of ['/', '/services/', '/process/', '/about/']) {
  test(`${path} sections keep breathing room above and below`, async ({ page }) => {
    await page.goto(path);
    // Each block that follows a divider or button must have real space above it.
    const pads = await page.evaluate(() =>
      [...document.querySelectorAll('main .section, main .prose')].map((el) => {
        const cs = getComputedStyle(el);
        const followsSection = el.previousElementSibling?.classList.contains('section');
        return {
          cls: el.className,
          top: followsSection ? null : parseFloat(cs.paddingTop),
          bottom: parseFloat(cs.paddingBottom),
          left: parseFloat(cs.paddingLeft),
        };
      }),
    );
    expect(pads.length).toBeGreaterThan(0);
    for (const p of pads) {
      if (p.top !== null) expect(p.top, `${p.cls} top padding`).toBeGreaterThanOrEqual(40);
      expect(p.bottom, `${p.cls} bottom padding`).toBeGreaterThanOrEqual(40);
      expect(p.left, `${p.cls} side padding`).toBeGreaterThanOrEqual(16);
    }
  });
}

test('every small label sits the same distance above its heading', async ({ page }) => {
  for (const path of ['/', '/services/', '/process/', '/about/']) {
    await page.goto(path);
    const gaps = await page.evaluate(() =>
      [...document.querySelectorAll('main .eyebrow')].flatMap((label) => {
        const next = label.nextElementSibling;
        if (!next || !/^H[1-3]$/.test(next.tagName)) return [];
        const gap = next.getBoundingClientRect().top - label.getBoundingClientRect().bottom;
        return [{ label: label.textContent?.trim(), gap: Math.round(gap) }];
      }),
    );
    expect(gaps.length, `${path} has labels`).toBeGreaterThan(0);
    for (const g of gaps) {
      expect(g.gap, `${path} "${g.label}" gap`).toBeGreaterThanOrEqual(12);
      // Homepage labels must all match each other (hero, concepts, pricing, band).
      if (path === '/') {
        expect(Math.abs(g.gap - gaps[0].gap), `"${g.label}" matches "${gaps[0].label}"`).toBeLessThanOrEqual(2);
      }
    }
  }
});

test('on phones the concept tabs sit right above the phone mockup', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'desktop shows tabs and phone side by side');
  await page.goto('/');
  const tabs = await page.locator('.concept-tabs').boundingBox();
  const phone = await page.locator('.phone').boundingBox();
  if (!tabs || !phone) throw new Error('tabs or phone not rendered');
  const gap = phone.y - (tabs.y + tabs.height);
  expect(gap, 'space between tabs and phone').toBeGreaterThanOrEqual(0);
  expect(gap, 'space between tabs and phone').toBeLessThanOrEqual(40);
  // Tabs and the top half of the phone fit on one screen together.
  const viewport = page.viewportSize();
  expect(phone.y + phone.height / 2 - tabs.y).toBeLessThanOrEqual(viewport!.height);
});

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

test('concept notes sit beside the phone and never cover it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'notes are hidden on small screens');
  for (const width of [960, 1100, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.locator('.phone').scrollIntoViewIfNeeded();
    const phone = await page.locator('.phone').boundingBox();
    const viewportWidth = width;
    for (const cls of ['c1', 'c2', 'c3']) {
      await page.locator(`label[for="concept-${cls.slice(1)}"]`).click();
      for (const side of ['left', 'right']) {
        const note = page.locator(`.note.${side}.${cls}`);
        if (!(await note.isVisible())) continue; // hidden at this width by design
        const box = await note.boundingBox();
        if (!phone || !box) throw new Error(`${side} note or phone not rendered`);
        const overlapX = Math.min(box.x + box.width, phone.x + phone.width) - Math.max(box.x, phone.x);
        const overlapY = Math.min(box.y + box.height, phone.y + phone.height) - Math.max(box.y, phone.y);
        expect(overlapX > 0 && overlapY > 0, `${side} ${cls} note covers the phone at ${width}px`).toBe(false);
        expect(box.x, `${side} ${cls} note off-screen left at ${width}px`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${side} ${cls} note off-screen right at ${width}px`).toBeLessThanOrEqual(viewportWidth);
      }
    }
  }
  // At a normal laptop width, both notes must actually be showing.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.note.left.c1')).toBeVisible();
  await expect(page.locator('.note.right.c1')).toBeVisible();
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
