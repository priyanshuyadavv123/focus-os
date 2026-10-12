import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('P6 Analytics & Settings E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('Analytics: shows threshold warning on empty data and records weekly review', async ({ page }) => {
    await page.goto('/#/analytics');
    await page.waitForTimeout(400);

    // Verify heading
    await expect(page.locator('h1')).toHaveText('Analytics');

    // Baseline threshold warning
    await expect(page.getByText('Not enough data yet. Under three days of data.')).toBeVisible();

    // Start Weekly Review
    await page.getByRole('button', { name: 'New Weekly Review' }).click();

    // Fill weekly review form
    await page.getByPlaceholder('List completed coursework algorithms, client fixes, or reading...').fill('Completed Python CLI assignment and 3 focus blocks');
    await page.getByPlaceholder('Core programming concepts or experimental insights...').fill('Learned dictionary indexing and nested loops in Python');
    await page.getByPlaceholder('Landing page deployed, CLI pushed to git, etc...').fill('Shipped local storage parser for research');
    await page.getByPlaceholder('Client feedback, response to outreach draft, or observed refusal...').fill('Clinic confirmed interest in mobile speed test');
    await page.getByPlaceholder('Distractions, unrealistic estimates, or stalled tasks...').fill('Underestimated time for test setup');
    await page.getByPlaceholder('Habits or non-converting activities to discontinue...').fill('Stop browsing without an active focus timer');
    await page.getByPlaceholder('Outcome 1 (e.g. Finish Python chapter 4 CLI exercise)').fill('Complete Python chapters 5 and 6');
    await page.getByPlaceholder('Outcome 2 (e.g. Audit 3 local clinic websites and draft outreach)').fill('Audit 2 dental websites in Model Town');
    await page.getByPlaceholder('Outcome 3 (e.g. Test keyboard accessibility on 5 landing pages)').fill('Run keyboard trap tests on 3 portfolios');

    // Save
    await page.getByRole('button', { name: 'Save Weekly Review' }).click();

    // Verify recorded review card
    await expect(page.getByText('Completed Python CLI assignment and 3 focus blocks')).toBeVisible();
    await expect(page.getByText('Complete Python chapters 5 and 6')).toBeVisible();
    await expect(page.getByText('Audit 2 dental websites in Model Town')).toBeVisible();
  });

  test('Settings: updates preferences, displays export disclosure, and validates import file', async ({ page }) => {
    await page.goto('/#/settings');
    await page.waitForTimeout(400);

    // Verify heading
    await expect(page.locator('h1')).toHaveText('Settings');

    // Update daily budget
    const budgetInput = page.getByLabel('Daily Work Budget');
    await budgetInput.fill('200');
    await page.getByRole('button', { name: 'Save Preferences' }).click();
    await expect(page.getByText('Settings saved.')).toBeVisible();

    // Export disclosure test
    await page.getByRole('button', { name: 'Export Backup File' }).click();
    await expect(page.getByText('Warning: Personal Data Disclosure')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm & Download Backup JSON' })).toBeVisible();

    // Test import with a valid backup payload
    const validBackupData = {
      schemaVersion: 1,
      tasks: [
        {
          id: 'imp_task_1',
          title: 'Imported Test Task',
          area: 'engineering',
          plannedMinutes: 50,
          scheduledDate: '2026-10-12',
          priority: 1,
          status: 'todo',
          createdAt: '',
          updatedAt: '',
        },
      ],
      sessions: [],
      projects: [],
      prospects: [],
      revenueEntries: [],
      milestones: [],
      researchNotes: [],
      hermesItems: [],
      weeklyReviews: [],
      settings: {
        dailyBudgetMinutes: 180,
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        longBreakEvery: 4,
        soundOn: false,
        notificationsOn: false,
        showClock: false,
      },
    };

    // Upload via file chooser buffer
    await page.setInputFiles('input[type="file"]', {
      name: 'focus-os-test-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(validBackupData, null, 2)),
    });

    // Verification summary should appear with record counts
    await expect(page.getByText('Backup File Verified')).toBeVisible();
    await expect(page.getByText('Tasks: 1')).toBeVisible();

    // Confirm import
    await page.getByRole('button', { name: 'Confirm Import & Overwrite' }).click();
    await expect(page.getByText('Import Succeeded:')).toBeVisible();
  });

  test('passes axe accessibility audit on Analytics and Settings views', async ({ page }) => {
    await page.goto('/#/analytics');
    await page.waitForTimeout(400);
    let scan = await new AxeBuilder({ page }).analyze();
    let seriousOrCritical = scan.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toEqual([]);

    await page.goto('/#/settings');
    await page.waitForTimeout(400);
    scan = await new AxeBuilder({ page }).analyze();
    seriousOrCritical = scan.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toEqual([]);
  });
});
