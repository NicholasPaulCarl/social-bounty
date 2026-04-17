import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

/**
 * Smoke Test 1 — Super Admin: Finance overview + Kill Switch dialog opens
 *
 * Tags: @smoke
 *
 * Prereqs (see apps/web/e2e/README.md):
 *   - API running on :3001, web running on :3000
 *   - Demo seed has superadmin@demo.com
 *   - Redis running (OTP login in dev/test mode accepts "000000")
 *
 * Does NOT actually toggle the Kill Switch — cancels after validating the dialog.
 */
test.describe('@smoke Super Admin — Finance Overview + Kill Switch dialog', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('finance overview renders balances and Kill Switch card', async ({ page }) => {
    await page.goto('/admin/finance');

    // Page header
    await expect(page.getByRole('heading', { name: /finance overview/i })).toBeVisible({ timeout: 15_000 });

    // Kill Switch card is present with the activate CTA
    await expect(page.getByText(/kill switch/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /activate kill switch/i })).toBeVisible();

    // Balances table renders. DataTable is semantically a <table>.
    // There are two tables on this page (balances + recent groups) — either/both is fine for smoke.
    const tableCount = await page.getByRole('table').count();
    expect(tableCount).toBeGreaterThan(0);
  });

  test('ACTIVATE Kill Switch opens a dialog and Cancel closes it without toggling', async ({ page }) => {
    await page.goto('/admin/finance');

    await page.getByRole('button', { name: /activate kill switch/i }).click();

    // Dialog should appear. Depending on current state, its accessible name reads
    // "Activate Kill Switch" (default) or "Deactivate Kill Switch" (if already active).
    // PrimeReact's Dialog exposes the title via role="dialog" + aria-labelledby rather
    // than via a semantic <h*>, so we match on the dialog's accessible name.
    const dialogHeading = page.getByRole('dialog', { name: /activate kill switch|deactivate kill switch/i });
    await expect(dialogHeading).toBeVisible({ timeout: 5_000 });

    // Reason textarea is visible
    const reasonInput = page.getByPlaceholder(/reason \(min 10 chars\)/i);
    await expect(reasonInput).toBeVisible();

    // NOTE: The current FinanceOverviewPage implementation does NOT disable the
    // ACTIVATE button based on reason length — it validates on click and toasts
    // an error if <10 chars. We therefore just validate the dialog UX (reason
    // field is there, Cancel closes without calling the API). If/when the
    // button-disabled behaviour is added, uncomment the assertion below:
    //
    //   const activateBtn = page.getByRole('button', { name: /^activate$/i });
    //   await expect(activateBtn).toBeDisabled();
    //   await reasonInput.fill('Ten characters minimum reason.');
    //   await expect(activateBtn).toBeEnabled();

    // Type a valid reason (for realism; we still won't click ACTIVATE).
    await reasonInput.fill('Smoke test — confirming dialog UX only.');

    // Cancel closes the dialog.
    await page.getByRole('button', { name: /^cancel$/i }).click();
    await expect(dialogHeading).toBeHidden({ timeout: 5_000 });

    // Confirm the Kill Switch was NOT activated — the banner should NOT appear.
    // (If it was already active before we started, the banner is unrelated.)
    // We just assert the page is still usable.
    await expect(page.getByRole('heading', { name: /finance overview/i })).toBeVisible();
  });
});
