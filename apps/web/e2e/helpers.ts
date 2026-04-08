import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export type DemoRole = 'participant' | 'business' | 'admin';

const DEMO_CREDENTIALS: Record<DemoRole, { email: string }> = {
  participant: { email: 'participant@demo.com' },
  business:    { email: 'admin@demo.com' },
  admin:       { email: 'superadmin@demo.com' },
};

const POST_LOGIN_URL: Record<DemoRole, string> = {
  participant: '/bounties',
  business:    '/business/dashboard',
  admin:       '/admin/dashboard',
};

/**
 * Log in as a demo user via the OTP login flow.
 * Step 1: Enter email and click Continue to request OTP.
 * Step 2: Enter OTP code (demo accounts accept "000000" in test/dev mode).
 * After a successful login the browser will be on the role's default dashboard.
 */
export async function loginAs(page: Page, role: DemoRole): Promise<void> {
  const { email } = DEMO_CREDENTIALS[role];

  await page.goto('/login');

  // Step 1: Enter email
  const emailInput = page.locator('#email');
  await emailInput.waitFor({ state: 'visible' });
  await emailInput.fill(email);

  // Click Continue / Request OTP
  await page.getByRole('button', { name: /continue|send code|request/i }).click();

  // Step 2: Wait for OTP input to appear and fill it
  const otpInput = page.locator('#otp, [data-testid="otp-input"], input[name="otp"]').first();
  await otpInput.waitFor({ state: 'visible', timeout: 10_000 });
  await otpInput.fill('000000');

  // Submit OTP
  await page.getByRole('button', { name: /sign in|verify|submit/i }).click();

  // Wait for redirect to the expected post-login page
  await page.waitForURL(`**${POST_LOGIN_URL[role]}`, { timeout: 15_000 });
}

/**
 * Log out the currently-authenticated user.
 * Looks for a logout button/link in the nav.
 */
export async function logout(page: Page): Promise<void> {
  // The sidebar / nav typically has a sign-out button with an icon
  const logoutBtn = page.getByRole('button', { name: /sign out|log out|logout/i });
  await logoutBtn.click();
  await page.waitForURL('**/login', { timeout: 10_000 });
}
