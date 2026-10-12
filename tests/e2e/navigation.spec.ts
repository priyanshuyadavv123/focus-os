import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  { path: '#/overview', title: 'Overview' },
  { path: '#/timer', title: 'Focus Timer' },
  { path: '#/roadmap', title: 'Learning Roadmap' },
  { path: '#/projects', title: 'Projects' },
  { path: '#/revenue', title: 'Revenue Lab' },
  { path: '#/research', title: 'Research Lab' },
  { path: '#/analytics', title: 'Analytics' },
  { path: '#/settings', title: 'Settings' },
];

test.describe('P1 Shell & Navigation E2E', () => {
  test('navigates through all eight routes with no console errors and single h1', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    for (const route of ROUTES) {
      await page.goto(`/${route.path}`);
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText(route.title);
    }

    expect(consoleErrors).toEqual([]);
  });

  test('displays 404 page on unknown hash route with single h1 and return link', async ({ page }) => {
    await page.goto('/#/invalid-route');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('Page not found');

    const returnLink = page.getByRole('button', { name: 'Return to overview' });
    await returnLink.click();
    await expect(page.locator('h1')).toHaveText('Overview');
  });

  test('adapts layout between desktop sidebar and mobile bottom navigation', async ({ page }) => {
    // Desktop layout (1200px)
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/#/overview');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.mobile-bottom-bar')).toBeHidden();

    // Mobile layout (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.sidebar')).toBeHidden();
    await expect(page.locator('.mobile-bottom-bar')).toBeVisible();
  });

  test('runs axe accessibility audit on views with zero serious or critical violations', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(`/${route.path}`);
      await page.waitForTimeout(400); // Allow view animation to settle
      const scan = await new AxeBuilder({ page }).analyze();
      const seriousOrCritical = scan.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(seriousOrCritical).toEqual([]);
    }
  });
});
