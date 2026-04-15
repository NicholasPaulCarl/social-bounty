import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { execSync } from 'child_process';

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
 * Seed an OTP directly into the API's Redis store so the login form's
 * verify-otp step will accept a known code. The API stores OTPs at
 * `otp:<email>` as `{ email, otp, attempts }` (see
 * apps/api/src/modules/auth/token-store.service.ts).
 *
 * We bypass the UI's "Request OTP" call entirely because `/auth/request-otp`
 * is throttled at 5/min per-IP (NestJS in-memory ThrottlerGuard). Running 4+
 * smoke specs back-to-back (plus retries) easily exceeds that. Seeding Redis
 * directly keeps us under the verify-otp 10/min ceiling which is plenty.
 */
function seedOtpInRedis(email: string, otp: string): void {
  const payload = JSON.stringify({ email, otp, attempts: 0 });
  // 5-minute TTL matches OTP_TTL_SECONDS in token-store.service.ts.
  execSync(`redis-cli SET "otp:${email}" '${payload}' EX 300`, { stdio: 'ignore' });
  // Also clear any stale cooldown so nothing else interferes.
  execSync(`redis-cli DEL "otp_cooldown:${email}"`, { stdio: 'ignore' });
}

/**
 * Convenience: fixed OTP value used for all e2e logins. The real value is
 * whatever we seed into Redis just before the verify step.
 */
const E2E_OTP = '424242';

/**
 * Log in as a demo user via the OTP login flow.
 *
 * Step 1: Enter email and click Continue — the API generates a random 6-digit
 *         OTP and stores it in Redis at `otp:<email>`.
 * Step 2: Read the OTP from Redis (via `redis-cli`) and submit it.
 *
 * After a successful login the browser will be on the role's default dashboard.
 */
export async function loginAs(page: Page, role: DemoRole): Promise<void> {
  const { email } = DEMO_CREDENTIALS[role];

  // Seed the OTP in Redis ourselves so the verify step will succeed with a
  // known code, independent of whatever random code the request-otp path
  // would have generated.
  seedOtpInRedis(email, E2E_OTP);

  // Intercept the request-otp API call and stub a 200 OK. This avoids the
  // 5/min-per-IP throttle that otherwise flakes multi-spec smoke runs.
  await page.route('**/api/v1/auth/request-otp', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'If an account with that email exists, a verification code has been sent.',
      }),
    }),
  );

  await page.goto('/login');

  // Step 1: Enter email
  const emailInput = page.locator('#email');
  await emailInput.waitFor({ state: 'visible' });
  await emailInput.fill(email);

  // Click Continue / Request OTP (stubbed to always succeed).
  await page.getByRole('button', { name: /continue|send code|request/i }).click();

  // Step 2: Wait for OTP input to appear, then submit the OTP we pre-seeded.
  const otpInput = page.locator('#otp, [data-testid="otp-input"], input[name="otp"]').first();
  await otpInput.waitFor({ state: 'visible', timeout: 10_000 });
  await otpInput.fill(E2E_OTP);

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
