import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('P1 Baseline E2E & Accessibility', () => {
  test('loads app with h1 and no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/#/overview');
    const heading = page.locator('h1');
    await expect(heading).toHaveText('Overview');
    expect(consoleErrors).toEqual([]);
  });

  test('passes axe accessibility scan with zero serious or critical violations', async ({ page }) => {
    await page.goto('/#/overview');
    await page.waitForTimeout(400); // Wait for view animation to complete
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toEqual([]);
  });
});
