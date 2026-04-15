import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Smoke Test — Super Admin: Finance group drill-down
 *
 * Tags: @smoke
 *
 * Prereqs (see apps/web/e2e/README.md):
 *   - API running on :3001, web running on :3000
 *   - Demo seed has superadmin@demo.com
 *   - Redis running (OTP login seeded via helpers.ts)
 *
 * Flow:
 *   1. Log in as Super Admin.
 *   2. Navigate to /admin/finance.
 *   3. Locate the "Recent transaction groups" DataTable.
 *   4. If empty (possible on fresh seed), SKIP with a clear reason — don't fail.
 *   5. Click the first row.
 *   6. Assert navigation to /admin/finance/groups/<uuid>.
 *   7. Assert the group ID (from the URL) is rendered somewhere on the detail page.
 *
 * Backend-8 is landing GET /admin/finance/groups/:transactionGroupId and
 * frontend-8 is wiring /admin/finance/groups/[id]. If either is missing when
 * this runs, the navigation / content assertion will surface the gap clearly —
 * Team Lead gates merge on their completion.
 */
test.describe('@smoke Super Admin — Finance transaction group drill-down', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('clicking a Recent transaction group row navigates to its detail page', async ({ page }) => {
    await page.goto('/admin/finance');

    // Wait for the overview heading so we know the page has mounted.
    await expect(page.getByRole('heading', { name: /finance overview/i })).toBeVisible({
      timeout: 15_000,
    });

    // Let the "Recent transaction groups" query settle. The overview page has
    // two DataTables (balances + recent groups); we target the recent-groups
    // one via its section heading.
    const recentGroupsHeading = page.getByRole('heading', { name: /recent transaction groups/i });
    await expect(recentGroupsHeading).toBeVisible({ timeout: 15_000 });

    // Give the DataTable time to resolve loading state.
    await page.waitForTimeout(2_500);

    // Find the recent-groups table. PrimeReact DataTable renders <table> with
    // <tbody><tr> rows. We scope to the section containing the heading.
    const recentGroupsSection = page
      .locator('section, div')
      .filter({ has: recentGroupsHeading })
      .first();

    // Count data rows (exclude header). PrimeReact data rows sit in tbody.
    const rows = recentGroupsSection.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      test.skip(
        true,
        'No recent transaction groups in the DB — nothing to drill into. ' +
          'Re-run after seeding ledger fixtures or after any bounty funding flow.',
      );
      return;
    }

    // Click the first data row. PrimeReact DataTable with selectionMode="single"
    // triggers row-select on click; the page is expected to navigate via router.push.
    await rows.first().click();

    // Assert URL matches /admin/finance/groups/<uuid-ish>. We allow any non-empty
    // path segment after /groups/ so the test stays resilient to ID format (UUID,
    // cuid, etc.). The presence of SOME id is the contract.
    await page.waitForURL(/\/admin\/finance\/groups\/[^/?#]+/, { timeout: 10_000 });

    const match = page.url().match(/\/admin\/finance\/groups\/([^/?#]+)/);
    expect(match, 'URL should contain /admin/finance/groups/<id>').not.toBeNull();
    const groupId = match![1];
    expect(groupId.length).toBeGreaterThan(0);

    // The detail page must render the group ID somewhere in the content — this
    // is the contract we're smoke-testing (frontend-8 renders it, backend-8
    // returns it). We accept the full ID or any reasonable prefix (first 8
    // chars) since some UIs render a truncated form.
    const idPrefix = groupId.slice(0, 8);
    await expect(
      page.getByText(new RegExp(idPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
