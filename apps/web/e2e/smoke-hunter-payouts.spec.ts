import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Smoke Test 3 — Hunter (Participant): /settings/payouts loads with form + history
 *
 * Tags: @smoke
 *
 * Prereqs (see apps/web/e2e/README.md):
 *   - API running on :3001, web running on :3000
 *   - Demo seed has participant@demo.com (PARTICIPANT)
 */
test.describe('@smoke Hunter — /settings/payouts renders form + history', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'participant');
  });

  test('payout banking form and payout history table/empty-state are visible', async ({ page }) => {
    await page.goto('/settings/payouts');

    // Page header
    await expect(page.getByRole('heading', { name: /payout banking/i })).toBeVisible({ timeout: 15_000 });

    // Form fields — labels are the stable anchor (ids may change).
    await expect(page.getByLabel(/account holder name/i)).toBeVisible();
    await expect(page.getByLabel(/^bank$/i)).toBeVisible();
    await expect(page.getByLabel(/account number/i)).toBeVisible();
    await expect(page.getByLabel(/account type/i)).toBeVisible();

    // Save button is present (disabled when form is empty — that's fine, we don't submit)
    await expect(page.getByRole('button', { name: /save banking details/i })).toBeVisible();

    // Payout history section: either the DataTable renders or the EmptyState appears.
    await expect(page.getByRole('heading', { name: /payout history/i })).toBeVisible();

    // Wait for the history query to settle.
    await page.waitForTimeout(2_000);

    const hasTable = (await page.getByRole('table').count()) > 0;
    const hasEmptyState = await page
      .getByText(/no payouts yet/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });
});
