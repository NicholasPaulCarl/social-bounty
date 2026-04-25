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

    // Email input and Continue button present (no password field in step 1)
    await expect(page.getByRole('button', { name: /continue|send code|request/i })).toBeVisible();
  });

  test('shows link to sign-up', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('shows OTP input after entering email and clicking Continue', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#email').fill('test@example.com');
    await page.getByRole('button', { name: /continue|send code|request/i }).click();

    // OTP input should appear
    const otpInput = page.locator('#otp, [data-testid="otp-input"], input[name="otp"]').first();
    await expect(otpInput).toBeVisible({ timeout: 10_000 });
  });

  test('shows error on invalid OTP', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#email').fill('invalid@example.com');
    await page.getByRole('button', { name: /continue|send code|request/i }).click();

    // Wait for OTP input
    const otpInput = page.locator('#otp, [data-testid="otp-input"], input[name="otp"]').first();
    await otpInput.waitFor({ state: 'visible', timeout: 10_000 });
    await otpInput.fill('999999');
    await page.getByRole('button', { name: /sign in|verify|submit/i }).click();

    // Error message should appear
    await expect(
      page.locator('.text-accent-rose, [class*="accent-rose"], [role="alert"]').first()
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

    // Email field present
    await expect(page.locator('input[type="email"], #email')).toBeVisible();
  });

  test('renders Email + SMS + Terms checkboxes, all unchecked by default', async ({ page }) => {
    await page.goto('/signup');

    const emailBox = page.locator('input#consentEmail');
    const smsBox = page.locator('input#consentSms');
    const termsBox = page.locator('input#termsAccepted');

    await expect(emailBox).toBeVisible();
    await expect(smsBox).toBeVisible();
    await expect(termsBox).toBeVisible();

    expect(await emailBox.isChecked()).toBe(false);
    expect(await smsBox.isChecked()).toBe(false);
    expect(await termsBox.isChecked()).toBe(false);
  });

  test('SMS opt-in shows the carrier-mandated disclosure text', async ({ page }) => {
    await page.goto('/signup');

    // Brevo / toll-free carrier require this exact disclosure to be visible
    // alongside the SMS opt-in checkbox.
    await expect(
      page.getByText(/Reply STOP to opt out/, { exact: false })
    ).toBeVisible();
    await expect(
      page.getByText(/will not be sold or shared with third parties/, {
        exact: false,
      })
    ).toBeVisible();
  });

  test('Continue button stays disabled until ToS box is ticked', async ({ page }) => {
    await page.goto('/signup');

    const cta = page.getByRole('button', { name: /continue/i });
    await expect(cta).toBeDisabled();

    await page.locator('input#termsAccepted').check();
    await expect(cta).toBeEnabled();
  });
});
