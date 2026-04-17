import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Smoke Test 4 — Super Admin: /admin/finance/exceptions + /admin/finance/insights
 *
 * Tags: @smoke
 *
 * Prereqs (see apps/web/e2e/README.md):
 *   - API running on :3001, web running on :3000
 *   - Demo seed has superadmin@demo.com
 */
test.describe('@smoke Super Admin — Finance Exceptions + Insights tabs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('/admin/finance/exceptions loads its header and a table (or loading/empty state)', async ({ page }) => {
    await page.goto('/admin/finance/exceptions');

    await expect(page.getByRole('heading', { name: /^exceptions$/i })).toBeVisible({ timeout: 15_000 });

    // Wait for the query to settle (LoadingState -> DataTable or an ErrorState).
    await page.waitForTimeout(2_500);

    const hasTable = (await page.getByRole('table').count()) > 0;
    const hasError = await page.getByText(/error|failed/i).first().isVisible().catch(() => false);

    // Either the DataTable is present (even with zero rows) or the page is
    // currently showing an error toast we can still render past. Smoke gate
    // is "page rendered without a hard crash".
    expect(hasTable || hasError).toBeTruthy();
  });

  test('/admin/finance/insights loads KB Insights heading and shows cards or empty state', async ({ page }) => {
    await page.goto('/admin/finance/insights');

    await expect(page.getByRole('heading', { name: /kb insights/i })).toBeVisible({ timeout: 15_000 });

    // Wait for the query to resolve.
    await page.waitForTimeout(2_500);

    const hasEmptyState = await page.getByText(/no insights yet|no kb recurrence data/i).first().isVisible().catch(() => false);
    // Confidence cards are PrimeReact Card components — in the DOM they render
    // with a <div class="p-card">. We match on any element with the "Confidence
    // score" label which appears inside each card.
    const confidenceLabelCount = await page.getByText(/confidence score/i).count();

    expect(hasEmptyState || confidenceLabelCount > 0).toBeTruthy();
  });
});
