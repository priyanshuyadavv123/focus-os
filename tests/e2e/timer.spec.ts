import { test, expect } from '@playwright/test';

test.describe('P2 Timer Engine & UI E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('starts a focus session, pauses, resumes, and ends early', async ({ page }) => {
    await page.goto('/#/timer');

    // Start 25-minute focus session
    const startButton = page.getByRole('button', { name: 'Start Session' });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Verify FocusScreen is rendered
    await expect(page.locator('p[aria-live="polite"]', { hasText: 'FOCUS' })).toBeVisible();
    await expect(page.locator('text=Deep Work Session')).toBeVisible();
    await expect(page.locator('text=25:00')).toBeVisible();

    // Pause timer
    const pauseButton = page.getByRole('button', { name: 'Pause' });
    await pauseButton.click();
    await expect(page.locator('text=Paused')).toBeVisible();

    // Resume timer
    const resumeButton = page.getByRole('button', { name: 'Resume' });
    await resumeButton.click();
    await expect(page.locator('text=Running')).toBeVisible();

    // End session early
    const endButton = page.getByRole('button', { name: 'End', exact: true });
    await endButton.click();

    // Confirmation modal opens
    await expect(page.locator('text=End session early?')).toBeVisible();
    const confirmButton = page.getByRole('button', { name: 'Confirm' });
    await confirmButton.click();

    // Returned to idle preset screen
    await expect(page.getByRole('button', { name: 'Start Session' })).toBeVisible();
  });

  test('displays mini timer bar on other pages while session is active', async ({ page }) => {
    await page.goto('/#/timer');
    await page.getByRole('button', { name: 'Start Session' }).click();

    // Navigate to Overview
    await page.goto('/#/overview');

    // Mini timer bar is visible
    const miniBar = page.locator('aside[aria-label="Active session banner"]');
    await expect(miniBar).toBeVisible();
    await expect(miniBar.getByText('FOCUS', { exact: true })).toBeVisible();

    // Quick open back to timer
    await miniBar.getByRole('link', { name: 'Open Timer' }).click();
    await expect(page.locator('text=Deep Work Session')).toBeVisible();
  });

  test('recovers active session across page reload', async ({ page }) => {
    await page.goto('/#/timer');
    await page.getByRole('button', { name: 'Start Session' }).click();
    await expect(page.locator('text=Deep Work Session')).toBeVisible();

    // Reload page
    await page.reload();

    // Should resume session without losing state
    await expect(page.locator('text=Deep Work Session')).toBeVisible();
    await expect(page.locator('p[aria-live="polite"]', { hasText: 'FOCUS' })).toBeVisible();
  });

  test('prompts completion when deadline passed while app was closed', async ({ page }) => {
    await page.goto('/');

    // Simulate session created in the past that passed while closed
    await page.evaluate(() => {
      const pastStart = Date.now() - 30 * 60 * 1000;
      const pastEndsAt = pastStart + 25 * 60 * 1000; // 5 mins ago
      const expiredSession = {
        sessionId: 'simulated_past_session',
        taskId: null,
        taskTitle: 'Expired Session',
        kind: 'focus',
        status: 'running',
        plannedSeconds: 1500,
        endsAt: pastEndsAt,
        remainingMs: 0,
        lastSeenAt: pastStart + 15 * 60 * 1000, // heartbeats stopped at 15m
        segments: [],
        currentSegmentStart: pastStart,
        completedRecorded: false,
        focusCount: 0,
        reopenNeedsConfirmation: false,
        reopenCreditedMs: 0,
      };
      localStorage.setItem('focus_os_active_session', JSON.stringify(expiredSession));
    });

    await page.goto('/#/timer');
    await page.reload();

    // Alert notice appears asking for confirmation
    await expect(
      page.locator('text=This session finished while FOCUS OS was closed. Did you complete it?')
    ).toBeVisible();

    // Confirm as completed
    await page.getByRole('button', { name: 'Yes, mark completed' }).click();
    await expect(page.getByRole('button', { name: 'Start Session' })).toBeVisible();
  });
});
