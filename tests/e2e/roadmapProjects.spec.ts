import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('P4 Roadmap & Projects E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('navigates through 8 semesters and toggles milestone completion criteria', async ({ page }) => {
    await page.goto('/#/roadmap');

    // Verify header
    await expect(page.locator('h1')).toHaveText('Learning Roadmap');

    // Verify semester pills
    for (let i = 1; i <= 8; i++) {
      await expect(page.getByRole('button', { name: new RegExp(`Sem ${i}`) })).toBeVisible();
    }

    // Toggle criteria on Python Fundamentals
    const criteriaCheckbox = page.getByRole('checkbox', {
      name: 'Build 3 terminal CLI programs',
    });
    await expect(criteriaCheckbox).toBeVisible();
    await criteriaCheckbox.check();
    await expect(criteriaCheckbox).toBeChecked();

    // Reload page to verify persistence
    await page.reload();
    const reloadedCheckbox = page.getByRole('checkbox', {
      name: 'Build 3 terminal CLI programs',
    });
    await expect(reloadedCheckbox).toBeChecked();
  });

  test('displays 5 initial projects and switches to Hermes Improvement Board', async ({ page }) => {
    await page.goto('/#/projects');

    // Heading
    await expect(page.locator('h1')).toHaveText('Projects');

    // 5 Initial projects
    await expect(page.getByRole('heading', { name: 'NOVA', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hermes', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Python Fundamentals', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lead Tracker', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Research Notebook', exact: true })).toBeVisible();

    // Verify external link rel="noopener noreferrer"
    const githubLink = page.getByRole('link', { name: 'GitHub Repository ↗' });
    await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

    // Switch to Hermes Board
    const hermesTab = page.getByRole('button', { name: /Hermes Board/ });
    await hermesTab.click();

    await expect(page.locator('text=Hermes Improvement Board')).toBeVisible();
    await expect(page.locator('text=[fact] Observed 3 hang events')).toBeVisible();
  });

  test('passes axe accessibility audit on Roadmap and Projects views', async ({ page }) => {
    await page.goto('/#/roadmap');
    await page.waitForTimeout(400);
    let scan = await new AxeBuilder({ page }).analyze();
    let seriousOrCritical = scan.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toEqual([]);

    await page.goto('/#/projects');
    await page.waitForTimeout(400);
    scan = await new AxeBuilder({ page }).analyze();
    seriousOrCritical = scan.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toEqual([]);
  });
});
