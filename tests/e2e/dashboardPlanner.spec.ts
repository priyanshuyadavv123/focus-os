import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('P3 Dashboard & Planner E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('renders greeting without emoji, budget bar, and planner templates', async ({ page }) => {
    await page.goto('/#/overview');

    // Greeting contains date and no emoji
    const title = page.locator('h1');
    await expect(title).toHaveText('Overview');
    const subtitle = page.locator('.view-subtitle');
    await expect(subtitle).toBeVisible();
    const subtitleText = await subtitle.textContent();
    // Verify no emoji characters
    expect(subtitleText).not.toMatch(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/u);

    // Daily budget bar
    await expect(page.locator('text=Daily Work Budget')).toBeVisible();

    // Planner template buttons
    const defaultBtn = page.getByRole('button', { name: 'default' });
    const examBtn = page.getByRole('button', { name: 'exam' });
    const weekendBtn = page.getByRole('button', { name: 'weekend' });

    await expect(defaultBtn).toBeVisible();
    await expect(examBtn).toBeVisible();
    await expect(weekendBtn).toBeVisible();

    // Click Exam template and verify timeline blocks
    await examBtn.click();
    await expect(page.locator('text=Exam & Academic Prep')).toBeVisible();

    // Click Weekend template
    await weekendBtn.click();
    await expect(page.locator('text=Deep Project Sprint')).toBeVisible();
  });

  test('adds a task, verifies Next Best Action rule matching, and starts focus session', async ({ page }) => {
    await page.goto('/#/overview');

    // Click Add Task
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Fill form
    await page.getByLabel('New task title').fill('Solve Python Loop Exercises');
    await page.getByRole('button', { name: 'Save Task' }).click();

    // Task appears in list
    const taskItem = page
      .getByRole('region', { name: "Today's Tasks" })
      .getByText('Solve Python Loop Exercises');
    await expect(taskItem).toBeVisible();

    // Next Best Action card picks it up with Rule 6 explanation
    await expect(page.locator('text=NEXT BEST ACTION')).toBeVisible();
    await expect(page.locator('text=Matched rule 6')).toBeVisible();

    // Click Start Session directly from the task
    const startFromTask = page.getByRole('button', { name: 'Start', exact: true });
    await startFromTask.click();

    // Redirected to timer view and FocusScreen running
    await expect(page).toHaveURL(/#\/timer/);
    await expect(
      page.getByRole('heading', { name: 'Solve Python Loop Exercises' })
    ).toBeVisible();
  });

  test('passes axe accessibility audit on dashboard with zero serious/critical violations', async ({ page }) => {
    await page.goto('/#/overview');
    await page.waitForTimeout(400); // Allow animation to settle
    const scan = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = scan.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toEqual([]);
  });
});
