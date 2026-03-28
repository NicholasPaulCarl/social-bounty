import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers';

test.describe('Auth — login page', () => {
  test('login page loads with dark theme and glass card', async ({ page }) => {
    await page.goto('/login');

    // Page title / branding visible
    await expect(page.getByRole('heading', { name: 'Social Bounty' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    // Glass card is present (rendered via .glass-card class, contains the form)
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();

    // Dark theme: html element has data-theme="dark"
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    // Password toggle and sign-in button present
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows links to sign-up and forgot password', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /forgot your password/i })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#email').fill('invalid@example.com');
    await page.locator('#password input').first().fill('WrongPassword!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Error message should appear (the div with accent-rose styling or PrimeReact Message)
    await expect(
      page.locator('.text-accent-rose, [class*="accent-rose"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('login as demo participant redirects to bounties', async ({ page }) => {
    await loginAs(page, 'participant');
    await expect(page).toHaveURL(/\/bounties/);
  });

  test('login as demo business admin redirects to business dashboard', async ({ page }) => {
    await loginAs(page, 'business');
    await expect(page).toHaveURL(/\/business\/dashboard/);
  });

  test('login as demo super admin redirects to admin dashboard', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('logout returns to login page', async ({ page }) => {
    await loginAs(page, 'participant');
    await expect(page).toHaveURL(/\/bounties/);

    // Open user menu in sidebar footer and click Logout
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /logout/i }).click();

    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Auth — signup page', () => {
  test('signup page loads', async ({ page }) => {
    await page.goto('/signup');

    // Should show signup / create account heading
    await expect(
      page.getByRole('heading', { name: /sign up|create account|join/i })
    ).toBeVisible();

    // Email and password fields present
    await expect(page.locator('input[type="email"], #email')).toBeVisible();
  });
});
