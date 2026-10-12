import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('P7 Security, CSP, Accessibility & Responsive Audits', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Security: verifies Content-Security-Policy meta tag has all required strict directives', async ({ page }) => {
    const cspMeta = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(cspMeta).toHaveCount(1);

    const content = await cspMeta.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content).toContain("default-src 'self'");
    expect(content).toContain("script-src 'self'");
    expect(content).toContain("style-src 'self'");
    expect(content).toContain("img-src 'self' data:");
    expect(content).toContain("connect-src 'self'");
    expect(content).toContain("object-src 'none'");
    expect(content).toContain("base-uri 'none'");
  });

  test('Responsive: adapts cleanly across 320px, 390px, 768px, 1024px, and 1440px with zero horizontal scroll overflow', async ({ page }) => {
    const viewports = [
      { width: 320, height: 600, name: '320px ultra-mobile' },
      { width: 390, height: 844, name: '390px modern smartphone' },
      { width: 768, height: 1024, name: '768px tablet portrait' },
      { width: 1024, height: 768, name: '1024px desktop breakpoint' },
      { width: 1440, height: 900, name: '1440px widescreen display' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/#/overview');
      await page.waitForTimeout(350);

      // Verify no horizontal document overflow
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);

      if (vp.width >= 1024) {
        // Desktop sidebar must be visible
        await expect(page.locator('.sidebar')).toBeVisible();
      } else {
        // Mobile bottom nav must be visible
        await expect(page.locator('.mobile-bottom-bar')).toBeVisible();
      }
    }
  });

  test('Zoom: handles 200% zoom scaling without breaking layout', async ({ page }) => {
    // 200% zoom on a standard 1280x800 desktop effectively presents a 640x400 CSS viewport
    await page.setViewportSize({ width: 640, height: 400 });
    await page.goto('/#/overview');
    await page.waitForTimeout(350);

    // Verify h1 remains visible and readable
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);
  });

  test('Accessibility: axe audit on all views at mobile (390px) and desktop (1280px)', async ({ page }) => {
    const routes = [
      '/#/overview',
      '/#/timer',
      '/#/roadmap',
      '/#/projects',
      '/#/revenue',
      '/#/research',
      '/#/analytics',
      '/#/settings',
      '/#/non-existent-route',
    ];

    for (const route of routes) {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(route);
      await page.waitForTimeout(350);

      const scanDesktop = await new AxeBuilder({ page }).analyze();
      const violationsDesktop = scanDesktop.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(violationsDesktop).toEqual([]);

      // Test mobile
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(350);

      const scanMobile = await new AxeBuilder({ page }).analyze();
      const violationsMobile = scanMobile.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(violationsMobile).toEqual([]);
    }
  });
});
