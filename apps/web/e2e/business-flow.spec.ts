import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Business Admin flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'business');
  });

  test('business dashboard loads with heading and stat cards', async ({ page }) => {
    await page.goto('/business/dashboard');

    await expect(page.getByRole('heading', { name: /business dashboard/i })).toBeVisible();

    // Stat cards are rendered — check for at least one known label
    await expect(page.getByText(/total bounties/i)).toBeVisible();
    await expect(page.getByText(/active bounties/i)).toBeVisible();
  });

  test('business dashboard has Create Bounty action', async ({ page }) => {
    await page.goto('/business/dashboard');

    await expect(page.getByRole('button', { name: /create bounty/i })).toBeVisible();
  });

  test('bounty list page loads', async ({ page }) => {
    await page.goto('/business/bounties');

    await expect(page.getByRole('heading', { name: /bounties/i })).toBeVisible();

    // Tab menu (All / Draft / Live / Paused / Closed)
    await expect(page.getByRole('tab', { name: /all/i }).or(page.getByText(/all/i)).first()).toBeVisible();
  });

  test('bounty list page has Create Bounty button', async ({ page }) => {
    await page.goto('/business/bounties');

    await expect(page.getByRole('button', { name: /create bounty/i })).toBeVisible();
  });

  test('create bounty page loads', async ({ page }) => {
    await page.goto('/business/bounties/new');

    // The form should have a title/heading
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();

    // Title input should be present in the bounty form
    await expect(
      page.getByLabel(/title/i).or(page.locator('input[placeholder*="title" i]')).first()
    ).toBeVisible();
  });

  test('review center loads with heading', async ({ page }) => {
    await page.goto('/business/review-center');

    await expect(page.getByRole('heading', { name: /review center/i })).toBeVisible();
  });

  test('review center shows stat cards', async ({ page }) => {
    await page.goto('/business/review-center');

    // Stats section (Pending, In Review, etc.)
    await expect(page.getByText(/pending/i).first()).toBeVisible();
    await expect(page.getByText(/in review/i).first()).toBeVisible();
  });

  test('review center shows filter controls', async ({ page }) => {
    await page.goto('/business/review-center');

    // Filter by status dropdown should be visible
    await expect(page.getByRole('combobox').first()).toBeVisible();
  });

  test('review center shows either submissions table or empty state', async ({ page }) => {
    await page.goto('/business/review-center');

    // Wait for loading to resolve
    await page.waitForTimeout(3000);

    const hasTable = await page.getByRole('table').count() > 0;
    const hasEmptyState = await page.getByText(/no submissions to review/i).isVisible().catch(() => false);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });
});
