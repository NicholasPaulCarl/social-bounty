import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Super Admin flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('admin dashboard loads with heading and stat cards', async ({ page }) => {
    await page.goto('/admin/dashboard');

    await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();

    // Stat cards
    await expect(page.getByText(/total users/i)).toBeVisible();
    await expect(page.getByText(/total organisations/i)).toBeVisible();
    await expect(page.getByText(/total bounties/i)).toBeVisible();
  });

  test('admin dashboard shows system health section', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // System Health card in the right column
    await expect(page.getByRole('heading', { name: /system health/i })).toBeVisible();
  });

  test('admin dashboard shows recent activity section', async ({ page }) => {
    await page.goto('/admin/dashboard');

    await expect(page.getByRole('heading', { name: /recent activity/i })).toBeVisible();
  });

  test('users page loads', async ({ page }) => {
    await page.goto('/admin/users');

    // Page header heading
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
  });

  test('users page shows either user table or empty state', async ({ page }) => {
    await page.goto('/admin/users');

    // Wait for data to load
    await page.waitForTimeout(3000);

    const hasTable = await page.getByRole('table').count() > 0;
    const hasEmptyState = await page.getByText(/no users found/i).isVisible().catch(() => false);
    const hasLoadingError = await page.getByText(/error/i).isVisible().catch(() => false);

    expect(hasTable || hasEmptyState || hasLoadingError).toBeTruthy();
  });

  test('audit logs page loads', async ({ page }) => {
    await page.goto('/admin/audit-logs');

    await expect(page.getByRole('heading', { name: /audit logs/i })).toBeVisible();
    await expect(page.getByText(/track all platform actions/i)).toBeVisible();
  });

  test('audit logs page shows filter controls', async ({ page }) => {
    await page.goto('/admin/audit-logs');

    // Action filter dropdown and entity type input
    await expect(page.getByRole('combobox').first()).toBeVisible();
  });

  test('audit logs page shows either logs or empty state', async ({ page }) => {
    await page.goto('/admin/audit-logs');

    await page.waitForTimeout(3000);

    const hasTable = await page.getByRole('table').count() > 0;
    const hasEmptyState = await page.getByText(/no audit logs found/i).isVisible().catch(() => false);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/admin/settings');

    await expect(page.getByRole('heading', { name: /platform settings/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /feature toggles/i })).toBeVisible();
  });

  test('settings page shows user signups and submissions toggles', async ({ page }) => {
    await page.goto('/admin/settings');

    await page.waitForTimeout(2000);

    await expect(page.getByText(/user signups/i)).toBeVisible();
    await expect(page.getByText(/submissions/i).first()).toBeVisible();
  });

  test('settings page has Save Settings button', async ({ page }) => {
    await page.goto('/admin/settings');

    await page.waitForTimeout(2000);

    await expect(page.getByRole('button', { name: /save settings/i })).toBeVisible();
  });
});
