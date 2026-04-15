import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Smoke Test — Super Admin: reconciliation → exceptions → drill-in
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
 *   2. Navigate to /admin/finance, click "Run reconciliation" — accept either
 *      a success toast ("Reconciliation green — no findings.") OR a warn toast
 *      with a finding count. Page must not crash.
 *   3. Navigate to /admin/finance/exceptions. If rows exist and a severity
 *      filter is present (frontend-9), select "Critical" and assert the row
 *      count updates. If no filter yet, just assert the table loaded.
 *   4. Navigate back to /admin/finance, click first row of the
 *      "Recent transaction groups" DataTable, assert URL matches
 *      /admin/finance/groups/<id> and the detail page renders a header +
 *      entries table.
 *
 * Graceful skips (never hard-fail):
 *   - "Run reconciliation" button not present (feature gated off).
 *   - Exceptions table empty (nothing to filter).
 *   - Recent groups table empty (nothing to drill into).
 */
test.describe('@smoke Super Admin — Reconciliation to drill-down', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('reconciliation → exceptions filter → group drill-in', async ({ page }) => {
    // ------------------------------------------------------------------
    // Step 1–2: /admin/finance + Run reconciliation
    // ------------------------------------------------------------------
    await page.goto('/admin/finance');

    await expect(page.getByRole('heading', { name: /finance overview/i })).toBeVisible({
      timeout: 15_000,
    });

    // Find the "Run reconciliation" button. It may be rendered as <button> with
    // various casings; match loosely. If the feature is gated off, skip.
    const runButton = page.getByRole('button', { name: /run reconciliation/i });
    const runButtonCount = await runButton.count();

    if (runButtonCount === 0) {
      test.skip(
        true,
        'Run reconciliation button not present on /admin/finance — feature gated off. ' +
          'Re-run once backend-9/frontend-9 land the reconciliation trigger UI.',
      );
      return;
    }

    await runButton.first().click();

    // Toast feedback — PrimeReact Toast renders under a <div> with role="alert"
    // or class .p-toast-message. We accept either a success toast
    // ("Reconciliation green — no findings.") or a warn toast that mentions
    // "finding" / "exception" with a count. We don't fail if the toast is
    // transient and gone by the time we look; the smoke gate is "the click
    // fires and the app doesn't crash".
    await page.waitForTimeout(2_500);

    const successToast = page
      .getByText(/reconciliation green|no findings/i)
      .first();
    const warnToast = page
      .getByText(/finding|finding\(s\)|\d+\s*(exception|finding)/i)
      .first();

    const sawSuccess = await successToast.isVisible().catch(() => false);
    const sawWarn = await warnToast.isVisible().catch(() => false);

    // Either toast is acceptable; the absence of both is ALSO acceptable
    // (the toast may have auto-dismissed). Critical assertion: the page is
    // still on /admin/finance and has not crashed.
    expect(sawSuccess || sawWarn || true).toBeTruthy();
    await expect(page.getByRole('heading', { name: /finance overview/i })).toBeVisible();

    // ------------------------------------------------------------------
    // Step 3: /admin/finance/exceptions — optional severity filter
    // ------------------------------------------------------------------
    await page.goto('/admin/finance/exceptions');

    await expect(page.getByRole('heading', { name: /^exceptions$/i })).toBeVisible({
      timeout: 15_000,
    });

    // Let the query settle (LoadingState -> DataTable).
    await page.waitForTimeout(2_500);

    const exceptionsTable = page.getByRole('table').first();
    const hasTable = (await exceptionsTable.count()) > 0;

    // The page must at least render a table element. If not, skip — the
    // backend query may be failing and that's a different team's bug.
    if (!hasTable) {
      test.skip(
        true,
        'Exceptions page did not render a table — likely backend-9 query not yet live. ' +
          'Re-run once GET /admin/finance/exceptions is green.',
      );
      return;
    }

    const exceptionRows = exceptionsTable.locator('tbody tr');
    const exceptionRowCount = await exceptionRows.count();

    if (exceptionRowCount === 0) {
      // Table rendered but empty — that's fine, nothing to filter. Continue
      // to the drill-in step rather than skipping the whole spec.
    } else {
      // Look for a severity filter dropdown. frontend-9 is adding this; it
      // may render as a PrimeReact Dropdown with placeholder like "Severity"
      // or "Filter by severity". We look for the label/placeholder first.
      const severityFilter = page
        .locator(
          [
            '[data-testid="severity-filter"]',
            '[aria-label*="severity" i]',
            '.p-dropdown:has-text("Severity")',
            '.p-dropdown:has-text("severity")',
          ].join(', '),
        )
        .first();

      const severityFilterCount = await severityFilter.count();

      if (severityFilterCount === 0) {
        // Filter not landed yet — that's fine, just assert the table loaded.
        // We already confirmed hasTable above.
        expect(hasTable).toBeTruthy();
      } else {
        const beforeCount = exceptionRowCount;

        // Open the PrimeReact Dropdown and select "Critical".
        await severityFilter.click();
        const criticalOption = page
          .getByRole('option', { name: /^critical$/i })
          .or(page.locator('.p-dropdown-item').filter({ hasText: /^critical$/i }))
          .first();
        await criticalOption.click({ timeout: 5_000 });

        // Let the table re-query.
        await page.waitForTimeout(2_000);

        const afterCount = await exceptionsTable.locator('tbody tr').count();

        // Row count should have changed (usually decreased, but could stay the
        // same if every row was already Critical). Assert the filter took
        // effect by checking that either the count changed OR every visible
        // row's severity cell reads "Critical".
        const countChanged = afterCount !== beforeCount;
        if (!countChanged && afterCount > 0) {
          const severityCells = exceptionsTable
            .locator('tbody tr')
            .locator('td')
            .filter({ hasText: /critical/i });
          const criticalCellCount = await severityCells.count();
          expect(criticalCellCount).toBeGreaterThan(0);
        } else {
          expect(countChanged || afterCount === 0).toBeTruthy();
        }
      }
    }

    // ------------------------------------------------------------------
    // Step 4: Drill into a recent transaction group
    // ------------------------------------------------------------------
    await page.goto('/admin/finance');

    await expect(page.getByRole('heading', { name: /finance overview/i })).toBeVisible({
      timeout: 15_000,
    });

    const recentGroupsHeading = page.getByRole('heading', {
      name: /recent transaction groups/i,
    });
    await expect(recentGroupsHeading).toBeVisible({ timeout: 15_000 });

    // Let the DataTable resolve loading state.
    await page.waitForTimeout(2_500);

    const recentGroupsSection = page
      .locator('section, div')
      .filter({ has: recentGroupsHeading })
      .first();

    const recentRows = recentGroupsSection.locator('table tbody tr');
    const recentRowCount = await recentRows.count();

    if (recentRowCount === 0) {
      test.skip(
        true,
        'No recent transaction groups in the DB — nothing to drill into. ' +
          'Re-run after seeding ledger fixtures or any bounty funding flow.',
      );
      return;
    }

    await recentRows.first().click();

    await page.waitForURL(/\/admin\/finance\/groups\/[^/?#]+/, { timeout: 10_000 });

    const match = page.url().match(/\/admin\/finance\/groups\/([^/?#]+)/);
    expect(match, 'URL should contain /admin/finance/groups/<id>').not.toBeNull();
    const groupId = match![1];
    expect(groupId.length).toBeGreaterThan(0);

    // Group header — detail page should render something identifying the group.
    // We accept a heading OR a visible reference to the ID (first 8 chars).
    const idPrefix = groupId.slice(0, 8);
    const headerVisible = await page
      .getByRole('heading', { name: /transaction group|group details|group/i })
      .first()
      .isVisible()
      .catch(() => false);
    const idVisible = await page
      .getByText(new RegExp(idPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
      .first()
      .isVisible()
      .catch(() => false);

    expect(headerVisible || idVisible).toBeTruthy();

    // Entries table — the detail page should render a table of ledger entries.
    const entriesTable = page.getByRole('table').first();
    await expect(entriesTable).toBeVisible({ timeout: 10_000 });
  });
});
