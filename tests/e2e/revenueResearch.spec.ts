import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('P5 Revenue Lab & Research Lab E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('Revenue Lab: adds prospect, scores opportunity, copies outreach draft, and records ledger payment', async ({ page }) => {
    await page.goto('/#/revenue');
    await page.waitForTimeout(400);

    // Verify header
    await expect(page.locator('h1')).toHaveText('Revenue Lab');
    await expect(page.getByText('0 / 10 Active Prospects')).toBeVisible();

    // Open add prospect form
    await page.getByRole('button', { name: 'Add Prospect' }).click();

    // Fill form
    await page.getByPlaceholder('Business Name (e.g. Model Town Clinic)').fill('Ludhiana Dental Care');
    await page.getByPlaceholder('Website URL (e.g. https://example.com)').fill('https://ldclinic.example.com');
    await page.getByPlaceholder('Proposed Solution (e.g. Fix mobile viewport and hero load time)').fill('Mobile viewport optimization and hero image compress');
    await page.getByPlaceholder('Observed problem statement').fill('LCP takes 4.2s on mobile 4G');
    await page.getByPlaceholder('Observation Source (e.g. User manual check on Chrome Mobile DevTools)').fill('Manual mobile audit on DevTools');

    // Submit
    await page.getByRole('button', { name: 'Save Prospect' }).click();

    // Verify card rendered
    await expect(page.getByRole('heading', { name: 'Ludhiana Dental Care' })).toBeVisible();
    await expect(page.getByText('1 / 10 Active Prospects')).toBeVisible();

    // Verify opportunity score rendered (with evidence, website, solution, effort <= 6 it should be 100/100)
    await expect(page.getByText('Opportunity:')).toBeVisible();
    await expect(page.getByText('100/100')).toBeVisible();

    // Verify Outreach Draft copy
    await page.getByRole('button', { name: 'Copy Outreach Draft' }).click();
    await expect(page.getByText('Copied Draft!')).toBeVisible();

    // Mark as Sent
    await page.getByRole('button', { name: 'Mark as Sent' }).click();
    await expect(page.getByRole('combobox', { name: 'Prospect stage' })).toHaveValue('contacted');

    // Toggle Unvalidated Packages
    await expect(page.getByText('TIER 1 (HYPOTHESIS)')).not.toBeVisible();
    await page.getByRole('button', { name: 'View Options' }).click();
    await expect(page.getByText('TIER 1 (HYPOTHESIS)')).toBeVisible();
    await page.getByRole('button', { name: 'Hide Options' }).click();
    await expect(page.getByText('TIER 1 (HYPOTHESIS)')).not.toBeVisible();

    // Realized Revenue Ledger: Record payment
    await page.getByRole('button', { name: 'Record Payment' }).click();
    await page.getByPlaceholder('Client Name').fill('Model Town Clinic');
    await page.getByPlaceholder('Service Rendered').fill('Mobile performance boost');
    await page.getByRole('button', { name: 'Save Payment' }).click();

    // Verify ledger row and financial summary
    await expect(page.getByText('Model Town Clinic - Mobile performance boost')).toBeVisible();
    await expect(page.getByRole('cell', { name: '₹2,500' }).first()).toBeVisible();
  });

  test('Research Lab: displays demo topic, clears demo note, creates experimental note, and edits results', async ({ page }) => {
    await page.goto('/#/research');
    await page.waitForTimeout(400);

    // Verify header
    await expect(page.locator('h1')).toHaveText('Research Lab');

    // Demo note should be visible
    await expect(page.getByText('DEMO (SAMPLE)')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'AI-assisted website audits compared with human reviewers' })
    ).toBeVisible();

    // Clear demo note with one action
    await page.getByRole('button', { name: 'Clear Demo Note' }).click();
    await expect(page.getByText('DEMO (SAMPLE)')).not.toBeVisible();
    await expect(page.getByText('No untested ideas recorded.')).toBeVisible();

    // Add new experiment note
    await page.getByRole('button', { name: 'New Research Note' }).click();
    await page.getByPlaceholder('Research Question (e.g. Does manual keyboard testing uncover issues axe misses?)').fill('Evaluation of keyboard navigation versus axe automated audits');
    await page.getByLabel('Status').selectOption('running');
    await page.getByPlaceholder('Hypothesis: What do you expect will happen and why?').fill('Manual tab traversal identifies focus traps that static trees cannot flag.');
    await page.getByPlaceholder('Method: Step-by-step reproducible process').fill('Tab through 10 interactive widgets and log trap occurrences.');
    await page.getByPlaceholder('Observed Results (Entered only by user after testing)').fill('Initial 3 sites tested: 2 focus traps detected manually.');

    await page.getByRole('button', { name: 'Save Research Note' }).click();

    // Verify note is in Experiments list
    await expect(
      page.getByRole('heading', { name: 'Evaluation of keyboard navigation versus axe automated audits' })
    ).toBeVisible();
    await expect(page.getByText('Status: running')).toBeVisible();

    // Edit results inline
    await page.getByRole('button', { name: 'Edit Results' }).click();
    await page.getByPlaceholder('Enter observed reproducible results...').fill('Completed 10 sites: 5 focus traps caught manually, zero caught by static scanner.');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(
      page.getByText('Completed 10 sites: 5 focus traps caught manually, zero caught by static scanner.')
    ).toBeVisible();
  });

  test('passes axe accessibility audit on Revenue and Research views', async ({ page }) => {
    await page.goto('/#/revenue');
    await page.waitForTimeout(400);
    let scan = await new AxeBuilder({ page }).analyze();
    let seriousOrCritical = scan.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toEqual([]);

    await page.goto('/#/research');
    await page.waitForTimeout(400);
    scan = await new AxeBuilder({ page }).analyze();
    seriousOrCritical = scan.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toEqual([]);
  });
});
