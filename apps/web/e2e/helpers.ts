import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export type DemoRole = 'participant' | 'business' | 'admin';

const DEMO_CREDENTIALS: Record<DemoRole, { email: string; password: string }> = {
  participant: { email: 'participant@demo.com', password: 'DemoPassword123!' },
  business:    { email: 'admin@demo.com',       password: 'DemoPassword123!' },
  admin:       { email: 'superadmin@demo.com',  password: 'DemoPassword123!' },
};

const POST_LOGIN_URL: Record<DemoRole, string> = {
  participant: '/bounties',
  business:    '/business/dashboard',
  admin:       '/admin/dashboard',
};

/**
 * Log in as a demo user via the login form.
 * After a successful login the browser will be on the role's default dashboard.
 */
export async function loginAs(page: Page, role: DemoRole): Promise<void> {
  const { email, password } = DEMO_CREDENTIALS[role];

  await page.goto('/login');

  // Fill the email field (PrimeReact InputText renders a plain <input>)
  const emailInput = page.locator('#email');
  await emailInput.waitFor({ state: 'visible' });
  await emailInput.fill(email);

  // Fill the password field (PrimeReact Password renders a nested <input>)
  const passwordInput = page.locator('#password input').first();
  await passwordInput.fill(password);

  // Submit the form
  await page.getByRole('button', { name: /sign in/i }).click();

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
